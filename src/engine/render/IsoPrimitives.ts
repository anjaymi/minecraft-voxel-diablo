import { BLOCK_HEIGHT, TILE_HEIGHT, TILE_WIDTH } from '../isometric';

/**
 * IsoPrimitives — 等距渲染共享几何原语。
 *
 * 供水面/植被/建筑渲染模块复用的菱形瓦片与立方体绘制，
 * 保证各环境元素使用一致的透视与高光方向。
 */

export const TILE_HW = TILE_WIDTH / 2;
export const TILE_HH = TILE_HEIGHT / 2;

export type Ctx = CanvasRenderingContext2D;

/** 以 (cx, cy) 为中心的等距菱形路径 */
export function diamondPath(ctx: Ctx, cx: number, cy: number, hw: number = TILE_HW, hh: number = TILE_HH): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh);
  ctx.lineTo(cx + hw, cy);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
}

/**
 * 等距立方体（Minecraft 体素块的标准三面着色）。
 * @param depth 块高度（像素），默认标准 BLOCK_HEIGHT
 */
export function isoBox(
  ctx: Ctx,
  cx: number,
  cy: number,
  depth: number = BLOCK_HEIGHT,
  topColor: string = '#6b7280',
  leftColor: string = '#4b5563',
  rightColor: string = '#374151'
): void {
  const hw = TILE_HW;
  const hh = TILE_HH;

  // 顶面
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh - depth);
  ctx.lineTo(cx + hw, cy - depth);
  ctx.lineTo(cx, cy + hh - depth);
  ctx.lineTo(cx - hw, cy - depth);
  ctx.closePath();
  ctx.fill();

  // 左面
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - depth);
  ctx.lineTo(cx, cy + hh - depth);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fill();

  // 右面
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(cx + hw, cy - depth);
  ctx.lineTo(cx, cy + hh - depth);
  ctx.lineTo(cx, cy + hh);
  ctx.lineTo(cx + hw, cy);
  ctx.closePath();
  ctx.fill();

  // 顶面高光描边（统一西北光源）
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - hw, cy - depth);
  ctx.lineTo(cx, cy - hh - depth);
  ctx.lineTo(cx + hw, cy - depth);
  ctx.stroke();
}

/** 确定性瓦片哈希（同帧稳定、跨帧一致的伪随机源） */
export function tileHash(x: number, y: number, salt: number = 0): number {
  return (((x * 374761393) ^ (y * 668265263) ^ (salt * 2246822519)) >>> 0);
}
