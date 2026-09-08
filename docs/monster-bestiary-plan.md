# 《方块暗黑破坏神》100 种怪物图鉴规划

> 版本 v1.0 · 配套系统：`enemyManager` / `eliteAffixSystem` / `behaviorTree` / `tacticalAdaptationSystem` / `chibi` 渲染族
> 六大生态区已实装：❄️冰霜苔原 · 🌋焦土火山 · 🍄荧光蘑菇林 · 🏜️烈日沙漠 · 🐊腐雾沼泽 · 👻咒怨林地

---

## 一、设计总则

1. **威胁分级（T0–T4）**：T0 新手填充（1-5级）→ T1 常规（5-15）→ T2 精英基础（15-25）→ T3 稀有头目（25-40）→ T4 世界首领（40+）。
2. **三秒可读性规则**：每种怪物的核心机制必须在接敌 3 秒内被玩家感知（起手动作/音效/体色变化），避免"隐形惩罚"。
3. **族系克制锚点**：亡灵惧圣火、野兽惧恐惧、构装惧雷电、真菌惧火焰、幽灵惧物理——通过现有 `elementalSystem` 的元素状态实现，不新增系统。
4. **词缀兼容**：所有 T1 以上怪物必须与 `eliteAffixSystem` 现有词缀（ShieldReflect/ToxicAura/Summoner/MoltenTrail 等）正交组合；机制类怪物自带机制优先级高于词缀。
5. **掉落经济**：怪物掉落绑定 `lootSystem` 稀有度权重，每族系有 1 个专属掉落倾向（见各族系表末列），支撑刷刷乐循环。

## 二、等级带 × 区域分布总表

| 区域 | 主力等级带 | 族系构成 | 环境机制 |
|---|---|---|---|
| 迷雾落日荒原 | Lv1-10 | 亡灵 / 野兽 / 掠夺者 | 无 |
| 💀 随机地牢·王陵 | Lv8-20 | 亡灵 / 虫豸 | 狭窄走廊，弓手火力网 |
| 🌋 随机地牢·炼狱 | Lv15-25 | 下界 / 元素 | 熔岩地面伤害 |
| 🌌 随机地牢·虚空 | Lv25-40 | 虚空 / 元素 | 传送诡计 |
| ❄️ 冰霜苔原 | Lv10-18 | 野兽 / 亡灵 / 元素 | 冰面滑行（移速惯性） |
| 🌋 焦土火山 | Lv16-26 | 下界 / 元素 / 掠夺者 | 熔岩池 / 灰烬视野 |
| 🍄 荧光蘑菇林 | Lv12-20 | 真菌 / 虫豸 / 虚空 | 孢子雾（视野遮罩） |
| 🏜️ 烈日沙漠 | Lv14-22 | 掠夺者 / 虫豸 / 亡灵 | 沙暴视野 / 流沙减速 |
| 🐊 腐雾沼泽 | Lv15-24 | 深水 / 虫豸 / 真菌 | 浊水减速 / 隐匿突袭 |
| 👻 咒怨林地 | Lv20-32 | 诅咒 / 亡灵 / 虚空 | 磷火视野 / 墓园复活点 |

## 三、族系图鉴（100 种）

