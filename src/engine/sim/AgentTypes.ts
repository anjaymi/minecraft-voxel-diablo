import { NPC } from '../../types';

/**
 * AgentTypes — NPC 人生模拟的内心世界类型。
 *
 * 设计原则：所有状态可序列化（为 LLM 接缝做准备——
 * buildAgentSnapshot 直接输出本目录类型构成的 JSON）。
 */

/** 内在需求（0-100，驱动效用决策） */
export interface NpcNeeds {
  /** 精力：白天衰减，夜间睡眠恢复；过低会不顾日程提前回家 */
  energy: number;
  /** 社交：独处衰减，交谈/围观恢复；过低会主动凑近玩家或同伴 */
  social: number;
  /** 钱袋：工作阶段缓慢增长，商人类更快（纯风味） */
  coin: number;
}

/** 心情（由需求推导，影响台词语气） */
export type NpcMood = 'cheerful' | 'calm' | 'weary' | 'lonely' | 'grumpy';

/** 情景记忆条目（环状缓冲，最近优先） */
export interface NpcMemory {
  /** 相对时间戳（模拟分钟） */
  at: number;
  kind: NpcMemoryKind;
  text: string;
}

export type NpcMemoryKind =
  | 'chat' | 'paid' | 'healed' | 'met_first'
  | 'world_boss' | 'world_victory' | 'daily_routine';

/** 对玩家的关系（亲密度随交互增长、随时间缓慢遗忘） */
export interface NpcRelationship {
  affinity: number;
  chats: number;
  /** 已触发的里程碑（防止重复台词） */
  milestones: string[];
}

/** 当前正在做的事 */
export type NpcActivity =
  | 'work' | 'perform' | 'leisure' | 'sleep' | 'patrol' | 'play' | 'idle' | 'commute';

/** 大脑输出：一次决策 */
export interface NpcDecision {
  activity: NpcActivity;
  /** 目标地点（瓦片坐标；sleep/work 等固定点由日程给出） */
  targetX: number;
  targetY: number;
}

/** 内心独白（思维），定期刷新 */
export interface NpcThought {
  text: string;
  at: number;
}

/** 一个 NPC 的完整内心状态（可序列化） */
export interface NpcAgentState {
  needs: NpcNeeds;
  mood: NpcMood;
  activity: NpcActivity;
  memories: NpcMemory[];
  relationship: NpcRelationship;
  thought: NpcThought;
  /** 决策目标（运行时导航用，不进快照） */
  targetX: number | null;
  targetY: number | null;
  /** 到达目标后的停留计时 */
  idleTimer: number;
}

/** 运行时智能体：静态定义 + 引擎 NPC 实体引用 + 内心状态 */
export interface NpcAgent {
  defId: string;
  npc: NPC;
  state: NpcAgentState;
}

/** 世界感知快照（LLM 接缝的输入形态） */
export interface AgentWorldSnapshot {
  id: string;
  name: string;
  role: string;
  timeOfDay: string;
  activity: NpcActivity;
  mood: NpcMood;
  needs: NpcNeeds;
  relationship: NpcRelationship;
  recentMemories: string[];
  thought: string;
  playerNearby: boolean;
}
