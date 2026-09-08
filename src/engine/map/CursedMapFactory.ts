import { TileType } from '../../types';
import { setTile } from './TileGrid';
import { BiomeCanvas, BiomeMeta, assembleBiomeFloor, createBiomeCanvas, findClearArea, placeBehemothLair, placeBiomeCamps, placeBiomeGates, placeBiomeShrines, placeKeepGate, scaledCount } from './BiomeMapKit';
import { DungeonFloor } from '../../types';

/**
 * CursedMapFactory — 咒怨林地 (Dreadmoor Grove)。
 *
 * 地貌：枯死的老树林、荒废墓园、
 * 闹鬼小教堂、游荡的磷火与哭嚎之风。
 */

const META: BiomeMeta = {
  zoneType: 'cursed',
  scatterKey: 'cursed',
  baseTile: 'grass',
  zoneName: '👻 咒怨林地 (Dreadmoor Grove)',
  description: '被诅咒吞噬的边境林地。枯树如骨般指向天空，墓碑间的低语诉说着不散的怨念。',
  weather: 'fog',
};

export function generateCursedMap(): DungeonFloor {
  const canvas = createBiomeCanvas(META);
  buildGraveyard(canvas);
  buildHauntedChapel(canvas);
  buildWispClearings(canvas);
  placeBiomeCamps(canvas, 2, 4);
  placeBiomeShrines(canvas, 1, 2);
  placeBiomeGates(canvas, 2);
  placeBehemothLair(canvas, canvas.rng.chance(0.5) ? 'the_hollow_conclave' : 'void_leviathan');
  placeKeepGate(canvas); // 🏰 前哨城塞传送门 // 👻 空壳议会巢穴
  return assembleBiomeFloor(canvas);
}

/** 荒废墓园：成排墓碑（pillar）+ 骨堆 + 掘冢宝箱 */
function buildGraveyard(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const yards = scaledCount(canvas, rng.int(2, 4));
  for (let i = 0; i < yards; i++) {
    const area = findClearArea(canvas, 9, 7);
    if (!area) continue;
    // 成排墓碑
    for (let dy = 1; dy < area.h - 1; dy += 2) {
      for (let dx = 1; dx < area.w - 1; dx += 2) {
        if (rng.chance(0.7)) {
          setTile(grid, area.x + dx, area.y + dy, 'pillar', (cur) => cur === meta.baseTile);
        }
      }
    }
    // 骨堆与盗墓者的战利品
    for (let s = 0; s < rng.int(2, 5); s++) {
      setTile(grid, area.x + rng.int(1, area.w - 2), area.y + rng.int(1, area.h - 2), 'bone_pile', (cur) => cur === meta.baseTile);
    }
    setTile(grid, area.x + area.w - 2, area.y + area.h - 2, 'chest', (cur) => cur === meta.baseTile);
  }
}

/** 闹鬼小教堂：尖顶建筑 + 墓园围栏 */
function buildHauntedChapel(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const area = findClearArea(canvas, 8, 6);
  if (!area) return;

  // 教堂主体
  for (let y = area.y; y < area.y + area.h; y++) {
    for (let x = area.x; x < area.x + area.w; x++) {
      const isEdge = y === area.y || y === area.y + area.h - 1 || x === area.x || x === area.x + area.w - 1;
      grid[y][x] = isEdge ? 'building' : 'floor';
    }
  }
  // 塔尖（北端凸出）
  const cx = area.x + Math.floor(area.w / 2);
  setTile(grid, cx, area.y - 1, 'building', (cur) => cur === meta.baseTile);
  grid[area.y + area.h - 1][cx] = 'door';

  // 内部：圣坛与祭器
  setTile(grid, cx, area.y + 2, 'shrine', (cur) => cur === 'floor');
  if (rng.chance(0.7)) {
    setTile(grid, cx - 2, area.y + 2, 'chest', (cur) => cur === 'floor');
  }
}

/** 磷火空地：枯树环 + 怨灵祭坛 */
function buildWispClearings(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const clearings = scaledCount(canvas, rng.int(3, 7));
  for (let i = 0; i < clearings; i++) {
    const cx = rng.int(6, canvas.width - 6);
    const cy = rng.int(6, canvas.height - 6);
    const radius = rng.int(2, 4);
    // 枯树环
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      setTile(grid, Math.round(cx + Math.cos(rad) * radius), Math.round(cy + Math.sin(rad) * radius * 0.6), 'dead_tree', (cur) => cur === meta.baseTile);
    }
    // 环心骨堆或神龛
    const centerTile: TileType = rng.chance(0.5) ? 'bone_pile' : 'shrine';
    setTile(grid, cx, cy, centerTile, (cur) => cur === meta.baseTile);
  }
}
