import { DungeonFloor, ZoneType } from '../../types';
import { generateTownMap } from './TownMapFactory';
import { generateOverworldMap } from './OverworldMapFactory';
import { generateDungeonFloor } from './DungeonMapFactory';
import { generateFrostMap } from './FrostMapFactory';
import { generateVolcanoMap } from './VolcanoMapFactory';
import { generateMushroomMap } from './MushroomMapFactory';
import { generateDesertMap } from './DesertMapFactory';
import { generateSwampMap } from './SwampMapFactory';
import { generateCursedMap } from './CursedMapFactory';
import { generateFrontierKeep } from './FrontierKeepFactory';

/**
 * WorldMapDirector — 世界地图统一入口（总装层）。
 *
 * 按区域类型调度对应的地图工厂，引擎只需关心 generateWorldZone 一个函数。
 */

export function generateWorldZone(zoneType: ZoneType, floorNumber: number = 1): DungeonFloor {
  switch (zoneType) {
    case 'town':
      return generateTownMap();
    case 'overworld':
      return generateOverworldMap();
    case 'dungeon':
    case 'nether':
    case 'end':
      return generateDungeonFloor(floorNumber);
    case 'frost':
      return generateFrostMap();
    case 'volcano':
      return generateVolcanoMap();
    case 'mushroom':
      return generateMushroomMap();
    case 'desert':
      return generateDesertMap();
    case 'swamp':
      return generateSwampMap();
    case 'cursed':
      return generateCursedMap();
    case 'keep':
      return generateFrontierKeep();
    default:
      return generateDungeonFloor(floorNumber);
  }
}
