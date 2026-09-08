import { CharacterClassId, Skill, SkillTree, SkillNode, Player } from '../types';

export const SKILLS: Record<string, Skill> = {
  // --- Warrior Skills ---
  'warrior_slash': { id: 'warrior_slash', name: '重斩 (Heavy Slash)', description: '造成强力物理伤害。', type: 'active', element: 'physical', cooldown: 0.5, manaCost: 5, icon: '🗡️', reqLevel: 1, maxLevel: 5, baseDamage: 15, damageScaling: 1.2 },
  'warrior_whirlwind': { id: 'warrior_whirlwind', name: '剑刃风暴 (Whirlwind)', description: '对周围所有敌人造成伤害。', type: 'active', element: 'physical', cooldown: 6.0, manaCost: 20, icon: '🌪️', reqLevel: 3, maxLevel: 5, baseDamage: 25, damageScaling: 2.2, radius: 3.5 },
  'warrior_leap': { id: 'warrior_leap', name: '跃击 (Leap Attack)', description: '跳向目标区域并造成范围伤害。', type: 'active', element: 'physical', cooldown: 8.0, manaCost: 15, icon: '🦘', reqLevel: 5, maxLevel: 3, baseDamage: 40, damageScaling: 1.5, radius: 2.5 },
  'warrior_toughness': { id: 'warrior_toughness', name: '坚韧 (Toughness)', description: '被动提升最大生命值和防御。', type: 'passive', element: 'physical', cooldown: 0, manaCost: 0, icon: '🛡️', reqLevel: 2, maxLevel: 5 },
  
  // --- Mage Skills ---
  'mage_fireball': { id: 'mage_fireball', name: '火球术 (Fireball)', description: '发射一枚爆炸火球。', type: 'active', element: 'fire', cooldown: 1.5, manaCost: 12, icon: '🔥', reqLevel: 1, maxLevel: 5, baseDamage: 30, damageScaling: 1.5, radius: 2.0 },
  'mage_nova': { id: 'mage_nova', name: '冰霜新星 (Frost Nova)', description: '冻结周围的敌人。', type: 'active', element: 'cold', cooldown: 10.0, manaCost: 30, icon: '❄️', reqLevel: 3, maxLevel: 5, baseDamage: 15, damageScaling: 0.8, radius: 4.0 },
  'mage_teleport': { id: 'mage_teleport', name: '闪现 (Teleport)', description: '瞬间传送到目标位置。', type: 'dash', element: 'physical', cooldown: 5.0, manaCost: 15, icon: '⚡', reqLevel: 4, maxLevel: 3 },
  'mage_meditation': { id: 'mage_meditation', name: '冥想 (Meditation)', description: '加快法力回复速度。', type: 'passive', element: 'physical', cooldown: 0, manaCost: 0, icon: '🧘', reqLevel: 2, maxLevel: 5 },

  // --- Ranger Skills ---
  'ranger_multishot': { id: 'ranger_multishot', name: '多重箭 (Multishot)', description: '同时射出多支箭矢。', type: 'active', element: 'physical', cooldown: 2.0, manaCost: 10, icon: '🏹', reqLevel: 1, maxLevel: 5, baseDamage: 12, damageScaling: 0.9 },
  'ranger_trap': { id: 'ranger_trap', name: '爆炸陷阱 (Explosive Trap)', description: '放置一个会爆炸的陷阱。', type: 'active', element: 'fire', cooldown: 8.0, manaCost: 15, icon: '💣', reqLevel: 3, maxLevel: 5, baseDamage: 45, damageScaling: 1.0, radius: 2.5 },
  'ranger_dash': { id: 'ranger_dash', name: '翻滚 (Tumble)', description: '快速移动并短暂无敌。', type: 'dash', element: 'physical', cooldown: 4.0, manaCost: 8, icon: '💨', reqLevel: 2, maxLevel: 3 },
  
  // --- Rogue Skills ---
  'rogue_backstab': { id: 'rogue_backstab', name: '背刺 (Backstab)', description: '从背后攻击造成巨额伤害。', type: 'active', element: 'physical', cooldown: 3.0, manaCost: 10, icon: '🔪', reqLevel: 1, maxLevel: 5, baseDamage: 20, damageScaling: 2.5 },
  'rogue_poison': { id: 'rogue_poison', name: '淬毒 (Poison Weapon)', description: '武器攻击附加毒素伤害。', type: 'aura', element: 'poison', cooldown: 20.0, manaCost: 25, icon: '🧪', reqLevel: 3, maxLevel: 5 },
  'rogue_stealth': { id: 'rogue_stealth', name: '潜行 (Stealth)', description: '进入隐身状态。', type: 'active', element: 'shadow', cooldown: 12.0, manaCost: 20, icon: '🥷', reqLevel: 4, maxLevel: 3 },

  // --- Summoner Skills ---
  'summoner_skeleton': { id: 'summoner_skeleton', name: '骸骨禁卫 (Skeleton Guard)', description: '唤出一具忠诚的持盾骸骨禁卫协助作战。', type: 'active', element: 'shadow', cooldown: 5.0, manaCost: 18, icon: '💀', reqLevel: 1, maxLevel: 5, baseDamage: 25 },
  'summoner_wolf': { id: 'summoner_wolf', name: '幽暗魔狼 (Shadow Wolf)', description: '召唤迅捷敏捷的幽暗魔狼，高速突袭撕咬敌人。', type: 'active', element: 'shadow', cooldown: 4.5, manaCost: 16, icon: '🐺', reqLevel: 1, maxLevel: 5, baseDamage: 22 },
  'summoner_curse': { id: 'summoner_curse', name: '虚弱诅咒 (Curse of Weakness)', description: '大范围削弱敌人移速并使其护甲骤降。', type: 'active', element: 'shadow', cooldown: 7.5, manaCost: 20, icon: '☠️', reqLevel: 2, maxLevel: 5, radius: 5.5 },
  'summoner_corpse_explosion': { id: 'summoner_corpse_explosion', name: '灵魂爆鸣 (Soul Detonation)', description: '引爆鼠标位置死灵魔力，造成大范围暗影冲击波。', type: 'active', element: 'shadow', cooldown: 6.0, manaCost: 24, icon: '💥', reqLevel: 3, maxLevel: 3, baseDamage: 45, radius: 4.5 },

  // --- Druid Skills ---
  'druid_entangle': { id: 'druid_entangle', name: '自然缠绕 (Entangling Roots)', description: '从地底召唤坚韧藤蔓禁锢范围敌人。', type: 'active', element: 'poison', cooldown: 6.5, manaCost: 18, icon: '🌿', reqLevel: 1, maxLevel: 5, baseDamage: 22, radius: 4.2 },
  'druid_wild_shape': { id: 'druid_wild_shape', name: '野性变身 (Wild Shape)', description: '变身为远古巨熊形态，重载撕裂挥击动画与碰撞体，物理攻击力提升50%。', type: 'active', element: 'physical', cooldown: 14.0, manaCost: 24, icon: '🐻', reqLevel: 2, maxLevel: 3 },
  'druid_treant': { id: 'druid_treant', name: '召唤树精 (Summon Treant)', description: '从大地深处唤醒一株自然树精守护战场。', type: 'active', element: 'poison', cooldown: 8.0, manaCost: 22, icon: '🌳', reqLevel: 2, maxLevel: 3 },
  'druid_rejuvenation': { id: 'druid_rejuvenation', name: '回春滋养 (Wild Rejuvenation)', description: '呼唤大自然生机，立即恢复自身生命与法力。', type: 'active', element: 'holy', cooldown: 10.0, manaCost: 25, icon: '✨', reqLevel: 2, maxLevel: 5 },
  'druid_hurricane': { id: 'druid_hurricane', name: '狂野风暴 (Feral Hurricane)', description: '唤下咆哮的自然风暴撕碎周围敌人。', type: 'active', element: 'cold', cooldown: 8.5, manaCost: 28, icon: '🌪️', reqLevel: 4, maxLevel: 3, baseDamage: 38, radius: 5.0 },
};

