import { IClassAttackStrategy, ClassAttackContext } from './ClassAttackStrategy';
import { soundManager } from '../../audio/soundManager';
import { vfxSystem } from '../vfxSystem';
import { calculateDynamicWeaponStats } from '../weaponBaseConfig';
import { AttackAimSolver } from '../combat/attackAimSolver';

export class RogueAttackStrategy implements IClassAttackStrategy {
  public readonly classId = 'rogue';
  public readonly className = '暗影刺客 (Rogue)';

  public executePrimaryAttack(ctx: ClassAttackContext): void {
    const { player: p, enemies, damageEnemy, triggerHitStop, checkDestructibles } = ctx;
    if (p.attackCooldown > 0) return;

    p.isAttacking = true;
    const dynStats = calculateDynamicWeaponStats(p.equipment.weapon, 'rogue', p.stats);

    p.attackCooldown = dynStats.effectiveCooldown;
    p.attackTimer = 0.14;
    soundManager.playComboSlash(0);

    const attackRange = dynStats.effectiveRange;
    const attackArc = dynStats.effectiveArcRad;

    // Spawn swift dagger slash ribbon
    vfxSystem.spawnSlash(p.x, p.y, p.z, p.facingAngle, 0, 'dagger', false, false);

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
          // Check for backstab (attacker facing roughly same direction as enemy)
          const enemyFacing = enemy.facingAngle || 0;
          let backDiff = Math.abs(p.facingAngle - enemyFacing);
          while (backDiff > Math.PI) backDiff -= Math.PI * 2;
          const isBackstab = Math.abs(backDiff) < Math.PI * 0.4;

          // 数值平衡(2026-09)：背刺 = 必暴 + 单次 1.85 倍率；旧版与暴击再叠一次 1.85 可达 ×3.42
          const isCrit = isBackstab || Math.random() < dynStats.effectiveCritChance;
          let damage = Math.round(dynStats.estimatedDamage * (isCrit ? 1.85 : 1.0));
          damage = Math.max(1, damage - enemy.defense);

          damageEnemy(enemy, damage, isCrit, isBackstab);
          triggerHitStop(0.04, 0.15);

          // 淬毒 DoT：仅淬毒持续期间生效（数值平衡 2026-09：此前只设计时从不结算）
          if ((p.poisonCoatingTimer || 0) > 0) {
            enemy.poisonTimer = 3.0;
            enemy.poisonDps = Math.max(1, Math.round(damage * 0.25));
          }

          // Minor pushback
          enemy.vx += (dx / (dist || 1)) * 2.5;
          enemy.vy += (dy / (dist || 1)) * 2.5;
        }
      }
    }

    checkDestructibles(p.x, p.y, attackRange, p.facingAngle, attackArc);
  }

  public executeSecondaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    p.attackCooldown = 0.42;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    const baseAngle = AttackAimSolver.resolveAimAngle(ctx);
    const angles = [-0.35, -0.17, 0, 0.17, 0.35];
    const daggerDmg = Math.round(p.stats.attack * 0.95);

    for (const offset of angles) {
      const angle = baseAngle + offset;
      const speed = 20;

      projectiles.push({
        id: `fan_dagger_${Date.now()}_${Math.random()}`,
        x: p.x + Math.cos(angle) * 0.4,
        y: p.y + Math.sin(angle) * 0.4,
        z: 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        damage: daggerDmg,
        isPlayer: true,
        type: 'arrow',
        timer: 1.2,
        radius: 0.3,
        color: '#e11d48',
        effect: 'poison',
        trailColor: '#f43f5e',
      });
    }

    vfxSystem.spawnShockwave(p.x, p.y, 0, 1.4, '#e11d48', true, 0.2);
    triggerHitStop(0.03, 0.18);
    addFloatingText(p.x, p.y, '🗡️ 暗影飞刃扇面', '#fb7185', 14, true);
  }
}
