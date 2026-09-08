import { Enemy, Player } from '../../types';
import { worldToScreen } from '../isometric';
import { GoodSmilePlayerRenderer } from '../goodsmile/GoodSmilePlayerRenderer';
import { classSystem } from '../classSystem';
import { CharacterClassId } from '../../types';
import { AdventurerEntity } from './AdventurerActor';
import { assignPresetSkin, renderPresetSkin } from './PresetSkinRenderer';

/**
 * AdventurerRenderer — 用玩家骨骼框架渲染冒险者。
 *
 * 友方冒险者：直接以实体携带的伪玩家调用 GoodSmilePlayerRenderer，
 * 与玩家同一套骨骼/装备/攻击动画。
 *
 * 敌对掠夺者：Enemy 实体（可被玩家攻击、走怪物 AI），
 * 通过 defId 前缀 'adv_' 触发本渲染器的骨架覆写——外形依然是人形冒险者。
 */

/** 敌对掠夺者的伪玩家缓存（每个 Enemy 只构建一次骨骼数据） */
const banditActorCache = new WeakMap<Enemy, Player>();

const BANDIT_CLASSES: CharacterClassId[] = ['warrior', 'ranger', 'rogue'];

/** 由 Enemy 的稳定 id 派生伪玩家（同一只掠夺者外观恒定） */
function getBanditActor(enemy: Enemy): Player {
  let actor = banditActorCache.get(enemy);
  if (actor) return actor;

  let hash = 0;
  for (let i = 0; i < enemy.id.length; i++) {
    hash = (hash * 31 + enemy.id.charCodeAt(i)) >>> 0;
  }
  const banditClass = BANDIT_CLASSES[hash % BANDIT_CLASSES.length];
  actor = {
    characterClass: banditClass,
    x: enemy.x, y: enemy.y, z: enemy.z || 0,
    vx: 0, vy: 0,
    targetX: null, targetY: null,
    facingAngle: 0,
    stats: {
      hp: enemy.hp, maxHp: enemy.maxHp, mana: 0, maxMana: 0,
      attack: enemy.damage, defense: enemy.defense, critChance: 0.1, speed: enemy.speed, lifeSteal: 0,
      exp: 0, maxExp: 100, level: 1, emeralds: 0, potions: 0, tntCount: 0, enderPearls: 0,
    },
    equipment: classSystem.generateStartingGear(BANDIT_CLASSES[hash % BANDIT_CLASSES.length]),
    inventory: [],
    isAttacking: enemy.state === 'attack' || enemy.state === 'windup',
    attackCooldown: 0,
    attackTimer: enemy.attackTimer > 0 ? 0.25 : 0,
    comboStep: 0,
    comboTimer: 0,
    isBowAiming: false,
    bowDrawProgress: 0,
    hurtTimer: enemy.hitTimer > 0 ? 0.1 : 0,
    dashCooldown: 0,
    isDashing: false,
    dashTimer: 0,
    dashTrail: [],
    invulnerableTimer: 0,
    enchantments: [],
    skillPoints: 0,
    unlockedSkills: {},
    activeSkills: {},
    skillCooldowns: {},
    goldenAppleTimer: 0,
    whirlwindTimer: 0,
    shieldBlockTimer: 0,
    aimingMode: 'none',
  };
  // 掠夺者同样穿预设像素皮肤（圣骑/法师/忍者），缺失会回退到废弃的黏土人
  assignPresetSkin(actor, banditClass, () => (hash % 1000) / 1000);
  banditActorCache.set(enemy, actor);
  return actor;
}

function drawSkeletonActor(
  ctx: CanvasRenderingContext2D,
  actor: Player,
  screenX: number,
  screenY: number,
  time: number,
  facingLeft: boolean
): void {
  ctx.save();
  ctx.translate(screenX, screenY);
  // 首选：预设像素皮肤（与玩家同视觉语言）；黏土人仅作图片未就绪时的回退
  const drawn = renderPresetSkin(ctx, actor, time);
  if (!drawn) {
    if (actor.hurtTimer > 0) {
      ctx.filter = 'drop-shadow(0 0 5px #ef4444) brightness(1.3)';
    }
    GoodSmilePlayerRenderer.renderFigurine(ctx, actor, time, facingLeft);
  }
  ctx.filter = 'none';
  ctx.restore();
}

