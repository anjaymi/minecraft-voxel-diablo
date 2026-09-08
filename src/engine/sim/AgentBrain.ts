import { NPC } from '../../types';
import { AgentWorldSnapshot, NpcAgent, NpcDecision } from './AgentTypes';
import { ScheduleEntry, TimePhase, getScheduleEntry } from './DailySchedule';

/**
 * AgentBrain — NPC 大脑接口。
 *
 * ⚡ 这是 LLM 接缝：RuleBrain（本文件）负责现在的效用规则决策；
 * 未来的 LlmBrain 实现同一接口——把 buildAgentSnapshot() 的 JSON
 * 交给模型、解析模型回复为 NpcDecision，引擎与渲染零改动。
 *
 * 决策优先级（RuleBrain）：
 *   精力枯竭 → 强制回家睡觉
 *   日程表   → 当前时段的岗位/演出/休闲/睡眠
 *   社交需求 → 黄昏且社交低时凑向广场人群
 *   兜底     → 岗位附近踱步
 */

export interface BrainContext {
  phase: TimePhase;
  dayT: number;
  playerX: number;
  playerY: number;
  isWalkable: (x: number, y: number) => boolean;
}

export interface NpcBrain {
  decide(agent: NpcAgent, ctx: BrainContext): NpcDecision;
}

/** 能量枯竭阈值：低于此值无视日程回家补觉 */
const EXHAUSTED_THRESHOLD = 12;
/** 社交渴求阈值 */
const LONELY_THRESHOLD = 30;

/** 规则大脑：日程驱动的效用决策（当前默认实现） */
export class RuleBrain implements NpcBrain {
  public decide(agent: NpcAgent, ctx: BrainContext): NpcDecision {
    const { state } = agent;
    const home = getHomeSpot(agent);

    // 1. 精力枯竭：任何时段都允许提前回去睡（守卫除外——铁人设定）
    if (state.needs.energy < EXHAUSTED_THRESHOLD && home) {
      return { activity: 'sleep', targetX: home.x, targetY: home.y };
    }

    // 2. 日程表
    const entry = getScheduleEntry(agent.defId, ctx.phase);
    if (entry.activity !== 'idle') {
      return { activity: entry.activity, targetX: entry.x, targetY: entry.y };
    }

    // 3. 社交渴求：空闲且孤独时往广场人堆凑
    if (state.needs.social < LONELY_THRESHOLD) {
      return { activity: 'leisure', targetX: 21, targetY: 22 };
    }

    // 4. 兜底：原地踱步
    return { activity: 'idle', targetX: agent.npc.x, targetY: agent.npc.y };
  }
}

/** 深夜睡觉目标（无宿舍者返回 null，如守卫） */
function getHomeSpot(agent: NpcAgent): ScheduleEntry | null {
  const night = getScheduleEntry(agent.defId, 'night');
  return night.activity === 'sleep' ? night : null;
}

/**
 * 感知快照（LLM 接缝的输入形态）：
 * 汇总身份/时间/需求/心情/关系/记忆/思维为一袋可序列化 JSON，
 * LlmBrain 未来直接将其渲染为提示词。
 */
export function buildAgentSnapshot(
  agent: NpcAgent,
  ctx: { phase: TimePhase; npc: NPC; playerNearby: boolean }
): AgentWorldSnapshot {
  const { state } = agent;
  return {
    id: agent.defId,
    name: agent.npc.name,
    role: agent.npc.type,
    timeOfDay: ctx.phase,
    activity: state.activity,
    mood: state.mood,
    needs: { ...state.needs },
    relationship: {
      affinity: Math.round(state.relationship.affinity),
      chats: state.relationship.chats,
      milestones: [...state.relationship.milestones],
    },
    recentMemories: state.memories.slice(0, 5).map((m) => m.text),
    thought: state.thought.text,
    playerNearby: ctx.playerNearby,
  };
}
