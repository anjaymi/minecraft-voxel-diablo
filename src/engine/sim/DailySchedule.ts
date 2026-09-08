import { NpcActivity } from './AgentTypes';

/**
 * DailySchedule — 城市住民的四时段日程（每个人自己的"人生作息"）。
 *
 * 一天 = DAY_LENGTH 秒；时段：清晨(0-0.25) 正午(0.25-0.5) 黄昏(0.5-0.75) 深夜(0.75-1)。
 * 坐标为城镇瓦片位：各建筑内部位置对应 TownMapFactory 的四象限建筑。
 */

export const DAY_LENGTH = 480; // 8 分钟一个昼夜

export type TimePhase = 'morning' | 'noon' | 'evening' | 'night';

export interface ScheduleEntry {
  activity: NpcActivity;
  x: number;
  y: number;
}

export function phaseOf(dayT: number): TimePhase {
  if (dayT < 0.25) return 'morning';
  if (dayT < 0.5) return 'noon';
  if (dayT < 0.75) return 'evening';
  return 'night';
}

/** 各建筑内部位置（宿舍/卧室） */
const HOME = {
  forge: { x: 7, y: 8 },
  guildA: { x: 31, y: 8 },
  guildB: { x: 34, y: 8 },
  guildC: { x: 33, y: 10 },
  innA: { x: 11, y: 32 },
  innB: { x: 7, y: 32 },
  innC: { x: 7, y: 33 },
  innD: { x: 11, y: 33 },
  hallA: { x: 30, y: 32 },
  hallB: { x: 34, y: 32 },
} as const;

const PLAZA = {
  north: { x: 21, y: 18 },
  south: { x: 20, y: 24 },
  west: { x: 17, y: 22 },
  east: { x: 24, y: 21 },
  playA: { x: 18, y: 20 },
  playB: { x: 23, y: 23 },
} as const;

/** 岗位（与 townNpcCatalog 的常驻位置一致） */
const POST = {
  guide: { x: 21, y: 17 },
  smith: { x: 9, y: 12 },
  healer: { x: 15, y: 22 },
  master: { x: 25, y: 22 },
  inn: { x: 9, y: 36 },
  merchant: { x: 19, y: 25 },
  enchanter: { x: 32, y: 12 },
  alchemist: { x: 30, y: 12 },
  bard: { x: 32, y: 36 },
  lord: { x: 32, y: 32 },
  gateS: { x: 23, y: 39 },
  gateN: { x: 23, y: 3 },
} as const;

function entry(activity: NpcActivity, p: { x: number; y: number }): ScheduleEntry {
  return { activity, x: p.x, y: p.y };
}

/** npcId → 四时段日程（每人自己的人生作息） */
export const SCHEDULES: Record<string, Record<TimePhase, ScheduleEntry>> = {
  // 铁匠：清晨开炉，正午打铁，黄昏去广场透风，深夜睡锻造铺
  npc_blacksmith: {
    morning: entry('work', POST.smith), noon: entry('work', POST.smith),
    evening: entry('leisure', PLAZA.east), night: entry('sleep', HOME.forge),
  },
  // 牧师：清晨广场祈福，正午守位，黄昏休闲，深夜宿公会客房
  npc_healer: {
    morning: entry('work', PLAZA.west), noon: entry('work', POST.healer),
    evening: entry('leisure', PLAZA.south), night: entry('sleep', HOME.guildA),
  },
  // 引路人：白天广场指路，黄昏去酒馆打听消息，深夜回旅店
  npc_guide: {
    morning: entry('work', POST.guide), noon: entry('work', POST.guide),
    evening: entry('leisure', POST.bard), night: entry('sleep', HOME.innC),
  },
  // 职业导师：夜猫子——正午才露面，黄昏广场散步，深夜冥想（不睡）
  npc_class_master: {
    morning: entry('idle', HOME.guildC), noon: entry('work', POST.master),
    evening: entry('leisure', PLAZA.east), night: entry('idle', HOME.guildC),
  },
  // 老板娘：几乎全天守店，黄昏才去广场透口气
  npc_innkeeper: {
    morning: entry('work', POST.inn), noon: entry('work', POST.inn),
    evening: entry('leisure', PLAZA.south), night: entry('sleep', HOME.innA),
  },
  // 行商：清晨出摊，正午广场吆喝，黄昏酒馆混消息，深夜宿旅店
  npc_merchant: {
    morning: entry('work', POST.merchant), noon: entry('work', PLAZA.south),
    evening: entry('leisure', POST.bard), night: entry('sleep', HOME.innB),
  },
  // 附魔师：白天守公会门口，黄昏回炉研究，深夜睡觉
  npc_enchanter: {
    morning: entry('work', POST.enchanter), noon: entry('work', POST.enchanter),
    evening: entry('work', HOME.guildB), night: entry('sleep', HOME.guildB),
  },
  // 炼金师：同上，深夜还在熬药（睡得晚起得晚）
  npc_alchemist: {
    morning: entry('sleep', HOME.guildA), noon: entry('work', POST.alchemist),
    evening: entry('work', POST.alchemist), night: entry('work', HOME.guildA),
  },
  // 吟游诗人：上午睡懒觉，正午广场演出，黄昏酒馆演出，深夜宿议事厅
  npc_bard: {
    morning: entry('sleep', HOME.hallA), noon: entry('perform', PLAZA.north),
    evening: entry('perform', POST.bard), night: entry('sleep', HOME.hallA),
  },
  // 城主：清晨议事厅理政到黄昏，深夜睡议事厅（几乎不出门）
  npc_lord: {
    morning: entry('work', POST.lord), noon: entry('work', POST.lord),
    evening: entry('work', POST.lord), night: entry('sleep', HOME.hallB),
  },
  // 守卫：通宵值岗，正午换防北门（全城唯一不睡觉的人）
  npc_guard: {
    morning: entry('patrol', POST.gateS), noon: entry('patrol', POST.gateN),
    evening: entry('patrol', POST.gateS), night: entry('patrol', POST.gateS),
  },
  // 小孩：清晨广场玩，正午采花，黄昏还在玩，深夜被喊回家睡觉
  npc_kid: {
    morning: entry('play', PLAZA.playA), noon: entry('play', PLAZA.playB),
    evening: entry('play', PLAZA.playA), night: entry('sleep', HOME.innD),
  },
};

export function getScheduleEntry(npcId: string, phase: TimePhase): ScheduleEntry {
  const schedule = SCHEDULES[npcId];
  if (!schedule) return { activity: 'idle', x: 21, y: 21 };
  return schedule[phase];
}
