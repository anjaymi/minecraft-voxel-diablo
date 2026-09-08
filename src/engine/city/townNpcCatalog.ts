import { CityNpcDefinition, CityService, DialogueStateKey } from './NpcDefinition';

/**
 * townNpcCatalog — 翡翠圣城住民名单（12 人）。
 *
 * 台词遵循 DQ 原则：每句话都有信息量——指引设施、暗示隐藏要素
 * （生态传送门/瞭望塔/水洼宝箱）、或随进度推进改变口吻。
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

export const TOWN_NPC_ROSTER: CityNpcDefinition[] = [
  npc('npc_guide', '引路人卡恩', 'guide', '#38bdf8', '📜', 21, 17, 2.0, 'none', undefined,
    ['前方是无尽的地下城...', '去南门找守卫罗兰，他会告诉你荒原的凶险。', '先在城里备好药水，地牢可不等人。'],
    ['听说你击溃了深渊领主？全城都在传颂你的名字！', '地牢更深处的炼狱与虚空，可比第一层凶残得多。'],
    ['虚空终末殿堂已被你踏平……传奇冒险者，城里正为你立像呢。']),

  npc('npc_blacksmith', '铁匠麦格尼', 'blacksmith', '#f97316', '⚒️', 9, 12, 1.2, 'open_camp_blacksmith', undefined,
    ['好钢用在刀刃上！要锤炼装备就交给我。', '这批黑铁矿石是从地牢二层背出来的，火候正好。', '武器钝了别硬撑，进来让我敲两下。'],
    ['嚯！你那把刀上的领主血迹我都认得。拿来，我给你重新开锋！', '下一层的家伙什更硬，没我的好料可不行。'],
    ['你这装备已经是传说了……老麦格尼这辈子值了。']),

  npc('npc_healer', '牧师莎莉', 'healer', '#fbbf24', '✨', 15, 22, 1.5, 'heal_blessing', undefined,
    ['圣光会指引你。受伤了吗？来这里恢复。', '旅途辛苦了，让我为你祈福。', '城里的泉水有圣光加持，免费畅饮。'],
    ['你的伤会痊愈的，但别把命丢在更深的地牢里。', '圣光告诉我，你正在成为传说。'],
    ['愿圣光永远庇佑你，冒险者。']),

  npc('npc_class_master', '职业导师艾尔德温', 'class_master', '#a855f7', '🧙‍♂️', 25, 22, 1.2, 'class_transfer', undefined,
    ['冒险者，感受体内沉睡的奥术、死灵与自然之魂！', '在此自由洗练转职，觉醒你的真正潜力！'],
    ['你的转职之路已初见雏形……但星辰还指向更远的形态。', '换个职业试试？战斗的方式远不止一种。'],
    ['你已经站在职业之道的尽头，前人未至之境。']),

  npc('npc_innkeeper', '老板娘玛莎', 'innkeeper', '#ec4899', '🛏️', 9, 36, 0.8, 'inn_rest', 12,
    ['翡翠之月旅店，睡一晚 12 绿宝石，包你生龙活虎！', '床铺刚晒过太阳，还有热汤和药水。', '远征前睡个好觉，比什么祝福都管用。'],
    ['打败领主的英雄也要睡觉的！今晚房费给你算便宜点……才怪。', '你的呼噜声全旅店都听见了——开个玩笑，快去休息。'],
    ['英雄套房永久免费！不过你还是老样子打地铺对吧？']),

  npc('npc_merchant', '行商布诺', 'merchant', '#22c55e', '💰', 15, 26, 0.6, 'open_shop', undefined,
    ['稀罕货！都是稀罕货！可惜好宝箱都被荒原的魔物守着。', '告诉你个秘密：荒原的废墟里藏着上锁的宝箱。', '想发财？去野外的水洼边上转转，有人丢过钱袋。'],
    ['你的名声传到商路上了！这批货……咳，还是老价钱。', '听说地牢更深处有会喷火的魔物，带够药水再去。'],
    ['和传奇做买卖，我这辈子吹一辈子！']),

  npc('npc_enchanter', '附魔师伊薇特', 'enchanter', '#c084fc', '🔮', 32, 12, 0.8, 'open_camp_enchanter', undefined,
    ['附魔是艺术，不是杂耍。把装备拿来。', '平庸的武器不值得我动用符文。', '月圆之夜的附魔成功率……是行业机密。'],
    ['你武器上残留的深渊气息，倒是绝佳的附魔媒介。', '想要更强的力量？代价是更多的绿宝石。'],
    ['为你附魔过的每件装备，都会写进我的符文录。']),

  npc('npc_alchemist', '炼金师青草', 'alchemist', '#84cc16', '⚗️', 30, 12, 0.8, 'open_camp_alchemist', undefined,
    ['新调的药剂！喝一口精神百倍——副作用还在测试。', '药水、炸药、毒瓶，只有你想不到，没有我调不出。', '地牢里的蘑菇别乱吃！除非先给我看看。'],
    ['领主的骨灰是绝世药材……呃，你懂我的意思吧？', '我的爆炸药水升级了，小心别把自己的鞋炸飞。'],
    ['为了庆祝你的胜利，我酿了……呃，还是别喝了。']),

  npc('npc_bard', '吟游诗人小薇', 'bard', '#f472b6', '🎵', 32, 36, 1.5, 'none', undefined,
    ['♪ 荒原的风里有古老传送门的歌谣，踏进去就是未知之地～', '♪ 听说过荒原上的瞭望塔吗？登高的人看得见宝藏的微光～', '♪ 我在写一首英雄的歌，可惜还缺个结局。'],
    ['♪ 领主陨落那一击，我谱成了新曲！要不要听听？', '♪ 议事厅的城主正在找你，大人物找你可不常见哟～'],
    ['♪ 这首歌叫《踏平虚空的人》，全城都在传唱你的名字！']),

  npc('npc_lord', '城主奥德里克', 'lord', '#eab308', '👑', 32, 32, 0, 'none', undefined,
    ['冒险者，地牢深处的凋灵领主侵蚀着这片大陆。城邦需要你。', '每击溃一层领主，圣城的结界就会多撑一天。去吧。', '补给已为你备好。荣誉与绿宝石，都不会亏待英雄。'],
    ['你击溃了深渊领主！城邦的史官已记下你的功绩。', '炼狱的火焰在呼唤你的名字……议会期待你的凯旋。'],
    ['虚空已净，大陆重归安宁。翡翠圣城永远向传奇敞开。']),

  npc('npc_guard', '守门卫兵罗兰', 'guard', '#64748b', '🛡️', 23, 39, 1.0, 'none', undefined,
    ['南门外是落日荒原，魔物成群，结伴再去。', '沿主路一直向南就是地牢入口，别乱闯野地。', '岗位在身，闲聊免了——…好吧，就聊一句。'],
    ['领主被你干掉了？荒原的魔物老实了不少，但别大意。', '最近有商人说见过会喷火的怪物……在地牢二层方向。'],
    ['能为你这样的传奇开城门，是我的荣幸！']),

  npc('npc_kid', '采花小孩尼克', 'child', '#fcd34d', '🌸', 17, 19, 2.2, 'none', undefined,
    ['哥哥你看！我在喷泉边采到好大的花！', '大人们说水洼边不能去……但我看见有人在水洼里捡到过亮晶晶的东西！', '等我长大也要去地牢打大魔王！'],
    ['哇！你是打败大魔王的人吗？！教我用剑好不好！', '妈妈说你的名字会写进教科书！是真的吗？'],
    ['英雄哥哥！给我签个名！签在我的花朵上！']),
];

export function getTownNpcDefinition(id: string): CityNpcDefinition | undefined {
  return TOWN_NPC_ROSTER.find((d) => d.id === id);
}
