import { TileType } from '../../types';
import { setTile } from './TileGrid';
import { BiomeCanvas, BiomeMeta, assembleBiomeFloor, createBiomeCanvas, findClearArea, placeBehemothLair, placeBiomeCamps, placeBiomeGates, placeBiomeShrines, placeKeepGate, scaledCount } from './BiomeMapKit';
import { DungeonFloor } from '../../types';

/**
 * MushroomMapFactory — 荧光蘑菇林 (Glowcap Glade)。
 *
 * 地貌：参天巨型发光蘑菇、孢子雾霭、
 * 蘑菇仙女环（法阵神龛）、腐烂巨木与菌毯小径。
 */

const META: BiomeMeta = {
  zoneType: 'mushroom',
  scatterKey: 'mushroom',
  baseTile: 'grass',
  zoneName: '🍄 荧光蘑菇林 (Glowcap Glade)',
  description: '永恒黄昏下的真菌国度。巨大的菌伞散发着迷离辉光，孢子如星尘般飘落。',
  weather: 'fog',
};

export function generateMushroomMap(): DungeonFloor {
  const canvas = createBiomeCanvas(META);
  buildGiantGroves(canvas);
  buildFairyRings(canvas);
  buildRottingLogCamp(canvas);
  placeBiomeCamps(canvas, 2, 3);
  placeBiomeShrines(canvas, 1, 3);
  placeBiomeGates(canvas, 2);
  placeBehemothLair(canvas, canvas.rng.chance(0.5) ? 'sporeheart_titan' : 'mycelium_tyrant');
  placeKeepGate(canvas); // 🏰 前哨城塞传送门 // 🍄 孢子之心巨像巢穴
  return assembleBiomeFloor(canvas);
}

/** 巨菇林带：成片参天蘑菇（散布层补充小型蘑菇） */
function buildGiantGroves(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const groves = scaledCount(canvas, rng.int(4, 8));
  for (let i = 0; i < groves; i++) {
    const area = findClearArea(canvas, 7, 7);
    if (!area) continue;
    const count = rng.int(5, 9);
    for (let s = 0; s < count; s++) {
      setTile(grid, area.x + rng.int(0, area.w - 1), area.y + rng.int(0, area.h - 1), 'giant_mushroom', (cur) => cur === meta.baseTile);
    }
  }
}

/** 蘑菇仙女环：环形菌圈中央的法阵神龛 */
function buildFairyRings(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const rings = scaledCount(canvas, rng.int(2, 4));
  for (let i = 0; i < rings; i++) {
    const cx = rng.int(8, canvas.width - 8);
    const cy = rng.int(8, canvas.height - 8);
    const radius = rng.int(3, 5);
    // 菌圈（小蘑菇环）
    for (let deg = 0; deg < 360; deg += 18) {
      const rad = (deg * Math.PI) / 180;
      setTile(grid, Math.round(cx + Math.cos(rad) * radius), Math.round(cy + Math.sin(rad) * radius * 0.6), 'mushroom', (cur) => cur === meta.baseTile);
    }
    // 环心神龛 + 宝藏
    setTile(grid, cx, cy, 'shrine', (cur) => cur === meta.baseTile);
    if (rng.chance(0.5)) {
      setTile(grid, cx + 1, cy + 1, 'chest', (cur) => cur === meta.baseTile);
    }
  }
}

/** 腐木营地：倾倒巨木 + 菌商货箱 */
function buildRottingLogCamp(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const area = findClearArea(canvas, 8, 4);
  if (!area) return;

  // 倾倒巨木（横排 pillar 模拟）
  for (let dx = 0; dx < area.w - 1; dx++) {
    setTile(grid, area.x + dx, area.y + 1, 'pillar', (cur) => cur === meta.baseTile);
  }
  // 货箱
  for (let i = 0; i < rng.int(2, 4); i++) {
    setTile(grid, area.x + rng.int(0, area.w - 1), area.y + rng.int(2, area.h - 1), 'barrel', (cur) => cur === meta.baseTile);
  }
  if (rng.chance(0.6)) {
    setTile(grid, area.x + rng.int(1, area.w - 2), area.y + area.h - 1, 'chest', (cur) => cur === meta.baseTile);
  }
}
