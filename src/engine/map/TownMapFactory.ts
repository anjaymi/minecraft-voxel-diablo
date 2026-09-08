import { DungeonFloor, DungeonRoom, TileType } from '../../types';
import { createGrid, fillRect, strokeRect, setTile, getTileAt } from './TileGrid';
import { Rng } from './Rng';
import { scatterTerrain } from './TerrainScatter';

/**
 * TownMapFactory — 翡翠圣城（安全区主城）地图工厂。
 *
 * 城市布局：十字主街 + 中央喷泉广场 + 四象限功能建筑，
 * 南门通野外大地图，北门通地牢古墓传送拱门。
 * 随机化要素：水井、行道树、街角瞭望塔、花园花丛与地表散布。
 */

const TOWN_WIDTH = 42;
const TOWN_HEIGHT = 42;

export function generateTownMap(): DungeonFloor {
  const grid = createGrid(TOWN_WIDTH, TOWN_HEIGHT, 'grass');
  const width = TOWN_WIDTH;
  const height = TOWN_HEIGHT;
  const rng = new Rng();

  // 外圈 fortified 城墙
  strokeRect(grid, { x: 0, y: 0, w: width, h: height }, 'town_wall');

  // 南门 -> 野外大地图；北门 -> 地牢拱门
  const overworldGateX = Math.floor(width / 2);
  const overworldGateY = height - 1;
  grid[overworldGateY][overworldGateX] = 'town_gate';
  grid[overworldGateY][overworldGateX - 1] = 'town_gate';

  const dungeonGateX = Math.floor(width / 2);
  const dungeonGateY = 0;
  grid[dungeonGateY][dungeonGateX] = 'dungeon_gate';
  grid[dungeonGateY][dungeonGateX - 1] = 'dungeon_gate';

  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);

  carveAvenues(grid, midX, midY, width, height);
  buildGrandPlaza(grid, midX, midY);
  buildQuadrantBuildings(grid, width, height);
  furnishTownBuildings(grid, rng);
  buildInn(grid, width, height);
  buildTavern(grid, width, height, rng);
  buildMarketStalls(grid, midX, midY, rng);
  scatterTownDecor(grid, width, height, midX, midY);
  placeTownLandmarks(grid, width, height, midX, midY, rng);

  const rooms: DungeonRoom[] = [
    { x: midX - 4, y: midY - 4, w: 9, h: 9, type: 'town_square', cleared: true },
    { x: 5, y: 5, w: 8, h: 7, type: 'forge', cleared: true },
    { x: width - 13, y: 5, w: 8, h: 7, type: 'alchemy', cleared: true },
  ];

  const floor: DungeonFloor = {
    floorNumber: 0,
    theme: 'caves',
    zoneType: 'town',
    zoneName: '🏛️ 翡翠圣城 (Emerald Haven Citadel)',
    isIndoor: false,
    weather: 'clear',
    description: '繁荣祥和的绿宝石城邦营地。在此整顿行囊、强化装备，或前往落日大地图与古老地牢。',
    width,
    height,
    tiles: grid,
    rooms,
    spawnX: midX,
    spawnY: midY + 2, // 中央喷泉旁
    exitX: overworldGateX,
    exitY: overworldGateY - 1,
    portalOverworldX: overworldGateX,
    portalOverworldY: overworldGateY - 1,
    portalDungeonX: dungeonGateX,
    portalDungeonY: dungeonGateY + 1,
  };
  scatterTerrain(floor, 'town', rng);
  return floor;
}

