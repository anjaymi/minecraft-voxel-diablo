import { NPC } from '../../types';

/**
 * NpcHumanoidRenderer — NPC 等身 chibi 人形渲染。
 *
 * 替代旧的"色块+图标"占位：头/发/脸/袍/手/脚完整人形，
 * 呼吸与手臂摆动动画，按职业绘制专属服饰细节。
 * 坐标系原点在脚底中心（由 drawNPC 完成位移）。
 */

interface NpcPalette {
  skin: string;
  hair: string;
  robe: string;
  trim: string;
  legs: string;
}

/** 职业配色：袍色跟随 npc.color 保证辨识度，发肤做职业差异 */
function paletteFor(npc: NPC): NpcPalette {
  switch (npc.type) {
    case 'blacksmith':
      return { skin: '#e8b48a', hair: '#4a3626', robe: npc.color, trim: '#3a2c20', legs: '#3a3a42' };
    case 'healer':
      return { skin: '#f0c8a0', hair: '#e8d878', robe: npc.color, trim: '#f8f4e8', legs: '#d8d0c0' };
    case 'guide':
      return { skin: '#e0b088', hair: '#2a5a8a', robe: npc.color, trim: '#8ac8f0', legs: '#4a5a6a' };
    case 'class_master':
      return { skin: '#eec098', hair: '#d8d8f0', robe: npc.color, trim: '#e8c8f8', legs: '#4a3868' };
    case 'scholar':
    case 'survivor':
      return { skin: '#e8bc94', hair: '#6a4a32', robe: npc.color, trim: '#c8a86a', legs: '#5a5248' };
    case 'innkeeper':
      return { skin: '#f0c090', hair: '#8a4a2a', robe: npc.color, trim: '#f8e8c8', legs: '#5a3a2a' };
    case 'enchanter':
      return { skin: '#ecc8a8', hair: '#c8b8f8', robe: npc.color, trim: '#e8d8f8', legs: '#3a2a5a' };
    case 'alchemist':
      return { skin: '#e8bc94', hair: '#7aa83a', robe: npc.color, trim: '#d8e8a8', legs: '#4a5a2a' };
    case 'bard':
      return { skin: '#f0c8a0', hair: '#e87a9a', robe: npc.color, trim: '#f8d8e8', legs: '#8a4a6a' };
    case 'lord':
      return { skin: '#e8b890', hair: '#b8a878', robe: npc.color, trim: '#c83848', legs: '#5a3a1a' };
    case 'guard':
      return { skin: '#e0b088', hair: '#3a3a42', robe: npc.color, trim: '#94a3b8', legs: '#3a4250' };
    case 'child':
      return { skin: '#f4ccA4', hair: '#8a5a2a', robe: npc.color, trim: '#fef3c7', legs: '#6a5a4a' };
    default:
      return { skin: '#e8bc94', hair: '#4a3828', robe: npc.color, trim: '#f0e8d8', legs: '#4a4a52' };
  }
}

