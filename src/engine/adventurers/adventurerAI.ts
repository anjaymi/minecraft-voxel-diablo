import { Enemy } from '../../types';
import { AdventurerEntity } from './AdventurerActor';

/**
 * adventurerAI — 野外冒险者状态机。
 *
 * roam 漫游 → 发现怪物 hunt 狩魔 → 战后 loot 搜刮 →（10% 负伤）rescue 求救
 * kind/brave 性格且未邀请过 → join_offer 想加入 → 玩家回应后 follow 跟随并肩作战
 */

export interface AiContext {
  dt: number;
  enemies: Enemy[];
  playerX: number;
  playerY: number;
  isWalkable: (x: number, y: number) => boolean;
  damageEnemy: (enemy: Enemy, damage: number, isCrit: boolean) => void;
  say: (ent: AdventurerEntity, text: string, color?: string) => void;
  /** 玩家 Buff 共享：锋利附魔 → 队友伤害 ×1.2 */
  damageMult?: number;
  /** 玩家 Buff 共享：迅捷光环 → 队友移速 ×1.15 */
  speedMult?: number;
}

const ROAM_RADIUS = 5;
const ENGAGE_RANGE = 6;
const ATTACK_RANGE = 1.35;
const FOLLOW_NEAR = 2.2;
const FOLLOW_FAR = 4.2;
const ATTACK_INTERVAL = 1.4;

/** 每帧决策 + 执行 */
export function updateAdventurer(ent: AdventurerEntity, ctx: AiContext): void {
  const a = ent.actor;
  a.vx = 0;
  a.vy = 0;
  ent.attackCd = Math.max(0, ent.attackCd - ctx.dt);

  switch (ent.state) {
    case 'rescue':
      tickRescue(ent, ctx);
      return;
    case 'join_offer':
      tickJoinOffer(ent, ctx);
      return;
    case 'follow':
      tickFollow(ent, ctx);
      return;
    case 'hunt':
      tickHunt(ent, ctx);
      return;
    case 'loot':
      tickLoot(ent, ctx);
      return;
    default:
      tickRoam(ent, ctx);
  }
}

function moveToward(ent: AdventurerEntity, tx: number, ty: number, speed: number, ctx: AiContext): void {
  const a = ent.actor;
  const dx = tx - a.x;
  const dy = ty - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.08) return;
  const step = Math.min(dist, speed * ctx.dt);
  const nx = a.x + (dx / dist) * step;
  const ny = a.y + (dy / dist) * step;
  if (ctx.isWalkable(nx, ny)) {
    a.x = nx;
    a.y = ny;
  } else if (ctx.isWalkable(nx, a.y)) {
    a.x = nx;
  } else if (ctx.isWalkable(a.x, ny)) {
    a.y = ny;
  }
  a.vx = dx / dist;
  a.vy = dy / dist;
  if (Math.abs(a.vx) > 0.05) ent.facingLeft = a.vx < 0;
}

function pickRoamPoint(ent: AdventurerEntity, ctx: AiContext): void {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 1.5 + Math.random() * ROAM_RADIUS;
    const tx = ent.wanderTx + Math.cos(angle) * dist;
    const ty = ent.wanderTy + Math.sin(angle) * dist;
    if (ctx.isWalkable(tx, ty)) {
      ent.wanderTx = tx;
      ent.wanderTy = ty;
      return;
    }
  }
}

function findTarget(ent: AdventurerEntity, ctx: AiContext, radius: number): Enemy | null {
  let best: Enemy | null = null;
  let bestDist = radius;
  for (const enemy of ctx.enemies) {
    if (enemy.isDying || enemy.hp <= 0 || enemy.isBoss) continue;
    const d = Math.hypot(enemy.x - ent.actor.x, enemy.y - ent.actor.y);
    if (d < bestDist) {
      best = enemy;
      bestDist = d;
    }
  }
  return best;
}

function tickRoam(ent: AdventurerEntity, ctx: AiContext): void {
  const target = findTarget(ent, ctx, ENGAGE_RANGE);
  if (target) {
    ent.state = 'hunt';
    ent.targetEnemyId = target.id;
    if (ent.callTimer <= 0) {
      ctx.say(ent, '有怪物！交给我！');
      ent.callTimer = 4;
    }
    return;
  }
  if (shouldOfferJoin(ent, ctx)) return;
  const dist = Math.hypot(ent.wanderTx - ent.actor.x, ent.wanderTy - ent.actor.y);
  if (dist < 0.5) {
    pickRoamPoint(ent, ctx);
  } else {
    moveToward(ent, ent.wanderTx, ent.wanderTy, 2.2 * (ctx.speedMult ?? 1), ctx);
  }
}

