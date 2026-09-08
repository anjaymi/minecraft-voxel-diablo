import { BoneTransform } from './spineTypes';
import { LimbChain2D } from './spineFineKinematicsTypes';

/**
 * Forward & Inverse Kinematics solver for 3-segment articulated humanoids:
 * - Arms: Shoulder -> Upper Arm -> Elbow -> Forearm -> Wrist -> Palm -> Fingertip
 * - Legs: Hip -> Thigh -> Knee -> Shin -> Ankle -> Foot -> Toe
 */
export class SpineLimbKinematics {
  public static readonly UPPER_ARM_LEN = 10;
  public static readonly FOREARM_LEN = 9.5;
  public static readonly PALM_LEN = 5;

  public static readonly THIGH_LEN = 11.5;
  public static readonly SHIN_LEN = 11.5;
  public static readonly FOOT_LEN = 6;

  /**
   * Solve 3-segment Arm Chain (Upper Arm -> Forearm -> Palm).
   */
  public static solveArmChain(
    rootX: number,
    rootY: number,
    upperAngle: number,
    elbowBend: number,
    wristBend: number = 0,
    wristLag: number = 0
  ): LimbChain2D {
    // 1. Elbow Pivot
    const elbowX = rootX - Math.sin(upperAngle) * this.UPPER_ARM_LEN;
    const elbowY = rootY + Math.cos(upperAngle) * this.UPPER_ARM_LEN;

    // 2. Wrist Pivot
    const forearmAngle = upperAngle + elbowBend;
    const wristX = elbowX - Math.sin(forearmAngle) * this.FOREARM_LEN;
    const wristY = elbowY + Math.cos(forearmAngle) * this.FOREARM_LEN;

    // 3. Palm & Hand grip with dynamic inertial lag
    const palmAngle = forearmAngle + wristBend + wristLag;
    const palmX = wristX - Math.sin(palmAngle) * (this.PALM_LEN * 0.5);
    const palmY = wristY + Math.cos(palmAngle) * (this.PALM_LEN * 0.5);

    // 4. Fingertip tip (used for magic casting / sparks)
    const fingerX = wristX - Math.sin(palmAngle) * this.PALM_LEN;
    const fingerY = wristY + Math.cos(palmAngle) * this.PALM_LEN;

    const palmBone: BoneTransform = { x: palmX, y: palmY, rotation: palmAngle, scaleX: 1, scaleY: 1 };
    const fingertip: BoneTransform = { x: fingerX, y: fingerY, rotation: palmAngle, scaleX: 1, scaleY: 1 };

    return {
      root: { x: rootX, y: rootY, rotation: upperAngle, scaleX: 1, scaleY: 1 },
      upper: { x: rootX, y: rootY, rotation: upperAngle, scaleX: 1, scaleY: 1 },
      lower: { x: elbowX, y: elbowY, rotation: forearmAngle, scaleX: 1, scaleY: 1 },
      end: palmBone,
      bendAngle: elbowBend,
      palm: palmBone,
      fingertip,
      wristAngle: wristBend + wristLag,
    };
  }

  /**
   * Solve 3-segment Leg Chain (Thigh -> Shin -> Foot/Toe).
   */
  public static solveLegChain(
    rootX: number,
    rootY: number,
    thighAngle: number,
    kneeBend: number,
    anklePitch: number = 0
  ): LimbChain2D {
    // 1. Knee Pivot
    const kneeX = rootX - Math.sin(thighAngle) * this.THIGH_LEN;
    const kneeY = rootY + Math.cos(thighAngle) * this.THIGH_LEN;

    // 2. Ankle Pivot
    const shinAngle = thighAngle + kneeBend;
    const ankleX = kneeX - Math.sin(shinAngle) * this.SHIN_LEN;
    const ankleY = kneeY + Math.cos(shinAngle) * this.SHIN_LEN;

    // 3. Foot & Toe sole (horizontal grounding plane)
    const footAngle = shinAngle + anklePitch;
    const footX = ankleX - Math.sin(footAngle) * (this.FOOT_LEN * 0.5);
    const footY = ankleY + Math.cos(footAngle) * (this.FOOT_LEN * 0.5);

    const footBone: BoneTransform = { x: footX, y: footY, rotation: footAngle, scaleX: 1, scaleY: 1 };

    return {
      root: { x: rootX, y: rootY, rotation: thighAngle, scaleX: 1, scaleY: 1 },
      upper: { x: rootX, y: rootY, rotation: thighAngle, scaleX: 1, scaleY: 1 },
      lower: { x: kneeX, y: kneeY, rotation: shinAngle, scaleX: 1, scaleY: 1 },
      end: footBone,
      bendAngle: kneeBend,
      foot: footBone,
      ankleAngle: anklePitch,
    };
  }

  /**
   * Two-Bone Analytic Inverse Kinematics (IK) for Two-Handed Greatsword Grip.
   * Clamps offhand (left hand) onto the two-handed greatsword hilt just below mainhand.
   */
  public static solveTwoHandedGripIK(
    shoulderX: number,
    shoulderY: number,
    targetX: number,
    targetY: number,
    hiltAngle: number
  ): LimbChain2D {
    const dx = targetX - shoulderX;
    const dy = targetY - shoulderY;
    const dist = Math.max(0.1, Math.min(this.UPPER_ARM_LEN + this.FOREARM_LEN - 0.5, Math.hypot(dx, dy)));
    const baseAngle = Math.atan2(dx, dy);

    // Law of cosines for elbow bend
    const a = this.UPPER_ARM_LEN;
    const b = this.FOREARM_LEN;
    const c = dist;
    const cosAngle = Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c)));
    const elbowOffset = Math.acos(cosAngle);

    const upperAngle = baseAngle - elbowOffset;
    const elbowX = shoulderX + Math.sin(upperAngle) * a;
    const elbowY = shoulderY + Math.cos(upperAngle) * a;

    const forearmAngle = Math.atan2(targetX - elbowX, targetY - elbowY);
    const palmBone: BoneTransform = { x: targetX, y: targetY, rotation: hiltAngle, scaleX: 1, scaleY: 1 };

    return {
      root: { x: shoulderX, y: shoulderY, rotation: upperAngle, scaleX: 1, scaleY: 1 },
      upper: { x: shoulderX, y: shoulderY, rotation: upperAngle, scaleX: 1, scaleY: 1 },
      lower: { x: elbowX, y: elbowY, rotation: forearmAngle, scaleX: 1, scaleY: 1 },
      end: palmBone,
      bendAngle: forearmAngle - upperAngle,
      palm: palmBone,
      wristAngle: hiltAngle - forearmAngle,
    };
  }
}
