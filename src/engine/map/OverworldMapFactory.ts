import { DungeonFloor, DungeonRoom, TileType } from '../../types';
import { createGrid, strokeRect, setTile, getTileAt, fillRect } from './TileGrid';
import { Rng } from './Rng';
import { scatterTerrain } from './TerrainScatter';
import { placeBiomeGatesAt, carveBossArena } from './BiomeMapKit';

/**
 * OverworldMapFactory — 迷雾落日荒原（野外大地图）工厂。
 *
 * 随机化要素：蜿蜒河流与牛轭水洼、弯曲主路、
 * 数量位置随机的远古废墟、猎人木屋、瞭望塔、
 * 森林树丛与地表装饰（由 TerrainScatter 撒布）。
 * 大地图深处另设一座巨兽巢穴（脊冠暴君，巨型世界首领）。
 */

const OVERWORLD_WIDTH = 50;
const OVERWORLD_HEIGHT = 50;

export function generateOverworldMap(): DungeonFloor {
  const width = OVERWORLD_WIDTH;
  const height = OVERWORLD_HEIGHT;
  const rng = new Rng();
  const grid = createGrid(width, height, 'grass');

  strokeRect(grid, { x: 0, y: 0, w: width, h: height }, 'wall');

  const gateX = placeGates(grid, width, height, rng);
  const roadPath = carveMeanderingRoad(grid, width, height, gateX, rng);
  const riverBed = carveWindingRiver(grid, width, height, rng);
  buildBridge(grid, roadPath);
  const ruins = buildRandomRuins(grid, width, height, rng);
  buildHunterCabins(grid, width, height, roadPath, rng);
  placeWatchtower(grid, width, height, roadPath, rng);
  placeWildernessProps(grid, width, height, roadPath, ruins, rng);
  placeBiomeGatesAt(grid, width, height, 'grass', roadPath, rng, 2);
  // 荒野巨兽巢穴：先于散布层在干净草甸中开辟骨环竞技场（散布不覆盖障碍物）
  const arena = carveBossArena(grid, width, height, rng, 'grass');
  scatterTerrain(scatterContext(grid, width, height, gateX), 'overworld', rng);

  const floor = assembleFloor(grid, width, height, gateX);
  if (arena) {
    floor.lairX = arena.x;
    floor.lairY = arena.y;
    floor.lairBoss = rng.chance(0.5) ? 'ridgeback_tyrant' : 'wasteland_goliath';
  }
  return floor;
}

/** 南北城门（横向位置带随机偏移） */
function placeGates(grid: TileType[][], width: number, height: number, rng: Rng): number {
  const gateX = Math.floor(width / 2) + rng.int(-5, 6);
  grid[0][gateX] = 'town_gate';
  grid[0][gateX - 1] = 'town_gate';
  grid[height - 1][gateX] = 'dungeon_gate';
  grid[height - 1][gateX - 1] = 'dungeon_gate';
  return gateX;
}

/** 弯曲主路：从北门向南随机游走，返回路径点 */
function carveMeanderingRoad(
  grid: TileType[][],
  width: number,
  height: number,
  gateX: number,
  rng: Rng
): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];
  let x = gateX;
  for (let y = 1; y < height - 1; y++) {
    // 随机漂移但被拉回门轴附近
    if (rng.chance(0.3)) x += rng.chance(0.5) ? 1 : -1;
    if (Math.abs(x - gateX) > 4) x += x > gateX ? -1 : 1;
    if (x < 2) x = 2;
    if (x > width - 3) x = width - 3;
    setTile(grid, x, y, 'road', (cur) => cur === 'grass');
    setTile(grid, x + 1, y, 'road', (cur) => cur === 'grass');
    path.push({ x, y });
  }
  return path;
}