/** 主入口：绘制人形 NPC（bob 由外层传入保持与名牌同步） */
export function drawNpcHumanoid(ctx: CanvasRenderingContext2D, npc: NPC, time: number, bob: number): void {
  const p = paletteFor(npc);
  const breathe = Math.sin(time * 2.4 + npc.x * 1.3);
  const armSway = Math.sin(time * 1.8 + npc.x) * 1.2;

  ctx.save();
  ctx.translate(0, bob);

  // 小孩体型 75%
  if (npc.type === 'child') {
    ctx.scale(0.75, 0.75);
  }

  // 人生模拟状态图标：睡眠 💤 / 演奏 🎵
  if (npc.activity === 'sleep') {
    ctx.fillStyle = 'rgba(186, 230, 253, 0.9)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const zy = -50 + Math.sin(time * 1.5) * 2;
    ctx.fillText('💤', 6, zy);
  } else if (npc.activity === 'perform') {
    ctx.fillStyle = 'rgba(244, 114, 182, 0.9)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('♪', -10, -40 + Math.sin(time * 3) * 2);
  }

  // 脚/腿
  ctx.fillStyle = p.legs;
  roundedRect(ctx, -5.5, -7, 4.5, 8, 2);
  roundedRect(ctx, 1, -7, 4.5, 8, 2);

  // 袍身（呼吸微缩放）
  const bodySquash = 1 + breathe * 0.02;
  ctx.save();
  ctx.scale(1, bodySquash);
  ctx.fillStyle = p.robe;
  roundedRect(ctx, -8, -22, 16, 16.5, 5);
  ctx.fill();
  // 袍摆收口
  ctx.fillStyle = shade(p.robe, -0.18);
  roundedRect(ctx, -8, -10.5, 16, 4.5, 3);
  // 中缝衣领
  ctx.fillStyle = p.trim;
  ctx.fillRect(-1, -21, 2, 12);
  ctx.restore();

  // 手臂（左右交替微摆）
  ctx.fillStyle = shade(p.robe, -0.1);
  roundedRect(ctx, -10.5, -20 + armSway, 3.6, 10, 2);
  roundedRect(ctx, 6.9, -20 - armSway, 3.6, 10, 2);
  // 手
  ctx.fillStyle = p.skin;
  ctx.beginPath();
  ctx.arc(-8.7, -9.6 + armSway, 1.8, 0, Math.PI * 2);
  ctx.arc(8.7, -9.6 - armSway, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 头部（大头 chibi 比例）
  drawHead(ctx, p, breathe);

  // 职业专属细节
  drawProfessionProps(ctx, npc, p, time);

  ctx.restore();
}

function drawHead(ctx: CanvasRenderingContext2D, p: NpcPalette, breathe: number): void {
  const headBob = breathe * 0.4;
  ctx.save();
  ctx.translate(0, headBob);

  // 脖颈
  ctx.fillStyle = shade(p.skin, -0.15);
  ctx.fillRect(-2, -26.5, 4, 3);

  // 脸
  ctx.fillStyle = p.skin;
  roundedRect(ctx, -6.5, -37, 13, 11.5, 4);
  // 头发（覆盖头顶 + 侧缘）
  ctx.fillStyle = p.hair;
  roundedRect(ctx, -7.3, -38.5, 14.6, 6.5, 4);
  ctx.fillRect(-7.3, -35, 2, 5);
  ctx.fillRect(5.3, -35, 2, 5);
  // 眼睛与嘴
  ctx.fillStyle = '#2a2a34';
  ctx.beginPath();
  ctx.arc(-2.6, -31.5, 1.05, 0, Math.PI * 2);
  ctx.arc(2.6, -31.5, 1.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = shade(p.skin, -0.4);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(0, -29.4, 1.6, 0.25 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

/** 职业专属道具与服饰细节 */
function drawProfessionProps(
  ctx: CanvasRenderingContext2D,
  npc: NPC,
  p: NpcPalette,
  time: number
): void {
  switch (npc.type) {
    case 'blacksmith': {
      // 围裙 + 炽热锻锤
      ctx.fillStyle = p.trim;
      roundedRect(ctx, -4.5, -19, 9, 12, 2);
      ctx.fillStyle = '#f0884a';
      ctx.fillRect(-10.2, -11 + 0, 2.6, 2.6); // 左手锤头微光
      break;
    }
    case 'healer': {
      // 头顶光环
      ctx.strokeStyle = 'rgba(252, 220, 112, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -42, 6.5, 2, Math.sin(time * 1.2) * 0.15, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'guide': {
      // 手杖 + 斗篷披领
      ctx.strokeStyle = '#7a5a38';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(9.5, -8);
      ctx.lineTo(9.5, -30);
      ctx.stroke();
      ctx.fillStyle = shade(p.robe, 0.2);
      roundedRect(ctx, -8.5, -23, 17, 4, 2);
      break;
    }
    case 'class_master': {
      // 头顶悬浮奥术宝珠
      const orbY = -44 + Math.sin(time * 2.2) * 1.6;
      const glow = 0.55 + 0.35 * Math.sin(time * 3.1);
      ctx.fillStyle = `rgba(216, 180, 254, ${glow * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, orbY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d8b4fe';
      ctx.beginPath();
      ctx.arc(0, orbY, 2.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'scholar':
    case 'survivor': {
      // 肩挎书袋 + 手中典籍
      ctx.strokeStyle = '#8a6a3a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-6, -20);
      ctx.lineTo(6, -9);
      ctx.stroke();
      ctx.fillStyle = '#a84a3a';
      roundedRect(ctx, 6.2, -12.5, 5.5, 4.2, 1);
      break;
    }
    case 'innkeeper': {
      // 腰间钥匙串 + 围裙
      ctx.fillStyle = '#f8e8c8';
      roundedRect(ctx, -4, -16, 8, 8, 2);
      ctx.fillStyle = '#d8b848';
      ctx.beginPath();
      ctx.arc(7.5, -12, 1.6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'enchanter': {
      // 符文尖帽 + 漂浮符文
      ctx.fillStyle = shade(p.robe, -0.2);
      ctx.beginPath();
      ctx.moveTo(-7, -38);
      ctx.lineTo(7, -38);
      ctx.lineTo(0, -48);
      ctx.closePath();
      ctx.fill();
      const rune = 0.5 + 0.4 * Math.sin(time * 2.4);
      ctx.fillStyle = `rgba(216, 180, 254, ${rune})`;
      ctx.fillRect(-1.2, -45 + Math.sin(time * 3) * 1.5, 2.4, 2.4);
      break;
    }
    case 'alchemist': {
      // 腰带药瓶
      ctx.fillStyle = '#68c878';
      roundedRect(ctx, -8.5, -13, 3, 4, 1);
      ctx.fillStyle = '#e88848';
      roundedRect(ctx, 5.5, -13, 3, 4, 1);
      break;
    }
    case 'bard': {
      // 羽毛帽 + 怀抱鲁特琴
      ctx.fillStyle = '#f8f8f8';
      ctx.beginPath();
      ctx.ellipse(4.5, -40, 1.6, 3.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a86a3a';
      roundedRect(ctx, -6.5, -18, 13, 4.5, 2);
      ctx.strokeStyle = '#7a4a28';
      ctx.lineWidth = 0.9;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3, -17.5);
        ctx.lineTo(i * 3, -14);
        ctx.stroke();
      }
      break;
    }
    case 'lord': {
      // 金冠 + 披风
      ctx.fillStyle = '#c83848';
      ctx.beginPath();
      ctx.moveTo(-8, -24);
      ctx.lineTo(-11, -6);
      ctx.lineTo(-5, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f0c838';
      roundedRect(ctx, -6.5, -39.5, 13, 3, 1);
      ctx.beginPath();
      ctx.moveTo(-4.5, -39.5);
      ctx.lineTo(-3, -42.5);
      ctx.lineTo(-1.5, -39.5);
      ctx.moveTo(1.5, -39.5);
      ctx.lineTo(3, -42.5);
      ctx.lineTo(4.5, -39.5);
      ctx.fill();
      break;
    }
    case 'guard': {
      // 头盔 + 长矛
      ctx.fillStyle = '#94a3b8';
      roundedRect(ctx, -7, -38.5, 14, 6, 3);
      ctx.fillRect(-7, -34, 2, 3);
      ctx.fillRect(5, -34, 2, 3);
      ctx.strokeStyle = '#7a5a38';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(10, -6);
      ctx.lineTo(10, -38);
      ctx.stroke();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(8.2, -38);
      ctx.lineTo(11.8, -38);
      ctx.lineTo(10, -44);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** 颜色明度调整（简单 HSL 亮度偏移的 RGB 近似） */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(((n >> 16) & 255) + Math.round(255 * amount));
  const g = clamp(((n >> 8) & 255) + Math.round(255 * amount));
  const b = clamp((n & 255) + Math.round(255 * amount));
  return `rgb(${r}, ${g}, ${b})`;
}
