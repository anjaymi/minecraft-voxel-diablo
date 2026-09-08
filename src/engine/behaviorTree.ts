import { Enemy, Player, Projectile } from '../types';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';
import { tickArmoredZombie, tickGoblin, tickBabyZombie } from './advancedEnemyBehaviors';

export type NodeStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING';

export interface BTContext {
  enemy: Enemy;
  player: Player;
  dt: number;
  floorWidth: number;
  floorHeight: number;
  isWalkable: (x: number, y: number) => boolean;
  projectiles: Projectile[];
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number, isCrit?: boolean) => void;
  damagePlayer: (amount: number, sourceName: string) => void;
  spawnMinion: (enemy: Enemy, minionType?: string) => void;
  triggerExplosion: (enemy: Enemy) => void;
  allies: Enemy[];
  squadState: {
    allyCount: number;
    hasFrontline: boolean;
    isPlayerDistracted: boolean;
    tacticalObjective: 'encircle' | 'focus_fire' | 'covering_fire' | 'ambush';
    assignedFlankAngle: number;
  };
}

/** Base Node for Behavior Tree */
export abstract class BTNode {
  public abstract tick(ctx: BTContext): NodeStatus;
}

/** Composite: Selector (Fallback) - Ticks children until one returns SUCCESS or RUNNING */
export class SelectorNode extends BTNode {
  constructor(protected children: BTNode[]) {
    super();
  }

  public tick(ctx: BTContext): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(ctx);
      if (status !== 'FAILURE') {
        return status;
      }
    }
    return 'FAILURE';
  }
}

/** Composite: Sequence - Ticks children until one returns FAILURE or RUNNING */
export class SequenceNode extends BTNode {
  constructor(protected children: BTNode[]) {
    super();
  }

  public tick(ctx: BTContext): NodeStatus {
    for (const child of this.children) {
      const status = child.tick(ctx);
      if (status !== 'SUCCESS') {
        return status;
      }
    }
    return 'SUCCESS';
  }
}

/** Decorator: Inverter - Inverts SUCCESS <-> FAILURE */
export class InverterNode extends BTNode {
  constructor(private child: BTNode) {
    super();
  }

  public tick(ctx: BTContext): NodeStatus {
    const status = this.child.tick(ctx);
    if (status === 'SUCCESS') return 'FAILURE';
    if (status === 'FAILURE') return 'SUCCESS';
    return status;
  }
}

/** Condition Node */
export class ConditionNode extends BTNode {
  constructor(private predicate: (ctx: BTContext) => boolean) {
    super();
  }

  public tick(ctx: BTContext): NodeStatus {
    return this.predicate(ctx) ? 'SUCCESS' : 'FAILURE';
  }
}

/** Action Leaf Node */
export class ActionNode extends BTNode {
  constructor(private action: (ctx: BTContext) => NodeStatus) {
    super();
  }

  public tick(ctx: BTContext): NodeStatus {
    return this.action(ctx);
  }
}

// ==========================================
// Reusable Tactical Behavior Tree Leaf Actions
// ==========================================

/** Obstacle-aware smooth navigation towards target coordinates */
export function moveTowards(
  enemy: Enemy,
  targetX: number,
  targetY: number,
  speed: number,
  dt: number,
  isWalkable: (x: number, y: number) => boolean,
  er: number = 0.35
) {
  const dx = targetX - enemy.x;
  const dy = targetY - enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.05) return;

  const nx = dx / dist;
  const ny = dy / dist;

  // Direct move acceleration
  let ax = nx * speed * dt * 4.2;
  let ay = ny * speed * dt * 4.2;

  // Simple obstacle raycast avoidance
  const probeX = enemy.x + Math.sign(nx) * (er + 0.3);
  const probeY = enemy.y + Math.sign(ny) * (er + 0.3);

  if (!isWalkable(probeX, enemy.y)) {
    ax = 0;
    ay += (ny >= 0 ? 1 : -1) * speed * dt * 3.5;
  }
  if (!isWalkable(enemy.x, probeY)) {
    ay = 0;
    ax += (nx >= 0 ? 1 : -1) * speed * dt * 3.5;
  }

  enemy.vx += ax;
  enemy.vy += ay;
  enemy.facingAngle = Math.atan2(dy, dx);
}

