import { Item, CharacterClassId, WeaponSubType } from '../types';

export interface WeaponCombatParams {
  damageMultiplier: number;
  attackCooldown: number;
  attackDuration: number;
  attackRange: number;
  attackArc: number;
  knockbackForce: number;
  critBonus: number;
  speedRating: 'S' | 'A' | 'B' | 'C';
  perkDesc: string;
  hasAffinityBonus: boolean;
  affinityDesc: string;
}

export interface WeaponProfile {
  name: string;
  emoji: string;
  speedRating: 'S' | 'A' | 'B' | 'C';
  cooldown: number;
  duration: number;
  range: number;
  arc: number;
  knockback: number;
  dmgMult: number;
  critBonus: number;
  defaultPerk: string;
  recommendedClass: CharacterClassId;
  styleDescription: string;
}

export const WEAPON_PROFILES: Record<WeaponSubType, WeaponProfile> = {
  sword: {
    name: '重剑 / 长剑',
    emoji: '⚔️',
    speedRating: 'B',
    cooldown: 0.28,
    duration: 0.22,
    range: 2.3,
    arc: Math.PI * 0.75,
    knockback: 4.5,
    dmgMult: 1.0,
    critBonus: 0.05,
    defaultPerk: '均衡斩击：三连击流畅，终结击引发震荡冲击波',
    recommendedClass: 'warrior',
    styleDescription: '攻守兼备的经典兵刃，拥有适中的攻击范围与优秀的破阵连招。',
  },
  axe: {
    name: '战斧 / 巨斧',
    emoji: '🪓',
    speedRating: 'C',
    cooldown: 0.38,
    duration: 0.28,
    range: 2.6,
    arc: Math.PI * 0.9,
    knockback: 8.5,
    dmgMult: 1.35,
    critBonus: 0.12,
    defaultPerk: '重劈破阵：大范围扇形挥斩，巨额击退并粉碎格挡',
    recommendedClass: 'warrior',
    styleDescription: '沉重刚猛的劈砍兵刃，挥击弧度极大，终结技毁灭性砸地。',
  },
  greatsword: {
    name: '双手大剑 / 巨剑',
    emoji: '🗡️',
    speedRating: 'C',
    cooldown: 0.44,
    duration: 0.32,
    range: 2.8,
    arc: Math.PI * 0.95,
    knockback: 9.0,
    dmgMult: 1.65,
    critBonus: 0.14,
    defaultPerk: '巨刃崩地：双手挥斩惯性极大，蓄力跃空倒插大地引发震荡碎石',
    recommendedClass: 'warrior',
    styleDescription: '纯正双手重武器，势沉力猛，具有显著的手掌与武器惯性受力轨迹。',
  },
  dagger: {
    name: '影刃 / 匕首',
    emoji: '🗡️',
    speedRating: 'S',
    cooldown: 0.16,
    duration: 0.14,
    range: 1.7,
    arc: Math.PI * 0.45,
    knockback: 2.0,
    dmgMult: 0.85,
    critBonus: 0.18,
    defaultPerk: '刺客连刺：超频疾速连击，侧翼与背刺触发 1.85x 暴伤',
    recommendedClass: 'rogue',
    styleDescription: '轻巧致命的暗杀短兵，攻速极快且暴击率极高，擅长贴身割裂。',
  },
  bow: {
    name: '猎弓 / 战弓',
    emoji: '🏹',
    speedRating: 'A',
    cooldown: 0.26,
    duration: 0.2,
    range: 14.0,
    arc: 0,
    knockback: 3.5,
    dmgMult: 1.1,
    critBonus: 0.15,
    defaultPerk: '鹰眼穿杨：远距离暴击率与箭速翻倍，支持边走边射',
    recommendedClass: 'ranger',
    styleDescription: '精准致命的远程神兵，右键可蓄力发射高贯穿重型狙击箭。',
  },
  crossbow: {
    name: '强弩 / 连弩',
    emoji: '🎯',
    speedRating: 'B',
    cooldown: 0.32,
    duration: 0.24,
    range: 15.0,
    arc: 0,
    knockback: 6.0,
    dmgMult: 1.3,
    critBonus: 0.1,
    defaultPerk: '重弩破甲：强劲弹道100%穿透，强力击退一线敌群',
    recommendedClass: 'ranger',
    styleDescription: '机械强弩，箭速迅猛，破甲穿透力极强。',
  },
  staff: {
    name: '法杖 / 魔杖',
    emoji: '🪄',
    speedRating: 'A',
    cooldown: 0.22,
    duration: 0.18,
    range: 11.0,
    arc: 0,
    knockback: 3.0,
    dmgMult: 1.15,
    critBonus: 0.08,
    defaultPerk: '奥术共鸣：发射追踪飞弹，击中产生范围元素爆破',
    recommendedClass: 'mage',
    styleDescription: '蕴含充沛魔力的奥术引导器具，击中敌人产生魔法溅射与回蓝。',
  },
  wand: {
    name: '短杖 / 权杖',
    emoji: '🔮',
    speedRating: 'S',
    cooldown: 0.18,
    duration: 0.15,
    range: 10.0,
    arc: 0,
    knockback: 2.5,
    dmgMult: 0.95,
    critBonus: 0.1,
    defaultPerk: '瞬发施法：超低法力消耗，高速连续倾泻元素弹',
    recommendedClass: 'mage',
    styleDescription: '轻盈的施法手杖，主打高频率奥术飞弹压制。',
  },
  hammer: {
    name: '战锤 / 破魔锤',
    emoji: '🔨',
    speedRating: 'C',
    cooldown: 0.42,
    duration: 0.3,
    range: 2.7,
    arc: Math.PI * 1.0,
    knockback: 11.0,
    dmgMult: 1.5,
    critBonus: 0.08,
    defaultPerk: '震荡碎颅：攻击附带强眩晕硬直，无视目标 30% 护甲',
    recommendedClass: 'warrior',
    styleDescription: '势大力沉的钝击重兵，具有全兵刃中最高的击退与破甲震荡。',
  },
};

