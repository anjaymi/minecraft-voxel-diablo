import { DungeonFloor, TileType } from '../../types';
import { TILE_HEIGHT, TILE_WIDTH } from '../isometric';

/**
 * TileChunkCache — 分块静态地形缓存（GPU 加速位图 Blit）。
 *
 * 卡顿主因：每帧重绘可视范围内 ~1400 块静态瓦片。
 * 本模块将 16×16 瓦片块预渲染为离屏位图（优先 OffscreenCanvas 走 GPU 合成），
 * 每帧仅按相机位置 Blit 可见的 ~9 块；动画瓦片（水/熔岩/冰面等）保持逐帧绘制。
 *
 * 瓦片修改（开箱/破坏/铺路）通过 invalidateTile(x, y) 使所在块重建。
 */

const CHUNK_TILES = 16;
/** 块位图尺寸（等距包围盒 + 余量） */
const CHUNK_W = TILE_WIDTH * (CHUNK_TILES + 2);
const CHUNK_H = TILE_HEIGHT * (CHUNK_TILES + 4);
const MAX_CACHED = 14;

/** 动画瓦片：保持逐帧绘制，不入缓存 */
export const LIVE_TILES: ReadonlySet<string> = new Set([
  'water', 'puddle', 'murkwater', 'lava', 'ice',
  'tall_grass', 'mushroom', 'scorched',
]);

interface Chunk {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** 块参考相机（瓦片坐标中心） */
  mx: number;
  my: number;
}

export type StaticTileDrawer = (
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number, y: number, tile: TileType,
  sx: number, sy: number, floor: DungeonFloor
) => void;

class TileChunkCache {
  private chunks = new Map<string, Chunk>();
  private enabled = true;

  public setEnabled(v: boolean): void {
    if (!v) this.chunks.clear();
    this.enabled = v;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /** 瓦片修改后调用：重建所在块（含边界相邻块） */
  public invalidateTile(x: number, y: number): void {
    const cx = Math.floor(x / CHUNK_TILES);
    const cy = Math.floor(y / CHUNK_TILES);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        this.chunks.delete(`${cx + dx},${cy + dy}`);
      }
    }
  }

  public invalidateAll(): void {
    this.chunks.clear();
  }

  /**
   * 渲染静态地形层：Blit 可见块 + 逐帧绘制动画瓦片。
   * @param drawStatic 静态瓦片绘制（渲染器委托）
   * @param drawLive 动画瓦片绘制（渲染器委托）
   */
  public renderTerrain(
    ctx: CanvasRenderingContext2D,
    floor: DungeonFloor,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    drawStatic: StaticTileDrawer,
    drawLive: (x: number, y: number, tile: TileType, sx: number, sy: number) => void
  ): void {
    if (!this.enabled) {
      this.drawAllLive(ctx, floor, camX, camY, viewW, viewH, drawStatic, drawLive);
      return;
    }

    const c0x = Math.floor((camX - 20) / CHUNK_TILES);
    const c1x = Math.floor((camX + 20) / CHUNK_TILES);
    const c0y = Math.floor((camY - 22) / CHUNK_TILES);
    const c1y = Math.floor((camY + 22) / CHUNK_TILES);

    // 1. Blit 可见块的静态层
    for (let ccx = c0x; ccx <= c1x; ccx++) {
      for (let ccy = c0y; ccy <= c1y; ccy++) {
        const chunk = this.getChunk(floor, ccx, ccy, drawStatic);
        const mx = ccx * CHUNK_TILES + CHUNK_TILES / 2;
        const my = ccy * CHUNK_TILES + CHUNK_TILES / 2;
        const relX = mx - camX;
        const relY = my - camY;
        const sx = (relX - relY) * (TILE_WIDTH / 2) + viewW / 2;
        const sy = (relX + relY) * (TILE_HEIGHT / 2) + viewH / 2;
        ctx.drawImage(chunk.canvas as HTMLCanvasElement, sx - CHUNK_W / 2, sy - CHUNK_H / 2);
      }
    }

    // 2. 动画瓦片逐帧绘制
    this.drawAllLive(ctx, floor, camX, camY, viewW, viewH, drawStatic, drawLive);
  }

  private drawAllLive(
    ctx: CanvasRenderingContext2D,
    floor: DungeonFloor,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    drawStatic: StaticTileDrawer,
    drawLive: (x: number, y: number, tile: TileType, sx: number, sy: number) => void
  ): void {
    const minTx = Math.max(0, Math.floor(camX - 20));
    const maxTx = Math.min(floor.width - 1, Math.ceil(camX + 20));
    const minTy = Math.max(0, Math.floor(camY - 22));
    const maxTy = Math.min(floor.height - 1, Math.ceil(camY + 22));

    for (let y = minTy; y <= maxTy; y++) {
      for (let x = minTx; x <= maxTx; x++) {
        const tile = floor.tiles[y][x];
        if (tile === 'void' || !LIVE_TILES.has(tile)) continue;
        const relX = x - camX;
        const relY = y - camY;
        const sx = (relX - relY) * (TILE_WIDTH / 2) + viewW / 2;
        const sy = (relX + relY) * (TILE_HEIGHT / 2) + viewH / 2;
        drawLive(x, y, tile, sx, sy);
      }
    }
    void drawStatic;
  }

  /** 取块（惰性构建 + LRU 淘汰） */
  private getChunk(floor: DungeonFloor, ccx: number, ccy: number, drawStatic: StaticTileDrawer): Chunk {
    const key = `${ccx},${ccy}`;
    const cached = this.chunks.get(key);
    if (cached) {
      // LRU 触碰
      this.chunks.delete(key);
      this.chunks.set(key, cached);
      return cached;
    }

    const mx = ccx * CHUNK_TILES + CHUNK_TILES / 2;
    const my = ccy * CHUNK_TILES + CHUNK_TILES / 2;

    let canvas: HTMLCanvasElement | OffscreenCanvas;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(CHUNK_W, CHUNK_H);
    } else {
      canvas = document.createElement('canvas');
      canvas.width = CHUNK_W;
      canvas.height = CHUNK_H;
    }
    const cctx = (canvas as OffscreenCanvas).getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    if (cctx) {
      const x0 = ccx * CHUNK_TILES;
      const y0 = ccy * CHUNK_TILES;
      for (let ty = 0; ty < CHUNK_TILES; ty++) {
        for (let tx = 0; tx < CHUNK_TILES; tx++) {
          const x = x0 + tx;
          const y = y0 + ty;
          const tile = floor.tiles[y]?.[x];
          if (!tile || tile === 'void' || LIVE_TILES.has(tile)) continue;
          const lx = ((x - mx) - (y - my)) * (TILE_WIDTH / 2) + CHUNK_W / 2;
          const ly = ((x - mx) + (y - my)) * (TILE_HEIGHT / 2) + CHUNK_H / 2;
          drawStatic(cctx as unknown as CanvasRenderingContext2D, x, y, tile, lx, ly, floor);
        }
      }
    }

    const chunk: Chunk = { canvas, mx, my };
    this.chunks.set(key, chunk);
    if (this.chunks.size > MAX_CACHED) {
      const oldest = this.chunks.keys().next().value;
      if (oldest) this.chunks.delete(oldest);
    }
    return chunk;
  }
}

export const tileChunkCache = new TileChunkCache();