/** Idle / Wander Patrol Action */
export const createWanderAction = () =>
  new ActionNode((ctx) => {
    const { enemy, dt, isWalkable, floorWidth, floorHeight } = ctx;
    enemy.state = 'wander';
    enemy.wanderTimer = (enemy.wanderTimer || 0) - dt;

    if (enemy.wanderTimer <= 0 || enemy.wanderTargetX === undefined) {
      enemy.wanderTimer = 1.8 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      const wanderDist = 1.5 + Math.random() * 2.5;
      const candX = Math.max(1, Math.min(floorWidth - 2, enemy.x + Math.cos(angle) * wanderDist));
      const candY = Math.max(1, Math.min(floorHeight - 2, enemy.y + Math.sin(angle) * wanderDist));
      if (isWalkable(candX, candY)) {
        enemy.wanderTargetX = candX;
        enemy.wanderTargetY = candY;
      }
    }

    if (enemy.wanderTargetX !== undefined && enemy.wanderTargetY !== undefined) {
      moveTowards(enemy, enemy.wanderTargetX, enemy.wanderTargetY, enemy.speed * 0.45, dt, isWalkable, enemy.size * 0.3);
    }
    return 'SUCCESS';
  });

/** Chase Target Action with Squad Tactics (Encirclement vs Focus Fire) */
export const createSquadCoordinatedChaseAction = (baseSpeedMultiplier: number = 1.0) =>
  new ActionNode((ctx) => {
    const { enemy, player, dt, isWalkable, squadState, addFloatingText } = ctx;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    // 1. Tactical Objective: Focus Fire (集火突击)
    if (squadState.tacticalObjective === 'focus_fire') {
      if (enemy.tacticalMode !== 'focus_fire') {
        enemy.tacticalMode = 'focus_fire';
        addFloatingText(enemy.x, enemy.y - 0.4, '⚡ 全员集火!', '#ef4444', 13);
      }
      enemy.state = 'chase';
      moveTowards(enemy, player.x, player.y, enemy.speed * (baseSpeedMultiplier * 1.3), dt, isWalkable, enemy.size * 0.35);
      return 'SUCCESS';
    }

    // 2. Tactical Objective: Tactical Encirclement (战术包围圈)
    if (squadState.tacticalObjective === 'encircle' && squadState.allyCount >= 2) {
      enemy.tacticalMode = 'encircle';
      const radius = enemy.range > 3 ? 5.5 : 2.2;
      const targetX = player.x + Math.cos(squadState.assignedFlankAngle) * radius;
      const targetY = player.y + Math.sin(squadState.assignedFlankAngle) * radius;
      enemy.state = 'chase';
      moveTowards(enemy, targetX, targetY, enemy.speed * (baseSpeedMultiplier * 1.1), dt, isWalkable, enemy.size * 0.35);
      return 'SUCCESS';
    }

    // 3. Solitary / Normal Chase
    enemy.tacticalMode = 'chase';
    enemy.state = 'chase';
    moveTowards(enemy, player.x, player.y, enemy.speed * baseSpeedMultiplier, dt, isWalkable, enemy.size * 0.35);
    return 'SUCCESS';
  });

/** Legacy Chase for compatibility */
export const createChaseAction = (speedMultiplier: number = 1.0) =>
  createSquadCoordinatedChaseAction(speedMultiplier);

/** Kite / Retreat Action (Maintains optimal distance for ranged enemies) */
export const createKiteRetreatAction = (minDistance: number, maxDistance: number) =>
  new ActionNode((ctx) => {
    const { enemy, player, dt, isWalkable, squadState } = ctx;
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const dist = Math.hypot(dx, dy);

    enemy.facingAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);

    // If a friendly frontline is engaging player, skeleton can stand firm and provide covering fire
    if (squadState.hasFrontline && dist >= minDistance * 0.8 && dist <= maxDistance) {
      enemy.state = 'ranged_alert';
      return 'SUCCESS';
    }

    if (dist < minDistance) {
      // Too close! Back away rapidly
      enemy.state = 'retreat';
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      enemy.vx += nx * enemy.speed * dt * 4.2;
      enemy.vy += ny * enemy.speed * dt * 4.2;
      return 'RUNNING';
    } else if (dist > maxDistance) {
      // Too far, approach
      enemy.state = 'chase';
      const nx = -dx / (dist || 1);
      const ny = -dy / (dist || 1);
      enemy.vx += nx * enemy.speed * dt * 3.6;
      enemy.vy += ny * enemy.speed * dt * 3.6;
      return 'RUNNING';
    } else {
      // In sweet spot! Strafe laterally in an arc
      enemy.state = 'ranged_alert';
      enemy.strafeTimer = (enemy.strafeTimer || 0) - dt;
      if (enemy.strafeTimer <= 0) {
        enemy.strafeTimer = 1.2 + Math.random() * 1.5;
        enemy.strafeDir = (enemy.strafeDir || 1) * -1;
      }
      // Tangent vector
      const tx = -(player.y - enemy.y) / (dist || 1);
      const ty = (player.x - enemy.x) / (dist || 1);
      enemy.vx += tx * (enemy.strafeDir || 1) * enemy.speed * dt * 3.0;
      enemy.vy += ty * (enemy.strafeDir || 1) * enemy.speed * dt * 3.0;
      return 'SUCCESS';
    }
  });

