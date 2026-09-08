import { TileType } from '../../types';

/**
 * TileGrid — 瓦片网格原子操作工具集。
 *
 * 所有函数均为纯函数：接收网格、返回结果或就地修改并显式标注，
 * 不持有任何状态，供各地图工厂组合使用（原子化设计）。
 */

export interface GridRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

/** 创建一个以 fill 瓦片填满的网格 */
export function createGrid(width: number, height: number, fill: TileType): TileType[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => fill));
}

/** 网格边界判断 */
export function isInsideGrid(grid: TileType[][], x: number, y: number): boolean {
  return y >= 0 && y < grid.length && x >= 0 && x < grid[0].length;
}

/** 边界安全读瓦片，越界返回 null */
export function getTileAt(grid: TileType[][], x: number, y: number): TileType | null {
  if (!isInsideGrid(grid, x, y)) return null;
  return grid[y][x];
}

/**
 * 写入单个瓦片。
 * @param onlyIf 可选前提条件：仅当当前瓦片满足条件时才覆盖
 * @returns 是否实际写入
 */
export function setTile(
  grid: TileType[][],
  x: number,
  y: number,
  tile: TileType,
  onlyIf?: (current: TileType) => boolean
): boolean {
  if (!isInsideGrid(grid, x, y)) return false;
  if (onlyIf && !onlyIf(grid[y][x])) return false;
  grid[y][x] = tile;
  return true;
}

/** 用 tile 实心填充矩形区域 */
export function fillRect(grid: TileType[][], rect: GridRect, tile: TileType): void {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      setTile(grid, x, y, tile);
    }
  }
}

/** 仅填充满足条件的格子（用于在不破坏已有结构的前提下铺设） */
export function fillRectIf(
  grid: TileType[][],
  rect: GridRect,
  tile: TileType,
  onlyIf: (current: TileType) => boolean
): void {
  for (let y = rect.y; y < rect.y + rect.h; y++) {
    for (let x = rect.x; x < rect.x + rect.w; x++) {
      setTile(grid, x, y, tile, onlyIf);
    }
  }
}

/** 绘制矩形边框（墙圈），内部不动 */
export function strokeRect(grid: TileType[][], rect: GridRect, tile: TileType): void {
  const { x, y, w, h } = rect;
  for (let ix = x; ix < x + w; ix++) {
    setTile(grid, ix, y, tile);
    setTile(grid, ix, y + h - 1, tile);
  }
  for (let iy = y; iy < y + h; iy++) {
    setTile(grid, x, iy, tile);
    setTile(grid, x + w - 1, iy, tile);
  }
}

/** 矩形几何中心（向下取整） */
export function rectCenter(rect: GridRect): Vec2 {
  return { x: Math.floor(rect.x + rect.w / 2), y: Math.floor(rect.y + rect.h / 2) };
}

/** 四邻域中是否存在满足条件的瓦片 */
export function hasNeighborTile(
  grid: TileType[][],
  x: number,
  y: number,
  match: (tile: TileType) => boolean
): boolean {
  return (
    matchWith(grid, x, y - 1, match) ||
    matchWith(grid, x, y + 1, match) ||
    matchWith(grid, x - 1, y, match) ||
    matchWith(grid, x + 1, y, match)
  );
}

/** 八邻域中是否存在满足条件的瓦片 */
export function hasNeighbor8Tile(
  grid: TileType[][],
  x: number,
  y: number,
  match: (tile: TileType) => boolean
): boolean {
  return (
    hasNeighborTile(grid, x, y, match) ||
    matchWith(grid, x - 1, y - 1, match) ||
    matchWith(grid, x + 1, y - 1, match) ||
    matchWith(grid, x - 1, y + 1, match) ||
    matchWith(grid, x + 1, y + 1, match)
  );
}

function matchWith(grid: TileType[][], x: number, y: number, match: (t: TileType) => boolean): boolean {
  const tile = getTileAt(grid, x, y);
  return tile !== null && match(tile);
}
