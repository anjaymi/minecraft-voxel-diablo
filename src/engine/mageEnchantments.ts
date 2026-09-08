import { EnchantmentChoice, Player } from '../types';

export const MAGE_ENCHANTMENTS: EnchantmentChoice[] = [
  {
    id: 'arcane_echo',
    name: '奥术共鸣回响 (Arcane Echo)',
    enName: 'Arcane Echo',
    description: '法术强度 +25，暴击几率 +8%',
    icon: '🔮',
    tier: 1,
    effect: (p: Player) => {
      p.spellPower = (p.spellPower || 0) + 25;
      p.stats.critChance += 0.08;
    },
  },
  {
    id: 'mana_cascade',
    name: '法力奔流 (Mana Cascade)',
    enName: 'Mana Cascade',
    description: '最大法力值 +60 并立即回满，暴击几率 +6%',
    icon: '💧',
    tier: 1,
    effect: (p: Player) => {
      p.stats.maxMana += 60;
      p.stats.mana = p.stats.maxMana;
      p.stats.critChance += 0.06;
    },
  },
  {
    id: 'summon_legion',
    name: '亡者军团统帅 (Legion Command)',
    enName: 'Legion Command',
    description: '召唤物伤害提高 +40%，最大生命值 +25',
    icon: '💀',
    tier: 2,
    effect: (p: Player) => {
      p.summonDamageBonus = (p.summonDamageBonus || 0) + 0.4;
      p.stats.maxHp += 25;
      p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + 25);
    },
  },
  {
    id: 'gaia_embrace',
    name: '盖亚自然荆棘 (Gaia Embrace)',
    enName: 'Gaia Embrace',
    description: '防御 +6，最大生命值 +45',
    icon: '🌿',
    tier: 2,
    effect: (p: Player) => {
      p.stats.defense += 6;
      p.stats.maxHp += 45;
      p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + 45);
    },
  },
  {
    id: 'astral_barrier',
    name: '星光灵能护盾 (Astral Barrier)',
    enName: 'Astral Barrier',
    description: '防御 +8，最大法力值 +40',
    icon: '✨',
    tier: 2,
    effect: (p: Player) => {
      p.stats.defense += 8;
      p.stats.maxMana += 40;
    },
  },
  {
    id: 'elemental_mastery',
    name: '元素亲和超载 (Elemental Overload)',
    enName: 'Elemental Overload',
    description: '攻击力 +8，法术强度 +18',
    icon: '⚡',
    tier: 1,
    effect: (p: Player) => {
      p.stats.attack += 8;
      p.spellPower = (p.spellPower || 0) + 18;
    },
  },
  {
    id: 'soul_reaper',
    name: '死灵灵魂收割 (Soul Harvester)',
    enName: 'Soul Harvester',
    description: '击中吸血 +5%，最大法力值 +30',
    icon: '🩸',
    tier: 1,
    effect: (p: Player) => {
      p.stats.lifeSteal += 0.05;
      p.stats.maxMana += 30;
    },
  },
  {
    id: 'druid_feral_rage',
    name: '野性巨熊狂暴 (Feral Rage)',
    enName: 'Feral Rage',
    description: '攻击力 +10，防御 +5',
    icon: '🐻',
    tier: 2,
    effect: (p: Player) => {
      p.stats.attack += 10;
      p.stats.defense += 5;
    },
  },
];
