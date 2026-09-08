/**
 * Map 模块公共 API（barrel）。
 *
 * 目录结构：
 * - TileGrid.ts          瓦片网格原子操作（纯函数）
 * - MapConstants.ts      瓦片语义集合（障碍/可破坏/可交互）
 * - TownMapFactory.ts    翡翠圣城
 * - OverworldMapFactory.ts 迷雾落日荒原
 * - DungeonCarver.ts     地牢雕刻工序（房间/走廊/封墙）
 * - DungeonMapFactory.ts 地牢楼层组装
 * - WorldMapDirector.ts  generateWorldZone 统一入口
 */
export { generateWorldZone } from './WorldMapDirector';
export { generateTownMap } from './TownMapFactory';
export { generateOverworldMap } from './OverworldMapFactory';
export { generateDungeonFloor } from './DungeonMapFactory';
export { generateFrostMap } from './FrostMapFactory';
export { generateVolcanoMap } from './VolcanoMapFactory';
export { generateMushroomMap } from './MushroomMapFactory';
export { generateDesertMap } from './DesertMapFactory';
export { generateSwampMap } from './SwampMapFactory';
export { generateCursedMap } from './CursedMapFactory';
export { generateFrontierKeep } from './FrontierKeepFactory';
export { Rng } from './Rng';
export { SCATTER_PROFILES } from './TerrainScatter';
export { BIOME_ZONES } from './MapConstants';
export {
  createGrid,
  fillRect,
  fillRectIf,
  strokeRect,
  setTile,
  getTileAt,
  isInsideGrid,
  rectCenter,
  hasNeighborTile,
  hasNeighbor8Tile,
} from './TileGrid';
export type { GridRect, Vec2 } from './TileGrid';
export {
  OBSTACLE_TILES,
  DESTRUCTIBLE_TILES,
  INTERACTIVE_TILES,
  isObstacleTileType,
} from './MapConstants';
