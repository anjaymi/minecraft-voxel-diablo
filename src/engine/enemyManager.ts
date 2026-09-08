import { DungeonFloor, Enemy, EnemyType, Player, Projectile, DropItem, Particle } from '../types';
import { MONSTER_CONFIGS, MonsterConfig } from './monsterManager';
import { getMonsterDefinition } from './monsters/monsterRegistry';
import { handleDeathMechanics, tickMechanics } from './monsters/MonsterMechanics';
import { updateSquads } from './monsters/SquadCoordinator';
import { behaviorTreeManager, BTContext } from './behaviorTree';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';
import { eliteAffixSystem } from './eliteAffixSystem';
import { elementalSystem } from './elementalSystem';
import { enemyDeathSystem } from './enemyDeathSystem';
import { tacticalAdaptationSystem } from './tacticalAdaptationSystem';
import { summonVFXSystem } from './vfx/SummonVFXSystem';

export interface EnemyManagerCallbacks {
  isWalkable: (x: number, y: number) => boolean;
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number, isCrit?: boolean) => void;
  damagePlayer: (amount: number, sourceName: string) => void;
  onEnemyDied?: (enemy: Enemy) => void;
  spawnParticle?: (particle: Particle) => void;
  triggerScreenShake?: (duration: number, intensity: number) => void;
}

