import { BoneTransform, SkeletonPose, SpineActionType } from './spineTypes';
import { FineSkeletonPose, WeaponPhysicsCategory } from './spineFineKinematicsTypes';
import { SpineLimbKinematics } from './SpineLimbKinematics';
import { SpineWeaponPhysicsDynamics } from './SpineWeaponPhysicsDynamics';
import { SpineCombatPlungeKinematics } from './SpineCombatPlungeKinematics';
import { Player } from '../../types';

/**
 * High-precision 3-segment Forward Kinematics solver.
 * Drives Upper Arm -> Forearm -> Palm, and Thigh -> Shin -> Foot
 * with weapon-specific inertia, wrist lag, impact rebound, and fingertip magic trails.
 */
export class SpineKinematicsFine {
  public static computeFinePose(
    action: SpineActionType,
    phase: number,
    basePose: SkeletonPose,
    player?: Player | null
  ): FineSkeletonPose {
    const angle = phase * Math.PI * 2;
    const category: WeaponPhysicsCategory = SpineWeaponPhysicsDynamics.resolveCategory(player);

    switch (action) {
      case 'charge_slam': {
        return SpineCombatPlungeKinematics.computePlungePose(phase, basePose);
      }
      case 'slash': {
        return this.computeSlashPose(phase, basePose, category, player);
      }
      case 'cast': {
        return this.computeCastPose(angle, phase, basePose, category);
      }
      case 'hit': {
        return this.computeHitPose(phase, basePose);
      }
      case 'run': {
        return this.computeRunPose(angle, basePose);
      }
      case 'idle':
      default: {
        return this.computeIdlePose(angle, basePose);
      }
    }
  }

