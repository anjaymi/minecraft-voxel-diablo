import { SummonedMinion } from '../types';

export class MinionBeastModels {
  /**
   * High-Resolution Wolf Sprite Model
   */
  public static drawWolf(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    ctx.save();
    ctx.scale(1.32, 1.32);

    const enraged = minion.isEnraged;
    const furBase = enraged ? '#7f1d1d' : '#1e293b';
    const furHighlight = enraged ? '#991b1b' : '#334155';
    const underFur = enraged ? '#dc2626' : '#475569';
    const soulGlow = enraged ? '#ef4444' : '#38bdf8';

    // Tail with physics oscillation & spectral tip
    const tailWag = Math.sin(time * 9) * 0.4;
    ctx.save();
    ctx.translate(-9, -11);
    ctx.rotate(tailWag);
    ctx.fillStyle = furBase;
    ctx.beginPath();
    ctx.ellipse(-5, 0, 7, 3, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = soulGlow;
    ctx.beginPath();
    ctx.arc(-10, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Paws & Legs
    ctx.fillStyle = furBase;
    ctx.fillRect(-7, -8, 3.5, 8);
    ctx.fillRect(3, -9, 3.5, 9);
    ctx.fillStyle = underFur;
    ctx.fillRect(-8, -1, 4.5, 2.5);
    ctx.fillRect(3, -1, 4.5, 2.5);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-8, 0.5, 1.2, 1.2);
    ctx.fillRect(6, 0.5, 1.2, 1.2);

    // Torso, Mane & Underbelly
    ctx.fillStyle = furBase;
    ctx.beginPath();
    ctx.roundRect(-8, -15, 16, 9, 3.5);
    ctx.fill();

    ctx.fillStyle = furHighlight;
    ctx.beginPath();
    ctx.roundRect(-7, -15.5, 14, 3, 1.5);
    ctx.fill();

    // Spine flame wisps
    const spineFlame = Math.sin(time * 12) * 1.5;
    ctx.fillStyle = soulGlow;
    ctx.shadowColor = soulGlow;
    ctx.shadowBlur = 5;
    ctx.fillRect(-4, -17 + spineFlame, 2, 2);
    ctx.fillRect(1, -16 - spineFlame, 2, 2);
    ctx.shadowBlur = 0;

    ctx.fillStyle = underFur;
    ctx.beginPath();
    ctx.roundRect(-4, -10, 11, 4.5, 2);
    ctx.fill();

    // Wolf Head & Ears
    ctx.save();
    ctx.translate(6.5, -16.5);
    ctx.fillStyle = furBase;
    ctx.beginPath();
    ctx.moveTo(-1, -4);
    ctx.lineTo(1.2, -10);
    ctx.lineTo(3.5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = enraged ? '#fca5a5' : '#fda4af';
    ctx.fillRect(0.2, -7, 1.5, 3.5);

    ctx.fillStyle = furBase;
    ctx.beginPath();
    ctx.roundRect(-2, -5.5, 8.5, 6.5, 2.5);
    ctx.fill();

    // Snout, Nose & Fangs
    ctx.fillStyle = underFur;
    ctx.beginPath();
    ctx.roundRect(3.5, -3.5, 6.5, 4.5, 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8.5, -3.5, 2, 2.2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(7.5, 0, 1.4, 2);

    // Piercing Spectral Soul Eye
    ctx.fillStyle = soulGlow;
    ctx.shadowColor = soulGlow;
    ctx.shadowBlur = 7;
    ctx.fillRect(2.2, -4.5, 3, 2.2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(3.2, -4, 1.2, 1.2);
    ctx.shadowBlur = 0;

    if (minion.attackCooldown > (minion.maxAttackCooldown || 0.8) * 0.7) {
      ctx.strokeStyle = soulGlow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 10, -0.6, 0.7);
      ctx.stroke();
    }
    ctx.restore();

    ctx.restore();
  }

  /**
   * High-Resolution Ancient Treant Sprite Model
   */
  public static drawTreant(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    ctx.save();
    ctx.scale(1.48, 1.48);

    const breathe = Math.sin(time * 3) * 1.3;
    const woodDark = '#451a03';
    const woodBark = '#78350f';
    const foliage = '#15803d';
    const leafBright = '#22c55e';
    const coreColor = minion.isEnraged ? '#ef4444' : '#10b981';

    // Root Feet & Massive Oak Trunk
    ctx.fillStyle = woodDark;
    ctx.beginPath();
    ctx.roundRect(-6.5, -8, 4.5, 8, 2);
    ctx.roundRect(2.5, -8, 4.5, 8, 2);
    ctx.fill();

    ctx.fillStyle = woodBark;
    ctx.beginPath();
    ctx.roundRect(-7.5, -21 + breathe, 15, 16, 4.5);
    ctx.fill();

    // Bark Grain Texture & Moss Streaks
    ctx.fillStyle = woodDark;
    ctx.fillRect(-4.5, -19 + breathe, 2.2, 11);
    ctx.fillRect(2.5, -17 + breathe, 2.2, 9);
    ctx.fillStyle = leafBright;
    ctx.fillRect(-6.5, -13 + breathe, 3.5, 4.5);

    // Branch Arms & Foliage Knuckles
    const armSwing = Math.sin(time * 4) * 2.2;
    ctx.fillStyle = woodBark;
    ctx.beginPath();
    ctx.roundRect(-11.5, -18 + breathe + armSwing, 4.5, 11, 2.5);
    ctx.roundRect(7.5, -18 + breathe - armSwing, 4.5, 11, 2.5);
    ctx.fill();

    ctx.fillStyle = leafBright;
    ctx.beginPath();
    ctx.arc(-9.5, -7 + breathe + armSwing, 3, 0, Math.PI * 2);
    ctx.arc(9.5, -7 + breathe - armSwing, 3, 0, Math.PI * 2);
    ctx.fill();

    // Lush Layered Canopy
    ctx.fillStyle = foliage;
    ctx.beginPath();
    ctx.arc(0, -26 + breathe, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = leafBright;
    ctx.beginPath();
    ctx.arc(-5.5, -28 + breathe, 8, 0, Math.PI * 2);
    ctx.arc(5.5, -28 + breathe, 8, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing Ancient Wood-Heart Core
    const heartPulse = Math.sin(time * 5.5) * 2;
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 8 + heartPulse;
    ctx.beginPath();
    ctx.arc(0, -16 + breathe, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
