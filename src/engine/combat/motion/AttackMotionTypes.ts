import { MeleeSlashPose } from '../MeleeSlashTypes';

/**
 * Supported interpolation easing algorithms for attack keyframes.
 */
export type MotionEasingType =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'snapWhip'    // Instant forward whip with elastic hold
  | 'elasticHit'; // Impact stop with micro oscillation

/**
 * Keyframe representing pose parameters at a specific attack phase [0.0 - 1.0].
 */
export interface AttackKeyframe {
  /** Normalized phase timestamp (0.0 to 1.0) */
  time: number;
  /** Upper arm / shoulder rotation angle in radians */
  shoulderAngle: number;
  /** Forearm / elbow flexion angle in radians */
  elbowAngle: number;
  /** Wrist flexion angle relative to forearm in radians */
  wristAngle: number;
  /** Weapon mount alignment angle relative to hand socket in radians */
  weaponAngle: number;
  /** Forward thrust offset in px */
  thrustX: number;
  /** Vertical thrust/drop offset in px */
  thrustY: number;
  /** Torso forward/backward tilt in radians */
  torsoLean: number;
  /** Center of gravity vertical squat drop in px */
  squatY: number;
  /** Stride forward lunge offset in px */
  lungeX: number;
  /** Smear arc / blade trail intensity factor (0.0 to 1.0) */
  smear: number;
  /** Easing function leading to this keyframe from previous */
  easing?: MotionEasingType;
}

/**
 * Configuration for fine-tuning the tween dynamics between hand and weapon.
 */
export interface HandWeaponTweenConfig {
  /** Base weapon angle adjustment in hand socket (radians) */
  weaponAngleOffset: number;
  /** Wrist follow-through inertia factor (0.0 = completely rigid, 1.0 = heavy drag lag) */
  wristInertia: number;
  /** Smoothing sharpness for transitioning between keyframes (higher = sharper snap) */
  tweenTension: number;
  /** Micro recoil oscillation amplitude during impact cut */
  impactRecoilIntensity: number;
  /** Whether to dynamically rotate the blade tip toward the motion velocity tangent */
  tangentSnapEnabled: boolean;
}

/**
 * Complete preset profile for an attack motion style.
 */
export interface AttackMotionProfile {
  id: string;
  name: string;
  description: string;
  subType: string;
  /** Combo keyframe sequence mapped by combo step index (0, 1, 2) */
  combos: Record<number, AttackKeyframe[]>;
  /** Hand and weapon tween configuration */
  tweenConfig: HandWeaponTweenConfig;
}