  private static computeSlashPose(
    phase: number,
    base: SkeletonPose,
    category: WeaponPhysicsCategory,
    player?: Player | null
  ): FineSkeletonPose {
    const dynamics = SpineWeaponPhysicsDynamics.computeSlashDynamics(phase, category);
    const step = player?.currentSlashStep !== undefined ? player.currentSlashStep : (player?.comboStep || 0);

    let torsoTwist = 0;
    let upperArmRot = 0;
    let elbowBend = 0;
    let wristFlex = 0;
    let slashTrail = 0;
    let pelvisDrop = 0;

    if (step === 2) {
      // Finisher Leap & Slam (双手跃起终结暴烈重砸)
      if (phase < 0.28) {
        const p = phase / 0.28;
        const ease = Math.sin(p * Math.PI * 0.5);
        torsoTwist = -0.15 * ease;
        upperArmRot = -1.45 * ease; // Both hands raised high overhead
        elbowBend = -0.25 * ease;
        wristFlex = -0.10 * ease;
        pelvisDrop = -10.0 * ease;  // Airborne leap!
      } else if (phase < 0.52) {
        const p = (phase - 0.28) / 0.24;
        const ease = p * p * p; // Gravitational acceleration
        torsoTwist = -0.15 + ease * 0.55;
        upperArmRot = -1.45 + ease * 1.95; // Plunges down to +0.50 rad
        elbowBend = -0.25 + ease * 0.35;
        wristFlex = -0.10 + ease * 0.22;
        slashTrail = Math.sin(p * Math.PI);
        pelvisDrop = -10.0 + ease * 16.0; // Slams down into ground (+6px)
      } else if (phase < 0.70) {
        const p = (phase - 0.52) / 0.18;
        torsoTwist = 0.40;
        upperArmRot = 0.50 + Math.sin(p * Math.PI * 6) * 0.04;
        elbowBend = 0.10;
        wristFlex = 0.12;
        slashTrail = 0.45 * (1 - p);
        pelvisDrop = 6.0;
      } else {
        const p = (phase - 0.70) / 0.30;
        const ease = 1 - Math.cos((p * Math.PI) / 2);
        torsoTwist = 0.40 * (1 - ease);
        upperArmRot = 0.50 - ease * 0.50;
        elbowBend = 0.10 * (1 - ease);
        wristFlex = 0.12 * (1 - ease);
        pelvisDrop = 6.0 * (1 - ease);
      }
    } else if (step === 1) {
      // Rising Uppercut Cleave (逆向冲天挑斩)
      if (phase < 0.22) {
        const p = phase / 0.22;
        torsoTwist = 0.12 * p;
        upperArmRot = 0.45 + p * 0.25; // Lower arm to +0.7 rad
        elbowBend = 0.15 * p;
        wristFlex = 0.08 * p;
        pelvisDrop = p * 3.0;
      } else if (phase < 0.50) {
        const p = (phase - 0.22) / 0.28;
        torsoTwist = 0.12 - p * 0.32; // Torso arches back
        upperArmRot = 0.70 - p * 1.60; // Explosive rip upward to -0.90 rad
        elbowBend = 0.15 - p * 0.20;
        wristFlex = 0.08 - p * 0.20;
        slashTrail = Math.sin(p * Math.PI);
        pelvisDrop = 3.0 - p * 5.5;   // Body lifts upward
      } else if (phase < 0.66) {
        const p = (phase - 0.50) / 0.16;
        torsoTwist = -0.20 + p * 0.04;
        upperArmRot = -0.90 + p * 0.04;
        elbowBend = -0.05;
        wristFlex = -0.12;
        slashTrail = 0.35 * (1 - p);
        pelvisDrop = -2.5;
      } else {
        const p = (phase - 0.66) / 0.34;
        torsoTwist = -0.16 * (1 - p);
        upperArmRot = -0.86 * (1 - p);
        elbowBend = -0.05 * (1 - p);
        wristFlex = -0.12 * (1 - p);
        pelvisDrop = -2.5 * (1 - p);
      }
    } else {
      // Heavy Diagonal Cleave (雷霆大斜劈)
      if (phase < 0.22) {
        // Windup: Coil torso, raise arm high behind head, bend elbow deep
        const p = phase / 0.22;
        torsoTwist = -0.18 * p;
        upperArmRot = -0.3 - p * 0.85; // Draw arm back to -1.15 rad
        elbowBend = -0.2 - p * 0.15;   // Flex elbow to -0.35 rad
        wristFlex = -0.10 * p;
        pelvisDrop = p * 2.0;
      } else if (phase < 0.50) {
        // Accelerated Downward Slash: Torso whips forward, forearm whips straight
        const p = (phase - 0.22) / 0.28;
        torsoTwist = -0.18 + p * 0.48;
        upperArmRot = -1.15 + p * 1.50; // Powerful downward chop to +0.35 rad
        elbowBend = -0.35 + p * 0.45;   // Natural straight whip to +0.10 rad
        wristFlex = -0.10 + p * 0.24;   // Crisp wrist snap to +0.14 rad
        slashTrail = Math.sin(p * Math.PI);
        pelvisDrop = 2.0 + p * 2.5;     // Deep stance drop
      } else if (phase < 0.66) {
        // Impact Cut Stop with Harmonic Rebound
        const p = (phase - 0.50) / 0.16;
        torsoTwist = 0.30 * (1 - p * 0.2);
        upperArmRot = 0.35 - p * 0.03;
        elbowBend = 0.10;
        wristFlex = 0.14;
        slashTrail = 0.3 * (1 - p);
        pelvisDrop = 4.5;
      } else {
        // Recovery
        const p = (phase - 0.66) / 0.34;
        torsoTwist = 0.24 * (1 - p);
        upperArmRot = 0.32 * (1 - p);
        elbowBend = 0.10 * (1 - p);
        wristFlex = 0.14 * (1 - p);
        pelvisDrop = 4.5 * (1 - p);
      }
    }

    const pelvis: BoneTransform = { x: base.torso.x, y: base.torso.y + 8 + pelvisDrop, rotation: torsoTwist * 0.4, scaleX: 1, scaleY: 1 };
    const chest: BoneTransform = { x: base.torso.x, y: base.torso.y - 4 + pelvisDrop * 0.6, rotation: torsoTwist, scaleX: 1, scaleY: 1 };
    const head: BoneTransform = { x: chest.x, y: chest.y - 18, rotation: torsoTwist * 0.5, scaleX: 1, scaleY: 1 };

    // 1. Mainhand 3-segment arm with dynamic inertial wrist lag
    const armRight = SpineLimbKinematics.solveArmChain(
      chest.x + 9,
      chest.y - 4,
      upperArmRot,
      elbowBend,
      wristFlex,
      dynamics.wristLagAngle
    );

    // 2. Offhand arm: Two-handed grip on greatsword, or counter-balance arm
    let armLeft;
    if (dynamics.isTwoHandedGrip) {
      armLeft = SpineLimbKinematics.solveTwoHandedGripIK(
        chest.x - 9,
        chest.y - 4,
        armRight.end.x - 2,
        armRight.end.y + 3,
        armRight.end.rotation
      );
    } else {
      armLeft = SpineLimbKinematics.solveArmChain(
        chest.x - 9,
        chest.y - 4,
        0.3 - torsoTwist,
        0.4,
        -0.2
      );
    }

    // 3. Stance legs
    const legRight = SpineLimbKinematics.solveLegChain(pelvis.x + 5, pelvis.y + 6, torsoTwist * 0.4, 0.35);
    const legLeft = SpineLimbKinematics.solveLegChain(pelvis.x - 5, pelvis.y + 6, -torsoTwist * 0.3, 0.45);

    // 4. Weapon attached to hand with impact recoil
    const weapon: BoneTransform = {
      x: armRight.end.x + dynamics.reboundOffsetX,
      y: armRight.end.y + dynamics.reboundOffsetY,
      rotation: armRight.end.rotation - 0.2,
      scaleX: 1,
      scaleY: 1,
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
      weaponDynamics: dynamics,
      slashTrailProgress: slashTrail,
    };
  }

