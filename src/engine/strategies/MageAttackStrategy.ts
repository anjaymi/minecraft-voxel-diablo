import { IClassAttackStrategy, ClassAttackContext } from './ClassAttackStrategy';
import { soundManager } from '../../audio/soundManager';
import { vfxSystem } from '../vfxSystem';
import { calculateDynamicWeaponStats } from '../weaponBaseConfig';
import { AttackAimSolver } from '../combat/attackAimSolver';

export class MageAttackStrategy implements IClassAttackStrategy {
  public readonly classId = 'mage';
  public readonly className = '奥术师 (Mage)';

  public executePrimaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, enemies, triggerHitStop } = ctx;
    if (p.attackCooldown > 0) return;

    const dynStats = calculateDynamicWeaponStats(p.equipment.weapon, 'mage', p.stats);

    p.attackCooldown = dynStats.effectiveCooldown;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    // Consume small mana if available
    if (p.stats.mana >= 2) {
      p.stats.mana -= 2;
    }

    const angle = AttackAimSolver.resolveAimAngle(ctx);
    const speed = 16;
    const isCrit = Math.random() < dynStats.effectiveCritChance;
    const baseDmg = Math.round(dynStats.estimatedDamage * (isCrit ? 1.85 : 1.0));

    // Find nearest prospective enemy to guide/home toward
    let nearestEnemyId: string | undefined;
    let nearestDist = 12.0;
    for (const e of enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestEnemyId = e.id;
      }
    }

    projectiles.push({
      id: `mage_bolt_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.45,
      y: p.y + Math.sin(angle) * 0.45,
      z: 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: baseDmg,
      isPlayer: true,
      type: 'mage_bolt',
      timer: 1.8,
      radius: 0.38,
      color: dynStats.vfx.glowColor,
      homing: true,
      homingTurnRate: 4.8,
      targetEnemyId: nearestEnemyId,
      trailColor: '#c084fc',
    });

    vfxSystem.spawnShockwave(p.x, p.y, 0, 0.9, dynStats.vfx.glowColor, true, 0.2);
    triggerHitStop(0.02, 0.1);
  }

  public executeSecondaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    const manaCost = 10;
    if (p.stats.mana < manaCost) {
      addFloatingText(p.x, p.y, `法力不足 (${manaCost} MP)`, '#60a5fa', 12);
      soundManager.playButtonClick();
      return;
    }

    p.stats.mana -= manaCost;
    p.attackCooldown = 0.48;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const baseAngle = AttackAimSolver.resolveAimAngle(ctx);
    const spreadOffsets = [-0.24, 0, 0.24];
    const burstDmg = Math.round(p.stats.attack * 1.55);

    for (const offset of spreadOffsets) {
      const angle = baseAngle + offset;
      const speed = 15;

      projectiles.push({
        id: `mage_burst_${Date.now()}_${Math.random()}`,
        x: p.x + Math.cos(angle) * 0.5,
        y: p.y + Math.sin(angle) * 0.5,
        z: 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        damage: burstDmg,
        isPlayer: true,
        type: 'mage_bolt',
        timer: 1.6,
        radius: 0.45,
        color: '#f43f5e',
        homing: true,
        homingTurnRate: 3.5,
        trailColor: '#fb7185',
      });
    }

    vfxSystem.spawnShockwave(p.x, p.y, 0, 1.8, '#a855f7', true, 0.28);
    triggerHitStop(0.04, 0.22);
    addFloatingText(p.x, p.y, '✨ 极光三联飞弹', '#c084fc', 14, true);
  }

  public executeChargedAttack(ctx: ClassAttackContext, chargeRatio: number): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    p.attackCooldown = 0.52;
    p.isAttacking = true;
    p.attackTimer = 0.32;
    soundManager.playThunder?.(1.1);

    const projectileCount = Math.round(5 + chargeRatio * 4); // 5 to 9 homing astral bolts
    const mult = 1.9 + chargeRatio * 1.5;
    const baseDmg = Math.round((p.stats.attack * 1.6 + (p.spellPower || 0) * 2.2) * mult / (projectileCount * 0.45));

    for (let i = 0; i < projectileCount; i++) {
      const spread = (i - (projectileCount - 1) / 2) * 0.16;
      const angle = p.facingAngle + spread;
      const speed = 14 + Math.random() * 4;

      projectiles.push({
        id: `mage_charged_${Date.now()}_${i}`,
        x: p.x + Math.cos(angle) * 0.6,
        y: p.y + Math.sin(angle) * 0.6,
        z: 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 2,
        damage: baseDmg,
        isPlayer: true,
        type: 'mage_bolt',
        timer: 2.0,
        radius: 0.5,
        color: '#c084fc',
        homing: true,
        homingTurnRate: 4.5,
        trailColor: '#e879f9',
      });
    }

    // Astral Nova Knockback & Hit-Stun to nearby enemies
    const novaRadius = 3.5 + chargeRatio * 1.5;
    for (const enemy of ctx.enemies) {
      if (enemy.hp <= 0 || enemy.isDying) continue;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= novaRadius && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const kbForce = 12.0 + chargeRatio * 8.0;
        enemy.vx += nx * kbForce;
        enemy.vy += ny * kbForce;
        enemy.knockbackTimer = 0.42 + chargeRatio * 0.25;
        enemy.knockbackDuration = enemy.knockbackTimer;
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.6 + chargeRatio * 0.4);
        enemy.animState = 'knockback';
      }
    }

    vfxSystem.spawnShockwave(p.x, p.y, 0, novaRadius, '#c084fc', false, 0.4);
    triggerHitStop(0.08, 0.45);
    addFloatingText(p.x, p.y - 0.7, `🔮 星界极光狂啸 · 充能爆发!`, '#a855f7', 16, true);
  }
}
