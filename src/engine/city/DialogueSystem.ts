import { Player } from '../../types';
import { CityNpcDefinition, CityService, DialogueStateKey, DIALOGUE_STATE_ORDER } from './NpcDefinition';

/**
 * DialogueSystem — DQ 式对话状态机。
 *
 * 按游戏进度解析台词状态（出发前 → 首胜领主 → 通关），
 * 服务执行所需的游戏进度判断也集中在此，引擎只负责扣费与生效。
 */

export interface GameProgress {
  bossesDefeated: number;
  isVictory: boolean;
}

/** 解析当前应处的对话状态 */
export function resolveDialogueState(progress: GameProgress): DialogueStateKey {
  if (progress.isVictory) return 'after_victory';
  if (progress.bossesDefeated >= 1) return 'after_first_boss';
  return 'pre_expedition';
}

/** 取 NPC 在当前进度下的台词列表 */
export function resolveDialogueLines(def: CityNpcDefinition, progress: GameProgress): string[] {
  const state = resolveDialogueState(progress);
  return def.dialogueStates[state] ?? def.dialogueStates.pre_expedition;
}

/** 随机抽一句台词 */
export function pickDialogueLine(def: CityNpcDefinition, progress: GameProgress): string {
  const lines = resolveDialogueLines(def, progress);
  return lines[Math.floor(Math.random() * lines.length)];
}

/** 下一状态名称（UI 提示用） */
export function nextDialogueStateHint(progress: GameProgress): string | null {
  const current = resolveDialogueState(progress);
  const idx = DIALOGUE_STATE_ORDER.indexOf(current);
  if (idx < 0 || idx >= DIALOGUE_STATE_ORDER.length - 1) return null;
  return DIALOGUE_STATE_ORDER[idx + 1];
}

/** 从玩家状态读取游戏进度 */
export function readProgress(player: Player, bossesDefeated: number, isVictory: boolean): GameProgress {
  return { bossesDefeated, isVictory };
}

/** 服务花费查询（0/undefined = 免费） */
export function serviceCostOf(def: CityNpcDefinition): number {
  return def.service && def.service !== 'none' ? def.serviceCost ?? 0 : 0;
}

export function isPaidService(service: CityService): boolean {
  return service === 'inn_rest';
}
