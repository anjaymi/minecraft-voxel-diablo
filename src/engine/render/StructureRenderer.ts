import { Ctx, TILE_HH, TILE_HW, isoBox, tileHash } from './IsoPrimitives';
import { TILE_WIDTH, worldToScreen } from '../isometric';

/**
 * StructureRenderer — 大型建筑地标渲染。
 *
 * 瞭望塔：三层收分石塔 + 城垛 + 窗火 + 随风旗帜；
 * 水井：石砌井栏 + 双柱木顶 + 吊桶。
 * 均为障碍物（renderables 深度排序层调用）。
 */

/** 瞭望塔（约 2.5 倍标准块高，地标级剪影） */
export function drawTower(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, viewportWidth, viewportHeight);
  const hash = tileHash(x, y, 41);

  // 塔基阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 4, 24, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // 三层收分塔身（下宽上窄）
  drawTowerSegment(ctx, s.x, s.y, 26, '#64748b', '#475569', '#334155');
  drawTowerSegment(ctx, s.x, s.y - 22, 22, '#6b7a8f', '#516074', '#3b4a5e');
  drawTowerSegment(ctx, s.x, s.y - 42, 18, '#74849a', '#5a6a80', '#43536a');

  // 城垛（顶面四角小方齿）
  const topY = s.y - 58;
  const merlons = [
    { dx: -TILE_HW * 0.55, dy: 0 },
    { dx: TILE_HW * 0.55, dy: 0 },
    { dx: -TILE_HW * 0.28, dy: -TILE_HH * 0.5 },
    { dx: TILE_HW * 0.28, dy: TILE_HH * 0.5 },
  ];
  for (const m of merlons) {
    ctx.fillStyle = '#475569';
    ctx.fillRect(s.x + m.dx - 2.5, topY + m.dy - 6, 5, 6);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(s.x + m.dx - 2.5, topY + m.dy - 6, 5, 2);
  }

  // 窗火（暖光，随时间轻微闪烁）
  const flicker = 0.75 + 0.25 * Math.sin(time * 6 + hash);
  ctx.fillStyle = `rgba(251, 191, 36, ${0.75 * flicker})`;
  ctx.fillRect(s.x - 2, s.y - 36, 4, 6);
  ctx.fillStyle = `rgba(254, 243, 199, ${0.85 * flicker})`;
  ctx.fillRect(s.x - 1, s.y - 35, 2, 4);

  // 随风旗帜
  const wave = Math.sin(time * 3.4 + hash * 0.02) * 2.2;
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(s.x, topY - 6);
  ctx.lineTo(s.x, topY - 18);
  ctx.stroke();
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.moveTo(s.x, topY - 18);
  ctx.quadraticCurveTo(s.x + 6, topY - 17 + wave * 0.4, s.x + 11, topY - 15 + wave);
  ctx.lineTo(s.x + 10, topY - 10 + wave * 0.8);
  ctx.quadraticCurveTo(s.x + 5, topY - 11 + wave * 0.3, s.x, topY - 10);
  ctx.closePath();
  ctx.fill();
}

/** 单层塔身（收分等距块） */
function drawTowerSegment(
  ctx: Ctx,
  cx: number,
  baseY: number,
  height: number,
  topColor: string,
  leftColor: string,
  rightColor: string
): void {
  // 临时缩放顶面宽度：直接以内联几何绘制收分效果
  const hw = TILE_HW * 0.9;
  const hh = TILE_HH * 0.9;

  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - hh - height);
  ctx.lineTo(cx + hw, baseY - height);
  ctx.lineTo(cx, baseY + hh - height);
  ctx.lineTo(cx - hw, baseY - height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(cx - hw, baseY - height);
  ctx.lineTo(cx, baseY + hh - height);
  ctx.lineTo(cx, baseY + hh);
  ctx.lineTo(cx - hw, baseY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(cx + hw, baseY - height);
  ctx.lineTo(cx, baseY + hh - height);
  ctx.lineTo(cx, baseY + hh);
  ctx.lineTo(cx + hw, baseY);
  ctx.closePath();
  ctx.fill();

  // 石缝横线
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 2; i++) {
    const ly = baseY - (height * i) / 3;
    ctx.beginPath();
    ctx.moveTo(cx - hw * (1 - i * 0.06), ly);
    ctx.lineTo(cx, ly + hh * 0.5);
    ctx.lineTo(cx + hw * (1 - i * 0.06), ly);
    ctx.stroke();
  }
}

