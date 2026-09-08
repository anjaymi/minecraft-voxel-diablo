import { FloorQuest, QuestObjective } from '../../types';

/**
 * questUtils — 任务构建共享纯函数。
 */

export interface ObjectiveBlueprint {
  id: string;
  title: string;
  desc: string;
  icon: string;
  type: QuestObjective['type'];
  target: number;
  reward?: { xp?: number; emeralds?: number; text?: string };
}

/** 由蓝图构造标准任务目标（current=0 / 未完成） */
export function makeObjective(bp: ObjectiveBlueprint): QuestObjective {
  return {
    id: bp.id,
    title: bp.title,
    desc: bp.desc,
    icon: bp.icon,
    type: bp.type,
    current: 0,
    target: bp.target,
    isCompleted: false,
    reward: bp.reward,
  };
}

/** 汇总所有目标奖励，生成任务总奖励 */
export function assembleFloorQuest(params: {
  floorNumber: number;
  zoneType: FloorQuest['zoneType'];
  title: string;
  subtitle: string;
  objectives: QuestObjective[];
  itemText: string;
}): FloorQuest {
  const totalXp = params.objectives.reduce((sum, o) => sum + (o.reward?.xp || 0), 0);
  const totalEmeralds = params.objectives.reduce((sum, o) => sum + (o.reward?.emeralds || 0), 0);

  return {
    floorNumber: params.floorNumber,
    zoneType: params.zoneType,
    title: params.title,
    subtitle: params.subtitle,
    objectives: params.objectives,
    allCompleted: false,
    rewardClaimed: false,
    totalReward: { xp: totalXp, emeralds: totalEmeralds, itemText: params.itemText },
  };
}
