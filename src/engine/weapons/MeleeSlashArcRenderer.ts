import { MeleeSlashPose } from '../combat/MeleeKinematicsEngine';
import { WeaponColors } from './WeaponRenderTypes';

/**
 * High-octane 2D Blade Slash Arc & Crescent Smear Renderer.
 * Paints aerodynamic slashing ribbons, white-hot leading edge gleams, and elemental shockwaves.
 */
export class MeleeSlashArcRenderer {
  public static drawSlashArc(
    ctx: CanvasRenderingContext2D,
    pose: MeleeSlashPose,
    colors: WeaponColors,
    isFacingLeft: boolean,
    isMountedOnBone: boolean = false
  ): void {
    if (!pose.isActive || pose.weapon.smearIntensity <= 0.02) return;

    const { weapon, comboStep, subType } = pose;
    const intensity = weapon.smearIntensity;
    const radius = weapon.smearRadius;
    const isGreatsword = subType === 'greatsword';
    const isDagger = subType === 'dagger';

    ctx.save();
    // Anchor slash arc to weapon hilt / wrist origin
    if (!isMountedOnBone) {
      ctx.translate(weapon.thrustX, weapon.thrustY - 14);
    }

    // Dynamic Arc Orientation: In local sword coordinates (-Y is tip), arc wraps around the blade sweep
    let startAngle: number;
    let endAngle: number;

    if (isMountedOnBone) {
      if (comboStep === 1) {
        // Upward rising slash arc (from down-forward up to apex)
        startAngle = -Math.PI * 0.10;
        endAngle = -Math.PI * 0.90;
      } else if (comboStep === 2) {
        // Overhead ground slam arc (from high overhead plunging into ground)
        startAngle = -Math.PI * 0.95;
        endAngle = -Math.PI * 0.05;
      } else {
        // Downward diagonal cleave arc (from high-back slicing forward-down)
        startAngle = -Math.PI * 0.85;
        endAngle = -Math.PI * 0.15;
      }
    } else {
      startAngle = weapon.smearArcStart;
      endAngle = weapon.smearArcEnd;
    }

    // 1. Aerodynamic Crescent Ribbon Fill (Blade Wind Smear)
    const arcGrad = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.15);
    const coreColor = isGreatsword ? '#fef08a' : colors.glow || '#e0f2fe';
    const outerColor = isGreatsword ? '#f59e0b' : colors.blade || '#38bdf8';

    arcGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    arcGrad.addColorStop(0.35, `rgba(255, 255, 255, ${0.45 * intensity})`);
    arcGrad.addColorStop(0.75, `${outerColor}${Math.floor(0.75 * intensity * 255).toString(16).padStart(2, '0')}`);
    arcGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = arcGrad;
    ctx.beginPath();
    // Draw thick outer arc
    ctx.arc(0, 0, radius, startAngle, endAngle, startAngle > endAngle);
    // Return via inner curve
    ctx.arc(0, 0, radius * 0.42, endAngle, startAngle, startAngle <= endAngle);
    ctx.closePath();
    ctx.fill();

    // 2. Razor-Sharp White-Hot Blade Edge Crest
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isGreatsword ? 3.5 : isDagger ? 1.8 : 2.4;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 8 * intensity;
    ctx.globalAlpha = Math.min(1.0, intensity * 1.25);

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.98, startAngle, endAngle, startAngle > endAngle);
    ctx.stroke();
    ctx.restore();

    // 3. Leading Tip Piercing Spark Star
    const tipAngle = isMountedOnBone ? -Math.PI * 0.5 : weapon.angle;
    const tipX = Math.cos(tipAngle) * radius * 0.95;
    const tipY = Math.sin(tipAngle) * radius * 0.95;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(tipX, tipY, isGreatsword ? 4.5 : 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Cross glint star on sword tip
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tipX - 6, tipY);
    ctx.lineTo(tipX + 6, tipY);
    ctx.moveTo(tipX, tipY - 6);
    ctx.lineTo(tipX, tipY + 6);
    ctx.stroke();
    ctx.restore();

    // 4. Finisher Ground Impact Radial Crack (Combo 3)
    if (comboStep === 2 && pose.stage === 'impact') {
      this.drawImpactSparks(ctx, tipX, tipY, isGreatsword);
    }

    ctx.restore();
  }

  private static drawImpactSparks(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isGreatsword: boolean
  ): void {
    ctx.save();
    ctx.fillStyle = isGreatsword ? '#fbbf24' : '#60a5fa';
    for (let i = 0; i < 6; i++) {
      const spkAngle = (Math.PI * 2 * i) / 6 + Math.random() * 0.4;
      const spkDist = 12 + Math.random() * 8;
      ctx.beginPath();
      ctx.arc(x + Math.cos(spkAngle) * spkDist, y + Math.sin(spkAngle) * spkDist, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
