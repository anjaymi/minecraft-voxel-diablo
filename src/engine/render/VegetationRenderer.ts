import { Ctx, isoBox, tileHash } from './IsoPrimitives';
import { worldToScreen } from '../isometric';

/**
 * VegetationRenderer — 植被与环境装饰渲染。
 *
 * 树木：体素树干 + 三层树冠 + 风向摇摆 + 玩家遮挡半透明；
 * 地表装饰：高草、花丛、发光蘑菇、碎石（平铺层，实体可穿行）。
 */

/** 主入口：绘制一棵树（renderables 深度排序层调用） */
export function drawTree(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number,
  playerX?: number,
  playerY?: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, viewportWidth, viewportHeight);
  const hash = tileHash(x, y);
  const scale = 0.85 + (hash % 30) / 100; // 0.85 ~ 1.15 个体型差异
  const sway = Math.sin(time * 1.4 + hash * 0.013) * 1.8;

  // 地面阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 3, 17 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // 树干（体素块）
  isoBox(ctx, s.x, s.y, 24 * scale, '#7c5a3a', '#5d4037', '#4e342e');

  // 树冠（玩家经过时半透明遮挡）
  const canopyAlpha = computeCanopyAlpha(x, y, playerX, playerY);
  ctx.save();
  ctx.globalAlpha = canopyAlpha;

  const cx = s.x + sway * 0.6;
  const layers = [
    { r: 20 * scale, ry: 13 * scale, dy: -30 * scale, color: '#2d6a4f' },
    { r: 15.5 * scale, ry: 10 * scale, dy: -41 * scale, color: '#40916c' },
    { r: 10.5 * scale, ry: 7 * scale, dy: -51 * scale, color: '#52b788' },
  ];
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    const layerSway = sway * ((i + 1) / layers.length);
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    ctx.ellipse(cx + layerSway, s.y + layer.dy, layer.r, layer.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 树冠高光（西北光源）
  ctx.fillStyle = 'rgba(183, 228, 199, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx + sway - 5 * scale, s.y - 45 * scale, 6 * scale, 3.5 * scale, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** 玩家在树冠后时降低不透明度（遮挡可视化） */
function computeCanopyAlpha(x: number, y: number, playerX?: number, playerY?: number): number {
  if (playerX === undefined || playerY === undefined) return 1;
  const dist = Math.hypot(playerX - x, playerY - y);
  if (dist >= 1.7) return 1;
  // 玩家在树北侧（被树冠覆盖视野）时更透明
  return playerY < y ? 0.38 : 0.55;
}

/** 高草丛：数根随风摇摆的草叶 */
export function drawTallGrass(ctx: Ctx, cx: number, cy: number, x: number, y: number, time: number): void {
  const hash = tileHash(x, y, 7);
  const blades = 3 + (hash % 3);
  for (let i = 0; i < blades; i++) {
    const bx = cx + ((hash >> (i * 3)) % 15) - 7;
    const lean = Math.sin(time * 2.2 + hash * 0.02 + i) * 2.5;
    const height = 7 + ((hash >> (i + 2)) % 5);
    ctx.strokeStyle = i % 2 === 0 ? '#4ade80' : '#22c55e';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, cy + 2);
    ctx.quadraticCurveTo(bx + lean * 0.4, cy - height * 0.6, bx + lean, cy - height);
    ctx.stroke();
  }
}

/** 花丛：多彩小花点缀 */
export function drawFlowerPatch(ctx: Ctx, cx: number, cy: number, x: number, y: number): void {
  const hash = tileHash(x, y, 13);
  const colors = ['#facc15', '#f43f5e', '#a78bfa', '#fb923c', '#f9a8d4'];
  const count = 2 + (hash % 3);
  for (let i = 0; i < count; i++) {
    const fx = cx + ((hash >> (i * 4)) % 17) - 8;
    const fy = cy + ((hash >> (i * 2 + 3)) % 9) - 4;
    const color = colors[(hash + i * 61) % colors.length];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fefce8';
    ctx.beginPath();
    ctx.arc(fx, fy, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 蘑菇簇：洞穴中散发微光 */
export function drawMushroom(ctx: Ctx, cx: number, cy: number, x: number, y: number, time: number): void {
  const hash = tileHash(x, y, 23);
  const count = 2 + (hash % 2);
  const glow = 0.5 + 0.5 * Math.sin(time * 2 + hash);

  for (let i = 0; i < count; i++) {
    const mx = cx + ((hash >> (i * 5)) % 13) - 6;
    const my = cy + ((hash >> (i * 3 + 4)) % 7) - 3;
    const capColor = ['#ef4444', '#a16207', '#a855f7'][(hash + i) % 3];

    // 孢子微光
    ctx.fillStyle = `rgba(125, 211, 252, ${0.12 + glow * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(mx, my - 3, 5.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 菌柄
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(mx - 1, my - 3, 2, 4);
    // 菌盖
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.ellipse(mx, my - 4, 3.5, 2.4, 0, Math.PI, 0);
    ctx.fill();
    // 菌盖斑点
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(mx - 1.2, my - 4.8, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 碎石堆：两三块灰色卵石 */
export function drawPebble(ctx: Ctx, cx: number, cy: number, x: number, y: number): void {
  const hash = tileHash(x, y, 31);
  const count = 2 + (hash % 2);
  for (let i = 0; i < count; i++) {
    const px = cx + ((hash >> (i * 4)) % 15) - 7;
    const py = cy + ((hash >> (i * 3 + 2)) % 7) - 3;
    const size = 2.2 + ((hash >> i) % 3) * 0.7;
    ctx.fillStyle = i % 2 === 0 ? '#6b7280' : '#4b5563';
    ctx.beginPath();
    ctx.ellipse(px, py, size, size * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(px - size * 0.3, py - size * 0.25, size * 0.35, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 地表装饰统一分发（平铺层，画在实体之下） */
export function drawGroundDecor(
  ctx: Ctx,
  tile: string,
  cx: number,
  cy: number,
  x: number,
  y: number,
  time: number
): void {
  switch (tile) {
    case 'tall_grass':
      drawTallGrass(ctx, cx, cy, x, y, time);
      break;
    case 'flower_patch':
      drawTallGrass(ctx, cx, cy, x, y, time);
      drawFlowerPatch(ctx, cx, cy, x, y);
      break;
    case 'mushroom':
      drawMushroom(ctx, cx, cy, x, y, time);
      break;
    case 'pebble':
      drawPebble(ctx, cx, cy, x, y);
      break;
    default:
      break;
  }
}
