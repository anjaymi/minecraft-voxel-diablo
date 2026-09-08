import { Player, Skill } from '../types';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';
import { AttackContext } from './classAttackSystem';
import { SummonDruidSkillHandler } from './summonDruidSkillHandler';

export interface SkillComboResult {
  isCombo: boolean;
  comboName: string;
  damageMultiplier: number;
}

/**
 * ClassSkillComboSystem
 * Manages skill execution, cooldown/mana checks, and active skill chaining/combos.
 */
export class ClassSkillComboSystem {
  /**
   * Update ongoing combo state timer and stealth/buff timers
   */
  public static update(player: Player, dt: number): void {
    // 1. Skill Combo Chain Window Timer
    if (player.skillComboState) {
      player.skillComboState.chainTimer -= dt;
      if (player.skillComboState.chainTimer <= 0) {
        player.skillComboState = undefined;
      }
    }

    // 2. Rogue Stealth Buff Timer
    if (player.isStealthed && player.stealthTimer !== undefined) {
      player.stealthTimer -= dt;
      if (player.stealthTimer <= 0) {
        player.isStealthed = false;
        player.stealthTimer = 0;
      }
    }

    // 3. Rogue Poison Coating Timer
    if (player.poisonCoatingTimer && player.poisonCoatingTimer > 0) {
      player.poisonCoatingTimer -= dt;
    }
  }

  /**
   * Check if the incoming skill triggers a skill-chain synergy with previous skill or combo attack
   */
  public static evaluateSkillChaining(player: Player, incomingSkillId: string): SkillComboResult {
    const prevState = player.skillComboState;
    if (!prevState || prevState.chainTimer <= 0) {
      return { isCombo: false, comboName: '', damageMultiplier: 1.0 };
    }

    const prevId = prevState.lastSkillId;

    // --- Warrior Combos ---
    // Leap Slam -> Whirlwind: Rage Vortex (+50% whirlwind radius & 40% bonus damage)
    if (prevId === 'warrior_leap' && incomingSkillId === 'warrior_whirlwind') {
      return { isCombo: true, comboName: '🌪️ 狂暴怒气龙卷! (+40% 伤害)', damageMultiplier: 1.4 };
    }
    // Heavy Slash -> Leap Slam: Earth Shatter (+50% leap damage)
    if (prevId === 'warrior_slash' && incomingSkillId === 'warrior_leap') {
      return { isCombo: true, comboName: '💥 破阵裂地连击! (+50% 伤害)', damageMultiplier: 1.5 };
    }

    // --- Mage Combos ---
    // Fireball -> Frost Nova: Vaporize Steam Explosion (+60% explosion damage)
    if (prevId === 'mage_fireball' && incomingSkillId === 'mage_nova') {
      return { isCombo: true, comboName: '⚡ 冰火蒸发爆鸣! (+60% 伤害)', damageMultiplier: 1.6 };
    }
    // Teleport -> Fireball: Arcane Ambush (+35% damage + zero delay)
    if (prevId === 'mage_teleport' && incomingSkillId === 'mage_fireball') {
      return { isCombo: true, comboName: '🔮 虚空奇袭火球! (+35% 伤害)', damageMultiplier: 1.35 };
    }

    // --- Ranger Combos ---
    // Dash / Tumble -> Multishot: Slide Piercing Barrage (+50% damage & bonus arrows)
    if (prevId === 'ranger_dash' && incomingSkillId === 'ranger_multishot') {
      return { isCombo: true, comboName: '🏹 疾风滑步扫射! (+50% 伤害)', damageMultiplier: 1.5 };
    }
    // Explosive Trap -> Multishot: Trap Detonation Spray
    if (prevId === 'ranger_trap' && incomingSkillId === 'ranger_multishot') {
      return { isCombo: true, comboName: '💣 爆轰引燃齐射! (+45% 伤害)', damageMultiplier: 1.45 };
    }

    // --- Rogue Combos ---
    // Stealth -> Backstab: Absolute Execution Strike (+120% massive crit damage)
    if (prevId === 'rogue_stealth' && incomingSkillId === 'rogue_backstab') {
      return { isCombo: true, comboName: '💀 影匿绝杀终结! (+120% 暴击)', damageMultiplier: 2.2 };
    }
    // Poison Weapon -> Backstab: Neurotoxin Rupture
    if (prevId === 'rogue_poison' && incomingSkillId === 'rogue_backstab') {
      return { isCombo: true, comboName: '🧪 剧毒神经撕裂! (+60% 剧毒伤害)', damageMultiplier: 1.6 };
    }

    // --- Summoner Combos ---
    // Curse -> Corpse Explosion: Cursed Soul Rupture (+75% AoE explosion damage)
    if (prevId === 'summoner_curse' && incomingSkillId === 'summoner_corpse_explosion') {
      return { isCombo: true, comboName: '💥 咒蚀亡者殉爆! (+75% 范围伤害)', damageMultiplier: 1.75 };
    }
    // Minion summon -> Curse: Legion Armor Crush (+40% damage)
    if ((prevId === 'summoner_skeleton' || prevId === 'summoner_wolf') && incomingSkillId === 'summoner_curse') {
      return { isCombo: true, comboName: '☠️ 战团合围破阵! (+40% 伤害)', damageMultiplier: 1.4 };
    }
    // Wolf -> Corpse Explosion
    if (prevId === 'summoner_wolf' && incomingSkillId === 'summoner_corpse_explosion') {
      return { isCombo: true, comboName: '🐺 暗狼烈魂轰鸣! (+60% 伤害)', damageMultiplier: 1.6 };
    }

    // --- Druid Combos ---
    // Entangle -> Hurricane: Rooted Tempest Rupture (+65% AoE nature damage)
    if (prevId === 'druid_entangle' && incomingSkillId === 'druid_hurricane') {
      return { isCombo: true, comboName: '🌪️ 荆棘聚引狂怒飓风! (+65% 伤害)', damageMultiplier: 1.65 };
    }
    // Rejuvenation -> Entangle: Flourishing Thorny Overgrowth (+50% nature damage)
    if (prevId === 'druid_rejuvenation' && incomingSkillId === 'druid_entangle') {
      return { isCombo: true, comboName: '🌿 大地涌生巨型荆棘! (+50% 伤害)', damageMultiplier: 1.5 };
    }

    // Generic Melee 3-hit combo finisher chaining into any active skill
    if (prevId === 'combo_finisher') {
      return { isCombo: true, comboName: '⚔️ 剑术连携裁决! (+30% 终结)', damageMultiplier: 1.3 };
    }

    return { isCombo: false, comboName: '', damageMultiplier: 1.0 };
  }

