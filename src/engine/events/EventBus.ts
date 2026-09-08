import { GameEventHandler, GameEventName, GameEventPayloads } from './GameEventMap';

/**
 * EventBus — 类型安全的最小事件总线。
 *
 * - 编译期校验：事件名与载荷类型一一对应（依据 GameEventPayloads）
 * - 订阅隔离：单个 handler 抛错不影响其他订阅者（try/catch 隔离）
 * - 返回退订函数：on() 的返回值可直接调用退订，避免持有 handler 引用
 */

export class GameEventBus {
  private handlers = new Map<GameEventName, Set<GameEventHandler<GameEventName>>>();

  /**
   * 订阅事件
   * @returns 退订函数
   */
  on<N extends GameEventName>(name: N, handler: GameEventHandler<N>): () => void {
    let set = this.handlers.get(name);
    if (!set) {
      set = new Set();
      this.handlers.set(name, set);
    }
    set.add(handler as GameEventHandler<GameEventName>);
    return () => this.off(name, handler);
  }

  /** 一次性订阅：首次触发后自动退订 */
  once<N extends GameEventName>(name: N, handler: GameEventHandler<N>): () => void {
    const unsubscribe = this.on(name, (payload) => {
      unsubscribe();
      handler(payload);
    });
    return unsubscribe;
  }

  /** 退订事件 */
  off<N extends GameEventName>(name: N, handler: GameEventHandler<N>): void {
    this.handlers.get(name)?.delete(handler as GameEventHandler<GameEventName>);
  }

  /**
   * 发射事件（同步广播）。
   * @returns 实际收到通知的订阅者数量
   */
  emit<N extends GameEventName>(name: N, payload: GameEventPayloads[N]): number {
    const set = this.handlers.get(name);
    if (!set || set.size === 0) return 0;

    let notified = 0;
    for (const handler of [...set]) {
      try {
        handler(payload);
        notified++;
      } catch (err) {
        console.error(`[GameEventBus] handler error on "${name}":`, err);
      }
    }
    return notified;
  }

  /** 查询某事件的订阅者数量（测试/诊断用） */
  listenerCount(name: GameEventName): number {
    return this.handlers.get(name)?.size ?? 0;
  }

  /** 清空某事件或全部订阅（测试隔离用） */
  clear(name?: GameEventName): void {
    if (name) {
      this.handlers.delete(name);
    } else {
      this.handlers.clear();
    }
  }
}
