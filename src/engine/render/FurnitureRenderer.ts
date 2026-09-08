import { Ctx, TILE_HW, TILE_HH, diamondPath, isoBox, tileHash } from './IsoPrimitives';
import { worldToScreen } from '../isometric';

/**
 * FurnitureRenderer — 城镇家具体素化渲染（床 / 桌 / 柜台 / 集市摊位）。
 *
 * 统一规范：
 *  - 接地部件一律落在瓦片菱形内（中心 s.x, s.y），先铺柔和阴影椭圆；
 *  - 表面件与立件用等距菱形/椭圆表达体积，遵从西北光源；
 *  - 细节（枕头/叠被/酒具/货品）控制在小体量，不干扰地面辨识。
 */

function softShadow(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, alpha = 0.3): void {
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 旅店床铺：木框矮台 + 床垫顶面 + 枕头 + 叠被 */
export function drawBed(
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
  const hash = tileHash(x, y, 71);
  const depth = 10;

  softShadow(ctx, s.x, s.y + 2, 19, 8, 0.3);

  // 床架矮台：侧面露出木色，顶面即床垫
  isoBox(ctx, s.x, s.y, depth, '#e8dfc8', '#8a6a42', '#5f4326');

  // 顶面装饰（裁剪到床垫菱形内）
  const cy = s.y - depth;
  ctx.save();
  diamondPath(ctx, s.x, cy, TILE_HW * 0.94, TILE_HH * 0.94);
  ctx.clip();

  // 床单
  ctx.fillStyle = '#f4efe1';
  ctx.beginPath();
  diamondPath(ctx, s.x, cy, TILE_HW * 0.94, TILE_HH * 0.94);
  ctx.fill();

  // 叠被：下半幅菱形
  const blankets = ['#b91c1c', '#1d4ed8', '#15803d', '#7c2d12'];
  ctx.fillStyle = blankets[hash % blankets.length];
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.92, cy);
  ctx.lineTo(s.x, cy + TILE_HH * 0.88);
  ctx.lineTo(s.x + TILE_HW * 0.92, cy);
  ctx.closePath();
  ctx.fill();
  // 被沿翻折亮线
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.88, cy + 0.5);
  ctx.lineTo(s.x, cy + TILE_HH * 0.32);
  ctx.lineTo(s.x + TILE_HW * 0.88, cy + 0.5);
  ctx.stroke();
  // 被面中缝
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.moveTo(s.x, cy + TILE_HH * 0.34);
  ctx.lineTo(s.x, cy + TILE_HH * 0.76);
  ctx.stroke();

  // 枕头：贴床头（菱形上顶点侧）
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(s.x, cy - TILE_HH * 0.42, TILE_HW * 0.42, TILE_HH * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(148,163,184,0.55)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(s.x, cy - TILE_HH * 0.42, TILE_HW * 0.42, TILE_HH * 0.28, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(203,213,225,0.9)';
  ctx.beginPath();
  ctx.moveTo(s.x, cy - TILE_HH * 0.68);
  ctx.lineTo(s.x, cy - TILE_HH * 0.16);
  ctx.stroke();

  // 床垫车缝贴边
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  diamondPath(ctx, s.x, cy, TILE_HW * 0.94, TILE_HH * 0.94);
  ctx.stroke();
  ctx.restore();

  void time;
}

/** 柜台/吧台：实木台体 + 台面高光与木纹 */
export function drawCounter(
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
  const depth = 14;

  softShadow(ctx, s.x, s.y + 2, 22, 10, 0.3);
  isoBox(ctx, s.x, s.y, depth, '#b08756', '#8a5f38', '#5f3f22');

  // 台面木纹（沿对角浅亮缝）
  const cy = s.y - depth;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.7, cy + 0.5);
  ctx.lineTo(s.x + TILE_HW * 0.48, cy - TILE_HH * 0.18);
  ctx.moveTo(s.x - TILE_HW * 0.7, cy + 2.6);
  ctx.lineTo(s.x + TILE_HW * 0.48, cy - TILE_HH * 0.18 + 2.4);
  ctx.stroke();
  // 台面受光边
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.94, cy);
  ctx.lineTo(s.x, cy - TILE_HH * 0.94);
  ctx.stroke();
  // 前立面柜线（下沿压边）
  ctx.strokeStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.moveTo(s.x - TILE_HW * 0.9, s.y - 2);
  ctx.lineTo(s.x, s.y + TILE_HH * 0.5 - 2);
  ctx.lineTo(s.x + TILE_HW * 0.9, s.y - 2);
  ctx.stroke();

  void time;
}

