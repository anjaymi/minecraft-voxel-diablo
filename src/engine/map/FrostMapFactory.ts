import { TileType } from '../../types';
import { setTile, getTileAt, fillRect } from './TileGrid';
import { BiomeCanvas, BiomeMeta, assembleBiomeFloor, createBiomeCanvas, findClearArea, placeBehemothLair, placeBiomeCamps, placeBiomeGates, placeBiomeShrines, placeKeepGate, scaledCount } from './BiomeMapKit';
import { DungeonFloor } from '../../types';

/**
 * FrostMapFactory — 冰霜苔原（Frost Reaches）。
 *
 * 地貌：冻结湖面与冰裂、雪脊冰塔、寒松林带、
 * 冻毙商队遗骸（宝箱）。暴风雪期间能见度骤降。
 */

const META: BiomeMeta = {
  zoneType: 'frost',
  scatterKey: 'frost',
  baseTile: 'snow',
  zoneName: '❄️ 冰霜苔原 (Frost Reaches)',
  description: '极北的冰封荒原。冻湖在脚下呻吟，寒风卷着雪粒掠过冰塔，深处传来冰霜巨物的低吼。',
  weather: 'fog',
};

export function generateFrostMap(): DungeonFloor {
  const canvas = createBiomeCanvas(META);
  carveFrozenLake(canvas);
  buildIceSpires(canvas);
  buildFrozenCaravan(canvas);
  placeBiomeCamps(canvas, 2, 3);
  placeBiomeShrines(canvas, 1, 2);
  placeBiomeGates(canvas, 2);
  placeBehemothLair(canvas, canvas.rng.chance(0.5) ? 'frost_maw_ancient' : 'frost_leviathan');
  placeKeepGate(canvas); // 🏰 前哨城塞传送门 // ❄️ 霜喉上古巨兽巢穴
  return assembleBiomeFloor(canvas);
}

/** 冻结大湖：冰面可通行，局部裂开露出深水 */
function carveFrozenLake(canvas: BiomeCanvas): void {
  const { grid, width, height, rng } = canvas;
  const area = findClearArea(canvas, 12, 9);
  if (!area) return;

  for (let y = area.y; y < area.y + area.h; y++) {
    for (let x = area.x; x < area.x + area.w; x++) {
      grid[y][x] = 'ice';
    }
  }
  // 冰面裂缝：露出危险深水
  const cracks = rng.int(2, 5);
  for (let i = 0; i < cracks; i++) {
    let cx = rng.int(area.x + 1, area.x + area.w - 1);
    let cy = rng.int(area.y + 1, area.y + area.h - 1);
    const len = rng.weightedSize(3, 7);
    for (let s = 0; s < len; s++) {
      setTile(grid, cx, cy, 'water', (cur) => cur === 'ice');
      cx += rng.int(-1, 2);
      cy += rng.chance(0.6) ? 1 : rng.chance(0.5) ? -1 : 0;
      if (cx < area.x || cx >= area.x + area.w || cy < area.y || cy >= area.y + area.h) break;
    }
  }
  // 湖心冰封宝箱
  setTile(grid, area.x + Math.floor(area.w / 2), area.y + Math.floor(area.h / 2), 'chest', (cur) => cur === 'ice');
}

/** 冰脊尖塔群（障碍地标，寒风呜咽处） */
function buildIceSpires(canvas: BiomeCanvas): void {
  const { grid, width, height, rng, meta } = canvas;
  const clusters = scaledCount(canvas, rng.int(3, 6));
  for (let i = 0; i < clusters; i++) {
    const area = findClearArea(canvas, 4, 4);
    if (!area) continue;
    const count = rng.int(2, 4);
    for (let s = 0; s < count; s++) {
      const sx = area.x + rng.int(0, area.w - 1);
      const sy = area.y + rng.int(0, area.h - 1);
      setTile(grid, sx, sy, 'pillar', (cur) => cur === meta.baseTile);
    }
  }
  void width;
  void height;
}

/** 冻毙商队：木箱与货物散落（雪原补给点） */
function buildFrozenCaravan(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const area = findClearArea(canvas, 6, 4);
  if (!area) return;

  const goods: TileType[] = ['barrel', 'urn', 'chest'];
  for (let i = 0; i < rng.int(4, 7); i++) {
    const gx = area.x + rng.int(0, area.w - 1);
    const gy = area.y + rng.int(0, area.h - 1);
    const tile = goods[rng.int(0, goods.length)];
    setTile(grid, gx, gy, tile, (cur) => cur === meta.baseTile);
  }
}
