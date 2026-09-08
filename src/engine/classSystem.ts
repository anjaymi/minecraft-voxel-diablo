import { CharacterClass, CharacterClassId, EquippedGear, Item, Player, Enemy } from '../types';
import { vfxSystem } from './vfxSystem';
import { soundManager } from '../audio/soundManager';
import { ClassGearFactory } from './classGearFactory';
import { skillSystem } from './skillSystem';
import { CLASS_DEFINITIONS, CLASS_GROWTH } from './classDefinitions';

export { CLASS_DEFINITIONS };

export class ClassSystem {
  public getAllClasses(): CharacterClass[] {
    return Object.values(CLASS_DEFINITIONS);
  }

  public getClass(id: CharacterClassId): CharacterClass {
    return CLASS_DEFINITIONS[id] || CLASS_DEFINITIONS.warrior;
  }

  /**
   * Generates starting gear suited for the chosen class
   */
  public generateStartingGear(classId: CharacterClassId): EquippedGear {
    return ClassGearFactory.generateStartingGear(classId);
  }

  /**
   * Applies a class to the player, updating base stats, giving class gear, and binding class skills
   */
  public applyClass(player: Player, classId: CharacterClassId, replaceGear: boolean = true) {
    const classDef = this.getClass(classId);
    player.characterClass = classId;

    // Deeply bind class skills and hotkeys
    skillSystem.initializeClassSkills(player, classId);

    // Retain emeralds, level, exp, potions, 经验条进度
    const prevEmeralds = player.stats.emeralds;
    const prevLevel = player.stats.level;
    const prevExp = player.stats.exp;
    const prevMaxExp = player.stats.maxExp || 100;
    const prevPotions = player.stats.potions;
    const prevTnt = player.stats.tntCount;
    const prevPearls = player.stats.enderPearls;

    // 数值平衡(2026-09)：换职不再丢等级成长——属性 = 职业基础 + (等级-1)×该职业成长；maxExp 不再重置回 100
    const growth = CLASS_GROWTH[classId];
    const levelGain = Math.max(0, (prevLevel || 1) - 1);
    const baseHp = classDef.baseStats.maxHp + levelGain * growth.hp;
    const baseMana = classDef.baseStats.maxMana + levelGain * growth.mana;
    const baseAttack = classDef.baseStats.attack + levelGain * growth.attack;
    const baseDefense = classDef.baseStats.defense + levelGain * growth.defense;

    // Reinitialize base stats from class (level-scaled)
    player.stats = {
      hp: baseHp,
      maxHp: baseHp,
      mana: baseMana,
      maxMana: baseMana,
      attack: baseAttack,
      defense: baseDefense,
      critChance: classDef.baseStats.critChance,
      speed: classDef.baseStats.speed,
      lifeSteal: classDef.baseStats.lifeSteal,
      exp: prevExp,
      maxExp: prevMaxExp,
      level: prevLevel,
      emeralds: prevEmeralds,
      potions: prevPotions,
      tntCount: prevTnt,
      enderPearls: prevPearls,
    };

    player.spellPower = classId === 'mage' ? 25 : (classId === 'summoner' ? 15 : (classId === 'druid' ? 18 : 0));
    player.summonDamageBonus = classId === 'summoner' ? 0.35 : (classId === 'druid' ? 0.20 : 0);
    player.arcanePenetration = classId === 'mage' ? 15 : 0;
    player.minionHpBonus = classId === 'summoner' ? 0.35 : (classId === 'druid' ? 0.20 : 0);
    player.natureDamageBonus = classId === 'druid' ? 0.35 : 0;
    player.minions = [];

    if (replaceGear) {
      player.equipment = this.generateStartingGear(classId);
      // Recalculate gear bonuses
      for (const slot of Object.keys(player.equipment) as Array<keyof EquippedGear>) {
        const item = player.equipment[slot];
        if (item) {
          if (item.attackBonus) player.stats.attack += item.attackBonus;
          if (item.defenseBonus) player.stats.defense += item.defenseBonus;
          if (item.speedBonus) player.stats.speed += item.speedBonus;
          if (item.critChanceBonus) player.stats.critChance += item.critChanceBonus;
          if (item.hpBonus) {
            player.stats.maxHp += item.hpBonus;
            player.stats.hp += item.hpBonus;
          }
          if (item.lifeStealBonus) player.stats.lifeSteal += item.lifeStealBonus;
          if (item.spellPowerBonus) player.spellPower = (player.spellPower || 0) + item.spellPowerBonus;
          if (item.arcanePenetrationBonus) player.arcanePenetration = (player.arcanePenetration || 0) + item.arcanePenetrationBonus;
          if (item.minionHpBonus) player.minionHpBonus = (player.minionHpBonus || 0) + item.minionHpBonus;
          if (item.summonDamageBonus) player.summonDamageBonus = (player.summonDamageBonus || 0) + item.summonDamageBonus;
          if (item.natureDamageBonus) player.natureDamageBonus = (player.natureDamageBonus || 0) + item.natureDamageBonus;
        }
      }
    }
  }

