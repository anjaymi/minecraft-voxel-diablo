import { DungeonFloor, DungeonRoom, TileType, WeatherType, ZoneType } from '../../types';
import { findRoomByType, planRooms, carveCorridors, carveRooms, sealWallsAroundFloors } from './DungeonCarver';
import { createGrid, rectCenter, setTile } from './TileGrid';
import { Rng } from './Rng';
import { scatterTerrain } from './TerrainScatter';

/**
 * 随机地牢：除终层（≥3 必为虚空终末殿堂）外，
 * 每次进入按权重随机抽取楼层面板主题。
 */
const FLOOR_THEME_POOL: Array<{ theme: 'caves' | 'nether' | 'end'; weight: number }> = [
  { theme: 'caves', weight: 0.55 },
  { theme: 'nether', weight: 0.3 },
  { theme: 'end', weight: 0.15 },
];

function rollRandomTheme(): 'caves' | 'nether' | 'end' {
  const roll = Math.random();
  let acc = 0;
  for (const entry of FLOOR_THEME_POOL) {
    acc += entry.weight;
    if (roll < acc) return entry.theme;
  }
  return 'caves';
}

/**
 * DungeonMapFactory — 地牢楼层工厂（远古王陵 / 地狱炼狱 / 虚空殿堂）。
 *
 * 组装 DungeonCarver 的各道雕刻工序，并布置房间道具与传送门。
 * 层数决定主题：1=caves、2=nether、3+=end。
 */

const DUNGEON_WIDTH = 38;
const DUNGEON_HEIGHT = 38;

interface FloorTheme {
  theme: 'caves' | 'nether' | 'end';
  zoneType: ZoneType;
  weather: WeatherType;
  zoneName: string;
}

export function generateDungeonFloor(floorNumber: number): DungeonFloor {
  const width = DUNGEON_WIDTH;
  const height = DUNGEON_HEIGHT;
  const themeInfo = resolveFloorTheme(floorNumber);

  const grid = createGrid(width, height, 'void');
  const rooms = planDungeonRooms(width, height, 7 + Math.min(floorNumber, 4));

  carveRooms(grid, rooms);
  carveCorridors(grid, rooms, width, height);
  sealWallsAroundFloors(grid, width, height);

  const spawnRoom = findRoomByType(rooms, 'spawn') ?? rooms[0];
  const bossRoom = findRoomByType(rooms, 'boss') ?? rooms[rooms.length - 1];
  const spawn = rectCenter(spawnRoom);
  const exit = rectCenter(bossRoom);

  grid[exit.y][exit.x] = 'exit_portal';
  setTile(grid, spawn.x - 2, spawn.y, 'town_gate'); // 出生房的回城传送门

  placeRoomProps(grid, rooms, themeInfo.theme);
  placeCornerDestructibles(grid, rooms);

  const floor: DungeonFloor = {
    floorNumber,
    theme: themeInfo.theme,
    zoneType: themeInfo.zoneType,
    zoneName: themeInfo.zoneName,
    isIndoor: true,
    weather: themeInfo.weather,
    description: '幽暗阴冷的深渊地下遗迹，石壁上渗出冰冷雾气，回荡着低沉的魔物吼声。',
    width,
    height,
    tiles: grid,
    rooms,
    spawnX: spawn.x,
    spawnY: spawn.y,
    exitX: exit.x,
    exitY: exit.y,
    portalTownX: spawn.x - 2,
    portalTownY: spawn.y,
  };
  scatterTerrain(floor, themeInfo.theme === 'caves' ? 'dungeon' : themeInfo.theme, new Rng());
  return floor;
}

/**
 * 房间规划带重采样：拒绝式采样偶发产量过低，
 * 重试至最少 6 间（或取最优一轮），保证楼层可玩性。
 */
