import { Enemy } from '../../types';

/**
 * 2.0-Head Armored Combat Zombie Renderer
 * Greathelm with red battle feather, breastplate, broadsword & kite shield
 * Proportion matches 2.0-head Chibi Figurine standard!
 */
export class ChibiMonsterKnight {
  public static drawArmoredZombie(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // Greaves & Kneepads (23% proportion)
    ctx.save();
    ctx.translate(-4, -10);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(-3, 2, 6, 4, 1.5);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(4, -10);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(-3, 2, 6, 4, 1.5);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-3, 6, 6, 4, 2);
    ctx.fill();
    ctx.restore();

    // Breastplate (23% proportion)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-8, -23 - bob, 16, 13, 3);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-6, -22 - bob, 12, 10);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(-1, -21 - bob, 2, 8);
    // Gold buckle belt
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-8, -13 - bob, 16, 3);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, -13 - bob, 4, 3);

    // Right Arm: Pauldron & Broadsword
    ctx.save();
    ctx.translate(8, -21 - bob);
    const swordSwing = enemy.state === 'attack' ? Math.sin(time * 16) * 0.8 : pose.rightArmAngle || 0;
    ctx.rotate(swordSwing);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-3, -2, 6, 6, 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.fillRect(-2, 3, 4, 6);

    ctx.translate(0, 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-1.5, 0, 3, 3);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(-4, -1, 8, 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(-2, -1);
    ctx.lineTo(2, -1);
    ctx.lineTo(1.5, -14);
    ctx.lineTo(0, -17);
    ctx.lineTo(-1.5, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Left Arm: Kite Shield
    ctx.save();
    ctx.translate(-8, -21 - bob);
    const shieldAngle = enemy.isBlocking ? -Math.PI / 3.5 : (pose.leftArmAngle || 0) * 0.4;
    ctx.rotate(shieldAngle);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.roundRect(-3, -2, 6, 6, 2);
    ctx.fill();

    ctx.translate(enemy.isBlocking ? 3 : 0, 6);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-7, -8);
    ctx.lineTo(7, -8);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 14);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-5.5, -6.5);
    ctx.lineTo(5.5, -6.5);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(0, 11);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-1, -4, 2, 10);
    ctx.fillRect(-3.5, -1, 7, 2);
    ctx.restore();

    // 2.0-Head Greathelm (~54% proportion: 24px × 21px)
    ctx.save();
    ctx.translate(0, -27 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.8);

    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-12, -21, 24, 21, 5);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 6, [4, 4, 1, 1]);
    ctx.fill();

    // Visor Slit
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(-8, -10, 16, 4, 1);
    ctx.fill();

    // Glowing red eyes
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-5, -9, 2.5, 2);
    ctx.fillRect(2.5, -9, 2.5, 2);

    // Battle Feather
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.quadraticCurveTo(-4, -28, -7, -27);
    ctx.quadraticCurveTo(-3, -24, 0, -21);
    ctx.fill();

    ctx.restore();
  }
}
