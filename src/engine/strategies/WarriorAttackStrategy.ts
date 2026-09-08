import { IClassAttackStrategy, ClassAttackContext } from './ClassAttackStrategy';
import { soundManager } from '../../audio/soundManager';
import { vfxSystem } from '../vfxSystem';
import { ClassSkillComboSystem } from '../classSkillComboSystem';
import { calculateDynamicWeaponStats } from '../weaponBaseConfig';

export class WarriorAttackStrategy implements IClassAttackStrategy {
  public readonly classId = 'warrior';
  public readonly className = '狂战士 (Warrior)';

  public executePrimaryAttack(ctx: ClassAttackContext): void {
    const { player: p, enemies, damageEnemy, triggerHitStop, checkDestructibles } = ctx;
    if (p.attackCooldown > 0) return;

    p.isAttacking = true;
    const currentStep = p.comboStep;
    p.currentSlashStep = currentStep;
    p.comboTimer = 0.85;
    p.comboStep = (currentStep + 1) % 3;

    // 数值平衡(2026-09)：血之狂怒被动接入实战（半血以下 +35% 伤害 +10% 吸血）
    const bloodRage = p.stats.hp < p.stats.maxHp * 0.5;
    const rageMult = bloodRage ? 1.35 : 1;
    const rageLifeSteal = bloodRage ? 0.1 : 0;

    // Calculate dynamic weapon stats with warrior class scaling
    const dynStats = calculateDynamicWeaponStats(p.equipment.weapon, 'warrior', p.stats);

    let damageMultiplier = dynStats.effectiveDamageMult;
    let attackCooldown = dynStats.effectiveCooldown;
    let attackDuration = 0.22;
    let attackRange = dynStats.effectiveRange;
    let attackArc = dynStats.effectiveArcRad;
    let knockbackForce = dynStats.effectiveKnockback;

    if (currentStep === 0) {
      // Step 1: Rapid horizontal slash
      damageMultiplier *= 1.0;
      attackDuration = 0.2;
    } else if (currentStep === 1) {
      // Step 2: Rising upward cleave
      damageMultiplier *= 1.25;
      attackDuration = 0.24;
      attackArc *= 1.15;
      knockbackForce *= 1.15;
    } else {
      // Step 3: FINISHER - Jump into air and plunge greatsword slam into ground
      const isGreatsword = p.equipment.weapon?.subType === 'greatsword';
      damageMultiplier *= isGreatsword ? 2.6 : 2.1;
      attackCooldown *= isGreatsword ? 1.45 : 1.35;
      attackDuration = isGreatsword ? 0.42 : 0.32;
      attackRange *= isGreatsword ? 1.4 : 1.25;
      attackArc = Math.PI * 1.8; // Near 360 AoE cleave!
      knockbackForce *= isGreatsword ? 2.0 : 1.6;

      p.z = isGreatsword ? 0.55 : 0.38;
      vfxSystem.spawnShockwave(p.x, p.y, 0, isGreatsword ? 3.6 : 2.5, isGreatsword ? '#fbbf24' : '#f97316', false, 0.35);
      ClassSkillComboSystem.registerComboFinisherReady(p);
    }

    p.attackTimer = attackDuration;
    p.attackCooldown = attackCooldown;
    soundManager.playComboSlash(currentStep);

    const hasSweeping = p.enchantments.some((e) => e.id === 'sweeping_edge');
    const hasFire = p.enchantments.some((e) => e.id === 'fire_aspect');
    const weaponSubType = p.equipment.weapon?.subType || 'sword';

    if (hasSweeping) {
      attackRange *= 1.25;
      attackArc = Math.min(Math.PI * 2, attackArc * 1.25);
    }

    // Spawn 3D weapon slash arc ribbon
    vfxSystem.spawnSlash(
      p.x,
      p.y,
      p.z,
      p.facingAngle,
      currentStep,
      weaponSubType,
      hasFire,
      hasSweeping
    );

    // Cleave arc hit detection
    for (const enemy of enemies) {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= attackRange) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - p.facingAngle);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        if (angleDiff <= attackArc / 2) {
          const isCrit = Math.random() < dynStats.effectiveCritChance;
          let damage = Math.round(
            dynStats.estimatedDamage *
            damageMultiplier *
            rageMult *
            (isCrit ? 1.85 : 1.0) *
            (0.92 + Math.random() * 0.16)
          );
          damage = Math.max(1, damage - enemy.defense);

          damageEnemy(enemy, damage, isCrit, false);

          const hitStopDur = currentStep === 2 ? 0.11 : isCrit ? 0.085 : 0.055;
          const shakeMag = currentStep === 2 ? 0.45 : isCrit ? 0.35 : 0.2;
          triggerHitStop(hitStopDur, shakeMag);

          // Life steal（含狂怒追加吸血）
          const totalLifeSteal = p.stats.lifeSteal + rageLifeSteal;
          if (totalLifeSteal > 0) {
            const steal = Math.round(damage * totalLifeSteal);
            if (steal > 0 && p.stats.hp < p.stats.maxHp) {
              p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + steal);
            }
          }

