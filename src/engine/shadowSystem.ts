import { worldToScreen, TILE_WIDTH, TILE_HEIGHT } from './isometric';
import { Player, Enemy, DropItem } from '../types';

export interface ShadowConfig {
  radiusX: number;
  radiusY: number;
  altitude?: number;
  vx?: number;
  vy?: number;
  baseOpacity?: number;
  ambientHaloColor?: string;
  ambientHaloRadius?: number;
  shadowTint?: string; // Optional tint (e.g. darker nether/void)
}

/**
 * High-fidelity dynamic blurred shadow projection system for isometric entities.
 * Creates physically grounded contact occlusion, realistic altitude diffusion,
 * and directional velocity motion blur.
 */
export class ShadowSystem {
  /**
   * Render a soft, multi-tier blurred shadow projection on the floor (z = 0)
   */
  public drawBlurredShadow(
    ctx: CanvasRenderingContext2D,
    screenGroundX: number,
    screenGroundY: number,
    config: ShadowConfig
  ) {
    const altitude = Math.max(0, config.altitude ?? 0);
    const vx = config.vx ?? 0;
    const vy = config.vy ?? 0;
    const baseOpacity = config.baseOpacity ?? 0.55;

    // 1. Altitude diffusion physics:
    // As altitude increases, the contact core shrinks or softens while penumbra expands.
    const altitudeSoftness = 1 + altitude * 0.45;
    const opacityMult = Math.max(0.12, 1 / (1 + altitude * 1.8));
    const finalOpacity = baseOpacity * opacityMult;

    let rx = config.radiusX * altitudeSoftness;
    let ry = config.radiusY * altitudeSoftness;

    // 2. Dynamic Motion Blur & Velocity Elongation
    // In isometric projection, world (vx, vy) translates to screen (vx - vy) * 32, (vx + vy) * 16
    const screenVx = (vx - vy) * 12;
    const screenVy = (vx + vy) * 6;
    const speed = Math.hypot(screenVx, screenVy);

    ctx.save();
    ctx.translate(screenGroundX, screenGroundY);

    // Apply motion elongation if moving significantly
    if (speed > 0.4) {
      const motionAngle = Math.atan2(screenVy, screenVx);
      ctx.rotate(motionAngle);
      const stretch = Math.min(1.8, 1 + speed * 0.05);
      rx *= stretch;
      ry = Math.max(ry * 0.85, 3);
    }

    // 3. Optional Ambient Aura Halo (e.g. for Legendary drops, Elite bosses, Nether beasts)
    if (config.ambientHaloColor) {
      const haloR = (config.ambientHaloRadius ?? rx * 1.35);
      const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, haloR);
      haloGrad.addColorStop(0, config.ambientHaloColor);
      haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, haloR, haloR * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Multi-stop Radial Blur Penumbra
    // Inner contact shadow (darkest, tight to ground)
    const shadowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    const coreAlpha = Math.min(0.85, finalOpacity * 1.25);
    const midAlpha = finalOpacity * 0.5;
    const edgeAlpha = finalOpacity * 0.15;

    shadowGrad.addColorStop(0, `rgba(8, 8, 12, ${coreAlpha.toFixed(3)})`);
    shadowGrad.addColorStop(0.35, `rgba(12, 12, 18, ${midAlpha.toFixed(3)})`);
    shadowGrad.addColorStop(0.72, `rgba(15, 15, 22, ${edgeAlpha.toFixed(3)})`);
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hard ground contact ambient occlusion dot (only when grounded or near floor)
    if (altitude < 0.2) {
      const contactAlpha = (1 - altitude / 0.2) * 0.35;
      const contactGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * 0.5);
      contactGrad.addColorStop(0, `rgba(0, 0, 0, ${contactAlpha.toFixed(3)})`);
      contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = contactGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Render dynamic blurred shadow for Player
   */
  public drawPlayerShadow(
    ctx: CanvasRenderingContext2D,
    player: Player,
    camX: number,
    camY: number,
    width: number,
    height: number
  ) {
    const sGround = worldToScreen(player.x, player.y, 0, camX, camY, width, height);

    // If player has golden apple divine aura active, cast a faint golden ground fringe
    const hasGapple = player.goldenAppleTimer && player.goldenAppleTimer > 0;
    const ambientHalo = hasGapple ? 'rgba(251, 191, 36, 0.25)' : undefined;

    this.drawBlurredShadow(ctx, sGround.x, sGround.y, {
      radiusX: 16,
      radiusY: 8.5,
      altitude: player.z,
      vx: player.vx,
      vy: player.vy,
      baseOpacity: 0.58,
      ambientHaloColor: ambientHalo,
      ambientHaloRadius: 28,
    });
  }

  /**
   * Render dynamic blurred shadow for Enemies
   */
  public drawEnemyShadow(
    ctx: CanvasRenderingContext2D,
    enemy: Enemy,
    camX: number,
    camY: number,
    width: number,
    height: number
  ) {
    const sGround = worldToScreen(enemy.x, enemy.y, 0, camX, camY, width, height);
    const size = enemy.size || 1.0;

    // Custom radii for specific enemy body shapes
    let baseRx = 14 * size;
    let baseRy = 7.5 * size;
    let ambientHaloColor: string | undefined;

    if (enemy.type === 'spider') {
      baseRx = 18 * size; // Wide spider legs footprint
      baseRy = 9.5 * size;
    } else if (enemy.type === 'enderman') {
      baseRx = 12 * size; // Slender tall silhouette
      baseRy = 6.5 * size;
      ambientHaloColor = 'rgba(192, 132, 252, 0.18)'; // Ender void aura
    } else if (enemy.type === 'wither_boss') {
      baseRx = 26 * size;
      baseRy = 14 * size;
      ambientHaloColor = 'rgba(239, 68, 68, 0.3)'; // Wither blood doom aura
    } else if (enemy.isElite) {
      ambientHaloColor = 'rgba(245, 158, 11, 0.25)'; // Gold elite champion aura
    }

    this.drawBlurredShadow(ctx, sGround.x, sGround.y, {
      radiusX: baseRx,
      radiusY: baseRy,
      altitude: enemy.z,
      vx: enemy.vx,
      vy: enemy.vy,
      baseOpacity: enemy.type === 'wither_boss' ? 0.65 : 0.52,
      ambientHaloColor,
      ambientHaloRadius: baseRx * 1.4,
    });
  }

  /**
   * Render dynamic blurred shadow for Drop Items
   */
  public drawDropShadow(
    ctx: CanvasRenderingContext2D,
    drop: DropItem,
    camX: number,
    camY: number,
    width: number,
    height: number
  ) {
    const sGround = worldToScreen(drop.x, drop.y, 0, camX, camY, width, height);

    // Colored soft ambient halo for rare & legendary loot on the floor
    let ambientHaloColor: string | undefined;
    if (drop.rarity === 'legendary') {
      ambientHaloColor = 'rgba(251, 146, 60, 0.35)'; // Orange legendary radiant halo
    } else if (drop.rarity === 'rare') {
      ambientHaloColor = 'rgba(168, 85, 247, 0.28)'; // Purple rare halo
    } else if (drop.rarity === 'magic') {
      ambientHaloColor = 'rgba(56, 189, 248, 0.2)'; // Blue magic halo
    } else if (drop.isEmerald) {
      ambientHaloColor = 'rgba(16, 185, 129, 0.3)'; // Emerald green gleam
    }

    this.drawBlurredShadow(ctx, sGround.x, sGround.y, {
      radiusX: 13,
      radiusY: 6.8,
      altitude: drop.z,
      vx: drop.vx,
      vy: drop.vy,
      baseOpacity: 0.48,
      ambientHaloColor,
      ambientHaloRadius: 22,
    });
  }
}

export const shadowSystem = new ShadowSystem();
