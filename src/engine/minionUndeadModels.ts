import { SummonedMinion } from '../types';

export class MinionUndeadModels {
  /**
   * High-Resolution Skeleton Vanguard Sprite Model
   */
  public static drawSkeleton(
    ctx: CanvasRenderingContext2D,
    minion: SummonedMinion,
    time: number
  ) {
    ctx.save();
    ctx.scale(1.36, 1.36);

    const boneBase = '#94a3b8';
    const boneLight = '#f1f5f9';
    const armorPlate = '#334155';
    const runeGlow = minion.isEnraged ? '#ef4444' : '#06b6d4';

    // Legs & Greaves
    ctx.fillStyle = boneBase;
    ctx.fillRect(-3, -7, 2.2, 7);
    ctx.fillRect(2, -7, 2.2, 7);
    ctx.fillStyle = armorPlate;
    ctx.fillRect(-4, -2.5, 3.2, 2.5);
    ctx.fillRect(1.8, -2.5, 3.2, 2.5);

    // Spine & Ribcage
    ctx.fillStyle = boneLight;
    ctx.fillRect(-1, -15, 2, 8.5);
    ctx.fillStyle = boneBase;
    ctx.fillRect(-4.5, -13, 9, 2);
    ctx.fillRect(-4, -10, 8, 2);

    // Inner Soul Flame in Ribcage
    const heartPulse = Math.sin(time * 6) * 1.5;
    ctx.fillStyle = runeGlow;
    ctx.shadowColor = runeGlow;
    ctx.shadowBlur = 6 + heartPulse;
    ctx.fillRect(-1.5, -12, 3, 3);
    ctx.shadowBlur = 0;

    // Heavy Pauldron Shoulder Plates & Rivets
    ctx.fillStyle = armorPlate;
    ctx.fillRect(-6.5, -17.5, 4.5, 4.5);
    ctx.fillRect(3, -17.5, 4.5, 4.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-5.5, -17, 1.5, 1.5);
    ctx.fillRect(4.5, -17, 1.5, 1.5);

    // Left Heater Shield with Runed Cross Boss
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = runeGlow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-9.5, -15.5, 5.5, 10.5, 2);
    ctx.fill();
    ctx.stroke();

    // Right Arm Ornate Runeblade
    ctx.save();
    ctx.translate(6, -14);
    const swordSwing = Math.sin(time * 5) * 0.15;
    ctx.rotate(0.2 + swordSwing);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, -2, 2.2, 5.5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-1.5, -3, 5, 2);

    // Blade & edge glow
    ctx.fillStyle = runeGlow;
    ctx.shadowColor = runeGlow;
    ctx.shadowBlur = 6;
    ctx.fillRect(0, -15, 2.4, 13);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0.8, -14, 1, 11);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Armored Skull with Horned Circlet
    ctx.fillStyle = boneLight;
    ctx.beginPath();
    ctx.roundRect(-4.5, -23.5, 9.5, 8.5, 3);
    ctx.fill();

    // Dark Hollow Eye Sockets with High-Intensity Soul Spark
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2.5, -20.5, 2.6, 2.6);
    ctx.fillRect(1.5, -20.5, 2.6, 2.6);

    ctx.fillStyle = runeGlow;
    ctx.shadowColor = runeGlow;
    ctx.shadowBlur = 6;
    ctx.fillRect(-2, -20, 1.8, 1.8);
    ctx.fillRect(2, -20, 1.8, 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1.5, -19.5, 0.8, 0.8);
    ctx.fillRect(2.5, -19.5, 0.8, 0.8);
    ctx.shadowBlur = 0;

    // Jawbone Teeth
    ctx.fillStyle = boneBase;
    ctx.fillRect(-2.5, -16.5, 5.5, 2);

    ctx.restore();
  }
}