          // Knockback
          enemy.vx += (dx / (dist || 1)) * knockbackForce;
          enemy.vy += (dy / (dist || 1)) * knockbackForce;
          if (knockbackForce > 5) {
            enemy.knockbackTimer = 0.35;
            enemy.knockbackDuration = 0.35;
            enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.38);
            enemy.animState = 'knockback';
          }
        }
      }
    }

    checkDestructibles(p.x, p.y, attackRange, p.facingAngle, attackArc);
  }

  public executeSecondaryAttack(ctx: ClassAttackContext): void {
    const { player: p, enemies, damageEnemy, triggerHitStop, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    const isShieldEquipped = p.equipment.offhand?.subType === 'shield';

    if (isShieldEquipped) {
      // Shield Bulwark Guard & Frontal Counter Shockwave
      p.shieldBlockTimer = 1.2;
      p.attackCooldown = 0.55;
      soundManager.playShieldBlock();
      addFloatingText(p.x, p.y, '🛡️ 盾御坚守 (减伤80%)', '#818cf8', 14, true);
      vfxSystem.spawnShockwave(p.x, p.y, 0, 1.8, '#6366f1', true, 0.25);

      // Push back enemies in front of the shield
      for (const enemy of enemies) {
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2.5) {
          enemy.vx += (dx / (dist || 1)) * 9.0;
          enemy.vy += (dy / (dist || 1)) * 9.0;
          damageEnemy(enemy, Math.round(p.stats.attack * 0.8), false);
        }
      }
    } else {
      // Two-handed Earth-Shattering Ground Slam
      const rageMult = p.stats.hp < p.stats.maxHp * 0.5 ? 1.35 : 1;
      p.attackCooldown = 0.65;
      soundManager.playExplosion();
      vfxSystem.spawnShockwave(p.x, p.y, 0, 3.2, '#f97316', false, 0.4);
      triggerHitStop(0.12, 0.45);
      addFloatingText(p.x, p.y, '💥 裂地重斩', '#f97316', 15, true);

      for (const enemy of enemies) {
        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        if (d < 3.0) {
          const dmg = Math.round(p.stats.attack * 1.6 * rageMult);
          damageEnemy(enemy, dmg, true);
          enemy.vx += ((enemy.x - p.x) / (d || 1)) * 10;
          enemy.vy += ((enemy.y - p.y) / (d || 1)) * 10;
        }
      }
    }
  }

  public executeChargedAttack(ctx: ClassAttackContext, chargeRatio: number): void {
    const { player: p, enemies, damageEnemy, triggerHitStop, addFloatingText } = ctx;
    p.attackCooldown = 0.55;
    p.isAttacking = true;
    p.attackTimer = 0.38;
    p.z = 0.45;
    soundManager.playExplosion();

    const mult = 2.4 + chargeRatio * 1.6;
    const rageMult = p.stats.hp < p.stats.maxHp * 0.5 ? 1.35 : 1;
    const baseDamage = Math.round(p.stats.attack * mult * rageMult);
    const slamRadius = 3.6 + chargeRatio * 1.2;

    vfxSystem.spawnShockwave(p.x, p.y, 0, slamRadius, '#f97316', false, 0.45);
    triggerHitStop(0.08, 0.5);
    addFloatingText(p.x, p.y - 0.7, `🔥 狂暴蓄力旋风破! ${baseDamage}`, '#f97316', 16, true);

    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.isDying) continue;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= slamRadius && dist > 0.001) {
        damageEnemy(enemy, baseDamage, true);
        const pushForce = 14 + chargeRatio * 8;
        enemy.vx += (dx / dist) * pushForce;
        enemy.vy += (dy / dist) * pushForce;
        enemy.knockbackTimer = 0.48 + chargeRatio * 0.25;
        enemy.knockbackDuration = enemy.knockbackTimer;
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.65 + chargeRatio * 0.45);
        enemy.animState = 'knockback';
      }
    }
  }
}
