import { WeaponSubType, WeaponSocketPreset } from './WeaponSocketTypes';

export const DEFAULT_WEAPON_SOCKET_PRESETS: Record<WeaponSubType, WeaponSocketPreset> = {
  sword: {
    subType: 'sword',
    label: '单手剑 / 佩剑 (Sword)',
    idleAngle: 0.65, // ~37 deg: 2头身向前上方昂扬立剑架势，剑尖腾空悬于身前侧
    idleOffsetX: 0.2, // 严丝合缝对齐手掌(0, 0)与拳指(0.4, 0)中心
    idleOffsetY: 0.0,
    scale: 0.88,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  greatsword: {
    subType: 'greatsword',
    label: '双手大剑 (Greatsword)',
    idleAngle: 0.58, // ~33 deg: 霸气双手巨剑斜持，厚重低姿架刃，安全避让地面
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.90,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  dagger: {
    subType: 'dagger',
    label: '刺客短匕 (Dagger)',
    idleAngle: 0.55, // ~31 deg: 灵巧正手斜前戒备，小巧凌厉
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.82,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  axe: {
    subType: 'axe',
    label: '狂战战斧 (Battleaxe)',
    idleAngle: 0.70, // ~40 deg: 宽阔斧刃斜前微昂，斧刃外翻展示锋芒
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.86,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  hammer: {
    subType: 'hammer',
    label: '碎骨重锤 (Warhammer)',
    idleAngle: 0.64, // ~36 deg: 方正锤头沉稳前倾
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.86,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  staff: {
    subType: 'staff',
    label: '法术法杖 (Mage Staff)',
    idleAngle: 0.38, // ~22 deg: 高挑法杖斜向天穹，魔晶悬于右肩侧上方空中
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.88,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  wand: {
    subType: 'wand',
    label: '秘法权杖 (Arcane Wand)',
    idleAngle: 0.42, // ~24 deg: 优雅小权杖向前微扬
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.84,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  bow: {
    subType: 'bow',
    label: '游侠战弓 (Longbow)',
    idleAngle: 0.05, // ~3 deg: 弓身挺拔，握把完美贴合掌心
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.88,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
  crossbow: {
    subType: 'crossbow',
    label: '重装战弩 (Crossbow)',
    idleAngle: 0.08, // ~4 deg: 战弩平稳前瞄，弩机握把稳妥持握
    idleOffsetX: 0.2,
    idleOffsetY: 0.0,
    scale: 0.88,
    gripPointY: 0.0,
    combatAngleOffset: 0.0,
  },
};