/** Windup & Melee Strike Action */
export const createMeleeWindupAction = (windupTime: number) =>
  new ActionNode((ctx) => {
    const { enemy, player, dt, damagePlayer, addFloatingText } = ctx;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy);

    enemy.facingAngle = Math.atan2(dy, dx);

    if (enemy.state !== 'windup' && enemy.attackTimer >= enemy.attackCooldown) {
      enemy.state = 'windup';
      enemy.windupTimer = windupTime;
      enemy.windupMax = windupTime;
      return 'RUNNING';
    }

    if (enemy.state === 'windup') {
      enemy.windupTimer = (enemy.windupTimer || 0) - dt;
      // Slight lunge during windup
      enemy.vx *= 0.5;
      enemy.vy *= 0.5;

      if ((enemy.windupTimer || 0) <= 0) {
        // Strike!
        enemy.state = 'attack';
        enemy.attackTimer = 0;
        enemy.attackAnimProgress = 1.0;

        if (dist <= enemy.range + 0.4) {
          damagePlayer(enemy.damage, enemy.name);
          soundManager.playZombieGroan?.();
          addFloatingText(player.x, player.y - 0.5, '💥 扑击重创!', '#ef4444', 14);
        }
        return 'SUCCESS';
      }
      return 'RUNNING';
    }

    return 'FAILURE';
  });

// ==========================================
// Monster-Specific Behavior Trees
// ==========================================

export class BehaviorTreeManager {
  private trees: Map<string, BTNode> = new Map();

  constructor() {
    this.initTrees();
  }