### 1. 亡灵族系 Undead（12 种）——掉落倾向：护甲与药水

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 1 | `shambling_zombie` | 蹒跚腐尸 | 荒原/王陵 | T0 | 近战填充 | 无特殊，群体压迫 |
| 2 | `hollow_zombie` | 空壳尸 | 王陵 | T1 | 近战 | 死亡时分裂 2 只腐肉虫（#49 联动） |
| 3 | `rot_hulk` | 腐化巨尸 | 沼泽/王陵 | T2 | 重装近战 | 受击叠"腐败层数"，满层爆发毒圈 |
| 4 | `bone_archer` | 白骨弓手 | 荒原/王陵 | T1 | 远程 | 火力网：与同伴交替射击保持压制 |
| 5 | `bone_pikeman` | 骨矛兵 | 王陵 | T1 | 长柄 | 长矛封锁走廊，正面格挡近战 |
| 6 | `bone_mage` | 白骨法师 | 王陵/咒怨 | T2 | 法系 | 召唤骨墙阻断走位，棱镜弹道 |
| 7 | `wight` | 雾缚尸鬼 | 咒怨/苔原 | T2 | 突进近战 | 短冷却跃扑 + 命中偷取移速 |
| 8 | `carrion_flock` | 食腐鸟群 | 荒原/沼泽 | T1 | 游击 | 不受碰撞体积，俯冲啄击后盘旋 |
| 9 | `ghoul_pack_alpha` | 食尸鬼头狼 | 苔原/咒怨 | T2 | 群体增伤 | 嗜血嚎叫：周围亡灵攻速 +25% |
| 10 | `necromancer_acolyte` | 死灵侍僧 | 咒怨/王陵 | T2 | 召唤师 | 持续复活墓园骨堆（上限 3） |
| 11 | `barrow_knight` | 冢中骑士 | 王陵/咒怨 | T3 | 重装 | 盾墙格挡正面，侧后是其弱点 |
| 12 | `bonespitter_titan` | 吐骨泰坦 | 王陵深层 | T3 | 炮台 | 三连扇形骨刺弹幕，硬直长 |

### 2. 兽形野兽 Beasts（10 种）——掉落倾向：食物与护甲

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 13 | `dire_wolf` | 恐狼 | 荒原/苔原 | T1 | 群狼包抄 | squadRole=flanker，绕背撕咬 |
| 14 | `frost_stalker` | 霜踪猎手 | 苔原 | T2 | 潜行刺客 | 雪地隐身，接近时雪粒飘动暴露 |
| 15 | `snow_tusker` | 雪牙巨猪 | 苔原 | T1 | 冲撞 | 直线冲锋，撞墙后自身眩晕 |
| 16 | `thunderhoof_ram` | 雷蹄公羊 | 苔原 | T2 | 冲击 | 冲锋带闪电链，命中麻痹 0.5s |
| 17 | `glacier_bear` | 冰川巨熊 | 苔原 | T3 | 重装野兽 | 横扫击退 + 站立咆哮恐惧 1s |
| 18 | `dune_snapper` | 沙丘巨蜥 | 沙漠 | T2 | 伏击 | 沙下潜行，破土撕咬带流血 |
| 19 | `scorpic` | 焦土蝎犬 | 火山/沙漠 | T1 | 骚扰 | 快速 hit-and-run，偷取地面掉落 |
| 20 | `crag_howler` | 岩吼兽 | 火山 | T2 | 控场 | 震地波：环形击退 + 尘土致盲 |
| 21 | `mirage_stag` | 蜃景灵鹿 | 沙漠 | T2 | 闪避 | 幻影分身 3 只，真身受击才现形 |
| 22 | `grove_warden_stag` | 林苑守鹿 | 蘑菇林 | T2 | 反伤守护 | 为周围真菌单位承担 30% 伤害 |

### 3. 掠夺者部族 Illagers & Goblins（10 种）——掉落倾向：武器与绿宝石

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 23 | `goblin_scuttler` | 窜行哥布林 | 荒原/沙漠 | T0 | 快速填充 | 翻滚接近，攻击后即退 |
| 24 | `goblin_sapper` | 哥布林爆破手 | 荒原/火山 | T1 | 爆破 | 自爆冲锋，死亡掉落 TNT |
| 25 | `goblin_hoarder` | 哥布林守财奴 | 沙漠/荒原 | T1 | 偷窃 | stolenCoins：偷绿宝石逃跑，击杀追回 |
| 26 | `pillager_raider` | 掠夺者袭击者 | 全区域 | T1 | 中坚 | 弩三连射，装填空窗明显 |
| 27 | `vindicator_cleaver` | 卫道士屠夫 | 火山/沙漠 | T2 | 狂战 | 开斧蓄力横扫，蓄力期间走位引导 |
| 28 | `evoker_ritualist` | 唤魔者祭司 | 王陵/咒怨 | T3 | 召唤 | 尖牙陷阱阵 + 召唤恼鬼 |
| 29 | `pillager_beastmaster` | 掠夺者驯兽师 | 苔原/荒原 | T2 | 指挥 | 放猎犬 + 号令齐射（squadRole=commander） |
| 30 | `sand_marauder` | 沙暴掠袭者 | 沙漠 | T2 | 机动 | 沙暴中移速翻倍，投掷沙球致盲 |
| 31 | `goblin_war_drummer` | 哥布林战鼓手 | 火山 | T2 | 增益 | 战鼓光环：部族攻速 +30%（优先击杀） |
| 32 | `plunder_captain` | 掠夺队长 | 全区域 | T3 | 稀有头目 | 三阶段：齐射→召唤→狂暴横扫 |

