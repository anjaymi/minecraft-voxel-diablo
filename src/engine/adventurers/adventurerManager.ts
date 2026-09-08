import { DungeonFloor, Player } from '../../types';
import { AdventurerEntity, createAdventurerEntity } from './AdventurerActor';
import { updateAdventurer } from './adventurerAI';

/**
 * adventurerManager — 野外冒险者管理器。
 *
 * 生成：荒原/生态区随机出现 1-2 位（可能已负伤求救）；
 * 行为：狩魔、搜刮、邀加入、跟随并肩作战；
 * 交互：救援（回复+谢礼）与接受入队。
 */

export interface UpdateContext {
  dt: number;
  floor: DungeonFloor;
  player: Player;
  enemies: import('../../types').Enemy[];
  drops: import('../../types').DropItem[];
  isWalkable: (x: number, y: number) => boolean;
  damageEnemy: (enemy: import('../../types').Enemy, damage: number, isCrit: boolean) => void;
  say: (x: number, y: number, text: string, color?: string) => void;
  onCollectEmerald: (amount: number) => void;
  onCollectExp: (amount: number) => void;
  onCollectItem: (item: import('../../types').Item, rarity: string) => void;
}

/** 入队契约时长（秒） */
const PARTY_DURATION = 240;
/** 契约临期警告 */
const DURATION_WARN_AT = 45;

export class AdventurerManager {
  private adventurers: AdventurerEntity[] = [];
  private idCounter = 0;
  /** 队友双击检测（告别） */
  private lastClickAt = new Map<string, number>();

  public getAll(): AdventurerEntity[] {
    return this.adventurers;
  }

  public clear(): void {
    this.adventurers = [];
  }