  private static computeCastPose(
    angle: number,
    phase: number,
    base: SkeletonPose,
    category: WeaponPhysicsCategory
  ): FineSkeletonPose {
    const floatBob = Math.sin(angle) * 3 + 2;
    const pulse = Math.sin(angle * 2) * 0.08;
    const chestArch = -0.12;
    const headUp = -0.22 + pulse * 0.4;

    const dynamics = SpineWeaponPhysicsDynamics.computeCastDynamics(phase, angle, category);

    const pelvis: BoneTransform = { x: base.torso.x, y: base.torso.y - floatBob + 8, rotation: chestArch * 0.5, scaleX: 1, scaleY: 1 };
    const chest: BoneTransform = { x: base.torso.x, y: base.torso.y - floatBob - 4, rotation: chestArch, scaleX: 1, scaleY: 1 };
    const head: BoneTransform = { x: chest.x, y: chest.y - 18, rotation: headUp, scaleX: 1, scaleY: 1 };

    // Twin 3-segment arms lifted with fingertips aimed at spell focus
    const armRight = SpineLimbKinematics.solveArmChain(
      chest.x + 9,
      chest.y - 4,
      -1.6 - pulse,
      -0.65 - pulse,
      -0.25,
      dynamics.wristLagAngle
    );

    const armLeft = SpineLimbKinematics.solveArmChain(
      chest.x - 9,
      chest.y - 4,
      -1.6 + pulse,
      0.65 + pulse,
      0.25,
      -dynamics.wristLagAngle
    );

    // Legs gently dangling in mid-air
    const legRight = SpineLimbKinematics.solveLegChain(pelvis.x + 5, pelvis.y + 6, 0.15, 0.45 + pulse * 0.5, 0.2);
    const legLeft = SpineLimbKinematics.solveLegChain(pelvis.x - 5, pelvis.y + 6, -0.15, 0.55 - pulse * 0.5, 0.2);

    const weapon: BoneTransform = {
      x: armRight.end.x,
      y: armRight.end.y,
      rotation: armRight.end.rotation - 0.2,
      scaleX: 1,
      scaleY: 1,
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
      weaponDynamics: dynamics,
    };
  }

