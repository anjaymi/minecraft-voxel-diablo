import { CharacterClassId, Item, ItemRarity } from '../types';

export interface ClassAffixDefinition {
  name: string;
  type: 'arcane_pen' | 'spell_power' | 'minion_hp' | 'summon_dmg' | 'nature_dmg' | 'hybrid';
  classId: CharacterClassId;
  desc: string;
  apply: (item: Item, floor: number, multiplier: number) => void;
}

export const CLASS_EXCLUSIVE_AFFIXES: ClassAffixDefinition[] = [
  // --- Mage Affixes (奥术法师) ---
  {
    name: '奥术穿透',
    type: 'arcane_pen',
    classId: 'mage',
    desc: '法术穿透敌人护甲，造成接近真实伤害',
    apply: (item, floor, mult) => {
      const val = Math.round((8 + floor * 3.5) * mult);
      item.arcanePenetrationBonus = (item.arcanePenetrationBonus || 0) + val;
      item.description += ` [奥术穿透 +${val}]`;
    },
  },
  {
    name: '魔能激涌',
    type: 'spell_power',
    classId: 'mage',
    desc: '法术法强巨幅攀升，提升所有元素法球威力',
    apply: (item, floor, mult) => {
      const val = Math.round((14 + floor * 6) * mult);
      item.spellPowerBonus = (item.spellPowerBonus || 0) + val;
      item.description += ` [法术强度 +${val}]`;
    },
  },
  {
    name: '星界回响',
    type: 'hybrid',
    classId: 'mage',
    desc: '法强提升并提高法术暴击几率',
    apply: (item, floor, mult) => {
      const val = Math.round((10 + floor * 4) * mult);
      item.spellPowerBonus = (item.spellPowerBonus || 0) + val;
      item.critChanceBonus = Number(((item.critChanceBonus || 0) + 0.08 * mult).toFixed(2));
      item.description += ` [法强 +${val} / 暴击 +${Math.round(8 * mult)}%]`;
    },
  },

  // --- Summoner Affixes (死灵召唤师) ---
  {
    name: '军团御体',
    type: 'minion_hp',
    classId: 'summoner',
    desc: '随从仆从生命值大幅上浮，增强战场生存力',
    apply: (item, floor, mult) => {
      const val = Number(((0.22 + floor * 0.06) * mult).toFixed(2));
      item.minionHpBonus = Number(((item.minionHpBonus || 0) + val).toFixed(2));
      item.description += ` [召唤物生命 +${Math.round(val * 100)}%]`;
    },
  },
  {
    name: '唤灵狂潮',
    type: 'summon_dmg',
    classId: 'summoner',
    desc: '随从战团伤害倍率激增，撕裂前线敌人',
    apply: (item, floor, mult) => {
      const val = Number(((0.18 + floor * 0.05) * mult).toFixed(2));
      item.summonDamageBonus = Number(((item.summonDamageBonus || 0) + val).toFixed(2));
      item.description += ` [召唤物伤害 +${Math.round(val * 100)}%]`;
    },
  },
  {
    name: '冥界契约',
    type: 'hybrid',
    classId: 'summoner',
    desc: '随从伤害增幅并附带灵魂吸血回流',
    apply: (item, floor, mult) => {
      const val = Number(((0.14 + floor * 0.04) * mult).toFixed(2));
      item.summonDamageBonus = Number(((item.summonDamageBonus || 0) + val).toFixed(2));
      item.lifeStealBonus = Number(((item.lifeStealBonus || 0) + 0.05 * mult).toFixed(2));
      item.description += ` [随从伤害 +${Math.round(val * 100)}% / 吸血 +5%]`;
    },
  },

  // --- Druid Affixes (荒野德鲁伊) ---
  {
    name: '自然神罚',
    type: 'nature_dmg',
    classId: 'druid',
    desc: '德鲁伊自然与风暴荆棘法伤加成',
    apply: (item, floor, mult) => {
      const val = Number(((0.24 + floor * 0.07) * mult).toFixed(2));
      item.natureDamageBonus = Number(((item.natureDamageBonus || 0) + val).toFixed(2));
      item.description += ` [自然法伤 +${Math.round(val * 100)}%]`;
    },
  },
  {
    name: '大地生机',
    type: 'hybrid',
    classId: 'druid',
    desc: '自然法伤提升与高额生命护体',
    apply: (item, floor, mult) => {
      const val = Number(((0.16 + floor * 0.04) * mult).toFixed(2));
      const hp = Math.round((35 + floor * 15) * mult);
      item.natureDamageBonus = Number(((item.natureDamageBonus || 0) + val).toFixed(2));
      item.hpBonus = (item.hpBonus || 0) + hp;
      item.description += ` [自然法伤 +${Math.round(val * 100)}% / 生命 +${hp}]`;
    },
  },
  {
    name: '荆棘守护',
    type: 'hybrid',
    classId: 'druid',
    desc: '提升坚韧护甲并增强荆棘自然反伤',
    apply: (item, floor, mult) => {
      const val = Number(((0.14 + floor * 0.03) * mult).toFixed(2));
      const def = Math.round((6 + floor * 3) * mult);
      item.natureDamageBonus = Number(((item.natureDamageBonus || 0) + val).toFixed(2));
      item.defenseBonus = (item.defenseBonus || 0) + def;
      item.description += ` [自然法伤 +${Math.round(val * 100)}% / 护甲 +${def}]`;
    },
  },
];

/**
 * Applies targeted class affixes and item adjustments based on player's chosen class.
 */
export function applyClassLootAffixes(
  item: Item,
  playerClass: CharacterClassId | undefined,
  floor: number,
  rarity: ItemRarity
): void {
  if (!playerClass) return;

  const relevantAffixes = CLASS_EXCLUSIVE_AFFIXES.filter((a) => a.classId === playerClass);
  if (relevantAffixes.length === 0) return;

  // Probability of rolling a class-specific affix scales with rarity
  const chance = rarity === 'legendary' ? 0.95 : rarity === 'rare' ? 0.75 : rarity === 'magic' ? 0.55 : 0.25;
  if (Math.random() > chance) return;

  const mult = rarity === 'legendary' ? 1.8 : rarity === 'rare' ? 1.4 : rarity === 'magic' ? 1.1 : 0.8;
  const pickedAffix = relevantAffixes[Math.floor(Math.random() * relevantAffixes.length)];

  item.affixes.push(pickedAffix.name);
  pickedAffix.apply(item, floor, mult);

  // Set recommended class
  item.recommendedClass = playerClass;

  // Add distinct glow according to the class affinity
  if (playerClass === 'mage') {
    item.glowColor = '#c084fc';
    item.glowIntensity = Math.min(1.0, (item.glowIntensity || 0.6) + 0.25);
  } else if (playerClass === 'summoner') {
    item.glowColor = '#818cf8';
    item.glowIntensity = Math.min(1.0, (item.glowIntensity || 0.6) + 0.25);
  } else if (playerClass === 'druid') {
    item.glowColor = '#34d399';
    item.glowIntensity = Math.min(1.0, (item.glowIntensity || 0.6) + 0.25);
  }
}
