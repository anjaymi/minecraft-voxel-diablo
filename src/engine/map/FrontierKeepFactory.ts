import { DungeonFloor, DungeonRoom, TileType } from '../../types';
import { createGrid, fillRect, setTile, getTileAt, strokeRect } from './TileGrid';
import { Rng } from './Rng';
import { scatterTerrain } from './TerrainScatter';

/**
 * FrontierKeepFactory — 前哨城塞（Frontier Keep）。
 *
 * 翡翠圣城在荒远边境的军事前哨：石墙营垒 + 中央主堡 +
 * 演武场 + 马厩货栈。常驻少量卫戍 NPC，是深入六大生态区
 * 的远征补给站（治疗/住宿/传闻）。
 */

const KEEP_SIZE = 42;

export function generateFrontierKeep(): DungeonFloor {
  const size = KEEP_SIZE;
  const rng = new Rng();
  const grid = createGrid(size, size, 'grass');
  strokeRect(grid, { x: 0, y: 0, w: size, h: size }, 'town_wall');

  // 内城墙（南门开口）
  strokeRect(grid, { x: 4, y: 4, w: size - 8, h: size - 8 }, 'town_wall');
  const innerGate = Math.floor(size / 2);
  grid[size - 5][innerGate] = 'road';
  grid[size - 4][innerGate] = 'road';

  // 南外门：通往荒原（town_gate）
  grid[size - 1][innerGate] = 'town_gate';
  grid[size - 1][innerGate - 1] = 'town_gate';
  // 主路：南门 → 内门 → 中央校场
  for (let y = size - 2; y >= 4; y--) {
    setTile(grid, innerGate, y, 'road', (cur) => cur !== 'wall' && cur !== 'town_wall');
  }
  // 东西横路
  for (let x = 5; x < size - 5; x++) {
    setTile(grid, x, innerGate, 'road', (cur) => cur !== 'wall');
  }

  // 中央主堡（议事塔）：石砌方堡 + 门
  buildKeepTower(grid, innerGate, Math.floor(size / 2) - 6, rng);
  // 西北演武场（木桩环绕）
  buildTrainingYard(grid, 8, 8, rng);
  // 东北马厩货栈
  buildStables(grid, size - 14, 8, rng);
  // 西南兵营
  buildBarracks(grid, 8, size - 14, rng);

  // 双生态传送门（东西两侧远处）
  placeKeepGates(grid, size, rng, innerGate);

  // 火盆照明
  for (let y = 8; y < size - 8; y += 9) {
    setTile(grid, 6, y, 'lantern', (cur) => cur === 'grass');
    setTile(grid, size - 7, y, 'lantern', (cur) => cur === 'grass');
  }

  const floor: DungeonFloor = {
    floorNumber: 0,
    theme: 'caves',
    zoneType: 'keep',
    zoneName: '🏰 前哨城塞 (Frontier Keep)',
    description: '翡翠圣城设在边境的军事前哨。戍卫在此整备远征行装，是深入六大荒野的最后一站。',
    isIndoor: false,
    weather: 'clear',
    width: size,
    height: size,
    tiles: grid,
    rooms: [] as DungeonRoom[],
    spawnX: innerGate,
    spawnY: size - 7,
    exitX: innerGate,
    exitY: size - 2,
    portalTownX: innerGate,
    portalTownY: size - 1,
  };
  scatterTerrain(floor, 'town', rng);
  return floor;
}

/** 主堡：石塔 + 门 + 塔顶旗帜 */
function buildKeepTower(grid: TileType[][], cx: number, cy: number, rng: Rng): void {
  const w = 9;
  const h = 8;
  const x0 = cx - Math.floor(w / 2);
  const y0 = cy - 2;
  fillRect(grid, { x: x0, y: y0, w, h }, 'floor');
  strokeRect(grid, { x: x0, y: y0, w, h }, 'building');
  grid[y0 + h - 1][cx] = 'door';
  // 堡内指挥台
  setTile(grid, cx, y0 + 1, 'shrine', (cur) => cur === 'floor');
  void rng;
}

/** 演武场：木桩阵 */
function buildTrainingYard(grid: TileType[][], x0: number, y0: number, rng: Rng): void {
  fillRect(grid, { x: x0, y: y0, w: 9, h: 7 }, 'road');
  for (let i = 0; i < 5; i++) {
    const px = x0 + 1 + ((i * 2) % 8);
    const py = y0 + 1 + (i % 2) * 3;
    setTile(grid, px, py, 'pillar', (cur) => cur === 'road' || cur === 'grass');
  }
  void rng;
}

/** 马厩货栈：木棚 + 木桶 */
function buildStables(grid: TileType[][], x0: number, y0: number, rng: Rng): void {
  for (let y = y0; y < y0 + 6; y++) {
    for (let x = x0; x < x0 + 10; x++) {
      const isEdge = y === y0 || y === y0 + 5 || x === x0 || x === x0 + 9;
      grid[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  grid[y0 + 5][x0 + 5] = 'door';
  setTile(grid, x0 + 2, y0 + 2, 'barrel', (cur) => cur === 'floor');
  setTile(grid, x0 + 5, y0 + 2, 'market_stall', (cur) => cur === 'floor');
  setTile(grid, x0 + 6, y0 + 4, 'counter', (cur) => cur === 'floor');
  if (rng.chance(0.6)) setTile(grid, x0 + 7, y0 + 3, 'chest', (cur) => cur === 'floor');
}

/** 兵营：石屋 */
function buildBarracks(grid: TileType[][], x0: number, y0: number, rng: Rng): void {
  for (let y = y0; y < y0 + 6; y++) {
    for (let x = x0; x < x0 + 9; x++) {
      const isEdge = y === y0 || y === y0 + 5 || x === x0 || x === x0 + 8;
      grid[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  grid[y0 + 5][x0 + 4] = 'door';
  setTile(grid, x0 + 2, y0 + 2, 'urn', (cur) => cur === 'floor');
}

/** 双生态传送门：东西两侧 */
function placeKeepGates(grid: TileType[][], size: number, rng: Rng, cy: number): void {
  const spots = [
    { x: 6, y: Math.max(6, cy - 8) },
    { x: size - 7, y: Math.min(size - 7, cy + 8) },
  ];
  for (const s of spots) {
    setTile(grid, s.x, s.y, 'keep_gate', (cur) => cur === 'grass' || cur === 'road');
  }
  void rng;
  void getTileAt;
}
