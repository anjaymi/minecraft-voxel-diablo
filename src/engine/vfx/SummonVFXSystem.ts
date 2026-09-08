/**
 * Summon VFX System
 * Renders high-fidelity arcane summoning circles, ascending light pillars,
 * and celestial/necromantic runic manifestation effects.
 */

import { worldToScreen } from '../isometric';

export type SummonType = 'wolf' | 'skeleton' | 'treant' | 'demon' | 'generic';

interface SummonRune {
  glyph: string;
  angle: number;
  radius: number;
}

interface SummonPillarParticle {
  angle: number;
  radius: number;
  z: number;
  vz: number;
  size: number;
}

export interface SummonEffectInstance {
  id: string;
  x: number;
  y: number;
  type: SummonType;
  primaryColor: string;
  secondaryColor: string;
  coreColor: string;
  life: number;
  maxLife: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  runes: SummonRune[];
  particles: SummonPillarParticle[];
}

const RUNIC_GLYPHS = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᛃ', 'ᛈ', 'ᛉ', 'ᛊ', 'ᛏ', 'ᛒ', 'ᛖ', 'ᛗ', 'ᛚ', 'ᛜ', 'ᛟ', 'ᛞ'];

export class SummonVFXSystem {
  private static instance: SummonVFXSystem;
  private effects: SummonEffectInstance[] = [];

  public static getInstance(): SummonVFXSystem {
    if (!SummonVFXSystem.instance) {
      SummonVFXSystem.instance = new SummonVFXSystem();
    }
    return SummonVFXSystem.instance;
  }

