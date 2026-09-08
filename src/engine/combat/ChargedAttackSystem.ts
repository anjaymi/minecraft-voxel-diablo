import { Player } from '../../types';
import { ChargeStage, DEFAULT_CHARGE_CONFIG, ChargedAttackConfig } from './ChargedAttackTypes';
import { soundManager } from '../../audio/soundManager';

export class ChargedAttackSystem {
  private static config: ChargedAttackConfig = DEFAULT_CHARGE_CONFIG;
  private static playedMaxChime = false;

  /**
   * Resets or begins attack charging when user presses attack input.
   */
  public static startCharging(player: Player) {
    if (player.attackCooldown > 0) return;
    player.isChargingAttack = true;
    player.chargeTime = 0;
    player.chargeLevel = ChargeStage.NONE;
    player.maxChargeTime = this.config.maxChargeDuration;
    this.playedMaxChime = false;
  }

  /**
   * Updates charging progress every frame while input is active.
   */
  public static update(player: Player, dt: number, isInputDown: boolean) {
    if (!player.isChargingAttack) return;

    if (!isInputDown) {
      return;
    }

    player.chargeTime = (player.chargeTime || 0) + dt;

    if (player.chargeTime >= this.config.maxChargeDuration) {
      if (player.chargeLevel !== ChargeStage.MAX_CHARGED) {
        player.chargeLevel = ChargeStage.MAX_CHARGED;
        if (!this.playedMaxChime) {
          this.playedMaxChime = true;
          soundManager.playBowCharge();
        }
      }
    } else if (player.chargeTime >= this.config.minChargeDuration) {
      player.chargeLevel = ChargeStage.CHARGING;
    } else {
      player.chargeLevel = ChargeStage.NONE;
    }
  }

  /**
   * Evaluates if a charged attack was successfully released on input release.
   * Returns charge ratio (0.0 to 1.0) if successful, or -1 if was just a tap / quick click.
   */
  public static releaseCharging(player: Player): { isCharged: boolean; chargeRatio: number } {
    if (!player.isChargingAttack) {
      return { isCharged: false, chargeRatio: 0 };
    }

    const duration = player.chargeTime || 0;
    player.isChargingAttack = false;
    this.playedMaxChime = false;

    if (duration >= this.config.minChargeDuration) {
      const chargeRange = this.config.maxChargeDuration - this.config.minChargeDuration;
      const rawRatio = (duration - this.config.minChargeDuration) / Math.max(0.01, chargeRange);
      const chargeRatio = Math.max(0.2, Math.min(1.0, rawRatio));
      player.chargeTime = 0;
      player.chargeLevel = ChargeStage.NONE;
      return { isCharged: true, chargeRatio };
    }

    player.chargeTime = 0;
    player.chargeLevel = ChargeStage.NONE;
    return { isCharged: false, chargeRatio: 0 };
  }

  /**
   * Cancels charge immediately (e.g. during dash or heavy hit).
   */
  public static cancelCharge(player: Player) {
    player.isChargingAttack = false;
    player.chargeTime = 0;
    player.chargeLevel = ChargeStage.NONE;
    this.playedMaxChime = false;
  }

  /**
   * Returns movement speed damping factor during active attack charge.
   */
  public static getSpeedMultiplier(player: Player): number {
    if (player.isChargingAttack && (player.chargeTime || 0) > 0.12) {
      return this.config.chargeSpeedMultiplier;
    }
    return 1.0;
  }
}
