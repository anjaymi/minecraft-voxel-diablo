import { AttackMotionProfile, AttackKeyframe, HandWeaponTweenConfig } from './AttackMotionTypes';
import { AttackMotionEasing } from './AttackMotionEasing';
import { DEFAULT_ATTACK_PROFILES } from './DefaultAttackProfiles';
import { MeleeSlashPose } from '../MeleeSlashTypes';

/**
 * Player Attack Motion Controller.
 * Keyframe-assisted attack choreography & continuous tween angle controller.
 * Enables fluid, visceral slashing motion by precisely interpolating hand and weapon angles.
 */
export class PlayerAttackMotionController {
  private activeProfile: AttackMotionProfile;
  private customKeyframes: Map<number, AttackKeyframe[]> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor(profileId: string = 'fluid_slash') {
    this.activeProfile = { ...DEFAULT_ATTACK_PROFILES[profileId] || DEFAULT_ATTACK_PROFILES.fluid_slash };
  }

  /**
   * Set active motion profile.
   */
  public setProfile(profileId: string): void {
    if (DEFAULT_ATTACK_PROFILES[profileId]) {
      this.activeProfile = { ...DEFAULT_ATTACK_PROFILES[profileId] };
      this.notify();
    }
  }

  public getProfile(): AttackMotionProfile {
    return this.activeProfile;
  }