function tickHunt(ent: AdventurerEntity, ctx: AiContext): void {
  const enemy = ctx.enemies.find((e) => e.id === ent.targetEnemyId);
  if (!enemy || enemy.isDying || enemy.hp <= 0) {
    // 目标消失：前往尸体处搜刮
    ent.state = 'loot';
    ent.lootTimer = 1.4;
    ent.targetEnemyId = null;
    return;
  }
  const dist = Math.hypot(enemy.x - ent.actor.x, enemy.y - ent.actor.y);
  if (dist > ATTACK_RANGE) {
    moveToward(ent, enemy.x, enemy.y, 3.2 * (ctx.speedMult ?? 1), ctx);
    return;
  }
  // 攻击
  if (ent.attackCd <= 0) {
    ent.attackCd = ATTACK_INTERVAL;
    ent.actor.isAttacking = true;
    ent.actor.attackTimer = 0.28;
    const isCrit = Math.random() < 0.15;
    const dmg = Math.round(ent.damage * (ctx.damageMult ?? 1) * (isCrit ? 1.6 : 0.85 + Math.random() * 0.3));
    ctx.damageEnemy(enemy, dmg, isCrit);
    ent.kills += enemy.hp <= dmg ? 1 : 0;
  }
}

function tickLoot(ent: AdventurerEntity, ctx: AiContext): void {
  ent.lootTimer -= ctx.dt;
  moveToward(ent, ent.wanderTx, ent.wanderTy, 2.4 * (ctx.speedMult ?? 1), ctx);
  if (ent.lootTimer <= 0) {
    // 10% 概率战斗负伤 → 求救（野外遇险事件源）
    if (Math.random() < 0.1 && ent.state !== 'rescue') {
      enterRescue(ent, ctx);
      return;
    }
    ent.state = 'roam';
    if (shouldOfferJoin(ent, ctx)) return;
  }
}

function enterRescue(ent: AdventurerEntity, ctx: AiContext): void {
  ent.state = 'rescue';
  ent.hp = Math.max(1, Math.round(ent.maxHp * 0.22));
  ent.callTimer = 0;
}

function tickRescue(ent: AdventurerEntity, ctx: AiContext): void {
  ent.callTimer -= ctx.dt;
  if (ent.callTimer <= 0) {
    ctx.say(ent, '救命！我受伤了……有猎药吗？', '#f87171');
    ent.callTimer = 3.5;
  }
}

function shouldOfferJoin(ent: AdventurerEntity, ctx: AiContext): boolean {
  if (ent.askedToJoin || ent.personality === 'greedy') return false;
  const dist = Math.hypot(ctx.playerX - ent.actor.x, ctx.playerY - ent.actor.y);
  if (dist > 3) return false;
  ent.state = 'join_offer';
  ent.callTimer = 0;
  return true;
}

function tickJoinOffer(ent: AdventurerEntity, ctx: AiContext): void {
  const dist = Math.hypot(ctx.playerX - ent.actor.x, ctx.playerY - ent.actor.y);
  if (dist > 6) {
    // 玩家走远：放弃邀请继续漫游
    ent.askedToJoin = true;
    ent.state = 'roam';
    return;
  }
  ent.callTimer -= ctx.dt;
  if (ent.callTimer <= 0) {
    ctx.say(ent, ent.personality === 'brave' ? '带上我吧！一起杀怪！' : '能让我跟着你吗？我会尽力战斗的。', '#7dd3fc');
    ent.callTimer = 4;
  }
}

function tickFollow(ent: AdventurerEntity, ctx: AiContext): void {
  // 攻击优先：玩家附近的敌人 > 归位跟随（否则在跟随带边缘来回振荡打不着）
  const target = findTarget(ent, ctx, ENGAGE_RANGE);
  if (target) {
    const tdist = Math.hypot(target.x - ent.actor.x, target.y - ent.actor.y);
    if (tdist > ATTACK_RANGE) {
      moveToward(ent, target.x, target.y, 3.4 * (ctx.speedMult ?? 1), ctx);
    } else if (ent.attackCd <= 0) {
      ent.attackCd = ATTACK_INTERVAL;
      ent.actor.isAttacking = true;
      ent.actor.attackTimer = 0.28;
      const isCrit = Math.random() < 0.15;
      const dmg = Math.round(ent.damage * (ctx.damageMult ?? 1) * (isCrit ? 1.6 : 1));
      ctx.damageEnemy(target, dmg, isCrit);
    }
    return;
  }

  // 无敌人：归位跟随（保持在玩家身侧）
  const dist = Math.hypot(ctx.playerX - ent.actor.x, ctx.playerY - ent.actor.y);
  if (dist > FOLLOW_FAR) {
    moveToward(ent, ctx.playerX, ctx.playerY, 3.6 * (ctx.speedMult ?? 1), ctx);
  } else if (dist < FOLLOW_NEAR) {
    return;
  } else {
    const angle = Math.atan2(ent.actor.y - ctx.playerY, ent.actor.x - ctx.playerX);
    moveToward(ent, ctx.playerX + Math.cos(angle) * FOLLOW_NEAR, ctx.playerY + Math.sin(angle) * FOLLOW_NEAR, 2.6 * (ctx.speedMult ?? 1), ctx);
  }
}
