import { WeaponColors } from './WeaponRenderTypes';

export class MeleeWeaponRenderer {
  /**
   * High-Resolution Knightly Arming Sword / Longsword
   * Features beveled fuller, faceted pommel, engraved crossguard, and specular edge.
   */
  public static drawSword(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean) {
    // 1. Faceted Golden Pommel (Weighted counterbalance with gem highlight)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 5.5, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-1.0, 4.5, 2.0, 1.8);

    // 2. Contoured Grip Handle with Diamond Leather Ribbing
    ctx.fillStyle = colors.handle;
    ctx.fillRect(-1.8, -3.5, 3.6, 8.0);
    // Dark leather spiral wraps
    ctx.fillStyle = '#3e1e0a';
    ctx.fillRect(-1.8, -1.8, 3.6, 1.2);
    ctx.fillRect(-1.8, 0.8, 3.6, 1.2);
    ctx.fillRect(-1.8, 3.2, 3.6, 1.2);
    // Golden hilt collar rings
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2.1, -4.0, 4.2, 1.0);
    ctx.fillRect(-2.1, 4.2, 4.2, 1.0);

    // 3. Winged Crossguard with Curved Golden Quillons
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-8.5, -6.8, 17.0, 3.6, 1.8);
    ctx.fill();
    // Inlaid golden finials
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-7.5, -6.0, 2.8, 2.0);
    ctx.fillRect(4.7, -6.0, 2.8, 2.0);

    // Guard Gem / Soul Diamond Core
    ctx.fillStyle = colors.glow;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 10 : 4;
    ctx.beginPath();
    ctx.arc(0, -5.0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. Dual-Beveled Razor Steel Blade
    ctx.fillStyle = colors.blade;
    ctx.beginPath();
    ctx.moveTo(-4.2, -6.8);
    ctx.lineTo(-3.6, -26.0);
    ctx.lineTo(0, -33.5); // Tapered needlepoint tip
    ctx.lineTo(3.6, -26.0);
    ctx.lineTo(4.2, -6.8);
    ctx.closePath();
    ctx.fill();

    // 5. Deep Central Fuller (Blood Groove) & Bevel Shading
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(-0.9, -26.0, 1.8, 19.0);

    // Dynamic Runic Glow inside groove when attacking
    if (isAttacking) {
      ctx.fillStyle = colors.glow;
      ctx.fillRect(-0.5, -23.0, 1.0, 14.0);
    }

    // Razor Edge Specular Highlight (Right edge mirror polish)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(1.8, -27.0, 1.4, 20.0);
    // Tip glint
    ctx.beginPath();
    ctx.moveTo(0, -33.5);
    ctx.lineTo(1.8, -27.0);
    ctx.lineTo(0, -27.0);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  /**
   * Colossal Two-Handed Greatsword (双手大剑 / Zweihänder)
   * Features elongated two-handed grip, flared parrying hooks (flukes), and runic blade.
   */
  public static drawGreatsword(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean) {
    // 1. Heavy Counterbalance Pommel (Solid faceted steel octagonal ball)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(0, 11.5, 4.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-1.4, 10.2, 2.8, 2.6);

    // 2. Elongated Two-Handed Grip Hilt (Dual grip sections for two hands)
    ctx.fillStyle = colors.handle;
    ctx.fillRect(-2.3, -6.0, 4.6, 17.0);
    // Dark Leather Cross-Lacing Wraps
    ctx.fillStyle = '#292524';
    ctx.fillRect(-2.5, -2.5, 5.0, 1.5);
    ctx.fillRect(-2.5, 2.5, 5.0, 1.5);
    ctx.fillRect(-2.5, 7.5, 5.0, 1.5);
    // Golden grip separator ring between upper and lower hand
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2.8, 0.0, 5.6, 1.8);

    // 3. Heavy Winged Crossguard (Flared quillons)
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-13.0, -9.5, 26.0, 5.0, 2.2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-12.0, -8.5, 3.8, 3.0);
    ctx.fillRect(8.2, -8.5, 3.8, 3.0);

    // Core Socket Rune Core
    ctx.fillStyle = colors.glow;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 12 : 5;
    ctx.beginPath();
    ctx.arc(0, -7.0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Zweihänder Parrying Hooks (Side flukes on ricasso)
    ctx.fillStyle = colors.blade;
    ctx.beginPath();
    // Left hook
    ctx.moveTo(-5.5, -15.0);
    ctx.lineTo(-8.5, -18.0);
    ctx.lineTo(-5.0, -17.5);
    // Right hook
    ctx.moveTo(5.5, -15.0);
    ctx.lineTo(8.5, -18.0);
    ctx.lineTo(5.0, -17.5);
    ctx.fill();

    // 5. Colossal Double-Edged Blade
    ctx.beginPath();
    ctx.moveTo(-5.6, -9.5);
    ctx.lineTo(-5.2, -37.0);
    ctx.lineTo(0, -46.0); // Colossal Greatsword Piercing Tip
    ctx.lineTo(5.2, -37.0);
    ctx.lineTo(5.6, -9.5);
    ctx.closePath();
    ctx.fill();

    // 6. Deep Central Fuller (Blood Groove) with Inlaid Ancient Runes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(-1.3, -36.0, 2.6, 26.0);

    // Glowing Ancient Rune Core inside blade
    ctx.fillStyle = colors.glow;
    ctx.fillRect(-0.7, -31.0, 1.4, 18.0);

    // Silver Edge Specular Reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(2.8, -37.0, 1.6, 27.0);

    ctx.shadowBlur = 0;
  }

  /**
   * Heavy Brutal Crescent Battleaxe Model
   * Features broad dual-crescent cleavers, reinforced socket, and spiked butt.
   */
  public static drawAxe(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean) {
    // 1. Reinforced Ironwood Handle Shaft (Continuous shaft from head socket to palm grip)
    ctx.fillStyle = colors.handle;
    ctx.fillRect(-2.2, -22.0, 4.4, 30.0);
    // Leather grip wraps around palm
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-2.5, -3.0, 5.0, 1.8);
    ctx.fillRect(-2.5, 3.0, 5.0, 1.8);
    // Spiked butt cap
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-2.2, 8.0);
    ctx.lineTo(0, 10.5);
    ctx.lineTo(2.2, 8.0);
    ctx.closePath();
    ctx.fill();

    // 2. Axe Head Mounting Socket & Golden Rivets
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3.5, -28.0, 7.0, 14.0);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.8, -24.0, 3.6, 3.6);

    // 3. Left Crescent Cleaver Blade
    ctx.fillStyle = colors.blade;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 10 : 4;
    ctx.beginPath();
    ctx.moveTo(-3.2, -27.5);
    ctx.bezierCurveTo(-16.0, -30.0, -16.0, -13.0, -3.2, -14.5);
    ctx.closePath();
    ctx.fill();

    // 4. Right Hook Cleaver Blade
    ctx.beginPath();
    ctx.moveTo(3.2, -27.5);
    ctx.bezierCurveTo(16.0, -30.0, 16.0, -13.0, 3.2, -14.5);
    ctx.closePath();
    ctx.fill();

    // 5. Razor-Sharp Mirror Polished Outer Curves
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-9.0, -21.0, 8.0, -1.8, 1.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9.0, -21.0, 8.0, 1.3, -1.3, true);
    ctx.stroke();

    // Inlaid Rune Emblems on Blade Faces
    ctx.fillStyle = colors.glow;
    ctx.fillRect(-9.0, -22.0, 2.5, 2.5);
    ctx.fillRect(6.5, -22.0, 2.5, 2.5);

    ctx.shadowBlur = 0;
  }

  /**
   * Heavy Crushing Warhammer / Maul Model
   * Features octagonal forged hammerhead, rear piercing armor beak, and thunder core.
   */
  public static drawHammer(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean) {
    // 1. Reinforced Steel Shaft (Continuous solid steel shaft from head to grip)
    ctx.fillStyle = colors.handle;
    ctx.fillRect(-2.2, -22.0, 4.4, 30.0);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-2.7, 4.0, 5.4, 2.0);
    ctx.fillRect(-2.7, 7.5, 5.4, 2.5);

    // 2. Solid Dwarven Maul Head (Octagonal Beveled Impact Block)
    ctx.fillStyle = colors.blade;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 12 : 5;
    ctx.beginPath();
    ctx.roundRect(-11.5, -29.0, 23.0, 14.5, 3.0);
    ctx.fill();

    // 3. Rear Armor-Piercing Beak Spike
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-11.5, -25.0);
    ctx.lineTo(-16.5, -21.5);
    ctx.lineTo(-11.5, -18.0);
    ctx.closePath();
    ctx.fill();

    // 4. Heavy Steel Reinforcement Straps & Thunder Sigil
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-3.0, -29.0, 6.0, 14.5);
    ctx.fillStyle = colors.glow;
    // Glowing impact cores on both faces
    ctx.fillRect(-8.0, -24.5, 3.5, 5.5);
    ctx.fillRect(4.5, -24.5, 3.5, 5.5);

    // 5. Specular Corner Chamfer Reflection
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-9.5, -28.0, 19.0, 2.2);

    ctx.shadowBlur = 0;
  }
}