  private static computeHitPose(phase: number, base: SkeletonPose): FineSkeletonPose {
    const p = phase < 0.3 ? phase / 0.3 : 1 - (phase - 0.3) / 0.7;
    const shake = phase < 0.4 ? Math.sin(phase * 45) * 1.8 : 0;
    const flinchTilt = -p * 0.32;
    const flinchX = -p * 7 + shake;

    const pelvis: BoneTransform = { x: flinchX, y: base.torso.y + 8, rotation: flinchTilt * 0.7, scaleX: 1, scaleY: 1 };
    const chest: BoneTransform = { x: flinchX * 1.2, y: base.torso.y - 4, rotation: flinchTilt, scaleX: 1, scaleY: 1 };
    const head: BoneTransform = { x: chest.x, y: chest.y - 18, rotation: flinchTilt * 1.4, scaleX: 1, scaleY: 1 };

    const armRight = SpineLimbKinematics.solveArmChain(chest.x + 9, chest.y - 4, 0.7, -1.1, 0.4);
    const armLeft = SpineLimbKinematics.solveArmChain(chest.x - 9, chest.y - 4, 0.6, 1.1, -0.4);
    const legRight = SpineLimbKinematics.solveLegChain(pelvis.x + 5, pelvis.y + 6, -0.2, 0.65, 0.1);
    const legLeft = SpineLimbKinematics.solveLegChain(pelvis.x - 5, pelvis.y + 6, 0.35, 0.45, 0.1);

    const weapon: BoneTransform = { x: armRight.end.x, y: armRight.end.y, rotation: armRight.end.rotation, scaleX: 1, scaleY: 1 };
    return { pelvis, chest, head, armRight, armLeft, legRight, legLeft, weapon };
  }

  private static computeRunPose(angle: number, base: SkeletonPose): FineSkeletonPose {
    const chest: BoneTransform = { x: base.torso.x, y: base.torso.y - 4, rotation: base.torso.rotation, scaleX: 1, scaleY: 1 };
    const pelvis: BoneTransform = { x: base.torso.x, y: base.torso.y + 8, rotation: base.torso.rotation * 0.5, scaleX: 1, scaleY: 1 };
    const head: BoneTransform = { ...base.head };

    const legRightBend = Math.sin(angle) > 0 ? Math.sin(angle) * 0.85 : 0.15;
    const legLeftBend = Math.sin(angle + Math.PI) > 0 ? Math.sin(angle + Math.PI) * 0.85 : 0.15;

    const armRight = SpineLimbKinematics.solveArmChain(chest.x + 9, chest.y - 4, base.armRight.rotation, -0.45 - Math.sin(angle) * 0.3, 0.1);
    const armLeft = SpineLimbKinematics.solveArmChain(chest.x - 9, chest.y - 4, base.armLeft.rotation, 0.45 + Math.sin(angle) * 0.3, -0.1);
    const legRight = SpineLimbKinematics.solveLegChain(pelvis.x + 5, pelvis.y + 6, base.legRight.rotation, legRightBend, 0.1);
    const legLeft = SpineLimbKinematics.solveLegChain(pelvis.x - 5, pelvis.y + 6, base.legLeft.rotation, legLeftBend, 0.1);

    const weapon: BoneTransform = { x: armRight.end.x, y: armRight.end.y, rotation: armRight.end.rotation, scaleX: 1, scaleY: 1 };
    return { pelvis, chest, head, armRight, armLeft, legRight, legLeft, weapon };
  }

  private static computeIdlePose(angle: number, base: SkeletonPose): FineSkeletonPose {
    const breath = Math.sin(angle) * 0.03;
    const chest: BoneTransform = { x: base.torso.x, y: base.torso.y - 4, rotation: breath, scaleX: 1, scaleY: 1 };
    const pelvis: BoneTransform = { x: base.torso.x, y: base.torso.y + 8, rotation: breath * 0.5, scaleX: 1, scaleY: 1 };
    const head: BoneTransform = { ...base.head };

    const armRight = SpineLimbKinematics.solveArmChain(chest.x + 9, chest.y - 4, base.armRight.rotation, -0.15 + breath, 0);
    const armLeft = SpineLimbKinematics.solveArmChain(chest.x - 9, chest.y - 4, base.armLeft.rotation, 0.15 - breath, 0);
    const legRight = SpineLimbKinematics.solveLegChain(pelvis.x + 5, pelvis.y + 6, 0, 0.08, 0);
    const legLeft = SpineLimbKinematics.solveLegChain(pelvis.x - 5, pelvis.y + 6, 0, 0.08, 0);

    const weapon: BoneTransform = { x: armRight.end.x, y: armRight.end.y, rotation: armRight.end.rotation, scaleX: 1, scaleY: 1 };
    return { pelvis, chest, head, armRight, armLeft, legRight, legLeft, weapon };
  }
}
