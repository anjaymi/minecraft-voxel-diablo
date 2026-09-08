import { WeaponSubType } from '../../types';

export type ChibiWeaponCategory = 'sword' | 'staff' | 'bow';

export interface ChibiWeaponOffsetConfig {
  category: ChibiWeaponCategory;
  label: string;
  baseOffsetX: number; // 1.0 标准缩放下手掌挂点 X 偏移 (基准像素)
  baseOffsetY: number; // 1.0 标准缩放下手掌挂点 Y 偏移 (基准像素)
  scaleSlopeX: number; // 缩放比例变动时的 X 轴力矩漂移补偿斜率 (dOffsetX / dScale)
  scaleSlopeY: number; // 缩放比例变动时的 Y 轴力矩漂移补偿斜率 (dOffsetY / dScale)
  gripCenterOffset: number; // 握把几何中心相对于手掌接触面的参考偏移
  description: string;
}

export interface ChibiWeaponOffsetResult {
  offsetX: number;
  offsetY: number;
  scale: number;
  category: ChibiWeaponCategory;
}

/**
 * 2 头身缩放武器挂点补偿配置表 (Chibi 2.0-head Weapon Scale Offset Table)
 * 专为超萌粘土手办 / 2头身骨骼在不同视口缩放比例 (如 0.40 ~ 1.5) 下提供挂握中心自适应补偿，
 * 解决武器因杠杆力矩、长短柄与轴心点偏差在模型缩放时偏离掌心的位移漂移缺陷。
 */
export const CHIBI_WEAPON_OFFSET_TABLE: Record<ChibiWeaponCategory, ChibiWeaponOffsetConfig> = {
  sword: {
    category: 'sword',
    label: '剑类 (近战刀剑/钝器)',
    baseOffsetX: 0.0,
    baseOffsetY: 0.0,
    scaleSlopeX: 0.35,
    scaleSlopeY: -0.75, // 缩小至 0.40 时自动上提约 0.45px，锁定剑格护手于掌心肉拳
    gripCenterOffset: 0.5,
    description: '适用于单手剑、巨剑、匕首、战斧、战锤，保持刀柄护手牢固贴合掌心',
  },
  staff: {
    category: 'staff',
    label: '杖类 (法杖/短杖)',
    baseOffsetX: 0.4,
    baseOffsetY: -1.0,
    scaleSlopeX: 0.45,
    scaleSlopeY: -1.60, // 长柄法杖在小比例缩放下更易戳地，强化 Y 轴上浮补偿
    gripCenterOffset: 0.0,
    description: '适用于法杖与魔杖，维持握手在上中段，确保法术符文晶石聚焦且长柄不戳地',
  },
  bow: {
    category: 'bow',
    label: '弓类 (战弓/十字弩)',
    baseOffsetX: -0.6,
    baseOffsetY: 0.2,
    scaleSlopeX: -0.50, // 弓身侧向横开，随比例动态调节握弦基准线
    scaleSlopeY: 0.35,
    gripCenterOffset: 0.0,
    description: '适用于反曲长弓与机械弩，维持搭箭切线与握把侧切面居中',
  },
};

export class ChibiWeaponScaleCompensation {
  /**
   * 将任意武器子类型或分类名称规范化归并为 3 大主干类别 (剑、杖、弓)
   */
  public static normalizeCategory(subType?: WeaponSubType | string): ChibiWeaponCategory {
    if (!subType) return 'sword';
    const clean = subType.toLowerCase().trim();

    if (clean === 'staff' || clean === 'wand' || clean.includes('staff') || clean.includes('wand')) {
      return 'staff';
    }
    if (clean === 'bow' || clean === 'crossbow' || clean.includes('bow')) {
      return 'bow';
    }
    return 'sword';
  }

  /**
   * 根据武器类型与当前缩放比例，计算自适应 offset_x 与 offset_y
   * 算法: offset = baseOffset + (scale - 1.0) * scaleSlope
   *
   * @param weaponType 武器子类型 (sword/staff/bow 等)
   * @param scale 2头身模型缩放比例 (默认采用 2头身统一缩放 0.40)
   */
  public static calculate(
    weaponType?: WeaponSubType | string,
    scale: number = 0.40
  ): ChibiWeaponOffsetResult {
    const category = this.normalizeCategory(weaponType);
    const config = CHIBI_WEAPON_OFFSET_TABLE[category];
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 0.40;

    // 计算偏离 1.0 标称基准的比例差量
    const deltaScale = safeScale - 1.0;

    // 线性补偿计算，保留 2 位小数保证画布渲染平滑
    const rawX = config.baseOffsetX + deltaScale * config.scaleSlopeX;
    const rawY = config.baseOffsetY + deltaScale * config.scaleSlopeY;

    return {
      offsetX: Math.round(rawX * 100) / 100,
      offsetY: Math.round(rawY * 100) / 100,
      scale: safeScale,
      category,
    };
  }
}
