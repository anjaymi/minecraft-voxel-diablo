export interface MeleeSlashPose {
  isActive: boolean;
  phase: number; // 0.0 -> 1.0
  stage: 'windup' | 'slash' | 'impact' | 'recovery';
  comboStep: number;
  subType: string;
  isTwoHanded: boolean;

  // 1. Torso Dynamics (Lunge forward, crouch squat, explosive forward lean)
  torso: {
    offsetX: number; // Forward lunge displacement
    offsetY: number; // Center of gravity drop (squat / crouch)
    rotation: number; // Torso forward lean & rotational twist
    squashX: number;
    squashY: number;
  };

  // 2. Head Dynamics
  head: {
    offsetX: number;
    offsetY: number;
    rotation: number; // Focus glance
  };

  // 3. Stance Legs Dynamics
  legs: {
    lungeX: number; // Forward step
    leftLegRot: number;
    rightLegRot: number;
    leftLift: number;
    rightLift: number;
  };

  // 4. Mainhand Arm Dynamics (Shoulder -> Elbow -> Wrist)
  armRight: {
    shoulderAngle: number;
    elbowAngle: number;
    wristAngle: number;
    handOffsetX: number;
    handOffsetY: number;
  };

  // 5. Offhand Arm Dynamics
  armLeft: {
    angle: number;
    offsetX: number;
    offsetY: number;
  };

  // 6. Blade & Weapon Dynamics
  weapon: {
    angle: number; // In-hand rotation angle
    pivotOffsetX: number;
    pivotOffsetY: number;
    thrustX: number; // Forward blade reach extension
    thrustY: number;
    recoilShake: number; // Impact micro-tremble
    smearIntensity: number; // Blade crescent trail opacity
    smearArcStart: number;
    smearArcEnd: number;
    smearRadius: number;
  };
}

export const DEFAULT_IDLE_POSE: MeleeSlashPose = {
  isActive: false,
  phase: 0,
  stage: 'recovery',
  comboStep: 0,
  subType: 'sword',
  isTwoHanded: false,
  torso: { offsetX: 0, offsetY: 0, rotation: 0, squashX: 1, squashY: 1 },
  head: { offsetX: 0, offsetY: 0, rotation: 0 },
  legs: { lungeX: 0, leftLegRot: 0, rightLegRot: 0, leftLift: 0, rightLift: 0 },
  armRight: { shoulderAngle: 0, elbowAngle: 0, wristAngle: 0, handOffsetX: 0, handOffsetY: 0 },
  armLeft: { angle: 0, offsetX: 0, offsetY: 0 },
  weapon: {
    angle: 0.2,
    pivotOffsetX: 0,
    pivotOffsetY: 0,
    thrustX: 0,
    thrustY: 0,
    recoilShake: 0,
    smearIntensity: 0,
    smearArcStart: 0,
    smearArcEnd: 0,
    smearRadius: 28,
  },
};
