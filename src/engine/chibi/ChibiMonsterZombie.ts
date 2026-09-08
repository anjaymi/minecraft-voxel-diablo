import { Enemy } from '../../types';

/**
 * 2.0-Head Standard Chibi Zombie & Drowned Renderer
 * Head: ~54% proportion (~22px diameter on ~42px figure)
 * Torso: ~23% proportion (~12px height)
 * Legs: ~23% proportion (~10px short rounded boots)
 */
export class ChibiMonsterZombie {
  public static drawZombie(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // Legs: purple pants & dark boots (23% proportion)
    ctx.save();
    ctx.translate(-4, -10);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(4, -10);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#2e1065';
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fill();
    ctx.restore();

    // Torso: Cyan shirt (23% proportion)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-8, -22 - bob, 16, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(-8, -12 - bob, 16, 2);

    // Arms: ball shoulders & green arms
    ctx.save();
    ctx.translate(-8, -20 - bob);
    ctx.rotate(pose.leftArmAngle || 0);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-2.5, 2, 5, 9, 2.5);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(8, -20 - bob);
    ctx.rotate(pose.rightArmAngle || 0);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-2.5, 2, 5, 9, 2.5);
    ctx.fill();
    ctx.restore();

    // 2.0-Head Chibi Head (~54% proportion: 22px × 20px)
    ctx.save();
    ctx.translate(0, -26 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.8);

    ctx.fillStyle = '#15803d'; // Undead green skin
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 20, 5);
    ctx.fill();

    // Messy tuft hair
    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.roundRect(-11, -21, 22, 6, [5, 5, 2, 2]);
    ctx.fill();
    ctx.fillRect(-8, -16, 4, 3);
    ctx.fillRect(3, -16, 5, 3);

    // Button eyes & glint
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(-5, -9, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -9, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#86efac';
    ctx.fillRect(-6, -10, 1.5, 1.5);
    ctx.fillRect(4, -10, 1.5, 1.5);

    // Crooked stitch mouth
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, -3);
    ctx.stroke();

    ctx.restore();
  }

  public static drawDrowned(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // Legs
    ctx.save();
    ctx.translate(-4, -10);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#0e7490';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#164e63';
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(4, -10);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#0e7490';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#164e63';
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fill();
    ctx.restore();

    // Torso: Kelp tunic
    ctx.fillStyle = '#0891b2';
    ctx.beginPath();
    ctx.roundRect(-8, -22 - bob, 16, 12, 3);
    ctx.fill();

    // Trident Arm
    ctx.save();
    ctx.translate(-8, -20 - bob);
    ctx.rotate(pose.leftArmAngle || 0);
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.roundRect(-2.5, 2, 5, 9, 2.5);
    ctx.fill();

    // Mini Trident
    ctx.translate(0, 8);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.moveTo(-4, -6);
    ctx.lineTo(4, -6);
    ctx.moveTo(-4, -10);
    ctx.lineTo(-4, -6);
    ctx.moveTo(4, -10);
    ctx.lineTo(4, -6);
    ctx.stroke();
    ctx.restore();

    // Other Arm
    ctx.save();
    ctx.translate(8, -20 - bob);
    ctx.rotate(pose.rightArmAngle || 0);
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.roundRect(-2.5, 2, 5, 9, 2.5);
    ctx.fill();
    ctx.restore();

    // Head
    ctx.save();
    ctx.translate(0, -26 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.8);
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 20, 5);
    ctx.fill();

    ctx.fillStyle = '#042f2e';
    ctx.fillRect(-11, -21, 22, 5);
    ctx.fillRect(-7, -16, 3, 5);
    ctx.fillRect(4, -16, 4, 4);

    const glowPulse = Math.sin(time * 6) * 0.2 + 0.8;
    ctx.fillStyle = `rgba(103, 232, 249, ${glowPulse})`;
    ctx.beginPath();
    ctx.arc(-5, -9, 3, 0, Math.PI * 2);
    ctx.arc(5, -9, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
