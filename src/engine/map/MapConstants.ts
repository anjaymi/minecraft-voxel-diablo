/**
 * MapConstants — 瓦片语义的唯一权威定义。
 *
 * 引擎的碰撞判定（isObstacleTile）与地图工厂共用同一份集合，
 * 避免多处手写列表造成语义漂移。
 */

/** 阻挡移动的瓦片（实体碰撞） */
export const OBSTACLE_TILES: ReadonlySet<string> = new Set([
  'wall',
  'town_wall',
  'building',
  'water',
  'fountain',
  'lantern',
  'chest',
  'spawner',
  'shrine',
  'barrel',
  'urn',
  'pillar',
  'bone_pile',
  'void',
  'tree',
  'tower',
  'well',
  'market_stall',
  'bed',
  'table',
  'counter',
  'cactus',
  'giant_mushroom',
  'dead_tree',
  // 注意：biome_gate / exit_portal 等传送门必须可通行（踩踏触发），不可列入障碍
]);

/** 可被玩家攻击破坏的瓦片（对应 destructibleManager 渲染层） */
export const DESTRUCTIBLE_TILES: ReadonlySet<string> = new Set([
  'barrel',
  'bush',
  'urn',
  'vines',
]);

/** 可交互的结构瓦片（宝箱 / 神龛 / 传送门） */
export const INTERACTIVE_TILES: ReadonlySet<string> = new Set([
  'chest',
  'shrine',
  'exit_portal',
  'town_gate',
  'dungeon_gate',
]);

/** 水面瓦片（含浅水洼与沼泽浊水，用于反射渲染与近水环境音检测） */
export const WATER_TILES: ReadonlySet<string> = new Set(['water', 'puddle', 'murkwater']);

/** 可通行的地面变体（散布层可以覆盖的基础地面） */
export const WALKABLE_GROUND_TILES: ReadonlySet<string> = new Set([
  'grass', 'floor', 'snow', 'sand', 'scorched',
]);

/** 六大生态探索区（随机传送门可达） */
export const BIOME_ZONES: ReadonlySet<string> = new Set([
  'frost', 'volcano', 'mushroom', 'desert', 'swamp', 'cursed',
]);

export function isObstacleTileType(tile: string): boolean {
  return OBSTACLE_TILES.has(tile);
}

export function isWaterTileType(tile: string): boolean {
  return WATER_TILES.has(tile);
}
