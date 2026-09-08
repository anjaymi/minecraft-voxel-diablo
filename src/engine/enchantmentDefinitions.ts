import { EnchantmentChoice } from '../types';
import { MAGE_ENCHANTMENTS } from './mageEnchantments';

export const ROGUELIKE_ENCHANTMENTS: EnchantmentChoice[] = [
  {
    id: 'sharpness',
    name: '锋利 (Sharpness)',
    enName: 'Sharpness',
    description: '基础物理攻击力提高 +25%',
    icon: '⚔️',
    tier: 1,
    effect: (p) => {
      p.stats.attack = Math.round(p.stats.attack * 1.25);
    },
  },
  {
    id: 'fire_aspect',
    name: '火焰附加 (Fire Aspect)',
    enName: 'Fire Aspect',
    description: '挥砍和箭矢命中敌人时附加烈焰燃烧，3秒内造成持续灼烧',
    icon: '🔥',
    tier: 1,
    effect: (p) => {
      p.stats.attack += 5;
    },
  },
  {
    id: 'sweeping_edge',
    name: '横扫之刃 (Sweeping Edge)',
    enName: 'Sweeping Edge',
    description: '挥剑攻击转为360度大范围旋风斩，对群体怪物造成毁灭打击',
    icon: '🌪️',
    tier: 2,
    effect: (p) => {
      p.stats.critChance += 0.1;
    },
  },
  {
    id: 'thorns_protection',
    name: '保护与荆棘 (Thorns)',
    enName: 'Thorns & Protection',
    description: '受到的所有伤害降低 20%，并将 40% 的伤害反弹给攻击者',
    icon: '🛡️',
    tier: 1,
    effect: (p) => {
      p.stats.defense += 8;
      p.stats.maxHp += 30;
      p.stats.hp = Math.min(p.stats.hp + 30, p.stats.maxHp);
    },
  },
  {
    id: 'swiftness_aura',
    name: '迅捷药水光环 (Speed Boost)',
    enName: 'Swiftness',
    description: '移动速度提高 +20%，战术翻滚冲刺冷却时间缩短 35%',
    icon: '⚡',
    tier: 1,
    effect: (p) => {
      p.stats.speed += 0.5;
    },
  },
  {
    id: 'golden_apple',
    name: '金苹果赐福 (Golden Apple)',
    enName: 'Golden Apple Aura',
    description: '最大生命上限 +50 并立即回满；金苹果被动光环每 3 秒自动恢复 5% 最大生命值',
    icon: '🍏',
    tier: 2,
    effect: (p) => {
      p.stats.maxHp += 50;
      p.stats.hp = p.stats.maxHp;
    },
  },
  {
    id: 'demolitionist',
    name: 'TNT爆破专家 (Demolitionist)',
    enName: 'TNT Barrage',
    description: '立刻获得 5 枚 TNT 炸药',
    icon: '🧨',
    tier: 2,
    effect: (p) => {
      p.stats.tntCount += 5;
    },
  },
  {
    id: 'vampiric_touch',
    name: '吸血之吻 (Vampirism)',
    enName: 'Vampirism',
    description: '所有武器伤害获得 +8% 的击中吸血效果，暴击时额外回血',
    icon: '🩸',
    tier: 2,
    effect: (p) => {
      p.stats.lifeSteal += 0.08;
    },
  },
  {
    id: 'multishot_pierce',
    name: '多重穿透之箭 (Multishot)',
    enName: 'Multishot & Piercing',
    description: '基础攻击力 +8',
    icon: '🏹',
    tier: 1,
    effect: (p) => {
      p.stats.attack += 8;
    },
  },
  {
    id: 'looting_fortune',
    name: '抢夺与时运 (Looting)',
    enName: 'Fortune & Looting',
    description: '立刻获得 20 枚绿宝石',
    icon: '💎',
    tier: 1,
    effect: (p) => {
      p.stats.emeralds += 20;
    },
  },
  // Seamlessly integrate the comprehensive Magic / Summoner / Druid enchantments
  ...MAGE_ENCHANTMENTS,
];
