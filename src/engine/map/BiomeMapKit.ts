import { DungeonFloor, DungeonRoom, TileType, WeatherType, ZoneType } from '../../types';
import { createGrid, strokeRect, setTile, getTileAt } from './TileGrid';
import { Rng } from './Rng';
import { ScatterZone, scatterTerrain } from './TerrainScatter';

/**
 * BiomeMapKit — 生态探索区地图公共脚手架。
 *
 * 六大新地图（frost/volcano/mushroom/desert/swamp/cursed）共用的
 * 底图创建、道路铺设、返回门与随机生态传送门、楼层总装工具。
 * 各工厂只需实现专属地貌与地标。
 */

export interface BiomeMeta {
  zoneType: ZoneType;
  scatterKey: ScatterZone;
  baseTile: TileType;
  zoneName: string;
  description: string;
  weather: WeatherType;
}

export interface BiomeCanvas {
  grid: TileType[][];
  width: number;
  height: number;
  rng: Rng;
  meta: BiomeMeta;
  /** 主路路径点（供地标与营地选址） */
  roadPath: Array<{ x: number; y: number }>;
  gateX: number;
  /** 面积缩放系数（相对 50×50 标准图），用于地标数量扩容 */
  scale: number;
  /** 巨兽巢穴中心（由工厂放置后记录，引擎据此生成区域首领） */
  lair?: { x: number; y: number; bossId: string };
}

/** 创建带边界与双向道路的生态区底图（默认 80×80 大地图） */
export function createBiomeCanvas(meta: BiomeMeta, size: number = 80): BiomeCanvas {
  const rng = new Rng();
  const grid = createGrid(size, size, meta.baseTile);
  strokeRect(grid, { x: 0, y: 0, w: size, h: size }, 'wall');

  const gateX = Math.floor(size / 2) + rng.int(-4, 5);
  // 北侧返回圣城之门
  grid[0][gateX] = 'town_gate';
  grid[0][gateX - 1] = 'town_gate';

  const roadPath = carveRoad(grid, size, gateX, rng);
  const scale = Math.round(((size / 50) ** 2) * 10) / 10;
  return { grid, width: size, height: size, rng, meta, roadPath, gateX, scale };
}

/** 按地图面积缩放数量（大地图地标/营地自动扩容） */
export function scaledCount(canvas: BiomeCanvas, base: number): number {
  return Math.max(1, Math.round(base * canvas.scale));
}

/** 边境传送门：通往前哨城塞（每张生态大图一座；带邻域回退扫描） */
export function placeKeepGate(canvas: BiomeCanvas): void {
  const { grid, width, height, rng, meta } = canvas;
  for (let attempt = 0; attempt < 40; attempt++) {
    const gx = rng.chance(0.5) ? rng.int(4, 10) : rng.int(width - 10, width - 4);
    const gy = rng.int(6, height - 6);
    if (getTileAt(grid, gx, gy) === meta.baseTile) {
      grid[gy][gx] = 'keep_gate';
      return;
    }
  }
  // 回退：全图扫描任意基础地面
  for (let y = 5; y < height - 5; y++) {
    for (let x = 4; x < width - 4; x++) {
      if (getTileAt(grid, x, y) === meta.baseTile) {
        grid[y][x] = 'keep_gate';
        return;
      }
    }
  }
}

/** 巨兽竞技场：骨环围栏（南口开放）+ 中心宝箱，返回刷新点（生态区与其他区域复用） */
export function carveBossArena(
  grid: TileType[][],
  width: number,
  height: number,
  rng: Rng,
  baseTile: TileType
): { x: number; y: number } | null {
  const radius = 6;

  for (let attempt = 0; attempt < 25; attempt++) {
    const cx = rng.int(10, width - 10);
    const cy = rng.int(12, height - 12);
    if (getTileAt(grid, cx, cy) !== baseTile) continue;

    // 骨环竞技场（骨桩围栏，南口开放）；水域/地物处允许缺桩，但整体需成环
    const placed: Array<[number, number]> = [];
    for (let deg = 0; deg < 360; deg += 8) {
      if (deg > 70 && deg < 110) continue; // 南口
      const rad = (deg * Math.PI) / 180;
      const tx = Math.round(cx + Math.cos(rad) * radius);
      const ty = Math.round(cy + Math.sin(rad) * radius * 0.62);
      if (setTile(grid, tx, ty, 'bone_pile', (cur) => cur === baseTile)) placed.push([tx, ty]);
    }
    // 巢穴中心宝箱（必落）
    setTile(grid, cx, cy, 'chest');

    // 成环率不足则回滚重试，避免零散骨桩破坏竞技场轮廓
    // （椭圆 12×7.4 的整数网格边界至多 ~26 格，18 格以上即成型）
    if (placed.length >= 18) return { x: cx, y: cy };
    for (const [tx, ty] of placed) grid[ty][tx] = baseTile;
    grid[cy][cx] = baseTile;
  }
  return null;
}

/** 巨兽巢穴：骨环竞技场 + 记录首领刷新点（中心重试，保证宝箱落地） */
export function placeBehemothLair(canvas: BiomeCanvas, bossId: string): void {
  const spot = carveBossArena(canvas.grid, canvas.width, canvas.height, canvas.rng, canvas.meta.baseTile);
  if (spot) canvas.lair = { x: spot.x, y: spot.y, bossId };
}

