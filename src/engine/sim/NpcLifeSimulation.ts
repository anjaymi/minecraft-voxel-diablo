import { DungeonFloor, NPC } from '../../types';
import { NpcAgent, NpcActivity, NpcDecision, NpcMood, NpcNeeds } from './AgentTypes';
import { buildAgentSnapshot, BrainContext, NpcBrain, RuleBrain } from './AgentBrain';
import { DAY_LENGTH, TimePhase, phaseOf } from './DailySchedule';
import { checkMilestone, createRelationship, decayAffinity, growAffinity, hasMemory, milestoneLine, remember } from './AgentMemory';

/**
 * NpcLifeSimulation — NPC 人生模拟运行时。
 *
 * 每帧：时钟推进 → 需求衰减/恢复 → 大脑决策 → 导航执行 → 思维与心情刷新。
 * 世界事件（领主被击败/玩家付费）通过 record* 写入每个 NPC 的记忆——
 * 他们会"记得"玩家做过什么。
 */

const NEEDS_TICK = {
  /** 精力：每模拟小时白天 -9、睡眠 +22 */
  energyDay: -9,
  energySleep: 22,
  /** 社交：每小时 -5，交谈 +18，人群附近 +3 */
  socialDecay: -5,
  socialChat: 18,
  /** 钱袋：工作每小时 +7（纯风味） */
  coinWork: 7,
};

const THOUGHT_INTERVAL_MINUTES = 25;

/** 思维池：按活动 + 心情取样（后续可由 LLM 生成） */
const THOUGHTS: Record<NpcActivity, string[]> = {
  work: ['今天也要好好干。', '这门手艺可是祖传的。', '希望能来点客人。'],
  perform: ['这首曲子他们一定喜欢。', '观众在哪里～'],
  leisure: ['忙了一天，歇会儿。', '晚风真舒服。'],
  sleep: ['呼……呼……', '（说着梦话）'],
  patrol: ['一切正常。', '今晚也不会有怪物吧。'],
  play: ['哈哈！接住啦！', '下次要采更多花！'],
  idle: ['……', '发会儿呆。'],
  commute: ['快到地方了。', '得抓紧了。'],
};

const MOOD_BY_NEEDS = (needs: NpcNeeds): NpcMood => {
  if (needs.energy < 25) return 'weary';
  if (needs.social < 25) return 'lonely';
  if (needs.coin < 10) return 'grumpy';
  if (needs.energy > 65 && needs.social > 45) return 'cheerful';
  return 'calm';
};

export class NpcLifeSimulation {
  private agents = new Map<string, NpcAgent>();
  private brain: NpcBrain = new RuleBrain(); // ⚡ 未来替换为 LlmBrain
  /** 模拟时钟（秒） */
  private clock = DAY_LENGTH * 0.08; // 从清晨开始
  private thoughtClock = 0;

  /** 城镇生成时挂载 NPC 实体（保留既有 agent 记忆——人生是连续的） */
  public attachTown(npcs: NPC[]): void {
    for (const npc of npcs) {
      if (!this.agents.has(npc.id)) {
        this.agents.set(npc.id, {
          defId: npc.id,
          npc,
          state: {
            needs: { energy: 60 + Math.random() * 30, social: 50 + Math.random() * 30, coin: 20 },
            mood: 'calm',
            activity: 'idle',
            memories: [],
            relationship: createRelationship(),
            thought: { text: '新的一天。', at: 0 },
            targetX: null,
            targetY: null,
            idleTimer: Math.random() * 2,
          },
        });
      } else {
        // 周目中回到城镇：刷新实体引用（NPC 对象每次重建）
        this.agents.get(npc.id)!.npc = npc;
      }
    }
  }

  public getPhase(): TimePhase {
    return phaseOf((this.clock % DAY_LENGTH) / DAY_LENGTH);
  }

  public getClockMinutes(): number {
    return (this.clock / DAY_LENGTH) * 24 * 60;
  }

  /** 主循环 tick（仅在城镇调用） */
  public update(dt: number, floor: DungeonFloor, playerX: number, playerY: number): void {
    this.clock += dt;
    const phase = this.getPhase();

    for (const agent of this.agents.values()) {
      this.tickNeeds(agent, dt);
      const ctx: BrainContext = {
        phase,
        dayT: (this.clock % DAY_LENGTH) / DAY_LENGTH,
        playerX,
        playerY,
        isWalkable: (x, y) => this.isWalkable(floor, x, y),
      };
      const decision = this.brain.decide(agent, ctx);
      this.execute(agent, decision, floor, dt, playerX, playerY);
      this.tickThought(agent, decision.activity);
      decayAffinity(agent.state.relationship, dt / 3600);
    }
    this.thoughtClock += dt;
    if (this.thoughtClock > 60) this.thoughtClock = 0;
  }

  // ---------- 需求与心情 ----------

  private tickNeeds(agent: NpcAgent, dt: number): void {
    const { needs } = agent.state;
    const hours = dt / (DAY_LENGTH / 24);
    const sleeping = agent.state.activity === 'sleep';

    needs.energy = clamp(needs.energy + (sleeping ? NEEDS_TICK.energySleep : NEEDS_TICK.energyDay) * hours, 0, 100);
    needs.social = clamp(needs.social + NEEDS_TICK.socialDecay * hours, 0, 100);
    if (agent.state.activity === 'work' || agent.state.activity === 'perform') {
      needs.coin += NEEDS_TICK.coinWork * hours;
    }
    agent.state.mood = MOOD_BY_NEEDS(needs);
  }

  // ---------- 决策执行（导航） ----------

