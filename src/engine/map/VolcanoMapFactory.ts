import { TileType } from '../../types';
import { setTile } from './TileGrid';
import { BiomeCanvas, BiomeMeta, assembleBiomeFloor, createBiomeCanvas, findClearArea, placeBehemothLair, placeBiomeCamps, placeBiomeGates, placeBiomeShrines, placeKeepGate, scaledCount } from './BiomeMapKit';
import { DungeonFloor } from '../../types';

/**
 * VolcanoMapFactory — 焦土火山（Cinder Caldeira）。
 *
 * 地貌：龟裂焦土与熔岩池、黑曜石棱柱场、
 * 火山锥体与喷气裂谷。空气灼热，灰烬如雪。
 */

const META: BiomeMeta = {
  zoneType: 'volcano',
  scatterKey: 'volcano',
  baseTile: 'scorched',
  zoneName: '🌋 焦土火山 (Cinder Caldeira)',
  description: '大地的伤口在燃烧。熔岩在龟裂的地壳下奔涌，黑曜石棱柱折射着不祥的红光。',
  weather: 'ash_storm',
};

export function generateVolcanoMap(): DungeonFloor {
  const canvas = createBiomeCanvas(META);
  carveLavaFields(canvas);
  buildObsidianField(canvas);
  buildVolcanoCone(canvas);
  placeBiomeCamps(canvas, 2, 4);
  placeBiomeShrines(canvas, 1, 2);
  placeBiomeGates(canvas, 2);
  placeBehemothLair(canvas, canvas.rng.chance(0.5) ? 'basalt_colossus' : 'magma_colossus');
  placeKeepGate(canvas); // 🏰 前哨城塞传送门 // 🌋 玄武岩巨像巢穴
  return assembleBiomeFloor(canvas);
}

/** 熔岩池群：危险地形（接触伤害由引擎判定 lava 瓦片） */
function carveLavaFields(canvas: BiomeCanvas): void {
  const { grid, width, height, rng, meta } = canvas;
  const pools = scaledCount(canvas, rng.int(4, 7));
  for (let i = 0; i < pools; i++) {
    const cx = rng.int(6, width - 6);
    const cy = rng.int(6, height - 6);
    const size = rng.weightedSize(3, 7);
    let x = cx;
    let y = cy;
    for (let s = 0; s < size * 3; s++) {
      setTile(grid, x, y, 'lava', (cur) => cur === meta.baseTile);
      // 熔岩边缘偶有黑曜石凝固壳
      if (rng.chance(0.25)) {
        setTile(grid, x + rng.int(-1, 2), y + rng.int(-1, 2), 'pillar', (cur) => cur === meta.baseTile);
      }
      x += rng.int(-1, 2);
      y += rng.int(-1, 2);
    }
  }
}

/** 黑曜石棱柱场：成排玻璃质黑柱 */
function buildObsidianField(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const fields = scaledCount(canvas, rng.int(3, 5));
  for (let i = 0; i < fields; i++) {
    const area = findClearArea(canvas, 6, 5);
    if (!area) continue;
    for (let dy = 0; dy < area.h; dy += 2) {
      for (let dx = 0; dx < area.w; dx += 2) {
        if (rng.chance(0.7)) {
          setTile(grid, area.x + dx, area.y + dy, 'pillar', (cur) => cur === meta.baseTile);
        }
      }
    }
    if (rng.chance(0.5)) {
      setTile(grid, area.x + 1, area.y + 1, 'chest', (cur) => cur === meta.baseTile);
    }
  }
}

/** 火山锥：中央隆起的环形石山，火山口藏宝 */
function buildVolcanoCone(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const area = findClearArea(canvas, 11, 11);
  if (!area) return;

  const cx = area.x + Math.floor(area.w / 2);
  const cy = area.y + Math.floor(area.h / 2);
  // 环形山体（wall 圈 + 唯一南口）
  for (let ring = 3; ring <= 5; ring++) {
    for (let deg = 0; deg < 360; deg += 6) {
      const rad = (deg * Math.PI) / 180;
      const tx = Math.round(cx + Math.cos(rad) * ring);
      const ty = Math.round(cy + Math.sin(rad) * ring * 0.6);
      if (ring === 5 && deg > 60 && deg < 120) continue; // 南口
      setTile(grid, tx, ty, 'wall', (cur) => cur === meta.baseTile);
    }
  }
  // 火山口：熔岩之心 + 稀有宝箱
  setTile(grid, cx, cy, 'lava');
  setTile(grid, cx - 2, cy + 2, 'chest', (cur) => cur === meta.baseTile);
  void rng;
}
