import { SummonedMinion } from '../types';

export interface MinionAuraTheme {
  primary: string;
  secondary: string;
  glow: string;
  particleType: 'fire' | 'leaf' | 'soul';
}

export class MinionAuraRenderer {
  /**
   * Retrieves color scheme based on minion type and enraged state.
   */
  public static getTheme(minion: SummonedMinion): MinionAuraTheme {
    if (minion.isEnraged) {
      return {
        primary: '#ef4444',
        secondary: '#f59e0b',
        glow: 'rgba(239, 68, 68, 0.7)',
        particleType: 'fire',
      };
    }

    switch (minion.type) {
      case 'wolf':
        return {
          primary: '#38bdf8',
          secondary: '#818cf8',
          glow: 'rgba(56, 189, 248, 0.65)',
          particleType: 'soul',
        };
      case 'skeleton':
        return {
          primary: '#c084fc',
          secondary: '#06b6d4',
          glow: 'rgba(192, 132, 252, 0.65)',
          particleType: 'soul',
        };
      case 'treant':
        return {
          primary: '#10b981',
          secondary: '#f59e0b',
          glow: 'rgba(16, 185, 129, 0.65)',
          particleType: 'leaf',
        };
      default:
        return {
          primary: '#60a5fa',
          secondary: '#93c5fd',
          glow: 'rgba(96, 165, 250, 0.5)',
          particleType: 'soul',
        };
    }
  }

  /**
   * Draws ground summoning contract sigil (rotating magic rings, runes, and expanding pulse).
   */
  public static drawGroundSigil(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    const theme = this.getTheme(minion);
    const baseRadius = minion.type === 'treant' ? 22 : minion.type === 'wolf' ? 17 : 15;
    const pulse = (time * 1.5) % 1;
    const pulseRadius = baseRadius * (1 + pulse * 0.45);
    const pulseAlpha = Math.max(0, (1 - pulse) * 0.4);

    ctx.save();

    // 1. Expanding energy pulse ripple
    ctx.strokeStyle = theme.primary;
    ctx.globalAlpha = pulseAlpha;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, pulseRadius, pulseRadius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Outer Rotating Sigil Ring
    ctx.globalAlpha = minion.isEnraged ? 0.95 : 0.75;
    ctx.save();
    ctx.rotate(time * 0.9);
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseRadius, baseRadius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Outer Rune Satellite Glyphs
    const glyphCount = 4;
    for (let i = 0; i < glyphCount; i++) {
      const angle = (i / glyphCount) * Math.PI * 2;
      const gx = Math.cos(angle) * baseRadius;
      const gy = Math.sin(angle) * (baseRadius * 0.5);
      ctx.fillStyle = theme.secondary;
      ctx.fillRect(gx - 1.5, gy - 1.5, 3, 3);
    }
    ctx.restore();

    // 3. Counter-rotating Inner Magic Ring
    ctx.save();
    ctx.rotate(-time * 1.4);
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, baseRadius * 0.65, baseRadius * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Draws dynamic 3D orbiting soul particles / embers around minion.
   */
  public static drawOrbitingParticles(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    const theme = this.getTheme(minion);
    const count = minion.isEnraged ? 7 : 5;
    const orbitRadiusX = minion.type === 'treant' ? 24 : 18;
    const orbitRadiusY = orbitRadiusX * 0.45;
    const seed = (minion.id.charCodeAt(minion.id.length - 1) || 7) * 1.3;

    ctx.save();
    for (let i = 0; i < count; i++) {
      const speed = 2.2 + (i % 3) * 0.4;
      const phase = (i / count) * Math.PI * 2 + seed;
      const curAngle = time * speed + phase;

      const px = Math.cos(curAngle) * orbitRadiusX;
      const py = Math.sin(curAngle) * orbitRadiusY - 14 + Math.sin(time * 3 + i) * 5;
      const particleAlpha = 0.5 + Math.sin(curAngle) * 0.4;
      const pSize = 2.0 + Math.sin(time * 4 + i) * 0.8;

      ctx.save();
      ctx.globalAlpha = Math.max(0.2, Math.min(1, particleAlpha));
      ctx.fillStyle = i % 2 === 0 ? theme.primary : theme.secondary;
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 8;

      if (theme.particleType === 'leaf') {
        // Drifting green leaf shape
        ctx.translate(px, py);
        ctx.rotate(time * 3 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, pSize * 1.5, pSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing soul wisp / ember
        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fill();

        // White core center for high luminance
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, pSize * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Overhead friendly alliance marker (Diamond crest ensuring absolute distinction from enemies).
   */
  public static drawFriendlyAllianceMarker(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion
  ) {
    ctx.save();
    const markerY = -46;
    const theme = this.getTheme(minion);

    // Diamond crest badge
    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, markerY - 3.5);
    ctx.lineTo(3.5, markerY);
    ctx.lineTo(0, markerY + 3.5);
    ctx.lineTo(-3.5, markerY);
    ctx.closePath();
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, markerY - 1, 2, 2);
    ctx.restore();
  }
}
