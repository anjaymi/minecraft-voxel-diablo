import { IClassAttackStrategy, ClassAttackContext } from './ClassAttackStrategy';
import { soundManager } from '../../audio/soundManager';
import { AttackAimSolver } from '../combat/attackAimSolver';

export class DruidAttackStrategy implements IClassAttackStrategy {
  public readonly classId = 'druid';
  public readonly className = '荒野德鲁伊';

  public executePrimaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, dealMeleeAoEDamage, triggerHitStop, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    // Check if player is transformed into Bear (Wild Shape)
    const isBear = p.wildShapeForm === 'bear' && (p.wildShapeTimer || 0) > 0;

    if (isBear) {
      // Wild Bear Heavy Melee Maul & Claw Cleave
      p.attackCooldown = 0.32;
      p.isAttacking = true;
      p.attackTimer = 0.28;
      p.comboStep = ((p.comboStep || 0) + 1) % 3;
      soundManager.playComboSlash(p.comboStep || 0);

      const isFinisher = p.comboStep === 0;
      const physicalBonus = 1 + (p.wildShapeAttackBonus || 0.5);
      const baseDmg = Math.round(p.stats.attack * (isFinisher ? 2.2 : 1.65) * physicalBonus);

      const cleaveArc = isFinisher ? Math.PI * 1.3 : Math.PI * 0.9;
      const cleaveRadius = isFinisher ? 3.4 : 2.9;
      // 数值平衡(2026-09)：暴击只判定一次（旧版先乘 1.8 再让 AoE 二次判定，可能叠乘）
      dealMeleeAoEDamage(p.x, p.y, p.facingAngle, cleaveArc, cleaveRadius, baseDmg, true);

      // Bear Heavy Physical Knockback Effect
      const baseKnockback = isFinisher ? 14.0 : 8.5;
      for (const enemy of ctx.enemies) {
        if (enemy.hp <= 0 || enemy.isDying) continue;
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= cleaveRadius && dist > 0.001) {
          const enemyAngle = Math.atan2(dy, dx);
          let angleDiff = Math.abs(enemyAngle - p.facingAngle);
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          if (Math.abs(angleDiff) <= cleaveArc / 2) {
            const pushDirX = Math.cos(enemyAngle);
            const pushDirY = Math.sin(enemyAngle);
            enemy.vx += pushDirX * baseKnockback;
            enemy.vy += pushDirY * baseKnockback;
            enemy.x += pushDirX * (isFinisher ? 0.8 : 0.45);
            enemy.y += pushDirY * (isFinisher ? 0.8 : 0.45);
            enemy.knockbackTimer = isFinisher ? 0.52 : 0.32;
            enemy.knockbackDuration = enemy.knockbackTimer;
            enemy.stunTimer = Math.max(enemy.stunTimer || 0, isFinisher ? 0.75 : 0.42);
            enemy.animState = 'knockback';
          }
        }
      }

      triggerHitStop(isFinisher ? 0.07 : 0.04, isFinisher ? 0.38 : 0.22);