export const SKILL_TREES: Record<CharacterClassId, SkillTree> = {
  warrior: {
    classId: 'warrior',
    nodes: [
      { skillId: 'warrior_slash', x: 50, y: 10, reqNodes: [] },
      { skillId: 'warrior_toughness', x: 30, y: 40, reqNodes: ['warrior_slash'] },
      { skillId: 'warrior_whirlwind', x: 70, y: 40, reqNodes: ['warrior_slash'] },
      { skillId: 'warrior_leap', x: 50, y: 70, reqNodes: ['warrior_whirlwind', 'warrior_toughness'] },
    ]
  },
  mage: {
    classId: 'mage',
    nodes: [
      { skillId: 'mage_fireball', x: 50, y: 10, reqNodes: [] },
      { skillId: 'mage_meditation', x: 30, y: 40, reqNodes: ['mage_fireball'] },
      { skillId: 'mage_nova', x: 70, y: 40, reqNodes: ['mage_fireball'] },
      { skillId: 'mage_teleport', x: 50, y: 70, reqNodes: ['mage_nova', 'mage_meditation'] },
    ]
  },
  ranger: {
    classId: 'ranger',
    nodes: [
      { skillId: 'ranger_multishot', x: 50, y: 10, reqNodes: [] },
      { skillId: 'ranger_dash', x: 30, y: 40, reqNodes: ['ranger_multishot'] },
      { skillId: 'ranger_trap', x: 70, y: 40, reqNodes: ['ranger_multishot'] },
    ]
  },
  rogue: {
    classId: 'rogue',
    nodes: [
      { skillId: 'rogue_backstab', x: 50, y: 10, reqNodes: [] },
      { skillId: 'rogue_poison', x: 30, y: 40, reqNodes: ['rogue_backstab'] },
      { skillId: 'rogue_stealth', x: 70, y: 40, reqNodes: ['rogue_backstab'] },
    ]
  },
  summoner: {
    classId: 'summoner',
    nodes: [
      { skillId: 'summoner_skeleton', x: 35, y: 10, reqNodes: [] },
      { skillId: 'summoner_wolf', x: 65, y: 10, reqNodes: [] },
      { skillId: 'summoner_curse', x: 35, y: 50, reqNodes: ['summoner_skeleton'] },
      { skillId: 'summoner_corpse_explosion', x: 65, y: 50, reqNodes: ['summoner_wolf', 'summoner_curse'] },
    ]
  },
  druid: {
    classId: 'druid',
    nodes: [
      { skillId: 'druid_entangle', x: 25, y: 10, reqNodes: [] },
      { skillId: 'druid_wild_shape', x: 50, y: 10, reqNodes: [] },
      { skillId: 'druid_treant', x: 75, y: 10, reqNodes: [] },
      { skillId: 'druid_rejuvenation', x: 35, y: 50, reqNodes: ['druid_entangle'] },
      { skillId: 'druid_hurricane', x: 65, y: 50, reqNodes: ['druid_wild_shape', 'druid_treant'] },
    ]
  },
};

