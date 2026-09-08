import { WeaponColors } from './WeaponRenderTypes';

export class RangedWeaponRenderer {
  /**
   * High-Resolution Recurve Composite War Bow (游侠反曲复合战弓)
   * Features winged limb tips, gold filigree carvings, draw-string physics, and wind arrow.
   */
  public static drawBow(
    ctx: CanvasRenderingContext2D,
    colors: WeaponColors,
    isAiming: boolean,
    isAttacking: boolean,
    time: number
  ) {
    ctx.save();
    // Anchor bow grip precisely to palm socket (0, 0)
    ctx.translate(isAiming ? -11.0 : -8.5, 0.0);

    if (isAiming) {
      // 1. Drawn Combat Tension Stance (弓开如满月，箭指敌首)
      ctx.rotate(0.08);

      // Recurve Dual Limbs
      ctx.strokeStyle = colors.handle;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(8.0, -21.0);
      ctx.quadraticCurveTo(18.0, -11.0, 11.0, 0.0);
      ctx.quadraticCurveTo(18.0, 11.0, 8.0, 21.0);
      ctx.stroke();

      // Winged Limb Tips & Gem Sockets
      ctx.fillStyle = colors.glow;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8;
      ctx.fillRect(7.0, -23.0, 3.5, 4.5);
      ctx.fillRect(7.0, 18.5, 3.5, 4.5);

      // Gold Filigree Inlay on Limbs
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(10.0, -14.0);
      ctx.lineTo(14.0, -7.0);
      ctx.moveTo(10.0, 14.0);
      ctx.lineTo(14.0, 7.0);
      ctx.stroke();

      // 2. High-Tension Bowstring Pulled Deep into Archer's Cheek
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(8.5, -22.0);
      ctx.lineTo(-4.5, 0.0); // Deep drawn nock point
      ctx.lineTo(8.5, 22.0);
      ctx.stroke();

      // 3. Nocked Windrunner Arrow with Glowing Broadhead
      ctx.fillStyle = '#94a3b8'; // Ashwood arrow shaft
      ctx.fillRect(-4.5, -1.2, 24.5, 2.4);

      // Golden Fletching Feathers
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-4.5, -1.0);
      ctx.lineTo(-10.0, -4.5);
      ctx.lineTo(-7.0, -1.0);
      ctx.lineTo(-10.0, 2.5);
      ctx.closePath();
      ctx.fill();

      // Razor Three-Edged Arrowhead with Piercing Glow
      ctx.fillStyle = colors.blade;
      ctx.beginPath();
      ctx.moveTo(19.0, -4.0);
      ctx.lineTo(26.0, 0.0);
      ctx.lineTo(19.0, 4.0);
      ctx.closePath();
      ctx.fill();

      // Wind spiral particle trail encircling arrowhead
      const spiralOffset = Math.sin(time * 18) * 2.2;
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(22.0, spiralOffset, 4.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 4. Stride / Rest Stance (弓自然斜挎于手侧)
      ctx.rotate(-0.28);

      // Graceful recurve curve
      ctx.strokeStyle = colors.handle;
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(4.5, -20.0);
      ctx.quadraticCurveTo(13.0, -10.0, 8.5, 0.0);
      ctx.quadraticCurveTo(13.0, 10.0, 4.5, 20.0);
      ctx.stroke();

      // Golden Limb Ornamentation
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(6.5, -13.0);
      ctx.lineTo(10.0, -7.0);
      ctx.moveTo(6.5, 13.0);
      ctx.lineTo(10.0, 7.0);
      ctx.stroke();

      // Focus Orbs at Bow Tips
      ctx.fillStyle = colors.glow;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(4.5, -20.0, 2.2, 0, Math.PI * 2);
      ctx.arc(4.5, 20.0, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Relaxed Bowstring
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.8)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(4.5, -20.0);
      ctx.lineTo(8.0, 0.0);
      ctx.lineTo(4.5, 20.0);
      ctx.stroke();

      // Quiver Arrow Glimmer when in attack swing
      if (isAttacking) {
        ctx.fillStyle = colors.glow;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(10.5, -2.0, 3.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Heavy Mechanical Siege Crossbow (重装攻城战弩)
   * Features machined steel stock, bronze gear winch, and high-tension prod arms.
   */
  public static drawCrossbow(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean) {
    ctx.save();
    // Anchor crossbow handle and trigger grip precisely to palm socket (0, 0)
    ctx.translate(-3.5, 0.0);
    ctx.rotate(0.08);

    // 1. Reinforced Stock & Fore-end (Solid dark walnut with steel bands)
    ctx.fillStyle = colors.handle;
    ctx.beginPath();
    ctx.roundRect(-3.0, -3.2, 22.0, 6.4, 2.0);
    ctx.fill();

    // 2. Heavy Forged Steel Prod (Horizontal Bow Arms)
    ctx.fillStyle = colors.blade;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 10 : 3;
    ctx.beginPath();
    ctx.roundRect(15.0, -15.5, 4.5, 31.0, 2.0);
    ctx.fill();

    // Golden prod clamp & rivets
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(14.0, -3.5, 6.5, 7.0);

    // 3. Mechanical Winch & Trigger Guard
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(2.0, 2.5, 3.5, 4.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(7.0, -2.5, 2.5, 2.5);

    // 4. Twin Steel Cable Strings
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(15.0, -15.0);
    ctx.lineTo(8.0, 0.0);
    ctx.lineTo(15.0, 15.0);
    ctx.stroke();

    // 5. Heavy Armor-Piercing Bolt on Track
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(7.0, -1.3, 15.0, 2.6);
    // Glowing Armor-Piercing Chisel Tip
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.moveTo(21.0, -3.5);
    ctx.lineTo(27.0, 0.0);
    ctx.lineTo(21.0, 3.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