### 4. 元素构装 Elementals & Constructs（10 种）——掉落倾向：法杖与药水

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 33 | `frost_wisp` | 霜魂精 | 苔原/王陵 | T1 | 减速 | 命中附加 chill 减速 20% |
| 34 | `blizzard_seer` | 暴风雪先知 | 苔原 | T3 | 场控 | 引导暴风雪：大范围冰锥弹幕 |
| 35 | `ember_sprite` | 余烬精灵 | 火山 | T1 | 骚扰 | 自燃冲撞，死亡留下火焰路径 |
| 36 | `ember_fount` | 火泉幼体 | 火山 | T1 | 炮台 | 固定喷发抛物线火弹，射程短但密集 |
| 37 | `magma_golem` | 岩浆魔像 | 火山/炼狱 | T3 | 重装 | 岩甲：物理减半，火焰伤害破甲 |
| 38 | `obsidian_sentinel` | 黑曜石哨卫 | 火山 | T2 | 反射 | shieldReflect：反弹远程弹体 |
| 39 | `dust_djinn` | 尘灵 | 沙漠 | T2 | 致盲 | 沙尘旋风：命中遮蔽玩家视野 1.5s |
| 40 | `storm_rune_tower` | 风暴符文塔 | 苔原/沙漠 | T2 | 静态炮台 | 不可移动，蓄能闪电锁定点（走位博弈） |
| 41 | `bogfire_wisp` | 沼火鬼火 | 沼泽 | T1 | 诱饵 | 缓慢飘向玩家，接触爆炸 + 迷雾 |
| 42 | `geode_behemoth` | 晶核巨兽 | 王陵深层 | T3 | 藏宝守卫 | 受击掉落宝石碎屑，死后爆出矿脉 |

### 5. 虫豸蠕行 Vermin（10 种）——掉落倾向：材料与匕首

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 43 | `cave_creeper_larva` | 穴蛛幼虫 | 王陵/蘑菇林 | T0 | 填充 | 成群速刷（数量压制） |
| 44 | `web_weaver_spider` | 织网蛛 | 王陵/沼泽 | T1 | 控制 | 布网：踩中减速 50% 2s |
| 45 | `venom_spitter` | 毒液喷吐蛛 | 沼泽/蘑菇林 | T2 | 远程 | 抛物线毒液，落点毒云 |
| 46 | `broodmother` | 育母蛛后 | 王陵深层 | T3 | 召唤 | 持续产卵，卵孵化幼虫包围 |
| 47 | `sandscarab_swarm` | 沙金甲虫群 | 沙漠 | T1 | 蜂群 | 无个体碰撞，噬咬偷取护甲耐久 |
| 48 | `tomb_scarab_matriarch` | 墓窟甲虫之母 | 沙漠 | T2 | 召唤 | 甲虫群环绕护主 |
| 49 | `rot_larva` | 腐肉虫 | 王陵/沼泽 | T0 | 填充 | 尸体联动孵化（见 #2） |
| 50 | `spore_mite` | 孢子螨 | 蘑菇林 | T1 | 传播 | 死亡释放孢子云（真菌族联动） |
| 51 | `gloom_moth` | 暗影飞蛾 | 咒怨/蘑菇林 | T1 | 骚扰 | 扇翅扬起致暗鳞粉，缩短玩家视野 |
| 52 | `chitin_bladewing` | 甲刃飞蝗 | 沙漠/蘑菇林 | T2 | 空袭 | 低空掠袭俯冲，难锁定 |

