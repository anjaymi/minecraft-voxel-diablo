import { DungeonRoom, TileType } from '../../types';
import { fillRect, getTileAt, hasNeighbor8Tile, GridRect } from './TileGrid';

/**
 * DungeonCarver — 地牢雕刻原子工序。
 *
 * 房间规划 → 雕刻地板 → 走廊连接 → 岩壁封边，
 * 每道工序独立可复用，最终由 DungeonMapFactory 组装。
 */

export interface CarverOptions {
  width: number;
  height: number;
  numRooms: number;
  /** 房间短边尺寸范围 [min, max] */
  roomSize?: [number, number];
  /** 尝试放置的最大次数 */
  maxAttempts?: number;
}

const ROOM_TYPE_SEQUENCE: DungeonRoom['type'][] = ['spawn', 'boss', 'treasure', 'shrine'];

/** 在空白 void 画布上规划互不重叠的房间（含类型排序） */
export function planRooms(options: CarverOptions): DungeonRoom[] {
  const { width, height, numRooms } = options;
  const [minSize, maxSize] = options.roomSize ?? [6, 10];
  const maxAttempts = options.maxAttempts ?? 40;
  const rooms: DungeonRoom[] = [];

  for (let attempt = 0; attempt < maxAttempts && rooms.length < numRooms; attempt++) {
    const w = randInt(minSize, maxSize + 1);
    const h = randInt(minSize, maxSize + 1);
    const x = randInt(2, width - w - 2);
    const y = randInt(2, height - h - 2);

    if (rooms.some((r) => rectsWithGap(r, { x, y, w, h }))) continue;

    rooms.push({
      x,
      y,
      w,
      h,
      type: ROOM_TYPE_SEQUENCE[rooms.length] ?? 'normal',
      cleared: false,
    });
  }

  return rooms;
}

/** 雕刻房间地板 */
export function carveRooms(grid: TileType[][], rooms: DungeonRoom[]): void {
  for (const room of rooms) {
    fillRect(grid, room, 'floor');
  }
}

/** 用宽2的 L 形走廊依次连接相邻房间 */
export function carveCorridors(grid: TileType[][], rooms: DungeonRoom[], width: number, height: number): void {
  for (let i = 0; i < rooms.length - 1; i++) {
    const to = centerOf(rooms[i + 1]);
    carveLCorridor(grid, centerOf(rooms[i]), to, width, height);
  }
}

/** 将与地板相邻（八邻域）的 void 全部变为岩壁 */
export function sealWallsAroundFloors(grid: TileType[][], width: number, height: number): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const tile = getTileAt(grid, x, y);
      if (tile !== 'void') continue;
      const touchesFloor = hasNeighbor8Tile(grid, x, y, (t) => t === 'floor');
      if (touchesFloor) grid[y][x] = 'wall';
    }
  }
}

/** 按类型查找房间 */
export function findRoomByType(rooms: DungeonRoom[], type: DungeonRoom['type']): DungeonRoom | undefined {
  return rooms.find((r) => r.type === type);
}

/** 先横后纵的 L 形走廊，走廊宽 2（与原版生成行为一致） */
function carveLCorridor(
  grid: TileType[][],
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  height: number
): void {
  let cx = from.x;
  let cy = from.y;

  while (cx !== to.x) {
    setFloor(grid, cx, cy);
    if (cy + 1 < height) setFloor(grid, cx, cy + 1);
    cx += cx < to.x ? 1 : -1;
  }
  while (cy !== to.y) {
    setFloor(grid, cx, cy);
    if (cx + 1 < width) setFloor(grid, cx + 1, cy);
    cy += cy < to.y ? 1 : -1;
  }
}

function setFloor(grid: TileType[][], x: number, y: number): void {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return;
  grid[y][x] = 'floor';
}

function centerOf(room: GridRect): { x: number; y: number } {
  return { x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) };
}

/** 两矩形之间至少保留 1 格间隙的重叠判断 */
function rectsWithGap(a: GridRect, b: GridRect): boolean {
  return (
    b.x <= a.x + a.w + 1 &&
    b.x + b.w + 1 >= a.x &&
    b.y <= a.y + a.h + 1 &&
    b.y + b.h + 1 >= a.y
  );
}

/** [min, maxExclusive) 半开区间随机整数 */
function randInt(min: number, maxExclusive: number): number {
  return Math.floor(Math.random() * (maxExclusive - min)) + min;
}
