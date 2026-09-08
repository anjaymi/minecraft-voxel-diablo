import { Enemy, Player, Projectile, DungeonFloor, Particle } from '../types';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';

export interface TacticalContext {
  enemy: Enemy;
  player: Player;
  projectiles: Projectile[];
  dt: number;
  floor: DungeonFloor;
  isWalkable: (x: number, y: number) => boolean;
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number, isCrit?: boolean) => void;
  spawnParticle: (particle: Particle) => void;
}

/**
 * Line of sight check between two points using raymarching.
 */
export function hasLineOfSight(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  isWalkable: (x: number, y: number) => boolean,
  stepSize = 0.4
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.05) return true;

  const steps = Math.ceil(dist / stepSize);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (!isWalkable(px, py)) {
      return false;
    }
  }
  return true;
}

/**
 * Intelligent Combat Tactical Adaptation:
 * 1. Detects player ranged threat (aiming bow, shooting projectiles, ranged stance).
 * 2. Charger/Melee mobs execute oblique 'Evasive Dash' to close distance while dodging arrows.
 * 3. Ranged mobs execute 'Seek Cover' logic to break line-of-sight behind walls/pillars, then peek & fire.
 */
export class TacticalAdaptationSystem {
  /**
   * Check if the player is actively threatening with ranged attacks.
   */
  public isPlayerUsingRanged(player: Player, projectiles: Projectile[]): boolean {
    if (player.isBowAiming || (player.bowDrawProgress && player.bowDrawProgress > 0)) {
      return true;
    }
    if (player.aimingMode === 'bow' || player.aimingMode === 'tnt') {
      return true;
    }
    // Check if player has active flying projectiles towards enemies
    const hasActiveArrow = projectiles.some(
      (p) => p.isPlayer && (p.type === 'arrow' || p.type === 'tnt' || p.type === 'fireball') && p.timer > 0.1
    );
    if (hasActiveArrow) {
      return true;
    }
    // Recent ranged attack within last 2.2 seconds
    if (player.lastRangedTime && Date.now() - player.lastRangedTime < 2200) {
      return true;
    }

    return false;
  }

