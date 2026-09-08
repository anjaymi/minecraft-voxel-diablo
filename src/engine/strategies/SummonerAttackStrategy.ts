import { IClassAttackStrategy, ClassAttackContext } from './ClassAttackStrategy';
import { soundManager } from '../../audio/soundManager';
import { summonManager } from '../summonManager';
import { vfxSystem } from '../vfxSystem';
import { AttackAimSolver } from '../combat/attackAimSolver';

export class SummonerAttackStrategy implements IClassAttackStrategy {
  public readonly classId = 'summoner';
  public readonly className = '通灵召唤师';

  public executePrimaryAttack(ctx: ClassAttackContext): void {
    const { player: p, projectiles, triggerHitStop } = ctx;
    if (p.attackCooldown > 0) return;

    p.attackCooldown = 0.28;
    p.lastRangedTime = Date.now();
    soundManager.playShootArrow();

    if (p.stats.mana >= 4) {
      p.stats.mana -= 4;
    }

    const angle = AttackAimSolver.resolveAimAngle(ctx);
    const speed = 16;
    // 数值平衡(2026-09)：亡者军势被动接入实战（每随从 +5%，底 15%，上限 40%）
    const legionMult = 1.15 + Math.min(1.4, (p.minions?.length || 0) * 0.05);
    const baseDmg = Math.round((p.stats.attack * 1.2 + (p.spellPower || 0) * 1.5) * legionMult);
    const isCrit = Math.random() < p.stats.critChance;
    const finalDmg = isCrit ? Math.round(baseDmg * 1.8) : baseDmg;

    // Soul Harvest projectile
    projectiles.push({
      id: `soul_bolt_${Date.now()}_${Math.random()}`,
      x: p.x + Math.cos(angle) * 0.6,
      y: p.y + Math.sin(angle) * 0.6,
      z: 0.35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: 0,
      damage: finalDmg,
      isPlayer: true,
      type: 'mage_bolt',
      timer: 2.2,
      radius: 0.35,
      color: '#6366f1',
      trailColor: '#818cf8',
      pierceCount: 2,
    });

    triggerHitStop(0.02, 0.12);
  }

  public executeSecondaryAttack(ctx: ClassAttackContext): void {
    const { player: p, particles, addFloatingText } = ctx;
    if (p.attackCooldown > 0) return;

    p.attackCooldown = 0.8;

    if (p.stats.mana < 25) {
      addFloatingText(p.x, p.y - 0.5, '法力不足 (需25点)', '#cbd5e1');
      return;
    }

    p.stats.mana -= 25;

    const minionCount = p.minions?.length || 0;
    if (minionCount > 0) {
      // Enrage existing army
      summonManager.enrageMinions(p, particles, addFloatingText);
      soundManager.playLevelUp();
      addFloatingText(p.x, p.y - 0.6, '🔥 随从战团狂暴嗜血!', '#f43f5e', 14);
      // If army is small, also reinforce with a shadow wolf
      if (minionCount < 3) {
        summonManager.spawnMinion(p, 'wolf', particles, addFloatingText);
      }
    } else {
      // Summon fresh vanguard: wolf and skeleton guard
      summonManager.spawnMinion(p, 'wolf', particles, addFloatingText);
      summonManager.spawnMinion(p, 'skeleton', particles, addFloatingText);
      addFloatingText(p.x, p.y - 0.6, '⚡ 唤起幽灵战团', '#818cf8', 14);
    }
  }

  public executeChargedAttack(ctx: ClassAttackContext, chargeRatio: number): void {
    const { player: p, projectiles, triggerHitStop, addFloatingText } = ctx;
    p.attackCooldown = 0.55;
    p.isAttacking = true;
    p.attackTimer = 0.35;
    soundManager.playThunder?.(1.0);

    const skullCount = Math.round(4 + chargeRatio * 4); // 4 to 8 homing soul skulls
    const mult = 2.0 + chargeRatio * 1.6;
    const legionMult = 1.15 + Math.min(1.4, (p.minions?.length || 0) * 0.05);
    const baseDmg = Math.round((p.stats.attack * 1.5 + (p.summonDamageBonus || 0) * 40 + (p.spellPower || 0) * 1.8) * mult * legionMult / (skullCount * 0.5));

    for (let i = 0; i < skullCount; i++) {
      const spread = (i - (skullCount - 1) / 2) * 0.22;
      const angle = p.facingAngle + spread;
      const speed = 12 + Math.random() * 3;

      projectiles.push({
        id: `summoner_charged_${Date.now()}_${i}`,
        x: p.x + Math.cos(angle) * 0.6,
        y: p.y + Math.sin(angle) * 0.6,
        z: 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        damage: baseDmg,
        isPlayer: true,
        type: 'mage_bolt',
        timer: 2.2,
        radius: 0.55,
        color: '#06b6d4',
        homing: true,
        homingTurnRate: 4.8,
        trailColor: '#22d3ee',
      });
    }

    // Soul Shockwave Stun & Knockback
    const waveRadius = 3.6 + chargeRatio * 1.6;
    for (const enemy of ctx.enemies) {
      if (enemy.hp <= 0 || enemy.isDying) continue;
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= waveRadius && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;
        const kbForce = 13.0 + chargeRatio * 9.0;
        enemy.vx += nx * kbForce;
        enemy.vy += ny * kbForce;
        enemy.knockbackTimer = 0.45 + chargeRatio * 0.28;
        enemy.knockbackDuration = enemy.knockbackTimer;
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, 0.65 + chargeRatio * 0.45);
        enemy.animState = 'knockback';
      }
    }

    vfxSystem.spawnShockwave(p.x, p.y, 0, waveRadius, '#06b6d4', false, 0.4);
    triggerHitStop(0.08, 0.45);
    addFloatingText(p.x, p.y - 0.7, `💀 幽冥噬魂狂啸 · 灵魂轰击!`, '#06b6d4', 16, true);
  }
}
