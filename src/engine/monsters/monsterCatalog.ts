import { ZoneType } from '../../types';
import { defMonster, MonsterDefinition } from './MonsterDefinition';

/**
 * monsterCatalog — 100 种怪物图鉴数据（对应 docs/monster-bestiary-plan.md）。
 *
 * 每行一条：id / 名称 / 族系 / 等级带 / 定位 / 骨架模型 / 主题色 / 出没区域 / 数值倍率 / 机制标签
 * baseType 必须是 MONSTER_CONFIGS 现有键（渲染复用，零新模型成本）。
 */

const OW: ZoneType = 'overworld';
const DG: ZoneType = 'dungeon';
const NE: ZoneType = 'nether';
const EN: ZoneType = 'end';
const FR: ZoneType = 'frost';
const VO: ZoneType = 'volcano';
const MU: ZoneType = 'mushroom';
const DE: ZoneType = 'desert';
const SW: ZoneType = 'swamp';
const CU: ZoneType = 'cursed';

export const MONSTER_CATALOG: MonsterDefinition[] = [
  // ===== 1. 亡灵族系 Undead（12）=====
  defMonster('shambling_zombie', '蹒跚腐尸', 'undead', 0, 'filler', 'zombie', '#7ca982', [OW, DG]),
  defMonster('hollow_zombie', '空壳尸', 'undead', 1, 'melee', 'zombie', '#8fb59a', [DG], { hp: 0.9 }, 'splitOnDeath'),
  defMonster('rot_hulk', '腐化巨尸', 'undead', 2, 'tank', 'armored_zombie', '#5f7a4a', [SW, DG], { hp: 2.2, damage: 1.3, speed: 0.8, size: 1.35 }, 'corruptionStack'),
  defMonster('bone_archer', '白骨弓手', 'undead', 1, 'ranged', 'skeleton', '#d8d4c8', [OW, DG], { attackRange: 1.4 }),
  defMonster('bone_pikeman', '骨矛兵', 'undead', 1, 'melee', 'skeleton', '#c9c2b2', [DG], { attackRange: 1.8, damage: 1.15 }),
  defMonster('bone_mage', '白骨法师', 'undead', 2, 'caster', 'necromancer', '#b0a8d8', [DG, CU], { hp: 0.85, damage: 1.2 }, 'boneWall'),
  defMonster('wight', '雾缚尸鬼', 'undead', 2, 'assassin', 'zombie', '#93a8c4', [CU, FR], { speed: 1.5, damage: 1.2, hp: 0.8 }, 'leapStrike'),
  defMonster('carrion_flock', '食腐鸟群', 'undead', 1, 'filler', 'spider', '#6e5f52', [OW, SW], { hp: 0.6, speed: 1.6, size: 0.8 }),
  defMonster('ghoul_pack_alpha', '食尸鬼头狼', 'undead', 2, 'support', 'armored_zombie', '#a86e5a', [FR, CU], { hp: 1.5, damage: 1.2 }, 'packHowl'),
  defMonster('necromancer_acolyte', '死灵侍僧', 'undead', 2, 'summoner', 'necromancer', '#8a6db8', [CU, DG], { hp: 0.9 }, 'reviveBones'),
  defMonster('barrow_knight', '冢中骑士', 'undead', 3, 'tank', 'armored_zombie', '#8c98a8', [DG, CU], { hp: 2.8, defense: 2, damage: 1.3, speed: 0.85, size: 1.25 }, 'shieldWall'),
  defMonster('bonespitter_titan', '吐骨泰坦', 'undead', 3, 'ranged', 'armored_zombie', '#e0dcc8', [DG], { hp: 2.4, damage: 1.6, attackRange: 2, size: 1.3 }, 'boneSpray'),

  // ===== 2. 兽形野兽 Beasts（10）=====
  defMonster('dire_wolf', '恐狼', 'beast', 1, 'melee', 'spider', '#5d6b70', [OW, FR], { speed: 1.4, damage: 1.1 }, 'flankAttack'),
  defMonster('frost_stalker', '霜踪猎手', 'beast', 2, 'assassin', 'spider', '#b8d4e8', [FR], { damage: 1.6, hp: 0.8 }, 'snowCloak'),
  defMonster('snow_tusker', '雪牙巨猪', 'beast', 1, 'melee', 'zombie', '#e8e4dc', [FR], { hp: 1.6, speed: 1.1 }, 'chargeStun'),
  defMonster('thunderhoof_ram', '雷蹄公羊', 'beast', 2, 'melee', 'armored_zombie', '#c8b878', [FR], { hp: 1.4, damage: 1.3 }, 'shockCharge'),
  defMonster('glacier_bear', '冰川巨熊', 'beast', 3, 'tank', 'armored_zombie', '#7a94ac', [FR], { hp: 3, damage: 1.5, speed: 0.85, size: 1.4 }, 'roarFear'),
  defMonster('dune_snapper', '沙丘巨蜥', 'beast', 2, 'assassin', 'spider', '#c2a55e', [DE], { damage: 1.4 }, 'burrowAmbush'),
  defMonster('scorpic', '焦土蝎犬', 'beast', 1, 'filler', 'spider', '#b06840', [VO, DE], { speed: 1.5, hp: 0.75 }, 'hitAndRun'),
  defMonster('crag_howler', '岩吼兽', 'beast', 2, 'caster', 'armored_zombie', '#8a7668', [VO], { hp: 1.8, damage: 1.2 }, 'shockwaveRoar'),
  defMonster('mirage_stag', '蜃景灵鹿', 'beast', 2, 'support', 'goblin', '#d8c8a0', [DE], { speed: 1.3, hp: 0.9 }, 'mirrorImages'),
  defMonster('grove_warden_stag', '林苑守鹿', 'beast', 2, 'tank', 'goblin', '#8ab87a', [MU], { hp: 2, defense: 1.5 }, 'bodyguardAura'),

  // ===== 3. 掠夺者部族 Illagers（10）=====
  defMonster('goblin_scuttler', '窜行哥布林', 'illager', 0, 'filler', 'goblin', '#7ca86a', [OW, DE]),
  defMonster('goblin_sapper', '哥布林爆破手', 'illager', 1, 'caster', 'goblin', '#c88a4a', [OW, VO], { hp: 0.7, speed: 1.3 }, 'selfDestruct'),
  defMonster('goblin_hoarder', '哥布林守财奴', 'illager', 1, 'filler', 'goblin', '#d8b84a', [DE, OW], { hp: 0.8, speed: 1.4 }, 'coinSteal'),
  defMonster('pillager_raider', '掠夺者袭击者', 'illager', 1, 'ranged', 'skeleton', '#5a6a8a', [OW, DE, VO]),
  defMonster('vindicator_cleaver', '卫道士屠夫', 'illager', 2, 'melee', 'piglin_brute', '#8a9ab8', [VO, DE], { damage: 1.5, hp: 1.4 }, 'cleaveWindup'),
  defMonster('evoker_ritualist', '唤魔者祭司', 'illager', 3, 'summoner', 'necromancer', '#b8b8d8', [DG, CU], { damage: 1.3 }, 'fangTrap'),
  defMonster('pillager_beastmaster', '掠夺者驯兽师', 'illager', 2, 'support', 'skeleton', '#6a7a9a', [FR, OW], {}, 'beastCommand'),
  defMonster('sand_marauder', '沙暴掠袭者', 'illager', 2, 'ranged', 'skeleton', '#c8a878', [DE], { speed: 1.4 }, 'sandBlind'),
  defMonster('goblin_war_drummer', '哥布林战鼓手', 'illager', 2, 'support', 'goblin', '#a86a4a', [VO], { hp: 1.2 }, 'warDrum'),
  defMonster('plunder_captain', '掠夺队长', 'illager', 3, 'boss', 'piglin_brute', '#4a5a7a', [OW, DE, VO], { hp: 3.2, damage: 1.6, size: 1.3 }, 'threePhase'),
  // 特殊：荒野掠夺者（敌对人形冒险者，defId 触发玩家骨架渲染覆写，见 AdventurerRenderer）
  defMonster('wandering_bandit', '荒野掠夺者', 'illager', 2, 'assassin', 'goblin', '#b04a3a', [OW, FR, VO, DE, SW, MU, CU], { hp: 1.1, damage: 1.25, speed: 1.2 }, 'ambushPlayer'),

  // ===== 4. 元素构装 Elementals（10）=====
  defMonster('frost_wisp', '霜魂精', 'elemental', 1, 'caster', 'slime', '#a8d8f0', [FR, DG], { hp: 0.7, damage: 0.9 }, 'chillTouch'),
  defMonster('blizzard_seer', '暴风雪先知', 'elemental', 3, 'caster', 'witch', '#c8e8f8', [FR], { damage: 1.5 }, 'blizzard'),
  defMonster('ember_sprite', '余烬精灵', 'elemental', 1, 'assassin', 'slime', '#f0884a', [VO], { hp: 0.65, speed: 1.5 }, 'flameDash'),
  defMonster('ember_fount', '火泉幼体', 'elemental', 1, 'ranged', 'blaze', '#e8683a', [VO], { speed: 0 }, 'fireFountain'),
  defMonster('magma_golem', '岩浆魔像', 'elemental', 3, 'tank', 'piglin_brute', '#d85820', [VO, NE], { hp: 3.2, defense: 2.2, speed: 0.7, size: 1.35 }, 'magmaArmor'),
  defMonster('obsidian_sentinel', '黑曜石哨卫', 'elemental', 2, 'tank', 'armored_zombie', '#3a3440', [VO], { hp: 2, defense: 1.8, speed: 0.8 }, 'shieldReflect'),
  defMonster('dust_djinn', '尘灵', 'elemental', 2, 'caster', 'blaze', '#d8c8a8', [DE], { hp: 0.9, speed: 1.2 }, 'dustBlind'),
  defMonster('storm_rune_tower', '风暴符文塔', 'elemental', 2, 'ranged', 'blaze', '#8ab8e8', [FR, DE], { speed: 0, hp: 1.8, attackRange: 2.2 }, 'lightningLock'),
  defMonster('bogfire_wisp', '沼火鬼火', 'elemental', 1, 'assassin', 'slime', '#a8e8b8', [SW], { hp: 0.6, speed: 1.1 }, 'ghostFire'),
  defMonster('geode_behemoth', '晶核巨兽', 'elemental', 3, 'tank', 'armored_zombie', '#b888d8', [DG], { hp: 2.8, defense: 1.8, size: 1.3 }, 'gemBurst'),

  // ===== 5. 虫豸蠕行 Vermin（10）=====
  defMonster('cave_creeper_larva', '穴蛛幼虫', 'vermin', 0, 'filler', 'spider', '#8a7a6a', [DG, MU], { hp: 0.5, size: 0.7 }),
  defMonster('web_weaver_spider', '织网蛛', 'vermin', 1, 'caster', 'spider', '#9a9aa8', [DG, SW], {}, 'webTrap'),
  defMonster('venom_spitter', '毒液喷吐蛛', 'vermin', 2, 'ranged', 'spider', '#7aa84a', [SW, MU], { attackRange: 1.5 }, 'venomLob'),
  defMonster('broodmother', '育母蛛后', 'vermin', 3, 'summoner', 'spider', '#5a4a5a', [DG], { hp: 2.6, damage: 1.2, size: 1.35 }, 'eggSpawner'),
  defMonster('sandscarab_swarm', '沙金甲虫群', 'vermin', 1, 'filler', 'spider', '#d8b858', [DE], { hp: 0.55, speed: 1.5, size: 0.75 }),
  defMonster('tomb_scarab_matriarch', '墓窟甲虫之母', 'vermin', 2, 'summoner', 'spider', '#b89848', [DE], { hp: 1.8, defense: 1.3 }, 'scarabGuard'),
  defMonster('rot_larva', '腐肉虫', 'vermin', 0, 'filler', 'slime', '#8a9a5a', [DG, SW], { hp: 0.45, size: 0.6 }),
  defMonster('spore_mite', '孢子螨', 'vermin', 1, 'filler', 'slime', '#a88ac8', [MU], { hp: 0.6, size: 0.7 }, 'sporeBurst'),
  defMonster('gloom_moth', '暗影飞蛾', 'vermin', 1, 'assassin', 'spider', '#5a5a72', [CU, MU], { hp: 0.7, speed: 1.6, size: 0.8 }, 'dustBlind'),
  defMonster('chitin_bladewing', '甲刃飞蝗', 'vermin', 2, 'assassin', 'spider', '#a8b84a', [DE, MU], { speed: 1.7, damage: 1.3 }, 'diveStrike'),

  // ===== 6. 深水腐潮 Murk（9）=====
  defMonster('drowned_husk', '溺尸空壳', 'murk', 1, 'melee', 'drowned', '#4a7a6a', [SW], { speed: 1.15 }),
  defMonster('drowned_spearman', '溺尸矛手', 'murk', 1, 'ranged', 'drowned', '#5a8a7a', [SW], { attackRange: 1.6 }),
  defMonster('murk_lurker', '浊水潜伏者', 'murk', 2, 'assassin', 'drowned', '#3a5a52', [SW], { damage: 1.5, hp: 0.85 }, 'waterAmbush'),
  defMonster('bog_croaker', '泥蛙鸣者', 'murk', 1, 'support', 'slime', '#6a9a4a', [SW], { hp: 0.9 }, 'croakSlow'),
  defMonster('ripple_stalker', '涟漪潜行者', 'murk', 2, 'assassin', 'drowned', '#5a9a9a', [SW], { speed: 1.4 }, 'amphibiousSwitch'),
  defMonster('brine_shaman', '卤水萨满', 'murk', 2, 'support', 'witch', '#7ab8a8', [SW], { hp: 0.9 }, 'healMurk'),
  defMonster('sunken_champion', '沉船勇者', 'murk', 3, 'tank', 'armored_zombie', '#4a6a8a', [SW], { hp: 2.8, defense: 1.8, damage: 1.3 }, 'dualForm'),
  defMonster('tidebound_sentinel', '缚潮哨卫', 'murk', 2, 'caster', 'drowned', '#6a8ac8', [SW, CU], { hp: 1.4 }, 'tidalPull'),
  defMonster('mire_behemoth', '泥沼巨兽', 'murk', 3, 'boss', 'armored_zombie', '#5a6a4a', [SW], { hp: 3.4, damage: 1.5, size: 1.45, speed: 0.75 }, 'mudWave'),

  // ===== 7. 下界军团 Nether Legion（10）=====
  defMonster('piglin_grunt', '猪灵步兵', 'nether', 1, 'melee', 'piglin_brute', '#d8a878', [VO, NE], { hp: 1.1 }),
  defMonster('piglin_brute_elite', '猪灵蛮兵·精锐', 'nether', 2, 'melee', 'piglin_brute', '#e88858', [VO], { hp: 1.8, damage: 1.4 }, 'twinAxe'),
  defMonster('blaze_keeper', '烈焰使者', 'nether', 2, 'ranged', 'blaze', '#f8b838', [NE, VO], { attackRange: 1.5 }, 'hoverEvade'),
  defMonster('magma_cuber', '岩浆史莱姆', 'nether', 1, 'melee', 'slime', '#e85828', [NE], { hp: 1.2 }, 'splitOnDeath'),
  defMonster('witherite_hound', '凋灵猎犬', 'nether', 2, 'assassin', 'zombie', '#3a3a3a', [NE], { speed: 1.7, damage: 1.2, hp: 0.8 }, 'witherBite'),
  defMonster('ghast_barrager', '恶魂炮手', 'nether', 2, 'ranged', 'blaze', '#e8e8e8', [NE], { attackRange: 2.2, hp: 0.9 }, 'lobbedBomb'),
  defMonster('hoglin_ravager', '霍克林掠夺兽', 'nether', 2, 'melee', 'piglin_brute', '#c87858', [VO], { hp: 1.6, damage: 1.3 }, 'goreToss'),
  defMonster('soul_flame_warden', '焰魂监工', 'nether', 3, 'caster', 'blaze', '#58c8d8', [NE], { damage: 1.4, hp: 1.3 }, 'soulCage'),
  defMonster('strider_outrider', '炽足骑士', 'nether', 2, 'ranged', 'skeleton', '#d86878', [NE], { speed: 1.3 }, 'mountedJavelin'),
  defMonster('basalt_colossus', '玄武岩巨像', 'nether', 4, 'boss', 'piglin_brute', '#4a4048', [NE], { hp: 4, damage: 1.8, size: 1.5, speed: 0.8 }, 'threePhase'),

  // ===== 8. 虚空异界 Voidborn（9）=====
  defMonster('void_mite', '虚空螨', 'voidborn', 2, 'filler', 'enderman', '#8a6a9a', [EN], { hp: 0.7, size: 0.8 }, 'shortBlink'),
  defMonster('shulker_sentinel', '潜影贝哨卫', 'voidborn', 2, 'ranged', 'blaze', '#b89ad8', [EN], { speed: 0.4 }, 'homingShot'),
  defMonster('ender_sentinel', '末影哨卫', 'voidborn', 2, 'melee', 'enderman', '#7a5a8a', [EN], { hp: 1.3, damage: 1.2 }, 'blinkBackstab'),
  defMonster('void_archivist', '虚空记录者', 'voidborn', 3, 'caster', 'witch', '#6a5a9a', [EN], { damage: 1.4 }, 'skillMirror'),
  defMonster('phase_leaper', '相位跃行者', 'voidborn', 2, 'assassin', 'enderman', '#9a7ab8', [EN, CU], { speed: 1.5, damage: 1.3, hp: 0.85 }, 'phaseDance'),
  defMonster('gravity_anomaly', '引力异常体', 'voidborn', 3, 'caster', 'enderman', '#4a5a9a', [EN], { hp: 1.6 }, 'gravityWell'),
  defMonster('chorus_wraith', '紫颂怨灵', 'voidborn', 2, 'assassin', 'enderman', '#a87ab8', [EN], { hp: 0.9, speed: 1.3 }, 'soundDecoy'),
  defMonster('end_crystal_avatar', '终界水晶化身', 'voidborn', 4, 'boss', 'enderman', '#d8b8f8', [EN], { hp: 3.8, damage: 1.7, size: 1.4 }, 'crystalInvuln'),
  defMonster('void_sovereign_herald', '虚空君主先驱', 'voidborn', 4, 'boss', 'necromancer', '#5a4a7a', [EN], { hp: 3.5, damage: 1.6 }, 'voidRift'),

  // ===== 9. 真菌孢子 Fungal（9）=====
  defMonster('myconid_sprout', '菌人幼株', 'fungal', 1, 'filler', 'zombie', '#c8a878', [MU], { hp: 0.9, speed: 0.85 }),
  defMonster('spore_drifter', '孢子飘浮者', 'fungal', 1, 'caster', 'slime', '#b8d8a8', [MU], { hp: 0.8, speed: 0.6 }, 'sporeTrail'),
  defMonster('cap_guardian', '菌盖卫士', 'fungal', 2, 'tank', 'armored_zombie', '#8a6848', [MU], { hp: 2.2, defense: 1.6, speed: 0.8 }, 'capShield'),
  defMonster('puffball_bomber', '马勃轰炸者', 'fungal', 1, 'caster', 'slime', '#d8c8b8', [MU], { hp: 0.9 }, 'sporeCloud'),
  defMonster('mycelium_weaver', '菌丝编织者', 'fungal', 2, 'support', 'witch', '#98b878', [MU], { hp: 1 }, 'myceliumField'),
  defMonster('rotwood_treant', '朽木树人', 'fungal', 2, 'tank', 'armored_zombie', '#6a5a42', [MU, CU], { hp: 2.4, damage: 1.3, speed: 0.7, size: 1.3 }, 'treeAmbush'),
  defMonster('glowcap_oracle', '荧光神谕者', 'fungal', 3, 'support', 'witch', '#e8d878', [MU], { hp: 1.1 }, 'glowAura'),
  defMonster('spore_singer', '孢子歌者', 'fungal', 2, 'caster', 'witch', '#c878a8', [MU], { hp: 0.95 }, 'hypnoticSong'),
  defMonster('mold_revenant', '霉变复生者', 'fungal', 2, 'melee', 'zombie', '#7a8a68', [MU, CU], { hp: 1.3 }, 'moldRevive'),

  // ===== 10. 诅咒幽灵 Cursed（7）=====
  defMonster('wailing_wraith', '哭嚎怨灵', 'cursed', 2, 'assassin', 'skeleton', '#b8c8d8', [CU], { hp: 0.8, speed: 1.4, size: 0.9 }, 'wallPhasing'),
  defMonster('grave_shade', '墓影', 'cursed', 2, 'assassin', 'skeleton', '#6a6a7a', [CU], { damage: 1.5, hp: 0.8 }, 'graveAmbush'),
  defMonster('hex_doll', '巫蛊人偶', 'cursed', 2, 'caster', 'goblin', '#c8a8b8', [CU], { hp: 0.85 }, 'hexCurse'),
  defMonster('poltergeist_smith', '闹鬼铁匠', 'cursed', 3, 'melee', 'armored_zombie', '#8a7a8a', [CU], { hp: 2, damage: 1.5 }, 'floatingArsenal'),
  defMonster('cursed_banner_knight', '咒旗骑士', 'cursed', 3, 'support', 'armored_zombie', '#5a4a5a', [CU], { hp: 2.2, defense: 1.5 }, 'cursedBanner'),
  defMonster('nightmare_steed', '梦魇魔驹', 'cursed', 3, 'melee', 'armored_zombie', '#2a2a38', [CU], { hp: 2.4, damage: 1.6, speed: 1.3, size: 1.3 }, 'twoBarCharge'),
  defMonster('grimoire_phantom', '魔典幻影', 'cursed', 3, 'caster', 'witch', '#d8c8f8', [CU, DG], { hp: 1 }, 'randomPage'),

  // ===== 11. 世界首领 Bosses（4）=====
  defMonster('wither_sovereign', '凋灵君主', 'boss', 4, 'boss', 'wither_boss', '#4a4a52', [NE], { hp: 4.5, damage: 1.8, size: 1.4 }, 'skullBarrage'),
  defMonster('frost_maw_ancient', '霜喉上古巨兽', 'boss', 4, 'boss', 'armored_zombie', '#a8d8f8', [FR], { hp: 4.2, damage: 1.7, size: 1.5, speed: 0.85 }, 'frostBreath'),
  defMonster('the_hollow_conclave', '空壳议会', 'boss', 4, 'boss', 'necromancer', '#8a8a9a', [CU], { hp: 4, damage: 1.6 }, 'trinitySplit'),
  defMonster('sporeheart_titan', '孢子之心巨像', 'boss', 4, 'boss', 'armored_zombie', '#68a878', [MU], { hp: 4.4, damage: 1.6, size: 1.5 }, 'myceliumNetwork'),
  // 巨型世界首领（大地图巢穴专属，独立骨架模型）
  defMonster('chimera', '奇美拉', 'boss', 4, 'boss', 'chimera', '#d97706', [DE], { hp: 4.8, damage: 1.9, size: 2.6, speed: 1.15 }, 'tripleFang'),

  // ===== 12. 巨型世界首领（荒野新增：城塞外的巨兽巢穴）=====
  defMonster('ridgeback_tyrant', '脊冠暴君', 'boss', 4, 'boss', 'armored_zombie', '#b0562c', [OW], { hp: 4.6, damage: 1.9, size: 2.5, speed: 0.9, defense: 1.2 }, 'quakeBreaker'),

  // ===== 13. 生态巨兽变体（每区轮换的第二巨型首领）=====
  defMonster('dune_leviathan', '沙海巨蛟', 'boss', 4, 'boss', 'spider', '#c98f3f', [DE], { hp: 4.4, damage: 1.8, size: 2.4, speed: 1.05 }, 'sandStorm'),
  defMonster('magma_colossus', '熔岩巨灵', 'boss', 4, 'boss', 'piglin_brute', '#ea580c', [VO], { hp: 4.6, damage: 1.9, size: 2.4, speed: 0.85 }, 'moltenEruption'),
  defMonster('frost_leviathan', '霜鳞古龙', 'boss', 4, 'boss', 'wither_boss', '#b6d8f0', [FR], { hp: 4.7, damage: 1.9, size: 2.5, speed: 0.9 }, 'blizzardVeil'),
  defMonster('bog_titan', '沼渊巨鳄', 'boss', 4, 'boss', 'armored_zombie', '#5f7a4a', [SW], { hp: 4.5, damage: 1.8, size: 2.3, speed: 0.85 }, 'toxicBreath'),
  defMonster('mycelium_tyrant', '菌丝暴君', 'boss', 4, 'boss', 'necromancer', '#7bc47f', [MU], { hp: 4.4, damage: 1.7, size: 2.4 }, 'sporeCloud'),
  defMonster('void_leviathan', '虚空巨蛇', 'boss', 4, 'boss', 'enderman', '#8a7ac8', [CU], { hp: 4.3, damage: 1.7, size: 2.4, speed: 1.0 }, 'voidRift'),
  defMonster('wasteland_goliath', '荒原巨像', 'boss', 4, 'boss', 'wither_boss', '#8a8578', [OW], { hp: 4.5, damage: 1.8, size: 2.4, speed: 0.8 }, 'quakeBreaker'),
];