export class WeaponSystem {
  public static isWeapon(item: Item | null): boolean {
    if (!item) return false;
    return item.slot === 'weapon';
  }

  public static getWeaponProfile(subType?: string): WeaponProfile {
    if (subType && subType in WEAPON_PROFILES) {
      return WEAPON_PROFILES[subType as WeaponSubType];
    }
    return WEAPON_PROFILES.sword;
  }

  public static getWeaponEmoji(item: Item | null): string {
    if (!item) return '⚔️';
    if (item.subType && item.subType in WEAPON_PROFILES) {
      return WEAPON_PROFILES[item.subType as WeaponSubType].emoji;
    }
    if (item.name.includes('斧')) return '🪓';
    if (item.name.includes('弓')) return '🏹';
    if (item.name.includes('匕') || item.name.includes('刃')) return '🗡️';
    if (item.name.includes('杖')) return '🪄';
    if (item.name.includes('锤')) return '🔨';
    return '⚔️';
  }

  public static getWeaponCombatParams(weapon: Item | null, classId?: CharacterClassId): WeaponCombatParams {
    const subType = (weapon?.subType || 'sword') as WeaponSubType;
    const profile = this.getWeaponProfile(subType);

    let damageMultiplier = profile.dmgMult;
    let attackCooldown = weapon?.attackSpeedRating === 'S' ? 0.16 : weapon?.attackSpeedRating === 'C' ? 0.38 : profile.cooldown;
    let attackDuration = profile.duration;
    let attackRange = weapon?.weaponRange || profile.range;
    let attackArc = weapon?.weaponSweepArc || profile.arc;
    let knockbackForce = weapon?.knockbackForce || profile.knockback;
    let critBonus = profile.critBonus + (weapon?.critChanceBonus || 0);

    // Refinement level bonus: +4% dmg per refine level
    const refine = weapon?.refineLevel || 0;
    if (refine > 0) {
      damageMultiplier += refine * 0.05;
      critBonus += refine * 0.02;
    }

    // Class Weapon Affinity check
    const hasAffinity = Boolean(classId && profile.recommendedClass === classId);
    let affinityDesc = `契合职业: ${this.getClassName(profile.recommendedClass)}`;

    if (hasAffinity) {
      damageMultiplier *= 1.15;
      affinityDesc = `★ 职业专属共鸣激活：伤害 +15%，手感全面优化！`;
      if (classId === 'warrior') knockbackForce *= 1.25;
      if (classId === 'rogue') attackCooldown *= 0.85;
      if (classId === 'ranger') attackRange *= 1.15;
      if (classId === 'mage') critBonus += 0.08;
    }

    return {
      damageMultiplier,
      attackCooldown,
      attackDuration,
      attackRange,
      attackArc,
      knockbackForce,
      critBonus,
      speedRating: profile.speedRating,
      perkDesc: weapon?.weaponPerk || profile.defaultPerk,
      hasAffinityBonus: hasAffinity,
      affinityDesc,
    };
  }

  private static getClassName(classId: CharacterClassId): string {
    switch (classId) {
      case 'warrior': return '狂战士 (Warrior)';
      case 'ranger': return '神射手 (Ranger)';
      case 'mage': return '奥术师 (Mage)';
      case 'rogue': return '暗影刺客 (Rogue)';
    }
  }

  /**
   * Refine/Enhance a weapon (+1 to +5)
   */
  public static refineWeapon(weapon: Item, playerEmeralds: number): {
    success: boolean;
    cost: number;
    newEmeralds: number;
    message: string;
  } {
    const currentLevel = weapon.refineLevel || 0;
    if (currentLevel >= 5) {
      return { success: false, cost: 0, newEmeralds: playerEmeralds, message: '该武器已达到最高淬炼等级 (+5)！' };
    }

    const cost = 25 * (currentLevel + 1);
    if (playerEmeralds < cost) {
      return { success: false, cost, newEmeralds: playerEmeralds, message: `绿宝石不足 (需要 ${cost} 💎)` };
    }

    const nextLevel = currentLevel + 1;
    weapon.refineLevel = nextLevel;
    weapon.attackBonus = (weapon.attackBonus || 10) + 6;
    weapon.critChanceBonus = (weapon.critChanceBonus || 0) + 0.03;
    weapon.value = (weapon.value || 50) + 30;

    // Update name with refine tag
    const baseName = weapon.name.replace(/\s\(\+\d\)/, '');
    weapon.name = `${baseName} (+${nextLevel})`;

    return {
      success: true,
      cost,
      newEmeralds: playerEmeralds - cost,
      message: `✨ 淬炼成功！【${weapon.name}】攻击力+6，暴击+3%！`,
    };
  }
}
