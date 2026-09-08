import { DungeonFloor, Enemy, NPC, Player } from '../../types';

/**
 * GameEventMap — 游戏事件名称与载荷类型的唯一登记处。
 *
 * 事件命名规范：`<主体>:<动作>`（如 enemy:killed、zone:entered）。
 * 引擎只负责 emit，各系统（任务/音频/天气/成就…）按需订阅，彼此解耦。
 */

export type FloatingTextEmitter = (
  x: number,
  y: number,
  text: string,
  color: string,
  size?: number
) => void;

/** 全部游戏事件名（字符串字面量常量表） */
export const GameEvents = {
  ZONE_ENTERED: 'zone:entered',
  FLOOR_CHANGED: 'floor:changed',
  ENEMY_KILLED: 'enemy:killed',
  CHEST_OPENED: 'chest:opened',
  SHRINE_ACTIVATED: 'shrine:activated',
  NPC_RESCUED: 'npc:rescued',
  NPC_TALKED: 'npc:talked',
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];

/** 事件名 → 载荷类型映射（EventBus 依据此表做编译期校验） */
export interface GameEventPayloads {
  [GameEvents.ZONE_ENTERED]: {
    floor: DungeonFloor;
  };
  [GameEvents.FLOOR_CHANGED]: {
    floorNumber: number;
  };
  [GameEvents.ENEMY_KILLED]: {
    enemy: Enemy;
    player: Player;
    emitter: FloatingTextEmitter;
  };
  [GameEvents.CHEST_OPENED]: {
    x: number;
    y: number;
    player: Player;
    emitter: FloatingTextEmitter;
  };
  [GameEvents.SHRINE_ACTIVATED]: {
    x: number;
    y: number;
    player: Player;
    emitter: FloatingTextEmitter;
  };
  [GameEvents.NPC_RESCUED]: {
    npc: NPC;
    player: Player;
    emitter: FloatingTextEmitter;
  };
  [GameEvents.NPC_TALKED]: {
    npcId: string;
    player: Player;
    emitter: FloatingTextEmitter;
  };
}

export type GameEvent<N extends GameEventName> = {
  name: N;
  payload: GameEventPayloads[N];
};

export type GameEventHandler<N extends GameEventName> = (payload: GameEventPayloads[N]) => void;