### 6. 深水腐潮 Drowned & Murk（9 种）——掉落倾向：三叉戟与戒指

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 53 | `drowned_husk` | 溺尸空壳 | 沼泽/河流 | T1 | 近战 | 浊水中移速 +50%（地形主场） |
| 54 | `drowned_spearman` | 溺尸矛手 | 沼泽 | T1 | 远程 | 三叉戟投掷，水中弹道加速 |
| 55 | `murk_lurker` | 浊水潜伏者 | 沼泽 | T2 | 伏击 | 水面下不可见，接近冒泡预警 |
| 56 | `bog_croaker` | 泥蛙鸣者 | 沼泽 | T1 | 增益 | 蛙鸣减速玩家 15%（光环） |
| 57 | `ripple_stalker` | 涟漪潜行者 | 沼泽 | T2 | 游击 | 水陆机动切换，上岸后脆弱 |
| 58 | `brine_shaman` | 卤水萨满 | 沼泽 | T2 | 治疗 | 治疗周围深水系单位，优先打断 |
| 59 | `sunken_champion` | 沉船勇者 | 沼泽深层 | T3 | 重装 | 溺亡武士魂附甲胄，水陆双形态 |
| 60 | `tidebound_sentinel` | 缚潮哨卫 | 沼泽/咒怨 | T2 | 拉扯 | 水流锁链把玩家拉向自己 |
| 61 | `mire_behemoth` | 泥沼巨兽 | 沼泽深层 | T3 | 头目级 | 践踏沼泽引发泥浪，缓慢但不可阻挡 |

### 7. 下界军团 Nether Legion（10 种）——掉落倾向：金锭与重武器

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 62 | `piglin_grunt` | 猪灵步兵 | 火山/炼狱 | T1 | 中坚 | 金甲近战，结队巡逻 |
| 63 | `piglin_brute_elite` | 猪灵蛮兵·精锐 | 火山 | T2 | 重装 | 现有 piglin_brute 强化：双斧连斩 |
| 64 | `blaze_keeper` | 烈焰使者 | 炼狱/火山 | T2 | 浮空炮台 | 三连火球 + 悬停规避 |
| 65 | `magma_cuber` | 岩浆史莱姆 | 炼狱 | T1 | 分裂 | 死亡分裂 2 只小史莱姆 |
| 66 | `witherite_hound` | 凋灵猎犬 | 炼狱 | T2 | 追猎 | 凋零 II 效果咬伤，速度极快 |
| 67 | `ghast_barrager` | 恶魂炮手 | 炼狱 | T2 | 远程 | 高抛爆炸火球（可反弹击回） |
| 68 | `hoglin_ravager` | 霍克林掠夺兽 | 火山 | T2 | 冲阵 | 顶飞击退，群冲战术 |
| 69 | `soul_flame_warden` | 焰魂监工 | 炼狱深层 | T3 | 控制 | 灵魂火牢：圈禁玩家 1.2s |
| 70 | `strider_outrider` | 炽足骑士 | 炼狱 | T2 | 骑手 | 骑炽足兽高速绕场投矛 |
| 71 | `basalt_colossus` | 玄武岩巨像 | 炼狱深层 | T4 | 小首领 | 三阶段：岩甲→熔岩喷发→地裂践踏 |

### 8. 虚空异界 Voidborn（9 种）——掉落倾向：绿宝石与传奇法杖

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 72 | `void_mite` | 虚空螨 | 虚空殿堂 | T2 | 填充 | 短距离闪现接近 |
| 73 | `shulker_sentinel` | 潜影贝哨卫 | 虚空殿堂 | T2 | 弹道 | 悬浮追踪弹（减速+浮空） |
| 74 | `ender_sentinel` | 末影哨卫 | 虚空殿堂 | T2 | 游走 | 现有 enderman 强化：受击瞬移背刺 |
| 75 | `void_archivist` | 虚空记录者 | 虚空殿堂 | T3 | 法系 | 复制玩家最近使用的一个技能 |
| 76 | `phase_leaper` | 相位跃行者 | 虚空殿堂/咒怨 | T2 | 突进 | 三段相位跳，期间无法被选中 |
| 77 | `gravity_anomaly` | 引力异常体 | 虚空殿堂 | T3 | 场控 | 引力井把玩家/掉落物拉向中心 |
| 78 | `chorus_wraith` | 紫颂怨灵 | 虚空殿堂 | T2 | 骚扰 | 隐身但发声，声东击西 |
| 79 | `end_crystal_avatar` | 终界水晶化身 | 虚空殿堂深层 | T4 | 小首领 | 水晶供能无敌，先摧毁四周水晶 |
| 80 | `void_sovereign_herald` | 虚空君主先驱 | 虚空殿堂深层 | T4 | 先驱 | 死亡召唤虚空裂缝持续刷怪 |

