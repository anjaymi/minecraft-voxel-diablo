/**
 * 兼容 shim — 地图生成已原子化拆分至 `src/engine/map/`。
 * 新代码请直接从 `./map` 导入。
 */
export { generateDungeonFloor, generateTownMap, generateOverworldMap, generateWorldZone } from './map';
