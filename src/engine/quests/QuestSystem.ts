import { DungeonFloor, Enemy, FloorQuest, NPC, Player, QuestObjective } from '../../types';
import { soundManager } from '../../audio/soundManager';
import { FloatingTextEmitter, GameEvents, gameEventBus } from '../events';
import { buildTownQuest } from './TownQuestBuilder';
import { buildOverworldQuest } from './OverworldQuestBuilder';
import { buildDungeonQuest } from './DungeonQuestBuilder';
import { assembleFloorQuest, makeObjective } from './questUtils';
import { BIOME_ZONES } from '../map/MapConstants';
import { grantExperience } from '../progression';

/**
 * QuestSystem — 任务状态机与事件订阅者。
 *
 * 任务生成按区域分派给 quests/ 下的 Builder；
 * 进度推进不再由引擎直调，而是订阅 gameEventBus 的交互事件（解耦）。
 */
export class QuestSystem {
  public currentQuest: FloorQuest | null = null;
  public onQuestUpdated?: () => void;

  constructor() {
    gameEventBus.on(GameEvents.ENEMY_KILLED, ({ enemy, player, emitter }) =>
      this.handleEnemyKilled(enemy, player, emitter)
    );
    gameEventBus.on(GameEvents.CHEST_OPENED, ({ player, emitter }) =>
      this.advanceByType('open_chests', player, emitter)
    );
    gameEventBus.on(GameEvents.SHRINE_ACTIVATED, ({ player, emitter }) =>
      this.advanceByType('activate_shrine', player, emitter)
    );
    gameEventBus.on(GameEvents.NPC_RESCUED, ({ npc, player, emitter }) =>
      this.handleNpcRescued(npc, player, emitter)
    );
    gameEventBus.on(GameEvents.NPC_TALKED, ({ npcId, player, emitter }) =>
      this.handleNpcTalked(npcId, player, emitter)
    );
  }

  public getCurrentQuest(): FloorQuest | null {
    return this.currentQuest;
  }

  /** 存档恢复：直接还原任务对象 */
  public restoreQuest(quest: FloorQuest | null): void {
    this.currentQuest = quest;
    this.onQuestUpdated?.();
  }

  /** 按区域类型分派任务构建器 */
  public generateQuestForFloor(floor: DungeonFloor, enemies: Enemy[], npcs: NPC[]): FloorQuest {
    switch (floor.zoneType) {
      case 'town':
        this.currentQuest = buildTownQuest(floor);
        break;
      case 'overworld':
        this.currentQuest = buildOverworldQuest(floor, enemies);
        break;
      default:
        // 前哨城塞：边境巡逻任务（清剿+补给）
        if (floor.zoneType === 'keep') {
          this.currentQuest = assembleFloorQuest({
            floorNumber: floor.floorNumber,
            zoneType: floor.zoneType,
            title: '边境巡逻：戍卫操练',
            subtitle: '帮戍卫队清理城塞周边的魔物斥候',
            objectives: [
              makeObjective({
                id: 'frt_patrol',
                title: '边境清剿',
                desc: '消灭城塞附近游荡的魔物斥候',
                icon: '⚔️',
                type: 'kill_monsters',
                target: 4,
                reward: { xp: 80, emeralds: 30, text: '+80 EXP, +30 绿宝石' },
              }),
              makeObjective({
                id: 'frt_supply',
                title: '补给开箱',
                desc: '打开城塞备好的补给箱',
                icon: '🗝️',
                type: 'open_chests',
                target: 1,
                reward: { xp: 50, emeralds: 20, text: '+50 EXP, +20 绿宝石' },
              }),
            ],
            itemText: '城塞补给包',
          });
          break;
        }
        // 六大生态探索区沿用荒野任务模板（杀怪/宝箱/精英）
        if (BIOME_ZONES.has(floor.zoneType)) {
          this.currentQuest = buildOverworldQuest(floor, enemies);
        } else {
          this.currentQuest = buildDungeonQuest(floor, enemies, npcs);
        }
        break;
    }
    return this.currentQuest;
  }

  // ---------- 事件处理器 ----------

