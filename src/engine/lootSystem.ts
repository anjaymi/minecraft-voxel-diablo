import { Item, ItemRarity, EnchantmentChoice, Player, CharacterClassId } from '../types';
import { setBonusSystem, SET_DEFINITIONS } from './setBonusSystem';
import { applyClassLootAffixes } from './classLootAffixSystem';
import { isTwoHandedWeapon } from './weaponBaseTable';

export const RARITY_COLORS: Record<ItemRarity, { text: string; bg: string; border: string; glow: string; beam: string }> = {
  common: {
    text: '#d1d5db',
    bg: '#374151',
    border: '#6b7280',
    glow: 'rgba(156, 163, 175, 0.4)',
    beam: '#9ca3af',
  },
  magic: {
    text: '#60a5fa',
    bg: '#1e3a8a',
    border: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.6)',
    beam: '#3b82f6',
  },
  rare: {
    text: '#fbbf24',
    bg: '#78350f',
    border: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.7)',
    beam: '#f59e0b',
  },
  legendary: {
    text: '#f97316',
    bg: '#7c2d12',
    border: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.85)',
    beam: '#ea580c',
  },
};

const BASE_WEAPONS = [
  { name: '木剑 (Wooden Sword)', slot: 'weapon' as const, subType: 'sword' as const, baseAtk: 7, icon: 'wood_sword' },
  { name: '石剑 (Stone Sword)', slot: 'weapon' as const, subType: 'sword' as const, baseAtk: 11, icon: 'stone_sword' },
  { name: '铁剑 (Iron Sword)', slot: 'weapon' as const, subType: 'sword' as const, baseAtk: 18, icon: 'iron_sword' },
  { name: '破魂铁战斧 (Iron Battleaxe)', slot: 'weapon' as const, subType: 'axe' as const, baseAtk: 24, crit: 0.12, icon: 'iron_axe' },
  { name: '金阔剑 (Golden Claymore)', slot: 'weapon' as const, subType: 'sword' as const, baseAtk: 26, icon: 'gold_sword' },
  { name: '潜影幽魂匕首 (Shadow Dagger)', slot: 'weapon' as const, subType: 'dagger' as const, baseAtk: 22, spd: 0.4, lifesteal: 0.08, icon: 'shadow_dagger' },
  { name: '猎手复合弓 (Hunter Bow)', slot: 'weapon' as const, subType: 'bow' as const, baseAtk: 28, crit: 0.15, icon: 'bow' },
  { name: '钻石神剑 (Diamond Blade)', slot: 'weapon' as const, subType: 'sword' as const, baseAtk: 36, crit: 0.1, icon: 'diamond_sword' },
  { name: '劈山开山巨斧 (Cleaving Greataxe)', slot: 'weapon' as const, subType: 'axe' as const, baseAtk: 46, crit: 0.2, icon: 'diamond_axe' },
  { name: '星界学徒法杖 (Astral Staff)', slot: 'weapon' as const, subType: 'staff' as const, baseAtk: 26, crit: 0.12, icon: 'wood_sword' },
  { name: '噬魂死灵灵杖 (Soul Wand)', slot: 'weapon' as const, subType: 'wand' as const, baseAtk: 24, crit: 0.14, icon: 'stone_sword' },
  { name: '自然荆棘橡木魔杖 (Wild Thorn Wand)', slot: 'weapon' as const, subType: 'wand' as const, baseAtk: 28, crit: 0.1, icon: 'iron_sword' },
  { name: '大魔导师奥能神杖 (Archmage Staff)', slot: 'weapon' as const, subType: 'staff' as const, baseAtk: 48, crit: 0.2, icon: 'diamond_sword' },
  { name: '下界合金灭世巨刃 (Netherite Destroyer)', slot: 'weapon' as const, subType: 'sword' as const, baseAtk: 58, crit: 0.18, lifesteal: 0.06, icon: 'netherite_sword' },
  // ===== 双手武器（装备时占用双手，攻击成长 +35%）=====
  { name: '巨岩碎击大剑 (Greatsword)', slot: 'weapon' as const, subType: 'greatsword' as const, baseAtk: 34, crit: 0.14, icon: 'iron_sword' },
  { name: '圣殿骑士巨剑 (Temple Greatsword)', slot: 'weapon' as const, subType: 'greatsword' as const, baseAtk: 52, crit: 0.16, icon: 'diamond_sword' },
  { name: '崩岳战锤 (War Hammer)', slot: 'weapon' as const, subType: 'hammer' as const, baseAtk: 44, crit: 0.1, icon: 'iron_axe' },
  { name: '泰坦碎星锤 (Titan Maul)', slot: 'weapon' as const, subType: 'hammer' as const, baseAtk: 64, crit: 0.12, icon: 'diamond_axe' },
  { name: '猎风重弩 (Heavy Crossbow)', slot: 'weapon' as const, subType: 'crossbow' as const, baseAtk: 38, crit: 0.18, icon: 'bow' },
];

