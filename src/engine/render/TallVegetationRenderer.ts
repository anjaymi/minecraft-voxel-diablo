import { Ctx, tileHash } from './IsoPrimitives';
import { worldToScreen } from '../isometric';
import { drawTree } from './VegetationRenderer';

/**
 * TallVegetationRenderer — 高大植被渲染（renderables 深度排序层）。
 *
 * 仙人掌（沙漠）、巨型发光蘑菇（蘑菇林）、枯树（沼泽/咒怨林地）。
 * 与普通树冠树（VegetationRenderer.drawTree）分开以控制文件规模。
 */

// ==================== 高大植被（renderables 深度排序层） ====================

/** 高大植被统一分发入口（drawVoxelBlock 委托） */
export function drawTallVegetation(
  ctx: Ctx,
  tile: string,
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
  switch (tile) {
    case 'cactus':
      drawCactus(ctx, x, y, time, camX, camY, viewportWidth, viewportHeight);
      break;
    case 'giant_mushroom':
      drawGiantMushroom(ctx, x, y, time, camX, camY, viewportWidth, viewportHeight);
      break;
    case 'dead_tree':
      drawDeadTree(ctx, x, y, time, camX, camY, viewportWidth, viewportHeight, playerX, playerY);
      break;
    default:
      drawTree(ctx, x, y, time, camX, camY, viewportWidth, viewportHeight, playerX, playerY);
      break;
  }
}

/** 仙人掌：柱状肉质茎 + 侧臂 + 刺 */
function drawCactus(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, vw, vh);
  const hash = tileHash(x, y, 61);
  const sway = Math.sin(time * 1.1 + hash) * 0.6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 3, 12, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // 主茎（圆角柱）
  const h = 26 + (hash % 8);
  ctx.fillStyle = '#3f8f4f';
  roundedColumn(ctx, s.x, s.y, 8, h);
  // 竖向棱线
  ctx.strokeStyle = 'rgba(27, 94, 49, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x - 2, s.y - 2);
  ctx.lineTo(s.x - 2 + sway, s.y - h + 2);
  ctx.moveTo(s.x + 2, s.y - 2);
  ctx.lineTo(s.x + 2 + sway, s.y - h + 2);
  ctx.stroke();

  // 侧臂（左右各一，高度随机）
  const armY = s.y - h * (0.45 + (hash % 20) / 100);
  ctx.fillStyle = '#357f44';
  roundedColumn(ctx, s.x - 9, armY, 5, 10);
  roundedColumn(ctx, s.x + 9, armY + 6, 5, 10);
  // 顶部小花（偶发）
  if (hash % 3 === 0) {
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(s.x + sway, s.y - h - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 巨型蘑菇：粗菌柄 + 发光伞盖 + 孢子光尘 */
function drawGiantMushroom(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, vw, vh);
  const hash = tileHash(x, y, 67);
  const capHue = hash % 3;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 3, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  const stemH = 30 + (hash % 10);
  // 菌柄
  ctx.fillStyle = '#e7e0d4';
  roundedColumn(ctx, s.x, s.y, 10, stemH);
  ctx.strokeStyle = 'rgba(168, 156, 140, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x - 3, s.y - 4);
  ctx.lineTo(s.x - 3, s.y - stemH + 4);
  ctx.stroke();

  // 孢子光尘
  const glow = 0.5 + 0.5 * Math.sin(time * 2 + hash);
  ctx.fillStyle = `rgba(168, 85, 247, ${0.14 + glow * 0.12})`;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - stemH, 24, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // 伞盖（双层椭圆）
  const capColor = ['#e11d48', '#7c3aed', '#ea580c'][capHue];
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - stemH, 19, 11, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 3; i++) {
    const dx = ((hash >> (i * 3)) % 20) - 10;
    ctx.beginPath();
    ctx.ellipse(s.x + dx, s.y - stemH - 3 + ((hash >> (i + 2)) % 4), 2.2, 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 枯树：裸露枝干 + 风中摇曳（无树冠，遮挡用枝干透明度） */
function drawDeadTree(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
  playerX?: number,
  playerY?: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, vw, vh);
  const hash = tileHash(x, y, 71);
  const sway = Math.sin(time * 1.6 + hash * 0.017) * 1.6;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 3, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const alpha = playerX !== undefined && Math.hypot(playerX - x, playerY - y) < 1.7 ? 0.45 : 1;
  ctx.save();
  ctx.globalAlpha = alpha;

  // 主干（弯曲）
  const h = 30 + (hash % 10);
  ctx.strokeStyle = '#4a4038';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.quadraticCurveTo(s.x + sway * 0.5, s.y - h * 0.6, s.x + sway, s.y - h);
  ctx.stroke();

  // 枯枝（3-4 根分叉）
  ctx.lineWidth = 2;
  const branches = 3 + (hash % 2);
  for (let i = 0; i < branches; i++) {
    const by = s.y - h * (0.4 + (i / branches) * 0.5);
    const dir = i % 2 === 0 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(s.x + sway * 0.4, by);
    ctx.quadraticCurveTo(
      s.x + dir * 8, by - 4,
      s.x + dir * (11 + (hash % 5)), by - 9 - ((hash >> i) % 4)
    );
    ctx.stroke();
  }
  ctx.restore();
}

/** 圆角立柱（仙人掌/菌柄共用） */
function roundedColumn(ctx: Ctx, cx: number, baseY: number, w: number, h: number): void {
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, baseY - h, w, h, w / 2);
  ctx.fill();
}
