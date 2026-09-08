/**
 * Events 模块公共 API（barrel）。
 *
 * 目录结构：
 * - GameEventMap.ts    事件名常量 + 载荷类型登记（唯一事实来源）
 * - GameEventBus.ts    类型安全事件总线（on/off/once/emit）
 * - gameEventBus.ts    全局单例 + 语义化 emitXxx 辅助函数
 */
export { GameEvents } from './GameEventMap';
export type {
  GameEventName,
  GameEventPayloads,
  GameEventHandler,
  FloatingTextEmitter,
} from './GameEventMap';
export { GameEventBus } from './EventBus';
export {
  gameEventBus,
  emitZoneEntered,
  emitEnemyKilled,
  emitChestOpened,
  emitShrineActivated,
  emitNpcRescued,
  emitNpcTalked,
} from './gameEventBus';