/** 城市地标：广场角水井、街角瞭望塔、林荫道行道树 */
function placeTownLandmarks(
  grid: TileType[][],
  width: number,
  height: number,
  midX: number,
  midY: number,
  rng: Rng
): void {
  // 广场四角随机两口石砌水井
  const corners = [
    { x: midX - 5, y: midY - 5 }, { x: midX + 5, y: midY - 5 },
    { x: midX - 5, y: midY + 5 }, { x: midX + 5, y: midY + 5 },
  ];
  const shuffled = [...corners].sort(() => rng.next() - 0.5);
  for (const c of shuffled.slice(0, 2)) {
    setTile(grid, c.x, c.y, 'well', (cur) => cur === 'grass' || cur === 'bush');
  }

  // 街角瞭望塔（随机一个城墙内侧角）
  const towerSpots = [
    { x: 2, y: 2 }, { x: width - 3, y: 2 },
    { x: 2, y: height - 3 }, { x: width - 3, y: height - 3 },
  ];
  const tower = rng.pick(towerSpots);
  setTile(grid, tower.x, tower.y, 'tower', (cur) => cur === 'grass');

  // 林荫道行道树：大道两侧对称，带随机间距
  for (let y = 5; y < height - 5; y += rng.int(4, 6)) {
    setTile(grid, midX - 3, y, 'tree', (cur) => cur === 'grass');
    setTile(grid, midX + 3, y, 'tree', (cur) => cur === 'grass');
  }
  for (let x = 5; x < width - 5; x += rng.int(5, 7)) {
    setTile(grid, x, midY - 3, 'tree', (cur) => cur === 'grass');
    setTile(grid, x, midY + 3, 'tree', (cur) => cur === 'grass');
  }
}

/** 十字主街（宽3） */
function carveAvenues(grid: TileType[][], midX: number, midY: number, width: number, height: number): void {
  for (let y = 1; y < height - 1; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      grid[y][midX + dx] = 'road';
    }
  }
  for (let x = 1; x < width - 1; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      grid[midY + dy][x] = 'road';
    }
  }
}

/** 中央大广场（9x9）+ 喷泉 + 广场灯柱与街灯 */
function buildGrandPlaza(grid: TileType[][], midX: number, midY: number): void {
  fillRect(grid, { x: midX - 4, y: midY - 4, w: 9, h: 9 }, 'road');
  grid[midY][midX] = 'fountain';

  grid[midY - 3][midX - 3] = 'lantern';
  grid[midY - 3][midX + 3] = 'lantern';
  grid[midY + 3][midX - 3] = 'lantern';
  grid[midY + 3][midX + 3] = 'lantern';

  for (let y = 6; y < TOWN_HEIGHT - 6; y += 7) {
    grid[y][midX - 2] = 'lantern';
    grid[y][midX + 2] = 'lantern';
  }
}

/** 四象限功能建筑：铁匠铺 / 炼金公会 / 骑士营房 / 冒险者公会 */
function buildQuadrantBuildings(grid: TileType[][], width: number, height: number): void {
  buildTownHouse(grid, 5, 5, 8, 7);
  grid[8][9] = 'chest'; // 铁匠铺的锻造补给箱

  buildTownHouse(grid, width - 13, 5, 8, 7);
  grid[8][width - 10] = 'shrine'; // 附魔台神龛

  buildTownHouse(grid, 5, height - 13, 9, 7);
  grid[height - 9][9] = 'chest';

  buildTownHouse(grid, width - 14, height - 13, 9, 7);
  grid[height - 9][width - 10] = 'chest';
}

/** 城内装饰性可破坏物与灌木 */
function scatterTownDecor(
  grid: TileType[][],
  width: number,
  height: number,
  midX: number,
  midY: number
): void {
  grid[13][6] = 'barrel';
  grid[13][7] = 'barrel';
  grid[13][width - 8] = 'barrel';
  grid[height - 14][8] = 'barrel';
  grid[midY - 5][midX - 5] = 'bush';
  grid[midY - 5][midX + 5] = 'bush';
  grid[midY + 5][midX - 5] = 'bush';
  grid[midY + 5][midX + 5] = 'bush';
}