  private handleEnemyKilled(enemy: Enemy, player: Player, emitter: FloatingTextEmitter): void {
    if (!this.currentQuest) return;
    const isEliteKill = enemy.isElite || enemy.type === 'wither_boss';

    const matched = this.pendingObjectives().filter(
      (o) => o.type === 'kill_monsters' || (o.type === 'kill_elite' && isEliteKill)
    );
    if (matched.length === 0) return;

    for (const obj of matched) this.advanceObjective(obj, player, emitter);
    this.finishProgress(player, emitter);
  }

  private handleNpcRescued(npc: NPC, player: Player, emitter: FloatingTextEmitter): void {
    if (!this.currentQuest) return;
    const isRescueTarget = npc.type === 'survivor' || npc.type === 'scholar';
    if (!isRescueTarget) return;

    const matched = this.pendingObjectives().filter((o) => o.type === 'escort_npc');
    if (matched.length === 0) return;

    for (const obj of matched) this.advanceObjective(obj, player, emitter);
    this.finishProgress(player, emitter);
  }

  private handleNpcTalked(npcId: string, player: Player, emitter: FloatingTextEmitter): void {
    if (!this.currentQuest) return;
    const matchedIds: Record<string, string[]> = {
      town_talk_guide: ['npc_guide'],
      town_visit_blacksmith: ['npc_blacksmith', 'npc_healer'],
    };

    const matched = this.pendingObjectives().filter((o) => matchedIds[o.id]?.includes(npcId));
    if (matched.length === 0) return;

    for (const obj of matched) {
      obj.current = 1;
      this.advanceObjective(obj, player, emitter);
    }
    this.finishProgress(player, emitter);
  }

  /** 按 objective 类型推进（开箱/神龛等计数型目标） */
  private advanceByType(
    type: QuestObjective['type'],
    player: Player,
    emitter: FloatingTextEmitter
  ): void {
    if (!this.currentQuest) return;

    const matched = this.pendingObjectives().filter((o) => o.type === type);
    if (matched.length === 0) return;

    for (const obj of matched) this.advanceObjective(obj, player, emitter);
    this.finishProgress(player, emitter);
  }

  // ---------- 进度推进与结算 ----------

  private pendingObjectives(): QuestObjective[] {
    return (this.currentQuest?.objectives ?? []).filter((o) => !o.isCompleted);
  }

  /** 推进一步；目标达成时立即结算奖励 */
  private advanceObjective(obj: QuestObjective, player: Player, emitter: FloatingTextEmitter): void {
    obj.current = Math.min(obj.target, obj.current + 1);
    if (obj.current >= obj.target) {
      this.completeObjective(obj, player, emitter);
    }
  }

  private completeObjective(obj: QuestObjective, player: Player, emitter: FloatingTextEmitter): void {
    obj.isCompleted = true;
    soundManager.playLevelUp(); // 目标达成的凯旋音效

    // 数值平衡(2026-09)：任务经验走统一结算（升级成长/技能点/连升判定），不再直接加裸经验
    if (obj.reward?.xp) {
      const leveled = grantExperience(player, obj.reward.xp).leveled;
      if (leveled) emitter(player.x, player.y - 1.2, `升级! 等级 ${player.stats.level}`, '#fbbf24', 18);
    }
    if (obj.reward?.emeralds) player.stats.emeralds += obj.reward.emeralds;

    emitter(player.x, player.y - 0.6, `🎯 达成目标: ${obj.title}!`, '#fbbf24', 18);
  }

  private finishProgress(player: Player, emitter: FloatingTextEmitter): void {
    if (!this.currentQuest) return;

    const allDone = this.currentQuest.objectives.every((o) => o.isCompleted);
    if (allDone && !this.currentQuest.allCompleted) {
      this.currentQuest.allCompleted = true;
      soundManager.playBossDeath();
      emitter(player.x, player.y - 1.2, '🌟 本层全部任务达成！传送石碑已激活！', '#38bdf8', 22);
    }
    this.onQuestUpdated?.();
  }
}

export const questSystem = new QuestSystem();