### 9. 真菌孢子 Fungal & Spore（9 种）——掉落倾向：药水与图腾

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 81 | `myconid_sprout` | 菌人幼株 | 蘑菇林 | T1 | 填充 | 蘑菇林特有近战小怪 |
| 82 | `spore_drifter` | 孢子飘浮者 | 蘑菇林 | T1 | 污染 | 缓慢漂浮播撒孢子雾 |
| 83 | `cap_guardian` | 菌盖卫士 | 蘑菇林 | T2 | 重装 | 巨菇伞盾格挡正面远程 |
| 84 | `puffball_bomber` | 马勃轰炸者 | 蘑菇林 | T1 | 爆破 | 受击喷孢子云（毒） |
| 85 | `mycelium_weaver` | 菌丝编织者 | 蘑菇林 | T2 | 场控 | 铺设菌丝地：敌人踩上回血 |
| 86 | `rotwood_treant` | 朽木树人 | 蘑菇林/咒怨 | T2 | 重装 | 假装枯树伏击（与 dead_tree 瓦片联动） |
| 87 | `glowcap_oracle` | 荧冠神谕者 | 蘑菇林 | T3 | 增益 | 荧光光环：友军视野+命中提升 |
| 88 | `spore_singer` | 孢子歌者 | 蘑菇林 | T2 | 催眠 | 孢子歌：命中有 15% 概率玩家短时失控转向 |
| 89 | `mold_revenant` | 霉变复生者 | 蘑菇林/咒怨 | T2 | 复活 | 死后 3s 于菌丝上原地复活一次 |

### 10. 诅咒幽灵 Cursed & Wraith（7 种）——掉落倾向：戒指与诅咒道具

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 90 | `wailing_wraith` | 哭嚎怨灵 | 咒怨林地 | T2 | 骚扰 | 穿墙飘行，哭嚎减速 |
| 91 | `grave_shade` | 墓影 | 咒怨林地 | T2 | 伏击 | 墓碑后隐身，玩家靠近扑出 |
| 92 | `hex_doll` | 巫蛊人偶 | 咒怨林地 | T2 | 诅咒 | 命中附加"厄运"：受到治疗减半 |
| 93 | `poltergeist_smith` | 闹鬼铁匠 | 咒怨林地 | T3 | 武器傀儡 | 操控浮空武器阵攻击 |
| 94 | `cursed_banner_knight` | 咒旗骑士 | 咒怨林地 | T3 | 号令 | 插下咒旗：旗周围亡灵不死（先拆旗） |
| 95 | `nightmare_steed` | 梦魇魔驹 | 咒怨林地 | T3 | 骑手 | 载着怨灵骑士冲锋，两段血条 |
| 96 | `grimoire_phantom` | 魔典幻影 | 咒怨/王陵 | T3 | 法系 | 翻页释放随机元素弹（不可预测性） |

### 11. 世界首领 World Bosses（4 种）——掉落倾向：套装与暗金

| # | ID | 名称 | 出现区域 | 等级 | 定位 | 核心机制 |
|---|---|---|---|---|---|---|
| 97 | `wither_sovereign` | 凋灵君主 | 炼狱深层 | T4 | 多阶段首领 | 现有 wither_boss 升级版：头骨弹幕+护甲阶段 |
| 98 | `frost_maw_ancient` | 霜喉上古巨兽 | 冰霜苔原 | T4 | 区域首领 | 冰冻吐息冻结地面，冰崩坠击预警圈 |
| 99 | `the_hollow_conclave` | 空壳议会 | 咒怨林地 | T4 | 多体首领 | 三具共血怨灵合体，分离时才可造成重伤 |
| 100 | `sporeheart_titan` | 孢子之心巨像 | 荧光蘑菇林 | T4 | 区域首领 | 菌毯网络供能，摧毁菌丝节点解除无敌 |

