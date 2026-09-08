export enum ChargeStage {
  NONE = 0,
  CHARGING = 1,
  MAX_CHARGED = 2,
}

export interface ChargedAttackConfig {
  minChargeDuration: number; // Duration to qualify as charged attack (e.g. 0.28s)
  maxChargeDuration: number; // Duration to achieve max tier power (e.g. 0.75s)
  chargeSpeedMultiplier: number; // Movement speed factor while charging (e.g. 0.6)
}

export const DEFAULT_CHARGE_CONFIG: ChargedAttackConfig = {
  minChargeDuration: 0.26,
  maxChargeDuration: 0.72,
  chargeSpeedMultiplier: 0.62,
};
