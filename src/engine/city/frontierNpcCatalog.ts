import { CityNpcDefinition, CityService, DialogueStateKey } from './NpcDefinition';

/**
 * frontierNpcCatalog — 前哨城塞常驻 NPC（边境戍卫班）。
 *
 * 与主城共用对话状态机与服务体系；位置为城塞瓦片坐标。
 */

const PRE: DialogueStateKey = 'pre_expedition';
const BOSS: DialogueStateKey = 'after_first_boss';
const WIN: DialogueStateKey = 'after_victory';

function npc(
  id: string,
  name: string,
  type: CityNpcDefinition['type'],
  color: string,
  icon: string,
  x: number,
  y: number,
  wanderRadius: number,
  service: CityService,
  serviceCost: number | undefined,
  pre: string[],
  boss: string[],
  win: string[]
): CityNpcDefinition {
  return { id, name, type, color, icon, x, y, wanderRadius, service, serviceCost, dialogueStates: { pre_expedition: pre, after_first_boss: boss, after_victory: win } };
}

export const FRONTIER_NPC_ROSTER: CityNpcDefinition[] = [
  npc('frt_captain', '戍卫队长铁心', 'quest_giver', '#dc2626', '🎖️', 21, 20, 0.8, 'none', undefined,
    ['六大荒野都从前哨出发。负伤了就回来，医师随军。', '奇美拉在沙漠的巢穴里盘踞多年……你若敢去，替我拔了它一颗牙。', '别小看边境的魔物，它们比主城的批次凶三倍。'],
    ['你的名字已经传遍边防军。铁心在此谢过！', '巨兽们躁动起来了——它们怕你。'],
    ['边境因你而安宁。这座城塞会永远留着你的位置。']),

  npc('frt_medic', '随军医师苇拉', 'healer', '#34d399', '🌿', 17, 24, 1.2, 'heal_blessing', undefined,
    ['随军医师苇拉，包扎免费，药草自采。', '边境的伤不等人，过来让我看看。'],
    ['你的伤口愈合得比谁都快，好体质。', '药草快被伤员用光了，省着点。'],
    ['为传奇疗伤，是我的荣幸。']),

  npc('frt_trader', '随军商人戈毕', 'merchant', '#f59e0b', '🎒', 33, 11, 0.8, 'open_shop', undefined,
    ['前线物价贵，但货真价实！', '听说沼泽深处的泥沼巨兽守着一批沉船宝藏……', '帐篷、干粮、炸药——远征三件套！'],
    ['英雄面前不卖假货！这条规矩我懂。', '巨兽 material 很值钱，你打我收！'],
    ['能跟传奇做买卖，我这辈子值了！']),

  npc('frt_scout', '斥候鸦青', 'guard', '#94a3b8', '🪶', 21, 15, 2.0, 'none', undefined,
    ['各处传送门的另一头，我都亲眼看过。', '冰原的霜喉巨兽……上次侦察队只回来了一半。', '蘑菇林夜间发光，那是孢子在呼吸。'],
    ['魔物被你杀得不敢靠近哨线，干得漂亮。', '沙漠巢穴的奇美拉最近很安静……它在怕什么？'],
    ['斥候团全员向你敬礼！']),
];

export function getFrontierNpcDefinition(id: string): CityNpcDefinition | undefined {
  return FRONTIER_NPC_ROSTER.find((d) => d.id === id);
}
