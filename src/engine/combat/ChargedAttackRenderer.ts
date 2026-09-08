import { Player } from '../../types';
import { ChargeStage } from './ChargedAttackTypes';

export class ChargedAttackRenderer {
  /**
   * Draws ground energy convergence rings and overhead charging meter.
   */
  public static drawChargeIndicator(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number
  ) {
    if (!player.isChargingAttack || (player.chargeTime || 0) < 0.1) return;

    const chargeTime = player.chargeTime || 0;
    const maxCharge = player.maxChargeTime || 0.72;
    const progress = Math.min(1.0, chargeTime / maxCharge);
    const isMax = player.chargeLevel === ChargeStage.MAX_CHARGED;
    const isBear = player.wildShapeForm === 'bear' && (player.wildShapeTimer || 0) > 0;

    // Theme color based on class/form
    const mainColor = isBear ? '#10b981' : isMax ? '#fbbf24' : '#38bdf8';
    const glowColor = isBear ? '#34d399' : isMax ? '#f59e0b' : '#0284c7';

    ctx.save();

    // 1. Ground Converging Ring (Isometric Flattened)
    ctx.save();
    ctx.scale(1, 0.52);

    const baseRadius = 36;
    const currentRadius = isMax ? 26 + Math.sin(time * 14) * 2 : baseRadius - progress * 10;

    // Inward glowing pulse circle
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = isMax ? 3 : 1.8;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isMax ? 14 : 6;
    ctx.beginPath();
    ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary rotating tick marks
    ctx.rotate(time * (isMax ? 6 : 3));
    ctx.fillStyle = isMax ? '#fef08a' : '#ffffff';
    const ticks = isMax ? 8 : 4;
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      const tx = Math.cos(a) * currentRadius;
      const ty = Math.sin(a) * currentRadius;
      ctx.fillRect(tx - 2, ty - 2, 4, 4);
    }
    ctx.restore();

    // 2. Converging Inward Sparkles towards center
    const particleCount = isMax ? 8 : 4;
    for (let i = 0; i < particleCount; i++) {
      const pPhase = (time * 4 + (i / particleCount)) % 1;
      const dist = (1 - pPhase) * 32;
      const pAngle = (i / particleCount) * Math.PI * 2 + time * 2;
      const px = Math.cos(pAngle) * dist;
      const py = Math.sin(pAngle) * (dist * 0.52) - 18 * (1 - pPhase);

      ctx.fillStyle = isMax ? '#fef08a' : mainColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, 1.8 * pPhase + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Overhead Charge Bar & Text Status
    const barW = isBear ? 46 : 38;
    const barH = 5;
    const barY = isBear ? -58 : -46;

    // Background container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2, 2.5);
    ctx.fill();
    ctx.stroke();

    // Fill bar
    ctx.fillStyle = isMax ? '#fbbf24' : mainColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isMax ? 8 : 3;
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, barW * progress, barH, 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Status Label
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isMax ? '#fef08a' : '#f8fafc';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    if (isMax) {
      ctx.fillText(isBear ? '🔥 狂暴蓄力完成!' : '⚡ 蓄力完成!', 0, barY - 4);
    } else {
      ctx.fillText('蓄力中...', 0, barY - 4);
    }
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
