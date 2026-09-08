import { BoneTransform } from './spineTypes';

/**
 * Three-segment articulated limb kinematic chain:
 * - Arm: Upper Arm (上臂) -> Forearm (前臂) -> Palm/Hand (手掌/手腕) + Fingertip
 * - Leg: Thigh (大腿) -> Shin/Calf (小腿) -> Foot/Toe (脚掌/脚尖)
 */
export interface LimbChain2D {
  root: BoneTransform;     // Root / Origin (Shoulder / Hip)
  upper: BoneTransform;    // Segment 1: Upper Arm (大臂) / Thigh (大腿)
  lower: BoneTransform;    // Segment 2: Forearm (前臂) / Shin (小腿)
  end: BoneTransform;      // Segment 3: Palm/Wrist (手掌) / Foot/Toe (脚掌)
  bendAngle: number;       // Elbow / Knee bend angle (radians)
  // Fine articulated terminal joints
  palm?: BoneTransform;    // Distinct hand/palm joint (for arm)
  foot?: BoneTransform;    // Distinct foot/ankle joint (for leg)
  fingertip?: BoneTransform;// Fingertip coordinate (for light weapon spellcasting trails)
  wristAngle?: number;     // Wrist flexion / snap angle
  ankleAngle?: number;     // Ankle pitch / ground grip angle
}

export type WeaponPhysicsCategory = 'heavy' | 'greatsword' | 'light' | 'staff' | 'medium';

export interface ParticleTrailPoint {
  x: number;
  y: number;
  alpha: number;
  color: string;
  radius: number;
}

/**
 * Weapon physics & inertia dynamics parameters.
 */
export interface WeaponPhysicsDynamics {
  category: WeaponPhysicsCategory;
  wristLagAngle: number;       // Inertial drag lag angle on the wrist/palm
  reboundOffsetX: number;      // Rebound oscillation X offset upon heavy impact
  reboundOffsetY: number;      // Rebound oscillation Y offset upon heavy impact
  isTwoHandedGrip: boolean;    // Whether offhand assists two-handed sword grip
  trailPoints: ParticleTrailPoint[]; // Light weapon fingertips & heavy blade trails
}

/**
 * Articulated fine-grained skeleton pose.
 * Subdivides simple 6-slot limbs into realistic skeletal physics joints.
 */
export interface FineSkeletonPose {
  pelvis: BoneTransform;   // Lower core / Center of mass
  chest: BoneTransform;    // Upper ribcage / Thorax twist
  head: BoneTransform;     // Cranium & neck pivot
  armRight: LimbChain2D;   // Mainhand arm (Upper Arm -> Forearm -> Palm)
  armLeft: LimbChain2D;    // Offhand arm (Upper Arm -> Forearm -> Palm)
  legRight: LimbChain2D;   // Leading leg (Thigh -> Shin -> Foot)
  legLeft: LimbChain2D;    // Trailing leg (Thigh -> Shin -> Foot)
  weapon: BoneTransform;   // Dynamic weapon blade alignment & snap
  weaponDynamics?: WeaponPhysicsDynamics;
  slashTrailProgress?: number; // Dynamic blade slash sweep intensity [0..1]
  isGroundImpaling?: boolean;  // Greatsword plunged into earth state
  shockwaveProgress?: number;  // Impale radial ground crack & shockwave [0..1]
}