  private initTrees() {
    // 1. Zombie Behavior Tree
    this.trees.set(
      'zombie',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 15),
          new SelectorNode([
            new SequenceNode([
              new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= ctx.enemy.range),
              createMeleeWindupAction(0.35),
            ]),
            createChaseAction(1.0),
          ]),
        ]),
        createWanderAction(),
      ])
    );

    // 2. Skeleton Behavior Tree
    this.trees.set(
      'skeleton',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 16),
          createKiteRetreatAction(3.5, 7.5),
          new ActionNode((ctx) => {
            const { enemy, player, dt, projectiles } = ctx;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            enemy.attackTimer += dt;
            if (dist <= 8.5 && enemy.attackTimer >= enemy.attackCooldown) {
              enemy.attackTimer = 0;
              enemy.state = 'attack';
              enemy.attackAnimProgress = 1.0;
              soundManager.playShootArrow();

              const angle = Math.atan2(dy, dx);
              projectiles.push({
                id: `arrow_${Date.now()}_${Math.random()}`,
                x: enemy.x,
                y: enemy.y,
                z: 0.5,
                vx: Math.cos(angle) * 9.5,
                vy: Math.sin(angle) * 9.5,
                vz: 0,
                damage: enemy.damage,
                isPlayer: false,
                type: 'arrow',
                timer: 2.2,
                radius: 0.28,
              });
              return 'SUCCESS';
            }
            return 'RUNNING';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 3. Creeper Behavior Tree (Tactical Stalker with Symmetrical Swelling and Defusing)
    this.trees.set(
      'creeper',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 16),
          new SelectorNode([
            new SequenceNode([
              new ConditionNode(
                (ctx) =>
                  ctx.enemy.state === 'exploding' ||
                  Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 2.4
              ),
              new ActionNode((ctx) => {
                const { enemy, player, dt, triggerExplosion } = ctx;
                const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

                // If player dashes far away, Creeper defuses safely and resumes stalk
                if (dist > 4.2 && enemy.chargeTimer < 0.8) {
                  enemy.state = 'chase';
                  enemy.chargeTimer = 0;
                  enemy.creeperSwell = 0;
                  return 'FAILURE';
                }

                enemy.state = 'exploding';
                enemy.animState = 'windup';
                if (!enemy.chargeTimer || enemy.chargeTimer === 0) {
                  soundManager.playCreeperHiss();
                }
                enemy.chargeTimer = (enemy.chargeTimer || 0) + dt;
                // Swell dynamically from 0 to 1.5
                enemy.creeperSwell = Math.min(1.5, (enemy.chargeTimer / 1.25) * 1.5);

                // Stop movement during explosion fuse countdown
                enemy.vx *= 0.2;
                enemy.vy *= 0.2;

                if (enemy.chargeTimer >= 1.25) {
                  triggerExplosion(enemy);
                  return 'SUCCESS';
                }
                return 'RUNNING';
              }),
            ]),
            // Stalker Sneak footwork: Stutters forward, uses flank angle if pack is engaged
            new ActionNode((ctx) => {
              const { enemy, player, dt, isWalkable, squadState } = ctx;
              enemy.state = 'chase';
              enemy.stalkTimer = (enemy.stalkTimer || 0) - dt;
              if (enemy.stalkTimer <= 0) {
                enemy.stalkTimer = 0.9 + Math.random() * 0.4;
              }

              // Only move during active footstep phase (0.35 to 0.9s), pauses to look around
              if (enemy.stalkTimer > 0.25) {
                if (squadState.hasFrontline && squadState.allyCount >= 2) {
                  // Sneak from rear/flank
                  const rearAngle = squadState.assignedFlankAngle + Math.PI * 0.5;
                  const targetX = player.x + Math.cos(rearAngle) * 2.5;
                  const targetY = player.y + Math.sin(rearAngle) * 2.5;
                  moveTowards(enemy, targetX, targetY, enemy.speed * 1.25, dt, isWalkable, enemy.size * 0.35);
                } else {
                  moveTowards(enemy, player.x, player.y, enemy.speed * 1.15, dt, isWalkable, enemy.size * 0.35);
                }
              }
              return 'SUCCESS';
            }),
          ]),
        ]),
        createWanderAction(),
      ])
    );

    // 4. Spider Behavior Tree (High-Speed Skitter & Airborne Pounce Leap)
    this.trees.set(
      'spider',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 16),
          new SelectorNode([
            // In-flight Pounce or Launch Leap
            new ActionNode((ctx) => {
              const { enemy, player, dt, damagePlayer, addFloatingText } = ctx;
              const dx = player.x - enemy.x;
              const dy = player.y - enemy.y;
              const dist = Math.hypot(dx, dy);

              enemy.attackTimer += dt;

              // If currently in mid-air pounce
              if (enemy.isPouncing) {
                // Check landing
                if ((enemy.z || 0) <= 0.05) {
                  enemy.isPouncing = false;
                  enemy.state = 'chase';
                  if (dist <= 1.8) {
                    damagePlayer(enemy.damage, enemy.name);
                    soundManager.playSpiderHiss();
                    addFloatingText(player.x, player.y - 0.4, '🕸️ 毒蛛扑击 (减速)!', '#22c55e', 14);
                  }
                  // Elastic recoil bounce away
                  enemy.vx = -(dx / (dist || 1)) * 3.5;
                  enemy.vy = -(dy / (dist || 1)) * 3.5;
                  return 'SUCCESS';
                }
                return 'RUNNING';
              }

              // Launch Airborne Pounce Leap when in prime striking distance (2.4 to 5.2 blocks)
              if (dist <= 5.2 && dist >= 2.0 && enemy.attackTimer >= enemy.attackCooldown && (enemy.z || 0) <= 0.05) {
                enemy.attackTimer = 0;
                enemy.state = 'pounce';
                enemy.isPouncing = true;
                enemy.vz = 5.2; // Launch into air!
                enemy.vx = (dx / (dist || 1)) * 8.5;
                enemy.vy = (dy / (dist || 1)) * 8.5;
                soundManager.playSpiderHiss();
                addFloatingText(enemy.x, enemy.y - 0.5, '⚡ 飞扑!', '#a855f7', 12);
                return 'RUNNING';
              }

              // Close-range bite if already adjacent
              if (dist <= enemy.range && enemy.attackTimer >= enemy.attackCooldown) {
                enemy.attackTimer = 0;
                damagePlayer(enemy.damage, enemy.name);
                soundManager.playSpiderHiss();
                return 'SUCCESS';
              }

              return 'FAILURE';
            }),
            createSquadCoordinatedChaseAction(1.2),
          ]),
        ]),
        createWanderAction(),
      ])
    );

    // 5. Enderman Behavior Tree (Phase-Shift Dodge & Void Backstab)
    this.trees.set(
      'enderman',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 17),
          new ActionNode((ctx) => {
            const { enemy, player, dt, damagePlayer, addFloatingText } = ctx;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            // Phase shift reaction when taking damage or when player closes into melee range
            enemy.teleportCooldown = (enemy.teleportCooldown || 2.5) - dt;
            const shouldTeleport =
              enemy.teleportCooldown <= 0 ||
              (enemy.hitTimer > 0 && Math.random() < 0.6) ||
              (dist < 2.0 && Math.random() < 0.25);

            if (shouldTeleport && (enemy.teleportCooldown || 0) <= 0.8) {
              enemy.teleportCooldown = 3.2 + Math.random() * 1.8;
              soundManager.playEnderTeleport();
              vfxSystem.spawnVoidMote(enemy.x, enemy.y, 0.4, 16);

              // Teleport to player's flank/rear
              const teleportAngle = player.facingAngle + Math.PI + (Math.random() - 0.5) * 1.2;
              const teleportDist = 2.2 + Math.random() * 1.8;
              enemy.x = player.x + Math.cos(teleportAngle) * teleportDist;
              enemy.y = player.y + Math.sin(teleportAngle) * teleportDist;
              enemy.vx = 0;
              enemy.vy = 0;
              vfxSystem.spawnVoidMote(enemy.x, enemy.y, 0.4, 16);
              addFloatingText(enemy.x, enemy.y, '虚空闪烁!', '#c084fc', 14);
              return 'RUNNING';
            }

            if (dist <= enemy.range) {
              enemy.attackTimer += dt;
              if (enemy.attackTimer >= enemy.attackCooldown) {
                enemy.attackTimer = 0;
                damagePlayer(enemy.damage, enemy.name);
                addFloatingText(player.x, player.y - 0.5, '⚡ 末影重击!', '#c084fc', 15);
              }
              return 'SUCCESS';
            }

            // High-speed phase walk
            moveTowards(enemy, player.x, player.y, enemy.speed * 1.35, dt, ctx.isWalkable, enemy.size * 0.35);
            return 'SUCCESS';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 6. Piglin Brute Behavior Tree
    this.trees.set(
      'piglin_brute',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 15),
          new ActionNode((ctx) => {
            const { enemy, player, dt, damagePlayer, addFloatingText } = ctx;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            const isEnraged = enemy.hp / enemy.maxHp <= 0.45;

            if (isEnraged && !enemy.isEnraged) {
              enemy.isEnraged = true;
              enemy.speed *= 1.35;
              addFloatingText(enemy.x, enemy.y, '狂暴怒吼 (Enraged)!', '#ef4444', 16, true);
              soundManager.playBossEnrage?.();
            }

            if (dist <= enemy.range) {
              enemy.attackTimer += dt;
              if (enemy.attackTimer >= enemy.attackCooldown) {
                enemy.attackTimer = 0;
                damagePlayer(Math.round(enemy.damage * (isEnraged ? 1.4 : 1.0)), enemy.name);
                addFloatingText(player.x, player.y, '重斧劈砍!', '#f59e0b', 14);
              }
            } else {
              enemy.state = 'chase';
              moveTowards(enemy, player.x, player.y, enemy.speed, dt, ctx.isWalkable);
            }
            return 'SUCCESS';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 7. Blaze Behavior Tree
    this.trees.set(
      'blaze',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 16),
          createKiteRetreatAction(4.0, 7.5),
          new ActionNode((ctx) => {
            const { enemy, player, dt, projectiles } = ctx;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            enemy.attackTimer += dt;
            if (dist <= 9.0 && enemy.attackTimer >= enemy.attackCooldown) {
              enemy.attackTimer = 0;
              soundManager.playShootFireball?.();

              // Shoot 3 spread fireballs
              for (let off = -0.22; off <= 0.22; off += 0.22) {
                const angle = Math.atan2(dy, dx) + off;
                projectiles.push({
                  id: `blaze_fire_${Date.now()}_${Math.random()}`,
                  x: enemy.x,
                  y: enemy.y,
                  z: 0.5,
                  vx: Math.cos(angle) * 8,
                  vy: Math.sin(angle) * 8,
                  vz: 0,
                  damage: enemy.damage,
                  isPlayer: false,
                  type: 'fireball',
                  timer: 2.2,
                  radius: 0.35,
                  color: '#f97316',
                });
              }
              return 'SUCCESS';
            }
            return 'RUNNING';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 8. Necromancer Behavior Tree
    this.trees.set(
      'necromancer',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 16),
          createKiteRetreatAction(5.0, 9.0),
          new ActionNode((ctx) => {
            const { enemy, dt, spawnMinion, addFloatingText } = ctx;
            enemy.specialSkillTimer = (enemy.specialSkillTimer || 3.0) - dt;
            if (enemy.specialSkillTimer <= 0) {
              enemy.specialSkillTimer = 5.5 + Math.random() * 2.0;
              spawnMinion(enemy, Math.random() < 0.5 ? 'zombie' : 'skeleton');
              addFloatingText(enemy.x, enemy.y, '死灵唤醒!', '#a855f7', 15);
              soundManager.playLevelUp?.();
              return 'SUCCESS';
            }
            return 'RUNNING';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 9. Slime Behavior Tree (Authentic Voxel Hopping with Squash & Stretch)
    this.trees.set(
      'slime',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 15),
          new ActionNode((ctx) => {
            const { enemy, player, dt, damagePlayer } = ctx;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            enemy.hopTimer = (enemy.hopTimer || 0) - dt;

            // Grounded state logic
            if ((enemy.z || 0) <= 0.05) {
              enemy.isHopping = false;

              // Pre-hop squash preparation phase
              if (enemy.hopTimer < 0.28 && enemy.hopTimer > 0) {
                enemy.slimeScaleY = 0.42; // Squashed flat on floor
                enemy.vx *= 0.6;
                enemy.vy *= 0.6;
              } else if (enemy.hopTimer <= 0) {
                // Launch Hop!
                enemy.hopTimer = 0.85 + Math.random() * 0.45;
                enemy.isHopping = true;
                enemy.vz = 4.8 + Math.random() * 0.8;
                enemy.slimeScaleY = 1.45; // Stretched tall
                const hopPower = enemy.speed * (2.2 + Math.random() * 0.4);
                enemy.vx = (dx / (dist || 1)) * hopPower;
                enemy.vy = (dy / (dist || 1)) * hopPower;
                soundManager.playSlimeSplash?.();
              } else {
                // Post-landing squash recovery
                enemy.slimeScaleY = 0.65;
                enemy.vx *= 0.8;
                enemy.vy *= 0.8;
              }
            } else {
              // Airborne flight: elongated oval
              enemy.slimeScaleY = 1.3;
            }

            // Contact squish damage when landing near player
            if (dist <= enemy.range + 0.3 && (enemy.z || 0) <= 0.3) {
              enemy.attackTimer = (enemy.attackTimer || 0) + dt;
              if (enemy.attackTimer >= 0.8) {
                enemy.attackTimer = 0;
                damagePlayer(enemy.damage, enemy.name);
                soundManager.playSlimeSplash?.();
              }
            }
            return 'SUCCESS';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 10. Witch Behavior Tree
    this.trees.set(
      'witch',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 16),
          createKiteRetreatAction(4.5, 8.0),
          new ActionNode((ctx) => {
            const { enemy, player, dt, projectiles } = ctx;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.hypot(dx, dy);

            enemy.attackTimer += dt;
            if (dist <= 8.5 && enemy.attackTimer >= enemy.attackCooldown) {
              enemy.attackTimer = 0;
              soundManager.playShootArrow();
              const angle = Math.atan2(dy, dx);
              projectiles.push({
                id: `witch_pot_${Date.now()}_${Math.random()}`,
                x: enemy.x,
                y: enemy.y,
                z: 0.5,
                vx: Math.cos(angle) * 7.5,
                vy: Math.sin(angle) * 7.5,
                vz: 0,
                damage: enemy.damage,
                isPlayer: false,
                type: 'potion_splash',
                timer: 2.2,
                radius: 0.4,
                effect: 'poison',
                color: '#a855f7',
              });
              return 'SUCCESS';
            }
            return 'RUNNING';
          }),
        ]),
        createWanderAction(),
      ])
    );

    // 11. Drowned Behavior Tree
    this.trees.set(
      'drowned',
      new SelectorNode([
        new SequenceNode([
          new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= 15),
          new SelectorNode([
            new SequenceNode([
              new ConditionNode((ctx) => Math.hypot(ctx.player.x - ctx.enemy.x, ctx.player.y - ctx.enemy.y) <= ctx.enemy.range),
              createMeleeWindupAction(0.35),
            ]),
            new ActionNode((ctx) => {
              const { enemy, player, dt, projectiles } = ctx;
              const dx = player.x - enemy.x;
              const dy = player.y - enemy.y;
              const dist = Math.hypot(dx, dy);

              enemy.specialSkillTimer = (enemy.specialSkillTimer || 3.0) - dt;
              if (dist > 3.5 && dist <= 8.5 && enemy.specialSkillTimer <= 0) {
                enemy.specialSkillTimer = 3.5;
                soundManager.playShootArrow();
                const angle = Math.atan2(dy, dx);
                projectiles.push({
                  id: `trident_${Date.now()}_${Math.random()}`,
                  x: enemy.x,
                  y: enemy.y,
                  z: 0.5,
                  vx: Math.cos(angle) * 11,
                  vy: Math.sin(angle) * 11,
                  vz: 0,
                  damage: Math.round(enemy.damage * 1.3),
                  isPlayer: false,
                  type: 'trident',
                  timer: 2.0,
                  radius: 0.35,
                  color: '#38bdf8',
                });
                return 'SUCCESS';
              }
              moveTowards(enemy, player.x, player.y, enemy.speed, dt, ctx.isWalkable);
              return 'SUCCESS';
            }),
          ]),
        ]),
        createWanderAction(),
      ])
    );

    // 12. Wither Boss Behavior Tree
    this.trees.set(
      'wither_boss',
      new SelectorNode([
        new ActionNode((ctx) => {
          const { enemy, player, dt, projectiles, addFloatingText } = ctx;
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const dist = Math.hypot(dx, dy);
          const isEnraged = enemy.hp / enemy.maxHp <= 0.5;

          if (isEnraged && !enemy.isEnraged) {
            enemy.isEnraged = true;
            addFloatingText(enemy.x, enemy.y, '⚡ 狂暴阶段 II 启动 ⚡', '#ef4444', 18, true);
            soundManager.playBossEnrage?.();
          }

          // Hover and glide towards player
          moveTowards(enemy, player.x, player.y, enemy.speed * (isEnraged ? 1.35 : 1.0), dt, ctx.isWalkable, 0.7);

          enemy.attackTimer += dt;
          if (enemy.attackTimer >= (isEnraged ? 1.1 : 1.6)) {
            enemy.attackTimer = 0;
            soundManager.playShootFireball?.();

            const count = isEnraged ? 5 : 3;
            const spread = isEnraged ? 0.6 : 0.4;
            for (let i = 0; i < count; i++) {
              const off = -spread / 2 + (i / (count - 1)) * spread;
              const angle = Math.atan2(dy, dx) + off;
              projectiles.push({
                id: `boss_fire_${Date.now()}_${i}`,
                x: enemy.x,
                y: enemy.y,
                z: 0.8,
                vx: Math.cos(angle) * (isEnraged ? 8.5 : 7.0),
                vy: Math.sin(angle) * (isEnraged ? 8.5 : 7.0),
                vz: 0,
                damage: enemy.damage,
                isPlayer: false,
                type: 'fireball',
                timer: 2.8,
                radius: 0.5,
                color: isEnraged ? '#ef4444' : '#6366f1',
              });
            }
          }
          return 'SUCCESS';
        }),
      ])
    );

    // 13. Armored Combat Zombie Tree
    this.trees.set('armored_zombie', new ActionNode(tickArmoredZombie));

    // 14. Agile Goblin Scout / Thief Tree
    this.trees.set('goblin', new ActionNode(tickGoblin));

    // 15. Hyper Baby Zombie Tree
    this.trees.set('baby_zombie', new ActionNode(tickBabyZombie));
  }

  public tickEnemy(ctx: BTContext) {
    const tree = this.trees.get(ctx.enemy.type) || this.trees.get('zombie')!;
    tree.tick(ctx);
  }
}

export const behaviorTreeManager = new BehaviorTreeManager();
