import { Player } from '../../types';
import { MeleeSlashPose } from '../combat/MeleeSlashTypes';
import { attackMotionController } from '../combat/motion/PlayerAttackMotionController';
import { weaponSocketAdapter } from './WeaponSocketAdapter';

export interface WeaponSocketTransform {
  /** Offset along hand forward vector (px) */
  socketX: number;
  socketY: number;
  /** Angle applied at the wrist joint (rad) to align blade tip with slash vector */
  socketAngle: number;
  /** Shake/recoil amplitude during impact */
  recoil: number;
  /** Whether the weapon is actively in a combat slash */
  isCombatGrip: boolean;
}

/**
 * Professional Weapon & Hand Socket Binding Engine.
 * Solves hand-to-hilt alignment, combat grip vectors, and forward-pointing blade geometry.
 * Ensures the blade extends naturally from the fist rather than rotating unnaturally or pointing backwards.
 */
export class WeaponSocketBinder {
  /**
   * Compute precise socket transformation for the weapon when mounted to the character's hand.
   *
   * Note on Weapon Coordinate System:
   * In local weapon models (drawSword, drawAxe, drawGreatsword):
   * - Hilt center is at (0, 0) - this is the hand socket origin.
   * - Blade tip is at (0, -32) or (0, -28) - points in the negative Y axis.
   * - Pommel end is at (0, +5) - points in the positive Y axis.
   *
   * In limb coordinate system:
   * - Forearm points along positive Y axis from elbow to wrist.
   */
  public static solveHandSocket(
    player: Player,
    slashPose: MeleeSlashPose,
    isMountedOnBone: boolean = true
  ): WeaponSocketTransform {
    const res = weaponSocketAdapter.solveSocket(player, slashPose, isMountedOnBone);
    return {
      socketX: res.x,
      socketY: res.y,
      socketAngle: res.angle,
      recoil: res.recoil,
      isCombatGrip: res.isCombatGrip,
    };
  }

  /**
   * Combo 1: Downward Slash Socket Binding
   */
  private static solveDownwardGrip(
    phase: number,
    stage: MeleeSlashPose['stage']
  ): WeaponSocketTransform {
    let socketAngle = 0;
    let recoil = 0;

    if (phase < 0.22) {
      // 1. Windup (蓄力引刀): Blade tilted back over shoulder
      const p = phase / 0.22;
      // In hand space, blade tip poises back-upward
      socketAngle = -0.15 - p * 0.45;
    } else if (phase < 0.50) {
      // 2. Explosive Slash (破空下劈): Wrist snaps forward; blade extends along attack cut
      const p = (phase - 0.22) / 0.28;
      const ease = p < 0.4 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      // Flips blade forward into cutting tangent (+Math.PI) with firm wrist lock
      socketAngle = -0.60 + ease * (Math.PI + 0.35);
    } else if (phase < 0.66) {
      // 3. Impact Cut Stop (入肉定格与刀鸣震颤)
      const p = (phase - 0.50) / 0.16;
      recoil = Math.sin(p * Math.PI * 4) * 0.045;
      socketAngle = Math.PI - 0.25 + recoil;
    } else {
      // 4. Recovery (顺势收刀归位)
      const p = (phase - 0.66) / 0.34;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      socketAngle = (Math.PI - 0.25) * (1 - ease) + -0.15 * ease;
    }

    return {
      socketX: 0,
      socketY: 0,
      socketAngle,
      recoil,
      isCombatGrip: true,
    };
  }

  /**
   * Combo 2: Upward Cleave Socket Binding
   */
  private static solveUppercutGrip(
    phase: number,
    stage: MeleeSlashPose['stage']
  ): WeaponSocketTransform {
    let socketAngle = 0;
    let recoil = 0;

    if (phase < 0.20) {
      // 1. Windup (低位拖刀蓄势): Blade tip points down-back
      const p = phase / 0.20;
      socketAngle = -0.15 + p * (Math.PI * 0.85);
    } else if (phase < 0.48) {
      // 2. Ascending Cleave (升龙挑斩): Blade rips upward into sky
      const p = (phase - 0.20) / 0.28;
      const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      socketAngle = Math.PI * 0.70 - ease * (Math.PI * 0.95);
    } else if (phase < 0.64) {
      // 3. Apex Hold (挑顶定格)
      const p = (phase - 0.48) / 0.16;
      recoil = Math.sin(p * Math.PI * 4) * 0.04;
      socketAngle = -0.25 + recoil;
    } else {
      // 4. Recovery (平稳归位)
      const p = (phase - 0.64) / 0.36;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      socketAngle = -0.25 + ease * 0.10;
    }

    return {
      socketX: 0,
      socketY: 0,
      socketAngle,
      recoil,
      isCombatGrip: true,
    };
  }

  /**
   * Combo 3: Finisher Ground Slam Socket Binding
   */
  private static solveSlamGrip(
    phase: number,
    stage: MeleeSlashPose['stage']
  ): WeaponSocketTransform {
    let socketAngle = 0;
    let recoil = 0;

    if (phase < 0.28) {
      // 1. Overhead Leap (双手举刀朝天)
      const p = phase / 0.28;
      socketAngle = -0.15 + p * 0.10; // Vertical upright blade pointing at sky
    } else if (phase < 0.52) {
      // 2. Thunderous Plunge (泰山压顶狂暴扣杀)
      const p = (phase - 0.28) / 0.24;
      const ease = p * p * p;
      // Flips blade vertically downward into earth (+Math.PI)
      socketAngle = -0.05 + ease * (Math.PI + 0.15);
    } else if (phase < 0.70) {
      // 3. Ground Impact (贯入大地震颤)
      const p = (phase - 0.52) / 0.18;
      recoil = Math.sin(p * Math.PI * 6) * 0.06;
      socketAngle = Math.PI + 0.10 + recoil;
    } else {
      // 4. Recovery (起身后撤拔刀)
      const p = (phase - 0.70) / 0.30;
      const ease = 1 - Math.cos((p * Math.PI) / 2);
      socketAngle = (Math.PI + 0.10) * (1 - ease) + -0.15 * ease;
    }

    return {
      socketX: 0,
      socketY: 0,
      socketAngle,
      recoil,
      isCombatGrip: true,
    };
  }
}