function planDungeonRooms(width: number, height: number, numRooms: number): DungeonRoom[] {
  let best: DungeonRoom[] = [];
  for (let attempt = 0; attempt < 8; attempt++) {
    const rooms = planRooms({ width, height, numRooms });
    if (rooms.length >= Math.min(6, numRooms)) return rooms;
    if (rooms.length > best.length) best = rooms;
  }
  return best;
}

/** 按层数解析楼层主题（1-2 层随机轮换，≥3 层锁定终末殿堂） */
function resolveFloorTheme(floorNumber: number): FloorTheme {
  if (floorNumber < 3) {
    return buildThemeEntry(rollRandomTheme(), floorNumber);
  }
  return buildThemeEntry('end', floorNumber);
}

function buildThemeEntry(theme: 'caves' | 'nether' | 'end', floorNumber: number): FloorTheme {
  if (theme === 'nether') {
    return {
      theme: 'nether',
      zoneType: 'nether',
      weather: 'ash_storm',
      zoneName: `🌋 地狱熔岩炼狱 (Nether Abyss · ${floorNumber}层)`,
    };
  }
  if (theme === 'end') {
    return {
      theme: 'end',
      zoneType: 'end',
      weather: 'clear',
      zoneName: `🌌 虚空终末殿堂 (The End Void · ${floorNumber}层)`,
    };
  }
  return {
    theme: 'caves',
    zoneType: 'dungeon',
    weather: 'fog',
    zoneName: `💀 远古地牢王陵 (Ancient Crypt · ${floorNumber}层)`,
  };
}

/** 房间专属道具：宝箱房 / 神龛房 / 普通房的战利品与刷怪巢 */
function placeRoomProps(grid: TileType[][], rooms: DungeonRoom[], theme: FloorTheme['theme']): void {
  for (const room of rooms) {
    const center = rectCenter(room);
    switch (room.type) {
      case 'treasure':
        placeChestPair(grid, center);
        break;
      case 'shrine':
        setTile(grid, center.x, center.y, 'shrine');
        break;
      case 'normal':
        placeNormalRoomProps(grid, room, center, theme);
        break;
      default:
        break;
    }
  }
}

function placeChestPair(grid: TileType[][], center: { x: number; y: number }): void {
  setTile(grid, center.x, center.y, 'chest');
  setTile(grid, center.x + 1, center.y, 'chest', (cur) => cur === 'floor');
}

function placeNormalRoomProps(
  grid: TileType[][],
  room: DungeonRoom,
  center: { x: number; y: number },
  theme: FloorTheme['theme']
): void {
  if (Math.random() < 0.6) {
    setTile(grid, room.x + 2, room.y + 2, 'chest', (cur) => cur === 'floor');
  }
  if (Math.random() < 0.5) {
    setTile(grid, center.x, center.y, 'spawner', (cur) => cur === 'floor');
  }
  if (theme === 'nether' && Math.random() < 0.4) {
    setTile(grid, center.x, center.y, 'lava', (cur) => cur === 'floor');
  }
}

/** 房间四角的 barrels / urns / 灌木 / 石柱等可破坏物 */
function placeCornerDestructibles(grid: TileType[][], rooms: DungeonRoom[]): void {
  for (const room of rooms) {
    const corners = [
      { x: room.x + 1, y: room.y + 1 },
      { x: room.x + room.w - 2, y: room.y + 1 },
      { x: room.x + 1, y: room.y + room.h - 2 },
      { x: room.x + room.w - 2, y: room.y + room.h - 2 },
    ];
    for (const corner of corners) {
      const roll = Math.random();
      const deco = rollCornerDeco(roll);
      if (deco) {
        setTile(grid, corner.x, corner.y, deco, (cur) => cur === 'floor');
      }
    }
  }
}

function rollCornerDeco(roll: number): TileType | null {
  if (roll < 0.28) return 'barrel';
  if (roll < 0.52) return 'urn';
  if (roll < 0.7) return 'bush';
  if (roll < 0.85) return 'pillar';
  if (roll < 0.95) return 'vines';
  return null;
}
