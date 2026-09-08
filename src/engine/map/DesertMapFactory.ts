import { TileType } from '../../types';
import { setTile } from './TileGrid';
import { BiomeCanvas, BiomeMeta, assembleBiomeFloor, createBiomeCanvas, findClearArea, placeBehemothLair, placeBiomeCamps, placeBiomeGates, placeBiomeShrines, placeKeepGate, scaledCount } from './BiomeMapKit';
import { DungeonFloor } from '../../types';

/**
 * DesertMapFactory — 烈日沙漠（Sunscorch Desert）。
 *
 * 地貌：起伏沙丘与风纹、半埋的远古石柱阵、
 * 法老陵墓金字塔、仙人掌灌丛与绿洲泉眼。沙暴掩埋道路。
 */

const META: BiomeMeta = {
  zoneType: 'desert',
  scatterKey: 'desert',
  baseTile: 'sand',
  zoneName: '🏜️ 烈日沙漠 (Sunscorch Desert)',
  description: '灼热的金色沙海。远古王朝的陵墓半埋于沙丘之下，绿洲是旅人唯一的指望。',
  weather: 'clear',
};

export function generateDesertMap(): DungeonFloor {
  const canvas = createBiomeCanvas(META);
  carveDuneRidges(canvas);
  buildBuriedPillars(canvas);
  buildPyramidTomb(canvas);
  buildOasis(canvas);
  placeCacti(canvas);
  placeBiomeCamps(canvas, 2, 4);
  placeBiomeShrines(canvas, 1, 2);
  placeBiomeGates(canvas, 2);
  placeBehemothLair(canvas, canvas.rng.chance(0.5) ? 'chimera' : 'dune_leviathan');
  placeKeepGate(canvas); // 🏰 前哨城塞传送门 // 🦁 沙漠奇美拉巢穴
  return assembleBiomeFloor(canvas);
}

/** 沙丘脊线：裸岩与硬沙交错 */
function carveDuneRidges(canvas: BiomeCanvas): void {
  const { grid, width, height, rng, meta } = canvas;
  const ridges = scaledCount(canvas, rng.int(3, 6));
  for (let i = 0; i < ridges; i++) {
    let x = rng.int(6, width - 6);
    let y = rng.int(8, height - 10);
    const len = rng.weightedSize(6, 14);
    for (let s = 0; s < len; s++) {
      // 脊线上的半埋岩石
      if (rng.chance(0.3)) {
        setTile(grid, x, y, 'pebble');
      }
      x += rng.int(-1, 2);
      y += rng.chance(0.6) ? 1 : -1;
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) break;
    }
  }
  void meta;
}

/** 半埋石柱阵（远古王朝遗迹） */
function buildBuriedPillars(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const fields = scaledCount(canvas, rng.int(3, 5));
  for (let i = 0; i < fields; i++) {
    const area = findClearArea(canvas, 7, 6);
    if (!area) continue;
    // 阵列式排布，随机残缺
    for (let dy = 1; dy < area.h - 1; dy += 2) {
      for (let dx = 1; dx < area.w - 1; dx += 2) {
        if (rng.chance(0.65)) {
          setTile(grid, area.x + dx, area.y + dy, 'pillar', (cur) => cur === meta.baseTile);
        }
      }
    }
    // 阵心宝箱
    setTile(grid, area.x + Math.floor(area.w / 2), area.y + Math.floor(area.h / 2), 'chest', (cur) => cur === meta.baseTile);
  }
}

/** 法老金字塔陵墓：巨型建筑 + 密室入口 */
function buildPyramidTomb(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const area = findClearArea(canvas, 9, 9);
  if (!area) return;

  const cx = area.x + Math.floor(area.w / 2);
  const cy = area.y + Math.floor(area.h / 2);
  // 阶梯状金字塔轮廓
  for (let ring = 4; ring >= 0; ring--) {
    const half = ring * 2;
    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const isEdge = Math.abs(dx) === half || Math.abs(dy) === half;
        if (!isEdge) continue;
        const tx = cx + dx;
        const ty = cy + dy;
        setTile(grid, tx, ty, 'building', (cur) => cur === meta.baseTile);
      }
    }
  }
  // 陵墓入口与封印宝箱
  setTile(grid, cx, cy + 8, 'door', (cur) => cur === meta.baseTile);
  setTile(grid, cx, cy, 'chest', (cur) => cur === 'building');
  void rng;
}

/** 绿洲：泉眼 + 棕榈 + 补给 */
function buildOasis(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const area = findClearArea(canvas, 7, 6);
  if (!area) return;

  const cx = area.x + Math.floor(area.w / 2);
  const cy = area.y + Math.floor(area.h / 2);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      setTile(grid, cx + dx, cy + dy, 'water', (cur) => cur === meta.baseTile);
    }
  }
  // 棕榈（树瓦片）
  for (const [dx, dy] of [[-3, -1], [3, 0], [-2, 2], [3, 2]] as const) {
    setTile(grid, cx + dx, cy + dy, 'tree', (cur) => cur === meta.baseTile);
  }
  if (rng.chance(0.7)) {
    setTile(grid, cx + 1, cy - 2, 'chest', (cur) => cur === meta.baseTile);
  }
}

/** 仙人掌灌丛 */
function placeCacti(canvas: BiomeCanvas): void {
  const { grid, width, height, rng, meta } = canvas;
  const clusters = scaledCount(canvas, rng.int(4, 8));
  for (let i = 0; i < clusters; i++) {
    const cx = rng.int(4, width - 4);
    const cy = rng.int(4, height - 4);
    const count = rng.int(2, 5);
    for (let s = 0; s < count; s++) {
      setTile(grid, cx + rng.int(-2, 3), cy + rng.int(-2, 3), 'cactus', (cur) => cur === meta.baseTile);
    }
  }
}
