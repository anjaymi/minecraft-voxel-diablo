import { NpcMemory, NpcMemoryKind, NpcRelationship } from './AgentTypes';

/**
 * AgentMemory — 情景记忆环与关系成长。
 *
 * 记忆是"人生"的证据：每个 NPC 只保留最近 MEMORY_CAPACITY 条，
 * 旧事被新事挤出去（遗忘曲线的简化版）。
 */

const MEMORY_CAPACITY = 8;
/** 亲密度自然遗忘（每小时衰减量） */
const AFFINITY_DECAY_PER_HOUR = 0.5;

export function createRelationship(): NpcRelationship {
  return { affinity: 0, chats: 0, milestones: [] };
}

export function remember(state: { memories: NpcMemory[] }, clockMinutes: number, kind: NpcMemoryKind, text: string): void {
  state.memories.unshift({ at: clockMinutes, kind, text });
  if (state.memories.length > MEMORY_CAPACITY) {
    state.memories.pop();
  }
}

/** 记忆是否已存在（按 kind + 文本，用于世界事件去重） */
export function hasMemory(state: { memories: NpcMemory[] }, kind: NpcMemoryKind, text: string): boolean {
  return state.memories.some((m) => m.kind === kind && m.text === text);
}

export function growAffinity(rel: NpcRelationship, amount: number): void {
  rel.affinity = Math.min(100, rel.affinity + amount);
}

export function decayAffinity(rel: NpcRelationship, dtHours: number): void {
  rel.affinity = Math.max(0, rel.affinity - AFFINITY_DECAY_PER_HOUR * dtHours);
}

/** 关系里程碑：返回刚达成的里程碑名（无则 null） */
export function checkMilestone(rel: NpcRelationship): string | null {
  const tiers: Array<{ at: number; id: string }> = [
    { at: 1, id: 'first_met' },
    { at: 5, id: 'familiar' },
    { at: 15, id: 'regular' },
    { at: 30, id: 'friend' },
  ];
  for (const tier of tiers) {
    if (rel.chats >= tier.at && !rel.milestones.includes(tier.id)) {
      rel.milestones.push(tier.id);
      return tier.id;
    }
  }
  return null;
}

/** 里程碑开场白（对话融合用） */
export function milestoneLine(milestone: string | null, name: string): string | null {
  switch (milestone) {
    case 'first_met':
      return `初次见面，我叫${name}。你就是那位冒险者吧？`;
    case 'familiar':
      return '又见面啦，冒险者。咱们算是熟人了。';
    case 'regular':
      return '老主顾来了！今天想聊点什么？';
    case 'friend':
      return '我的朋友！你的名字在这座城里无人不晓。';
    default:
      return null;
  }
}