function drawHealthBar(ctx: CanvasRenderingContext2D, cx: number, topY: number, ratio: number, color: string): void {
  const w = 26;
  ctx.fillStyle = 'rgba(10, 10, 16, 0.75)';
  ctx.fillRect(cx - w / 2 - 1, topY - 1, w + 2, 4.5);
  ctx.fillStyle = color;
  ctx.fillRect(cx - w / 2, topY, w * Math.max(0, Math.min(1, ratio)), 2.5);
}

/** 友方冒险者主入口（renderables 深度排序层调用） */
export function drawAdventurer(
  ctx: CanvasRenderingContext2D,
  ent: AdventurerEntity,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number,
  time: number
): void {
  const actor = ent.actor;
  const s = worldToScreen(actor.x, actor.y, 0, camX, camY, viewportWidth, viewportHeight);

  // 地面阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 2, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 求救：瘫坐姿态（压扁 + 下沉）+ 感叹标记
  if (ent.state === 'rescue') {
    ctx.save();
    ctx.translate(s.x, s.y + 3);
    ctx.scale(1.05, 0.72);
    drawSkeletonActor(ctx, actor, 0, 0, time, ent.facingLeft);
    ctx.restore();
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❗', s.x, s.y - 46 + Math.sin(time * 4) * 2.5);
  } else {
    const facingLeft = Math.abs(actor.vx) > 0.01 ? actor.vx < 0 : ent.facingLeft;
    drawSkeletonActor(ctx, actor, s.x, s.y, time, facingLeft);
    // 邀请加入：头顶问号
    if (ent.state === 'join_offer') {
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('？', s.x, s.y - 46 + Math.sin(time * 3) * 2);
    }
  }

  // 名字与血条（血量不满时显示）
  ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(ent.name, s.x, s.y - 38);
  if (ent.hp < ent.maxHp || ent.state === 'follow') {
    drawHealthBar(ctx, s.x, s.y - 35, ent.hp / ent.maxHp, ent.state === 'follow' ? '#38bdf8' : '#4ade80');
  }

  // 队伍契约倒计时（跟随态且 <90s 时显示 ⏱ 警示）
  if (ent.state === 'follow' && ent.serviceDuration < 90) {
    const warn = ent.serviceDuration < 30;
    ctx.fillStyle = warn ? '#f87171' : '#fcd34d';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`⏱ ${Math.ceil(ent.serviceDuration)}s`, s.x, s.y - 47 + Math.sin(time * 3) * 1.5);
  }
}

/** 敌对掠夺者：Enemy 的骨架覆写（在 drawEnemy 的 alpha 沙盒内调用） */
export function drawBanditAdventurer(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number,
  time: number
): void {
  const actor = getBanditActor(enemy);
  actor.x = enemy.x;
  actor.y = enemy.y;
  actor.isAttacking = enemy.state === 'attack' || enemy.state === 'windup';
  const s = worldToScreen(enemy.x, enemy.y, enemy.z || 0, camX, camY, viewportWidth, viewportHeight);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 2, 9, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const facingLeft = (enemy.facingAngle ?? 0) === 0;
  // 掠夺者：预设皮肤 + 敌对红调
  const skinned = renderPresetSkin(ctx, actor, time, true);
  if (!skinned) {
    drawSkeletonActor(ctx, actor, s.x, s.y, time, facingLeft);
  }

  ctx.fillStyle = '#fca5a5';
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name, s.x, s.y - 38);
  drawHealthBar(ctx, s.x, s.y - 35, enemy.hp / Math.max(1, enemy.maxHp), '#ef4444');
}
