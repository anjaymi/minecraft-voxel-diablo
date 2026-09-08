# 明日继续：DQ 式城市规划（进行中）

> 状态：调研完成，待与作者确认方案后实施。
> 前置：六大生态区 / 100 怪图鉴 / NPC 人形化 / 环境音修复 均已落地并通过验收。

## 一、DQ 城市逻辑调研结论（已完成的功课）

龙之 quest 系列城市设计精髓：

1. **单环动线**：一条主街串起全部设施（入口→酒馆→商店→旅馆→教堂→城主），玩家不用找路
2. **功能设施闭环**：
   - 旅馆 = 付费全额回复（DQ 经典 8G/人）
   - 教堂 = 免费复活/净化/存档点
   - 武器店/道具店 = 购买循环
   - 酒馆 = 情报/传闻（指向隐藏要素）
   - 王座 = 主线发布
3. **NPC 双状态对话**：剧情事件前后台词不同，每句话都有信息量（暗示机制/隐藏/下一目的地）
4. **可破坏瓦罐木桶**掉落金币道具（游戏中已有 barrel/urn 破坏物）
5. **NPC 在城中走动**而非站桩

## 二、现有代码接口（已摸清）

- `gameEngine.interactNPC(x,y)`：随机抽 npc.dialogue 一条 + 按类型触发服务（healer 回血 / class_master 开转职弹窗 onOpenClassMaster）
- `NPCType` 联合类型在 `src/types.ts:150`，需扩展
- 营地弹窗：AppModalsContainer `isCampOpen` + `CampHubModal`（已有铁匠/附魔/炼金页签）→ NPC 可触发打开
- 任务系统：`questSystem.onNPCTalked` 按 npc.id 推进
- NPC 数据：硬编码在 `gameEngine.spawnFloorEntities` 的 town 分支（4 个 NPC）

## 三、明日实施清单（建议顺序）

1. **设计文档** `docs/city-design-plan.md`：翡翠圣城 v2 平面（单环主街 + 设施布局）+ NPC 名单（12 人，双状态台词）
2. **`src/engine/city/` 模块**：
   - `NpcDefinition.ts`：城市 NPC 定义（dialogueStates / service / wanderRadius）
   - `townNpcCatalog.ts`：12 位住民（旅馆老板娘/神父/商人/吟游诗人/城主/守卫/小孩…），每条含 `pre_expedition` / `after_first_boss` / `after_victory` 三组台词 + 服务标记
   - `DialogueSystem.ts`：按游戏进度（bossDefeatedCount / isVictory）解析台词 + 执行服务
   - `NpcWanderAI.ts`：城内闲逛（可走瓦片随机漫步 + 停留）
3. **接线**：
   - gameEngine town 分支改从 catalog 生成 NPC；update 中城市闲逛 tick
   - interactNPC 改走 DialogueSystem；旅馆=付费全回复、神父=净化+回蓝、铁匠/商人=打开营地对应页签（复用 isCampOpen 流）
   - `NPCType` 扩展新职业枚举
4. **验证**：tsc/build + 冒烟（台词状态切换/服务扣费）+ 浏览器目视（人形 NPC 走动）

## 四、遗留已知问题

- 铁匠与职业导师出生点仅差 1 格，画面重叠（spawn 布局问题，规划 v2 时一并修）
- 超标大文件待专项重构：renderer 2632 / gameEngine 2425 / soundManager 2220
- 怪物 mechanic 标签已随数据落地，Phase 2 需挂接 behaviorTree 激活