  /** 野外区域生成 1-2 位冒险者（远离出生点，可走格） */
  public spawnForZone(floor: DungeonFloor): void {
    const isWild = floor.zoneType === 'overworld' || !['town', 'dungeon', 'nether', 'end'].includes(floor.zoneType);
    if (!isWild) return;

    const count = 2 + (Math.random() < 0.5 ? 1 : 0);
    const tier = Math.max(1, Math.min(3, Math.ceil((floor.floorNumber || 1) / 1)));

    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 30; attempt++) {
        const x = 5 + Math.random() * (floor.width - 10);
        const y = 5 + Math.random() * (floor.height - 10);
        if (Math.hypot(x - floor.spawnX, y - floor.spawnY) < 7) continue;
        const tile = floor.tiles[Math.round(y)]?.[Math.round(x)];
        if (!tile || ['wall', 'water', 'tree', 'building', 'void', 'lava'].includes(tile)) continue;

        const id = `adv_${Date.now()}_${this.idCounter++}`;
        const ent = createAdventurerEntity(id, x, y, tier);
        ent.wanderTx = x;
        ent.wanderTy = y;
        this.adventurers.push(ent);
        break;
      }
    }
  }

  /** 每帧更新 */
  public update(ctx: UpdateContext): void {
    for (let i = this.adventurers.length - 1; i >= 0; i--) {
      const ent = this.adventurers[i];
      ent.actor.attackTimer = Math.max(0, ent.actor.attackTimer - ctx.dt);
      if (ent.actor.attackTimer <= 0) ent.actor.isAttacking = false;

      // 玩家 Buff 共享：锋利附魔 → 队友增伤；迅捷光环 → 队友加速；金苹果神佑 → 持续回复
      const buffDmgMult = ctx.player.enchantments.some((e) => e.id === 'sharpness') ? 1.2 : 1;
      const buffSpeedMult = ctx.player.enchantments.some((e) => e.id === 'swiftness_aura') ? 1.15 : 1;

      // 队伍契约计时：仅跟随态倒计时，归零告别离队
      if (ent.state === 'follow') {
        if (ctx.player.goldenAppleTimer > 0 && ent.hp < ent.maxHp) {
          ent.hp = Math.min(ent.maxHp, ent.hp + ent.maxHp * 0.02 * ctx.dt);
        }
        ent.serviceDuration -= ctx.dt;
        if (ent.serviceDuration <= 0) {
          ctx.say(ent.actor.x, ent.actor.y - 0.6, `${ent.name}：契约期满，后会有期！`, '#94a3b8');
          this.adventurers.splice(i, 1);
          continue;
        }
        if (ent.serviceDuration < DURATION_WARN_AT && ent.callTimer <= 0) {
          ctx.say(ent.actor.x, ent.actor.y - 0.6, `契约还剩 ${Math.ceil(ent.serviceDuration)}s！送我武器可以续约～`, '#fbbf24');
          ent.callTimer = 8;
        }
        this.autoPickup(ent, ctx);
      }

      updateAdventurer(ent, {
        dt: ctx.dt,
        enemies: ctx.enemies,
        playerX: ctx.player.x,
        playerY: ctx.player.y,
        isWalkable: ctx.isWalkable,
        damageEnemy: ctx.damageEnemy,
        say: (ent2, text, color) => ctx.say(ent2.actor.x, ent2.actor.y - 0.6, text, color),
        damageMult: ent.state === 'follow' ? buffDmgMult : 1,
        speedMult: ent.state === 'follow' ? buffSpeedMult : 1,
      });
    }
  }

  /**
   * 玩家点击交互：救援 / 接受入队。
   * @returns 是否命中某位冒险者
   */
  public interactAt(
    x: number,
    y: number,
    player: Player,
    fx: { text: (x: number, y: number, t: string, c?: string) => void; heal: () => void }
  ): boolean {
    for (const ent of this.adventurers) {
      const clickDist = Math.hypot(x - ent.actor.x, y - ent.actor.y);
      const playerDist = Math.hypot(player.x - ent.actor.x, player.y - ent.actor.y);
      if (clickDist > 2.5 || playerDist > 3.6) continue;

      if (ent.state === 'rescue') {
        ent.hp = Math.round(ent.maxHp * 0.65);
        ent.state = 'roam';
        const reward = 10 + ent.level * 5;
        player.stats.emeralds += reward;
        fx.text(ent.actor.x, ent.actor.y - 0.6, `谢谢你！这些绿宝石请收下（+${reward}）`, '#fbbf24');
        fx.heal();
        return true;
      }

      if (ent.state === 'join_offer') {
        ent.state = 'follow';
        ent.askedToJoin = true;
        ent.serviceDuration = PARTY_DURATION;
        fx.text(ent.actor.x, ent.actor.y - 0.6, `${ent.name}加入了队伍！契约 ${PARTY_DURATION / 60 | 0} 分钟`, '#38bdf8');
        fx.heal();
        return true;
      }

      // 已入队：单击赠送武器 / 双击告别
      if (ent.state === 'follow') {
        const now = Date.now();
        const isDouble = now - (this.lastClickAt.get(ent.id) ?? 0) < 400;
        this.lastClickAt.set(ent.id, now);

        if (isDouble) {
          this.farewell(ent, fx, '后会有期，冒险者！');
          return true;
        }
        this.giveWeapon(ent, player, fx);
        return true;
      }

      // 普通冒险者：打招呼
      fx.text(ent.actor.x, ent.actor.y - 0.6, `${ent.name}：荒原凶险，保重。`, '#e2e8f0');
      return true;
    }
    return false;
  }

  /** 已入队成员数量（HUD 展示用） */
  public countFollowers(): number {
    return this.adventurers.filter((e) => e.state === 'follow').length;
  }

  /** 告别：队友离队（契约期满或玩家双击） */
  private farewell(ent: AdventurerEntity, fx: { text: (x: number, y: number, t: string, c?: string) => void }, reason: string): void {
    fx.text(ent.actor.x, ent.actor.y - 0.6, `${ent.name}：${reason}`, '#94a3b8');
    ent.state = 'roam';
    ent.serviceDuration = 0;
    const idx = this.adventurers.indexOf(ent);
    if (idx !== -1) this.adventurers.splice(idx, 1);
  }

  /** 赠送武器：把玩家背包第一把武器给队友（旧武器换回），契约 +60s */
  private giveWeapon(ent: AdventurerEntity, player: Player, fx: { text: (x: number, y: number, t: string, c?: string) => void }): void {
    const gifted = player.inventory.find((i) => i.slot === 'weapon');
    if (!gifted) {
      fx.text(ent.actor.x, ent.actor.y - 0.6, '背包里放一把武器，就能赠给队友！', '#94a3b8');
      return;
    }
    player.inventory.splice(player.inventory.indexOf(gifted), 1);
    const old = ent.actor.equipment.weapon;
    if (old) player.inventory.push(old);
    ent.actor.equipment.weapon = gifted;
    const bonus = Math.round((gifted.attackBonus || 0) * 0.6);
    ent.damage = ent.baseDamage + bonus;
    ent.serviceDuration = Math.min(600, ent.serviceDuration + 60);
    fx.text(ent.actor.x, ent.actor.y - 0.6, `${ent.name} 装备了 ${gifted.name}！契约 +60s`, '#fbbf24');
  }

  /** 队友自动拾取：身旁掉落物直接入队结算（归玩家） */
  private autoPickup(ent: AdventurerEntity, ctx: UpdateContext): void {
    const pickupRadius = 2.2;
    for (let i = ctx.drops.length - 1; i >= 0; i--) {
      const drop = ctx.drops[i];
      if (Math.hypot(drop.x - ent.actor.x, drop.y - ent.actor.y) > pickupRadius) continue;
      if (drop.isEmerald) {
        ctx.onCollectEmerald(drop.amount);
        ctx.say(drop.x, drop.y - 0.4, `+${drop.amount} 绿宝石（${ent.name}拾取）`, '#4ade80');
      } else if (drop.isExp) {
        ctx.onCollectExp(drop.amount);
      } else if (drop.item) {
        ctx.onCollectItem(drop.item, drop.rarity);
        ctx.say(drop.x, drop.y - 0.4, `${ent.name} 替你捡起了 ${drop.item.name}`, '#fbbf24');
      }
      ctx.drops.splice(i, 1);
    }
  }
}

export const adventurerManager = new AdventurerManager();
