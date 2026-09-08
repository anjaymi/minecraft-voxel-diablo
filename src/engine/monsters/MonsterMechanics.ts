import { Enemy, Player, Projectile } from '../../types';
import { getMonsterDefinition } from './monsterRegistry';

/**
 * MonsterMechanics — 图鉴怪物机制层（Phase 2 落地）。
 *
 * 机制表中的 mechanic 标签在此激活，与骨架模型解耦：
 * 任何 defId 怪物都能拥有任意机制。每帧由 enemyManager 调用 tick，
 * 死亡分裂由 handleDeathMechanics 在击杀回调中触发。
 *
 * 已实现：blinkStrike 闪现突袭 / elementalBolt 元素弹 /
 *         selfDestruct 自爆 / summonLoop 召唤 / splitOnDeath 死亡分裂 /
 *         healPulse 治疗脉冲
 */

export interface MechanicsContext {
  dt: number;
  player: Player;
  projectiles: Projectile[];
  damagePlayer: (amount: number, sourceName: string) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number) => void;
  summonMinion: (host: Enemy, minionType: Enemy['type']) => Enemy | null;
  /** 治疗脉冲宿主实现：治疗附近盟友 */
  healPulse: (host: Enemy) => void;
  vfxRing: (x: number, y: number, color: string) => void;
}

const COOLDOWN_FIELD = 'mechanicCooldown' as const;

/** 机制 → 冷却（秒）与射程 */
const MECH_TUNING: Record<string, { cd: number; minRange: number; maxRange: number }> = {
  blinkStrike: { cd: 5.5, minRange: 2.4, maxRange: 5.2 },
  elementalBolt: { cd: 2.8, minRange: 2.2, maxRange: 6.5 },
  selfDestruct: { cd: 0, minRange: 0, maxRange: 1.7 },
  summonLoop: { cd: 9, minRange: 0, maxRange: 99 },
  healPulse: { cd: 6, minRange: 0, maxRange: 4.5 },
};

/** 元素弹的弹体外观按族系区分 */
const BOLT_STYLE: Record<string, { type: Projectile['type']; color: string; effect: Projectile['effect'] }> = {
  venomSpit: { type: 'potion_splash', color: '#7aa84a', effect: 'poison' },
  venomLob: { type: 'potion_splash', color: '#7aa84a', effect: 'poison' },
  chillTouch: { type: 'mage_bolt', color: '#a8d8f0', effect: 'slow' },
  arcaneBolt: { type: 'mage_bolt', color: '#b0a8d8', effect: 'none' },
  fireFountain: { type: 'fireball', color: '#f0884a', effect: 'none' },
};

/** 机制名归一：图鉴别名 → 标准处理器 */
function normalizeMechanic(mechanic: string | undefined): string | null {
  switch (mechanic) {
    case 'blinkStrike':
    case 'leapStrike':
    case 'shortBlink':
    case 'blinkBackstab':
      return 'blinkStrike';
    case 'venomSpit':
    case 'venomLob':
    case 'chillTouch':
    case 'fireFountain':
    case 'arcaneBolt':
    case 'sandBlind':
    case 'dustBlind':
      return 'elementalBolt';
    case 'selfDestruct':
      return 'selfDestruct';
    case 'summonLoop':
    case 'eggSpawner':
    case 'reviveBones':
    case 'scarabGuard':
      return 'summonLoop';
    case 'splitOnDeath':
      return 'splitOnDeath';
    case 'healPulse':
    case 'healMurk':
    case 'glowAura':
    case 'brineHeal':
      return 'healPulse';
    default:
      return null;
  }
}

export function getEnemyMechanic(enemy: Enemy): string | null {
  if (!enemy.defId) return null;
  const def = getMonsterDefinition(enemy.defId);
  return def ? normalizeMechanic(def.mechanic) : null;
}