/** 正弦蜿蜒的河流，并在沿岸生成牛轭水洼 */
function carveWindingRiver(grid: TileType[][], width: number, height: number, rng: Rng): number {
  const riverY = Math.floor(height * rng.range(0.42, 0.54));
  const phase = rng.range(0, Math.PI * 2);
  const amplitude = rng.range(2, 4);
  const frequency = rng.range(0.18, 0.3);

  for (let x = 1; x < width - 1; x++) {
    const waveY = Math.floor(riverY + Math.sin(x * frequency + phase) * amplitude);
    for (let dy = -1; dy <= 1; dy++) {
      grid[waveY + dy][x] = 'water';
    }
  }

  // 牛轭湖/池塘：贴着河岸随机加宽
  const pondCount = rng.int(1, 4);
  for (let i = 0; i < pondCount; i++) {
    const px = rng.int(4, width - 4);
    const waveY = Math.floor(riverY + Math.sin(px * frequency + phase) * amplitude);
    const side = rng.chance(0.5) ? -1 : 1;
    const size = rng.weightedSize(2, 5);
    for (let s = 0; s < size; s++) {
      const ox = px + rng.int(-2, 3);
      const oy = waveY + side * rng.int(1, 3) + rng.int(-1, 2);
      setTile(grid, ox, oy, 'water', (cur) => cur === 'grass');
    }
  }
  return riverY;
}

/** 主路与河交汇处：被河水淹没的路面替换为木桥 */
function buildBridge(grid: TileType[][], roadPath: Array<{ x: number; y: number }>): void {
  for (const p of roadPath) {
    for (let dx = 0; dx <= 1; dx++) {
      if (getTileAt(grid, p.x + dx, p.y) === 'water') {
        grid[p.y][p.x + dx] = 'bridge';
      }
    }
  }
}

/** 数量与位置随机的远古废墟，返回废墟矩形 */
function buildRandomRuins(
  grid: TileType[][],
  width: number,
  height: number,
  rng: Rng
): Array<{ x: number; y: number; w: number; h: number }> {
  const ruins: Array<{ x: number; y: number; w: number; h: number }> = [];
  const count = rng.int(2, 4);
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const w = rng.int(8, 13);
      const h = rng.int(7, 11);
      const x = rng.int(3, width - w - 3);
      const y = rng.int(4, height - h - 8);
      if (!areaAllGrass(grid, x, y, w, h)) continue;
      buildRuins(grid, x, y, w, h, rng);
      ruins.push({ x, y, w, h });
      break;
    }
  }
  return ruins;
}

function buildRuins(grid: TileType[][], startX: number, startY: number, w: number, h: number, rng: Rng): void {
  fillRect(grid, { x: startX, y: startY, w, h }, 'floor');
  // 四角断柱（随机残缺）
  const corners = [
    { x: startX, y: startY }, { x: startX + w - 1, y: startY },
    { x: startX, y: startY + h - 1 }, { x: startX + w - 1, y: startY + h - 1 },
  ];
  for (const c of corners) {
    if (rng.chance(0.75)) grid[c.y][c.x] = 'wall';
  }
  if (rng.chance(0.6)) {
    grid[startY + Math.floor(h / 2)][startX + Math.floor(w / 2)] = 'chest';
  }
}

/** 猎人小木屋（1-2 座，避开河流与道路） */
function buildHunterCabins(
  grid: TileType[][],
  width: number,
  height: number,
  roadPath: Array<{ x: number; y: number }>,
  rng: Rng
): void {
  const count = rng.int(1, 3);
  const roadXs = new Set(roadPath.map((p) => `${p.x},${p.y}`));
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const w = rng.int(5, 7);
      const h = rng.int(4, 6);
      const x = rng.int(3, width - w - 3);
      const y = rng.int(4, height - h - 4);
      if (!areaAllGrass(grid, x, y, w, h)) continue;
      if (nearRoad(x, y, w, h, roadXs)) continue;
      buildCabin(grid, x, y, w, h, rng);
      break;
    }
  }
}

