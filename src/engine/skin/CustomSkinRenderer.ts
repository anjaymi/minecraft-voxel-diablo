import { Player } from '../../types';
import { customSkinManager } from './CustomSkinManager';
import { PlayerWeaponManager } from '../weapons/PlayerWeaponManager';
import { ModularSpineRenderer } from './ModularSpineRenderer';

export class CustomSkinRenderer {
  /**
   * Attempt to render the player using either modular Spine puppet or custom PNG avatar.
   * Returns true if custom skin was successfully rendered.
   */
  public static renderCustomSkin(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    isFacingLeft: boolean
  ): boolean {
    const activeMode = customSkinManager.getActiveMode();
    if (activeMode === 'default') {
      return false;
    }

    ctx.save();

    // Hurt red silhouette or invulnerability flash
    if (player.hurtTimer > 0) {
      ctx.filter = 'drop-shadow(0 0 6px #ef4444) brightness(1.3) sepia(0.5) hue-rotate(-50deg)';
    } else if (player.invulnerableTimer > 0 && Math.floor(time * 20) % 2 === 0) {
      ctx.filter = 'brightness(2.2)';
    }

    if (activeMode === 'spine') {
      const config = customSkinManager.getSpinePuppet();
      if (config && config.enabled) {
        const rendered = ModularSpineRenderer.renderSpinePuppet(ctx, config, player, time);
        if (rendered) {
          ctx.filter = 'none';
          ctx.restore();
          return true;
        }
      }
    }

    const skinConfig = customSkinManager.getSkin();
    if (!skinConfig || !skinConfig.enabled || !skinConfig.dataUrl) {
      ctx.filter = 'none';
      ctx.restore();
      return false;
    }

    const img = customSkinManager.getLoadedImage();
    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.filter = 'none';
      ctx.restore();
      return false; // Still loading or invalid image, fallback
    }

    // 1. Motion dynamics
    const isMoving = Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05;
    const walkCycle = isMoving ? Math.sin(time * 12) : 0;
    const idleBob = Math.sin(time * 3.2) * 1.2;
    const bodyBob = skinConfig.bounceAnimation
      ? (isMoving ? Math.abs(walkCycle) * 3.5 : idleBob)
      : 0;

    // Subtle waddle roll when running
    if (skinConfig.bounceAnimation && isMoving) {
      const roll = Math.sin(time * 12) * 0.05;
      ctx.rotate(roll);
    }

    // 2. Base Dimensions (Unscaled ~70px baseline; CharacterOrientationManager applies unified 40% -> 28px in game)
    const baseTargetHeight = 70 * (skinConfig.scale || 1.0);
    const aspect = img.naturalWidth / img.naturalHeight;
    const renderWidth = baseTargetHeight * aspect;
    const renderHeight = baseTargetHeight;

    // Anchor at bottom center (feet at y: 0)
    const drawX = -renderWidth / 2;
    const drawY = -renderHeight - bodyBob + (skinConfig.offsetY || 0);

    // 3. Draw Custom PNG Image with Pixel Art Crisp Smoothing
    ctx.save();
    ctx.imageSmoothingEnabled = renderWidth < 64; // Retain pixel crispness for small sprites
    ctx.drawImage(img, drawX, drawY, renderWidth, renderHeight);
    ctx.restore();

    // 4. Optional Handheld Weapon Overlay
    if (skinConfig.showWeaponOverlay) {
      ctx.save();
      const weaponX = renderWidth * 0.25;
      const weaponY = drawY + renderHeight * 0.65;
      ctx.translate(weaponX, weaponY);
      ctx.scale(0.55, 0.55);
      PlayerWeaponManager.drawMainWeapon(ctx, player, time);
      ctx.restore();
    }

    // 5. Gameplay Visual Auras
    this.drawAuras(ctx, player, time, renderHeight);

    ctx.filter = 'none';
    ctx.restore();
    return true;
  }

  private static drawAuras(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    renderHeight: number
  ) {
    // Golden Apple Divine Aegis Aura
    if (player.goldenAppleTimer && player.goldenAppleTimer > 0) {
      ctx.save();
      const pulse = Math.sin(time * 6) * 2;
      const r = Math.max(26, renderHeight * 0.55) + pulse;
      const centerY = -renderHeight * 0.45;

      const aegisGrad = ctx.createRadialGradient(0, centerY, r * 0.4, 0, centerY, r);
      aegisGrad.addColorStop(0, 'rgba(254, 240, 138, 0.05)');
      aegisGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.25)');
      aegisGrad.addColorStop(1, 'rgba(251, 191, 36, 0.85)');

      ctx.fillStyle = aegisGrad;
      ctx.beginPath();
      ctx.arc(0, centerY, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // Whirlwind Spin
    if (player.whirlwindTimer && player.whirlwindTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.ellipse(0, -renderHeight * 0.4, renderHeight * 0.7, renderHeight * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