## 四、精英词缀 × 怪物组合建议

| 词缀 | 最佳搭配族系 | 设计意图 |
|---|---|---|
| ShieldReflect（盾反） | 冢中骑士 / 黑曜石哨卫 | 惩罚无脑远程，鼓励近战博弈 |
| ToxicAura（毒圈） | 疫病行者 / 马勃轰炸者 | 机制同质化风险，只做视觉加倍 |
| Summoner（召唤） | 死灵侍僧 / 育母蛛后 | 主机制已是召唤，词缀只加召唤上限 |
| MoltenTrail（熔岩径） | 焰魂监工 / 窜行哥布林 | 高机动+灼烧径=走位压力 |
| Vampiric（吸血）*新增 | 食尸鬼头狼 / 泥潭水蛭后 | 延长战斗，强化打断价值 |
| Juggernaut（重装）*新增 | 岩浆魔像 / 玄武岩巨像 | 掉落经济平衡：死亡必掉护甲 |

## 五、区域生成权重表（接入 spawnFloorEntities）

```ts
// gameEngine BIOME_ENEMY_POOLS 的完整化目标（当前为 6 区简化池）
const BIOME_ENEMY_POOLS_FULL: Record<ZoneType, Array<[monsterId, weight]>> = {
  frost:    [['dire_wolf', 3], ['frost_stalker', 2], ['snow_tusker', 2], ['frost_wisp', 2], ['drowned_husk', 1]],
  volcano:  [['ember_sprite', 3], ['scorpic', 2], ['piglin_grunt', 2], ['magma_cuber', 2], ['hoglin_ravager', 1]],
  mushroom: [['myconid_sprout', 3], ['spore_drifter', 2], ['puffball_bomber', 2], ['cave_creeper_larva', 2], ['rotwood_treant', 1]],
  desert:   [['goblin_scuttler', 3], ['sandscarab_swarm', 2], ['dune_snapper', 2], ['sand_marauder', 2], ['dust_djinn', 1]],
  swamp:    [['drowned_husk', 3], ['murk_lurker', 2], ['bog_leech_queen', 2], ['ripple_stalker', 2], ['bogfire_wisp', 1]],
  cursed:   [['wailing_wraith', 3], ['grave_shade', 2], ['mycelium_weaver', 1], ['hex_doll', 2], ['rotwood_treant', 1]],
};
```

- 每区域池保证 **3 填充 + 2 机制怪 + 1 稀有** 的体验层次；精英 roll（20%）只落在 T1/T2。
- T3 稀有头目按 8% 区域内遭遇率单刷出现，T4 世界首领绑定固定地标（火山口/墓园/菌环）。

## 六、实施路线图

1. **Phase 1（数据层）**：新建 `src/engine/monsters/MonsterDefinition.ts`（id/name/zone/levelBand/role/mechanicId/lootProfile/baseStats），把本表 100 条转成数据文件 `monsterCatalog.ts`；`enemyManager.spawnEnemy` 支持按 definition 创建。
2. **Phase 2（机制库）**：`src/engine/monsters/mechanics/` 按机制编号实现可复用行为（dashStrike / burrowAmbush / summonLoop / reflectProjectiles…），全部挂接现有 `behaviorTree` 节点，不新写 AI 框架。
3. **Phase 3（渲染分层）**：新怪优先复用 `chibi/ChibiMonster*` 拼装体系（已有 zombie/skeleton/knight/rogue/creatures 基础骨架），按族系调色 + 部件换装；T3/T4 专属模型走 `specialEnemyRenderer`。
4. **Phase 4（音频）**：每族系 1 组音效映射进 `soundManager`（复用 playZombieGroan/playSpiderHiss 的合成器参数微调），区域环境层 `ambientLayers` 已就位。
5. **Phase 5（平衡验证）**：冒烟脚本统计各区域 DPS/TTK 曲线，保证 T1 常规怪 3-5 刀击杀、T3 稀有头目 20-30s、T4 首领 2-3min。
