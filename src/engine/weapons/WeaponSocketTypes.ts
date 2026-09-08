export type WeaponSubType =
  | 'sword'
  | 'greatsword'
  | 'dagger'
  | 'axe'
  | 'hammer'
  | 'staff'
  | 'wand'
  | 'bow'
  | 'crossbow';

export interface WeaponSocketPreset {
  /** Target weapon subtype identifier */
  subType: WeaponSubType;
  /** Label for display in config modal */
  label: string;
  /** Idle/walking resting angle in radians relative to forearm/hand forward vector */
  idleAngle: number;
  /** Positional offset X in local hand socket coordinates (px) */
  idleOffsetX: number;
  /** Positional offset Y in local hand socket coordinates (px) */
  idleOffsetY: number;
  /** Visual scale multiplier for this weapon */
  scale: number;
  /** Grip point offset along the weapon shaft/handle (px) */
  gripPointY: number;
  /** Additional angular bias during combat slash execution (rad) */
  combatAngleOffset: number;
}

export interface WeaponSocketTransformResult {
  x: number;
  y: number;
  angle: number;
  scale: number;
  recoil: number;
  isCombatGrip: boolean;
}
