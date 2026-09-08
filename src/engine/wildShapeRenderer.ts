import { Player } from '../types';
import { WildShapeBearModel } from './wildshape/WildShapeBearModel';
import { WildShapeParticleSystem } from './wildshape/WildShapeParticleSystem';

export class WildShapeRenderer {
  public static isTransformed(player: Player): boolean {
    return player.wildShapeForm === 'bear' && (player.wildShapeTimer || 0) > 0;
  }

  /**
   * Renders the spellcasting anticipation wind-up aura and runic pre-warning circle
   * for spellcaster classes (Mage, Summoner, Druid).
   */
  public static drawCastingWarningAura(
    ctx: CanvasRenderingContext2D,
    player: Player,
    sx: number,
    sy: number,
    time: number
  ) {
    if (!player.castLockTimer || player.castLockTimer <= 0) return;

    ctx.save();
    const totalTime = player.castTotalTime || 0.22;
    const progress = Math.max(0, Math.min(1, 1 - player.castLockTimer / totalTime));
    const auraColor = player.castSpellColor || '#a855f7';

    const radius = 26 + Math.sin(time * 10) * 2;
    ctx.translate(sx, sy);

    // Outer rotating magic circle
    ctx.save();
    ctx.rotate(time * 3);
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius, radius * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = auraColor;
    for (let i = 0; i < 6; i++) {
      const gAngle = (i / 6) * Math.PI * 2;
      const gx = Math.cos(gAngle) * radius;
      const gy = Math.sin(gAngle) * (radius * 0.55);
      ctx.fillRect(gx - 2, gy - 2, 4, 4);
    }
    ctx.restore();

    // Inner counter-rotating ring
    ctx.save();
    ctx.rotate(-time * 4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.65, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Ascending magic pillar
    const grad = ctx.createLinearGradient(0, 0, 0, -45);
    grad.addColorStop(0, `${auraColor}88`);
    grad.addColorStop(0.7, `${auraColor}22`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.8, radius * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Overhead Casting Progress Bar
    const barW = 44;
    const barH = 5;
    const barY = -56;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = auraColor;
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, barW * progress, barH, 2);
    ctx.fill();

    if (player.castSpellName) {
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(`✨ 咏唱中: ${player.castSpellName}`, 0, barY - 4);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  /**
   * Renders the complete Wild Shape Bear form with nature flowing particles and heavy body.
   */
  public static drawBearForm(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    isFacingLeft: boolean
  ) {
    ctx.save();

    // 1. Swirling 3D Airborne Nature Particles & Druidic Ground Runes
    WildShapeParticleSystem.drawNatureAura(ctx, player, time);

    // 2. Heavy Beast Grizzled Model
    WildShapeBearModel.drawBearBody(ctx, player, time);

    ctx.restore();
  }
}
