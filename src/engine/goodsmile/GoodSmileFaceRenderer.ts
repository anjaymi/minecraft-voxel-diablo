import { Player, CharacterClassId } from '../../types';

export class GoodSmileFaceRenderer {
  /**
   * Render adorable, wholesome anime chibi face (natural & friendly, no uncanny valley)
   */
  public static drawFace(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    bodyBob: number
  ) {
    const cClass: CharacterClassId = player.characterClass || 'warrior';

    // 1. Natural Blink State Engine (~3.8s cycle)
    const blinkCycle = time % 3.8;
    const isBlinking = blinkCycle > 3.65;
    const eyeOpenness = isBlinking ? 0 : 1;

    // Expression detection
    const isHurt = player.hurtTimer > 0;
    const isAttacking = player.isAttacking || player.attackTimer > 0;
    const isCharging = Boolean(player.isChargingAttack);

    // 2. Class Signature Iris Palettes
    const palettes: Record<CharacterClassId, { main: string; light: string }> = {
      warrior: { main: '#2563eb', light: '#93c5fd' },
      ranger: { main: '#059669', light: '#6ee7b7' },
      mage: { main: '#7c3aed', light: '#d8b4fe' },
      rogue: { main: '#0891b2', light: '#67e8f9' },
      summoner: { main: '#4f46e5', light: '#a5b4fc' },
      druid: { main: '#16a34a', light: '#86efac' },
    };
    const p = palettes[cClass] || palettes.warrior;

    // 3. Draw Both Cute Chibi Eyes (Well-proportioned: X = -5.0 and +5.0, Y = -28.5)
    this.renderChibiEye(ctx, -5.0, -28.5 - bodyBob, false, p, eyeOpenness, isHurt);
    this.renderChibiEye(ctx, 5.0, -28.5 - bodyBob, true, p, eyeOpenness, isHurt);

    // 4. Soft Wholesome Strawberry Blush
    this.drawSoftBlush(ctx, -7.5, -24.0 - bodyBob);
    this.drawSoftBlush(ctx, 7.5, -24.0 - bodyBob);

    // 5. Cute Smile / Action Mouth
    this.drawMouth(ctx, 0, -22.5 - bodyBob, isHurt, isAttacking || isCharging);

    // 6. Natural Expressive Eyebrows
    this.drawBrows(ctx, -28.5 - bodyBob, isAttacking || isCharging, isHurt);
  }

  private static renderChibiEye(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isRight: boolean,
    p: { main: string; light: string },
    openness: number,
    isHurt: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Hurt: Cute > < closed eyes
    if (isHurt) {
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const dir = isRight ? 1 : -1;
      ctx.moveTo(-2.5 * dir, -1.8);
      ctx.lineTo(2.2 * dir, 0);
      ctx.lineTo(-2.5 * dir, 1.8);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Blink: Gentle curved smile eye
    if (openness === 0) {
      ctx.strokeStyle = '#381c06';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, 2.8, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // A. Clean Oval Sclera (modest 2.6 x 3.6 proportion)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.6, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // B. Vibrant Iris
    const irisGrad = ctx.createLinearGradient(0, -3.2, 0, 3.2);
    irisGrad.addColorStop(0, '#111827');
    irisGrad.addColorStop(0.5, p.main);
    irisGrad.addColorStop(1, p.light);

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0.2, 2.2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // C. Deep Core Pupil
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(0, 0.3, 1.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // D. Sparkling Anime Highlighting (Cute white specks)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(isRight ? -0.8 : -1.0, -1.3, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Secondary tiny sparkle
    ctx.beginPath();
    ctx.arc(isRight ? 0.9 : 0.7, 1.2, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // E. Soft Curving Upper Eyelash (Friendly, not sharp)
    ctx.strokeStyle = '#381c06';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, -1.8, 2.8, 1.15 * Math.PI, 1.85 * Math.PI, false);
    ctx.stroke();

    ctx.restore();
  }

  private static drawSoftBlush(ctx: CanvasRenderingContext2D, bx: number, by: number) {
    const grad = ctx.createRadialGradient(bx, by, 0.5, bx, by, 3.2);
    grad.addColorStop(0, 'rgba(251, 113, 133, 0.55)');
    grad.addColorStop(1, 'rgba(251, 113, 133, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(bx, by, 3.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private static drawMouth(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isHurt: boolean,
    isBattle: boolean
  ) {
    ctx.save();
    ctx.translate(x, y);

    if (isHurt) {
      // Small surprised 'o'
      ctx.fillStyle = '#be123c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.2, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (isBattle) {
      // Cute energized battle grin
      ctx.fillStyle = '#e11d48';
      ctx.strokeStyle = '#881337';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-2.0, -0.6);
      ctx.quadraticCurveTo(0, 2.0, 2.0, -0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Sweet tiny smile (:3 arc)
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-1.6, -0.2);
      ctx.quadraticCurveTo(0, 1.0, 1.6, -0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private static drawBrows(
    ctx: CanvasRenderingContext2D,
    baseY: number,
    isBattle: boolean,
    isHurt: boolean
  ) {
    const browY = baseY - 4.5;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.1;
    ctx.lineCap = 'round';
    ctx.beginPath();

    if (isHurt) {
      ctx.moveTo(-6.5, browY - 0.5);
      ctx.lineTo(-3.0, browY + 0.8);
      ctx.moveTo(3.0, browY + 0.8);
      ctx.lineTo(6.5, browY - 0.5);
    } else if (isBattle) {
      ctx.moveTo(-6.5, browY - 0.6);
      ctx.lineTo(-2.8, browY + 0.6);
      ctx.moveTo(2.8, browY + 0.6);
      ctx.lineTo(6.5, browY - 0.6);
    } else {
      ctx.moveTo(-6.0, browY);
      ctx.quadraticCurveTo(-4.5, browY - 0.8, -2.8, browY);
      ctx.moveTo(2.8, browY);
      ctx.quadraticCurveTo(4.5, browY - 0.8, 6.0, browY);
    }
    ctx.stroke();
  }
}