const BASE_OFFHANDS = [
  { name: '木制战盾 (Wooden Shield)', slot: 'offhand' as const, subType: 'shield' as const, baseDef: 4, hp: 20, icon: 'wood_shield' },
  { name: '古代预言秘典 (Ancient Tome)', slot: 'offhand' as const, subType: 'tome' as const, baseDef: 6, hp: 30, icon: 'wood_shield' },
  { name: '铁质壁垒盾 (Iron Tower Shield)', slot: 'offhand' as const, subType: 'shield' as const, baseDef: 10, hp: 45, icon: 'iron_shield' },
  { name: '死灵招魂图腾 (Necro Relic Totem)', slot: 'offhand' as const, subType: 'totem' as const, baseDef: 12, hp: 60, icon: 'totem' },
  { name: '钻石庇护巨盾 (Diamond Aegis Shield)', slot: 'offhand' as const, subType: 'shield' as const, baseDef: 22, hp: 90, icon: 'diamond_shield' },
  { name: '不死图腾 (Totem of Undying)', slot: 'offhand' as const, subType: 'totem' as const, baseDef: 12, hp: 120, icon: 'totem' },
  { name: '烈焰核石宝珠 (Blaze Core Orb)', slot: 'offhand' as const, subType: 'shield' as const, baseAtk: 16, baseDef: 8, icon: 'blaze_orb' },
  { name: '末影水晶秘宝 (Ender Crystal Relic)', slot: 'offhand' as const, subType: 'totem' as const, baseDef: 15, spd: 0.45, hp: 70, icon: 'ender_crystal' },
];

const BASE_ARMORS = [
  { name: '皮革皮甲 (Leather Tunic)', slot: 'armor' as const, subType: 'armor' as const, baseDef: 3, hp: 15, icon: 'leather_chest' },
  { name: '铁锁子甲 (Iron Chestplate)', slot: 'armor' as const, subType: 'armor' as const, baseDef: 8, hp: 35, icon: 'iron_chest' },
  { name: '黄金护甲 (Golden Armor of Greed)', slot: 'armor' as const, subType: 'armor' as const, baseDef: 12, hp: 55, icon: 'gold_chest' },
  { name: '钻石铠甲 (Diamond Chestplate)', slot: 'armor' as const, subType: 'armor' as const, baseDef: 20, hp: 100, icon: 'diamond_chest' },
  { name: '下界重装板甲 (Netherite Heavy Plate)', slot: 'armor' as const, subType: 'armor' as const, baseDef: 32, hp: 180, icon: 'netherite_chest' },
];

const BASE_HELMETS = [
  { name: '铁头盔 (Iron Helmet)', slot: 'helmet' as const, subType: 'helmet' as const, baseDef: 4, hp: 20, icon: 'iron_helmet' },
  { name: '海龟壳头盔 (Turtle Helmet)', slot: 'helmet' as const, subType: 'helmet' as const, baseDef: 8, hp: 50, icon: 'turtle_helmet' },
  { name: '钻石王冠 (Diamond Crown)', slot: 'helmet' as const, subType: 'helmet' as const, baseDef: 14, hp: 80, icon: 'diamond_helmet' },
  { name: '下界重盔 (Netherite Helm)', slot: 'helmet' as const, subType: 'helmet' as const, baseDef: 22, hp: 120, icon: 'netherite_helmet' },
  { name: '凋灵幻影战盔 (Wither Skull Visage)', slot: 'helmet' as const, subType: 'helmet' as const, baseDef: 26, hp: 140, icon: 'wither_helmet' },
];

const BASE_BOOTS = [
  { name: '皮革软靴 (Leather Boots)', slot: 'boots' as const, subType: 'boots' as const, baseDef: 2, spd: 0.2, icon: 'leather_boots' },
  { name: '铁战靴 (Iron Greaves)', slot: 'boots' as const, subType: 'boots' as const, baseDef: 6, spd: 0.35, icon: 'iron_boots' },
  { name: '深海潜行靴 (Depth Strider Boots)', slot: 'boots' as const, subType: 'boots' as const, baseDef: 10, spd: 0.5, icon: 'diamond_boots' },
  { name: '疾风行者靴 (Windrunner Greaves)', slot: 'boots' as const, subType: 'boots' as const, baseDef: 12, spd: 0.8, icon: 'wind_boots' },
  { name: '下界合金行者 (Netherite Striders)', slot: 'boots' as const, subType: 'boots' as const, baseDef: 18, spd: 0.7, icon: 'netherite_boots' },
];

