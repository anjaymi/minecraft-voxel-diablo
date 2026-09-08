import { DungeonFloor, TileType } from '../../types';
import { Rng } from './Rng';
import { setTile, getTileAt, isInsideGrid } from './TileGrid';

/**
 * TerrainScatter — 通用地形散布层（随机地图的核心工序）。
 *
 * 在已生成的底图上按区域剖面随机撒布装饰：
 * 水洼团簇、树丛、高草、花丛、蘑菇、碎石。
 * 只覆盖基础地面（由剖面指定），永不破坏道路、
 * 门口、出生点等结构性瓦片。
 */

export type ScatterZone =
  | 'overworld' | 'town' | 'dungeon' | 'nether' | 'end'
  | 'frost' | 'volcano' | 'mushroom' | 'desert' | 'swamp' | 'cursed';

export interface ScatterProfile {
  /** 本区水面瓦片（水洼团簇用；frost=ice，swamp=murkwater） */
  waterTile: TileType;
  /** 每千格基础地面上生成的水洼种子数 */
  puddlesPerKilo: number;
  /** 每千格基础地面上的树丛种子数 */
  treeClustersPerKilo: number;
  /** 树丛内单棵树密度（0-1，占候选格比例） */
  treeDensity: number;
  /** 树丛使用的树瓦片 */
  treeTile: TileType;
  /** 单点装饰概率（逐格判定） */
  tallGrass: number;
  flower: number;
  pebble: number;
  mushroom: number;
  /** 出生点保护半径 */
  spawnClearRadius: number;
  /** 树丛最大半径 */
  treeClusterRadius: [number, number];
  /** 水洼最大半径 */
  puddleRadius: [number, number];
}

function profile(over: Partial<ScatterProfile>): ScatterProfile {
  return {
    waterTile: 'puddle',
    puddlesPerKilo: 0,
    treeClustersPerKilo: 0,
    treeDensity: 0,
    treeTile: 'tree',
    tallGrass: 0,
    flower: 0,
    pebble: 0,
    mushroom: 0,
    spawnClearRadius: 3,
    treeClusterRadius: [1, 1],
    puddleRadius: [1, 1],
    ...over,
  };
}

export const SCATTER_PROFILES: Record<ScatterZone, ScatterProfile> = {
  overworld: profile({
    waterTile: 'puddle', puddlesPerKilo: 14, treeClustersPerKilo: 22, treeDensity: 0.72,
    tallGrass: 0.05, flower: 0.045, pebble: 0.02, mushroom: 0.004,
    spawnClearRadius: 4, treeClusterRadius: [2, 5], puddleRadius: [1, 3],
  }),
  town: profile({
    waterTile: 'puddle', puddlesPerKilo: 4, treeClustersPerKilo: 6, treeDensity: 0.6,
    tallGrass: 0.015, flower: 0.05, pebble: 0.012,
    spawnClearRadius: 4, treeClusterRadius: [1, 2], puddleRadius: [1, 2],
  }),
  dungeon: profile({ waterTile: 'puddle', puddlesPerKilo: 5, pebble: 0.055, mushroom: 0.045 }),
  nether: profile({ pebble: 0.07, mushroom: 0.025 }),
  end: profile({ pebble: 0.04, mushroom: 0.012 }),
  frost: profile({
    waterTile: 'ice', puddlesPerKilo: 10, treeClustersPerKilo: 16, treeDensity: 0.6,
    pebble: 0.03, spawnClearRadius: 4, treeClusterRadius: [2, 4], puddleRadius: [1, 3],
  }),
  volcano: profile({ pebble: 0.06 }),
  mushroom: profile({
    treeClustersPerKilo: 8, treeDensity: 0.55, treeTile: 'giant_mushroom',
    tallGrass: 0.04, mushroom: 0.09, pebble: 0.02,
    spawnClearRadius: 4, treeClusterRadius: [1, 3],
  }),
  desert: profile({ pebble: 0.045 }),
  swamp: profile({
    waterTile: 'murkwater', puddlesPerKilo: 22, treeClustersPerKilo: 14, treeDensity: 0.6, treeTile: 'dead_tree',
    tallGrass: 0.06, mushroom: 0.02, spawnClearRadius: 4,
    treeClusterRadius: [1, 3], puddleRadius: [1, 3],
  }),
  cursed: profile({
    treeClustersPerKilo: 18, treeDensity: 0.62, treeTile: 'dead_tree',
    tallGrass: 0.03, pebble: 0.025, mushroom: 0.015,
    spawnClearRadius: 4, treeClusterRadius: [2, 4],
  }),
};

/** 各区域的散布基础地面 */
const BASE_TILE: Record<ScatterZone, TileType> = {
  overworld: 'grass', town: 'grass', dungeon: 'floor', nether: 'floor', end: 'floor',
  frost: 'snow', volcano: 'scorched', mushroom: 'grass', desert: 'sand',
  swamp: 'grass', cursed: 'grass',
};

const POINT_DECOR: Array<{ key: keyof ScatterProfile; tile: TileType }> = [
  { key: 'tallGrass', tile: 'tall_grass' },
  { key: 'flower', tile: 'flower_patch' },
  { key: 'pebble', tile: 'pebble' },
  { key: 'mushroom', tile: 'mushroom' },
];

