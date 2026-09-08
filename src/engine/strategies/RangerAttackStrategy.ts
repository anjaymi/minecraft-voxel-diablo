import { IClassAttackStrategy, ClassAttackContext } from './ClassAttackStrategy';
import { soundManager } from '../../audio/soundManager';
import { vfxSystem } from '../vfxSystem';
import { calculateDynamicWeaponStats } from '../weaponBaseConfig';
import { AttackAimSolver } from '../combat/attackAimSolver';

export class RangerAttackStrategy implements IClassAttackStrategy {
  public readonly classId = 'ranger';
  public readonly className = '神射手 (Ranger)';

  public executePrimaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, triggerHitStop } = ctx;
    if (p.attackCooldown > 0) return;

    const dynStats = calculateDynamicWeaponStats(p.equipment.weapon, 'ranger', p.stats);

    p.attackCooldown = dynStats.effectiveCooldown;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    // 数值平衡(2026-09)：鹰眼被动接入实战——命中点距离 ≥3.2 格时伤害 +60%
    const eagleMult = Math.hypot(ctx.mouseWorldX - p.x, ctx.mouseWorldY - p.y) >= 3.2 ? 1.6 : 1;

    // 严密解算射击朝向：直指鼠标指针世界坐标，彻底消除 45° 偏航
    const angle = AttackAimSolver.resolveAimAngle(ctx);
    const speed = 24;
    const isCrit = Math.random() < dynStats.effectiveCritChance;
    const baseDmg = Math.round(dynStats.estimatedDamage * eagleMult * (isCrit ? 1.85 : 1.0));

    projectiles.push({
      id: `ranger_arrow_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.45,
      y: p.y + Math.sin(angle) * 0.45,
      z: 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: baseDmg,
      isPlayer: true,
      type: 'arrow',
      timer: 1.5,
      radius: 0.32,
      color: dynStats.vfx.glowColor,
      trailColor: '#86efac',
    });

    vfxSystem.spawnShockwave(p.x, p.y, 0, 0.7, '#22c55e', true, 0.15);
    triggerHitStop(0.015, 0.08);
  }

  public executeSecondaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    p.attackCooldown = 0.55;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const angle = AttackAimSolver.resolveAimAngle(ctx);
    const speed = 32;
    const eagleMult = Math.hypot(ctx.mouseWorldX - p.x, ctx.mouseWorldY - p.y) >= 3.2 ? 1.6 : 1;
    const sniperDmg = Math.round(p.stats.attack * 2.2 * eagleMult);

    projectiles.push({
      id: `sniper_arrow_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.5,
      y: p.y + Math.sin(angle) * 0.5,
      z: 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: sniperDmg,
      isPlayer: true,
      type: 'arrow',
      timer: 2.0,
      radius: 0.5,
      color: '#fbbf24',
      trailColor: '#f59e0b',
      pierceCount: 5,
    });

    vfxSystem.spawnShockwave(p.x, p.y, 0, 2.0, '#eab308', true, 0.3);
    triggerHitStop(0.05, 0.25);
    addFloatingText(p.x, p.y, '🎯 贯穿狙击箭', '#fde047', 15, true);
  }

  public executeChargedAttack(ctx: ClassAttackContext, chargeRatio: number): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    p.attackCooldown = 0.45;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const baseAngle = AttackAimSolver.resolveAimAngle(ctx);
    const arrowCount = Math.round(3 + chargeRatio * 2); // 3 ~ 5 连射扩散风暴
    const spreadStep = 0.12;
    const startAngle = baseAngle - ((arrowCount - 1) * spreadStep) / 2;

    for (let i = 0; i < arrowCount; i++) {
      const angle = startAngle + i * spreadStep;
      const speed = 26 + chargeRatio * 8;
      const eagleMult = Math.hypot(ctx.mouseWorldX - p.x, ctx.mouseWorldY - p.y) >= 3.2 ? 1.6 : 1;
      const dmg = Math.round(p.stats.attack * (1.2 + chargeRatio * 0.8) * eagleMult);

      projectiles.push({
        id: `charged_arrow_${Date.now()}_${i}_${Math.random()}`,
        x: p.x + Math.cos(angle) * 0.45,
        y: p.y + Math.sin(angle) * 0.45,
        z: 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        damage: dmg,
        isPlayer: true,
        type: 'arrow',
        timer: 1.8,
        radius: 0.38,
        color: '#38bdf8',
        trailColor: '#7dd3fc',
        pierceCount: chargeRatio > 0.8 ? 2 : 1,
      });
    }

    vfxSystem.spawnShockwave(p.x, p.y, 0, 1.6 + chargeRatio * 0.8, '#38bdf8', true, 0.25);
    triggerHitStop(0.03, 0.18);
    addFloatingText(p.x, p.y, `🌪️ 疾风连珠箭 (${arrowCount}发)`, '#38bdf8', 14, true);
  }
}