  /**
   * Configure custom keyframes for a specific combo step (0: Downward, 1: Uppercut, 2: Slam).
   */
  public setCustomKeyframes(comboStep: number, keyframes: AttackKeyframe[]): void {
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);
    this.customKeyframes.set(comboStep, sorted);
    this.notify();
  }

  /**
   * Clear custom keyframes and restore profile defaults.
   */
  public resetKeyframes(comboStep?: number): void {
    if (comboStep !== undefined) {
      this.customKeyframes.delete(comboStep);
    } else {
      this.customKeyframes.clear();
    }
    this.notify();
  }

  /**
   * Update hand-to-weapon tween configuration.
   */
  public updateTweenConfig(partial: Partial<HandWeaponTweenConfig>): void {
    this.activeProfile.tweenConfig = {
      ...this.activeProfile.tweenConfig,
      ...partial,
    };
    this.notify();
  }

  public getTweenConfig(): HandWeaponTweenConfig {
    return this.activeProfile.tweenConfig;
  }

  /**
   * Get active keyframe list for the given combo step.
   */
  public getKeyframesForStep(step: number): AttackKeyframe[] {
    if (this.customKeyframes.has(step)) {
      return this.customKeyframes.get(step)!;
    }
    return this.activeProfile.combos[step] || this.activeProfile.combos[0];
  }

  /**
   * Evaluate interpolated slash pose from keyframes and continuous tween curves.
   */
  public evaluatePose(
    phase: number,
    comboStep: number,
    subType: string,
    isTwoHanded: boolean
  ): MeleeSlashPose {
    const clampedPhase = Math.max(0, Math.min(1.0, phase));
    const kfs = this.getKeyframesForStep(comboStep);
    const tween = this.activeProfile.tweenConfig;

    // Find bounding keyframes
    let kfA = kfs[0];
    let kfB = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (clampedPhase >= kfs[i].time && clampedPhase <= kfs[i + 1].time) {
        kfA = kfs[i];
        kfB = kfs[i + 1];
        break;
      }
    }

    const duration = kfB.time - kfA.time;
    const progress = duration > 0.0001 ? (clampedPhase - kfA.time) / duration : 1.0;
    const easedT = AttackMotionEasing.ease(progress, kfB.easing || 'easeInOutQuad');

    // 1. Angular Interpolation with Shortest-Path unwrapping
    const shoulderAngle = AttackMotionEasing.lerpAngle(kfA.shoulderAngle, kfB.shoulderAngle, easedT);
    const elbowAngle = AttackMotionEasing.lerpAngle(kfA.elbowAngle, kfB.elbowAngle, easedT);
    const rawWrist = AttackMotionEasing.lerpAngle(kfA.wristAngle, kfB.wristAngle, easedT);
    const wristAngle = rawWrist * (1 - tween.wristInertia);

    // 2. Weapon socket angle tweening
    const baseWeaponAngle = AttackMotionEasing.lerpAngle(kfA.weaponAngle, kfB.weaponAngle, easedT);
    const weaponAngle = baseWeaponAngle + tween.weaponAngleOffset;

    // 3. Linear Kinematic Offsets
    const thrustX = AttackMotionEasing.lerp(kfA.thrustX, kfB.thrustX, easedT);
    const thrustY = AttackMotionEasing.lerp(kfA.thrustY, kfB.thrustY, easedT);
    const torsoLean = AttackMotionEasing.lerp(kfA.torsoLean, kfB.torsoLean, easedT);
    const squatY = AttackMotionEasing.lerp(kfA.squatY, kfB.squatY, easedT);
    const lungeX = AttackMotionEasing.lerp(kfA.lungeX, kfB.lungeX, easedT);
    const smear = AttackMotionEasing.lerp(kfA.smear, kfB.smear, easedT);

    // Determine current motion stage
    let stage: MeleeSlashPose['stage'] = 'slash';
    if (clampedPhase < 0.22) stage = 'windup';
    else if (clampedPhase < 0.48) stage = 'slash';
    else if (clampedPhase < 0.68) stage = 'impact';
    else stage = 'recovery';

    // Micro impact oscillation
    let recoil = 0;
    if (stage === 'impact') {
      const p = (clampedPhase - 0.48) / 0.20;
      recoil = Math.sin(p * Math.PI * 6) * tween.impactRecoilIntensity;
    }

    return {
      isActive: true,
      phase: clampedPhase,
      stage,
      comboStep,
      subType,
      isTwoHanded,
      torso: {
        offsetX: lungeX,
        offsetY: squatY,
        rotation: torsoLean,
        squashX: stage === 'slash' ? 1.08 : 1.0,
        squashY: stage === 'slash' ? 0.92 : 1.0,
      },
      head: {
        offsetX: lungeX * 0.6,
        offsetY: squatY * 0.7,
        rotation: torsoLean * 0.4,
      },
      legs: {
        lungeX,
        leftLegRot: -torsoLean * 0.7,
        rightLegRot: torsoLean * 0.8,
        leftLift: Math.max(0, squatY * 0.5),
        rightLift: Math.max(0, squatY * 0.8),
      },
      armRight: {
        shoulderAngle,
        elbowAngle,
        wristAngle,
        handOffsetX: thrustX,
        handOffsetY: thrustY,
      },
      armLeft: {
        angle: isTwoHanded ? shoulderAngle * 0.92 : -shoulderAngle * 0.45,
        offsetX: isTwoHanded ? thrustX - 2.5 : -lungeX * 0.3,
        offsetY: isTwoHanded ? thrustY + 2.0 : 0,
      },
      weapon: {
        angle: weaponAngle + recoil,
        pivotOffsetX: 0,
        pivotOffsetY: 0,
        thrustX,
        thrustY,
        recoilShake: recoil,
        smearIntensity: smear,
        smearArcStart: comboStep === 1 ? -Math.PI * 0.1 : -Math.PI * 0.85,
        smearArcEnd: comboStep === 1 ? -Math.PI * 0.9 : -Math.PI * 0.15,
        smearRadius: subType === 'greatsword' ? 42 : 30,
      },
    };
  }

  /**
   * Solve weapon-to-hand socket rotation angle directly using the active tween configuration.
   */
  public solveSocketAngle(phase: number, comboStep: number): { angle: number; recoil: number } {
    const kfs = this.getKeyframesForStep(comboStep);
    let kfA = kfs[0];
    let kfB = kfs[kfs.length - 1];

    for (let i = 0; i < kfs.length - 1; i++) {
      if (phase >= kfs[i].time && phase <= kfs[i + 1].time) {
        kfA = kfs[i];
        kfB = kfs[i + 1];
        break;
      }
    }

    const duration = kfB.time - kfA.time;
    const progress = duration > 0.0001 ? (phase - kfA.time) / duration : 1.0;
    const easedT = AttackMotionEasing.ease(progress, kfB.easing || 'easeInOutQuad');

    const angle = AttackMotionEasing.lerpAngle(kfA.weaponAngle, kfB.weaponAngle, easedT) + this.activeProfile.tweenConfig.weaponAngleOffset;
    const recoil = (phase >= 0.22 && phase <= 0.65)
      ? Math.sin(((phase - 0.22) / 0.43) * Math.PI * 6) * this.activeProfile.tweenConfig.impactRecoilIntensity
      : 0;

    return { angle, recoil };
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

/**
 * Global singleton instance of PlayerAttackMotionController.
 */
export const attackMotionController = new PlayerAttackMotionController();
