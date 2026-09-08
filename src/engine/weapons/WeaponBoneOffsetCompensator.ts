import { Player } from '../../types';
import { MeleeSlashPose } from '../combat/MeleeSlashTypes';
import { WeaponVisualUtils } from './WeaponRenderTypes';
import { WeaponSubType, WeaponSocketPreset } from './WeaponSocketTypes';
import { CharacterOrientationManager } from '../orientation/CharacterOrientationManager';
import { DEFAULT_WEAPON_SOCKET_PRESETS } from './WeaponSocketPresets';

export interface WeaponBoneDeviationResult {
  /** Offset compensation along hand socket X (px) */
  compensationX: number;
  /** Offset compensation along hand socket Y (px) */
  compensationY: number;
  /** Vector deviation from wrist joint to weapon center in local hand space (px) */
  deviationX: number;
  deviationY: number;
  /** Effective scale applied (defaults to 0.40) */
  scale: number;
  /** Distance from wrist to weapon center of geometry (px) */
  wristToCenterDistance: number;
  /** Whether attack combat compensation was active */
  isCombatActive: boolean;
}

/**
 * Skeletal Proportion Weapon Socket Offset Compensator.
 * Calculates vector deviation between wrist joint and weapon center under 40% scale,
 * ensuring the weapon hilt is locked firmly into the character's palm during attack animation frames.
 */
export class WeaponBoneOffsetCompensator {
  /** Standard 2-head-tall chibi character scale factor (40%) */
  public static readonly DEFAULT_CHIBI_SCALE: number = CharacterOrientationManager.UNIFIED_CHIBI_SCALE;

  /**
   * Weapon center of geometry along the blade/shaft (negative Y indicates tip-ward direction)
   */
  public static readonly WEAPON_GEOMETRIC_CENTERS: Record<WeaponSubType, number> = {
    sword: -14.0,
    greatsword: -18.0,
    dagger: -7.5,
    axe: -11.5,
    hammer: -10.0,
    staff: -11.0,
    wand: -8.5,
    bow: 0.0,
    crossbow: 0.0,
  };

  /**
   * Handle grip point along weapon axis (offset from weapon model origin)
   */
  public static readonly WEAPON_GRIP_CENTERS: Record<WeaponSubType, number> = {
    sword: 0.5,
    greatsword: 1.8,
    dagger: 0.0,
    axe: 0.8,
    hammer: 1.0,
    staff: 0.0,
    wand: 0.0,
    bow: 0.0,
    crossbow: 0.0,
  };

  /**
   * Calculate vector deviation from wrist joint to weapon center under 40% scale,
   * and compute the compensation vector required to lock the weapon in the palm.
   */
  public static calculateWristToWeaponDeviation(
    player: Player,
    slashPose: MeleeSlashPose,
    socketAngle: number,
    scale: number = WeaponBoneOffsetCompensator.DEFAULT_CHIBI_SCALE,
    customPreset?: WeaponSocketPreset
  ): WeaponBoneDeviationResult {
    const weapon = player.equipment.weapon;
    const classId = player.characterClass || 'warrior';
    const subType = WeaponVisualUtils.getEffectiveSubType(weapon, classId) as WeaponSubType;
    const preset = customPreset || DEFAULT_WEAPON_SOCKET_PRESETS[subType] || DEFAULT_WEAPON_SOCKET_PRESETS.sword;

    const gripPoint = preset.gripPointY || (WeaponBoneOffsetCompensator.WEAPON_GRIP_CENTERS[subType] ?? 0.5);
    const centerDist = WeaponBoneOffsetCompensator.WEAPON_GEOMETRIC_CENTERS[subType] ?? -12.0;

    // 1. Vector from wrist to weapon center in weapon's rotated local coordinate frame
    const rad = socketAngle;
    const sinA = Math.sin(rad);
    const cosA = Math.cos(rad);

    // Position of weapon center in hand socket space
    const centerPosX = -sinA * centerDist;
    const centerPosY = cosA * centerDist;

    // Rest/idle reference vector
    const idleRad = preset.idleAngle;
    const idleCenterX = -Math.sin(idleRad) * centerDist;
    const idleCenterPosY = Math.cos(idleRad) * centerDist;

    // Vector deviation between current dynamic center and idle rest center
    const deviationX = centerPosX - idleCenterX;
    const deviationY = centerPosY - idleCenterPosY;

    // 2. Grip pivot rotational offset compensation:
    // Ensures the grip point (gripPoint along weapon Y) aligns exactly with hand palm (0, 0)
    const gripShiftX = -sinA * gripPoint;
    const gripShiftY = (cosA - 1.0) * gripPoint;

    let compensationX = -gripShiftX;
    let compensationY = -gripShiftY;

    // 3. Attack animation frame micro-recoil anchoring
    // 确保武器握柄绝对锁定在手掌肉拳内，仅保留刀鸣命中微震颤，消除造成武器脱手的错误位移
    const isCombatActive = Boolean(slashPose && slashPose.isActive);
    if (isCombatActive) {
      const recoil = slashPose.weapon?.recoilShake || 0;
      if (recoil !== 0) {
        // 微震颤沿斩击切线轻微共振
        compensationX += Math.cos(rad) * recoil * 1.2;
        compensationY += Math.sin(rad) * recoil * 1.2;
      }
    }

    return {
      compensationX,
      compensationY,
      deviationX,
      deviationY,
      scale,
      wristToCenterDistance: Math.abs(centerDist),
      isCombatActive,
    };
  }
}
