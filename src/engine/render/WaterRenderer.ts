import { Ctx, TILE_HH, TILE_HW, diamondPath, tileHash } from './IsoPrimitives';

/**
 * WaterRenderer — 水面与水洼渲染。
 *
 * 表现层次：
 * 1. 天空反射渐变（俯视时水面映出天色）
 * 2. 岸边泡沫（检测四邻域非水瓦片）
 * 3. 焦散波光（漂移的亮带）
 * 4. 太阳/月亮高光（拉长的闪烁光斑）
 * 5. 深水中心压暗（全邻域为水时）
 */

export interface WaterNeighbors {
  /** 判断 (dx, dy) 偏移处是否为水面 */
  (dx: number, dy: number): boolean;
}

/** 主入口：绘制一个水面/水洼瓦片 */
export function drawWaterTile(
  ctx: Ctx,
  cx: number,
  cy: number,
  x: number,
  y: number,
  time: number,
  isWaterAt: WaterNeighbors,
  isPuddle: boolean,
  variant: 'clear' | 'murk' = 'clear'
): void {
  const hash = tileHash(x, y);

  // 1. 天空反射渐变
  paintSkyReflection(ctx, cx, cy, isPuddle, hash, variant);

  // 2. 深水压暗
  if (!isPuddle && isWaterAt(0, -1) && isWaterAt(0, 1) && isWaterAt(-1, 0) && isWaterAt(1, 0)) {
    paintDeepCenter(ctx, cx, cy);
  }

  // 3. 焦散波光带
  paintCaustics(ctx, cx, cy, x, y, time, isPuddle);

  // 4. 高光反射斑
  paintGlint(ctx, cx, cy, hash, time, isPuddle);

  // 5. 岸线泡沫
  paintShoreFoam(ctx, cx, cy, time, isWaterAt, isPuddle);

  // 水洼边缘轮廓（浅水边界感）
  if (isPuddle) {
    diamondPath(ctx, cx, cy);
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** 天空色反射渐变：上缘亮（远天）、下缘深（近岸倒影） */
function paintSkyReflection(
  ctx: Ctx,
  cx: number,
  cy: number,
  isPuddle: boolean,
  hash: number,
  variant: 'clear' | 'murk'
): void {
  if (variant === 'murk') {
    // 沼泽浊水：浑绿不透光，腐叶浮沫
    diamondPath(ctx, cx, cy);
    const g = ctx.createLinearGradient(cx, cy - TILE_HH, cx, cy + TILE_HH);
    g.addColorStop(0, 'rgba(74, 106, 58, 0.96)');
    g.addColorStop(0.5, 'rgba(52, 78, 42, 0.96)');
    g.addColorStop(1, 'rgba(30, 48, 28, 0.97)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = 'rgba(122, 132, 74, 0.4)';
    ctx.beginPath();
    ctx.ellipse(cx + (hash % 9) - 4, cy + ((hash >> 4) % 7) - 3, 4.5, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  const g = ctx.createLinearGradient(cx, cy - TILE_HH, cx, cy + TILE_HH);
  if (isPuddle) {
    g.addColorStop(0, 'rgba(96, 165, 250, 0.55)');
    g.addColorStop(0.5, 'rgba(59, 130, 246, 0.42)');
    g.addColorStop(1, 'rgba(30, 64, 175, 0.5)');
  } else {
    g.addColorStop(0, 'rgba(125, 211, 252, 0.95)');
    g.addColorStop(0.45, 'rgba(14, 116, 190, 0.92)');
    g.addColorStop(1, 'rgba(7, 66, 118, 0.95)');
  }
  diamondPath(ctx, cx, cy);
  ctx.fillStyle = g;
  ctx.fill();

  // 微弱的天色斑块（倒影的云）
  const cloudX = cx + ((hash % 17) - 8) * 0.8;
  const cloudY = cy - TILE_HH * 0.3 + ((hash >> 5) % 7) - 3;
  ctx.fillStyle = isPuddle ? 'rgba(226, 240, 255, 0.12)' : 'rgba(226, 240, 255, 0.18)';
  ctx.beginPath();
  ctx.ellipse(cloudX, cloudY, TILE_HW * 0.42, TILE_HH * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 深水中心压暗（湖心效果） */
function paintDeepCenter(ctx: Ctx, cx: number, cy: number): void {
  diamondPath(ctx, cx, cy, TILE_HW * 0.62, TILE_HH * 0.62);
  ctx.fillStyle = 'rgba(3, 40, 80, 0.4)';
  ctx.fill();
}

/** 焦散亮带：两条随时间漂移的波纹高光 */
function paintCaustics(
  ctx: Ctx,
  cx: number,
  cy: number,
  x: number,
  y: number,
  time: number,
  isPuddle: boolean
): void {
  const speed = isPuddle ? 0.8 : 2.2;
  const alpha = isPuddle ? 0.16 : 0.3;
  ctx.save();
  diamondPath(ctx, cx, cy);
  ctx.clip();

  for (let band = 0; band < 2; band++) {
    const drift = Math.sin(time * speed + x * 0.9 + y * 1.1 + band * 2.4);
    const bandY = cy + drift * (TILE_HH * 0.45) + (band - 0.5) * 6;
    ctx.strokeStyle = `rgba(186, 230, 253, ${alpha * (0.6 + 0.4 * Math.abs(drift))})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - TILE_HW * 0.7, bandY);
    ctx.quadraticCurveTo(cx + Math.sin(time * speed * 1.3 + band) * 5, bandY - 2.5, cx + TILE_HW * 0.7, bandY);
    ctx.stroke();
  }
  ctx.restore();
}

/** 太阳/月亮高光：位置由哈希决定，宽度呼吸式闪烁 */
function paintGlint(
  ctx: Ctx,
  cx: number,
  cy: number,
  hash: number,
  time: number,
  isPuddle: boolean
): void {
  if (hash % 4 !== 0) return; // 约四分之一的格有可见高光
  const gx = cx + ((hash % 19) - 9) * 0.9;
  const gy = cy + (((hash >> 6) % 9) - 4) * 0.7;
  const shimmer = 0.55 + 0.45 * Math.sin(time * (isPuddle ? 1.4 : 2.8) + hash);
  const w = (isPuddle ? 4 : 7) * shimmer + 2;
  const h = (isPuddle ? 1.2 : 2) * shimmer + 0.6;

  ctx.fillStyle = `rgba(255, 252, 230, ${0.35 + 0.4 * shimmer})`;
  ctx.beginPath();
  ctx.ellipse(gx, gy, w, h, 0, 0, Math.PI * 2);
  ctx.fill();

  // 高光核心
  ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * shimmer})`;
  ctx.beginPath();
  ctx.ellipse(gx, gy, w * 0.4, h * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 岸线泡沫：非水邻边绘制白色泡沫线 + 随时间脉动 */
function paintShoreFoam(
  ctx: Ctx,
  cx: number,
  cy: number,
  time: number,
  isWaterAt: WaterNeighbors,
  isPuddle: boolean
): void {
  const foamAlpha = (isPuddle ? 0.3 : 0.5) + 0.2 * Math.sin(time * 3 + cx * 0.05);
  ctx.strokeStyle = `rgba(240, 250, 255, ${foamAlpha})`;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';

  const edges: Array<{ dx: number; dy: number; p1: [number, number]; p2: [number, number] }> = [
    { dx: 0, dy: -1, p1: [cx - TILE_HW, cy], p2: [cx, cy - TILE_HH] },           // 北西边
    { dx: 1, dy: 0, p1: [cx, cy - TILE_HH], p2: [cx + TILE_HW, cy] },            // 北东边
    { dx: 0, dy: 1, p1: [cx + TILE_HW, cy], p2: [cx, cy + TILE_HH] },            // 南东边
    { dx: -1, dy: 0, p1: [cx, cy + TILE_HH], p2: [cx - TILE_HW, cy] },           // 南西边
  ];

  for (const edge of edges) {
    if (isWaterAt(edge.dx, edge.dy)) continue;
    ctx.beginPath();
    ctx.moveTo(edge.p1[0], edge.p1[1]);
    ctx.lineTo(edge.p2[0], edge.p2[1]);
    ctx.stroke();

    // 泡沫点
    const midX = (edge.p1[0] + edge.p2[0]) / 2;
    const midY = (edge.p1[1] + edge.p2[1]) / 2;
    ctx.fillStyle = `rgba(240, 250, 255, ${foamAlpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(midX, midY, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.lineCap = 'butt';
}
