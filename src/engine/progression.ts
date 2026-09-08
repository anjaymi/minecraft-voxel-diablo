import { Player } from '../types';
import { CLASS_GROWTH } from './classDefinitions';

export interface GrantExpResult {
  leveled: boolean;
  levelsGained: number;
}

/**
 * 数值平衡(2026-09)：经验统一结算入口（引擎经验珠与任务奖励共用）。
 *
 * 修复三处旧账：
 * 1. 任务奖励直接把 exp 加进面板，绕过升级判定（可能永远不升级/只涨数值）；
 * 2. addExp 只做一次升级判定，单颗高额经验珠无法连升；
 * 3. 升级只加 HP/攻击 —— 现在按职业成长加 HP/攻/防/法力，每级 +1 技能点，
 *    并回满生命与法力（升级即满状态，避免残余负值）。
 */
export function grantExperience(player: Player, amount: number): GrantExpResult {
  const p = player;
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  p.stats.exp = Math.max(0, p.stats.exp + safeAmount);

  let levels = 0;
  // maxExp > 0 兜底防除零/死循环；每级 maxExp ×1.35 保证有限次连升
  while (p.stats.exp >= p.stats.maxExp && p.stats.maxExp > 0) {
    p.stats.exp -= p.stats.maxExp;
    p.stats.level++;
    const g = CLASS_GROWTH[p.characterClass] || CLASS_GROWTH.warrior;
    p.stats.maxHp += g.hp;
    p.stats.maxMana += g.mana;
    p.stats.attack += g.attack;
    p.stats.defense += g.defense;
    p.skillPoints = (p.skillPoints || 0) + 1;
    // 数值平衡(2026-09): 经验曲线斜率 1.35 → 1.30（同级总需求约 -25%），配合区域收益因子，单局 12 级节奏顺畅
    p.stats.maxExp = Math.round(p.stats.maxExp * 1.30);
    p.stats.hp = p.stats.maxHp;
    p.stats.mana = p.stats.maxMana;
    levels++;
  }
  return { leveled: levels > 0, levelsGained: levels };
}
