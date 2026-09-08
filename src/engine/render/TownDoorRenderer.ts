import { Ctx, tileHash } from './IsoPrimitives';
import { worldToScreen } from '../isometric';

/**
 * TownDoorRenderer — 城镇建筑大门渲染（门槛 + 半掩门板 + 门头招牌）。
 *
 * door 瓦片本身可通行（门口），门板只做半掩的视觉提示：
 *  - 门槛石台标示入口落点；
 *  - 门洞暖光呼吸（室内灯透出），旅店/酒馆/铁匠/公会各有色温；
 *  - 带身份的建筑在门梁下挂一盏小招牌（由 TownStyles 提供字符）。
 */

export interface DoorStyleLook {
  frame: string;   // 门框/招牌底色
  glass: string;   // 门洞暖光色
  sign: string;    // 招牌字符（空 = 不挂招牌）
}

const DEFAULT_DOOR: DoorStyleLook = { frame: '#78350f', glass: '#fde68a', sign: '' };

export function drawTownDoor(
  ctx: Ctx,
  x: number,
  y: number,
  time: number,
  camX: number,
  camY: number,
  vw: number,
  vh: number,
  style?: DoorStyleLook
): void {
  const s = worldToScreen(x, y, 0, camX, camY, vw, vh);
  const hash = tileHash(x, y, 131);
  const st = style ?? DEFAULT_DOOR;

  // 门槛：浅色石台（入口落点）
  ctx.fillStyle = '#a8a29e';
  ctx.beginPath();
  ctx.moveTo(s.x - 16, s.y - 1);
  ctx.lineTo(s.x, s.y + 5);
  ctx.lineTo(s.x + 16, s.y - 1);
  ctx.lineTo(s.x, s.y - 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#78716c';
  ctx.beginPath();
  ctx.moveTo(s.x - 16, s.y - 1);
  ctx.lineTo(s.x, s.y + 5);
  ctx.lineTo(s.x, s.y - 7);
  ctx.closePath();
  ctx.fill();

  // 门洞（暗口，右侧半掩的门板露出左侧暖光缝）
  const top = s.y - 26;
  const bottom = s.y - 3;
  ctx.fillStyle = 'rgba(12, 8, 5, 0.92)';
  ctx.beginPath();
  ctx.roundRect(s.x - 13, top, 26, bottom - top, 1.5);
  ctx.fill();
  // 门板（半掩、靠右，微微透视偏移）
  const jx0 = s.x + 1;
  const jx1 = s.x + 12.5;
  ctx.fillStyle = st.frame;
  ctx.beginPath();
  ctx.moveTo(jx0, top + 1);
  ctx.lineTo(jx1, top + 2);
  ctx.lineTo(jx1 + 2.5, bottom);
  ctx.lineTo(jx0 - 2.5, bottom - 1);
  ctx.closePath();
  ctx.fill();
  // 门板木板缝
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(jx0 + 2.6, top + 2.4);
  ctx.lineTo(jx0 + 0.4, bottom - 2.2);
  ctx.moveTo(jx0 + 5.8, top + 3);
  ctx.lineTo(jx0 + 3.6, bottom - 1.6);
  ctx.stroke();
  // 铁门环
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(jx0 + 2.2, (top + bottom) / 2, 2.2, 0, Math.PI * 2);
  ctx.stroke();
  // 左侧透出的暖光（呼吸）
  const pulse = 0.35 + 0.25 * Math.sin(time * 2.6 + hash * 0.01);
  const glow = ctx.createLinearGradient(s.x - 13, 0, jx0, 0);
  glow.addColorStop(0, `rgba(0,0,0,0)`);
  glow.addColorStop(1, st.glass);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = glow;
  ctx.fillRect(s.x - 13, top + 2, jx0 - (s.x - 13), bottom - top - 4);
  ctx.globalAlpha = 1;

  // 门梁 + 两侧小柱头
  ctx.fillStyle = st.frame;
  ctx.fillRect(s.x - 16, top - 4, 32, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(s.x - 16, top - 4, 32, 1.2);

  // 门头招牌（带身份的建筑）
  if (st.sign) {
    // 双链
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(s.x - 9, top - 4);
    ctx.lineTo(s.x - 9, top - 14);
    ctx.moveTo(s.x + 9, top - 4);
    ctx.lineTo(s.x + 9, top - 14);
    ctx.stroke();
    // 招牌板
    ctx.fillStyle = st.frame;
    ctx.beginPath();
    ctx.roundRect(s.x - 11, top - 14, 22, 13, 2.5);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.roundRect(s.x - 11, top - 14, 22, 3, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.roundRect(s.x - 11, top - 14, 22, 13, 2.5);
    ctx.stroke();
    // 招牌字符
    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff7ed';
    ctx.fillText(st.sign, s.x + 0.5, top - 7.5);
  }

  // 门口地光晕（夜间灯映）
  ctx.fillStyle = `rgba(253, 230, 138, ${0.1 + 0.08 * Math.sin(time * 2 + hash)})`;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y + 2, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}
