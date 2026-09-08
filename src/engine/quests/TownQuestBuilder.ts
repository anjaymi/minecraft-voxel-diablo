import { DungeonFloor, FloorQuest } from '../../types';
import { assembleFloorQuest, makeObjective } from './questUtils';

/**
 * TownQuestBuilder — 圣域避难所新手引导任务（翡翠圣城）。
 */

export function buildTownQuest(floor: DungeonFloor): FloorQuest {
  const objectives = [
    makeObjective({
      id: 'town_talk_guide',
      title: '拜访城镇引路人',
      desc: '在城镇中央与引路人卡恩交谈，获取远征情报',
      icon: '📜',
      type: 'escort_npc',
      target: 1,
      reward: { xp: 50, emeralds: 20, text: '+50 EXP, +20 绿宝石' },
    }),
    makeObjective({
      id: 'town_visit_blacksmith',
      title: '检查补给与装备',
      desc: '拜访铁匠麦格尼或牧师莎莉，准备远征',
      icon: '⚒️',
      type: 'escort_npc',
      target: 1,
      reward: { xp: 50, emeralds: 30, text: '+50 EXP, +30 绿宝石' },
    }),
    makeObjective({
      id: 'town_enter_portal',
      title: '前往传送门出发',
      desc: '穿过城镇下方的传送门，进入荒原与地下城',
      icon: '🌀',
      type: 'reach_portal',
      target: 1,
      reward: { text: '开启冒险之旅' },
    }),
  ];

  return assembleFloorQuest({
    floorNumber: floor.floorNumber,
    zoneType: floor.zoneType,
    title: '圣域避难所：集结备战',
    subtitle: '整备武器装备，与城镇NPC交流并启程',
    objectives,
    itemText: '旅人补给包',
  });
}
