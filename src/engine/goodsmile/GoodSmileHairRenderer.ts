import { Player, CharacterClassId } from '../../types';

export class GoodSmileHairRenderer {
  /**
   * Render sculpted PVC figurine layered hair, angel ring highlight, and ahoge
   */
  public static drawHairAndAccessories(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    bodyBob: number,
    isMoving: boolean
  ) {
    const cClass: CharacterClassId = player.characterClass || 'warrior';

    // 发色阶梯：主色派生（暗穹/亮刘海/深折痕），未设置则用经典栗色
    const hairBase = player.hairColor ?? '#78350f';
    const hairDome = shadeHex(hairBase, -0.16);
    const hairBangs = shadeHex(hairBase, 0.1);
    const hairCrease = shadeHex(hairBase, -0.42);
    const hairAhoge = shadeHex(hairBase, 0.05);

    // 1. Rear Volumetric Hair Dome (Warm rich chestnut clay hair)
    ctx.fillStyle = hairDome;
    ctx.beginPath();
    // Round dome covering back of head
    ctx.ellipse(0, -35.5 - bodyBob, 14.5, 13.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Front & Side Sculpted Hair Volume
    ctx.fillStyle = hairBase;
    ctx.beginPath();
    // Top hair volume
    ctx.ellipse(0, -36.5 - bodyBob, 14.0, 11.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Side face-framing locks (Bishoujo curved locks)
    ctx.beginPath();
    // Left side lock
    ctx.moveTo(-13.5, -36 - bodyBob);
    ctx.quadraticCurveTo(-14.5, -23 - bodyBob, -11.0, -17.5 - bodyBob);
    ctx.quadraticCurveTo(-10.0, -25 - bodyBob, -11.5, -34 - bodyBob);
    // Right side lock
    ctx.moveTo(13.5, -36 - bodyBob);
    ctx.quadraticCurveTo(14.5, -23 - bodyBob, 11.0, -17.5 - bodyBob);
    ctx.quadraticCurveTo(10.0, -25 - bodyBob, 11.5, -34 - bodyBob);
    ctx.fill();

    // 3. Multi-Tuft Anime Chibi Bangs (Distinct layered M-shaped bangs)
    ctx.fillStyle = hairBangs;
    ctx.beginPath();
    ctx.moveTo(-13.0, -34 - bodyBob);
    // Left tuft
    ctx.quadraticCurveTo(-8.5, -31 - bodyBob, -5.5, -25.5 - bodyBob);
    ctx.quadraticCurveTo(-4.5, -30 - bodyBob, -2.0, -29 - bodyBob);
    // Center tuft (Cross forehead peak)
    ctx.quadraticCurveTo(0, -24.5 - bodyBob, 2.5, -28.5 - bodyBob);
    // Right tuft
    ctx.quadraticCurveTo(5.5, -30 - bodyBob, 7.5, -25.0 - bodyBob);
    ctx.quadraticCurveTo(9.5, -31 - bodyBob, 13.0, -34 - bodyBob);
    // Top seal
    ctx.quadraticCurveTo(0, -39 - bodyBob, -13.0, -34 - bodyBob);
    ctx.closePath();
    ctx.fill();

    // Bang strand depth creases
    ctx.strokeStyle = hairCrease;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-5.5, -33 - bodyBob);
    ctx.lineTo(-5.5, -26.5 - bodyBob);
    ctx.moveTo(2.5, -34 - bodyBob);
    ctx.lineTo(2.5, -28.0 - bodyBob);
    ctx.stroke();

    // 4. Iconic GoodSmile Anime "Angel Ring" Specular Sheen (Curved Halo Light)
    const haloY = -38.5 - bodyBob;
    const ringGrad = ctx.createLinearGradient(-11, haloY, 11, haloY);
    ringGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    ringGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.45)');
    ringGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.92)');
    ringGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.45)');
    ringGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.ellipse(0, haloY, 11.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5. Bouncy Springy Ahoge (呆毛 - Signature anime antenna)
    const ahogeSway = isMoving
      ? Math.sin(time * 14) * 4.2 - 3.0 // Running wind trail
      : Math.sin(time * 3.0) * 1.8;      // Breathing gentle bob

    ctx.save();
    ctx.translate(0, -44 - bodyBob);
    ctx.rotate((ahogeSway * Math.PI) / 180);

    ctx.strokeStyle = hairAhoge;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-5.0, -5.5, 3.5 + ahogeSway * 0.4, -11.0, 1.5 + ahogeSway * 0.4, -13.5);
    ctx.stroke();

    // Cute white gloss speck on Ahoge tip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(1.5 + ahogeSway * 0.4, -13.5, 1.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Helmet or Class Accessories
    if (player.equipment.helmet) {
      this.drawHelmet(ctx, player, bodyBob);
    } else {
      this.drawClassAccessories(ctx, cClass, time, bodyBob);
    }
  }

  private static drawHelmet(ctx: CanvasRenderingContext2D, player: Player, bodyBob: number) {
    const hName = player.equipment.helmet?.name || '';
    let helmColor = '#0891b2';
    let trimColor = '#67e8f9';

    if (hName.includes('海龟') || hName.includes('Turtle')) {
      helmColor = '#059669';
      trimColor = '#34d399';
    } else if (hName.includes('下界') || hName.includes('Netherite')) {
      helmColor = '#1e1b4b';
      trimColor = '#6366f1';
    } else if (hName.includes('金') || hName.includes('Gold') || hName.includes('Crown')) {
      helmColor = '#d97706';
      trimColor = '#fde047';
    } else if (hName.includes('铁') || hName.includes('Iron')) {
      helmColor = '#94a3b8';
      trimColor = '#f1f5f9';
    }

    // Chubby Chibi Helmet Dome
    ctx.fillStyle = helmColor;
    ctx.beginPath();
    ctx.ellipse(0, -37.5 - bodyBob, 14.5, 10.5, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Cheek Guards
    ctx.beginPath();
    ctx.roundRect(-14.2, -37 - bodyBob, 4.2, 10, [2, 2, 4, 4]);
    ctx.roundRect(10.0, -37 - bodyBob, 4.2, 10, [2, 2, 4, 4]);
    ctx.fill();

    // Gloss sheen on helmet crest
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, -42 - bodyBob, 9.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    if (hName.includes('冠') || hName.includes('Crown')) {
      ctx.fillStyle = trimColor;
      ctx.fillRect(-8.5, -47 - bodyBob, 3.2, 4.0);
      ctx.fillRect(-1.6, -49 - bodyBob, 3.2, 6.0);
      ctx.fillRect(5.3, -47 - bodyBob, 3.2, 4.0);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -46.5 - bodyBob, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private static drawClassAccessories(
    ctx: CanvasRenderingContext2D,
    cClass: CharacterClassId,
    time: number,
    bodyBob: number
  ) {
    if (cClass === 'druid') {
      // Soft Vinyl Cute Little Deer Antlers
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      // Left little antler
      ctx.roundRect(-13.5, -45 - bodyBob, 3.5, 6.5, 1.5);
      ctx.roundRect(-16.0, -43 - bodyBob, 3.5, 3.0, 1.0);
      // Right little antler
      ctx.roundRect(10.0, -45 - bodyBob, 3.5, 6.5, 1.5);
      ctx.roundRect(12.5, -43 - bodyBob, 3.5, 3.0, 1.0);
      ctx.fill();

      // Green Sprout Leaflet on Ahoge
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(-1.8, -45.5 - bodyBob, 3.0, 1.5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(1.8, -45.5 - bodyBob, 3.0, 1.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (cClass === 'mage') {
      // Little Arcane Golden Star Hairpin
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(9.5, -34.5 - bodyBob, 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Mini Orbiting Astrological Clear Mote
      const ox = Math.cos(time * 3.5) * 16;
      const oy = Math.sin(time * 3.5) * 7 - 38 - bodyBob;
      ctx.fillStyle = '#d8b4fe';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(ox, oy, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (cClass === 'summoner') {
      // Lilac ribbon headband
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.roundRect(-13.5, -34.5 - bodyBob, 27, 3.2, 1.5);
      ctx.fill();

      // Mini Cute Chibi Ghost Skull Pin
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(-9.5, -34.5 - bodyBob, 2.6, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-10.3, -34.8 - bodyBob, 1.0, 1.0);
      ctx.fillRect(-8.7, -34.8 - bodyBob, 1.0, 1.0);
    } else if (cClass === 'warrior') {
      // Crimson Hero Headband
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(-13.5, -35 - bodyBob, 27, 3.5, 1.5);
      ctx.fill();

      // Trailing wind ribbon
      const ribbon = Math.sin(time * 12) * 2.5;
      ctx.beginPath();
      ctx.moveTo(-13.5, -34 - bodyBob);
      ctx.lineTo(-19.0, -31 - bodyBob + ribbon);
      ctx.lineTo(-17.0, -36 - bodyBob + ribbon);
      ctx.closePath();
      ctx.fill();

      // Golden crest pin
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -33.5 - bodyBob, 2.0, 0, Math.PI * 2);
      ctx.fill();
    } else if (cClass === 'ranger') {
      // Forest Scout Beret
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.ellipse(0, -38.5 - bodyBob, 14.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bouncy Yellow Feather
      ctx.fillStyle = '#fde047';
      const fAng = Math.sin(time * 8) * 0.18;
      ctx.save();
      ctx.translate(9.5, -38 - bodyBob);
      ctx.rotate(fAng);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(4, -8, 6.5, -6);
      ctx.lineTo(2.5, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

/** 颜色明度调整（发色阶梯派生用） */
function shadeHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + Math.round(255 * amount));
  const g = clamp(((n >> 8) & 255) + Math.round(255 * amount));
  const b = clamp((n & 255) + Math.round(255 * amount));
  return `rgb(${r}, ${g}, ${b})`;
}