  private execute(
    agent: NpcAgent,
    decision: NpcDecision,
    floor: DungeonFloor,
    dt: number,
    playerX: number,
    playerY: number
  ): void {
    const { state, npc } = agent;
    state.activity = decision.activity;
    npc.activity = decision.activity;

    // 到达判定（睡觉/驻守类任务到达后进入微 idle 抖动）
    const dx = decision.targetX - npc.x;
    const dy = decision.targetY - npc.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 0.45) {
      // 已就位：睡眠/工作原地小徘徊
      state.targetX = null;
      state.idleTimer -= dt;
      if (state.idleTimer <= 0 && decision.activity !== 'sleep') {
        // 就位后在小范围微移（0.6 格），让画面有生活感
        const angle = Math.random() * Math.PI * 2;
        const tx = decision.targetX + Math.cos(angle) * 0.6;
        const ty = decision.targetY + Math.sin(angle) * 0.6;
        if (this.isWalkable(floor, tx, ty)) {
          this.stepToward(npc, tx, ty, dt * 0.5, floor);
        }
        state.idleTimer = 1.5 + Math.random() * 2.5;
      }
      return;
    }

    // 朝目标移动（逐轴防斜穿）
    const speed = decision.activity === 'sleep' ? 0.8 : 1.15;
    this.stepToward(npc, decision.targetX, decision.targetY, speed * dt, floor);
    state.activity = dist > 1.2 ? 'commute' : decision.activity;
    void playerX;
    void playerY;
  }

  private stepToward(npc: NPC, tx: number, ty: number, maxStep: number, floor: DungeonFloor): void {
    const dx = tx - npc.x;
    const dy = ty - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.01) return;
    const step = Math.min(dist, maxStep);
    const nx = npc.x + (dx / dist) * step;
    const ny = npc.y + (dy / dist) * step;
    if (this.isWalkable(floor, nx, ny)) {
      npc.x = nx;
      npc.y = ny;
    } else if (this.isWalkable(floor, nx, npc.y)) {
      npc.x = nx;
    } else if (this.isWalkable(floor, npc.x, ny)) {
      npc.y = ny;
    }
  }

  private isWalkable(floor: DungeonFloor, x: number, y: number): boolean {
    const gx = Math.round(x);
    const gy = Math.round(y);
    const tile = floor.tiles[gy]?.[gx];
    if (tile === undefined) return false;
    const blocked = ['wall', 'town_wall', 'building', 'water', 'fountain', 'chest', 'barrel', 'urn', 'pillar', 'tree', 'well', 'tower', 'void', 'spawner', 'shrine'];
    return !blocked.includes(tile);
  }

  // ---------- 思维（内心独白） ----------

  private tickThought(agent: NpcAgent, activity: NpcActivity): void {
    const intervalSeconds = (THOUGHT_INTERVAL_MINUTES / 60) * DAY_LENGTH / 24;
    if (this.thoughtClock < intervalSeconds) return;
    // 时钟到期：全员按概率刷新内心独白
    if (Math.random() > 0.35) return;
    const pool = THOUGHTS[activity] ?? THOUGHTS.idle;
    agent.state.thought = { text: pool[Math.floor(Math.random() * pool.length)], at: this.getClockMinutes() };
  }

  // ---------- 世界与玩家的交互记忆 ----------

  /** 与玩家交谈：亲密度+1，返回应插播的生活台词（里程碑/睡眠/熟客），无则 null */
  public recordChat(npcId: string, playerName: string): string | null {
    const agent = this.agents.get(npcId);
    if (!agent) return null;
    const { state } = agent;
    state.needs.social = clamp(state.needs.social + NEEDS_TICK.socialChat, 0, 100);
    state.relationship.chats += 1;
    growAffinity(state.relationship, 1);
    remember(state, this.getClockMinutes(), 'chat', `和${playerName}聊了一会儿`);

    const milestone = checkMilestone(state.relationship);
    if (milestone) {
      return milestoneLine(milestone, agent.npc.name);
    }
    // 熟客的问候：亲密度高时有几率被认出来
    if (state.relationship.affinity > 8 && Math.random() < 0.4) {
      return '哟，又是你！最近如何？';
    }
    return null;
  }

  /** 服务事件：玩家付费/接受治愈会成为 NPC 的记忆 */
  public recordService(npcId: string, kind: 'paid' | 'healed', detail: string): void {
    const agent = this.agents.get(npcId);
    if (!agent) return;
    if (!hasMemory(agent.state, kind, detail)) {
      remember(agent.state, this.getClockMinutes(), kind, detail);
    }
    growAffinity(agent.state.relationship, kind === 'paid' ? 3 : 2);
    agent.state.needs.coin += kind === 'paid' ? 12 : 0;
  }

  /** 世界事件广播：所有在场 NPC 都会记得 */
  public recordWorldEvent(kind: 'world_boss' | 'world_victory', text: string): void {
    for (const agent of this.agents.values()) {
      if (!hasMemory(agent.state, kind, text)) {
        remember(agent.state, this.getClockMinutes(), kind, text);
      }
    }
  }

  /** 感知快照（LLM 接缝调试/未来投喂） */
  public getAgentSnapshot(npcId: string, playerNearby: boolean): object | null {
    const agent = this.agents.get(npcId);
    if (!agent) return null;
    return buildAgentSnapshot(agent, { phase: this.getPhase(), npc: agent.npc, playerNearby });
  }

  public getAgentThought(npcId: string): string | null {
    return this.agents.get(npcId)?.state.thought.text ?? null;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** 全局单例：NPC 的人生是连续的（跨周目保留记忆） */
export const npcLifeSim = new NpcLifeSimulation();
