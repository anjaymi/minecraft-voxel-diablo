/**
 * 兼容 shim — 任务系统已拆分至 `src/engine/quests/`。
 * 新代码请直接从 `./quests/QuestSystem` 导入单例。
 */
export { QuestSystem, questSystem } from './quests/QuestSystem';