class SkillSystem {
  public getSkill(id: string): Skill {
    return SKILLS[id];
  }

  public getTree(classId: CharacterClassId): SkillTree {
    return SKILL_TREES[classId];
  }

  public canUnlock(player: Player, skillId: string): boolean {
    if (player.skillPoints <= 0) return false;
    
    const skill = this.getSkill(skillId);
    if (player.stats.level < skill.reqLevel) return false;
    
    const currentLevel = player.unlockedSkills[skillId] || 0;
    if (currentLevel >= skill.maxLevel) return false;

    const tree = this.getTree(player.characterClass);
    const node = tree.nodes.find(n => n.skillId === skillId);
    if (!node) return false;

    // Check prereqs
    for (const req of node.reqNodes) {
      if (!player.unlockedSkills[req] || player.unlockedSkills[req] < 1) {
        return false;
      }
    }

    return true;
  }

  public unlockSkill(player: Player, skillId: string): boolean {
    if (this.canUnlock(player, skillId)) {
      player.skillPoints--;
      player.unlockedSkills[skillId] = (player.unlockedSkills[skillId] || 0) + 1;

      // Auto-assign to first empty active hotkey slot if it is an active/dash skill
      const skill = this.getSkill(skillId);
      if (skill && (skill.type === 'active' || skill.type === 'dash' || skill.type === 'aura')) {
        const slots = ['1', '2', '3', '4'];
        const isAlreadyAssigned = slots.some(k => player.activeSkills[k] === skillId);
        if (!isAlreadyAssigned) {
          const emptySlot = slots.find(k => !player.activeSkills[k]);
          if (emptySlot) {
            player.activeSkills[emptySlot] = skillId;
          }
        }
      }

      return true;
    }
    return false;
  }

