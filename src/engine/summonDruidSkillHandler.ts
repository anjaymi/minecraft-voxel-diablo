import { AttackContext } from './classAttackSystem';
import { Skill } from '../types';
import { summonManager } from './summonManager';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';

export class SummonDruidSkillHandler {
  public static handleSkill(
    ctx: AttackContext,
    skill: Skill,
    skillId: string,
    finalDamage: number
  ): boolean {
    const { player: p, particles, addFloatingText, triggerHitStop, dealMeleeAoEDamage } = ctx;

    switch (skillId) {
      // ===== SUMMONER SKILLS =====
      case 'summoner_skeleton':
        p.attackCooldown = 0.4;
        summonManager.spawnMinion(p, 'skeleton', particles, addFloatingText);
        soundManager.playLevelUp();
        return true;

      case 'summoner_wolf':
        p.attackCooldown = 0.35;
        summonManager.spawnMinion(p, 'wolf', particles, addFloatingText);
        soundManager.playLevelUp();
        return true;

      case 'summoner_curse':
        p.attackCooldown = 0.35;
        soundManager.playExplosion();
        vfxSystem.spawnShockwave(p.x, p.y, 0, 5.5, '#7c3aed', false, 0.5);
        addFloatingText(p.x, p.y - 0.6, '☠️ 虚弱死灵诅咒 (全场破甲减速)', '#a855f7', 15);
        triggerHitStop(0.05, 0.3);
        // Curse deals shadow damage and staggers foes
        dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, 5.5, finalDamage * 1.2, false);
        return true;

      case 'summoner_corpse_explosion':
        p.attackCooldown = 0.4;
        soundManager.playExplosion();
        // Target cursor position if valid and in reasonable range, otherwise in front of player
        const hasValidMouse = typeof ctx.mouseWorldX === 'number' && typeof ctx.mouseWorldY === 'number' && (ctx.mouseWorldX !== 0 || ctx.mouseWorldY !== 0);
        const mouseX = hasValidMouse ? ctx.mouseWorldX! : p.x;
        const mouseY = hasValidMouse ? ctx.mouseWorldY! : p.y;
        const distToMouse = Math.hypot(mouseX - p.x, mouseY - p.y);
        const targetX = (hasValidMouse && distToMouse < 11) ? mouseX : (p.x + Math.cos(p.facingAngle) * 2.2);
        const targetY = (hasValidMouse && distToMouse < 11) ? mouseY : (p.y + Math.sin(p.facingAngle) * 2.2);

        vfxSystem.spawnShockwave(targetX, targetY, 0, 4.5, '#6366f1', true, 0.55);
        vfxSystem.spawnExplosion(targetX, targetY, 4.5, '#818cf8');
        // 数值平衡(2026-09): 尸体爆炸/灵魂爆鸣倍率 2.4 -> 2.0，收窄范围爆发离群点
        dealMeleeAoEDamage(targetX, targetY, 0, Math.PI * 2, 4.5, finalDamage * 2.0, true);
        triggerHitStop(0.06, 0.3);
        addFloatingText(targetX, targetY - 0.7, '💥 灵魂爆鸣!', '#818cf8', 16);
        return true;

      // ===== DRUID SKILLS =====
      case 'druid_wild_shape': {
        p.attackCooldown = 0.4;
        soundManager.playLevelUp();
        p.wildShapeForm = 'bear';
        p.wildShapeTimer = 22;
        p.wildShapeAttackBonus = 0.5;
        p.hitboxRadius = 0.65;
        
        const vitality = 40 + (p.stats.level || 1) * 6;
        p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + vitality);

        vfxSystem.spawnShockwave(p.x, p.y, 0, 4.2, '#10b981', true, 0.55);
        triggerHitStop(0.06, 0.35);

        for (let i = 0; i < 20; i++) {
          particles.push({
            x: p.x + (Math.random() - 0.5) * 1.2,
            y: p.y + (Math.random() - 0.5) * 1.2,
            z: 0.3 + Math.random() * 0.8,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            vz: 1.5 + Math.random() * 2.5,
            life: 0.6,
            maxLife: 0.6,
            color: Math.random() > 0.5 ? '#10b981' : '#f59e0b',
            size: 5 + Math.random() * 4,
            type: 'magic',
          });
        }

        addFloatingText(p.x, p.y - 0.9, '🐻 野性变身 · 远古巨熊 (+50%物攻/体型重载)', '#10b981', 17);
        return true;
      }

      case 'druid_entangle': {
        p.attackCooldown = 0.35;
        soundManager.playShieldBlock();
        const natureMult = 1 + (p.natureDamageBonus || 0);
        const entangleRadius = 4.2;
        vfxSystem.spawnShockwave(p.x, p.y, 0, entangleRadius, '#16a34a', false, 0.45);
        dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, entangleRadius, finalDamage * 1.5 * natureMult, true);
        addFloatingText(p.x, p.y - 0.6, '🌿 自然荆棘纠缠禁锢', '#4ade80', 15);
        triggerHitStop(0.05, 0.25);
        return true;
      }

      case 'druid_treant':
        p.attackCooldown = 0.35;
        summonManager.spawnMinion(p, 'treant', particles, addFloatingText);
        soundManager.playLevelUp();
        return true;

      case 'druid_hurricane': {
        p.attackCooldown = 0.4;
        soundManager.playExplosion();
        const natureMult = 1 + (p.natureDamageBonus || 0);
        vfxSystem.spawnShockwave(p.x, p.y, 0, 5.0, '#10b981', true, 0.6);
        // 数值平衡(2026-09): 飓风倍率 2.2 -> 1.9，抵消其在自然加成下的过度放大
        dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, 5.0, finalDamage * 1.9 * natureMult, true);
        addFloatingText(p.x, p.y - 0.7, '🌪️ 狂野风暴撕裂!', '#34d399', 16);
        triggerHitStop(0.07, 0.4);
        return true;
      }

      case 'druid_rejuvenation':
        p.attackCooldown = 0.3;
        soundManager.playLevelUp();
        const healHp = 50 + (p.stats.level || 1) * 8;
        const healMana = 45;
        p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healHp);
        p.stats.mana = Math.min(p.stats.maxMana, p.stats.mana + healMana);
        vfxSystem.spawnShockwave(p.x, p.y, 0, 2.5, '#22c55e', true, 0.35);
        addFloatingText(p.x, p.y - 0.6, `✨ 自然回春 +${healHp} HP`, '#22c55e', 15);
        return true;

      default:
        return false;
    }
  }
}
