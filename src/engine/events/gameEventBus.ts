import { DungeonFloor, Enemy, NPC, Player } from '../../types';
import { GameEventBus } from './EventBus';
import { FloatingTextEmitter, GameEvents } from './GameEventMap';

/**
 * gameEventBus — 全局游戏事件总线单例与语义化发射辅助函数。
 *
 * 引擎侧调用 emitXxx(...) 而不是手写 gameEventBus.emit(GameEvents.X, {...})，
 * 保证载荷字段在唯一出口处拼写正确。
 */

export const gameEventBus = new GameEventBus();

export function emitZoneEntered(floor: DungeonFloor): void {
  gameEventBus.emit(GameEvents.ZONE_ENTERED, { floor });
  if (floor.zoneType !== 'town') {
    gameEventBus.emit(GameEvents.FLOOR_CHANGED, { floorNumber: floor.floorNumber });
  }
}

export function emitEnemyKilled(enemy: Enemy, player: Player, emitter: FloatingTextEmitter): void {
  gameEventBus.emit(GameEvents.ENEMY_KILLED, { enemy, player, emitter });
}

export function emitChestOpened(
  x: number,
  y: number,
  player: Player,
  emitter: FloatingTextEmitter
): void {
  gameEventBus.emit(GameEvents.CHEST_OPENED, { x, y, player, emitter });
}

export function emitShrineActivated(
  x: number,
  y: number,
  player: Player,
  emitter: FloatingTextEmitter
): void {
  gameEventBus.emit(GameEvents.SHRINE_ACTIVATED, { x, y, player, emitter });
}

export function emitNpcRescued(npc: NPC, player: Player, emitter: FloatingTextEmitter): void {
  gameEventBus.emit(GameEvents.NPC_RESCUED, { npc, player, emitter });
}

export function emitNpcTalked(npcId: string, player: Player, emitter: FloatingTextEmitter): void {
  gameEventBus.emit(GameEvents.NPC_TALKED, { npcId, player, emitter });
}