const BASE_RINGS = [
  { name: '绿宝石指环 (Emerald Signet)', slot: 'ring' as const, subType: 'ring' as const, icon: 'emerald_ring' },
  { name: '不死图腾挂坠 (Totem of Undying Pendant)', slot: 'ring' as const, subType: 'ring' as const, icon: 'totem_ring' },
  { name: '红石能量戒指 (Redstone Flux Ring)', slot: 'ring' as const, subType: 'ring' as const, icon: 'redstone_ring' },
  { name: '末影之眼护符 (Eye of Ender Amulet)', slot: 'ring' as const, subType: 'ring' as const, icon: 'ender_ring' },
  { name: '海洋之心圣核 (Heart of the Sea Core)', slot: 'ring' as const, subType: 'ring' as const, icon: 'sea_ring' },
];

// 数值平衡(2026-09): 仅保留真实生效的词条（攻击/暴击/防御/吸血/速度/生命），移除只挂名不生效的假词条
const AFFIX_POOL = [
  { name: '锋锐', type: 'atk', desc: '攻击力大幅提高' },
  { name: '暴怒', type: 'crit', desc: '暴击几率提升' },
  { name: '坚如磐石', type: 'def', desc: '防御抵挡提高' },
  { name: '生命汲取', type: 'lifesteal', desc: '击中敌方吸血' },
  { name: '迅捷风暴', type: 'spd', desc: '移动与突进速度提升' },
  { name: '活力涌现', type: 'hp', desc: '最大生命值大幅提升' },
];

/**
 * 生成一件随机掉落装备。
 * @param floor 物品等级（内容等级或玩家等级）
 * @param forcedRarity 强制稀有度（如 Boss 必掉传奇）
 * @param playerClass 职业（决定职业专属词条池）
 * @param luck 掉落幸运 0~1（精英/高 tier/首领），只抬升“稀有度 + 基底档位”，不改词缀量级
 */
