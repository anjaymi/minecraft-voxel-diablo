import { NPCType } from '../../types';

/**
 * NpcDefinition — 城市住民定义（DQ 式功能 NPC）。
 *
 * 台词三状态：pre_expedition（默认）→ after_first_boss（首胜领主）→ after_victory（通关），
 * 由 DialogueSystem 按游戏进度实时解析。
 */

export type DialogueStateKey = 'pre_expedition' | 'after_first_boss' | 'after_victory';

export const DIALOGUE_STATE_ORDER: DialogueStateKey[] = [
  'pre_expedition',
  'after_first_boss',
  'after_victory',
];

/** NPC 对话后由引擎执行的服务 */
export type CityService =
  | 'none'
  | 'heal_blessing'        // 免费治愈+回蓝（牧师）
  | 'inn_rest'             // 付费全回复+药水（旅店）
  | 'open_camp_blacksmith' // 营地·锻造
  | 'open_camp_enchanter'  // 营地·附魔
  | 'open_camp_alchemist'  // 营地·炼金
  | 'class_transfer'       // 转职弹窗
  | 'open_shop';           // 行商商店

export interface CityNpcDefinition {
  id: string;
  name: string;
  type: NPCType;
  color: string;
  icon: string;
  /** 城内岗位（瓦片坐标） */
  x: number;
  y: number;
  /** 闲逛半径（格），0 为站桩 */
  wanderRadius: number;
  service: CityService;
  /** inn_rest 的花费（绿宝石） */
  serviceCost?: number;
  /** 三状态台词（每状态随机轮播） */
  dialogueStates: Record<DialogueStateKey, string[]>;
}
