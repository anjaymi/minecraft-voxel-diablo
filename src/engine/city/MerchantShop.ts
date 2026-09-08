import { CharacterClassId, Item, ItemRarity, Player } from '../../types';
import { generateRandomItem } from '../lootSystem';

/**
 * MerchantShop — 行商随机商品池。
 *
 * 商品池随副本/区域刷新（travelToZone 重掷），玩家可花绿宝石手动刷新。
 * 档次随玩家等级成长；价格 = 物品价值 × 议价系数。
 */

export interface ShopEntry {
  item: Item;
  price: number;
  sold: boolean;
}

const POOL_SIZE = 6;
const RESTOCK_COST = 15;

/** 按等级带决定品质分布（roll 概率：普通/魔法/稀有/传奇） */
function rollRarity(level: number, rng: () => number): ItemRarity {
  const r = rng();
  if (level >= 8 && r < 0.06) return 'legendary';
  if (r < 0.18 + level * 0.01) return 'rare';
  if (r < 0.55) return 'magic';
  return 'common';
}

/** 生成一档商品池 */
function generatePool(level: number, playerClass: CharacterClassId, seed: () => number): ShopEntry[] {
  const pool: ShopEntry[] = [];
  const classes: CharacterClassId[] = [playerClass, 'warrior', 'ranger', 'mage', 'rogue', 'summoner', 'druid'];
  for (let i = 0; i < POOL_SIZE; i++) {
    const rarity = rollRarity(level, seed);
    // 混搭：3 件玩家职业倾向 + 3 件随机职业
    const cls = i < 3 ? playerClass : classes[Math.floor(seed() * classes.length)];
    const item = generateRandomItem(Math.max(1, level), rarity, cls);
    const price = Math.max(10, Math.round(item.value * 1.2));
    pool.push({ item, price, sold: false });
  }
  return pool;
}

class MerchantShopSystem {
  private pools = new Map<string, ShopEntry[]>();
  /** 池子所属的区域代（换区/下副本时失效） */
  private poolZoneKey = '';

  /** 取当前商品池（懒生成：等级取玩家当前值） */
  public getPool(player: Player): ShopEntry[] {
    const zoneKey = this.zoneKey;
    if (this.poolZoneKey !== zoneKey || !this.pools.has('main')) {
      this.poolZoneKey = zoneKey;
      this.pools.set('main', generatePool(player.stats.level, player.characterClass || 'warrior', Math.random));
    }
    return this.pools.get('main')!;
  }

  /** 玩家花宝石刷新商品池 */
  public restock(player: Player): { ok: boolean; message: string } {
    if (player.stats.emeralds < RESTOCK_COST) {
      return { ok: false, message: `刷新需要 ${RESTOCK_COST} 绿宝石` };
    }
    player.stats.emeralds -= RESTOCK_COST;
    this.pools.set('main', generatePool(player.stats.level, player.characterClass || 'warrior', Math.random));
    return { ok: true, message: '商品已刷新！' };
  }

  /** 购买一件商品 */
  public buy(player: Player, index: number): { ok: boolean; message: string; item?: Item } {
    const pool = this.getPool(player);
    const entry = pool[index];
    if (!entry || entry.sold) return { ok: false, message: '该商品已售出' };
    if (player.stats.emeralds < entry.price) {
      return { ok: false, message: `绿宝石不足（需 ${entry.price}）` };
    }
    player.stats.emeralds -= entry.price;
    entry.sold = true;
    player.inventory.push(entry.item);
    return { ok: true, message: `购得 ${entry.item.name}`, item: entry.item };
  }

  /** 换区/下副本时调用：商品池过期 */
  public invalidate(): void {
    this.poolZoneKey = '';
    this.pools.clear();
  }

  /** 当前区域代（由引擎写入，用于跨区失效判断） */
  public zoneKey = '';
}

export const merchantShop = new MerchantShopSystem();
export const SHOP_POOL_SIZE = POOL_SIZE;
export const SHOP_RESTOCK_COST = RESTOCK_COST;