export function generateRandomItem(floor: number, forcedRarity?: ItemRarity, playerClass?: CharacterClassId, luck: number = 0): Item {
  const lvl = Math.max(1, Math.floor(floor));
  // 数值平衡(2026-09): 幸运等价于把本次掉落按更高等级掷稀有度/基底，最多 +5 档（削弱好运对稀有度的推动）
  const rollLvl = Math.min(16, lvl + Math.round(luck * 5));

  // Determine rarity
  let rarity: ItemRarity = 'common';
  if (forcedRarity) {
    rarity = forcedRarity;
  } else {
    // 数值平衡(2026-09): 好装备收窄 —— 传奇 3%~6%(真·稀有)、稀有 15%~26%，魔法档保持 ~30% 不掉档
    const roll = Math.random();
    const legT = Math.min(0.06, 0.03 + 0.0025 * rollLvl);
    const rareT = Math.min(0.26, 0.14 + 0.010 * rollLvl);
    if (roll < legT) rarity = 'legendary';
    else if (roll < legT + rareT) rarity = 'rare';
    else if (roll < Math.min(0.66, legT + rareT + 0.30)) rarity = 'magic';
    else rarity = 'common';
  }

  // Pick slot
  const slotRoll = Math.random();
  const pool = slotRoll < 0.28
    ? BASE_WEAPONS
    : slotRoll < 0.44
    ? BASE_OFFHANDS
    : slotRoll < 0.60
    ? BASE_ARMORS
    : slotRoll < 0.74
    ? BASE_HELMETS
    : slotRoll < 0.88
    ? BASE_BOOTS
    : BASE_RINGS;

  // Pick item from pool based on roll level
  // 数值平衡(2026-09): 高 ilvl / 高幸运才摸得到更强基底（木质→石→铁→钻石→下界 逐档开放）
  const accessible = Math.max(2, Math.min(pool.length, Math.floor(((rollLvl + 1) * pool.length) / 13)));
  const index = Math.floor(Math.random() * accessible);
  const base = pool[index];

  const rarityMultiplier = rarity === 'legendary' ? 2.5 : rarity === 'rare' ? 1.8 : rarity === 'magic' ? 1.3 : 1.0;

  const item: Item = {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: base.name,
    rarity,
    slot: base.slot,
    subType: base.subType,
    level: floor,
    icon: base.icon,
    description: '',
    affixes: [],
    value: Math.floor((18 + floor * 12) * rarityMultiplier),
  };

  if ('baseAtk' in base && base.baseAtk) {
    item.attackBonus = Math.floor(base.baseAtk * rarityMultiplier);
    // 双手武器：更高的攻击成长作为占用双手的补偿
    if (isTwoHandedWeapon(item.subType)) {
      item.attackBonus = Math.floor(item.attackBonus * 1.35);
      item.value = Math.floor(item.value * 1.25);
    }
  }
  if ('baseDef' in base && base.baseDef) {
    item.defenseBonus = Math.floor(base.baseDef * rarityMultiplier);
  }
  if ('hp' in base && base.hp) {
    item.hpBonus = Math.floor(base.hp * rarityMultiplier);
  }
  if ('spd' in base && base.spd) {
    item.speedBonus = Number((base.spd * (rarityMultiplier * 0.8)).toFixed(2));
  }
  if ('crit' in base && base.crit) {
    item.critChanceBonus = Number((base.crit * (rarityMultiplier * 0.6)).toFixed(2));
  }
  if ('lifesteal' in base && base.lifesteal) {
    item.lifeStealBonus = Number((base.lifesteal * (rarityMultiplier * 0.6)).toFixed(2));
  }

  // Unique effect for legendary items
  if (rarity === 'legendary') {
    if (base.name.includes('不死图腾')) {
      item.uniqueEffect = '致命伤害时豁免死亡，并立即恢复 60% 生命与 2.5 秒无敌！';
    } else if (base.name.includes('巨斧') || base.name.includes('战斧')) {
      item.uniqueEffect = '第 3 段重劈震击造成 150% 额外范围震荡伤害并击飞敌人！';
    } else if (base.name.includes('神弓')) {
      item.uniqueEffect = '箭矢附带烈焰爆破与击退效果！';
    } else if (base.name.includes('匕首')) {
      item.uniqueEffect = '攻击速度提升 30%，每次命中造成额外暗影撕裂吸血！';
    } else if (base.name.includes('盾') || base.name.includes('壁垒')) {
      item.uniqueEffect = '受击时有 30% 概率触发格挡反震，眩晕周围敌人 1 秒！';
    } else {
      item.uniqueEffect = '暗黑太古附魔：所有战斗属性额外获得 20% 增幅！';
    }
  }

  // Affixes based on rarity
  const numAffixes = rarity === 'legendary' ? 3 : rarity === 'rare' ? 2 : rarity === 'magic' ? 1 : 0;
  const shuffledAffixes = [...AFFIX_POOL].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numAffixes; i++) {
    const affix = shuffledAffixes[i];
    item.affixes.push(affix.name);

    // 数值平衡(2026-09): 暴击/吸血/速度随物品等级轻微成长，攻/防/血维持等比成长
    const affixLvl = Math.max(1, floor);
    if (affix.type === 'atk') item.attackBonus = (item.attackBonus || 0) + Math.floor(5 * floor);
    if (affix.type === 'def') item.defenseBonus = (item.defenseBonus || 0) + Math.floor(4 * floor);
    if (affix.type === 'hp') item.hpBonus = (item.hpBonus || 0) + Math.floor(30 * floor);
    if (affix.type === 'crit') item.critChanceBonus = Number(((item.critChanceBonus || 0) + Math.min(0.08, 0.04 + 0.004 * affixLvl)).toFixed(2));
    if (affix.type === 'lifesteal') item.lifeStealBonus = Number(((item.lifeStealBonus || 0) + Math.min(0.05, 0.025 + 0.0025 * affixLvl)).toFixed(2));
    if (affix.type === 'spd') item.speedBonus = Number(((item.speedBonus || 0) + Math.min(0.25, 0.15 + 0.01 * affixLvl)).toFixed(2));
  }

  // Apply Class-Specific Exclusive Affixes (Mage / Summoner / Druid)
  applyClassLootAffixes(item, playerClass, floor, rarity);

  // Resolve Set Membership
  const resolvedSetId = setBonusSystem.resolveItemSetId(item);
  if (resolvedSetId && SET_DEFINITIONS[resolvedSetId]) {
    item.setId = resolvedSetId;
    item.setName = SET_DEFINITIONS[resolvedSetId].name;
  }

  if (item.affixes.length > 0) {
    item.name = `[${item.affixes.join('·')}] ${item.name}`;
  }

  item.description = `等级 ${floor} 装备 · ${item.affixes.length > 0 ? item.affixes.join('，') : '标准附魔品'}`;

  return item;
}

export { ROGUELIKE_ENCHANTMENTS } from './enchantmentDefinitions';

