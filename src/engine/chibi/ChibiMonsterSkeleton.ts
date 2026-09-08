import { Enemy } from '../../types';

/**
 * 2.0-Head Standard Chibi Skeleton Archer Renderer
 * Head: ~54% proportion (~22px bone skull)
 * Torso: ~23% proportion (~12px bone ribcage)
 * Legs: ~23% proportion (~10px jointed legs)
 */
export class ChibiMonsterSkeleton {
  public static drawSkeleton(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // Bone Legs (23% proportion)
    ctx.save();
    ctx.translate(-4, -10);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 8, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(-2.5, 7, 5, 3, 1.5);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(4, -10);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(-2, 0, 4, 8, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.roundRect(-2.5, 7, 5, 3, 1.5);
    ctx.fill();
    ctx.restore();

    // Ribcage Torso (23% proportion)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(-6, -22 - bob, 12, 12, 2.5);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-5, -18 - bob, 10, 1.5);
    ctx.fillRect(-4, -14 - bob, 8, 1.5);

    // Arms & Recurve Bow
    ctx.save();
    ctx.translate(-6, -20 - bob);
    ctx.rotate(pose.leftArmAngle || 0);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(-1.5, 0, 3, 9, 1.5);
    ctx.fill();

    // Bow
    ctx.translate(0, 7);
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(4, 0, 9, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.lineTo(4, 8);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(6, -20 - bob);
    ctx.rotate(pose.rightArmAngle || 0);
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(-1.5, 0, 3, 9, 1.5);
    ctx.fill();
    ctx.restore();

    // 2.0-Head Chibi Skull (~54% proportion: 22px × 20px)
    ctx.save();
    ctx.translate(0, -26 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.8);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 20, 6);
    ctx.fill();

    // Eye sockets
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-5, -10, 3.5, 0, Math.PI * 2);
    ctx.arc(5, -10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-5.5, -10.5, 1.5, 1.5);
    ctx.fillRect(4.5, -10.5, 1.5, 1.5);

    // Nasal cavity
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-1.5, -4);
    ctx.lineTo(1.5, -4);
    ctx.closePath();
    ctx.fill();

    // Teeth
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(5, -2);
    ctx.moveTo(-3, -3);
    ctx.lineTo(-3, -1);
    ctx.moveTo(0, -3);
    ctx.lineTo(0, -1);
    ctx.moveTo(3, -3);
    ctx.lineTo(3, -1);
    ctx.stroke();

    ctx.restore();
  }
}