  /**
   * Sets up combo chain window after executing an action or skill
   */
  public static registerSkillUsed(player: Player, skillId: string): void {
    player.skillComboState = {
      lastSkillId: skillId,
      chainTimer: 2.2, // 2.2 seconds window to chain the next action
      comboName: '',
      damageMultiplier: 1.0,
    };
  }

  /**
   * Register melee 3rd combo step as combo finisher
   */
  public static registerComboFinisherReady(player: Player): void {
    player.skillComboState = {
      lastSkillId: 'combo_finisher',
      chainTimer: 1.8,
      comboName: '普攻三连击',
      damageMultiplier: 1.3,
    };
  }

  /**
   * Execute skill and apply dynamic class-bound effects & combo buffs
   */
  public static executeSkill(
    ctx: AttackContext,
    skill: Skill,
    skillId: string,
    isWalkable: (x: number, y: number) => boolean,
    onRangerDash: () => void
  ): boolean {
    const { player: p, addFloatingText, triggerHitStop, dealMeleeAoEDamage } = ctx;

    // Check combo synergy
    const combo = this.evaluateSkillChaining(p, skillId);
    if (combo.isCombo) {
      addFloatingText(p.x, p.y - 0.7, combo.comboName, '#fbbf24', 16);
      soundManager.playLevelUp();
      triggerHitStop(0.06, 0.35);
    }

    const level = p.unlockedSkills[skillId] || 1;
    const atk = p.stats?.attack ?? 0;
    const sp = p.spellPower ?? 0;
    const cls: string = p.characterClass ?? 'warrior';
    // 数值平衡(2026-09)：技能伤害按职业挂钩攻击/法术强度，随装备与等级成长
    let statScale = 0;
    if (cls === 'warrior') statScale = Math.round(atk * 0.55);
    else if (cls === 'ranger') statScale = Math.round(atk * 0.55);
    else if (cls === 'rogue') statScale = Math.round(atk * 0.55);
    else if (cls === 'mage') statScale = Math.round(atk * 0.15 + sp * 0.7);
    else if (cls === 'summoner') statScale = Math.round(atk * 0.1 + sp * 0.6);
    else statScale = Math.round(atk * 0.15 + sp * 0.6); // druid
    const baseDmg = (skill.baseDamage || 15) + (level - 1) * 6 + statScale;
    const finalDamage = Math.round(baseDmg * combo.damageMultiplier);

    switch (skillId) {
      // ===== WARRIOR SKILLS =====
      case 'warrior_slash':
        p.attackCooldown = 0.25;
        vfxSystem.spawnSlash(p.x, p.y, 0.5, p.facingAngle, 1, 'sword', true, true);
        soundManager.playComboSlash(1);
        dealMeleeAoEDamage(p.x, p.y, p.facingAngle, Math.PI * 0.7, 2.6, finalDamage * 1.5, true);
        break;

      case 'warrior_whirlwind':
        const radius = combo.isCombo ? 5.0 : skill.radius || 3.5;
        p.whirlwindTimer = 0.55;
        p.invulnerableTimer = 0.55;
        soundManager.playComboSlash(2);
        vfxSystem.spawnShockwave(p.x, p.y, 0, radius, '#ef4444', true, 0.5);
        // 数值平衡(2026-09): 旋风斩倍率 2.2 -> 2.0，收窄近战极端输出
        dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, radius, finalDamage * 2.0, true);
        triggerHitStop(0.08, 0.4);
        break;

      case 'warrior_leap':
        p.dashTimer = 0.35;
        p.dashCooldown = 0.35;
        p.invulnerableTimer = 0.35;
        soundManager.playDash();
        p.vx = Math.cos(p.facingAngle) * 22;
        p.vy = Math.sin(p.facingAngle) * 22;
        setTimeout(() => {
          vfxSystem.spawnShockwave(p.x, p.y, 0, 3.2, '#f59e0b', false, 0.4);
          dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, 3.2, finalDamage * 2.0, true);
          triggerHitStop(0.06, 0.35);
        }, 320);
        break;

