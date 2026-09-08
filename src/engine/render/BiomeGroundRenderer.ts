import { Ctx, TILE_HH, TILE_HW, diamondPath, tileHash } from './IsoPrimitives';

/**
 * BiomeGroundRenderer — 生态区专属地面瓦片渲染。
 *
 * snow 雪原 / sand 沙丘 / scorched 焦土 / ice 冻结湖面。
 * 与核心 drawFloorTile 分支解耦，保持主渲染器精简。
 */

/** 生态地面瓦片集合（drawFloorTile 顶部一次性分发） */
export const BIOME_GROUND_TILES: ReadonlySet<string> = new Set([
  'snow', 'sand', 'scorched', 'ice',
]);

export function drawBiomeGround(
  ctx: Ctx,
  tile: string,
  cx: number,
  cy: number,
  x: number,
  y: number,
  time: number
): void {
  switch (tile) {
    case 'snow':
      drawSnow(ctx, cx, cy, x, y);
      break;
    case 'sand':
      drawSand(ctx, cx, cy, x, y);
      break;
    case 'scorched':
      drawScorched(ctx, cx, cy, x, y, time);
      break;
    case 'ice':
      drawIce(ctx, cx, cy, x, y, time);
      break;
    default:
      break;
  }
}

/** 雪原：冷白棋盘格 + 雪斑高光 + 偶发雪晶 */
function drawSnow(ctx: Ctx, cx: number, cy: number, x: number, y: number): void {
  const isAlt = (x + y) % 2 === 0;
  diamondPath(ctx, cx, cy);
  ctx.fillStyle = isAlt ? '#e2e8f0' : '#dbe3ee';
  ctx.fill();
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const hash = tileHash(x, y);
  if (hash % 4 === 0) {
    // 雪面起伏阴影
    ctx.fillStyle = 'rgba(191, 205, 224, 0.5)';
    ctx.beginPath();
    ctx.ellipse(cx + (hash % 9) - 4, cy + ((hash >> 4) % 5) - 2, 6, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (hash % 11 === 0) {
    // 闪光雪晶
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  }
}

/** 沙丘：暖沙棋盘 + 风纹波线 */
function drawSand(ctx: Ctx, cx: number, cy: number, x: number, y: number): void {
  const isAlt = (x + y) % 2 === 0;
  diamondPath(ctx, cx, cy);
  ctx.fillStyle = isAlt ? '#d4b483' : '#c9a876';
  ctx.fill();
  ctx.strokeStyle = 'rgba(146, 116, 78, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const hash = tileHash(x, y);
  if (hash % 3 === 0) {
    // 风成波纹
    ctx.strokeStyle = 'rgba(146, 116, 78, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const wy = cy - 3 + (hash % 5);
    ctx.moveTo(cx - TILE_HW * 0.6, wy);
    ctx.quadraticCurveTo(cx, wy - 2.5, cx + TILE_HW * 0.6, wy);
    ctx.stroke();
  }
  if (hash % 9 === 0) {
    // 沙砾
    ctx.fillStyle = 'rgba(120, 96, 66, 0.6)';
    ctx.beginPath();
    ctx.arc(cx + (hash % 13) - 6, cy + ((hash >> 5) % 7) - 3, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 焦土：炭黑底 + 熔岩裂纹余烬 */
function drawScorched(ctx: Ctx, cx: number, cy: number, x: number, y: number, time: number): void {
  const isAlt = (x + y) % 2 === 0;
  diamondPath(ctx, cx, cy);
  ctx.fillStyle = isAlt ? '#2b2320' : '#221b18';
  ctx.fill();
  ctx.strokeStyle = 'rgba(12, 8, 6, 0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const hash = tileHash(x, y);
  if (hash % 5 === 0) {
    // 炽热裂纹（呼吸式余烬光）
    const glow = 0.35 + 0.3 * Math.sin(time * 1.4 + hash);
    ctx.strokeStyle = `rgba(234, 88, 12, ${glow})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - TILE_HW * 0.5, cy + 1);
    ctx.lineTo(cx - 2, cy - 2);
    ctx.lineTo(cx + TILE_HW * 0.45, cy + 2);
    ctx.stroke();
  }
  if (hash % 7 === 0) {
    // 灰烬斑
    ctx.fillStyle = 'rgba(90, 80, 74, 0.55)';
    ctx.beginPath();
    ctx.ellipse(cx + (hash % 11) - 5, cy + ((hash >> 4) % 7) - 3, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 冻结湖面：青白冰面 + 裂纹 + 极光微光 */
function drawIce(ctx: Ctx, cx: number, cy: number, x: number, y: number, time: number): void {
  const isAlt = (x + y) % 2 === 0;
  diamondPath(ctx, cx, cy);
  ctx.fillStyle = isAlt ? '#bfe3f5' : '#aed9ef';
  ctx.fill();
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const hash = tileHash(x, y);
  // 冰面裂纹
  if (hash % 3 === 0) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - TILE_HW * 0.55, cy - 2);
    ctx.lineTo(cx - 3, cy + 2);
    ctx.lineTo(cx + 4, cy - 3);
    ctx.lineTo(cx + TILE_HW * 0.5, cy + 1);
    ctx.stroke();
  }
  // 缓慢流动的极光高光
  const shimmer = Math.sin(time * 1.2 + x * 0.7 + y * 0.9);
  if (shimmer > 0.55) {
    ctx.fillStyle = `rgba(224, 247, 255, ${(shimmer - 0.55) * 0.9})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, TILE_HW * 0.7, TILE_HH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}