function buildCabin(grid: TileType[][], startX: number, startY: number, w: number, h: number, rng: Rng): void {
  for (let y = startY; y < startY + h; y++) {
    for (let x = startX; x < startX + w; x++) {
      const isEdge = y === startY || y === startY + h - 1 || x === startX || x === startX + w - 1;
      grid[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  grid[startY + h - 1][startX + Math.floor(w / 2)] = 'door';
  if (rng.chance(0.6)) grid[startY + h][startX + Math.floor(w / 2) + 1] = 'barrel';
}

/** 瞭望塔：贴着某段路的高层地标 */
function placeWatchtower(
  grid: TileType[][],
  width: number,
  height: number,
  roadPath: Array<{ x: number; y: number }>,
  rng: Rng
): void {
  for (let attempt = 0; attempt < 20; attempt++) {
    const p = rng.pick(roadPath);
    const tx = p.x + (rng.chance(0.5) ? 3 : -3);
    const ty = p.y + rng.int(-3, 4);
    if (tx < 2 || tx >= width - 2 || ty < 2 || ty >= height - 2) continue;
    if (getTileAt(grid, tx, ty) === 'grass') {
      grid[ty][tx] = 'tower';
      if (rng.chance(0.5)) grid[ty][tx + 1] = 'barrel';
      return;
    }
  }
}

/** 怪物营地、神龛与废墟补充宝箱 */
function placeWildernessProps(
  grid: TileType[][],
  width: number,
  height: number,
  roadPath: Array<{ x: number; y: number }>,
  ruins: Array<{ x: number; y: number; w: number; h: number }>,
  rng: Rng
): void {
  const campCount = rng.int(2, 4);
  for (let i = 0; i < campCount; i++) {
    const p = rng.pick(roadPath);
    const sx = p.x + rng.int(-3, 4);
    const sy = p.y + rng.int(-2, 3);
    if (getTileAt(grid, sx, sy) === 'grass') {
      grid[sy][sx] = 'spawner';
      if (getTileAt(grid, sx + 1, sy) === 'grass') grid[sy][sx + 1] = 'chest';
    }
  }

  for (const r of ruins) {
    if (rng.chance(0.5)) {
      const cx = r.x + rng.int(2, r.w - 2);
      const cy = r.y + rng.int(2, r.h - 2);
      setTile(grid, cx, cy, 'chest', (cur) => cur === 'floor');
    }
  }

  const shrineCount = rng.int(1, 3);
  for (let i = 0; i < shrineCount; i++) {
    const sx = rng.int(4, width - 4);
    const sy = rng.int(4, height - 4);
    setTile(grid, sx, sy, 'shrine', (cur) => cur === 'grass');
  }
}

function nearRoad(x: number, y: number, w: number, h: number, roadXs: Set<string>): boolean {
  for (let iy = y - 1; iy <= y + h; iy++) {
    for (let ix = x - 1; ix <= x + w; ix++) {
      if (roadXs.has(`${ix},${iy}`)) return true;
    }
  }
  return false;
}

function areaAllGrass(grid: TileType[][], x: number, y: number, w: number, h: number): boolean {
  for (let iy = y; iy < y + h; iy++) {
    for (let ix = x; ix < x + w; ix++) {
      if (getTileAt(grid, ix, iy) !== 'grass') return false;
    }
  }
  return true;
}

/** 散布层所需的楼层上下文（仅 tiles 与出生点元信息） */
function scatterContext(grid: TileType[][], width: number, height: number, gateX: number): DungeonFloor {
  return {
    floorNumber: 0, theme: 'caves', zoneType: 'overworld', zoneName: '', isIndoor: false,
    weather: 'rain', width, height, tiles: grid, rooms: [],
    spawnX: gateX, spawnY: 3, exitX: gateX, exitY: height - 2,
  };
}

function assembleFloor(grid: TileType[][], width: number, height: number, gateX: number): DungeonFloor {
  const rooms: DungeonRoom[] = [
    { x: gateX - 3, y: 3, w: 6, h: 6, type: 'spawn', cleared: true },
    { x: gateX - 4, y: height - 10, w: 8, h: 8, type: 'normal', cleared: false },
  ];
  return {
    floorNumber: 0,
    theme: 'caves',
    zoneType: 'overworld',
    zoneName: '🌲 迷雾落日荒原大地图 (Sunset Wilds)',
    isIndoor: false,
    weather: 'rain',
    description: '辽阔辽远的落日荒原。河流蜿蜒，森林与废墟间潜伏着怪物巡逻队，通往深邃地牢古墓。',
    width,
    height,
    tiles: grid,
    rooms,
    spawnX: gateX,
    spawnY: 3,
    exitX: gateX,
    exitY: height - 2,
    portalTownX: gateX,
    portalTownY: 1,
    portalDungeonX: gateX,
    portalDungeonY: height - 2,
  };
}
