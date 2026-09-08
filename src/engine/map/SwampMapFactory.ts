import { TileType } from '../../types';
import { setTile } from './TileGrid';
import { BiomeCanvas, BiomeMeta, assembleBiomeFloor, createBiomeCanvas, findClearArea, placeBehemothLair, placeBiomeCamps, placeBiomeGates, placeBiomeShrines, placeKeepGate, scaledCount } from './BiomeMapKit';
import { DungeonFloor } from '../../types';

/**
 * SwampMapFactory — 腐雾沼泽 (Mirewood Fen)。
 *
 * 地貌：浑浊的沼池与朽木栈道、半淹的猎人居所、
 * 巫婆药庐、雾中磷火。每一步都可能陷入泥潭。
 */

const META: BiomeMeta = {
  zoneType: 'swamp',
  scatterKey: 'swamp',
  baseTile: 'grass',
  zoneName: '🐊 腐雾沼泽 (Mirewood Fen)',
  description: '腐水与浓雾缠绕的低地。枯枝间悬着磷火，沼面下有什么东西在缓缓游动。',
  weather: 'fog',
};

export function generateSwampMap(): DungeonFloor {
  const canvas = createBiomeCanvas(META);
  carveMurkBogs(canvas);
  buildWitchHuts(canvas);
  buildBoardwalks(canvas);
  placeBiomeCamps(canvas, 2, 4);
  placeBiomeShrines(canvas, 1, 2);
  placeBiomeGates(canvas, 2);
  placeBehemothLair(canvas, canvas.rng.chance(0.5) ? 'mire_behemoth' : 'bog_titan');
  placeKeepGate(canvas); // 🏰 前哨城塞传送门 // 🐊 泥沼巨兽巢穴
  return assembleBiomeFloor(canvas);
}

/** 浊水沼池群：缓速浅水（murkwater 可通行） */
function carveMurkBogs(canvas: BiomeCanvas): void {
  const { grid, width, height, rng, meta } = canvas;
  const bogs = scaledCount(canvas, rng.int(6, 11));
  for (let i = 0; i < bogs; i++) {
    const cx = rng.int(5, width - 5);
    const cy = rng.int(5, height - 5);
    const size = rng.weightedSize(3, 8);
    let x = cx;
    let y = cy;
    for (let s = 0; s < size * 3; s++) {
      setTile(grid, x, y, 'murkwater', (cur) => cur === meta.baseTile);
      // 岸边朽木与泥炭
      if (rng.chance(0.2)) {
        setTile(grid, x + rng.int(-1, 2), y + rng.int(-1, 2), 'barrel', (cur) => cur === meta.baseTile);
      }
      x += rng.int(-1, 2);
      y += rng.int(-1, 2);
    }
  }
}

/** 巫婆药庐：高架木屋（building）+ 坛坛罐罐 */
function buildWitchHuts(canvas: BiomeCanvas): void {
  const { grid, rng, meta } = canvas;
  const huts = scaledCount(canvas, rng.int(2, 4));
  for (let i = 0; i < huts; i++) {
    const area = findClearArea(canvas, 5, 4);
    if (!area) continue;
    for (let y = area.y; y < area.y + area.h; y++) {
      for (let x = area.x; x < area.x + area.w; x++) {
        const isEdge = y === area.y || y === area.y + area.h - 1 || x === area.x || x === area.x + area.w - 1;
        grid[y][x] = isEdge ? 'building' : 'floor';
      }
    }
    grid[area.y + area.h - 1][area.x + Math.floor(area.w / 2)] = 'door';
    // 药罐与坩埚
    setTile(grid, area.x - 1, area.y + area.h, 'urn', (cur) => cur === meta.baseTile);
    if (rng.chance(0.6)) {
      setTile(grid, area.x + area.w, area.y + area.h, 'chest', (cur) => cur === meta.baseTile);
    }
  }
}

/** 朽木栈道：跨过沼池的窄桥 */
function buildBoardwalks(canvas: BiomeCanvas): void {
  const { grid, width, height, rng } = canvas;
  const walks = rng.int(1, 3);
  for (let i = 0; i < walks; i++) {
    let x = rng.int(6, width - 6);
    for (let y = rng.int(6, height - 12); y < height - 6 && x > 1 && x < width - 2; y++) {
      if (grid[y][x] === 'murkwater' || grid[y][x] === 'water') {
        grid[y][x] = 'bridge';
        if (rng.chance(0.5) && (grid[y][x + 1] === 'murkwater' || grid[y][x + 1] === 'water')) {
          grid[y][x + 1] = 'bridge';
        }
      }
      if (rng.chance(0.2)) x += rng.chance(0.5) ? 1 : -1;
    }
  }
}