/** 石砌水井 */
export function drawWell(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, viewportWidth, viewportHeight);
  const hash = tileHash(x, y, 53);

  // 井底水面（微光）
  ctx.fillStyle = '#0c4a6e';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 1, TILE_HW * 0.5, TILE_HH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const glint = 0.4 + 0.3 * Math.sin(time * 2.4 + hash);
  ctx.fillStyle = `rgba(125, 211, 252, ${glint})`;
  ctx.beginPath();
  ctx.ellipse(s.x - 3, s.y, 4, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // 石砌井栏（体素环近似：矮八面块）
  isoBox(ctx, s.x, s.y, 9, '#94a3b8', '#64748b', '#475569');
  // 井口中空
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 9, TILE_HW * 0.34, TILE_HH * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();

  // 双柱 + 小顶棚
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.45, s.y - 8);
  ctx.lineTo(s.x - TILE_HW * 0.45, s.y - 26);
  ctx.moveTo(s.x + TILE_HW * 0.45, s.y - 8);
  ctx.lineTo(s.x + TILE_HW * 0.45, s.y - 26);
  ctx.stroke();

  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.62, s.y - 26);
  ctx.lineTo(s.x, s.y - 34);
  ctx.lineTo(s.x + TILE_HW * 0.62, s.y - 26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.fillRect(s.x - TILE_HW * 0.62, s.y - 27, TILE_WIDTH * 0.62, 2.5);

  // 吊桶（轻摆）
  const swing = Math.sin(time * 1.8 + hash) * 1.5;
  ctx.strokeStyle = '#44403c';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - 33);
  ctx.lineTo(s.x + swing, s.y - 18);
  ctx.stroke();
  ctx.fillStyle = '#7c5a3a';
  ctx.fillRect(s.x + swing - 3, s.y - 18, 6, 5);
}

/** 古老生态传送门：符文拱门 + 旋转星尘（通往随机未知生态区） */
export function drawBiomeGate(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, viewportWidth, viewportHeight);
  const hash = tileHash(x, y, 83);

  // 门内漩涡（旋转星尘 + 色相漂移）
  const swirl = time * 1.6 + hash * 0.01;
  for (let i = 0; i < 3; i++) {
    const hue = (time * 24 + i * 110 + hash % 120) % 360;
    ctx.strokeStyle = `hsla(${hue}, 80%, 62%, ${0.5 - i * 0.12})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 14, 13 - i * 3.4, 16 - i * 4, swirl + i, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 中心亮点
  const pulse = 0.6 + 0.4 * Math.sin(time * 3 + hash);
  ctx.fillStyle = `rgba(233, 213, 255, ${pulse})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y - 15, 3, 0, Math.PI * 2);
  ctx.fill();

  // 石拱门（左右立柱 + 顶梁）
  ctx.fillStyle = '#5b21b6';
  ctx.fillRect(s.x - TILE_HW * 0.72, s.y - 26, 6, 26);
  ctx.fillRect(s.x + TILE_HW * 0.72 - 6, s.y - 26, 6, 26);
  ctx.fillStyle = '#6d28d9';
  ctx.fillRect(s.x - TILE_HW * 0.78, s.y - 31, TILE_WIDTH * 0.78, 6);
  // 符文刻痕（微光）
  ctx.fillStyle = `rgba(216, 180, 254, ${0.5 + 0.4 * Math.sin(time * 2.2 + hash)})`;
  ctx.fillRect(s.x - TILE_HW * 0.66, s.y - 20, 3, 4);
  ctx.fillRect(s.x + TILE_HW * 0.62, s.y - 14, 3, 4);

  // 地面符环
  ctx.strokeStyle = `rgba(167, 139, 250, ${0.35 + 0.25 * pulse})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 2, 22, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** 边境传送门：青蓝符文拱门（通往前哨城塞） */
export function drawKeepGate(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  viewportWidth: number,
  viewportHeight: number
): void {
  const s = worldToScreen(x, y, 0, camX, camY, viewportWidth, viewportHeight);
  const hash = tileHash(x, y, 97);

  // 门内漩涡（青蓝顺旋）
  const swirl = -time * 1.3 + hash * 0.01;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = `rgba(56, 189, 248, ${0.55 - i * 0.13})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - 14, 13 - i * 3.4, 16 - i * 4, swirl + i * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  }
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.8 + hash);
  ctx.fillStyle = `rgba(224, 242, 254, ${pulse})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y - 15, 3, 0, Math.PI * 2);
  ctx.fill();

  // 石拱门（青灰）
  ctx.fillStyle = '#334155';
  ctx.fillRect(s.x - TILE_HW * 0.72, s.y - 26, 6, 26);
  ctx.fillRect(s.x + TILE_HW * 0.72 - 6, s.y - 26, 6, 26);
  ctx.fillStyle = '#475569';
  ctx.fillRect(s.x - TILE_HW * 0.78, s.y - 31, TILE_WIDTH * 0.78, 6);
  ctx.fillStyle = `rgba(125, 211, 252, ${0.5 + 0.4 * Math.sin(time * 2 + hash)})`;
  ctx.fillRect(s.x - TILE_HW * 0.66, s.y - 20, 3, 4);
  ctx.fillRect(s.x + TILE_HW * 0.62, s.y - 14, 3, 4);

  ctx.strokeStyle = `rgba(56, 189, 248, ${0.35 + 0.25 * pulse})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 2, 22, 10, 0, 0, Math.PI * 2);
  ctx.stroke();
}