  /**
   * Executes tactical response based on enemy archetype (charger vs ranged).
   * Returns true if a special tactical maneuver was active or executed.
   */
  public tickTacticalBehavior(ctx: TacticalContext): boolean {
    const { enemy, player, projectiles, dt, isWalkable, addFloatingText } = ctx;
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    // Cooldown timers
    if (enemy.evasiveDashCooldown && enemy.evasiveDashCooldown > 0) {
      enemy.evasiveDashCooldown -= dt;
    }
    if (enemy.coverCooldown && enemy.coverCooldown > 0) {
      enemy.coverCooldown -= dt;
    }

    // 1. ACTIVE EVASIVE DASH MANEUVER IN PROGRESS
    if (enemy.state === 'evasive_dash') {
      enemy.evasiveDashTimer = (enemy.evasiveDashTimer || 0) - dt;
      if (enemy.evasiveDashTimer <= 0) {
        enemy.state = 'chase';
        enemy.animState = 'walk';
      } else {
        // High-velocity dash with shadow ghost trails
        if (Math.random() < 0.45) {
          vfxSystem.spawnDashDust(enemy.x, enemy.y, enemy.facingAngle, '#facc15');
        }
        return true;
      }
    }

    // 2. ACTIVE COVER MANEUVER IN PROGRESS
    if (enemy.state === 'seeking_cover') {
      if (!enemy.coverTargetX || !enemy.coverTargetY) {
        enemy.state = 'chase';
      } else {
        const cdx = enemy.coverTargetX - enemy.x;
        const cdy = enemy.coverTargetY - enemy.y;
        const cDist = Math.hypot(cdx, cdy);

        if (cDist <= 0.45) {
          // Reached cover! Duck behind obstacle
          enemy.state = 'in_cover';
          enemy.inCoverTimer = 1.0 + Math.random() * 0.8;
          enemy.vx = 0;
          enemy.vy = 0;
          enemy.animState = 'idle';
          addFloatingText(enemy.x, enemy.y - 0.35, '🛡️ 掩体隐蔽中!', '#38bdf8', 12);
        } else {
          // Sprint to cover point
          const speed = enemy.speed * 1.3;
          enemy.vx += (cdx / cDist) * speed * dt * 5.0;
          enemy.vy += (cdy / cDist) * speed * dt * 5.0;
          enemy.facingAngle = Math.atan2(cdy, cdx);
          enemy.animState = 'walk';
        }
        return true;
      }
    }

    if (enemy.state === 'in_cover') {
      enemy.inCoverTimer = (enemy.inCoverTimer || 0) - dt;
      enemy.vx *= 0.5;
      enemy.vy *= 0.5;

      // If player approaches too close (< 3.0 tiles), cover is compromised!
      if (dist < 3.0) {
        enemy.state = 'chase';
        addFloatingText(enemy.x, enemy.y - 0.35, '⚠️ 掩体被突破!', '#ef4444', 12);
        return false;
      }

      if (enemy.inCoverTimer <= 0) {
        // Peek out to attack!
        enemy.state = 'chase';
        enemy.coverCooldown = 5.0; // Cooldown before next seek cover
        addFloatingText(enemy.x, enemy.y - 0.35, '🏹 探头射击!', '#facc15', 12);
      }
      return true;
    }

    // Check if player is presenting ranged threat
    const playerRanged = this.isPlayerUsingRanged(player, projectiles);
    if (!playerRanged) return false;

    // =========================================================================
    // A. CHARGER MOBS -> '闪避冲刺' (EVASIVE ZIG-ZAG DASH)
    // =========================================================================
    const isCharger =
      enemy.type === 'piglin_brute' ||
      enemy.type === 'spider' ||
      enemy.type === 'baby_zombie' ||
      enemy.type === 'armored_zombie' ||
      (enemy.isElite && enemy.affixes.includes('急速'));

    if (isCharger && dist >= 2.5 && dist <= 9.5 && (enemy.evasiveDashCooldown || 0) <= 0) {
      this.executeEvasiveDash(enemy, player, addFloatingText);
      return true;
    }

    // =========================================================================
    // B. RANGED MOBS -> '找掩体' (SEEK COVER BEHIND WALLS/OBSTACLES)
    // =========================================================================
    const isRanged =
      enemy.type === 'skeleton' ||
      enemy.type === 'witch' ||
      enemy.type === 'blaze' ||
      enemy.type === 'goblin' ||
      enemy.type === 'drowned';

    if (isRanged && (enemy.coverCooldown || 0) <= 0 && dist >= 3.2 && dist <= 14.0) {
      // If monster is directly exposed to player's line of sight, find nearest cover
      if (hasLineOfSight(enemy.x, enemy.y, player.x, player.y, isWalkable)) {
        const coverPoint = this.findBestCoverPosition(enemy, player, ctx.floor, isWalkable);
        if (coverPoint) {
          enemy.coverTargetX = coverPoint.x;
          enemy.coverTargetY = coverPoint.y;
          enemy.state = 'seeking_cover';
          enemy.coverCooldown = 6.0;
          soundManager.playGoblinRoll?.();
          addFloatingText(enemy.x, enemy.y - 0.4, '🧱 寻找掩体!', '#60a5fa', 13, true);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Charger executes an angled zig-zag evasive charge to close distance without walking straight into arrows.
   */
  private executeEvasiveDash(
    enemy: Enemy,
    player: Player,
    addFloatingText: (x: number, y: number, text: string, color: string, size?: number, isCrit?: boolean) => void
  ): void {
    const directAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
    // Alternate left / right flank zig-zag angle (~38 degrees off-axis)
    const angleOffset = Math.random() < 0.5 ? 0.65 : -0.65;
    const evasiveAngle = directAngle + angleOffset;

    const burstSpeed = enemy.speed * 2.8;
    enemy.state = 'evasive_dash';
    enemy.evasiveDashTimer = 0.32;
    enemy.evasiveDashCooldown = 3.6 + Math.random() * 1.5;
    enemy.vx = Math.cos(evasiveAngle) * burstSpeed;
    enemy.vy = Math.sin(evasiveAngle) * burstSpeed;
    enemy.facingAngle = directAngle;

    soundManager.playDashCharge();
    vfxSystem.spawnDashDust(enemy.x, enemy.y, evasiveAngle, '#facc15');
    addFloatingText(enemy.x, enemy.y - 0.35, '⚡ 闪避冲刺!', '#fbbf24', 13, true);
  }

  /**
   * Searches a 7x7 grid around the monster for a walkable tile that breaks line-of-sight from the player.
   */
  private findBestCoverPosition(
    enemy: Enemy,
    player: Player,
    floor: DungeonFloor,
    isWalkable: (x: number, y: number) => boolean
  ): { x: number; y: number } | null {
    const curTx = Math.floor(enemy.x + 0.5);
    const curTy = Math.floor(enemy.y + 0.5);

    let bestPoint: { x: number; y: number } | null = null;
    let bestScore = -Infinity;

    // Scan candidate tiles in range 1..4 tiles
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const tx = curTx + dx;
        const ty = curTy + dy;

        if (tx < 1 || tx >= floor.width - 1 || ty < 1 || ty >= floor.height - 1) continue;
        if (!isWalkable(tx + 0.5, ty + 0.5)) continue;

        // Must be adjacent to an obstacle tile to act as real cover (e.g. wall, pillar, barrel)
        const hasAdjacentObstacle =
          !isWalkable(tx + 1.5, ty + 0.5) ||
          !isWalkable(tx - 0.5, ty + 0.5) ||
          !isWalkable(tx + 0.5, ty + 1.5) ||
          !isWalkable(tx + 0.5, ty - 0.5);

        if (!hasAdjacentObstacle) continue;

        const worldX = tx + 0.5;
        const worldY = ty + 0.5;

        // Cover requirement: Line of Sight to player MUST be blocked!
        if (!hasLineOfSight(worldX, worldY, player.x, player.y, isWalkable)) {
          const distToEnemy = Math.hypot(worldX - enemy.x, worldY - enemy.y);
          const distToPlayer = Math.hypot(worldX - player.x, worldY - player.y);

          // Score: close to enemy, safe distance from player (not flanking into player's face)
          const score = 10 - distToEnemy + Math.min(distToPlayer, 6);
          if (score > bestScore) {
            bestScore = score;
            bestPoint = { x: worldX, y: worldY };
          }
        }
      }
    }

    return bestPoint;
  }
}

export const tacticalAdaptationSystem = new TacticalAdaptationSystem();