/** 简易弯曲主路（北→南） */
function carveRoad(grid: TileType[][], size: number, gateX: number, rng: Rng): Array<{ x: number; y: number }> {
  const path: Array<{ x: number; y: number }> = [];
  let x = gateX;
  for (let y = 1; y < size - 1; y++) {
    if (rng.chance(0.25)) x += rng.chance(0.5) ? 1 : -1;
    if (Math.abs(x - gateX) > 3) x += x > gateX ? -1 : 1;
    if (x < 2) x = 2;
    if (x > size - 3) x = size - 3;
    setTile(grid, x, y, 'road', (cur) => cur !== 'wall');
    path.push({ x, y });
  }
  return path;
}

/** 沿路布设随机生态传送门（通往其他未知生态区；大地图自动加密） */
export function placeBiomeGates(
  canvasOrGrid: BiomeCanvas | TileType[][],
  widthOrCount: number | number = 2,
  height?: number,
  baseTile?: TileType,
  roadPath?: Array<{ x: number; y: number }>,
  rng?: Rng,
  count: number = 2
): void {
  // 支持两种签名：(canvas, count?) 或 (grid, width, height, baseTile, roadPath, rng, count)
  const isCanvas = !Array.isArray(canvasOrGrid);
  const grid = isCanvas ? (canvasOrGrid as BiomeCanvas).grid : (canvasOrGrid as TileType[][]);
  const w = isCanvas ? (canvasOrGrid as BiomeCanvas).width : (widthOrCount as number);
  const h = isCanvas ? (canvasOrGrid as BiomeCanvas).height : (height as number);
  const base = isCanvas ? (canvasOrGrid as BiomeCanvas).meta.baseTile : (baseTile as TileType);
  const path = isCanvas ? (canvasOrGrid as BiomeCanvas).roadPath : (roadPath as Array<{ x: number; y: number }>);
  const r = isCanvas ? (canvasOrGrid as BiomeCanvas).rng : (rng as Rng);
  const n = isCanvas ? scaledCount(canvasOrGrid as BiomeCanvas, widthOrCount as number) : count;
  placeBiomeGatesAt(grid, w, h, base, path, r, n);
}

/** 纯参数版本：任意底图都可布设生态门 */
export function placeBiomeGatesAt(
  grid: TileType[][],
  width: number,
  height: number,
  baseTile: TileType,
  roadPath: Array<{ x: number; y: number }>,
  rng: Rng,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 16; attempt++) {
      const p = rng.pick(roadPath);
      const gx = p.x + (rng.chance(0.5) ? 2 : -3);
      const gy = p.y + rng.int(-3, 4);
      if (gx < 2 || gx >= width - 2 || gy < 3 || gy >= height - 3) continue;
      if (getTileAt(grid, gx, gy) === baseTile) {
        grid[gy][gx] = 'biome_gate';
        break;
      }
    }
  }
}

/** 沿路布设怪物营地（刷怪巢 + 宝箱；数量随地图面积扩容） */
export function placeBiomeCamps(canvas: BiomeCanvas, min: number, max: number): void {
  const { grid, roadPath, rng } = canvas;
  const count = scaledCount(canvas, rng.int(min, max + 1));
  for (let i = 0; i < count; i++) {
    const p = rng.pick(roadPath);
    const sx = p.x + rng.int(-3, 4);
    const sy = p.y + rng.int(-2, 3);
    if (getTileAt(grid, sx, sy) === canvas.meta.baseTile) {
      grid[sy][sx] = 'spawner';
      if (getTileAt(grid, sx + 1, sy) === canvas.meta.baseTile) grid[sy][sx + 1] = 'chest';
    }
  }
}

/** 在基础地面上随机布设神龛（数量随地图面积扩容） */
export function placeBiomeShrines(canvas: BiomeCanvas, min: number, max: number): void {
  const { grid, width, height, rng } = canvas;
  const count = scaledCount(canvas, rng.int(min, max + 1));
  for (let i = 0; i < count; i++) {
    const sx = rng.int(4, width - 4);
    const sy = rng.int(4, height - 4);
    setTile(grid, sx, sy, 'shrine', (cur) => cur === canvas.meta.baseTile);
  }
}

/** 条件允许时在区域内随机找一块完整基础地面矩形 */
export function findClearArea(
  canvas: BiomeCanvas,
  w: number,
  h: number,
  attempts: number = 12
): { x: number; y: number; w: number; h: number } | null {
  const { grid, width, height, rng } = canvas;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const x = rng.int(3, width - w - 3);
    const y = rng.int(4, height - h - 4);
    let clear = true;
    for (let iy = y; iy < y + h && clear; iy++) {
      for (let ix = x; ix < x + w && clear; ix++) {
        if (grid[iy][ix] !== canvas.meta.baseTile) clear = false;
      }
    }
    if (clear) return { x, y, w, h };
  }
  return null;
}

/** 总装生态区楼层（散布层 + 标准元数据 + 巨兽巢穴记录） */
export function assembleBiomeFloor(canvas: BiomeCanvas): DungeonFloor {
  const { grid, width, height, meta, gateX, lair } = canvas;
  const floor: DungeonFloor = {
    floorNumber: 0,
    theme: 'caves',
    zoneType: meta.zoneType,
    zoneName: meta.zoneName,
    isIndoor: false,
    weather: meta.weather,
    description: meta.description,
    width,
    height,
    tiles: grid,
    rooms: [] as DungeonRoom[],
    spawnX: gateX,
    spawnY: 3,
    exitX: gateX,
    exitY: height - 2,
    portalTownX: gateX,
    portalTownY: 1,
    ...(lair ? { lairX: lair.x, lairY: lair.y, lairBoss: lair.bossId } : {}),
  };
  scatterTerrain(floor, meta.scatterKey, canvas.rng);
  return floor;
}