export interface DropPhysicsCallbacks {
  onCollectEmerald: (amount: number) => void;
  onCollectExp: (amount: number) => void;
  onCollectItem: (item: any, rarity: string) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number) => void;
  spawnParticle: (particle: any) => void;
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private deadEnemiesQueue: Enemy[] = [];
  // Memory reclamation pool: reusable enemy objects to avoid excessive GC thrashing
  private enemyPool: Enemy[] = [];

  constructor() {}

  public getEnemies(): Enemy[] {
    return this.enemies;
  }

  public getAliveEnemies(): Enemy[] {
    return this.enemies.filter((e) => !e.isDying && e.hp > 0);
  }

  public getEnemyCount(): number {
    return this.enemies.length;
  }

  public getEnemiesInRadius(x: number, y: number, radius: number): Enemy[] {
    const r2 = radius * radius;
    return this.enemies.filter((e) => {
      if (e.isDying || e.hp <= 0) return false;
      const dx = e.x - x;
      const dy = e.y - y;
      return dx * dx + dy * dy <= r2;
    });
  }

  public clear(): void {
    // Reclaim memory into pool
    for (const e of this.enemies) {
      if (this.enemyPool.length < 50) {
        this.enemyPool.push(e);
      }
    }
    this.enemies = [];
    this.deadEnemiesQueue = [];
  }

  /**
   * Spawn a specific enemy using pooled memory or newly allocated structure
   */
  public spawnEnemy(
    type: EnemyType,
    x: number,
    y: number,
    floorNumber: number = 1,
    isElite: boolean = false,
    isBoss: boolean = false
  ): Enemy {
    const config: MonsterConfig = MONSTER_CONFIGS[type] || MONSTER_CONFIGS.zombie;
    let affixes: string[] = [];
    let name = config.name;
    let eliteHpMult = 1.0;
    let eliteDmgMult = 1.0;

    // 数值平衡(2026-09): Boss 独立血/伤预算，不再借精英身份。
    // 调用方若同时传 isElite=true 与 isBoss=true，优先走 Boss 档位，不套精英词缀。
    if (isBoss) {
      // 数值平衡(2026-09): 名字按内容等级映射（地下城层 1/2/3 → 内容等级 1/3/5）
      name = floorNumber <= 1 ? '凋灵领主 (Wither Lord)' : floorNumber <= 3 ? '烈焰深渊主宰 (Nether Overlord)' : '虚空末影龙裔 (Ender Scion)';
    } else if (isElite) {
      const profile = eliteAffixSystem.generateEliteProfile(config.name.split(' ')[0], floorNumber);
      affixes = profile.affixes;
      name = profile.title;
      eliteHpMult = profile.hpMultiplier;
      eliteDmgMult = profile.damageMultiplier;
    }

    const floorMult = 1.0 + (floorNumber - 1) * 0.22;
    let hp = Math.round(config.baseHp * floorMult * eliteHpMult);
    let damage = Math.round(config.baseDamage * floorMult * eliteDmgMult);
    let defense = Math.round(config.baseDefense + (floorNumber - 1) * 1.5 + (affixes.includes('强韧') ? 8 : 0));

    if (isBoss) {
      // 数值平衡(2026-09): Boss 独立血/伤预算，不再借精英身份
      hp = Math.round(hp * 2.6);
      damage = Math.round(damage * 1.5);
      defense = Math.round(defense + 6);
    }

    // Try recycling from pool
    let enemy: Enemy;
    if (this.enemyPool.length > 0) {
      enemy = this.enemyPool.pop()!;
      enemy.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      enemy.type = type;
      enemy.name = name;
      enemy.x = x;
      enemy.y = y;
      enemy.z = 0;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.vz = 0;
      enemy.facingAngle = 0;
      enemy.hp = hp;
      enemy.maxHp = hp;
      enemy.damage = damage;
      enemy.speed = isElite ? config.baseSpeed * 1.25 : config.baseSpeed;
      enemy.defense = defense;
      enemy.attackCooldown = config.attackCooldown;
      enemy.attackTimer = Math.random() * 0.5;
      enemy.range = config.attackRange;
      enemy.isElite = isElite;
      enemy.affixes = affixes;
      enemy.color = config.color;
      enemy.size = isElite ? config.size * 1.3 : config.size;
      enemy.state = 'idle';
      enemy.chargeTimer = 0;
      enemy.windupTimer = 0;
      enemy.windupMax = config.windupTime;
      enemy.hitTimer = 0;
      enemy.wanderTimer = 1 + Math.random() * 2;
      enemy.strafeDir = Math.random() < 0.5 ? 1 : -1;
      enemy.strafeTimer = 1.5;
      enemy.specialSkillTimer = 2.0 + Math.random() * 2;
      enemy.isBoss = isBoss;
      enemy.bossPhase = isBoss ? 1 : undefined;
      enemy.isEnraged = false;
      enemy.animState = 'idle';
      enemy.animTimer = 0;
      enemy.limbSwing = 0;
      enemy.attackAnimProgress = 0;
      enemy.deathTimer = 0;
      enemy.isDying = false;
      enemy.defId = undefined;
      enemy.shieldReflectActive = false;
      enemy.shieldReflectTimer = 7.0;
      enemy.toxicAuraTimer = 1.2;
      enemy.teleportCooldown = 5.0;
      enemy.summonMinionTimer = 12.0;
      enemy.hasSummonedMinions = false;
      enemy.moltenTrailTimer = 0.4;
      enemy.burnTimer = 0;
      enemy.chillTimer = 0;
      enemy.shockTimer = 0;
      enemy.poisonTimer = 0;
      enemy.poisonDps = undefined;
    } else {
      enemy = {
        id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type,
        name,
        x,
        y,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        facingAngle: 0,
        hp,
        maxHp: hp,
        damage,
        speed: isElite ? config.baseSpeed * 1.25 : config.baseSpeed,
        defense,
        attackCooldown: config.attackCooldown,
        attackTimer: Math.random() * 0.5,
        range: config.attackRange,
        isElite,
        affixes,
        color: config.color,
        size: isElite ? config.size * 1.3 : config.size,
        state: 'idle',
        chargeTimer: 0,
        windupTimer: 0,
        windupMax: config.windupTime,
        hitTimer: 0,
        wanderTimer: 1 + Math.random() * 2,
        strafeDir: Math.random() < 0.5 ? 1 : -1,
        strafeTimer: 1.5,
        specialSkillTimer: 2.0 + Math.random() * 2,
        isBoss,
        bossPhase: isBoss ? 1 : undefined,
        isEnraged: false,
        animState: 'idle',
        animTimer: 0,
        limbSwing: 0,
        attackAnimProgress: 0,
        deathTimer: 0,
        isDying: false,
        defId: undefined,
        shieldReflectActive: false,
        shieldReflectTimer: 7.0,
        toxicAuraTimer: 1.2,
        teleportCooldown: 5.0,
        summonMinionTimer: 12.0,
        hasSummonedMinions: false,
        moltenTrailTimer: 0.4,
        burnTimer: 0,
        chillTimer: 0,
        shockTimer: 0,
        poisonTimer: 0,
        poisonDps: undefined,
      };
    }

    this.enemies.push(enemy);
    return enemy;
  }

  /**
   * 按图鉴定义生成怪物：复用骨架模型的数值/渲染/AI，
   * 叠加图鉴名称、主题配色与数值倍率（100 怪落地核心入口）。
   */
  public spawnFromDefinition(
    defId: string,
    x: number,
    y: number,
    floorNumber: number = 1,
    isElite: boolean = false
  ): Enemy | null {
    const def = getMonsterDefinition(defId);
    if (!def) return null;

    const enemy = this.spawnEnemy(def.baseType, x, y, floorNumber, isElite, false);
    const mult = def.statMult ?? {};
    // 数值平衡(2026-09): tier 加成 HP/伤害对称 8%、防御 4%
    const tierHpBoost = 1 + def.tier * 0.08;
    const tierDmgBoost = 1 + def.tier * 0.08;
    const tierDefBoost = 1 + def.tier * 0.04;

    enemy.defId = def.id;
    enemy.name = def.name;
    enemy.color = def.color;
    enemy.maxHp = Math.max(1, Math.round(enemy.maxHp * (mult.hp ?? 1) * tierHpBoost));
    enemy.hp = enemy.maxHp;
    enemy.damage = Math.max(1, Math.round(enemy.damage * (mult.damage ?? 1) * tierDmgBoost));
    enemy.speed = enemy.speed * (mult.speed ?? 1);
    enemy.defense = Math.round(enemy.defense * (mult.defense ?? 1) * tierDefBoost);
    enemy.size = enemy.size * (mult.size ?? 1);
    enemy.range = enemy.range * (mult.attackRange ?? 1);
    return enemy;
  }

  /**
   * Spawn minion (e.g. necromancer summoning)
   */
  public spawnMinion(parent: Enemy, minionType: EnemyType = 'skeleton'): Enemy {
    const angle = Math.random() * Math.PI * 2;
    const mx = parent.x + Math.cos(angle) * 1.5;
    const my = parent.y + Math.sin(angle) * 1.5;
    const minion = this.spawnEnemy(minionType, mx, my, 1, false, false);
    minion.isMinion = true;
    minion.name = `仆从 ${minion.name}`;
    minion.maxHp = Math.round(minion.maxHp * 0.7);
    minion.hp = minion.maxHp;
    vfxSystem.spawnVoidMote(mx, my, 0.4, 12);
    summonVFXSystem.spawn(mx, my, 'demon', '#ef4444');
    return minion;
  }

  /**
   * Slime split upon death
   */
  public splitSlime(slime: Enemy): void {
    if (slime.size <= 0.7) return; // already mini slime
    soundManager.playSlimeSplash?.();
    for (let i = 0; i < 2; i++) {
      const offX = (i === 0 ? -0.5 : 0.5) + (Math.random() - 0.5) * 0.2;
      const offY = (Math.random() - 0.5) * 0.4;
      const child = this.spawnEnemy('slime', slime.x + offX, slime.y + offY, 1, false, false);
      child.size = slime.size * 0.6;
      child.maxHp = Math.round(slime.maxHp * 0.45);
      child.hp = child.maxHp;
      child.damage = Math.max(4, Math.round(slime.damage * 0.6));
      child.vz = 3.5;
      child.vx = (Math.random() - 0.5) * 4;
      child.vy = (Math.random() - 0.5) * 4;
      vfxSystem.spawnSparks(child.x, child.y, 0.2, 8, '#4ade80', 2.5);
    }
  }

  /** 治疗脉冲：恢复半径内盟友 8% 最大生命（支援型图鉴怪） */
  public pulseHealAllies(host: Enemy): void {
    let healed = 0;
    for (const ally of this.enemies) {
      if (ally === host || ally.isDying || ally.hp <= 0 || ally.hp >= ally.maxHp) continue;
      if (Math.hypot(ally.x - host.x, ally.y - host.y) > 4.5) continue;
      ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.08));
      healed++;
    }
    if (healed > 0) {
      vfxSystem.spawnShockwave(host.x, host.y, 0.15, 3.2, '#4ade80', false, 0.4);
    }
  }

  /** 死亡分裂（图鉴机制）：击杀回调中调用 */
  public handleDeathSplit(enemy: Enemy): void {
    handleDeathMechanics(enemy, (host, childType, hpRatio) => {
      for (let i = 0; i < 2; i++) {
        const offX = (i === 0 ? -0.55 : 0.55);
        const child = this.spawnEnemy(childType, host.x + offX, host.y + (Math.random() - 0.5) * 0.4, 1, false, false);
        child.maxHp = Math.max(1, Math.round(host.maxHp * hpRatio * 0.5));
        child.hp = child.maxHp;
        child.damage = Math.max(2, Math.round(host.damage * 0.55));
        child.size = Math.max(0.55, host.size * 0.6);
        child.vz = 3.2;
        vfxSystem.spawnSparks(child.x, child.y, 0.2, 8, '#a78bfa', 2.5);
      }
    });
  }

  /**
   * Synchronize all enemy states, physics, behavior tree AI, and animation timers
   */
  public update(
    player: Player,
    projectiles: Projectile[],
    dt: number,
    floor: DungeonFloor,
    callbacks: EnemyManagerCallbacks
  ): void {
    // 1. Crowd separation (Boid repulsive physics to avoid stacking)
    const len = this.enemies.length;
    for (let i = 0; i < len; i++) {
      const e1 = this.enemies[i];
      if (e1.isDying) continue;
      for (let j = i + 1; j < len; j++) {
        const e2 = this.enemies[j];
        if (e2.isDying) continue;
        const dx = e2.x - e1.x;
        const dy = e2.y - e1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = (e1.size + e2.size) * 0.42;
        if (dist < minDist && dist > 0.001) {
          const overlap = (minDist - dist) * 0.5;
          const pushX = (dx / dist) * overlap * 12 * dt;
          const pushY = (dy / dist) * overlap * 12 * dt;
          e1.vx -= pushX;
          e1.vy -= pushY;
          e2.vx += pushX;
          e2.vy += pushY;
        }
      }
    }

    // 2. Squad / Team Awareness Evaluation (Group active enemies around player)
    const activeEnemies = this.enemies.filter(
      (e) => !e.isDying && e.hp > 0 && Math.hypot(e.x - player.x, e.y - player.y) <= 16
    );
    const allyCount = activeEnemies.length;
    const hasFrontline = activeEnemies.some((e) => Math.hypot(e.x - player.x, e.y - player.y) <= 3.2);
    const isPlayerLowHp = player.stats.hp / Math.max(1, player.stats.maxHp) < 0.38;

    // Tactical objective determination
    let tacticalObjective: 'encircle' | 'focus_fire' | 'covering_fire' | 'ambush' = 'encircle';
    if (isPlayerLowHp || activeEnemies.some((e) => e.isBoss || e.isEnraged)) {
      tacticalObjective = 'focus_fire';
    } else if (allyCount >= 2) {
      tacticalObjective = 'encircle';
    }

    // 2.5 敌人协同编队（精英指挥官 + 包围阵型转向）
    updateSquads(this.enemies, { player, dt }, {
      vfxRing: (x, y, color) => vfxSystem.spawnShockwave(x, y, 0.15, 3.0, color, false, 0.4),
      say: (x, y, text, color) => callbacks.addFloatingText(x, y, text, color, 13),
    });

    // 3. Individual enemy update loop
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Dying state handling
      if (enemy.isDying) {
        enemy.deathTimer = (enemy.deathTimer || 0) + dt;
        enemy.vx *= 0.7;
        enemy.vy *= 0.7;
        if (enemy.deathTimer >= 0.45) {
          // Reclaim to pool
          this.reclaimEnemy(i);
        }
        continue;
      }

      // Reviving state handling (Undead Zombie down & resurrecting)
      if (enemy.isReviving) {
        enemyDeathSystem.updateRevivingEnemy(enemy, dt, {
          addFloatingText: callbacks.addFloatingText,
          spawnParticle: (p) => callbacks.spawnParticle?.(p),
          onTrueDeath: (e) => {
            if (callbacks.onEnemyDied) callbacks.onEnemyDied(e);
          },
          triggerScreenShake: callbacks.triggerScreenShake,
        });
        continue;
      }

      // Physics Drag
      enemy.vx *= 0.82;
      enemy.vy *= 0.82;
      if (enemy.hitTimer > 0) {
        enemy.hitTimer -= dt;
      }
      if (enemy.knockbackTimer && enemy.knockbackTimer > 0) {
        enemy.knockbackTimer -= dt;
        // While sliding fast during knockback, kick up skid dust particles
        const speedSq = enemy.vx * enemy.vx + enemy.vy * enemy.vy;
        if (speedSq > 9 && Math.random() < 0.45 && callbacks.spawnParticle) {
          callbacks.spawnParticle({
            x: enemy.x + (Math.random() - 0.5) * 0.3,
            y: enemy.y + (Math.random() - 0.5) * 0.3,
            z: 0.1,
            vx: -enemy.vx * 0.2 + (Math.random() - 0.5) * 1.5,
            vy: -enemy.vy * 0.2 + (Math.random() - 0.5) * 1.5,
            vz: 0.8 + Math.random() * 1.2,
            life: 0.3,
            maxLife: 0.3,
            color: '#a8a29e',
            size: 0.18,
            type: 'smoke',
          });
        }
      }
      if (enemy.stunTimer && enemy.stunTimer > 0) {
        enemy.stunTimer -= dt;
      }

      // 图鉴怪物机制层（闪现/元素弹/自爆/召唤/治疗脉冲）
      if (enemy.defId) {
        tickMechanics(enemy, {
          dt,
          player,
          projectiles,
          damagePlayer: callbacks.damagePlayer,
          addFloatingText: callbacks.addFloatingText,
          summonMinion: (host, minionType) => this.spawnMinion(host, minionType),
          healPulse: (host) => this.pulseHealAllies(host),
          vfxRing: (x, y, color) => vfxSystem.spawnShockwave(x, y, 0.15, 2.2, color, false, 0.35),
        });
      }

      // Vertical hop physics (Slime, Spider pounce, etc.)
      if ((enemy.vz || 0) !== 0 || (enemy.z || 0) > 0) {
        enemy.z = (enemy.z || 0) + (enemy.vz || 0) * dt;
        enemy.vz = (enemy.vz || 0) - 15 * dt; // gravity
        if (enemy.z <= 0) {
          enemy.z = 0;
          enemy.vz = 0;
          if (enemy.type === 'slime') {
            enemy.slimeScaleY = 0.55; // Squash on impact
            soundManager.playSlimeSplash?.();
            vfxSystem.spawnSparks(enemy.x, enemy.y, 0.1, 8, '#4ade80', 3);
          }
        }
      }

      // Smooth recovery for slime squash & stretch
      if (enemy.slimeScaleY !== undefined && enemy.slimeScaleY < 1.0) {
        enemy.slimeScaleY = Math.min(1.0, enemy.slimeScaleY + dt * 3.5);
      }

      // Facing angle
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const dist = Math.hypot(dx, dy);

      // Stagger / Hit-stun / Knockback check: enemy is incapacitated while reeling from heavy hits
      const isStunnedOrKnocked = (enemy.stunTimer && enemy.stunTimer > 0) || (enemy.knockbackTimer && enemy.knockbackTimer > 0);
      if (isStunnedOrKnocked) {
        // Animation Frame Timers & States Synchronization
        this.updateEnemyAnimation(enemy, dt);
        continue;
      }

      // Smart Combat Tactical Adaptation (Charger evasive zig-zag rush, Ranged seek cover)
      const tacticalHandled = tacticalAdaptationSystem.tickTacticalBehavior({
        enemy,
        player,
        projectiles,
        dt,
        floor,
        isWalkable: callbacks.isWalkable,
        addFloatingText: callbacks.addFloatingText,
        spawnParticle: (p) => callbacks.spawnParticle?.(p),
      });

      // Behavior Tree Tactical AI Execution (active within 18 tiles when not executing tactical maneuvers)
      if (!tacticalHandled && dist < 18) {
        const activeIdx = activeEnemies.indexOf(enemy);
        const assignedFlankAngle =
          activeIdx >= 0
            ? (activeIdx / Math.max(1, allyCount)) * Math.PI * 2
            : Math.atan2(enemy.y - player.y, enemy.x - player.x);

        const btContext: BTContext = {
          enemy,
          player,
          dt,
          floorWidth: floor.width,
          floorHeight: floor.height,
          isWalkable: callbacks.isWalkable,
          projectiles,
          addFloatingText: callbacks.addFloatingText,
          damagePlayer: callbacks.damagePlayer,
          spawnMinion: (p, type) => this.spawnMinion(p, (type as EnemyType) || 'skeleton'),
          triggerExplosion: (e) => this.explodeCreeper(e, callbacks),
          allies: activeEnemies,
          squadState: {
            allyCount,
            hasFrontline,
            isPlayerDistracted: false,
            tacticalObjective,
            assignedFlankAngle,
          },
        };
        behaviorTreeManager.tickEnemy(btContext);
      }

      // Map Boundary & Obstacle Wall Integration
      const nextX = enemy.x + enemy.vx * dt;
      const nextY = enemy.y + enemy.vy * dt;
      const radius = enemy.size * 0.35;

      if (callbacks.isWalkable(nextX - radius, enemy.y) && callbacks.isWalkable(nextX + radius, enemy.y)) {
        enemy.x = nextX;
      } else {
        enemy.vx = 0;
      }

      if (callbacks.isWalkable(enemy.x, nextY - radius) && callbacks.isWalkable(enemy.x, nextY + radius)) {
        enemy.y = nextY;
      } else {
        enemy.vy = 0;
      }

      // Elite Affix Active Mechanics (Teleport, Toxic Aura, Shield Reflect, Summoner, Molten Trail)
      if (enemy.isElite) {
        eliteAffixSystem.update(enemy, player, dt, {
          spawnParticle: (p) => callbacks.spawnParticle?.(p),
          damagePlayer: callbacks.damagePlayer,
          spawnMinion: (minionType, mx, my) => {
            this.spawnEnemy(minionType, mx, my, floor.floorNumber, false, false);
          },
          addFloatingText: (x, y, text, color, size) => callbacks.addFloatingText(x, y, text, color, size),
          isWalkable: callbacks.isWalkable,
        });
      }

      // Elemental Status Effects Tick (Burn DOT, Chill slow, Shock arcs)
      elementalSystem.updateStatus(enemy, dt, {
        applyDamage: (e, amt) => {
          e.hp -= amt;
          if (e.hp <= 0 && !e.isDying) {
            this.killEnemy(e, callbacks.onEnemyDied);
          }
        },
        spawnParticle: (p) => callbacks.spawnParticle?.(p),
      });

      // 数值平衡(2026-09): 中毒持续伤害（此前 poisonTimer 只被设置从未结算）
      if (enemy.poisonTimer && enemy.poisonTimer > 0) {
        enemy.poisonTimer -= dt;
        const dot = enemy.poisonDps || 0;
        if (dot > 0) {
          enemy.hp -= dot * dt;
          if (Math.random() < dt * 1.5) {
            callbacks.addFloatingText(enemy.x, enemy.y - 0.4, `毒 ${Math.round(dot * dt * 10) / 10}`, '#22c55e', 11);
          }
          if (enemy.hp <= 0 && !enemy.isDying) {
            this.killEnemy(enemy, callbacks.onEnemyDied);
          }
        }
      }

      // Animation Frame Timers & States Synchronization
      this.updateEnemyAnimation(enemy, dt);
    }
  }

  /**
   * Update animation frame cycle and state for rendering
   */
  private updateEnemyAnimation(enemy: Enemy, dt: number): void {
    const moveSpeedSq = enemy.vx * enemy.vx + enemy.vy * enemy.vy;
    const isMoving = moveSpeedSq > 0.08;

    enemy.animTimer = (enemy.animTimer || 0) + dt;

    if (enemy.knockbackTimer && enemy.knockbackTimer > 0) {
      enemy.animState = 'knockback';
    } else if (enemy.hitTimer > 0) {
      enemy.animState = 'hit';
    } else if (enemy.state === 'windup') {
      enemy.animState = 'windup';
    } else if (enemy.attackAnimProgress && enemy.attackAnimProgress > 0) {
      enemy.animState = 'attack';
      enemy.attackAnimProgress = Math.max(0, enemy.attackAnimProgress - dt * 3.5);
    } else if (isMoving) {
      enemy.animState = 'walk';
      enemy.limbSwing = ((enemy.limbSwing || 0) + dt * 8.5) % (Math.PI * 2);
    } else {
      enemy.animState = 'idle';
      enemy.limbSwing = 0;
    }
  }

  /**
   * Trigger Creeper explosion
   */
  private explodeCreeper(enemy: Enemy, callbacks: EnemyManagerCallbacks): void {
    soundManager.playExplosion();
    vfxSystem.spawnExplosion(enemy.x, enemy.y, 3.8, '#22c55e');

    // Notify death & cleanup
    enemy.hp = 0;
    this.killEnemy(enemy, callbacks.onEnemyDied);
  }

  /**
   * Safely mark an enemy as dead, triggering unique death mechanics (resurrection / bone shatter) or starting standard death animation
   */
  public killEnemy(
    enemy: Enemy,
    onDied?: (e: Enemy) => void,
    floor?: DungeonFloor,
    callbacks?: EnemyManagerCallbacks
  ): boolean {
    if (enemy.isDying) return false;

    // Check unique death mechanics (e.g. Zombie downed revival, Skeleton bone scatter)
    if (floor && callbacks) {
      const specialDeathHandled = enemyDeathSystem.handleDeathTrigger(enemy, floor, {
        addFloatingText: callbacks.addFloatingText,
        spawnParticle: (p) => callbacks.spawnParticle?.(p),
        onTrueDeath: (e) => {
          if (onDied) onDied(e);
        },
        triggerScreenShake: callbacks.triggerScreenShake,
      });

      if (specialDeathHandled) {
        // Zombie enters downed revival; postpone true death
        return false;
      }
    }

    enemy.isDying = true;
    enemy.animState = 'death';
    enemy.deathTimer = 0;

    // Slime splitting logic
    if (enemy.type === 'slime') {
      this.splitSlime(enemy);
    }

    if (onDied) {
      onDied(enemy);
    }
    return true;
  }

  /**
   * Reclaim enemy memory to pool and remove from active list
   */
  private reclaimEnemy(index: number): void {
    const removed = this.enemies.splice(index, 1)[0];
    if (removed && this.enemyPool.length < 60) {
      this.enemyPool.push(removed);
    }
  }

  /**
   * Update all dropped loot items: 3D parabolic physics, ground bounce, magnetic suction,
   * and satisfying spring scale rebound animation upon collection.
   */
  public updateDropsPhysics(
    drops: DropItem[],
    player: Player,
    dt: number,
    callbacks: DropPhysicsCallbacks
  ): void {
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];

      // 1. Being Collected: Spring Scale Rebound Animation
      if (drop.isBeingCollected) {
        drop.pickupProgress = (drop.pickupProgress || 0) + dt * 5.2; // ~0.19s juicy pop
        const p = drop.pickupProgress;

        // Elastic overshoot bounce: rises to ~1.65x then snaps down to 0
        drop.scale = Math.max(0, 1.0 + Math.sin(p * Math.PI) * 0.75 - p * 0.5);

        // Suction towards player center
        drop.x += (player.x - drop.x) * Math.min(1.0, dt * 18);
        drop.y += (player.y - drop.y) * Math.min(1.0, dt * 18);
        drop.z = (drop.z || 0) * (1 - p);

        // Sparkle trail during collection
        if (Math.random() < 0.4) {
          callbacks.spawnParticle({
            x: drop.x,
            y: drop.y,
            z: drop.z || 0.2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            vz: 0.8 + Math.random() * 0.8,
            color: drop.color,
            size: 2.2,
            life: 0.2,
            maxLife: 0.2,
            gravity: 1,
          });
        }

        if (drop.pickupProgress >= 1.0) {
          // Finalize acquisition
          if (drop.isEmerald) {
            callbacks.onCollectEmerald(drop.amount);
            callbacks.addFloatingText(player.x, player.y - 0.3, `+${drop.amount} 绿宝石`, '#10b981', 14);
          } else if (drop.isExp) {
            callbacks.onCollectExp(drop.amount);
          } else if (drop.item) {
            callbacks.onCollectItem(drop.item, drop.rarity);
          }

          // Collection burst sparks
          for (let k = 0; k < 6; k++) {
            callbacks.spawnParticle({
              x: player.x,
              y: player.y,
              z: 0.4,
              vx: (Math.random() - 0.5) * 3.5,
              vy: (Math.random() - 0.5) * 3.5,
              vz: 0.5 + Math.random() * 1.5,
              color: drop.color,
              size: 3.0,
              life: 0.3,
              maxLife: 0.3,
              gravity: 3,
            });
          }

          drops.splice(i, 1);
        }
        continue;
      }

      // 2. 3D Parabolic Arc & Ground Bounce Physics
      if (!drop.isGrounded) {
        drop.vz -= 14.0 * dt; // Gravity
        drop.z += drop.vz * dt;
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        drop.vx *= 0.94; // Air resistance
        drop.vy *= 0.94;
        drop.rotation += drop.rotationSpeed * dt;

        // Ground collision
        if (drop.z <= 0) {
          drop.z = 0;
          drop.bounces++;
          if (drop.bounces < drop.maxBounces) {
            // Elastic upward bounce
            drop.vz = -drop.vz * 0.45;
            drop.rotationSpeed *= 0.5;
            drop.impactWaveTimer = 0.25;
            soundManager.playLootBounce();

            // Landing dust particles
            for (let k = 0; k < 3; k++) {
              callbacks.spawnParticle({
                x: drop.x,
                y: drop.y,
                z: 0.05,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                vz: 0.4 + Math.random() * 0.8,
                color: drop.color,
                size: 2.5,
                life: 0.25,
                maxLife: 0.25,
                gravity: 2,
              });
            }
          } else {
            // Settle on ground
            drop.vz = 0;
            drop.vx = 0;
            drop.vy = 0;
            drop.isGrounded = true;
            drop.rotationSpeed = 0;
            drop.impactWaveTimer = 0.35;
          }
        }
      }

      if (drop.impactWaveTimer > 0) {
        drop.impactWaveTimer -= dt;
      }

      // 3. Magnetic Attraction
      const dx = player.x - drop.x;
      const dy = player.y - drop.y;
      const dist = Math.hypot(dx, dy);

      const magnetRange = drop.isExp || drop.isEmerald ? 4.5 : 2.5;
      if (dist < magnetRange) {
        drop.magnetized = true;
        const pullSpeed = Math.min(18, 5 + (magnetRange - dist) * 4.2);
        drop.x += (dx / dist) * pullSpeed * dt;
        drop.y += (dy / dist) * pullSpeed * dt;
        if (drop.z > 0.2) drop.z += (0.2 - drop.z) * 6 * dt;
      }

      // 4. Pickup Initiation Check
      if (dist < 0.95 && !drop.isBeingCollected) {
        drop.isBeingCollected = true;
        drop.pickupProgress = 0;
        drop.scale = 1.0;
        soundManager.playLootPickupSpring(drop.rarity);
      }
    }
  }
}

export const enemyManager = new EnemyManager();