  /**
   * Deeply bind the class's starting skills and hotkeys to the player
   */
  public initializeClassSkills(player: Player, classId: CharacterClassId): void {
    player.unlockedSkills = {};
    player.activeSkills = {
      '1': null,
      '2': null,
      '3': null,
      '4': null,
      'q': null,
    };
    player.skillCooldowns = {};

    switch (classId) {
      case 'warrior':
        player.unlockedSkills['warrior_slash'] = 1;
        player.unlockedSkills['warrior_whirlwind'] = 1;
        player.unlockedSkills['warrior_leap'] = 1;
        player.activeSkills['1'] = 'warrior_slash';
        player.activeSkills['2'] = 'warrior_whirlwind';
        player.activeSkills['3'] = 'warrior_leap';
        break;
      case 'mage':
        player.unlockedSkills['mage_fireball'] = 1;
        player.unlockedSkills['mage_nova'] = 1;
        player.unlockedSkills['mage_teleport'] = 1;
        player.activeSkills['1'] = 'mage_fireball';
        player.activeSkills['2'] = 'mage_nova';
        player.activeSkills['3'] = 'mage_teleport';
        break;
      case 'ranger':
        player.unlockedSkills['ranger_multishot'] = 1;
        player.unlockedSkills['ranger_trap'] = 1;
        player.unlockedSkills['ranger_dash'] = 1;
        player.activeSkills['1'] = 'ranger_multishot';
        player.activeSkills['2'] = 'ranger_trap';
        player.activeSkills['3'] = 'ranger_dash';
        break;
      case 'rogue':
        player.unlockedSkills['rogue_backstab'] = 1;
        player.unlockedSkills['rogue_poison'] = 1;
        player.unlockedSkills['rogue_stealth'] = 1;
        player.activeSkills['1'] = 'rogue_backstab';
        player.activeSkills['2'] = 'rogue_poison';
        player.activeSkills['3'] = 'rogue_stealth';
        break;
      case 'summoner':
        player.unlockedSkills['summoner_skeleton'] = 1;
        player.unlockedSkills['summoner_wolf'] = 1;
        player.unlockedSkills['summoner_curse'] = 1;
        player.unlockedSkills['summoner_corpse_explosion'] = 1;
        player.activeSkills['1'] = 'summoner_skeleton';
        player.activeSkills['2'] = 'summoner_wolf';
        player.activeSkills['3'] = 'summoner_curse';
        player.activeSkills['4'] = 'summoner_corpse_explosion';
        break;
      case 'druid':
        player.unlockedSkills['druid_entangle'] = 1;
        player.unlockedSkills['druid_wild_shape'] = 1;
        player.unlockedSkills['druid_treant'] = 1;
        player.unlockedSkills['druid_hurricane'] = 1;
        player.activeSkills['1'] = 'druid_entangle';
        player.activeSkills['2'] = 'druid_wild_shape';
        player.activeSkills['3'] = 'druid_treant';
        player.activeSkills['4'] = 'druid_hurricane';
        break;
    }
  }

  public assignHotkey(player: Player, hotkey: string, skillId: string | null) {
    player.activeSkills[hotkey] = skillId;
  }
}

export const skillSystem = new SkillSystem();