      // Spawn savage claw slash particles
      const particleCount = isFinisher ? 14 : 8;
      for (let i = 0; i < particleCount; i++) {
        const pAngle = p.facingAngle - cleaveArc / 2 + (cleaveArc * i) / particleCount;
        ctx.particles.push({
          x: p.x + Math.cos(pAngle) * 1.5,
          y: p.y + Math.sin(pAngle) * 1.5,
          z: 0.35,
          vx: Math.cos(pAngle) * (isFinisher ? 3.8 : 2.5),
          vy: Math.sin(pAngle) * (isFinisher ? 3.8 : 2.5),
          vz: 0.8,
          life: 0.35,
          maxLife: 0.35,
          color: i % 2 === 0 ? '#10b981' : '#f59e0b',
          size: 0.24,
          type: 'magic',
        });
      }
      return;
    }

    // Normal Human Form: Nature Bramble Orb
    p.attackCooldown = 0.26;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    if (p.stats.mana >= 3) {
      p.stats.mana -= 3;
    }

    const angle = AttackAimSolver.resolveAimAngle(ctx);
    const speed = 17;
    const baseDmg = Math.round(p.stats.attack * 1.1 + (p.spellPower || 0) * 1.2);
    const isCrit = Math.random() < p.stats.critChance;
    const finalDmg = isCrit ? Math.round(baseDmg * 1.75) : baseDmg;

    projectiles.push({
      id: `druid_orb_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.6,
      y: p.y + Math.sin(angle) * 0.6,
      z: 0.35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: finalDmg,
      isPlayer: true,
      type: 'mage_bolt',
      timer: 2.0,
      radius: 0.38,
      color: '#22c55e',
      trailColor: '#86efac',
      effect: 'poison',
    });

    triggerHitStop(0.02, 0.12);
  }

  public executeSecondaryAttack(ctx: ClassAttackContext): void {
    const { player: p, enemies, dealMeleeAoEDamage, triggerHitStop, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    if (p.stats.mana < 20) {
      addFloatingText(p.x, p.y - 0.5, '法力不足 (需20点)', '#cbd5e1');
      return;
    }

    const isBear = p.wildShapeForm === 'bear' && (p.wildShapeTimer || 0) > 0;
    const physicalBonus = isBear ? (1 + (p.wildShapeAttackBonus || 0.5)) : 1;

    p.attackCooldown = 0.72;
    p.stats.mana -= 20;
    soundManager.playShieldBlock();

    const slamRadius = isBear ? 4.8 : 3.6;
    const slamDamage = Math.round((p.stats.attack * 1.85 + (p.spellPower || 0) * 2.0) * physicalBonus);

    // 数值平衡(2026-09)：暴击单次判定（旧版预乘后再二次判定）
    dealMeleeAoEDamage(p.x, p.y, p.facingAngle, Math.PI * 2, slamRadius, slamDamage, true);

    const healHp = isBear ? 35 : 25;
    p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healHp);
    addFloatingText(p.x, p.y - 0.7, `🐻 巨熊裂地重踏 · 树皮护体 +${healHp}HP!`, '#10b981', 14);

    triggerHitStop(0.06, 0.32);

    for (let i = 0; i < 28; i++) {
      const pAngle = (Math.PI * 2 * i) / 28;
      const speed = 2.5 + Math.random() * 3.5;
      ctx.particles.push({
        x: p.x + Math.cos(pAngle) * 0.4,
        y: p.y + Math.sin(pAngle) * 0.4,
        z: 0.2,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        vz: 1.5 + Math.random() * 2.5,
        life: 0.55,
        maxLife: 0.55,
        color: i % 2 === 0 ? '#15803d' : '#854d0e',
        size: 0.18,
        type: 'smoke',
      });
    }

    enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= slamRadius && dist > 0.001) {
        enemy.x += (dx / dist) * 1.8;
        enemy.y += (dy / dist) * 1.8;
        enemy.vx += (dx / dist) * 10;
        enemy.vy += (dy / dist) * 10;
      }
    });
  }

  /**
   * Powerful Charged Attack implementation.
   * Wild Bear Form: Feral Earthbreaker Slam & Violent Massive Knockback
   * Human Form: Piercing Bramble Tempest
   */
  public executeChargedAttack(ctx: ClassAttackContext, chargeRatio: number): void {
    const { player: p, dealMeleeAoEDamage, triggerHitStop, addFloatingText } = ctx;
    const isBear = p.wildShapeForm === 'bear' && (p.wildShapeTimer || 0) > 0;

    p.attackCooldown = 0.55;
    p.isAttacking = true;
    p.attackTimer = 0.35;
    soundManager.playThunder(1.2);

    if (isBear) {
      // Wild Bear Charged Earthbreaker: leap impact, massive AoE & violent knockback!
      const bonus = 1 + (p.wildShapeAttackBonus || 0.5);
      const mult = 2.5 + chargeRatio * 1.8; // 2.5x to 4.3x damage!
      const chargedDmg = Math.round(p.stats.attack * mult * bonus);
      // 数值平衡(2026-09)：保留 +30% 暴击率加成但只判定一次（旧版预乘 1.9 后 AoE 还能再判一次）
      const isCrit = Math.random() < Math.min(1.0, p.stats.critChance + 0.3);
      const finalDmg = isCrit ? Math.round(chargedDmg * 1.85) : chargedDmg;

      const chargeRadius = 4.6 + chargeRatio * 1.2; // Up to 5.8 tiles
      dealMeleeAoEDamage(p.x, p.y, p.facingAngle, Math.PI * 1.8, chargeRadius, finalDmg, false);

      // Massive Beast Knockback Force (26.0 ~ 42.0) & Heavy Hit-Stun / Stagger
      const knockbackForce = 26.0 + chargeRatio * 16.0;
      for (const enemy of ctx.enemies) {
        if (enemy.hp <= 0 || enemy.isDying) continue;
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= chargeRadius && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          enemy.vx += nx * knockbackForce;
          enemy.vy += ny * knockbackForce;
          enemy.x += nx * (1.1 + chargeRatio * 0.7);
          enemy.y += ny * (1.1 + chargeRatio * 0.7);
          enemy.knockbackTimer = 0.58 + chargeRatio * 0.35;
          enemy.knockbackDuration = enemy.knockbackTimer;
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.85 + chargeRatio * 0.65);
          enemy.animState = 'knockback';
        }
      }

      triggerHitStop(0.12, 0.75);
      addFloatingText(p.x, p.y - 0.8, `💥 远古裂地狂扑 · 狂暴击退! ${finalDmg}`, '#10b981', 17, true);

      // Rock burst & verdant shockwave particles
      for (let i = 0; i < 22; i++) {
        const a = (Math.PI * 2 * i) / 22;
        const spd = 3.5 + Math.random() * 4.0;
        ctx.particles.push({
          x: p.x + Math.cos(a) * 0.5,
          y: p.y + Math.sin(a) * 0.5,
          z: 0.3,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          vz: 1.5 + Math.random() * 2.0,
          life: 0.45,
          maxLife: 0.45,
          color: i % 2 === 0 ? '#10b981' : '#78350f',
          size: 0.28,
          type: 'smoke',
        });
      }
    } else {
      // Human Form: Piercing Nature Gale Blast
      const chargedDmg = Math.round((p.stats.attack * 1.8 + (p.spellPower || 0) * 2.2) * (1.8 + chargeRatio * 1.2));
      dealMeleeAoEDamage(p.x, p.y, p.facingAngle, Math.PI * 0.8, 3.8, chargedDmg, true);
      const humanKb = 14.0 + chargeRatio * 8.0;
      for (const enemy of ctx.enemies) {
        if (enemy.hp <= 0 || enemy.isDying) continue;
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 3.8 && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          enemy.vx += nx * humanKb;
          enemy.vy += ny * humanKb;
          enemy.knockbackTimer = 0.4 + chargeRatio * 0.25;
          enemy.knockbackDuration = enemy.knockbackTimer;
          enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.55 + chargeRatio * 0.35);
          enemy.animState = 'knockback';
        }
      }
      triggerHitStop(0.06, 0.35);
      addFloatingText(p.x, p.y - 0.6, `🍃 荆棘破空聚能! ${chargedDmg}`, '#34d399', 15, true);
    }
  }
}
