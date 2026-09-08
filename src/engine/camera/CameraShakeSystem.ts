/**
 * Camera Shake & Visual Jitter System
 * Enhances combat impact feedback by applying rapid, stochastic micro-offsets
 * to the camera coordinates during hitStop frame-freezes and on damage events.
 */

export interface CameraShakeConfig {
  /** Maximum camera jitter offset in isometric world units */
  maxJitterOffset?: number;
  /** Frequency multiplier for noise generation */
  frequency?: number;
}

export class CameraShakeSystem {
  private static instance: CameraShakeSystem;

  // Active shake trauma & duration
  private shakeTimer: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;

  // Configuration
  private readonly defaultMaxOffset: number = 0.07; // ~2-3 screen pixels in isometric space

  public static getInstance(): CameraShakeSystem {
    if (!CameraShakeSystem.instance) {
      CameraShakeSystem.instance = new CameraShakeSystem();
    }
    return CameraShakeSystem.instance;
  }

  /**
   * Triggers a smooth decaying screen shake (e.g. from explosions, heavy hits)
   */
  public trigger(duration: number = 0.12, intensity: number = 0.35): void {
    const safeDuration = Math.max(0.04, Math.min(0.35, duration));
    const safeIntensity = Math.max(0.1, Math.min(1.0, intensity));

    this.shakeDuration = safeDuration;
    this.shakeTimer = safeDuration;
    this.shakeIntensity = Math.max(this.shakeIntensity, safeIntensity);
  }

  /**
   * Computes the shaken camera position for the current render frame.
   * Evaluates hitStop state (micro-freeze jitter) and decaying trauma shake.
   *
   * @param rawCamX Base camera X in isometric world coordinates
   * @param rawCamY Base camera Y in isometric world coordinates
   * @param hitStop Hit-stop state: boolean (active/inactive) or number (remaining seconds)
   * @param dt Frame delta time in seconds
   * @returns Jittered { camX, camY } coordinates
   */
  public updateAndApply(
    rawCamX: number,
    rawCamY: number,
    hitStop: boolean | number | undefined,
    dt: number = 0.016
  ): { camX: number; camY: number; offsetX: number; offsetY: number } {
    let totalOffsetX = 0;
    let totalOffsetY = 0;

    // 1. HitStop-Driven Stochastic Micro-Jitter (迅速且轻微的高频视觉抖动)
    const isHitStopActive = typeof hitStop === 'number' ? hitStop > 0 : Boolean(hitStop);
    if (isHitStopActive) {
      const hitStopIntensity = typeof hitStop === 'number'
        ? Math.min(1.0, Math.max(0.3, hitStop * 14))
        : 0.75;

      // Generates sharp, stochastic micro-displacement during frame freezes
      const hitScale = this.defaultMaxOffset * hitStopIntensity;
      const angle = Math.random() * Math.PI * 2;
      const magnitude = (0.5 + Math.random() * 0.5) * hitScale;

      totalOffsetX += Math.cos(angle) * magnitude;
      totalOffsetY += Math.sin(angle) * magnitude * 0.75; // 0.75 to match isometric depth aspect
    }

    // 2. Decaying Screen Shake Trauma (平滑衰减的创伤震动)
    if (this.shakeTimer > 0) {
      this.shakeTimer = Math.max(0, this.shakeTimer - dt);
      const progress = this.shakeDuration > 0 ? this.shakeTimer / this.shakeDuration : 0;
      // Non-linear quadratic trauma decay for punchy snap
      const trauma = progress * progress * this.shakeIntensity;

      const shakeMagnitude = this.defaultMaxOffset * 1.35 * trauma;
      const shakeAngle = Math.random() * Math.PI * 2;

      totalOffsetX += Math.cos(shakeAngle) * shakeMagnitude;
      totalOffsetY += Math.sin(shakeAngle) * shakeMagnitude * 0.75;

      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }

    return {
      camX: rawCamX + totalOffsetX,
      camY: rawCamY + totalOffsetY,
      offsetX: totalOffsetX,
      offsetY: totalOffsetY,
    };
  }

  /**
   * Resets all active shake states
   */
  public reset(): void {
    this.shakeTimer = 0;
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
  }
}

export const cameraShakeSystem = CameraShakeSystem.getInstance();
