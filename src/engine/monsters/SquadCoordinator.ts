import { Enemy, Player } from '../../types';

/**
 * SquadCoordinator — 敌人协同作战编队协调器。
 *
 * 聚合玩家附近的敌人编成"猎杀小队"：
 * - 精英怪自动成为小队指挥官，发出猎杀号令并为全队提供狂暴增益
 * - 成员分配环形包围位（远程保持外环、每三人一个侧翼位绕后）
 * - 协调器以轻量转向推力实现阵型（与行为树 AI 叠加，不抢占控制权）
 */

export interface SquadFx {
  vfxRing: (x: number, y: number, color: string) => void;
  say: (x: number, y: number, text: string, color: string) => void;
}

export interface SquadContext {
  player: Player;
  dt: number;
}

/** 编队聚群半径 */
const SQUAD_RADIUS = 11;
/** 成员间距阈值 */
const MEMBER_LINK = 8;
/** 包围环半径：近战 / 远程 */
const RING_MELEE = 1.9;
const RING_RANGED = 5.2;
/** 阵型转向速度（格/秒） */
const STEER_SPEED = 1.7;

interface SquadMeta {
  lastHowl: number;
}

const GROUP_META = new Map<string, SquadMeta>();
let groupClock = 0;

/** 敌人的稳定伪随机角（同一只怪每局阵型位固定） */
function idAngle(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 628) / 628) * Math.PI * 2;
}

function isAlive(e: Enemy): boolean {
  return !e.isDying && e.hp > 0 && !e.isBoss;
}

/** 每帧更新：编队聚合 → 指挥官号令 → 阵型转向 */
export function updateSquads(enemies: Enemy[], ctx: SquadContext, fx: SquadFx): void {
  groupClock += ctx.dt;
  const candidates = enemies.filter((e) => isAlive(e) && Math.hypot(e.x - ctx.player.x, e.y - ctx.player.y) <= SQUAD_RADIUS + 4);
  if (candidates.length < 2) {
    // 无小队：清除狂暴增益
    for (const e of enemies) e.packAggroBoost = 1;
    GROUP_META.clear();
    return;
  }

  // 贪心聚群
  const groups: Enemy[][] = [];
  const assigned = new Set<Enemy>();
  for (const seed of candidates) {
    if (assigned.has(seed)) continue;
    const group = [seed];
    assigned.add(seed);
    for (const other of candidates) {
      if (assigned.has(other)) continue;
      const near = group.some((m) => Math.hypot(m.x - other.x, m.y - other.y) <= MEMBER_LINK);
      if (near) {
        group.push(other);
        assigned.add(other);
      }
    }
    if (group.length >= 2) groups.push(group);
  }

  for (const group of groups) {
    // 指挥官：优先精英，否则血量最高者
    const commander = group.find((e) => e.isElite) ?? group.reduce((a, b) => (a.maxHp >= b.maxHp ? a : b));
    const key = commander.id;

    // 指挥官号令：每 8 秒一次猎杀宣言 + 全队狂暴
    const meta = GROUP_META.get(key) ?? { lastHowl: -99 };
    meta.lastHowl = meta.lastHowl ?? -99;
    if (groupClock - meta.lastHowl >= 8) {
      meta.lastHowl = groupClock;
      fx.vfxRing(commander.x, commander.y, commander.isElite ? '#f97316' : '#94a3b8');
      fx.say(commander.x, commander.y - 1.1, commander.isElite ? '👑 精英发出猎杀号令！' : '（低吼：包围它！）', '#f97316');
    }
    GROUP_META.set(key, meta);

    // 阵型分配 + 转向
    group.forEach((member, idx) => {
      // 指挥官自身：光环压阵，缓慢逼近
      if (member === commander) {
        member.packAggroBoost = 1;
        steerToward(member, ctx.player.x, ctx.player.y, ctx.dt, 1.2);
        return;
      }

      // 全队狂暴增益（精英在场）
      member.packAggroBoost = commander.isElite ? 1.25 : 1;

      // 环位：远程怪外环放风筝，其余内环；每三个成员一个绕后侧翼位
      const ranged = (member.range ?? 1.2) > 2.4;
      const flanker = idx % 3 === 2;
      const ringRadius = ranged ? RING_RANGED : flanker ? RING_MELEE + 0.6 : RING_MELEE;
      const baseAngle = idAngle(member.id);
      const slotAngle = flanker ? baseAngle + Math.PI : baseAngle + (idx / group.length) * Math.PI * 2;
      const anchorX = ctx.player.x + Math.cos(slotAngle) * ringRadius;
      const anchorY = ctx.player.y + Math.sin(slotAngle) * ringRadius * 0.75;

      const ddx = anchorX - member.x;
      const ddy = anchorY - member.y;
      const ddist = Math.hypot(ddx, ddy);
      // 已在攻击位附近则交给行为树直接输出，否则向阵位转向
      if (ddist > (ranged ? 0.8 : 0.35)) {
        steerToward(member, anchorX, anchorY, ctx.dt, STEER_SPEED);
      }
    });
  }
}

/** 轻量转向：直接位移（与行为树/机制层互不干扰） */
function steerToward(enemy: Enemy, tx: number, ty: number, dt: number, speed: number): void {
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.05) return;
  const step = Math.min(dist, speed * dt);
  enemy.x += (dx / dist) * step;
  enemy.y += (dy / dist) * step;
}

/** 清空编队（区域切换时） */
export function resetSquads(): void {
  GROUP_META.clear();
  groupClock = 0;
}