  /**
   * Spawns an ethereal summoning circle & ascending light pillar at world (x, y)
   */
  public spawn(x: number, y: number, type: SummonType = 'generic', customPrimaryColor?: string): void {
    const palette = {
      wolf: { p: customPrimaryColor || '#6366f1', s: '#4338ca', c: '#e0e7ff' },
      skeleton: { p: customPrimaryColor || '#a855f7', s: '#7e22ce', c: '#f3e8ff' },
      treant: { p: customPrimaryColor || '#22c55e', s: '#15803d', c: '#dcfce7' },
      demon: { p: customPrimaryColor || '#ef4444', s: '#b91c1c', c: '#fee2e2' },
      generic: { p: customPrimaryColor || '#38bdf8', s: '#0284c7', c: '#e0f2fe' },
    }[type] || { p: customPrimaryColor || '#38bdf8', s: '#0284c7', c: '#ffffff' };

    const runes: SummonRune[] = Array.from({ length: 6 }, (_, i) => ({
      glyph: RUNIC_GLYPHS[Math.floor(Math.random() * RUNIC_GLYPHS.length)],
      angle: (i / 6) * Math.PI * 2,
      radius: 0.75,
    }));

    const particles: SummonPillarParticle[] = Array.from({ length: 12 }, () => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.55,
      z: Math.random() * 0.4,
      vz: 1.8 + Math.random() * 2.2,
      size: 2.5 + Math.random() * 2.5,
    }));

    this.effects.push({
      id: `summon_${Date.now()}_${Math.random()}`,
      x, y, type,
      primaryColor: palette.p,
      secondaryColor: palette.s,
      coreColor: palette.c,
      life: 0.9,
      maxLife: 0.9,
      radius: 1.25,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * 2.2,
      runes,
      particles,
    });
  }

  public update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff = this.effects[i];
      eff.life -= dt;
      eff.rotation += eff.rotationSpeed * dt;
      for (const p of eff.particles) {
        p.z += p.vz * dt;
        p.angle += 1.8 * dt;
      }
      if (eff.life <= 0) this.effects.splice(i, 1);
    }
  }

  /**
   * Renders the isometric ground magic circle and glowing runic glyphs
   */
  public renderGround(ctx: CanvasRenderingContext2D, camX: number, camY: number, w: number, h: number): void {
    if (this.effects.length === 0) return;
    ctx.save();
    for (const eff of this.effects) {
      const progress = 1 - eff.life / eff.maxLife;
      const alpha = progress < 0.2 ? progress / 0.2 : Math.max(0, (1 - progress) / 0.8);
      if (alpha <= 0.01) continue;

      const screen = worldToScreen(eff.x, eff.y, 0, camX, camY, w, h);
      const rx = eff.radius * 36;
      const ry = eff.radius * 18;

      ctx.save();
      ctx.translate(screen.x, screen.y);
      ctx.globalAlpha = alpha;

      // 1. Soft Ambient Ground Glow
      const glowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, rx * 1.15);
      glowGrad.addColorStop(0, eff.coreColor);
      glowGrad.addColorStop(0.4, eff.primaryColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Concentric Arcane Rings
      ctx.strokeStyle = eff.primaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.65, ry * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 3. Rotating Inscribed Sacred Hexagram
      ctx.strokeStyle = eff.secondaryColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a1 = eff.rotation + (i / 6) * Math.PI * 2;
        const a2 = eff.rotation + ((i + 2) / 6) * Math.PI * 2;
        ctx.moveTo(Math.cos(a1) * rx * 0.62, Math.sin(a1) * ry * 0.62);
        ctx.lineTo(Math.cos(a2) * rx * 0.62, Math.sin(a2) * ry * 0.62);
      }
      ctx.stroke();

      // 4. Orbiting Mystical Runes
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = eff.coreColor;
      for (const rune of eff.runes) {
        const curAngle = rune.angle + eff.rotation;
        ctx.fillText(rune.glyph, Math.cos(curAngle) * rx * rune.radius, Math.sin(curAngle) * ry * rune.radius);
      }

      // 5. Expanding Initial Shockwave Ring
      if (progress < 0.45) {
        const shockP = progress / 0.45;
        ctx.lineWidth = 2 * (1 - shockP);
        ctx.strokeStyle = eff.coreColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * (0.8 + shockP * 0.8), ry * (0.8 + shockP * 0.8), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Renders the ascending light beam pillar and rising ethereal motes
   */
  public renderPillars(ctx: CanvasRenderingContext2D, camX: number, camY: number, w: number, h: number): void {
    if (this.effects.length === 0) return;
    ctx.save();
    for (const eff of this.effects) {
      const progress = 1 - eff.life / eff.maxLife;
      const alpha = progress < 0.2 ? progress / 0.2 : Math.max(0, (1 - progress) / 0.8);
      if (alpha <= 0.01) continue;

      const base = worldToScreen(eff.x, eff.y, 0, camX, camY, w, h);
      const pillarHeight = 72;
      const beamHalfWidth = eff.radius * 16;

      ctx.save();
      ctx.globalAlpha = alpha * 0.75;

      // 1. Ascending Vertical Radiant Beam
      const beamGrad = ctx.createLinearGradient(base.x, base.y, base.x, base.y - pillarHeight);
      beamGrad.addColorStop(0, eff.primaryColor);
      beamGrad.addColorStop(0.35, eff.primaryColor);
      beamGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(base.x - beamHalfWidth, base.y);
      ctx.lineTo(base.x - beamHalfWidth * 0.5, base.y - pillarHeight);
      ctx.lineTo(base.x + beamHalfWidth * 0.5, base.y - pillarHeight);
      ctx.lineTo(base.x + beamHalfWidth, base.y);
      ctx.closePath();
      ctx.fill();

      // 2. Bright Ethereal Light Core
      const coreGrad = ctx.createLinearGradient(base.x, base.y, base.x, base.y - pillarHeight * 0.85);
      coreGrad.addColorStop(0, eff.coreColor);
      coreGrad.addColorStop(0.7, eff.coreColor);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.moveTo(base.x - beamHalfWidth * 0.35, base.y);
      ctx.lineTo(base.x - beamHalfWidth * 0.15, base.y - pillarHeight * 0.85);
      ctx.lineTo(base.x + beamHalfWidth * 0.15, base.y - pillarHeight * 0.85);
      ctx.lineTo(base.x + beamHalfWidth * 0.35, base.y);
      ctx.closePath();
      ctx.fill();

      // 3. Ascending Spiral Arcane Particles
      for (const p of eff.particles) {
        const pScreen = worldToScreen(
          eff.x + Math.cos(p.angle) * p.radius,
          eff.y + Math.sin(p.angle) * p.radius,
          p.z,
          camX, camY, w, h
        );
        ctx.fillStyle = eff.coreColor;
        ctx.globalAlpha = alpha * Math.max(0, 1 - (p.z / 2.5));
        ctx.beginPath();
        ctx.arc(pScreen.x, pScreen.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.restore();
  }

  public clear(): void {
    this.effects = [];
  }
}

export const summonVFXSystem = SummonVFXSystem.getInstance();