  /**
   * Calculates class passive attack multiplier & backstab bonus
   */
  public evaluateAttack(
    player: Player,
    enemy: Enemy,
    isMelee: boolean,
    dist: number
  ): { multiplier: number; isBackstab: boolean; bonusLifeSteal: number } {
    let multiplier = 1.0;
    let isBackstab = false;
    let bonusLifeSteal = 0.0;

    const classId = player.characterClass || 'warrior';

    if (classId === 'warrior') {
      // Blood rage: under 50% HP -> +35% damage, +10% life steal
      if (player.stats.hp < player.stats.maxHp * 0.5) {
        multiplier *= 1.35;
        bonusLifeSteal += 0.1;
      }
    } else if (classId === 'ranger') {
      // Eagle eye: long range (> 3.2 tiles) -> +60% damage
      if (dist >= 3.2) {
        multiplier *= 1.6;
      }
    } else if (classId === 'rogue') {
      // Shadow ambush: check if player is attacking from behind/side of enemy
      // Enemy movement angle vs vector from enemy to player
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const attackAngle = Math.atan2(dy, dx);
      // If enemy has velocity, check angle difference; else compare facing
      const angleDiff = Math.abs(attackAngle - Math.atan2(enemy.vy || 0.1, enemy.vx || 0.1));
      if (angleDiff > Math.PI * 0.4) {
        isBackstab = true;
        multiplier *= 1.85;
      }
    } else if (classId === 'summoner') {
      // Legion Command: +15% base damage, +5% additional per active minion
      const minionCount = player.minions?.length || 0;
      multiplier *= 1.15 + minionCount * 0.05;
    } else if (classId === 'druid') {
      // Nature's Balance: bonus 25% damage and 6% life steal
      multiplier *= 1.25;
      bonusLifeSteal += 0.06;
    }

    return { multiplier, isBackstab, bonusLifeSteal };
  }

  /**
   * Trigger class passive on Potion use
   */
  public onPotionUsed(player: Player, gameEnemies: Enemy[]) {
    if (player.characterClass === 'mage') {
      // Mage Arcane Surge: extra 35 HP + knockback arcane blast
      const extraHeal = 35;
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + extraHeal);
      vfxSystem.spawnShockwave(player.x, player.y, 0, 3.5, '#a855f7', false, 0.4);
      soundManager.playExplosion();

      // Knock back enemies
      for (const enemy of gameEnemies) {
        const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (d < 3.5) {
          enemy.vx += ((enemy.x - player.x) / d) * 8;
          enemy.vy += ((enemy.y - player.y) / d) * 8;
        }
      }
    } else if (player.characterClass === 'summoner') {
      // Enrage all active minions and heal them to max
      if (player.minions) {
        for (const m of player.minions) {
          m.hp = m.maxHp;
          m.isEnraged = true;
        }
        vfxSystem.spawnShockwave(player.x, player.y, 0, 3.2, '#6366f1', false, 0.35);
      }
    } else if (player.characterClass === 'druid') {
      // Nature's Bloom: heal an additional 30 HP and restore full mana
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + 30);
      player.stats.mana = player.stats.maxMana;
      vfxSystem.spawnShockwave(player.x, player.y, 0, 3.2, '#16a34a', false, 0.4);
    }
  }

  /**
   * Trigger class passive on Dash
   */
  public onDashUsed(player: Player, gameEnemies: Enemy[]) {
    if (player.characterClass === 'rogue') {
      // Rogue leaves blinding smoke screen at start position
      vfxSystem.spawnDashDust(player.x, player.y, player.facingAngle + Math.PI, '#06b6d4');
      vfxSystem.spawnShockwave(player.x, player.y, 0, 2.2, '#0891b2', false, 0.35);

      // Slow nearby enemies
      for (const enemy of gameEnemies) {
        const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (d < 2.5) {
          enemy.vx *= 0.2;
          enemy.vy *= 0.2;
          enemy.hitTimer = 0.4; // brief stagger
        }
      }
    } else if (player.characterClass === 'summoner') {
      // Rally: blink teleport minions closer to player
      if (player.minions) {
        for (const m of player.minions) {
          m.x = player.x + (Math.random() - 0.5) * 1.5;
          m.y = player.y + (Math.random() - 0.5) * 1.5;
        }
        vfxSystem.spawnDashDust(player.x, player.y, player.facingAngle, '#818cf8');
      }
    } else if (player.characterClass === 'druid') {
      // Briar trail: slows enemies passing by
      vfxSystem.spawnDashDust(player.x, player.y, player.facingAngle, '#22c55e');
      for (const enemy of gameEnemies) {
        const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (d < 2.5) {
          enemy.vx *= 0.3;
          enemy.vy *= 0.3;
        }
      }
    }
  }
}

export const classSystem = new ClassSystem();
