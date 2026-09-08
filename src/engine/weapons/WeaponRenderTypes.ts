import { Item, CharacterClassId, Player } from '../../types';

export interface WeaponVisualContext {
  weapon: Item | null;
  offhand: Item | null;
  characterClass: CharacterClassId;
  isAttacking: boolean;
  attackTimer: number;
  comboStep: number;
  isBowAiming: boolean;
  time: number;
  bodyBob: number;
}

export interface WeaponColors {
  primary: string;
  secondary: string;
  blade: string;
  glow: string;
  handle: string;
}

export class WeaponVisualUtils {
  /**
   * Derives elemental and tier-based color schemes for any weapon.
   */
  public static getWeaponColors(weapon: Item | null, defaultGlow: string = '#38bdf8'): WeaponColors {
    if (!weapon) {
      return {
        primary: '#38bdf8',
        secondary: '#94a3b8',
        blade: '#38bdf8',
        glow: defaultGlow,
        handle: '#78350f',
      };
    }

    const name = weapon.name || '';
    let blade = '#38bdf8'; // Diamond blue default
    let glow = weapon.glowColor || defaultGlow;

    if (name.includes('Netherite') || name.includes('下界') || name.includes('影杀') || name.includes('暗影')) {
      blade = '#1e1b4b';
      glow = '#a855f7';
    } else if (name.includes('Gold') || name.includes('金') || name.includes('雷霆')) {
      blade = '#fbbf24';
      glow = '#f59e0b';
    } else if (name.includes('Iron') || name.includes('铁') || name.includes('钢')) {
      blade = '#e2e8f0';
      glow = '#94a3b8';
    } else if (name.includes('Stone') || name.includes('石')) {
      blade = '#94a3b8';
      glow = '#64748b';
    } else if (name.includes('火焰') || name.includes('烈焰') || name.includes('炽钢')) {
      blade = '#ef4444';
      glow = '#f97316';
    } else if (name.includes('世界树') || name.includes('翡翠') || name.includes('自然') || name.includes('萌芽')) {
      blade = '#10b981';
      glow = '#22c55e';
    } else if (name.includes('星界') || name.includes('奥术') || name.includes('秘法')) {
      blade = '#c084fc';
      glow = '#a855f7';
    } else if (name.includes('噬魂') || name.includes('灵木') || name.includes('死灵')) {
      blade = '#6366f1';
      glow = '#818cf8';
    }

    return {
      primary: blade,
      secondary: '#475569',
      blade,
      glow,
      handle: '#78350f',
    };
  }

  /**
   * Resolves effective weapon subtype considering character class.
   */
  public static getEffectiveSubType(weapon: Item | null, classId: CharacterClassId): string {
    if (weapon?.subType) return weapon.subType;
    switch (classId) {
      case 'ranger':
        return 'bow';
      case 'mage':
        return 'staff';
      case 'summoner':
        return 'wand';
      case 'druid':
        return 'staff';
      case 'rogue':
        return 'dagger';
      case 'warrior':
      default:
        return 'sword';
    }
  }
}
