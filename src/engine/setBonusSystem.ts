import { Player, EquippedGear, Item, PlayerStats, SetDefinition, ActiveSetInfo, SetBonusTier } from '../types';

export const SET_DEFINITIONS: Record<string, SetDefinition> = {
  leather: {
    id: 'leather',
    name: '皮革行者 (Leather Stalker)',
    themeColor: '#ca8a04',
    icon: '🥾',
    description: '轻便柔韧的荒野猎户防具，专精极致机动性与敏捷突击。',
    totalPieces: 4,
    piecesSlots: ['armor', 'helmet', 'boots', 'ring'],
    bonuses: [
      {
        pieces: 2,
        name: '迅捷步履 (Swift Footing)',
        description: '移动速度 +1.2，翻滚冲刺位移距离提升 25%',
        stats: { speed: 1.2 },
      },
      {
        pieces: 4,
        name: '荒野潜行者 (Wilderness Prowler)',
        description: '基础暴击率 +15%，受击时获得 20% 概率完全闪避伤害',
        stats: { critChance: 0.15 },
        customEffect: 'dodge_chance_20',
      },
    ],
  },
  iron: {
    id: 'iron',
    name: '精铁壁垒 (Iron Bulwark)',
    themeColor: '#94a3b8',
    icon: '🛡️',
    description: '重装骑士的坚厚铁甲，如不动磐石般承受千锤百炼。',
    totalPieces: 4,
    piecesSlots: ['armor', 'helmet', 'boots', 'offhand'],
    bonuses: [
      {
        pieces: 2,
        name: '重装护体 (Heavy Plating)',
        description: '护甲防御值 +14，最大生命值 +80',
        stats: { defense: 14, maxHp: 80 },
      },
      {
        pieces: 4,
        name: '不动要塞 (Impenetrable Fortress)',
        description: '受到的所有伤害减少 20%，成功格挡时向周围反震 100% 荆棘反弹',
        customEffect: 'damage_reduction_20',
      },
    ],
  },
  gold: {
    id: 'gold',
    name: '黄金贪婪 (Golden Sovereign)',
    themeColor: '#fbbf24',
    icon: '👑',
    description: '铭刻着点金贪婪符文的纯金王道战甲，富贵与凶煞并存。',
    totalPieces: 4,
    piecesSlots: ['armor', 'helmet', 'boots', 'ring'],
    bonuses: [
      {
        pieces: 2,
        name: '点石成金 (Midas Touch)',
        description: '敌人掉落绿宝石数量翻倍，拾取绿宝石时即刻恢复 12 点生命',
        customEffect: 'emerald_heal',
      },
      {
        pieces: 4,
        name: '黄金狂热 (Gold Rush)',
        description: '攻击力 +22，且每持有 50 枚绿宝石额外增加 5% 伤害（上限 25%）',
        stats: { attack: 22 },
        customEffect: 'gold_damage_scaling',
      },
    ],
  },
  diamond: {
    id: 'diamond',
    name: '璀璨钻石 (Diamond Sovereign)',
    themeColor: '#38bdf8',
    icon: '💎',
    description: '由高纯度地底钻石晶核打造的神器，赋予佩戴者不朽神威。',
    totalPieces: 4,
    piecesSlots: ['weapon', 'armor', 'helmet', 'boots'],
    bonuses: [
      {
        pieces: 2,
        name: '坚韧晶辉 (Crystal Resilience)',
        description: '最大生命值 +150，生命偷取率 +8%',
        stats: { maxHp: 150, lifeSteal: 0.08 },
      },
      {
        pieces: 4,
        name: '永恒钻石壁障 (Diamond Aegis)',
        description: '攻击力 +30%，生命值低于 35% 时触发钻石护盾抵挡 200 点伤害（冷却 30秒）',
        customEffect: 'diamond_aegis_shield',
      },
    ],
  },
  netherite: {
    id: 'netherite',
    name: '下界合金灭世 (Netherite Annihilator)',
    themeColor: '#a855f7',
    icon: '🌋',
    description: '下界深渊远古残骸熔铸的魔物武装，承载毁灭地狱炽火。',
    totalPieces: 4,
    piecesSlots: ['weapon', 'armor', 'helmet', 'boots'],
    bonuses: [
      {
        pieces: 2,
        name: '熔岩淬火 (Lava Forged)',
        description: '攻击力 +35，普通攻击与技能必定附加永久烈焰灼烧',
        stats: { attack: 35 },
        customEffect: 'permanent_burn',
      },
      {
        pieces: 4,
        name: '末日天谴 (Nether Cataclysm)',
        description: '近战命中时有 35% 概率引发地心烈焰大爆炸，造成 200% 范围火伤',
        customEffect: 'nether_explosion_proc',
      },
    ],
  },
  arcane: {
    id: 'arcane',
    name: '奥术学者 (Arcane Scholar)',
    themeColor: '#c084fc',
    icon: '🔮',
    description: '古帝国星辉学者编织的符文战袍与法珠，掌控时空灵流。',
    totalPieces: 4,
    piecesSlots: ['weapon', 'offhand', 'armor', 'ring'],
    bonuses: [
      {
        pieces: 2,
        name: '符文共振 (Rune Resonance)',
        description: '所有技能冷却缩短 25%，最大法力值 +80',
        stats: { maxMana: 80 },
        customEffect: 'cooldown_reduction_25',
      },
      {
        pieces: 4,
        name: '超界星涌 (Supernal Surge)',
        description: '每次使用技能后，下次普通挥砍必定暴击并呼唤 3 枚追踪奥术飞弹',
        customEffect: 'arcane_missile_proc',
      },
    ],
  },
  shadow: {
    id: 'shadow',
    name: '暗影潜伏 (Shadow Lurker)',
    themeColor: '#22d3ee',
    icon: '🗡️',
    description: '游荡于虚空边缘的刺客夜行具，为一击必杀而生。',
    totalPieces: 4,
    piecesSlots: ['weapon', 'armor', 'helmet', 'boots'],
    bonuses: [
      {
        pieces: 2,
        name: '致命锋芒 (Lethal Edge)',
        description: '暴击几率 +12%，暴击伤害提升至 250%',
        stats: { critChance: 0.12 },
        customEffect: 'crit_damage_boost',
      },
      {
        pieces: 4,
        name: '幽灵瞬杀 (Phantom Reaper)',
        description: '成功击杀敌方后立即刷新翻滚冷却，并进入 2 秒幽魂疾行',
        customEffect: 'kill_dash_reset',
      },
    ],
  },
};

