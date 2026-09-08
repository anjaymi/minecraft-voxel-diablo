import { Enemy } from '../../types';

/**
 * 2.0-Head Goblin Scout & Baby Zombie Renderer
 * Petite rogues with floppy ears, daggers & oversized expressive chibi heads!
 */
export class ChibiMonsterRogues {
  public static drawGoblin(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // Legs
    ctx.save();
    ctx.translate(-3.5, -8);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 6, 1.5);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(-2.5, 5, 6, 3, 1.5);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(3.5, -8);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 6, 1.5);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(-2.5, 5, 6, 3, 1.5);
    ctx.fill();
    ctx.restore();

    // Green jerkin & pouch
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.roundRect(-6, -18 - bob, 12, 10, 2.5);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, -11 - bob, 12, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(4, -10 - bob, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Dual Daggers
    ctx.save();
    ctx.translate(-6, -16 - bob);
    ctx.rotate(pose.leftArmAngle || 0);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-1.5, 0, 3, 6);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(2, 5);
    ctx.lineTo(0, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(6, -16 - bob);
    ctx.rotate(pose.rightArmAngle || 0);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(-1.5, 0, 3, 6);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 5);
    ctx.lineTo(2, 5);
    ctx.lineTo(0, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2.0-Head Cowl & Pointy Ears
    ctx.save();
    ctx.translate(0, -22 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.8);

    // Ears
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(-10, -7);
    ctx.lineTo(-17, -12);
    ctx.lineTo(-10, -3);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(10, -7);
    ctx.lineTo(17, -12);
    ctx.lineTo(10, -3);
    ctx.closePath();
    ctx.fill();

    // Hood
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.roundRect(-10, -18, 20, 18, 5);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(-7, -14, 14, 13, 3);
    ctx.fill();

    // Amber eyes
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(-3.5, -8, 2.5, 0, Math.PI * 2);
    ctx.arc(3.5, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-4, -8.5, 1.5, 1.5);
    ctx.fillRect(3, -8.5, 1.5, 1.5);

    // Grin
    ctx.strokeStyle = '#052e16';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -4, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(1, -4.5, 1.5, 1.5);

    ctx.restore();
  }

  public static drawBabyZombie(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    ctx.save();
    ctx.scale(0.72, 0.72);
    const bob = pose.bodyBob || 0;

    // Legs
    ctx.save();
    ctx.translate(-3, -8);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 6, 1.5);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(3, -8);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#4c1d95';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 6, 1.5);
    ctx.fill();
    ctx.restore();

    // Torso
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.roundRect(-6, -18 - bob, 12, 10, 2.5);
    ctx.fill();

    // Flailing arms
    ctx.save();
    ctx.translate(-6, -16 - bob);
    ctx.rotate((pose.leftArmAngle || 0) * 1.3);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 7, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(6, -16 - bob);
    ctx.rotate((pose.rightArmAngle || 0) * 1.3);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 7, 2);
    ctx.fill();
    ctx.restore();

    // Big Head
    ctx.save();
    ctx.translate(0, -22 - bob);
    ctx.rotate((pose.headTilt || 0) * 1.2);
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.roundRect(-10, -18, 20, 18, 5);
    ctx.fill();

    ctx.fillStyle = '#052e16';
    ctx.beginPath();
    ctx.arc(-4, -8, 3, 0, Math.PI * 2);
    ctx.arc(4, -8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    ctx.fillRect(-5, -9, 1.5, 1.5);
    ctx.fillRect(3, -9, 1.5, 1.5);
    ctx.restore();

    ctx.restore();
  }
}
