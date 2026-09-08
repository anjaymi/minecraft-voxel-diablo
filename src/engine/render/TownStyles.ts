import { DungeonFloor, TileType } from '../../types';

/**
 * TownStyles — 城镇服务性建筑的身份样式（旅店/酒馆/铁匠铺/神秘公会/民居）。
 *
 * 城镇里所有民居原先共用同一套"红顶方块"，铁匠铺/旅店/酒馆无从分辨。
 * 本模块以建筑内容物为锚点（床→旅店、桌→酒馆、祭坛→神秘公会、箱+柜台→铁匠铺），
 * 对墙体逐格做连通域标记，产出：
 *  - walls：每格墙/门所属建筑 + 专属调色板（屋顶/墙面色/窗光色/招牌字符）
 *  - woodFloors：旅店/酒馆室内可走地板（铺木板，与地牢石板区分）
 * 结果按 DungeonFloor 引用缓存（WeakMap），离开城镇自然失效。
 */

export type TownKind = 'house' | 'inn' | 'tavern' | 'forge' | 'mystic';

export interface TownPalette {
  roof: string;      // 屋顶（体素顶面）
  wallL: string;     // 左立面（受光面）
  wallR: string;     // 右立面（背光面）
  frame: string;     // 窗框/门框
  glass: string;     // 窗内暖光
  sign: string;      // 门头招牌字符（民居为空字符串 = 不挂）
}

export interface TownCellStyle {
  kind: TownKind;
  palette: TownPalette;
  isDoor: boolean;
}

export interface TownLook {
  walls: Map<number, TownCellStyle>;
  woodFloors: Set<number>;
}

const PALETTES: Record<TownKind, TownPalette> = {
  // 民居：赤陶屋顶 + 深色木墙（城镇原有配色，保持默认）
  house: { roof: '#b91c1c', wallL: '#78350f', wallR: '#451a03', frame: '#7c2d12', glass: '#fef08a', sign: '' },
  // 翡翠之月旅店：暖石粉墙 + 栗色屋顶 + 金窗
  inn: { roof: '#7c2d12', wallL: '#d8c8a8', wallR: '#a8987c', frame: '#8c6b3f', glass: '#fde68a', sign: '🛏️' },
  // 欢闹酒馆：深色瓦顶 + 琥珀木墙
  tavern: { roof: '#44403c', wallL: '#a16207', wallR: '#713f12', frame: '#78350f', glass: '#fbbf24', sign: '🍺' },
  // 铁匠铺：烟囱黑瓦 + 烟灰色墙 + 余烬窗
  forge: { roof: '#1c1917', wallL: '#57534e', wallR: '#292524', frame: '#451a03', glass: '#fb923c', sign: '⚒️' },
  // 神秘公会：靛蓝屋顶 + 秘蓝墙 + 紫光窗
  mystic: { roof: '#312e81', wallL: '#4338ca', wallR: '#312e81', frame: '#1e1b4b', glass: '#c084fc', sign: '🔮' },
};

/** 判定内容物 → 建筑身份的优先级表 */
const ANCHOR_ORDER: ReadonlyArray<readonly [TileType, TownKind]> = [
  ['bed', 'inn'],
  ['table', 'tavern'],
  ['shrine', 'mystic'],
  ['chest', 'forge'],
];

const keyOf = (x: number, y: number): number => y * 4096 + x;

const lookCache = new WeakMap<DungeonFloor, TownLook>();

/**
 * 取城镇建筑身份表（按 floor 引用缓存）。
 * 非城镇区域返回空表，调用方自然回退到默认配色，零开销。
 */
export function getTownLook(floor: DungeonFloor): TownLook {
  const cached = lookCache.get(floor);
  if (cached) return cached;

  const look: TownLook = { walls: new Map(), woodFloors: new Set() };
  if (floor.zoneType !== 'town') {
    lookCache.set(floor, look);
    return look;
  }

  const tiles = floor.tiles;
  const h = tiles.length;
  const w = tiles[0]?.length ?? 0;
  const visited = new Set<number>();

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (tiles[y][x] !== 'building' || visited.has(keyOf(x, y))) continue;

      // 洪水填充：收集一圈墙体的所有格
      const comp: Array<[number, number]> = [];
      const stack: Array<[number, number]> = [[x, y]];
      visited.add(keyOf(x, y));
      let minX = x, maxX = x, minY = y, maxY = y;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        comp.push([cx, cy]);
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;
            if (tiles[ny]?.[nx] !== 'building') continue;
            const nk = keyOf(nx, ny);
            if (visited.has(nk)) continue;
            visited.add(nk);
            stack.push([nx, ny]);
          }
        }
      }

      // 从房间内容物判定建筑身份（chest 仅作铁匠铺标志，柜台/酒桶见下方兜底）
      let kind: TownKind = 'house';
      for (const [anchor, k] of ANCHOR_ORDER) {
        let found = false;
        for (let iy = minY + 1; iy <= maxY - 1 && !found; iy++) {
          for (let ix = minX + 1; ix <= maxX - 1; ix++) {
            if (tiles[iy]?.[ix] === anchor) {
              found = true;
              break;
            }
          }
        }
        if (found) {
          kind = k;
          break;
        }
      }
      // 兜底：没有床/桌/祭坛/箱但有柜台与酒桶的，归为酒馆（防桌台随机缺席）
      if (kind === 'house') {
        for (let iy = minY + 1; iy <= maxY - 1 && kind === 'house'; iy++) {
          for (let ix = minX + 1; ix <= maxX - 1; ix++) {
            const t = tiles[iy]?.[ix];
            if (t === 'counter' || t === 'barrel') {
              kind = 'tavern';
              break;
            }
          }
        }
      }
      const palette = PALETTES[kind];

      // 木地板：旅店/酒馆室内（未来若缺锚点时保持 house 石地）
      if (kind === 'inn' || kind === 'tavern') {
        for (let iy = minY + 1; iy <= maxY - 1; iy++) {
          for (let ix = minX + 1; ix <= maxX - 1; ix++) {
            if (tiles[iy][ix] === 'floor') look.woodFloors.add(keyOf(ix, iy));
          }
        }
      }

      for (const [wx, wy] of comp) look.walls.set(keyOf(wx, wy), { kind, palette, isDoor: false });

      // 该建筑的门口：与墙 8 邻接的 door 格（含被家具占位前的开门口）
      for (let iy = minY - 1; iy <= maxY + 1; iy++) {
        for (let ix = minX - 1; ix <= maxX + 1; ix++) {
          const t = tiles[iy]?.[ix];
          if (t !== 'door') continue;
          const k = keyOf(ix, iy);
          if (look.walls.has(k)) continue;
          look.walls.set(k, { kind, palette, isDoor: true });
        }
      }
    }
  }

  lookCache.set(floor, look);
  return look;
}
