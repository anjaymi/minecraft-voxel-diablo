import { DungeonFloor, Enemy, FloorQuest, NPC } from '../../types';
import { assembleFloorQuest, makeObjective } from './questUtils';

/**
 * DungeonQuestBuilder — 地牢/地狱/虚空楼层任务。
 *
 * 有首领的楼层：清怪 + 讨伐领主；
 * 无首领的楼层：清怪 + 宝箱 + 精英猎杀；
 * 存在受困学者时追加护送目标。
 */

export function buildDungeonQuest(
  floor: DungeonFloor,
  enemies: Enemy[],
  npcs: NPC[]
): FloorQuest {
  const floorNum = floor.floorNumber;
  const objectives = [];

  const hasBoss = enemies.some((e) => e.type === 'wither_boss');
  const totalEnemies = enemies.filter((e) => e.type !== 'wither_boss').length;
  const killGoal = hasBoss
    ? Math.max(5, Math.min(12, Math.floor(totalEnemies * 0.6)))
    : Math.max(6, Math.min(16, Math.floor(totalEnemies * 0.75)));

  objectives.push(
    makeObjective({
      id: `dungeon_kill_${floorNum}`,
      title: '净化学者的墓穴魔物',
      desc: '消灭地牢中被深渊力量侵蚀的亡灵与怪物',
      icon: '⚔️',
      type: 'kill_monsters',
      target: killGoal,
      reward: {
        xp: 100 + floorNum * 40,
        emeralds: 30 + floorNum * 15,
        text: `+${100 + floorNum * 40} EXP, +${30 + floorNum * 15} 绿宝石`,
      },
    })
  );

  if (hasBoss) {
    objectives.push(buildBossObjective(floorNum));
  } else {
    objectives.push(
      buildChestObjective(floorNum),
      buildEliteObjective(floorNum)
    );
  }

  const hasSurvivor = npcs.some((n) => n.type === 'survivor' || n.type === 'scholar');
  if (hasSurvivor) {
    objectives.push(
      makeObjective({
        id: `dungeon_escort_${floorNum}`,
        title: '护送受困探险学者',
        desc: '找到被困在暗室中的探险家，并护送至安全传送门',
        icon: '🛡️',
        type: 'escort_npc',
        target: 1,
        reward: { xp: 200, emeralds: 80, text: '+200 EXP, +80 绿宝石' },
      })
    );
  }

  return assembleFloorQuest({
    floorNumber: floorNum,
    zoneType: floor.zoneType,
    title: hasBoss ? `第 ${floorNum} 层：决战深渊领主` : `第 ${floorNum} 层：幽深地牢探索`,
    subtitle: hasBoss ? '首领房间弥漫着毁灭的气息，做好准备！' : '幽暗的回廊中隐约传来怪物的低语...',
    objectives,
    itemText: hasBoss ? '必出传奇暗金装备' : '稀有附魔宝藏箱',
  });
}

function buildBossObjective(floorNum: number) {
  const xp = 400 + floorNum * 150;
  const emeralds = 150 + floorNum * 50;
  return makeObjective({
    id: `dungeon_boss_${floorNum}`,
    title: '讨伐地下城守关领主',
    desc: '深入最深处首领祭坛，击败凋灵深渊领主',
    icon: '💀',
    type: 'kill_elite',
    target: 1,
    reward: { xp, emeralds, text: `+${xp} EXP, +${emeralds} 绿宝石` },
  });
}

function buildChestObjective(floorNum: number) {
  const xp = 80 + floorNum * 20;
  return makeObjective({
    id: `dungeon_chest_${floorNum}`,
    title: '探索并破译密室宝箱',
    desc: '搜寻隐藏在暗室之中的珍贵宝箱',
    icon: '🗝️',
    type: 'open_chests',
    target: 1,
    reward: { xp, emeralds: 40, text: `+${xp} EXP, +40 绿宝石` },
  });
}

function buildEliteObjective(floorNum: number) {
  const xp = 140 + floorNum * 30;
  return makeObjective({
    id: `dungeon_elite_${floorNum}`,
    title: '猎杀深渊变异精英',
    desc: '消灭拥有强化词缀的变异精英怪',
    icon: '★',
    type: 'kill_elite',
    target: 1,
    reward: { xp, emeralds: 50, text: `+${xp} EXP, +50 绿宝石` },
  });
}