/** 酒馆圆桌：底柱 + 圆台面 + 麦酒杯 */
export function drawTable(
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
  const hash = tileHash(x, y, 103);

  softShadow(ctx, s.x, s.y + 3, 15, 7, 0.32);

  // 桌柱
  ctx.fillStyle = '#6b4f2e';
  ctx.fillRect(s.x - 3.5, s.y - 6, 7, 10);
  ctx.fillStyle = '#4c3a22';
  ctx.fillRect(s.x + 0.5, s.y - 6, 3, 10);
  // 柱脚托
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 5, 7.5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 台面：深色底缘 + 亮色面板 + 高光
  ctx.fillStyle = '#4c3a22';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 13, 13.5, 6.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8824e';
  ctx.beginPath();
  ctx.ellipse(s.x, s.y - 15, 12, 5.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(s.x - 2.5, s.y - 16.5, 6.5, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 麦酒杯（偶发）
  if (hash % 3 === 0) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(s.x - 5.5, s.y - 20, 3.8, 4.6);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(s.x - 5.5, s.y - 20, 3.8, 1.3);
  }
  if (hash % 5 === 0) {
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(s.x + 2.5, s.y - 19.5, 3.2, 4.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(s.x + 2.5, s.y - 19.5, 3.2, 1.2);
  }
  void time;
}

/** 集市摊位：条纹篷 + 柜台货品 + 守夜小灯 */
export function drawMarketStall(
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
  const hash = tileHash(x, y, 101);
  const sway = Math.sin(time * 1.2 + hash * 0.01) * 1.1;

  softShadow(ctx, s.x, s.y + 5, 27, 11, 0.32);

  // 摊位侧货：木箱 + 陶罐
  ctx.fillStyle = '#7c5a3a';
  ctx.fillRect(s.x - 25, s.y - 2, 11, 9);
  ctx.fillStyle = '#a8824e';
  ctx.fillRect(s.x - 25, s.y - 2, 11, 2);
  ctx.strokeStyle = '#4a3520';
  ctx.lineWidth = 1;
  ctx.strokeRect(s.x - 25, s.y - 2, 11, 9);
  ctx.fillStyle = '#8a5a33';
  ctx.beginPath();
  ctx.arc(s.x + 20, s.y + 4, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6d3f1c';
  ctx.beginPath();
  ctx.arc(s.x + 20, s.y + 3, 3.4, 0, Math.PI * 2);
  ctx.fill();

  // 柜台货架与货品
  ctx.fillStyle = '#5f4326';
  ctx.fillRect(s.x - 24, s.y - 6, 48, 8);
  ctx.fillStyle = '#a8824e';
  ctx.fillRect(s.x - 24, s.y - 8.5, 48, 3.6);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(s.x - 24, s.y - 8.5, 48, 1.1);
  const goods = ['#ef4444', '#fbbf24', '#22c55e', '#c084fc'];
  const gc = goods[hash % goods.length];
  ctx.fillStyle = gc;
  ctx.beginPath();
  ctx.arc(s.x - 9, s.y - 9.5, 2.6, 0, Math.PI * 2);
  ctx.arc(s.x - 2, s.y - 10.5, 2.4, 0, Math.PI * 2);
  ctx.arc(s.x + 5, s.y - 9.8, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(s.x - 9, s.y - 7, 2.6, 1.1, 0, 0, Math.PI * 2);
  ctx.ellipse(s.x + 5, s.y - 7.3, 2.6, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // 双立柱
  const postTop = s.y - 24 + sway * 0.5;
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(s.x - 25.5, postTop, 3.6, s.y - 6 - postTop);
  ctx.fillRect(s.x + 21.9, postTop, 3.6, s.y - 6 - postTop);

  // 条纹篷（前倾篷面，随篷轻摆）
  const topY = s.y - 34 + sway * 0.4;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(s.x - 28, s.y - 20 + sway * 0.5);
  ctx.lineTo(s.x - 25, topY);
  ctx.lineTo(s.x + 25, topY);
  ctx.lineTo(s.x + 28, s.y - 20 + sway * 0.5);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = '#c93838';
  ctx.fillRect(s.x - 30, topY - 2, 60, 22);
  for (let i = 0; i < 6; i++) {
    if (i % 2 === 0) continue;
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(s.x - 26 + i * 9.4, topY - 2, 5, 22);
  }
  // 篷面明暗（西北受光）
  ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.fillRect(s.x - 30, topY - 2, 17, 22);
  ctx.fillStyle = 'rgba(0,0,0,0.17)';
  ctx.fillRect(s.x + 13, topY - 2, 17, 22);
  ctx.restore();

  // 篷沿压条 + 荷叶边
  ctx.fillStyle = '#c93838';
  ctx.fillRect(s.x - 28, s.y - 22 + sway * 0.5, 56, 4);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f2ead8' : '#c93838';
    ctx.beginPath();
    ctx.arc(s.x - 25 + i * 10, s.y - 18.5 + sway * 0.5 + (i % 2) * 1.6, 4.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 檐下垂灯（暖光呼吸）
  const pulse = 0.55 + 0.35 * Math.sin(time * 3 + hash * 0.01);
  ctx.fillStyle = `rgba(251, 191, 36, ${0.5 * pulse})`;
  ctx.beginPath();
  ctx.arc(s.x, s.y - 15, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(s.x - 2.6, s.y - 20, 5.2, 5.2);
  ctx.fillStyle = '#fef9c3';
  ctx.fillRect(s.x - 1.2, s.y - 18.6, 2.4, 2.4);
  ctx.strokeStyle = '#3f2d20';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y - 20);
  ctx.lineTo(s.x, s.y - 24);
  ctx.stroke();
}
