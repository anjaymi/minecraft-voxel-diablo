import { ZoneType } from '../../types';
import { MonsterDefinition } from './MonsterDefinition';
import { MONSTER_CATALOG } from './monsterCatalog';

/**
 * monsterRegistry — 图鉴注册表。
 *
 * 提供 id 查询、区域怪物池与权重抽取；
 * 模块加载时自检目录完整性（恰好 100 条、id 唯一）。
 */

const DEFINITIONS = new Map<string, MonsterDefinition>();
const ZONE_POOLS = new Map<ZoneType, MonsterDefinition[]>();

for (const def of MONSTER_CATALOG) {
  if (DEFINITIONS.has(def.id)) {
    throw new Error(`[monsterRegistry] 重复的怪物 id: ${def.id}`);
  }
  DEFINITIONS.set(def.id, def);
  for (const zone of def.zones) {
    let pool = ZONE_POOLS.get(zone);
    if (!pool) {
      pool = [];
      ZONE_POOLS.set(zone, pool);
    }
    pool.push(def);
  }
}

if (DEFINITIONS.size < 100) {
  throw new Error(`[monsterRegistry] 图鉴数量不足: ${DEFINITIONS.size}/100+`);
}

export function getMonsterDefinition(id: string): MonsterDefinition | undefined {
  return DEFINITIONS.get(id);
}

export function getAllMonsterDefinitions(): MonsterDefinition[] {
  return [...DEFINITIONS.values()];
}

export function getZoneMonsterPool(zone: ZoneType): MonsterDefinition[] {
  return ZONE_POOLS.get(zone) ?? [];
}

/** 权重公式：tier 越低越常见；T4 首领永不进入常规遭遇池 */
const TIER_WEIGHT: Record<number, number> = { 0: 3.2, 1: 2.6, 2: 1.4, 3: 0.35, 4: 0 };

/** 从区域池按等级带抽取一只怪（排除 T4 首领） */
export function pickZoneMonster(zone: ZoneType, floorNumber: number = 1): MonsterDefinition | null {
  const pool = getZoneMonsterPool(zone).filter((d) => d.tier < 4);
  if (pool.length === 0) return null;

  // 数值平衡(2026-09): 权重带改按内容等级 1-12 标定（旧值按 8×层数，导致高层只出 T0 填充怪）
  const levelBandCenter = Math.max(1, Math.min(12, floorNumber));
  const entries = pool.map((def) => {
    const tierWeight = TIER_WEIGHT[def.tier];
    // 等级带偏离惩罚：怪物 tier 离内容等级越远越罕见
    const bandCenter = 1 + def.tier * 3.5;   // tier 0→1, tier 1→4.5, tier 2→8, tier 3→11.5
    const bandFit = 1 / (1 + Math.abs(bandCenter - levelBandCenter) / 6);
    return { def, weight: tierWeight * bandFit };
  });

  const total = entries.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.def;
  }
  return entries[entries.length - 1].def;
}

/** 稀有头目（T3）按 8% 概率单独出现 */
export function rollRareBoss(zone: ZoneType): MonsterDefinition | null {
  const pool = getZoneMonsterPool(zone).filter((d) => d.tier === 3);
  if (pool.length === 0 || Math.random() >= 0.08) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
