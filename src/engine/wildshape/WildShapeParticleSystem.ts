import { Player } from '../../types';

export interface WildNatureParticle {
  x: number;
  y: number;
  radius: number;
  angle: number;
  angularSpeed: number;
  height: number;
  size: number;
  alpha: number;
  color: string;
  leafTilt: number;
}

export class WildShapeParticleSystem {
  private static particles: WildNatureParticle[] = [];
  private static initialized = false;

  private static initIfNeeded() {
    if (this.initialized) return;
    this.initialized = true;
    for (let i = 0; i < 24; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        radius: 18 + Math.random() * 22,
        angle: (i / 24) * Math.PI * 2,
        angularSpeed: 1.8 + Math.random() * 2.2,
        height: -32 + Math.random() * 30,
        size: 2.2 + Math.random() * 3.5,
        alpha: 0.4 + Math.random() * 0.6,
        color: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#34d399' : '#86efac',
        leafTilt: Math.random() * Math.PI,
      });
    }
  }

  /**
   * Updates and draws swirling natural leaves, vitality motes, and ground roots
   * surrounding the transformed druid bear.
   */
  public static drawNatureAura(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number
  ) {
    this.initIfNeeded();

    const isMoving = Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05;
    const breathe = Math.sin(time * 4) * 2;

    ctx.save();

    // 1. Ground Vitality Runic Ring with pulsing druidic energy
    const groundPulse = 28 + Math.sin(time * 3) * 3;
    ctx.save();
    ctx.scale(1, 0.52); // Isometric ground projection

    // Outer soft verdant glow
    const grad = ctx.createRadialGradient(0, 0, groundPulse * 0.4, 0, 0, groundPulse * 1.3);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
    grad.addColorStop(0.6, 'rgba(5, 150, 105, 0.14)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, groundPulse * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Sacred ancient ring
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, groundPulse, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating 4 cardinal runes
    ctx.rotate(time * 1.2);
    ctx.fillStyle = '#6ee7b7';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const rx = Math.cos(a) * groundPulse;
      const ry = Math.sin(a) * groundPulse;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Swirling 3D Airborne Nature Particles (Leaves & Emerald Wisps)
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const curAngle = p.angle + time * p.angularSpeed;
      const curRadius = p.radius + Math.sin(time * 2.5 + i) * 4;
      
      const px = Math.cos(curAngle) * curRadius;
      const py = Math.sin(curAngle) * (curRadius * 0.42) + p.height + Math.sin(time * 3 + i) * 3;
      const alpha = 0.35 + Math.sin(time * 4 + i) * 0.35;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(curAngle + p.leafTilt);

      // Render miniature verdant leaves & spirit orbs
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));

      if (i % 2 === 0) {
        // Floating Willow / Oak Leaf Shape
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Nature Will-o'-Wisp Sparkle
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Stomp Shockwave / Grass trail if running
    if (isMoving && Math.sin(time * 12) > 0.75) {
      ctx.save();
      ctx.scale(1, 0.5);
      ctx.strokeStyle = 'rgba(110, 231, 183, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 10, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}
