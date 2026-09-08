import { Player, SummonedMinion, Enemy } from '../types';

/**
 * MinionAI
 * Handles minion target locking, wall avoidance / path steering,
 * formation escort around the player, and tether leaping.
 */
export class MinionAI {
  /**
   * Acquire or maintain a target enemy for the minion
   */
  public static acquireOrRetainTarget(
    minion: SummonedMinion,
    player: Player,
    enemies: Enemy[]
  ): Enemy | null {
    // 1. Check existing locked target
    if (minion.targetId) {
      const existing = enemies.find((e) => e.id === minion.targetId && e.hp > 0);
      if (existing) {
        const distToMinion = Math.hypot(existing.x - minion.x, existing.y - minion.y);
        const distToPlayer = Math.hypot(existing.x - player.x, existing.y - player.y);
        // Retain if within combat tether
        if (distToMinion <= 11 && distToPlayer <= 15) {
          return existing;
        }
      }
      minion.targetId = null;
    }

    // 2. Search for nearest living enemy
    let bestTarget: Enemy | null = null;
    let closestDist = 9.5; // Aggro acquisition radius

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const distMinion = Math.hypot(enemy.x - minion.x, enemy.y - minion.y);
      const distPlayer = Math.hypot(enemy.x - player.x, enemy.y - player.y);

      // Leash constraint: don't chase enemies infinitely far from player
      if (distPlayer > 14) continue;

      if (distMinion < closestDist) {
        closestDist = distMinion;
        bestTarget = enemy;
      }
    }

    if (bestTarget) {
      minion.targetId = bestTarget.id;
    }

    return bestTarget;
  }

  /**
   * Compute escort formation offset position around player when idle
   */
  public static computeEscortPosition(
    player: Player,
    index: number,
    total: number,
    gameTime: number = 0
  ): { x: number; y: number } {
    const orbitDist = 1.6 + (index % 2) * 0.4;
    const baseAngle = ((index * 2 * Math.PI) / Math.max(1, total)) + (gameTime * 0.3);
    const offsetX = Math.cos(baseAngle) * orbitDist;
    const offsetY = Math.sin(baseAngle) * orbitDist;

    return {
      x: player.x + offsetX,
      y: player.y + offsetY,
    };
  }

  /**
   * Move minion towards (targetX, targetY) with obstacle avoidance and minion separation
   */
  public static stepMovement(
    minion: SummonedMinion,
    targetX: number,
    targetY: number,
    stopDistance: number,
    isWalkable: (x: number, y: number) => boolean,
    dt: number,
    allMinions: SummonedMinion[] = []
  ): void {
    const dx = targetX - minion.x;
    const dy = targetY - minion.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= stopDistance) {
      return;
    }

    // Desired base velocity
    let vx = (dx / dist) * minion.speed;
    let vy = (dy / dist) * minion.speed;

    // Minion separation force (boids repulsion so minions do not overlap)
    for (const other of allMinions) {
      if (other.id === minion.id) continue;
      const sepX = minion.x - other.x;
      const sepY = minion.y - other.y;
      const sepDist = Math.hypot(sepX, sepY);
      if (sepDist > 0.01 && sepDist < 0.75) {
        const repulseStrength = (0.75 - sepDist) * 2.5;
        vx += (sepX / sepDist) * repulseStrength;
        vy += (sepY / sepDist) * repulseStrength;
      }
    }

    // Normalize velocity to max speed
    const currentSpeed = Math.hypot(vx, vy);
    if (currentSpeed > 0.01) {
      const clampedSpeed = Math.min(currentSpeed, minion.speed);
      vx = (vx / currentSpeed) * clampedSpeed;
      vy = (vy / currentSpeed) * clampedSpeed;
    }

    const stepDist = minion.speed * dt;
    const stepX = vx * dt;
    const stepY = vy * dt;

    // Direct movement check
    if (isWalkable(minion.x + stepX, minion.y + stepY)) {
      minion.x += stepX;
      minion.y += stepY;
      return;
    }

    // Obstacle avoidance: try sliding along X or Y
    if (Math.abs(stepX) > 0.001 && isWalkable(minion.x + stepX, minion.y)) {
      minion.x += stepX;
      return;
    }
    if (Math.abs(stepY) > 0.001 && isWalkable(minion.x, minion.y + stepY)) {
      minion.y += stepY;
      return;
    }

    // Angled feelers: try ±45° and ±90° deviations
    const baseAngle = Math.atan2(vy, vx);
    const testAngles = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];

    for (const offset of testAngles) {
      const angle = baseAngle + offset;
      const probeX = Math.cos(angle) * stepDist;
      const probeY = Math.sin(angle) * stepDist;
      if (isWalkable(minion.x + probeX, minion.y + probeY)) {
        minion.x += probeX;
        minion.y += probeY;
        return;
      }
    }
  }

  /**
   * Leash recall: if minion is stuck behind wall or too far from master (> 12 tiles),
   * teleport to a safe walkable spot near the player
   */
  public static checkLeashRecall(
    minion: SummonedMinion,
    player: Player,
    isWalkable: (x: number, y: number) => boolean,
    onRecall?: (minion: SummonedMinion) => void
  ): boolean {
    const distToPlayer = Math.hypot(player.x - minion.x, player.y - minion.y);
    if (distToPlayer > 12.5) {
      // Find walkable tile near player
      for (let r = 1.0; r <= 2.5; r += 0.5) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          const tx = player.x + Math.cos(a) * r;
          const ty = player.y + Math.sin(a) * r;
          if (isWalkable(tx, ty)) {
            minion.x = tx;
            minion.y = ty;
            minion.targetId = null;
            if (onRecall) onRecall(minion);
            return true;
          }
        }
      }
    }
    return false;
  }
}