/** 通用城镇房屋：墙体围合 + 底边中央开门 */
function buildTownHouse(tiles: TileType[][], startX: number, startY: number, w: number, h: number): void {
  for (let y = startY; y < startY + h; y++) {
    for (let x = startX; x < startX + w; x++) {
      const isEdge = y === startY || y === startY + h - 1 || x === startX || x === startX + w - 1;
      tiles[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  tiles[startY + h - 1][startX + Math.floor(w / 2)] = 'door';
}

/** 建筑内容物：锻造铺摆柜台铁砧、神秘公会摆柜台药架 */
function furnishTownBuildings(grid: TileType[][], rng: Rng): void {
  // 锻造铺 (5,5,8,7)：柜台 + 桶堆
  setTile(grid, 7, 7, 'counter', (cur) => cur === 'floor');
  setTile(grid, 9, 7, 'barrel', (cur) => cur === 'floor');
  setTile(grid, 10, 8, 'urn', (cur) => cur === 'floor');
  // 神秘公会 (width-13,5)：柜台 + 神秘坛
  setTile(grid, 34, 7, 'counter', (cur) => cur === 'floor');
  setTile(grid, 32, 8, 'shrine', (cur) => cur === 'floor');
  setTile(grid, 35, 9, 'urn', (cur) => cur === 'floor');
  void rng;
}

/** 旅馆建筑：翡翠之月旅店（床铺房间 + 前台柜台） */
function buildInn(grid: TileType[][], width: number, height: number): void {
  // 旅店在西南象限（原骑士营房 5, height-13, 9, 7 的位置重造）
  const x0 = 5;
  const y0 = height - 13;
  const w = 9;
  const h = 7;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const isEdge = y === y0 || y === y0 + h - 1 || x === x0 || x === x0 + w - 1;
      grid[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  grid[y0 + h - 1][x0 + Math.floor(w / 2)] = 'door';
  // 前台柜台（门口内侧）
  setTile(grid, x0 + 4, y0 + h - 2, 'counter', (cur) => cur === 'floor');
  // 两间客房：各两张床（相邻成对，渲染端连成双人床）
  for (const [bx, by] of [[x0 + 2, y0 + 2], [x0 + 3, y0 + 2], [x0 + 6, y0 + 2], [x0 + 7, y0 + 2]] as const) {
    setTile(grid, bx, by, 'bed', (cur) => cur === 'floor');
  }
  // 客房之间：烛光小桌取代生硬隔墙，背墙两侧摆绿植
  setTile(grid, x0 + 4, y0 + 3, 'table', (cur) => cur === 'floor');
  setTile(grid, x0 + 1, y0 + 1, 'urn', (cur) => cur === 'floor');
  setTile(grid, x0 + 7, y0 + 1, 'urn', (cur) => cur === 'floor');
}

/** 酒馆建筑：议事厅旁的欢闹酒馆（桌椅 + 酒桶） */
function buildTavern(grid: TileType[][], width: number, height: number, rng: Rng): void {
  // 东南象限（原冒险者公会 width-14, height-13 重造）
  const x0 = width - 14;
  const y0 = height - 13;
  const w = 9;
  const h = 7;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const isEdge = y === y0 || y === y0 + h - 1 || x === x0 || x === x0 + w - 1;
      grid[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  grid[y0 + h - 1][x0 + Math.floor(w / 2)] = 'door';
  // 吧台（L 型柜台）+ 酒桶墙
  for (let x = x0 + 2; x <= x0 + 6; x++) {
    setTile(grid, x, y0 + 2, 'counter', (cur) => cur === 'floor');
  }
  setTile(grid, x0 + 1, y0 + 2, 'barrel', (cur) => cur === 'floor');
  setTile(grid, x0 + 1, y0 + 3, 'barrel', (cur) => cur === 'floor');
  // 散桌
  for (const [tx, ty] of [[x0 + 3, y0 + 4], [x0 + 6, y0 + 4], [x0 + 4, y0 + 5]] as const) {
    if (rng.chance(0.85)) setTile(grid, tx, ty, 'table', (cur) => cur === 'floor');
  }
}

/** 集市摊位：广场周边 2-3 个货摊（行商与商贩的营业点） */
function buildMarketStalls(grid: TileType[][], midX: number, midY: number, rng: Rng): void {
  // 摊位 = 摊棚顶（market_stall）+ 货箱围边
  const spots = [
    { x: midX - 6, y: midY + 3 },
    { x: midX + 5, y: midY + 3 },
  ];
  for (const spot of spots) {
    setTile(grid, spot.x, spot.y, 'market_stall', (cur) => cur === 'grass' || cur === 'road');
    // 摊前货箱
    if (rng.chance(0.7)) setTile(grid, spot.x + 1, spot.y + 1, 'barrel', (cur) => cur === 'grass');
    if (rng.chance(0.5)) setTile(grid, spot.x - 1, spot.y + 1, 'urn', (cur) => cur === 'grass');
  }
}