/** 对楼层执行完整散布 pass（就地修改 tiles） */
export function scatterTerrain(floor: DungeonFloor, zoneKey: ScatterZone, rng: Rng): void {
  const profile = SCATTER_PROFILES[zoneKey];
  const base = BASE_TILE[zoneKey];
  const candidates = collectBaseTiles(floor, base, profile.spawnClearRadius);

  scatterPuddles(floor, base, candidates, profile, rng);
  scatterTreeClusters(floor, base, candidates, profile, rng);
  scatterPointDecor(floor, base, profile, rng);

  // 清空出生点附近（散布可能贴脸生成）
  clearSpawnArea(floor, base, profile.spawnClearRadius);
}

/** 收集可散布的基础地面格（远离出生点） */
function collectBaseTiles(floor: DungeonFloor, base: TileType, clearRadius: number): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < floor.height - 1; y++) {
    for (let x = 1; x < floor.width - 1; x++) {
      if (floor.tiles[y][x] !== base) continue;
      if (Math.hypot(x - floor.spawnX, y - floor.spawnY) <= clearRadius) continue;
      result.push({ x, y });
    }
  }
  return result;
}

/** 随机漫步生成水洼团簇（水面瓦片按剖面决定） */
function scatterPuddles(
  floor: DungeonFloor,
  base: TileType,
  candidates: Array<{ x: number; y: number }>,
  profile: ScatterProfile,
  rng: Rng
): void {
  if (profile.puddlesPerKilo <= 0) return;
  const count = Math.round((candidates.length / 1000) * profile.puddlesPerKilo);

  for (let i = 0; i < count; i++) {
    const seed = rng.pick(candidates);
    const radius = rng.int(profile.puddleRadius[0], profile.puddleRadius[1] + 1);
    const size = rng.weightedSize(2, 3 + radius * 2);
    growBlob(floor, base, seed.x, seed.y, size, radius, profile.waterTile, () => true, rng);
  }
}

/** 随机漫步生成树丛（树木为障碍物，团簇内按密度填充） */
function scatterTreeClusters(
  floor: DungeonFloor,
  base: TileType,
  candidates: Array<{ x: number; y: number }>,
  profile: ScatterProfile,
  rng: Rng
): void {
  if (profile.treeClustersPerKilo <= 0) return;
  const count = Math.round((candidates.length / 1000) * profile.treeClustersPerKilo);

  for (let i = 0; i < count; i++) {
    const seed = rng.pick(candidates);
    const radius = rng.int(profile.treeClusterRadius[0], profile.treeClusterRadius[1] + 1);
    const size = rng.weightedSize(3, 4 + radius * 3);
    growBlob(floor, base, seed.x, seed.y, size, radius, profile.treeTile, () => rng.chance(profile.treeDensity), rng);
  }
}

/** 逐格单点装饰 */
function scatterPointDecor(floor: DungeonFloor, base: TileType, profile: ScatterProfile, rng: Rng): void {
  for (let y = 1; y < floor.height - 1; y++) {
    for (let x = 1; x < floor.width - 1; x++) {
      if (getTileAt(floor.tiles, x, y) !== base) continue;
      for (const decor of POINT_DECOR) {
        const probability = profile[decor.key] as number;
        if (probability > 0 && rng.chance(probability)) {
          setTile(floor.tiles, x, y, decor.tile);
          break;
        }
      }
    }
  }
}

/** 从种子点随机漫步生长团簇，只覆盖基础地面 */
function growBlob(
  floor: DungeonFloor,
  base: TileType,
  startX: number,
  startY: number,
  size: number,
  maxRadius: number,
  tile: TileType,
  accept: () => boolean,
  rng: Rng
): void {
  let x = startX;
  let y = startY;
  let placed = 0;

  for (let step = 0; step < size * 6 && placed < size; step++) {
    if (isInsideGrid(floor.tiles, x, y) && floor.tiles[y][x] === base && accept()) {
      setTile(floor.tiles, x, y, tile);
      placed++;
    }
    // 随机漫步到相邻格
    const dir = rng.int(0, 4);
    const dx = dir === 0 ? 1 : dir === 1 ? -1 : 0;
    const dy = dir === 2 ? 1 : dir === 3 ? -1 : 0;
    if (Math.hypot(x + dx - startX, y + dy - startY) <= maxRadius) {
      x += dx;
      y += dy;
    }
  }
}

/** 出生点保护圈内移除散布装饰，恢复基础地面 */
function clearSpawnArea(floor: DungeonFloor, base: TileType, radius: number): void {
  for (let y = floor.spawnY - radius; y <= floor.spawnY + radius; y++) {
    for (let x = floor.spawnX - radius; x <= floor.spawnX + radius; x++) {
      const tile = getTileAt(floor.tiles, x, y);
      if (tile && DECOR_TILES.has(tile)) {
        setTile(floor.tiles, x, y, base);
      }
    }
  }
}

export const DECOR_TILES: ReadonlySet<TileType> = new Set<TileType>([
  'puddle', 'ice', 'murkwater', 'tree', 'giant_mushroom', 'dead_tree',
  'tall_grass', 'flower_patch', 'pebble', 'mushroom',
]);