/** 每帧 tick（enemyManager 的个体循环中调用） */
export function tickMechanics(enemy: Enemy, ctx: MechanicsContext): void {
  const mechanic = getEnemyMechanic(enemy);
  if (!mechanic || enemy.isDying || enemy.hp <= 0) return;

  const anyEnemy = enemy as Enemy & { [COOLDOWN_FIELD]?: number; fuse?: number };
  anyEnemy[COOLDOWN_FIELD] = Math.max(0, (anyEnemy[COOLDOWN_FIELD] ?? 1.5) - ctx.dt);

  const dx = ctx.player.x - enemy.x;
  const dy = ctx.player.y - enemy.y;
  const dist = Math.hypot(dx, dy);

  switch (mechanic) {
    case 'blinkStrike': {
      const tuning = MECH_TUNING.blinkStrike;
      if ((anyEnemy[COOLDOWN_FIELD] ?? 0) <= 0 && dist >= tuning.minRange && dist <= tuning.maxRange) {
        // 闪现到玩家身后 0.9 格
        enemy.x = ctx.player.x - (dx / dist) * 0.9;
        enemy.y = ctx.player.y - (dy / dist) * 0.9;
        anyEnemy[COOLDOWN_FIELD] = tuning.cd;
        ctx.vfxRing(enemy.x, enemy.y, '#c084fc');
        ctx.damagePlayer(Math.round(enemy.damage * 0.8), enemy.name);
        ctx.addFloatingText(enemy.x, enemy.y - 1, '⚡ 闪现突袭!', '#c084fc', 13);
      }
      break;
    }
    case 'elementalBolt': {
      const style = BOLT_STYLE[defMechanicRaw(enemy)] ?? BOLT_STYLE.arcaneBolt;
      const tuning = MECH_TUNING.elementalBolt;
      if ((anyEnemy[COOLDOWN_FIELD] ?? 0) <= 0 && dist >= tuning.minRange && dist <= tuning.maxRange) {
        anyEnemy[COOLDOWN_FIELD] = tuning.cd;
        fireBolt(enemy, ctx, dist, style);
      }
      break;
    }
    case 'selfDestruct': {
      if (dist <= MECH_TUNING.selfDestruct.maxRange) {
        const fuse = (anyEnemy.fuse ?? 0.8) - ctx.dt;
        anyEnemy.fuse = fuse;
        enemy.chargeTimer = 0.4 + fuse; // 借充能计时驱动闪烁
        if (fuse <= 0) {
          ctx.vfxRing(enemy.x, enemy.y, '#f97316');
          const dmg = Math.round(enemy.damage * 1.8);
          if (dist < 2.4) ctx.damagePlayer(dmg, enemy.name);
          enemy.hp = 0; // 交回正常死亡管线（掉落/击杀计数生效）
        }
      } else {
        anyEnemy.fuse = 0.8;
      }
      break;
    }
    case 'summonLoop': {
      if ((anyEnemy[COOLDOWN_FIELD] ?? 0) <= 0 && (enemy.summonCount ?? 0) < 2 && dist < 9) {
        anyEnemy[COOLDOWN_FIELD] = MECH_TUNING.summonLoop.cd;
        enemy.summonCount = (enemy.summonCount ?? 0) + 1;
        const minion = ctx.summonMinion(enemy, minionTypeFor(enemy));
        if (minion) {
          ctx.addFloatingText(enemy.x, enemy.y - 1.2, `${enemy.name} 召唤了仆从!`, '#c084fc', 13);
        }
      }
      break;
    }
    case 'healPulse': {
      if ((anyEnemy[COOLDOWN_FIELD] ?? 0) <= 0) {
        anyEnemy[COOLDOWN_FIELD] = MECH_TUNING.healPulse.cd;
        ctx.healPulse(enemy);
      }
      break;
    }
    default:
      break;
  }
}

/** 死亡分裂：击杀回调中调用 */
export function handleDeathMechanics(
  enemy: Enemy,
  split: (host: Enemy, childType: Enemy['type'], childHpRatio: number) => void
): void {
  const mechanic = getEnemyMechanic(enemy);
  if (mechanic !== 'splitOnDeath') return;
  const childType = minionTypeFor(enemy);
  split(enemy, childType, 0.45);
}

function defMechanicRaw(enemy: Enemy): string {
  const def = enemy.defId ? getMonsterDefinition(enemy.defId) : undefined;
  return def?.mechanic ?? '';
}

function minionTypeFor(enemy: Enemy): Enemy['type'] {
  const family = enemy.defId ?? '';
  if (family.includes('spider') || family.includes('brood')) return 'spider';
  if (family.includes('scarab')) return 'spider';
  if (family.includes('necro') || family.includes('acolyte')) return 'skeleton';
  if (family.includes('magma') || family.includes('cub')) return 'slime';
  return 'zombie';
}

function fireBolt(
  enemy: Enemy,
  ctx: MechanicsContext,
  dist: number,
  style: { type: Projectile['type']; color: string; effect: Projectile['effect'] }
): void {
  const speed = 7.5;
  const dx = (ctx.player.x - enemy.x) / dist;
  const dy = (ctx.player.y - enemy.y) / dist;
  const proj: Projectile = {
    id: `bolt_${Date.now()}_${Math.floor(Math.random() * 999)}`,
    x: enemy.x, y: enemy.y, z: 0.5,
    vx: dx * speed, vy: dy * speed, vz: 0,
    damage: Math.max(3, Math.round(enemy.damage * 0.9)),
    isPlayer: false,
    type: style.type,
    timer: 2.2,
    radius: 0.5,
    color: style.color,
    effect: style.effect,
  };
  ctx.projectiles.push(proj);
}