      // ===== MAGE SKILLS =====
      case 'mage_fireball':
        p.attackCooldown = 0.35;
        p.lastRangedTime = Date.now();
        soundManager.playShootArrow();
        ctx.projectiles.push({
          id: `fb_${Date.now()}`,
          x: p.x + Math.cos(p.facingAngle) * 0.4,
          y: p.y + Math.sin(p.facingAngle) * 0.4,
          z: 0.5,
          vx: Math.cos(p.facingAngle) * 14,
          vy: Math.sin(p.facingAngle) * 14,
          vz: 0,
          damage: finalDamage * 2.2,
          isPlayer: true,
          type: 'tnt',
          timer: 2.0,
          radius: 0.45,
        });
        vfxSystem.spawnShockwave(p.x, p.y, 0, 1.2, '#f97316', true, 0.25);
        break;

      case 'mage_nova':
        const novaRadius = skill.radius || 4.2;
        vfxSystem.spawnShockwave(p.x, p.y, 0, novaRadius, '#06b6d4', false, 0.5);
        // 数值平衡(2026-09): 冰霜新星倍率 1.6 -> 1.7，补偿其相对冷却较长
        dealMeleeAoEDamage(p.x, p.y, 0, Math.PI * 2, novaRadius, finalDamage * 1.7, true);
        triggerHitStop(0.06, 0.3);
        break;

      case 'mage_teleport':
        const tx = ctx.mouseWorldX;
        const ty = ctx.mouseWorldY;
        if (isWalkable(tx, ty)) {
          vfxSystem.spawnEnderVortex(p.x, p.y);
          p.x = tx;
          p.y = ty;
          vfxSystem.spawnEnderVortex(tx, ty);
          soundManager.playTeleport();
        } else {
          addFloatingText(p.x, p.y, '目标位置不可达', '#ef4444', 12);
        }
        break;

