import { EnemyType, ZoneType } from '../../types';

/**
 * MonsterDefinition — 图鉴怪物定义（docs/monster-bestiary-plan.md 的数据化落地）。
 *
 * 设计要点：
 * - baseType 复用现有 15 套 chibi 骨架模型，渲染零成本接入
 * - statMult 相对 MONSTER_CONFIGS[baseType] 的数值倍率
 * - mechanic 为 Phase 2 机制标签（数据先行，行为后挂）
 */

export type MonsterFamily =
  | 'undead' | 'beast' | 'illager' | 'elemental' | 'vermin'
  | 'murk' | 'nether' | 'voidborn' | 'fungal' | 'cursed' | 'boss';

export type MonsterRole =
  | 'filler' | 'melee' | 'ranged' | 'caster' | 'summoner'
  | 'tank' | 'assassin' | 'support' | 'boss';

export type MonsterTier = 0 | 1 | 2 | 3 | 4;

export interface MonsterStatMult {
  hp?: number;
  damage?: number;
  speed?: number;
  defense?: number;
  size?: number;
  attackRange?: number;
}

export interface MonsterDefinition {
  id: string;
  name: string;
  family: MonsterFamily;
  tier: MonsterTier;
  role: MonsterRole;
  /** 渲染与 AI 复用的基础骨架（MONSTER_CONFIGS 键） */
  baseType: EnemyType;
  /** 主题染色（血条/投射物/模型色调） */
  color: string;
  /** 出没区域 */
  zones: ZoneType[];
  /** Phase 2 机制标签（数据先行） */
  mechanic?: string;
  statMult?: MonsterStatMult;
}

/** 区域内刷怪条目：[definitionId, 权重] */
export type SpawnEntry = [string, number];

export function defMonster(
  id: string,
  name: string,
  family: MonsterFamily,
  tier: MonsterTier,
  role: MonsterRole,
  baseType: EnemyType,
  color: string,
  zones: ZoneType[],
  statMult?: MonsterStatMult,
  mechanic?: string
): MonsterDefinition {
  return { id, name, family, tier, role, baseType, color, zones, statMult, mechanic };
}
