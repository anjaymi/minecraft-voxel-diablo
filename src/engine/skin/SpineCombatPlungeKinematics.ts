import { BoneTransform, SkeletonPose } from './spineTypes';
import { FineSkeletonPose, WeaponPhysicsDynamics } from './spineFineKinematicsTypes';
import { SpineLimbKinematics } from './SpineLimbKinematics';

/**
 * Kinematic calculator for the warrior's charged leaping ground impale attack
 * ("跳起来拿大剑插在地上" / Leap & Plunging Impale Ground Slam).
 */
export class SpineCombatPlungeKinematics {
  public static computePlungePose(
    phase: number,
    base: SkeletonPose
  ): FineSkeletonPose {
    let leapY = 0;
    let chestTilt = 0;
    let headTilt = 0;
    let swordRot = 0;
    let swordX = 0;
    let swordY = 0;
    let isGroundImpaling = false;
    let shockwaveProgress = 0;
    let rightUpperArmRot = 0;
    let rightElbowBend = 0;
    let leftUpperArmRot = 0;
    let leftElbowBend = 0;
    let rightThighRot = 0;
    let rightKneeBend = 0;
    let leftThighRot = 0;
    let leftKneeBend = 0;

    if (phase < 0.22) {
      // Phase 1: Deep Crouch & Tension Coil (0.0 -> 0.22)
      const p = phase / 0.22;
      leapY = p * 6; // Sink down into coil
      chestTilt = 0.22 * p;
      headTilt = -0.15;
      // Sword dragged low behind back
      swordRot = -0.8 - p * 0.4;
      swordX = -8;
      swordY = 12;

      rightUpperArmRot = 0.8 * p;
      rightElbowBend = 0.5 * p;
      leftUpperArmRot = 0.7 * p;
      leftElbowBend = 0.6 * p;

      // Deep knee compression
      rightThighRot = -0.4 * p;
      rightKneeBend = 0.9 * p;
      leftThighRot = -0.35 * p;
      leftKneeBend = 0.85 * p;
    } else if (phase < 0.48) {
      // Phase 2: Soaring Apex Leap (0.22 -> 0.48)
      // Character soars high into the air!
      const p = (phase - 0.22) / 0.26;
      const jumpArc = Math.sin(p * Math.PI);
      leapY = -24 * jumpArc; // Airborne apex
      chestTilt = -0.12 * (1 - p);
      headTilt = 0.25;

      // Hoist massive greatsword high overhead inverted, pointing straight down
      swordRot = Math.PI * (0.8 + p * 0.2); // Pointing down
      swordX = 2;
      swordY = -20;

      rightUpperArmRot = -2.2 + p * 0.4;
      rightElbowBend = -0.8;
      leftUpperArmRot = -2.1 + p * 0.4;
      leftElbowBend = 0.8;

      // Legs tucked in mid-air
      rightThighRot = 0.6;
      rightKneeBend = 1.2;
      leftThighRot = 0.4;
      leftKneeBend = 1.1;
    } else if (phase < 0.72) {
      // Phase 3: Meteor Plunging Impale (0.48 -> 0.72)
      // Hits ground with massive impact, greatsword plunged deep into earth
      const p = (phase - 0.48) / 0.24;
      leapY = (1 - p) * -4 + p * 2;
      chestTilt = 0.32;
      headTilt = -0.2;
      isGroundImpaling = true;
      shockwaveProgress = Math.min(1.0, p * 1.5);

      // Sword stabbed vertically into ground
      swordRot = Math.PI; // Straight down 180 deg
      swordX = 10;
      swordY = 6; // Planted firmly into soil

      // Arms locked pressing down on sword hilt
      rightUpperArmRot = 0.4;
      rightElbowBend = 0.7;
      leftUpperArmRot = 0.35;
      leftElbowBend = 0.8;

      // Braced landing stance
      rightThighRot = 0.3;
      rightKneeBend = 0.95;
      leftThighRot = -0.5;
      leftKneeBend = 0.7;
    } else {
      // Phase 4: Shockwave Shatter & Braced Recovery (0.72 -> 1.0)
      const p = (phase - 0.72) / 0.28;
      leapY = 2 * (1 - p);
      chestTilt = 0.32 * (1 - p * 0.6);
      headTilt = -0.1 * (1 - p);
      isGroundImpaling = true;
      shockwaveProgress = 1.0;

      swordRot = Math.PI;
      swordX = 10;
      swordY = 6;

      rightUpperArmRot = 0.3 * (1 - p);
      rightElbowBend = 0.5 * (1 - p);
      leftUpperArmRot = 0.25 * (1 - p);
      leftElbowBend = 0.6 * (1 - p);

      rightThighRot = 0.15;
      rightKneeBend = 0.3;
      leftThighRot = -0.15;
      leftKneeBend = 0.3;
    }

    const pelvisY = base.torso.y + 8 + leapY;
    const pelvis: BoneTransform = { x: base.torso.x, y: pelvisY, rotation: chestTilt * 0.4, scaleX: 1, scaleY: 1 };
    const chest: BoneTransform = { x: base.torso.x, y: base.torso.y - 4 + leapY, rotation: chestTilt, scaleX: 1, scaleY: 1 };
    const head: BoneTransform = { x: chest.x, y: chest.y - 18, rotation: headTilt, scaleX: 1, scaleY: 1 };

    // 3-segment limbs
    const armRight = SpineLimbKinematics.solveArmChain(chest.x + 9, chest.y - 4, rightUpperArmRot, rightElbowBend, 0.15);
    const armLeft = SpineLimbKinematics.solveArmChain(chest.x - 9, chest.y - 4, leftUpperArmRot, leftElbowBend, -0.15);
    const legRight = SpineLimbKinematics.solveLegChain(pelvis.x + 5, pelvis.y + 6, rightThighRot, rightKneeBend, 0);
    const legLeft = SpineLimbKinematics.solveLegChain(pelvis.x - 5, pelvis.y + 6, leftThighRot, leftKneeBend, 0);

    const weapon: BoneTransform = {
      x: isGroundImpaling ? chest.x + swordX : armRight.end.x,
      y: isGroundImpaling ? chest.y + swordY : armRight.end.y,
      rotation: swordRot,
      scaleX: 1,
      scaleY: 1,
    };

    const weaponDynamics: WeaponPhysicsDynamics = {
      category: 'greatsword',
      wristLagAngle: 0,
      reboundOffsetX: isGroundImpaling ? Math.sin(phase * 40) * 0.8 : 0,
      reboundOffsetY: isGroundImpaling ? -1.5 : 0,
      isTwoHandedGrip: true,
      trailPoints: [],
    };

    return {
      pelvis,
      chest,
      head,
      armRight,
      armLeft,
      legRight,
      legLeft,
      weapon,
      weaponDynamics,
      isGroundImpaling,
      shockwaveProgress,
      slashTrailProgress: phase > 0.45 && phase < 0.65 ? 1.0 : 0,
    };
  }
}