      // ===== RANGER SKILLS =====
      case 'ranger_multishot':
        p.attackCooldown = 0.25;
        p.lastRangedTime = Date.now();
        soundManager.playShootArrow();
        const spreadCount = combo.isCombo ? 7 : 5;
        const spreadStep = 0.12;
        const startOffset = -((spreadCount - 1) / 2) * spreadStep;

        for (let i = 0; i < spreadCount; i++) {
          const angle = p.facingAngle + startOffset + i * spreadStep;
          ctx.projectiles.push({
            id: `arrow_${Date.now()}_${i}`,
            x: p.x + Math.cos(angle) * 0.4,
            y: p.y + Math.sin(angle) * 0.4,
            z: 0.5,
            vx: Math.cos(angle) * 18,
            vy: Math.sin(angle) * 18,
            vz: 0,
            damage: Math.round(finalDamage * 1.1),
            isPlayer: true,
            type: 'arrow',
            timer: 1.6,
            radius: 0.3,
          });
        }
        break;

      case 'ranger_dash':
        onRangerDash();
        addFloatingText(p.x, p.y - 0.4, '💨 疾风滑步!', '#34d399', 12);
        break;

      case 'ranger_trap':
        // 数值平衡(2026-09): 陷阱倍率 2.5 -> 2.3，压制远程范围爆发
        // Lay down explosive cluster
        ctx.projectiles.push({
          id: `trap_${Date.now()}`,
          x: p.x,
          y: p.y,
          z: 0.1,
          vx: 0,
          vy: 0,
          vz: 0,
          damage: finalDamage * 2.3,
          isPlayer: true,
          type: 'tnt',
          timer: 1.2,
          radius: 0.8,
        });
        vfxSystem.spawnShockwave(p.x, p.y, 0, 1.5, '#f59e0b', false, 0.3);
        addFloatingText(p.x, p.y - 0.4, '💣 伏击诡雷已布下!', '#f59e0b', 12);
        break;

      // ===== ROGUE SKILLS =====
      case 'rogue_backstab':
        p.attackCooldown = 0.2;
        vfxSystem.spawnSlash(p.x, p.y, 0.5, p.facingAngle, 1, 'dagger', true, true);
        soundManager.playComboSlash(2);
        // 数值平衡(2026-09): 背刺系数 隐袭2.5/普通1.6 -> 2.2/1.5
        const backstabMult = p.isStealthed ? 2.2 : 1.5;
        dealMeleeAoEDamage(p.x, p.y, p.facingAngle, Math.PI * 0.8, 2.2, finalDamage * backstabMult, true);
        triggerHitStop(0.08, 0.35);
        if (p.isStealthed) {
          p.isStealthed = false;
          addFloatingText(p.x, p.y - 0.5, '🗡️ 破隐刺杀 暴击!', '#f43f5e', 16);
        }
        break;

      case 'rogue_stealth':
        p.isStealthed = true;
        p.stealthTimer = 4.0;
        p.invulnerableTimer = 0.5;
        vfxSystem.spawnEnderVortex(p.x, p.y);
        soundManager.playDash();
        addFloatingText(p.x, p.y - 0.5, '🥷 遁入暗影 (隐匿4秒)', '#38bdf8', 14);
        break;

      case 'rogue_poison':
        p.poisonCoatingTimer = 8.0;
        soundManager.playLevelUp();
        vfxSystem.spawnShockwave(p.x, p.y, 0, 1.5, '#22c55e', false, 0.3);
        addFloatingText(p.x, p.y - 0.5, '🧪 双刃淬剧毒 (8秒)', '#22c55e', 14);
        break;

      default:
        if (!SummonDruidSkillHandler.handleSkill(ctx, skill, skillId, finalDamage)) {
          addFloatingText(p.x, p.y, `${skill.name} 施放!`, '#38bdf8', 14);
        }
        break;
    }

    // Register this skill for combo chaining
    this.registerSkillUsed(p, skillId);
    return true;
  }
}