export class SetBonusSystem {
  /**
   * Determine which set an item belongs to based on setId or name patterns
   */
  public resolveItemSetId(item: Item): string | null {
    if (item.setId && SET_DEFINITIONS[item.setId]) {
      return item.setId;
    }
    const name = item.name.toLowerCase();
    if (name.includes('皮革') || name.includes('leather')) return 'leather';
    if (name.includes('铁') || name.includes('iron')) return 'iron';
    if (name.includes('金') || name.includes('gold')) return 'gold';
    if (name.includes('钻石') || name.includes('diamond')) return 'diamond';
    if (name.includes('下界') || name.includes('netherite')) return 'netherite';
    if (name.includes('奥术') || name.includes('学者') || name.includes('法杖') || name.includes('arcane')) return 'arcane';
    if (name.includes('暗影') || name.includes('刺客') || name.includes('shadow') || name.includes('dagger')) return 'shadow';
    return null;
  }

  /**
   * Calculate all active and inactive set bonuses for equipped gear
   */
  public calculateActiveSets(equipped: EquippedGear): ActiveSetInfo[] {
    const counts: Record<string, number> = {};

    const slots: (keyof EquippedGear)[] = ['weapon', 'offhand', 'armor', 'helmet', 'boots', 'ring'];
    for (const slot of slots) {
      const item = equipped[slot];
      if (!item) continue;
      const setId = this.resolveItemSetId(item);
      if (setId) {
        counts[setId] = (counts[setId] || 0) + 1;
      }
    }

    const result: ActiveSetInfo[] = [];

    for (const [setId, count] of Object.entries(counts)) {
      const setDef = SET_DEFINITIONS[setId];
      if (!setDef) continue;

      const activeBonuses: SetBonusTier[] = [];
      const inactiveBonuses: SetBonusTier[] = [];

      for (const bonus of setDef.bonuses) {
        if (count >= bonus.pieces) {
          activeBonuses.push(bonus);
        } else {
          inactiveBonuses.push(bonus);
        }
      }

      result.push({
        setDef,
        equippedCount: count,
        activeBonuses,
        inactiveBonuses,
      });
    }

    return result;
  }

  /**
   * Apply passive stat bonuses from active sets
   */
  public applySetStatBonuses(target: Player | PlayerStats, activeSets?: ActiveSetInfo[]): void {
    let baseStats: PlayerStats;
    let sets: ActiveSetInfo[];

    if ('stats' in target && 'equipment' in target) {
      baseStats = target.stats;
      sets = this.calculateActiveSets(target.equipment);
    } else {
      baseStats = target as PlayerStats;
      sets = activeSets || [];
    }

    for (const activeSet of sets) {
      for (const bonus of activeSet.activeBonuses) {
        if (!bonus.stats) continue;
        if (bonus.stats.attack) baseStats.attack += bonus.stats.attack;
        if (bonus.stats.defense) baseStats.defense += bonus.stats.defense;
        if (bonus.stats.maxHp) {
          baseStats.maxHp += bonus.stats.maxHp;
          baseStats.hp = Math.min(baseStats.hp + bonus.stats.maxHp, baseStats.maxHp);
        }
        if (bonus.stats.speed) baseStats.speed += bonus.stats.speed;
        if (bonus.stats.critChance) baseStats.critChance += bonus.stats.critChance;
        if (bonus.stats.lifeSteal) baseStats.lifeSteal += bonus.stats.lifeSteal;
        if (bonus.stats.maxMana) baseStats.maxMana += bonus.stats.maxMana;
      }
    }
  }

  /**
   * Check if a specific custom set effect is active
   */
  public hasEffect(activeSets: ActiveSetInfo[], effectId: string): boolean {
    return activeSets.some((s) => s.activeBonuses.some((b) => b.customEffect === effectId));
  }
}

export const setBonusSystem = new SetBonusSystem();
