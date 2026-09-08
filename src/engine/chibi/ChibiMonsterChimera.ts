import { Enemy } from '../../types';

/**
 * ChibiMonsterChimera — 奇美拉（大型世界首领）。
 *
 * 三首巨兽：狮身主体 + 山羊侧首 + 龙首主头 + 蛇尾，
 * 走 chibi 2.0 头身体系但按 enemy.size 放大为巨型剪影。
 * 多阶段：低血量时龙首喷吐余烬（由 pose.attackAnimProgress 驱动张口）。
 */
export class ChibiMonsterChimera {
  public static drawChimera(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;
    const walk = pose.leftLegAngle || 0;
    const enraged = enemy.isEnraged || enemy.bossPhase === 2;

    // ===== 蛇尾（左侧 S 形，端部蛇头）=====
    ctx.save();
    ctx.translate(-16, -14 - bob);
    ctx.rotate(Math.sin(time * 2.2) * 0.12 - 0.2);
    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-8, -4, -12, -12, -6, -18);
    ctx.stroke();
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.ellipse(-5, -20, 3.2, 4.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    // 蛇瞳
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(-5.6, -20.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ===== 后腿（狮爪）=====
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(9 * side, -10);
      ctx.rotate(side > 0 ? walk * 0.5 : -walk * 0.5);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(-3, 0, 6.5, 8, 2.5);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(-3.5, 7, 7.5, 3.5, 1.6);
      ctx.fill();
      ctx.restore();
    }

    // ===== 狮身主体（壮硕胸腹）=====
    ctx.fillStyle = enraged ? '#9a3412' : '#b45309';
    ctx.beginPath();
    ctx.roundRect(-13, -26 - bob, 26, 17, 6);
    ctx.fill();
    // 腹部浅色
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(-10, -15 - bob, 20, 5, 2.5);
    ctx.fill();
    // 侧腹山羊绒毛斑块
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.ellipse(2, -20 - bob, 5.5, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // ===== 前肢（攻击时挥爪）=====
    const clawSwing = pose.attackAnimProgress ? Math.sin(pose.attackAnimProgress * Math.PI) * 0.9 : 0;
    ctx.save();
    ctx.translate(-11, -24 - bob);
    ctx.rotate(-0.3 - clawSwing);
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 10, 2.2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-2.5 + i * 2.2, 10);
      ctx.lineTo(-1.5 + i * 2.2, 13);
      ctx.lineTo(-0.5 + i * 2.2, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // ===== 山羊侧首（左肩上方，弯角）=====
    ctx.save();
    ctx.translate(-10, -34 - bob);
    ctx.rotate(Math.sin(time * 1.6) * 0.06);
    ctx.fillStyle = '#e7e5e4';
    ctx.beginPath();
    ctx.roundRect(-4.5, -4, 9, 9, 3.5);
    ctx.fill();
    // 弯角
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.quadraticCurveTo(-7, -9, -3, -11);
    ctx.stroke();
    // 瞳
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(-1, -0.5, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ===== 龙首主头（右侧，大）=====
    ctx.save();
    ctx.translate(9, -38 - bob);
    ctx.rotate(Math.sin(time * 1.3 + 1) * 0.05 + (pose.attackAnimProgress ? 0.15 : 0));
    // 头骨
    ctx.fillStyle = enraged ? '#7f1d1d' : '#991b1b';
    ctx.beginPath();
    ctx.roundRect(-7, -6, 15, 12, 4.5);
    ctx.fill();
    // 吻部
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.roundRect(4, -1, 7, 6, 2.5);
    ctx.fill();
    // 龙角（后掠双角）
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-4, -5);
    ctx.quadraticCurveTo(-8, -10, -4, -13);
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(-3, -11, 1, -14);
    ctx.stroke();
    // 龙瞳（怒目）
    ctx.fillStyle = enraged ? '#fca5a5' : '#fde047';
    ctx.beginPath();
    ctx.ellipse(1, -1, 2, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(1.4, -1, 0.7, 0, Math.PI * 2);
    ctx.fill();
    // 獠牙
    ctx.fillStyle = '#fefce8';
    ctx.beginPath();
    ctx.moveTo(6, 5);
    ctx.lineTo(7, 8);
    ctx.lineTo(8, 5);
    ctx.closePath();
    ctx.fill();
    // 低血量喷吐余烬
    if (enemy.hp / enemy.maxHp < 0.5) {
      const flick = Math.sin(time * 9) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(251, 146, 60, ${0.35 + flick * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(13, 2, 3.5 + flick, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ===== 蝙蝠翼（低血量展开扇动）=====
    if (enraged) {
      const flap = Math.sin(time * 6) * 0.35;
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(6 * side, -30 - bob);
        ctx.rotate(side * (0.9 + flap));
        ctx.fillStyle = 'rgba(120, 53, 15, 0.85)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(side * 16, -8, side * 20, 2);
        ctx.quadraticCurveTo(side * 12, 2, 0, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // ===== 鬃毛火焰（头顶鬃 → 龙首连线）=====
    ctx.strokeStyle = enraged ? '#f97316' : '#d97706';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const fx = -12 + i * 7;
      ctx.beginPath();
      ctx.moveTo(fx, -27 - bob);
      ctx.quadraticCurveTo(fx + 1, -31 - bob, fx - 1 + Math.sin(time * 4 + i) * 1.5, -33 - bob);
      ctx.stroke();
    }
  }
}
