import { WeaponColors } from './WeaponRenderTypes';

export class DaggerWeaponRenderer {
  /**
   * High-Resolution Shadowfang Assassin Dagger (Curved Venom Claw)
   * Features tactical finger ring pommel, serrated backspine, and glowing poison groove.
   */
  public static drawDagger(
    ctx: CanvasRenderingContext2D,
    colors: WeaponColors,
    isAttacking: boolean,
    isOffhand: boolean = false
  ) {
    ctx.save();

    // Natural assassin blade canting (reverse-grip angle for ergonomic stealth strike)
    if (isOffhand) {
      ctx.rotate(-0.38);
    } else {
      ctx.rotate(0.22);
    }

    // 1. Tactical Finger Ring Pommel (Allows agile spinning & locked reverse grip)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 5.0, 2.6, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Wrapped Tactical Handle Grip
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-1.6, -2.5, 3.2, 7.0);
    // Cross-wound poison chord
    ctx.fillStyle = '#475569';
    ctx.fillRect(-1.6, -0.5, 3.2, 1.2);
    ctx.fillRect(-1.6, 2.0, 3.2, 1.2);

    // 3. Curved Viper Fang Crossguard
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(-6.0, -3.2);
    ctx.lineTo(6.0, -3.2);
    ctx.lineTo(4.0, -1.0);
    ctx.lineTo(-4.0, -1.0);
    ctx.closePath();
    ctx.fill();

    // Guard Poison Gem Core
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(0, -2.2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Sinister Curved Kris/Claw Blade
    ctx.fillStyle = colors.blade;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = isAttacking ? 10 : 4;

    ctx.beginPath();
    ctx.moveTo(-2.8, -3.2);
    ctx.quadraticCurveTo(-4.5, -12.0, 1.2, -21.5); // Sharp curved needle tip
    ctx.quadraticCurveTo(3.2, -12.0, 2.8, -3.2);
    ctx.closePath();
    ctx.fill();

    // 5. Serrated Backspine Hooks (刺客倒钩破甲刃)
    ctx.fillStyle = colors.blade;
    ctx.beginPath();
    ctx.moveTo(-3.2, -9.0);
    ctx.lineTo(-5.2, -11.0);
    ctx.lineTo(-3.6, -11.5);
    ctx.lineTo(-5.4, -14.0);
    ctx.lineTo(-3.8, -14.5);
    ctx.fill();

    // 6. Venom Blood Groove & Toxic Aura Pulse
    ctx.fillStyle = colors.glow;
    ctx.fillRect(-0.7, -14.0, 1.4, 8.5);

    // 7. Razor Silver Edge Specular Reflection
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(1.2, -21.5);
    ctx.quadraticCurveTo(2.8, -12.0, 2.5, -3.2);
    ctx.lineTo(1.8, -3.2);
    ctx.quadraticCurveTo(2.0, -12.0, 0.8, -20.5);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
