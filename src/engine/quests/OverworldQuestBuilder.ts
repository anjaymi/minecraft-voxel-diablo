import { DungeonFloor, Enemy, FloorQuest } from '../../types';
import { assembleFloorQuest, makeObjective } from './questUtils';

/**
 * OverworldQuestBuilder — 荒原远征任务（迷雾落日荒原）。
 */

export function buildOverworldQuest(floor: DungeonFloor, enemies: Enemy[]): FloorQuest {
  const objectives = [];

  const killTarget = Math.min(10, Math.max(6, enemies.length - 2));
  objectives.push(
    makeObjective({
      id: 'overworld_kill_mobs',
      title: '清理荒原魔物群',
      desc: '消灭在荒原巡逻的僵尸、骷髅与潜伏生物',
      icon: '⚔️',
      type: 'kill_monsters',
      target: killTarget,
      reward: { xp: 120, emeralds: 40, text: '+120 EXP, +40 绿宝石' },
    })
  );

  objectives.push(
    makeObjective({
      id: 'overworld_open_chests',
      title: '寻觅荒原失落宝箱',
      desc: '在荒原营地或废墟中搜寻并开启隐藏物资箱',
      icon: '🗝️',
      type: 'open_chests',
      target: 2,
      reward: { xp: 80, emeralds: 35, text: '+80 EXP, +35 绿宝石' },
    })
  );

  // 荒原存在精英怪时追加讨伐目标
  if (enemies.some((e) => e.isElite)) {
    objectives.push(
      makeObjective({
        id: 'overworld_hunt_elite',
        title: '诛杀荒原精英头目',
        desc: '击溃荒原中带有词缀光环的精英变异体',
        icon: '👑',
        type: 'kill_elite',
        target: 1,
        reward: { xp: 150, emeralds: 60, text: '+150 EXP, +60 绿宝石' },
      })
    );
  }

  return assembleFloorQuest({
    floorNumber: floor.floorNumber,
    zoneType: floor.zoneType,
    title: '荒原远征：清缴游荡魔群',
    subtitle: '荒芜的平原上潜伏着危险的掠食者',
    objectives,
    itemText: '荒原开拓宝箱',
  });
}
