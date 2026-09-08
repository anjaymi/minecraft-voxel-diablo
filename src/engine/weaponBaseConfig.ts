import { WeaponSubType, CharacterClassId, Item, PlayerStats } from '../types';
import { WeaponBaseStat, WEAPON_BASE_CONFIGS } from './weaponBaseTable';

export type { WeaponBaseStat };
export { WEAPON_BASE_CONFIGS };

export interface DynamicWeaponStats {
  subType: string;
  name: string;
  emoji: string;
  effectiveAttackSpeed: number; // attacks per second
  effectiveCooldown: number;
  effectiveRange: number;
  effectiveArcDeg: number;
  effectiveArcRad: number;
  effectiveKnockback: number;
  effectiveCritChance: number;
  effectiveDamageMult: number;
  estimatedDamage: number;
  estimatedDps: number;
  speedRating: 'S' | 'A' | 'B' | 'C';
  classSynergy: boolean;
  synergyBonusText: string;
  vfx: {
    glowColor: string;
    glowIntensity: number;
    effectName: string;
    archetypeDesc: string;
  };
}

/**
 * Calculates dynamically scaled weapon combat values based on:
 * 1. Weapon Base Configuration (subtype)
 * 2. Player's Active Class ID (Warrior, Mage, Ranger, Rogue)
 * 3. Weapon's individual item stats & rarity bonuses
 */
export function calculateDynamicWeaponStats(
  weapon: Item | null | undefined,
  classId: CharacterClassId,
  playerStats?: PlayerStats
): DynamicWeaponStats {
  const subType: WeaponSubType = (weapon?.subType && weapon.subType in WEAPON_BASE_CONFIGS)
    ? (weapon.subType as WeaponSubType)
    : 'sword';
  const base: WeaponBaseStat = WEAPON_BASE_CONFIGS[subType] || WEAPON_BASE_CONFIGS.sword;

  let cooldown = base.baseCooldown;
  let range = base.baseRange;
  let arcRad = base.baseArc;
  let knockback = base.baseKnockback;
  let dmgMult = base.baseDmgMult;
  // 数值平衡(2026-09)：暴击只取面板 stats.critChance —— 装备时武器/词缀暴击已并入面板（classSystem.ts / gameEngine.equipItem），
  // 此处再加 weapon.critChanceBonus 会造成二次计入（旧值：盗贼 1 级约 100% 暴击）。仅无面板（未装备预览）时退回武器自身暴击。
  let crit = playerStats?.critChance ?? ((weapon?.critChanceBonus || 0) + (base.baseCritChance || 0));

  let isSynergy = false;
  let synergyText = '无特殊职业补正';

  if (classId === 'warrior') {
    if (subType === 'sword' || subType === 'axe' || subType === 'hammer') {
      isSynergy = true;
      arcRad *= 1.2;
      knockback *= 1.25;
      dmgMult *= 1.15;
      synergyText = '★ 狂战专精：挥砍弧度+20%，击退力+25%，物理破甲+15%';
    } else if (subType === 'wand' || subType === 'staff') {
      cooldown *= 1.25;
      synergyText = '▲ 战职逆相性：法杖施法引导动作迟缓 (+25% 冷却)';
    }
  } else if (classId === 'mage') {
    if (subType === 'wand' || subType === 'staff') {
      isSynergy = true;
      cooldown *= 0.82;
      dmgMult *= 1.25;
      crit += 0.08;
      synergyText = '★ 元素亲和：施法速度+22%，法术暴击+8%，元素伤害+25%';
    } else if (subType === 'hammer' || subType === 'axe') {
      cooldown *= 1.35;
      dmgMult *= 0.8;
      synergyText = '▲ 智力偏向：重兵器挥动迟缓且破甲效率下降';
    }
  } else if (classId === 'ranger') {
    if (subType === 'bow' || subType === 'crossbow') {
      isSynergy = true;
      cooldown *= 0.85;
      range *= 1.25;
      crit += 0.1;
      synergyText = '★ 鹰眼贯通：射程+25%，攻速+18%，暴击率+10%';
    } else if (subType === 'hammer') {
      cooldown *= 1.3;
      synergyText = '▲ 猎手轻装：重型钝器减缓机动性';
    }
  } else if (classId === 'rogue') {
    if (subType === 'dagger') {
      isSynergy = true;
      cooldown *= 0.75;
      crit += 0.1; // 数值平衡(2026-09)：0.15→0.10
      dmgMult *= 1.1;
      synergyText = '★ 暗影极速：攻击冷却-25%，致命背刺暴击+10%';
    } else if (subType === 'hammer' || subType === 'staff') {
      cooldown *= 1.2;
      synergyText = '▲ 刺客持握重械：动作灵敏度轻微降低';
    }
  }

  // 数值平衡(2026-09)：stats.attack 在装备时已含 weapon.attackBonus，这里只按面板攻击折算，
  // 消除旧版 (面板攻击+武器加成) 的二次计入导致的普攻虚高 25%~35%。
  const baseAttack = playerStats?.attack || 18;
  const estimatedDamage = Math.round(baseAttack * dmgMult);
  const effectiveAttackSpeed = Number((1 / Math.max(0.1, cooldown)).toFixed(1));
  const effectiveDps = Math.round(estimatedDamage * effectiveAttackSpeed * (1 + crit * 0.85));

  let speedRating: 'S' | 'A' | 'B' | 'C' = 'B';
  if (effectiveAttackSpeed >= 4.5) speedRating = 'S';
  else if (effectiveAttackSpeed >= 3.2) speedRating = 'A';
  else if (effectiveAttackSpeed >= 2.2) speedRating = 'B';
  else speedRating = 'C';

  return {
    subType,
    name: weapon?.name || base.name,
    emoji: base.emoji,
    effectiveAttackSpeed,
    effectiveCooldown: Number(cooldown.toFixed(2)),
    effectiveRange: Number(range.toFixed(1)),
    effectiveArcDeg: Math.round((arcRad * 180) / Math.PI),
    effectiveArcRad: arcRad,
    effectiveKnockback: Number(knockback.toFixed(1)),
    effectiveCritChance: Number(Math.min(1, crit).toFixed(2)),
    effectiveDamageMult: Number(dmgMult.toFixed(2)),
    estimatedDamage,
    estimatedDps: effectiveDps,
    speedRating,
    classSynergy: isSynergy,
    synergyBonusText: synergyText,
    vfx: {
      glowColor: weapon?.glowColor || base.defaultGlowColor,
      glowIntensity: weapon?.glowIntensity || base.glowIntensity,
      effectName: weapon?.vfxType || base.defaultVfxType,
      archetypeDesc: getArchetypeZh(base.combatArchetype),
    },
  };
}

function getArchetypeZh(archetype: WeaponBaseStat['combatArchetype']): string {
  switch (archetype) {
    case 'cleave': return '扇形广角挥砍 (Cleave)';
    case 'slam': return '崩裂重砸击退 (Ground Slam)';
    case 'rapid_flurry': return '高速致命连刺 (Flurry)';
    case 'snipe': return '远程精准穿杨 (Sniper)';
    case 'pierce': return '多重破甲贯穿 (Pierce)';
    case 'homing_elemental': return '引导自导法球 (Homing Missile)';
    case 'elemental_rapid': return '元素范围爆轰 (Cataclysmic)';
  }
}
