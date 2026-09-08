import { BoneTransform } from './spineTypes';
import { FineSkeletonPose, LimbChain2D } from './spineFineKinematicsTypes';
import { lerp, lerpAngle } from './SpineAnimationBlender';

export class SpineFinePoseInterpolator {
  public static interpolateBone(from: BoneTransform, to: BoneTransform, factor: number): BoneTransform {
    return {
      x: lerp(from.x, to.x, factor),
      y: lerp(from.y, to.y, factor),
      rotation: lerpAngle(from.rotation, to.rotation, factor),
      scaleX: lerp(from.scaleX, to.scaleX, factor),
      scaleY: lerp(from.scaleY, to.scaleY, factor),
    };
  }

  public static interpolateLimb(from: LimbChain2D, to: LimbChain2D, factor: number): LimbChain2D {
    return {
      root: this.interpolateBone(from.root, to.root, factor),
      upper: this.interpolateBone(from.upper, to.upper, factor),
      lower: this.interpolateBone(from.lower, to.lower, factor),
      end: this.interpolateBone(from.end, to.end, factor),
      bendAngle: lerpAngle(from.bendAngle, to.bendAngle, factor),
    };
  }

  public static interpolateFine(from: FineSkeletonPose, to: FineSkeletonPose, factor: number): FineSkeletonPose {
    return {
      pelvis: this.interpolateBone(from.pelvis, to.pelvis, factor),
      chest: this.interpolateBone(from.chest, to.chest, factor),
      head: this.interpolateBone(from.head, to.head, factor),
      armRight: this.interpolateLimb(from.armRight, to.armRight, factor),
      armLeft: this.interpolateLimb(from.armLeft, to.armLeft, factor),
      legRight: this.interpolateLimb(from.legRight, to.legRight, factor),
      legLeft: this.interpolateLimb(from.legLeft, to.legLeft, factor),
      weapon: this.interpolateBone(from.weapon, to.weapon, factor),
      slashTrailProgress: lerp(from.slashTrailProgress ?? 0, to.slashTrailProgress ?? 0, factor),
      weaponDynamics: factor > 0.5 ? to.weaponDynamics : from.weaponDynamics,
      isGroundImpaling: to.isGroundImpaling ?? from.isGroundImpaling,
      shockwaveProgress: lerp(from.shockwaveProgress ?? 0, to.shockwaveProgress ?? 0, factor),
    };
  }

  public static cloneFine(fine: FineSkeletonPose): FineSkeletonPose {
    return {
      pelvis: { ...fine.pelvis },
      chest: { ...fine.chest },
      head: { ...fine.head },
      armRight: {
        root: { ...fine.armRight.root },
        upper: { ...fine.armRight.upper },
        lower: { ...fine.armRight.lower },
        end: { ...fine.armRight.end },
        bendAngle: fine.armRight.bendAngle,
        palm: fine.armRight.palm ? { ...fine.armRight.palm } : undefined,
        fingertip: fine.armRight.fingertip ? { ...fine.armRight.fingertip } : undefined,
      },
      armLeft: {
        root: { ...fine.armLeft.root },
        upper: { ...fine.armLeft.upper },
        lower: { ...fine.armLeft.lower },
        end: { ...fine.armLeft.end },
        bendAngle: fine.armLeft.bendAngle,
        palm: fine.armLeft.palm ? { ...fine.armLeft.palm } : undefined,
        fingertip: fine.armLeft.fingertip ? { ...fine.armLeft.fingertip } : undefined,
      },
      legRight: {
        root: { ...fine.legRight.root },
        upper: { ...fine.legRight.upper },
        lower: { ...fine.legRight.lower },
        end: { ...fine.legRight.end },
        bendAngle: fine.legRight.bendAngle,
        foot: fine.legRight.foot ? { ...fine.legRight.foot } : undefined,
      },
      legLeft: {
        root: { ...fine.legLeft.root },
        upper: { ...fine.legLeft.upper },
        lower: { ...fine.legLeft.lower },
        end: { ...fine.legLeft.end },
        bendAngle: fine.legLeft.bendAngle,
        foot: fine.legLeft.foot ? { ...fine.legLeft.foot } : undefined,
      },
      weapon: { ...fine.weapon },
      slashTrailProgress: fine.slashTrailProgress,
      weaponDynamics: fine.weaponDynamics,
      isGroundImpaling: fine.isGroundImpaling,
      shockwaveProgress: fine.shockwaveProgress,
    };
  }
}
