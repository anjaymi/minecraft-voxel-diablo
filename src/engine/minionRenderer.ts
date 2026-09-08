import { SummonedMinion } from '../types';
import { worldToScreen } from './isometric';
import { MinionAuraRenderer } from './minionAuraRenderer';
import { MinionHighResModels } from './minionHighResModels';

export class MinionRenderer {
  public static drawMinion(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    camX: number,
    camY: number,
    width: number,
    height: number,
    time: number
  ) {
    const s = worldToScreen(minion.x, minion.y, minion.z || 0, camX, camY, width, height);
    const theme = MinionAuraRenderer.getTheme(minion);

    ctx.save();

    // 1. Dynamic Soft Contact Shadow
    const shadowR = minion.type === 'treant' ? 15 : minion.type === 'wolf' ? 12 : 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, shadowR, shadowR * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Ground Summoning Sigil & Dynamic Aura
    ctx.save();
    ctx.translate(s.x, s.y);
    MinionAuraRenderer.drawGroundSigil(ctx, minion, time);
    ctx.restore();

    // Bobbing stride physics
    const bob = Math.sin(time * 6 + minion.x * 2) * 1.8;
    ctx.translate(s.x, s.y + bob);

    // 3. Friendly Alliance Glow & Enrage Burst
    ctx.save();
    if (minion.isEnraged) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 4;
    }

    // 4. High-Resolution Sprite Model Rendering
    if (minion.type === 'wolf') {
      MinionHighResModels.drawWolf(ctx, minion, time);
    } else if (minion.type === 'skeleton') {
      MinionHighResModels.drawSkeleton(ctx, minion, time);
    } else if (minion.type === 'treant') {
      MinionHighResModels.drawTreant(ctx, minion, time);
    }
    ctx.restore();

    // 5. Dynamic 3D Orbiting Particle Halo & Soul Wisps
    MinionAuraRenderer.drawOrbitingParticles(ctx, minion, time);

    // 6. Friendly Alliance Marker & Overhead HUD Status
    MinionAuraRenderer.drawFriendlyAllianceMarker(ctx, minion);
    this.drawOverheadHUD(ctx, minion, theme.primary);

    ctx.restore();
  }

  private static drawOverheadHUD(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    themeColor: string
  ) {
    const hpRatio = Math.max(0, Math.min(1, minion.hp / Math.max(1, minion.maxHp)));
    const barW = 34;
    const barH = 4;
    const barY = -35;

    // HP Bar Frame
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2, 2);
    ctx.fill();
    ctx.stroke();

    // HP Color based on current HP & Enraged state
    const hpColor = minion.isEnraged ? '#f43f5e' : themeColor;
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(-barW / 2, barY, Math.max(0, barW * hpRatio), barH, 1.5);
    ctx.fill();

    // Cooldown Readiness Bar
    const maxCd = minion.maxAttackCooldown || 0.8;
    const cdRatio = minion.attackCooldown > 0 ? Math.max(0, 1 - minion.attackCooldown / maxCd) : 1;
    const cdBarY = barY + barH + 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(-barW / 2, cdBarY, barW, 2);
    ctx.fillStyle = cdRatio >= 1 ? '#facc15' : '#38bdf8';
    ctx.fillRect(-barW / 2, cdBarY, barW * cdRatio, 2);

    // Overhead Friendly Indicator & Name Label
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText(`${minion.icon} ${minion.name} (${Math.round(hpRatio * 100)}%)`, 0, barY - 4);
    ctx.shadowBlur = 0;
  }
}
