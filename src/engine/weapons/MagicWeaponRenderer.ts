import { WeaponColors } from './WeaponRenderTypes';
import { CharacterClassId } from '../../types';

export class MagicWeaponRenderer {
  /**
   * Arcane Crystal Staff (Mage) - 璀璨奥术星界法杖
   */
  public static drawMageStaff(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean, time: number) {
    // 1. Long Polished Silver-Inlaid Wood Shaft
    ctx.fillStyle = '#312e81'; // Deep indigo core wood
    ctx.beginPath();
    ctx.roundRect(-2.0, -13.0, 4.0, 22.0, 1.8);
    ctx.fill();

    // Runic Mithril Rings
    ctx.fillStyle = '#c084fc';
    ctx.fillRect(-2.3, -7.0, 4.6, 1.6);
    ctx.fillRect(-2.3, 3.0, 4.6, 1.6);
    ctx.fillRect(-2.3, 7.0, 4.6, 1.6);

    // 2. Ornate Golden Arcane Crown & Floating Prongs
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-6.5, -19.5);
    ctx.quadraticCurveTo(-2.2, -13.0, -2.2, -11.0);
    ctx.lineTo(2.2, -11.0);
    ctx.quadraticCurveTo(2.2, -13.0, 6.5, -19.5);
    ctx.lineTo(4.5, -20.5);
    ctx.quadraticCurveTo(1.6, -14.0, 0, -13.0);
    ctx.quadraticCurveTo(-1.6, -14.0, -4.5, -20.5);
    ctx.closePath();
    ctx.fill();

    // Crown Center Gem Socket
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(0, -11.5, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Floating Astral Crystal Gem (Hovering and rotating smoothly)
    const gemHover = Math.sin(time * 6) * 1.8;
    const crystalColor = colors.blade || '#c084fc';
    ctx.save();
    ctx.translate(0, -24.0 + gemHover);

    ctx.fillStyle = crystalColor;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 18 : 9;
    ctx.beginPath();
    ctx.moveTo(0, -8.0);
    ctx.lineTo(5.8, 0);
    ctx.lineTo(0, 8.0);
    ctx.lineTo(-5.8, 0);
    ctx.closePath();
    ctx.fill();

    // Pure White Inner Energy Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting Arcane Runes (公转星尘)
    const runeCount = 3;
    for (let i = 0; i < runeCount; i++) {
      const angle = time * 3.2 + (i / runeCount) * Math.PI * 2;
      const rx = Math.cos(angle) * 8.5;
      const ry = Math.sin(angle) * 3.5;
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(rx - 1.2, ry - 1.2, 2.4, 2.4);
    }
    ctx.restore();
  }

  /**
   * Spirit Wand / Soul Harvester Wand (Summoner) - 通灵唤魂魔杖
   */
  public static drawSummonerWand(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean, time: number) {
    // 1. Twisted Ancient Driftwood Shaft
    ctx.fillStyle = '#1e1b4b'; // Shadow violet wood
    ctx.beginPath();
    ctx.roundRect(-2.0, -11.0, 4.0, 19.0, 1.6);
    ctx.fill();

    // 2. Carved Bone Rib Socket
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(-5.0, -17.5, 10.0, 7.0, 2.2);
    ctx.fill();

    // 3. Spectral Soul Flame / Floating Mystic Skull Core
    const flameFlicker = Math.sin(time * 9) * 1.4;
    ctx.save();
    ctx.translate(0, -22.0 + flameFlicker);

    // Glowing soul orb
    ctx.fillStyle = colors.glow || '#6366f1';
    ctx.shadowColor = colors.glow || '#6366f1';
    ctx.shadowBlur = isAttacking ? 16 : 10;
    ctx.beginPath();
    ctx.arc(0, 0, 5.0, 0, Math.PI * 2);
    ctx.fill();

    // Soul Eye Wisps
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.6, -1.2, 1.4, 1.4);
    ctx.fillRect(0.6, -1.2, 1.4, 1.4);

    // Rising Wisp Trail
    ctx.fillStyle = 'rgba(129, 140, 248, 0.7)';
    ctx.fillRect(-1.2, -8.0, 2.4, 3.5);
    ctx.restore();
  }

  /**
   * Verdant World-Tree Scepter (Druid) - 翠绿世界树权杖
   */
  public static drawDruidStaff(ctx: CanvasRenderingContext2D, colors: WeaponColors, isAttacking: boolean, time: number) {
    // 1. Living Oak Branch Staff with Vine Twists
    ctx.fillStyle = '#5a3010';
    ctx.beginPath();
    ctx.roundRect(-2.2, -13.0, 4.4, 22.0, 2.0);
    ctx.fill();

    // Tangled Green Vines
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-2.8, -4.5, 5.6, 2.2);
    ctx.fillRect(-2.8, 4.5, 5.6, 2.2);

    // 2. Branching Crown Antlers
    ctx.fillStyle = '#5a3010';
    ctx.beginPath();
    ctx.moveTo(-2.2, -13.0);
    ctx.lineTo(-7.5, -20.5);
    ctx.lineTo(-4.5, -21.5);
    ctx.lineTo(0, -15.0);
    ctx.lineTo(4.5, -21.5);
    ctx.lineTo(7.5, -20.5);
    ctx.lineTo(2.2, -13.0);
    ctx.closePath();
    ctx.fill();

    // 3. Radiant Emerald Amber Blossom
    const blossomGlow = Math.sin(time * 5) * 1.6;
    ctx.save();
    ctx.translate(0, -22.0);

    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = isAttacking ? 16 : 8 + blossomGlow;
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.0, 6.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Floating Fresh Leaves
    const leafAngle = time * 2.8;
    const lx = Math.cos(leafAngle) * 9.0;
    const ly = Math.sin(leafAngle) * 3.5;
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.ellipse(lx, ly, 2.8, 1.4, leafAngle, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * General Magic Dispatcher
   */
  public static drawMagicWeapon(
    ctx: CanvasRenderingContext2D,
    colors: WeaponColors,
    classId: CharacterClassId,
    subType: string,
    isAttacking: boolean,
    time: number
  ) {
    if (classId === 'druid' || (subType === 'staff' && colors.blade === '#10b981')) {
      this.drawDruidStaff(ctx, colors, isAttacking, time);
    } else if (classId === 'summoner' || (subType === 'wand' && colors.glow.includes('6366f1'))) {
      this.drawSummonerWand(ctx, colors, isAttacking, time);
    } else {
      this.drawMageStaff(ctx, colors, isAttacking, time);
    }
  }
}
