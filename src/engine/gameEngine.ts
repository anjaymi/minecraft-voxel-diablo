import {
  Player,
  Enemy,
  Projectile,
  DropItem,
  Particle,
  FloatingText,
  DungeonFloor,
  Item,
  EnchantmentChoice,
  EnemyType,
  CharacterClassId,
  ZoneType,
  TileType,
  NPC,
  ElementType,
  ItemRarity,
  WeatherType,
} from '../types';
import { generateDungeonFloor, generateWorldZone, isObstacleTileType, BIOME_ZONES } from './map';
import { emitChestOpened, emitEnemyKilled, emitNpcRescued, emitNpcTalked, emitShrineActivated, emitZoneEntered } from './events';
import { generateRandomItem, ROGUELIKE_ENCHANTMENTS } from './lootSystem';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';
import { bgmSystem } from '../audio/bgmSystem';
import { classSystem } from './classSystem';
import { setBonusSystem } from './setBonusSystem';
import { skillSystem } from './skillSystem';
import { questSystem } from './questSystem';
import { enemyManager } from './enemyManager';
import { destructibleManager } from './destructibleManager';
import { elementalSystem } from './elementalSystem';
import { enemyDeathSystem } from './enemyDeathSystem';
import { summonManager } from './summonManager';
import { ClassAttackSystem, AttackContext } from './classAttackSystem';
import { ClassSkillComboSystem } from './classSkillComboSystem';
import { classAttackStrategyManager } from './strategies/ClassAttackStrategyManager';
import { IClassAttackStrategy, ClassAttackContext } from './strategies/ClassAttackStrategy';
import { BeastCollisionResolver } from './collision/BeastCollisionResolver';
import { ChargedAttackSystem } from './combat/ChargedAttackSystem';
import { customSkinManager } from './skin/CustomSkinManager';
import { PlayerAttackMotionController, attackMotionController } from './combat/motion/PlayerAttackMotionController';
import { ambientLayers } from '../audio/ambientLayers';
import { getMonsterDefinition, pickZoneMonster, rollRareBoss } from './monsters/monsterRegistry';
import { bloodMoonSystem } from './monsters/BloodMoonSystem';
import { saveToSlot } from './save/SaveSystem';
import { merchantShop } from './city/MerchantShop';
import type { GameSaveData } from '../types';
import { perfManager, MAX_PARTICLES } from './perf/PerformanceManager';
import { tileChunkCache } from './perf/TileChunkCache';
import { isTwoHandedWeapon } from './weaponBaseTable';
import { calculateDynamicWeaponStats } from './weaponBaseConfig';
import { TOWN_NPC_ROSTER, getTownNpcDefinition } from './city/townNpcCatalog';
import { FRONTIER_NPC_ROSTER, getFrontierNpcDefinition } from './city/frontierNpcCatalog';
import { pickDialogueLine, serviceCostOf } from './city/DialogueSystem';
import { CityService } from './city/NpcDefinition';
import { npcLifeSim } from './sim/NpcLifeSimulation';
import { adventurerManager } from './adventurers/adventurerManager';
import { DECOR_TILES } from './map/TerrainScatter';
import { grantExperience } from './progression';

/** 数值平衡(2026-09)：各区域内容等级 —— 野外怪物不再把玩家等级硬塞进“层数”，改按区域定级 */
const ZONE_MONSTER_LEVEL: Partial<Record<ZoneType, number>> = {
  overworld: 1,
  keep: 2,
  frost: 3,
  mushroom: 4,
  desert: 5,
  swamp: 6,
  volcano: 6,
  cursed: 7,
};
/** 地下城 1/2/3 层 → 内容等级 1/3/5（原 1-3 让三层强度几乎无差） */
const DUNGEON_FLOOR_LEVELS = [1, 3, 5];

/** 数值平衡(2026-09)：野外动态天气池（每 4~7 分钟按区域概率换天；室内/地牢/前哨固定） */
const WEATHER_POOLS: Partial<Record<ZoneType, WeatherType[]>> = {
  overworld: ['clear', 'rain', 'thunderstorm', 'fog'],
  frost: ['fog', 'clear'],
  volcano: ['ash_storm', 'clear'],
  mushroom: ['fog', 'clear'],
  desert: ['clear', 'fog'],
  swamp: ['fog', 'rain'],
  cursed: ['fog', 'ash_storm'],
};

const WEATHER_LABEL: Record<WeatherType, string> = {
  clear: '晴朗',
  rain: '降雨',
  thunderstorm: '雷暴',
  fog: '大雾',
  ash_storm: '灰烬风暴',
};

export class GameEngine {
  public player: Player;
  public floor: DungeonFloor;
  public attackStrategy: IClassAttackStrategy;
  public questSystem = questSystem;
  public enemyManager = enemyManager;
  public adventurerManager = adventurerManager;
  public attackMotionController: PlayerAttackMotionController = attackMotionController;
  public enemies: Enemy[] = [];
  public npcs: NPC[] = [];
  public projectiles: Projectile[] = [];
  public drops: DropItem[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public camX: number = 0;
  public camY: number = 0;
  public gameTime: number = 0;

  // Hit Stop (Frame Freeze) & Screen Shake feedback system
  public hitStopTimer: number = 0;
  public shakeTimer: number = 0;
  public shakeIntensity: number = 0;
  public screenShakeOffsetX: number = 0;
  public screenShakeOffsetY: number = 0;

  public get effectiveCamX(): number {
    return this.camX + this.screenShakeOffsetX;
  }

  public get effectiveCamY(): number {
    return this.camY + this.screenShakeOffsetY;
  }

  public triggerHitStop(duration: number, intensity: number = 0.25) {
    // Safety clamp to prevent any accidental second/frame unit confusion or gigantic freezes
    const safeDur = Math.min(Math.max(0, duration), 0.15);
    const safeIntensity = Math.min(Math.max(0, intensity), 0.6);
    this.hitStopTimer = Math.max(this.hitStopTimer, safeDur);
    this.shakeIntensity = Math.max(this.shakeIntensity, safeIntensity);
    this.shakeTimer = Math.max(this.shakeTimer, safeDur + 0.1);
  }

  public isPaused: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;
  public isLevelingUp: boolean = false;
  public currentLevelUpChoices: EnchantmentChoice[] = [];
  public inCampHub: boolean = false;
  public onOpenClassMaster?: () => void;
  /** 城市功能 NPC 请求打开营地工坊（锻造/附魔/炼金） */
  public onOpenCampHub?: () => void;
  /** 行商请求打开商店 */
  public onOpenShop?: () => void;
  /** 巨型首领入场横幅（进入有巢穴首领的区域时触发一次） */
  public onBossIntro?: (info: { name: string; zone: string }) => void;
  public nearbyClassMaster: boolean = false;

  public bossDefeatedCount: number = 0;
  public totalKills: number = 0;

  // Input states
  public keys: Record<string, boolean> = {};
  public mouseWorldX: number = 0;
  public mouseWorldY: number = 0;
  public isMouseDown: boolean = false;
  public isRightMouseDown: boolean = false;
  /** 虚拟摇杆方向（移动端）：x/y ∈ [-1,1]，非零时覆盖键盘/点击移动 */
  public touchMoveX: number = 0;
  public touchMoveY: number = 0;
  /** [E] 交互冷却 */
  private eInteractCooldown: number = 0;
  /** 距上次对敌/受击的游戏时间（法力脱战回复判定） */
  private lastCombatTime: number = -100;
  /** 野外动态天气倒计时（秒） */
  private weatherTimer: number = 200 + Math.random() * 120;

  /** 数值平衡(2026-09)：当前区域刷怪内容等级（地下城按层 1/3/5，野外按区域定级） */
  private get zoneMonsterLevel(): number {
    const z = this.floor?.zoneType;
    if (z === 'dungeon') return DUNGEON_FLOOR_LEVELS[(this.floor?.floorNumber || 1) - 1] ?? 5;
    return ZONE_MONSTER_LEVEL[z] ?? 1;
  }

  /** 交互入口（[E] 键与移动端交互按钮共用）：就近交互 NPC / 冒险者 */
  public tryInteract(): void {
    const target = this.findNearestInteractable();
    if (target) {
      this.interactNPC(target.x, target.y);
      this.eInteractCooldown = 0.6;
    }
  }

  /** 找玩家身边最近的交互对象（城镇 NPC 优先，其次野外冒险者） */
  private findNearestInteractable(): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = 3.2;
    for (const npc of this.npcs) {
      const d = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (d < bestDist) {
        bestDist = d;
        best = npc;
      }
    }
    for (const adv of adventurerManager.getAll()) {
      if (adv.state === 'follow') continue;
      const d = Math.hypot(adv.actor.x - this.player.x, adv.actor.y - this.player.y);
      if (d < bestDist) {
        bestDist = d;
        best = adv.actor;
      }
    }
    return best;
  }

  // Debug Hitbox visualization toggle
  public showHitboxes: boolean = false;
  public toggleHitboxes(): boolean {
    this.showHitboxes = !this.showHitboxes;
    return this.showHitboxes;
  }

  public getAttackMotionController(): PlayerAttackMotionController {
    return this.attackMotionController;
  }

  // Terrain-adaptive audio timers
  private footstepTimer: number = 0;

  constructor() {
    this.player = this.createInitialPlayer();
    this.attackStrategy = classAttackStrategyManager.getStrategy(this.player.characterClass || 'warrior');
    this.floor = generateWorldZone('town', 0);
    this.spawnFloorEntities();
    soundManager.setEnvironment(this.floor.isIndoor, this.floor.zoneType);
    setBonusSystem.applySetStatBonuses(this.player);
  }

  private createInitialPlayer(): Player {
    const p: Player = {
      characterClass: 'warrior',
      x: 10,
      y: 10,
      z: 0,
      vx: 0,
      vy: 0,
      targetX: null,
      targetY: null,
      facingAngle: 0,
      stats: {
        hp: 160,
        maxHp: 160,
        mana: 80,
        maxMana: 80,
        attack: 18,
        defense: 8,
        critChance: 0.12,
        speed: 5.0,
        lifeSteal: 0.08,
        exp: 0,
        maxExp: 100,
        level: 1,
        emeralds: 25,
        potions: 3,
        tntCount: 3,
        enderPearls: 2,
      },
      equipment: classSystem.generateStartingGear('warrior'),
      inventory: [],
      isAttacking: false,
      attackCooldown: 0,
      attackTimer: 0,
      comboStep: 0,
      comboTimer: 0,
      isBowAiming: false,
      bowDrawProgress: 0,
      hurtTimer: 0,
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      dashTrail: [],
      invulnerableTimer: 0,
      enchantments: [],
      skillPoints: 0,
      unlockedSkills: {},
      activeSkills: {
        '1': 'tnt_toss',
        '2': 'golden_apple',
        '3': 'ender_pearl',
        '4': 'shield_bash',
        'q': 'potion',
      },
      skillCooldowns: {},
      goldenAppleTimer: 0,
      whirlwindTimer: 0,
      shieldBlockTimer: 0,
      aimingMode: 'none',
      spinePuppet: customSkinManager.getSpinePuppet(),
    };
    classSystem.applyClass(p, 'warrior', true);
    return p;
  }

  public changePlayerClass(classId: CharacterClassId, replaceGear: boolean = true) {
    classSystem.applyClass(this.player, classId, replaceGear);
    this.attackStrategy = classAttackStrategyManager.getStrategy(classId);
    const def = classSystem.getClass(classId);
    this.addFloatingText(this.player.x, this.player.y, `进阶职业: ${def.name}`, def.themeColor, 18, true);
    vfxSystem.spawnShockwave(this.player.x, this.player.y, 0, 3.2, def.themeColor, false, 0.4);
    soundManager.playLevelUp();
  }

  public travelToZone(zoneType: ZoneType, floorNumber: number = 1) {
    // 自动存档：传送门前保存（防止意外退出丢进度）
    try {
      saveToSlot(this.exportSaveState(), 0);
    } catch {
      // 存储满等异常不打断传送
    }
    this.floor = generateWorldZone(zoneType, floorNumber);
    // 行商进新货：商品池随区域翻新
    merchantShop.zoneKey = `${zoneType}_${floorNumber}_${Date.now()}`;
    soundManager.setEnvironment(this.floor.isIndoor, this.floor.zoneType);
    this.spawnFloorEntities();
    emitZoneEntered(this.floor);
    soundManager.playTeleport();
    vfxSystem.spawnShockwave(this.player.x, this.player.y, 0, 3.5, '#38bdf8', false, 0.4);
    this.addFloatingText(this.player.x, this.player.y, `进入: ${this.floor.zoneName}`, '#fbbf24', 20, true);
    // 巨型首领入场横幅：该区域存在巢穴首领时播报一次
    if (this.floor.lairBoss) {
      const bossDef = getMonsterDefinition(this.floor.lairBoss);
      if (bossDef) this.onBossIntro?.({ name: bossDef.name, zone: this.floor.zoneName });
    }
  }

  public resetRun() {
    this.player = this.createInitialPlayer();
    this.attackStrategy = classAttackStrategyManager.getStrategy(this.player.characterClass || 'warrior');
    this.floor = generateWorldZone('town', 0);
    this.isGameOver = false;
    this.isVictory = false;
    this.isLevelingUp = false;
    this.inCampHub = false;
    this.totalKills = 0;
    this.bossDefeatedCount = 0;
    soundManager.setEnvironment(this.floor.isIndoor, this.floor.zoneType);
    this.spawnFloorEntities();
    setBonusSystem.applySetStatBonuses(this.player);
  }

  public nextFloor() {
    const nextFloorNum = this.floor.floorNumber + 1;
    if (nextFloorNum > 3) {
      this.isVictory = true;
      return;
    }
    this.travelToZone('dungeon', nextFloorNum);
  }

  private spawnFloorEntities() {
    tileChunkCache.invalidateAll(); // 新地图：地形缓存全量重建
    // 血月判定：荒野 22% 概率触发，回城/下地牢自动解除
    bloodMoonSystem.maybeTrigger(this.floor, (text) => this.addFloatingText(this.player.x, this.player.y - 1.2, text, '#ef4444', 20, true));
    this.enemyManager.clear();
    this.enemies = this.enemyManager.getEnemies();
    this.npcs = [];
    adventurerManager.clear();
    this.projectiles = [];
    this.drops = [];
    this.particles = [];
    this.floatingTexts = [];

    // Set player position to spawn room
    this.player.x = this.floor.spawnX;
    this.player.y = this.floor.spawnY;
    this.player.targetX = null;
    this.player.targetY = null;
    this.camX = this.player.x;
    this.camY = this.player.y;

    const floorNum = this.floor.floorNumber;

    if (this.floor.zoneType === 'keep') {
      // 前哨城塞：戍卫班 + 少量潜入魔物（边境巡逻任务目标）
      this.npcs = FRONTIER_NPC_ROSTER.map((def) => {
        const tile = this.floor.tiles[def.y]?.[def.x];
        if (tile && DECOR_TILES.has(tile)) this.writeTile(def.x, def.y, 'grass');
        return {
          id: def.id, name: def.name, type: def.type,
          x: def.x, y: def.y, z: 0,
          dialogue: def.dialogueStates.pre_expedition,
          icon: def.icon, color: def.color, interactRadius: 2.5,
          homeX: def.x, homeY: def.y, wanderRadius: def.wanderRadius,
        };
      });
      npcLifeSim.attachTown(this.npcs);
      // 潜入城塞的魔物斥候（边境巡逻任务目标）
      for (let i = 0; i < 5; i++) {
        const rx = 6 + Math.random() * (this.floor.width - 12);
        const ry = 6 + Math.random() * (this.floor.height - 12);
        if (!this.isWalkable(rx, ry)) continue;
        this.enemyManager.spawnEnemy(['zombie', 'skeleton', 'spider'][i % 3] as EnemyType, rx, ry, this.zoneMonsterLevel, false, false);
      }
      this.enemies = this.enemyManager.getEnemies();
      this.questSystem.generateQuestForFloor(this.floor, this.enemies, this.npcs);
      return;
    }

    if (this.floor.zoneType === 'town') {
      // Safe Citadel Hub: peaceful sanctuary, no hostile monsters
      // 城市住民由名册驱动（docs/city-design-plan.md）
      this.npcs = TOWN_NPC_ROSTER.map((def) => {
        // 岗位被散布装饰占用时还原为草地
        const tile = this.floor.tiles[def.y]?.[def.x];
        if (tile && DECOR_TILES.has(tile)) {
          this.writeTile(def.x, def.y, 'grass');
        }
        return {
          id: def.id,
          name: def.name,
          type: def.type,
          x: def.x,
          y: def.y,
          z: 0,
          dialogue: def.dialogueStates.pre_expedition,
          icon: def.icon,
          color: def.color,
          interactRadius: 2.5,
          homeX: def.x,
          homeY: def.y,
          wanderRadius: def.wanderRadius,
        };
      });
      npcLifeSim.attachTown(this.npcs);
      this.questSystem.generateQuestForFloor(this.floor, this.enemies, this.npcs);
      return;
    }

    if (this.floor.zoneType === 'overworld' || BIOME_ZONES.has(this.floor.zoneType)) {
      // Roaming wilderness mob camps & patrols（生态区走 100 怪图鉴加权池）
      // 数值平衡(2026-09)：怪物强度按“区域内容等级”定级，不再跟随玩家等级膨胀
      const zoneLv = this.zoneMonsterLevel;
      const areaScale = Math.round(((this.floor.width * this.floor.height) / (50 * 50)) * 10) / 10;
      const isBiome = BIOME_ZONES.has(this.floor.zoneType);
      const moon = bloodMoonSystem.getMods();
      const count = Math.round(14 * areaScale * moon.countMult);
      const classicTypes: EnemyType[] = ['zombie', 'skeleton', 'creeper', 'spider', 'slime', 'witch', 'goblin', 'baby_zombie', 'armored_zombie'];
      for (let i = 0; i < count; i++) {
        const rx = 5 + Math.random() * (this.floor.width - 10);
        const ry = 5 + Math.random() * (this.floor.height - 10);
        if (Math.hypot(rx - this.player.x, ry - this.player.y) < 7) continue;
        if (!this.isWalkable(rx, ry)) continue;

        const isElite = Math.random() < moon.eliteChance;
        // 荒原 55% 混编图鉴怪（新面孔可见），生态区全图鉴池
        const useCatalog = isBiome || Math.random() < 0.55;
        if (useCatalog) {
          const def = pickZoneMonster(this.floor.zoneType, zoneLv);
          if (def) {
            const spawned = this.enemyManager.spawnFromDefinition(def.id, rx, ry, zoneLv, isElite);
            if (spawned && moon.statMult > 1) {
              spawned.maxHp = Math.round(spawned.maxHp * moon.statMult);
              spawned.hp = spawned.maxHp;
              spawned.damage = Math.round(spawned.damage * moon.statMult);
            }
          }
        } else {
          const type = classicTypes[Math.floor(Math.random() * classicTypes.length)];
          const spawned = this.enemyManager.spawnEnemy(type, rx, ry, zoneLv, isElite, false);
          if (moon.statMult > 1) {
            spawned.maxHp = Math.round(spawned.maxHp * moon.statMult);
            spawned.hp = spawned.maxHp;
          }
        }
      }
      // 稀有头目（T3）：8% 概率单独出没
      if (isBiome) {
        const rare = rollRareBoss(this.floor.zoneType);
        if (rare) {
          for (let attempt = 0; attempt < 20; attempt++) {
            const bx = 6 + Math.random() * (this.floor.width - 12);
            const by = 6 + Math.random() * (this.floor.height - 12);
            if (Math.hypot(bx - this.player.x, by - this.player.y) < 12) continue;
            if (!this.isWalkable(bx, by)) continue;
            this.enemyManager.spawnFromDefinition(rare.id, bx, by, zoneLv, false);
            break;
          }
        }
      }
      // 巨兽巢穴首领：大地图专属世界首领（奇美拉/霜喉/玄武岩/孢子之心/泥沼/空壳议会/脊冠暴君）
      if (this.floor.lairBoss && this.floor.lairX !== undefined && this.floor.lairY !== undefined) {
        const lairLevel = Math.min(12, zoneLv + 3);
        const giant = this.enemyManager.spawnFromDefinition(
          this.floor.lairBoss,
          this.floor.lairX,
          this.floor.lairY,
          lairLevel,
          false
        );
        if (giant) {
          giant.isBoss = true;
          giant.bossPhase = 1;
          // 苏醒播报：巨型首领登场（红字 + 溅射余烬）
          const bossDef = getMonsterDefinition(this.floor.lairBoss);
          this.addFloatingText(
            this.floor.lairX,
            this.floor.lairY - 1,
            `👑 ${bossDef?.name ?? giant.name} 从巢穴中苏醒！`,
            '#f87171',
            18
          );
          this.createExplosionParticles(this.floor.lairX, this.floor.lairY, '#b91c1c', 22);
        }
      }
      this.enemies = this.enemyManager.getEnemies();
      adventurerManager.spawnForZone(this.floor);
      this.questSystem.generateQuestForFloor(this.floor, this.enemies, this.npcs);
      return;
    }

    // Spawn enemies in non-spawn rooms
    for (const room of this.floor.rooms) {
      if (room.type === 'spawn') continue;

      if (room.type === 'boss') {
        // Spawn Boss（数值平衡 2026-09：Boss 不再以 isElite 身份生成，使用独立血/伤预算）
        const bx = room.x + room.w / 2;
        const by = room.y + room.h / 2;
        this.enemyManager.spawnEnemy('wither_boss', bx, by, this.zoneMonsterLevel, false, true);
      } else {
        // Regular mob packs
        const count = 3 + Math.floor(Math.random() * 4);
        let types: EnemyType[] = ['zombie', 'skeleton', 'creeper', 'spider', 'slime', 'drowned', 'armored_zombie', 'baby_zombie', 'goblin'];
        if (floorNum === 2) {
          types = ['piglin_brute', 'blaze', 'skeleton', 'witch', 'slime', 'armored_zombie', 'goblin'];
        } else if (floorNum >= 3) {
          types = ['enderman', 'necromancer', 'witch', 'blaze', 'piglin_brute', 'armored_zombie', 'baby_zombie', 'goblin'];
        }

        for (let i = 0; i < count; i++) {
          const ex = room.x + 1.5 + Math.random() * (room.w - 3);
          const ey = room.y + 1.5 + Math.random() * (room.h - 3);
          const type = types[Math.floor(Math.random() * types.length)];
          const isElite = Math.random() < 0.18;
          this.enemyManager.spawnEnemy(type, ex, ey, this.zoneMonsterLevel, isElite, false);
        }

        // 35% chance to spawn an imprisoned scholar NPC in a normal room
        if (Math.random() < 0.35 && !this.npcs.some((n) => n.type === 'scholar')) {
          this.npcs.push({
            id: `npc_scholar_${Date.now()}`,
            name: '受困学者 埃尔文',
            type: 'scholar',
            x: room.x + room.w / 2,
            y: room.y + room.h / 2,
            z: 0,
            dialogue: ['谢天谢地！地下城里到处是可怖的怪物！', '请护送我前往出口传送门！'],
            icon: '🧙‍♂️',
            color: '#38bdf8',
            interactRadius: 2.5,
            isFollowing: false,
            rescued: false,
          });
        }
      }
    }

    this.enemies = this.enemyManager.getEnemies();

    // Spawn Class Master projection in dungeon entrance room
    if (this.floor.zoneType === 'dungeon' && !this.npcs.some((n) => n.type === 'class_master')) {
      let npcX = this.floor.spawnX + 2;
      let npcY = this.floor.spawnY + 1;
      if (!this.isWalkable(npcX, npcY)) {
        for (let r = 1; r <= 4; r++) {
          let found = false;
          for (let dy = -r; dy <= r && !found; dy++) {
            for (let dx = -r; dx <= r && !found; dx++) {
              const tx = this.floor.spawnX + dx;
              const ty = this.floor.spawnY + dy;
              if (this.isWalkable(tx, ty) && (dx !== 0 || dy !== 0)) {
                npcX = tx;
                npcY = ty;
                found = true;
              }
            }
          }
          if (found) break;
        }
      }

      this.npcs.push({
        id: `npc_class_master_${this.floor.floorNumber}`,
        name: '职业导师 艾尔德温 (导师投影)',
        type: 'class_master',
        x: npcX,
        y: npcY,
        z: 0,
        dialogue: [
          '深邃的地牢中充满未知的凶险，随时与我对话重构职业与法术！',
          '奥术法师的奥术穿透，死灵师的统御军团，荒野德鲁伊的自然神罚，随心所欲，实时觉醒！'
        ],
        icon: '🧙‍♂️',
        color: '#a855f7',
        interactRadius: 2.8,
      });
    }

    // Generate dynamic floor quest
    this.questSystem.generateQuestForFloor(this.floor, this.enemies, this.npcs);
  }

  public update(dt: number) {
    if (this.isPaused || this.isGameOver || this.isVictory || this.isLevelingUp) return;

    // 0. Update Screen Shake Decay & High-Frequency Screen Shudder
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      // 抖动强度随震动结束清零：shakeIntensity 历史累积（Math.max 只增不减）
      // 会让后续轻微命中也按历史峰值抖动，表现为"角色一直一抖一抖像受击"。
      const trauma = Math.min(Math.max(0, this.shakeTimer * this.shakeIntensity * 4), 0.35);
      this.screenShakeOffsetX = (Math.random() - 0.5) * trauma * 0.9;
      this.screenShakeOffsetY = (Math.random() - 0.5) * trauma * 0.6;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    } else {
      this.screenShakeOffsetX = 0;
      this.screenShakeOffsetY = 0;
      this.shakeIntensity = 0;
    }

    // 0.5 Hit Stop (Frame Freeze): Micro-pause on heavy melee/skill impact
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      // Maintain smooth camera tracking during freeze
      this.camX += (this.player.x - this.camX) * 8 * dt;
      this.camY += (this.player.y - this.camY) * 8 * dt;
      return;
    }

    this.gameTime += dt;
    perfManager.sample(dt);

    // 1. Update Player Input & Movement
    this.updatePlayer(dt);

    // 2. Update Enemies AI & Combat
    this.updateEnemies(dt);

    // 2.5 Update Summoned Minions (Skeletons, Wolves, Treants)
    summonManager.updateMinions(
      this.player,
      dt,
      this.enemies,
      this.particles,
      (tx, ty, text, color, size) => this.addFloatingText(tx, ty, text, color, size),
      (enemy, damage, isCrit) => this.damageEnemy(enemy, damage, isCrit),
      (x, y) => this.isWalkable(x, y),
      this.gameTime
    );

    // 3. Update Projectiles
    this.updateProjectiles(dt);

    // 4. Update Drops & Pickups
    this.updateDrops(dt);

    // 5. Update Particles & VFX System
    this.updateParticles(dt);
    vfxSystem.update(dt);

    // 6. Update Floating Combat Texts
    this.updateFloatingTexts(dt);

    // 7. Camera Smooth Tracking
    this.camX += (this.player.x - this.camX) * 8 * dt;
    this.camY += (this.player.y - this.camY) * 8 * dt;

    // 8. Check Interactive Tiles (Chests, Shrines, Exit)
    this.checkTileInteractions();

    // 8.4 [E] 键交互：对最近的 NPC / 冒险者触发对话（键盘流友好）
    if (this.keys['KeyE'] || this.keys['e']) {
      if (this.eInteractCooldown <= 0) {
        this.tryInteract();
      }
      this.eInteractCooldown -= dt;
    } else {
      this.eInteractCooldown = 0;
    }

    // 8.5 Check NPC Interactions
    this.checkNPCInteractions(dt);

    // 8.6 NPC 人生模拟（需求/日程/思维/记忆——他们自己的小人生）
    if (this.floor.zoneType === 'keep') {
      // 前哨城塞：戍卫班 + 少量潜入魔物（边境巡逻任务目标）
      this.npcs = FRONTIER_NPC_ROSTER.map((def) => {
        const tile = this.floor.tiles[def.y]?.[def.x];
        if (tile && DECOR_TILES.has(tile)) this.writeTile(def.x, def.y, 'grass');
        return {
          id: def.id, name: def.name, type: def.type,
          x: def.x, y: def.y, z: 0,
          dialogue: def.dialogueStates.pre_expedition,
          icon: def.icon, color: def.color, interactRadius: 2.5,
          homeX: def.x, homeY: def.y, wanderRadius: def.wanderRadius,
        };
      });
      npcLifeSim.attachTown(this.npcs);
      // 潜入城塞的魔物斥候（边境巡逻任务目标）
      for (let i = 0; i < 5; i++) {
        const rx = 6 + Math.random() * (this.floor.width - 12);
        const ry = 6 + Math.random() * (this.floor.height - 12);
        if (!this.isWalkable(rx, ry)) continue;
        this.enemyManager.spawnEnemy(['zombie', 'skeleton', 'spider'][i % 3] as EnemyType, rx, ry, this.zoneMonsterLevel, false, false);
      }
      this.enemies = this.enemyManager.getEnemies();
      this.questSystem.generateQuestForFloor(this.floor, this.enemies, this.npcs);
      return;
    }

    if (this.floor.zoneType === 'town') {
      npcLifeSim.update(dt, this.floor, this.player.x, this.player.y);
    }

    // 8.7 野外冒险者（狩魔/搜刮/求救/入队）
    if (this.floor.zoneType !== 'town') {
      adventurerManager.update({
        dt,
        floor: this.floor,
        player: this.player,
        enemies: this.enemies,
        drops: this.drops,
        isWalkable: (x, y) => this.isWalkable(x, y),
        damageEnemy: (enemy, damage, isCrit) => this.damageEnemy(enemy, damage, isCrit),
        say: (x, y, text, color) => this.addFloatingText(x, y, text, color ?? '#e2e8f0', 13),
        onCollectEmerald: (amount) => {
          this.player.stats.emeralds += amount;
          soundManager.playEmeraldPickup();
        },
        onCollectExp: (amount) => this.addExp(amount),
        onCollectItem: (item, rarity) => {
          this.player.inventory.push(item);
          soundManager.playLootDrop(rarity);
          this.addFloatingText(this.player.x, this.player.y, `获得战利品: ${item.name}`, '#fbbf24', 14);
        },
      });
    }

    // 9. Dynamic Environmental Ambience (Wind, birds, cave water drips, weather gusts)
    ambientLayers.update(dt, this.player, this.floor);

    // 数值平衡(2026-09)：动态天气 —— 野外/生态区每 4~7 分钟按区域池概率换天（室内/地牢/前哨固定）
    this.weatherTimer -= dt;
    if (this.floor.zoneType === 'overworld' || BIOME_ZONES.has(this.floor.zoneType)) {
      if (this.weatherTimer <= 0) {
        this.weatherTimer = 240 + Math.random() * 180;
        const pool = WEATHER_POOLS[this.floor.zoneType] ?? (['clear'] as WeatherType[]);
        if (pool.length > 1 && Math.random() < 0.55) {
          const next = pool[Math.floor(Math.random() * pool.length)];
          if (next !== this.floor.weather) {
            this.floor.weather = next;
            this.addFloatingText(
              this.player.x,
              this.player.y - 1.7,
              `🌦 天气变化：${WEATHER_LABEL[next]}`,
              '#7dd3fc',
              14
            );
          }
        }
      }
    } else {
      this.weatherTimer = 60; // 静区：保持短复位，进入野外时立刻可用
    }
    soundManager.updateEnvironmentalAmbience(
      dt,
      this.floor.zoneType,
      this.floor.theme,
      this.floor.weather || 'clear',
      this.floor.isIndoor
    );

    // 9.5 Dynamic Threat Ambience & Tension BGM Modulation (Monster density & Boss state)
    let nearbyMonsterCount = 0;
    let closestDistance = 999;
    let isBossAlive = false;
    for (const enemy of this.enemies) {
      if (enemy.isDying || enemy.hp <= 0) continue;
      const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (d < 16) {
        nearbyMonsterCount++;
        if (d < closestDistance) closestDistance = d;
      }
      if (enemy.isBoss) isBossAlive = true;
    }

    soundManager.updateDynamicAmbience({
      nearbyMonsterCount,
      closestDistance,
      isBossAlive,
      playerHpRatio: this.player.stats.hp / Math.max(1, this.player.stats.maxHp),
      dt,
    });

    // 数值平衡(2026-09)：BGM 战斗强度 —— Boss / 近距离群怪抬高，映射到鼓点密度与速度
    const bgmThreat = Math.min(
      1,
      (isBossAlive ? 0.85 : 0) +
        (nearbyMonsterCount > 0
          ? Math.min(0.5, nearbyMonsterCount * 0.06 + (closestDistance < 5 ? 0.35 : 0))
          : 0)
    );
    bgmSystem.syncFromGame(this.floor.zoneType, !!this.floor.isIndoor, bgmThreat);
  }

  /** 当前武器是否为远程（有效射程 ≥ 3.2） */
  private isRangedWeapon(): boolean {
    const stats = calculateDynamicWeaponStats(
      this.player.equipment.weapon,
      this.player.characterClass || 'warrior',
      this.player.stats
    );
    return stats.effectiveRange >= 3.2;
  }

  /** 某点附近是否有敌人（攻击点击判定） */
  private isEnemyNearPoint(x: number, y: number, radius: number): boolean {
    for (const enemy of this.enemies) {
      if (enemy.isDying || enemy.hp <= 0) continue;
      if (Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.size * 0.4) return true;
    }
    return false;
  }

  /**
   * 远程走位判定：点击点是怪物、武器为远程、且目标已进入射程 → 原地站桩。
   * 超出射程时继续走位接近；近战职业完全不受影响。
   */
  private rangedShouldHoldGround(p: Player, targetX: number, targetY: number, distToTarget: number): boolean {
    if (!this.isRangedWeapon()) return false;
    if (!this.isEnemyNearPoint(targetX, targetY, 1.3)) return false;
    const stats = calculateDynamicWeaponStats(
      p.equipment.weapon,
      p.characterClass || 'warrior',
      p.stats
    );
    return distToTarget <= stats.effectiveRange * 0.95;
  }

  private updatePlayer(dt: number) {
    const p = this.player;

    // Update class-specific skill combo timers and buffs
    ClassSkillComboSystem.update(p, dt);

    // Cooldown updates
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.attackTimer > 0) p.attackTimer -= dt;
    else p.isAttacking = false;

    // Combo timer decay - resets combo chain if idle
    if (p.comboTimer > 0) {
      p.comboTimer -= dt;
      if (p.comboTimer <= 0) {
        p.comboStep = 0;
      }
    }

    // Hurt timer decay
    if (p.hurtTimer > 0) p.hurtTimer -= dt;

    // Bow draw decay
    if (p.isBowAiming) {
      p.bowDrawProgress = Math.max(0, p.bowDrawProgress - dt * 2.5);
      if (p.bowDrawProgress <= 0) p.isBowAiming = false;
    }

    // Dash timer and trail afterimages
    if (p.dashCooldown > 0) p.dashCooldown -= dt;
    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      if (p.dashTimer <= 0) p.isDashing = false;
    }
    if (p.isDashing) {
      // Spawn trail ghost
      p.dashTrail.push({
        x: p.x,
        y: p.y,
        z: p.z,
        angle: p.facingAngle,
        alpha: 0.75,
        armorColor: p.equipment.armor?.name.includes('Netherite')
          ? '#4338ca'
          : p.equipment.armor?.name.includes('Diamond')
          ? '#06b6d4'
          : p.equipment.armor?.name.includes('Gold')
          ? '#f59e0b'
          : '#38bdf8',
      });
    }
    // Update existing trail ghosts
    for (let i = p.dashTrail.length - 1; i >= 0; i--) {
      p.dashTrail[i].alpha -= dt * 3.5;
      if (p.dashTrail[i].alpha <= 0) {
        p.dashTrail.splice(i, 1);
      }
    }

    // Jump / slam vertical recovery
    if (p.z > 0 && !p.isAttacking) {
      p.z = Math.max(0, p.z - 2.5 * dt);
    }

    if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;

    // Active skills cooldowns
    for (const skillId in p.skillCooldowns) {
      if (p.skillCooldowns[skillId] > 0) {
        p.skillCooldowns[skillId] -= dt;
      }
    }

    // Buff & skill timers decay
    if (p.goldenAppleTimer > 0) {
      p.goldenAppleTimer -= dt;
      // Active divine golden apple regen
      if (Math.random() < dt * 1.8 && p.stats.hp < p.stats.maxHp) {
        const heal = Math.round(p.stats.maxHp * 0.04);
        p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
        this.addFloatingText(p.x, p.y, `+${heal} 金苹果护体`, '#fbbf24', 12);
      }
    }
    if (p.whirlwindTimer > 0) p.whirlwindTimer -= dt;
    if (p.shieldBlockTimer > 0) p.shieldBlockTimer -= dt;

    // 数值平衡(2026-09)：法力自然回复（脱战 6%/s，战斗 1.2%/s；5 秒无伤害视为脱战）
    if (p.stats.mana < p.stats.maxMana) {
      const outOfCombat = this.gameTime - this.lastCombatTime > 5;
      const regenRate = p.stats.maxMana * (outOfCombat ? 0.06 : 0.012) * dt;
      p.stats.mana = Math.min(p.stats.maxMana, p.stats.mana + regenRate);
    }

    // Wild Shape bear form duration decay & collision reset
    if (p.wildShapeTimer && p.wildShapeTimer > 0) {
      p.wildShapeTimer -= dt;
      if (p.wildShapeTimer <= 0) {
        p.wildShapeTimer = 0;
        p.wildShapeForm = 'none';
        p.wildShapeAttackBonus = 0;
        p.hitboxRadius = 0.28;
        this.addFloatingText(p.x, p.y - 0.7, '变身结束 (恢复人形态)', '#94a3b8', 13);
      }
    }

    // Spellcast anticipation wind-up decay
    if (p.castLockTimer && p.castLockTimer > 0) {
      p.castLockTimer -= dt;
      if (p.castLockTimer <= 0) {
        p.castLockTimer = 0;
        p.isCastingSpell = false;
      }
    }

    // Golden apple passive regen
    const hasGapple = p.enchantments.some(e => e.id === 'golden_apple');
    if (hasGapple && Math.floor(this.gameTime) % 3 === 0 && Math.random() < dt) {
      if (p.stats.hp < p.stats.maxHp) {
        const heal = Math.round(p.stats.maxHp * 0.05);
        p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
        this.addFloatingText(p.x, p.y, `+${heal} HP`, '#4ade80', 12);
      }
    }

    // Facing angle towards mouse in isometric world
    const dx = this.mouseWorldX - p.x;
    const dy = this.mouseWorldY - p.y;
    p.facingAngle = Math.atan2(dy, dx);

    // Movement Vector
    let moveX = 0;
    let moveY = 0;

    // Keyboard (WASD & Arrow Keys)
    let screenX = 0;
    let screenY = 0;

    const k = this.keys;
    const isLeft = k['KeyA'] || k['ArrowLeft'] || k['a'] || k['A'];
    const isRight = k['KeyD'] || k['ArrowRight'] || k['d'] || k['D'];
    const isUp = k['KeyW'] || k['ArrowUp'] || k['w'] || k['W'];
    const isDown = k['KeyS'] || k['ArrowDown'] || k['s'] || k['S'];

    if (isLeft) screenX -= 1;
    if (isRight) screenX += 1;
    if (isUp) screenY -= 1;
    if (isDown) screenY += 1;

    if (screenX !== 0 || screenY !== 0) {
      // Convert screen-aligned direction (A=Left, D=Right, W=Up, S=Down) to isometric world direction
      // Screen X: (wx - wy) -> to move screen right, wx increases, wy decreases (wx - wy > 0)
      // Screen Y: (wx + wy) -> to move screen down, wx increases, wy increases (wx + wy > 0)
      moveX = screenX + screenY;
      moveY = screenY - screenX;
      // Clear click-to-move target when keyboard is pressed
      p.targetX = null;
      p.targetY = null;
    } else if (Math.abs(this.touchMoveX) > 0.01 || Math.abs(this.touchMoveY) > 0.01) {
      // 虚拟摇杆（移动端）：同样做屏幕→等距世界方向的换算
      moveX = this.touchMoveX + this.touchMoveY;
      moveY = this.touchMoveY - this.touchMoveX;
      p.targetX = null;
      p.targetY = null;
    } else if (p.targetX !== null && p.targetY !== null) {
      // Mouse click-to-move if no keyboard input
      const tdx = p.targetX - p.x;
      const tdy = p.targetY - p.y;
      const dist = Math.hypot(tdx, tdy);
      if (dist > 0.4) {
        // 远程职业攻击走位：点击点是怪物且已进入武器射程 → 原地站桩输出
        if (this.rangedShouldHoldGround(p, p.targetX, p.targetY, dist)) {
          p.targetX = null;
          p.targetY = null;
        } else {
          moveX = tdx / dist;
          moveY = tdy / dist;
        }
      } else {
        p.targetX = null;
        p.targetY = null;
      }
    }

    // Normalize diagonal movement
    const len = Math.hypot(moveX, moveY);
    if (len > 0) {
      moveX /= len;
      moveY /= len;
    }

    // Cast Lock for spellcasters (mage, summoner, druid):
    // Locks player coordinates firmly, preventing movement or jitter during casting wind-up
    if (p.castLockTimer && p.castLockTimer > 0) {
      moveX = 0;
      moveY = 0;
      p.targetX = null;
      p.targetY = null;
    }

    // Apply speed (with dash multiplier and charged attack damping)
    const chargeSpeedFactor = ChargedAttackSystem.getSpeedMultiplier(p);
    const currentSpeed = (p.isDashing ? p.stats.speed * 2.8 : p.stats.speed) * chargeSpeedFactor;
    p.vx = moveX * currentSpeed;
    p.vy = moveY * currentSpeed;

    // Terrain-adaptive Footstep sounds on movement
    if (len > 0.08 && !p.isDashing) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = 0.28;
        const currentTile = this.getTile(p.x, p.y);
        soundManager.playFootstep(currentTile);
      }
    } else {
      this.footstepTimer = 0.05;
    }

    // Continuous collision detection with walls, obstacles & smooth sliding
    this.resolvePlayerMovementAndCollisions(dt);

    // Lava damage
    const tileUnder = this.getTile(p.x, p.y);
    if (tileUnder === 'lava' && p.invulnerableTimer <= 0) {
      this.damagePlayer(15, 'lava');
    }

    // Attacks & Charge System update triggered by mouse click/hold
    if (this.isMouseDown) {
      if (!p.isChargingAttack && p.attackCooldown <= 0) {
        ChargedAttackSystem.startCharging(p);
      } else if (p.isChargingAttack) {
        ChargedAttackSystem.update(p, dt, true);
      }
    } else if (p.isChargingAttack) {
      const { isCharged, chargeRatio } = ChargedAttackSystem.releaseCharging(p);
      if (isCharged) {
        this.playerChargedAttack(chargeRatio);
      } else if (p.attackCooldown <= 0) {
        this.playerAttack();
      }
    }

    if (this.isRightMouseDown && p.attackCooldown <= 0) {
      this.playerBowAttack();
    }
  }

  /**
   * Continuous Circle-vs-Voxel AABB collision detection & sliding resolution.
   * Validates player movement against voxel map bounds and all obstacle layers.
   * Prevents getting stuck in walls, eliminates corner trap, and auto-ejects if embedded.
   */
  public resolvePlayerMovementAndCollisions(dt: number) {
    const p = this.player;
    const playerRadius = BeastCollisionResolver.getEffectiveHitboxRadius(p);

    // Strict map limits: outer rim tiles are [0, width-1] and [0, height-1]
    const minBoundX = 0.5 + playerRadius;
    const maxBoundX = this.floor.width - 0.5 - playerRadius;
    const minBoundY = 0.5 + playerRadius;
    const maxBoundY = this.floor.height - 0.5 - playerRadius;

    // Sub-stepping for high-velocity or dash frames to guarantee continuous collision check
    const displacement = Math.hypot(p.vx, p.vy) * dt;
    const maxStepDist = 0.08;
    const steps = Math.max(1, Math.min(6, Math.ceil(displacement / maxStepDist)));
    const subDt = dt / steps;

    for (let step = 0; step < steps; step++) {
      // 1. Move and resolve horizontal X-axis independently to allow seamless sliding along walls
      if (p.vx !== 0) {
        let candidateX = p.x + p.vx * subDt;
        // Clamp to map boundary
        candidateX = Math.max(minBoundX, Math.min(maxBoundX, candidateX));

        const probeX = p.vx > 0 ? candidateX + playerRadius : candidateX - playerRadius;
        const checkTileX = Math.floor(probeX + 0.5);

        // Check vertical span of player bounding cylinder
        const minTileY = Math.floor(p.y - playerRadius * 0.8 + 0.5);
        const maxTileY = Math.floor(p.y + playerRadius * 0.8 + 0.5);

        for (let ty = minTileY; ty <= maxTileY; ty++) {
          if (this.isObstacleTile(checkTileX, ty)) {
            // Collision with vertical face of obstacle at checkTileX
            if (p.vx > 0) {
              const wallFace = checkTileX - 0.5;
              candidateX = Math.min(candidateX, wallFace - playerRadius - 0.002);
            } else {
              const wallFace = checkTileX + 0.5;
              candidateX = Math.max(candidateX, wallFace + playerRadius + 0.002);
            }
          }
        }
        p.x = candidateX;
      }

      // 2. Move and resolve vertical Y-axis independently to allow seamless sliding along walls
      if (p.vy !== 0) {
        let candidateY = p.y + p.vy * subDt;
        // Clamp to map boundary
        candidateY = Math.max(minBoundY, Math.min(maxBoundY, candidateY));

        const probeY = p.vy > 0 ? candidateY + playerRadius : candidateY - playerRadius;
        const checkTileY = Math.floor(probeY + 0.5);

        // Check horizontal span of player bounding cylinder
        const minTileX = Math.floor(p.x - playerRadius * 0.8 + 0.5);
        const maxTileX = Math.floor(p.x + playerRadius * 0.8 + 0.5);

        for (let tx = minTileX; tx <= maxTileX; tx++) {
          if (this.isObstacleTile(tx, checkTileY)) {
            // Collision with horizontal face of obstacle at checkTileY
            if (p.vy > 0) {
              const wallFace = checkTileY - 0.5;
              candidateY = Math.min(candidateY, wallFace - playerRadius - 0.002);
            } else {
              const wallFace = checkTileY + 0.5;
              candidateY = Math.max(candidateY, wallFace + playerRadius + 0.002);
            }
          }
        }
        p.y = candidateY;
      }

      // 3. Corner / Diagonal Tile Circle Separation
      // Tests nearby 3x3 tiles to push smoothly out of obstacle corners
      const centerTileX = Math.floor(p.x + 0.5);
      const centerTileY = Math.floor(p.y + 0.5);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const tx = centerTileX + dx;
          const ty = centerTileY + dy;
          if (this.isObstacleTile(tx, ty)) {
            // Obstacle AABB in continuous world coordinates
            const boxMinX = tx - 0.5;
            const boxMaxX = tx + 0.5;
            const boxMinY = ty - 0.5;
            const boxMaxY = ty + 0.5;

            // Find closest point on box to circle center
            const closestX = Math.max(boxMinX, Math.min(boxMaxX, p.x));
            const closestY = Math.max(boxMinY, Math.min(boxMaxY, p.y));

            const diffX = p.x - closestX;
            const diffY = p.y - closestY;
            const distSq = diffX * diffX + diffY * diffY;

            if (distSq < playerRadius * playerRadius && distSq > 0.00001) {
              const dist = Math.sqrt(distSq);
              const overlap = playerRadius - dist;
              p.x += (diffX / dist) * overlap;
              p.y += (diffY / dist) * overlap;
            }
          }
        }
      }
    }

    // 4. Final strict boundary clamp
    p.x = Math.max(minBoundX, Math.min(maxBoundX, p.x));
    p.y = Math.max(minBoundY, Math.min(maxBoundY, p.y));

    // 5. Emergency Unstuck Ejector
    // If the player somehow ends up inside an obstacle tile (e.g. after zone teleport or map generation),
    // immediately find the nearest walkable tile and eject the player there.
    const curTx = Math.floor(p.x + 0.5);
    const curTy = Math.floor(p.y + 0.5);
    if (this.isObstacleTile(curTx, curTy)) {
      let bestDist = Infinity;
      let targetX = p.x;
      let targetY = p.y;

      for (let radius = 1; radius <= 4; radius++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const candidateTx = curTx + dx;
            const candidateTy = curTy + dy;
            if (!this.isObstacleTile(candidateTx, candidateTy)) {
              const d = Math.hypot(p.x - candidateTx, p.y - candidateTy);
              if (d < bestDist) {
                bestDist = d;
                targetX = candidateTx;
                targetY = candidateTy;
              }
            }
          }
        }
        if (bestDist < Infinity) break;
      }

      if (bestDist < Infinity) {
        const ejectX = targetX - p.x;
        const ejectY = targetY - p.y;
        const ejectLen = Math.hypot(ejectX, ejectY);
        if (ejectLen > 0.001) {
          const moveDist = Math.min(ejectLen, dt * 10 + 0.08);
          p.x += (ejectX / ejectLen) * moveDist;
          p.y += (ejectY / ejectLen) * moveDist;
        }
      }
    }

    // 6. Beast Physical Body Mass Displacement & Pushback
    BeastCollisionResolver.resolveBeastEnemyPush(
      p,
      this.enemies,
      dt,
      (particle) => this.particles.push(particle)
    );
  }

  /** 写入瓦片并使地形缓存块失效 */
  private writeTile(x: number, y: number, tile: TileType): void {
    if (!this.floor.tiles[y]) return;
    this.floor.tiles[y][x] = tile;
    tileChunkCache.invalidateTile(x, y);
  }

  public isObstacleTile(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= this.floor.width || tileY < 0 || tileY >= this.floor.height) {
      return true;
    }
    return isObstacleTileType(this.floor.tiles[tileY][tileX]);
  }

  public isWalkable(x: number, y: number): boolean {
    const tileX = Math.floor(x + 0.5);
    const tileY = Math.floor(y + 0.5);
    return !this.isObstacleTile(tileX, tileY);
  }

  public getTile(x: number, y: number): TileType | string {
    const tileX = Math.floor(x + 0.5);
    const tileY = Math.floor(y + 0.5);
    if (tileX < 0 || tileX >= this.floor.width || tileY < 0 || tileY >= this.floor.height) return 'void';
    return this.floor.tiles[tileY][tileX];
  }

  // Primary Weapon Combo Attack (Delegated to Class-Specific Strategy Pattern)
  public playerAttack() {
    const p = this.player;
    const ctx: ClassAttackContext = {
      player: p,
      projectiles: this.projectiles,
      particles: this.particles,
      enemies: this.enemies,
      mouseWorldX: this.mouseWorldX,
      mouseWorldY: this.mouseWorldY,
      dealMeleeAoEDamage: (x, y, angle, arc, radius, dmg, crit) => this.dealMeleeAoEDamage(x, y, angle, arc, radius, dmg, crit),
      damageEnemy: (enemy, damage, isCrit, isBackstab) => this.damageEnemy(enemy, damage, isCrit, isBackstab),
      triggerHitStop: (dur, intensity) => this.triggerHitStop(dur, intensity),
      addFloatingText: (x, y, text, color, size, bounce) => this.addFloatingText(x, y, text, color, size, bounce),
      checkDestructibles: (x, y, radius, angle, arc) => {
        destructibleManager.checkAttackDestructibles(x, y, radius, angle, arc, this.floor, {
          spawnParticle: (particle) => this.particles.push(particle),
          spawnDrop: (drop) => this.spawnDrop(drop),
          addFloatingText: (tx, ty, text, color, size) => this.addFloatingText(tx, ty, text, color, size),
          triggerScreenShake: (intensity) => this.triggerHitStop(0.04, intensity),
        });
      },
    };

    this.attackStrategy.executePrimaryAttack(ctx);
  }

  public onMouseDown() {
    this.isMouseDown = true;
    if (this.player.attackCooldown <= 0 && !this.player.isChargingAttack) {
      ChargedAttackSystem.startCharging(this.player);
    }
  }

  public onMouseUp() {
    this.isMouseDown = false;
    if (this.player.isChargingAttack) {
      const { isCharged, chargeRatio } = ChargedAttackSystem.releaseCharging(this.player);
      if (isCharged) {
        this.playerChargedAttack(chargeRatio);
      } else if (this.player.attackCooldown <= 0) {
        this.playerAttack();
      }
    }
  }

  /**
   * Immediately clears all active mouse/keyboard movement targets and stops momentum.
   * Invoked whenever a modal, feature panel or UI overlay is opened.
   */
  public cancelMovementAndInput() {
    this.isMouseDown = false;
    this.isRightMouseDown = false;
    this.keys = {};
    if (this.player) {
      this.player.targetX = null;
      this.player.targetY = null;
      this.player.vx = 0;
      this.player.vy = 0;
      if (this.player.isChargingAttack) {
        this.player.isChargingAttack = false;
        this.player.chargeTime = 0;
      }
    }
  }

  // ==========================================
  // 存档：导出 / 应用（JSON 可序列化状态，配合 save/SaveSystem）
  // ==========================================

  /** 导出当前游戏状态为可序列化存档 */
  public exportSaveState(): GameSaveData {
    const p = this.player;
    const f = this.floor;
    return {
      version: 1,
      savedAt: new Date().toISOString(),
      player: {
        characterClass: p.characterClass,
        x: p.x,
        y: p.y,
        stats: { ...p.stats },
        equipment: JSON.parse(JSON.stringify(p.equipment)),
        inventory: JSON.parse(JSON.stringify(p.inventory)),
        enchantments: JSON.parse(JSON.stringify(p.enchantments)),
        skillPoints: p.skillPoints,
        unlockedSkills: { ...p.unlockedSkills },
        activeSkills: { ...p.activeSkills },
        skillCooldowns: { ...p.skillCooldowns },
        hairColor: p.hairColor,
      },
      progress: {
        totalKills: this.totalKills,
        bossDefeatedCount: this.bossDefeatedCount,
        isVictory: this.isVictory,
      },
      floor: {
        zoneType: f.zoneType,
        floorNumber: f.floorNumber,
        zoneName: f.zoneName,
        theme: f.theme,
        weather: f.weather || 'clear',
        isIndoor: f.isIndoor,
        width: f.width,
        height: f.height,
        tiles: JSON.parse(JSON.stringify(f.tiles)),
        spawnX: f.spawnX,
        spawnY: f.spawnY,
        exitX: f.exitX,
        exitY: f.exitY,
        portalTownX: f.portalTownX,
        portalTownY: f.portalTownY,
      },
      quest: this.questSystem.getCurrentQuest() ? JSON.parse(JSON.stringify(this.questSystem.getCurrentQuest())) : null,
    };
  }

  /** 应用存档：还原玩家/地图/进度（实体按区域逻辑重新生成） */
  public applySaveState(data: GameSaveData): void {
    const base = this.createInitialPlayer();
    const saved = data.player;
    this.player = {
      ...base,
      ...saved,
      stats: { ...base.stats, ...saved.stats },
      vx: 0, vy: 0,
      targetX: null, targetY: null,
      isAttacking: false, attackTimer: 0, comboStep: 0, comboTimer: 0,
      isBowAiming: false, bowDrawProgress: 0,
      hurtTimer: 0, isDashing: false, dashTimer: 0, dashTrail: [],
      invulnerableTimer: 0, goldenAppleTimer: 0, whirlwindTimer: 0, shieldBlockTimer: 0,
      aimingMode: 'none',
    } as Player;
    this.isVictory = data.progress.isVictory;
    this.isGameOver = false;
    this.isLevelingUp = false;
    this.inCampHub = false;
    this.totalKills = data.progress.totalKills;
    this.bossDefeatedCount = data.progress.bossDefeatedCount;
    this.floor = {
      ...(this.floor as object),
      zoneType: data.floor.zoneType,
      floorNumber: data.floor.floorNumber,
      zoneName: data.floor.zoneName,
      theme: data.floor.theme,
      weather: data.floor.weather,
      isIndoor: data.floor.isIndoor,
      width: data.floor.width,
      height: data.floor.height,
      tiles: data.floor.tiles,
      spawnX: data.floor.spawnX,
      spawnY: data.floor.spawnY,
      exitX: data.floor.exitX,
      exitY: data.floor.exitY,
      portalTownX: data.floor.portalTownX,
      portalTownY: data.floor.portalTownY,
      lairX: undefined, lairY: undefined, lairBoss: undefined,
    } as DungeonFloor;
    this.questSystem.restoreQuest(data.quest);
    this.attackStrategy = classAttackStrategyManager.getStrategy(this.player.characterClass || 'warrior');
    this.spawnFloorEntities();
    // 出生点覆盖为存档位置
    this.player.x = saved.x;
    this.player.y = saved.y;
    this.camX = saved.x;
    this.camY = saved.y;
    soundManager.setEnvironment(this.floor.isIndoor, this.floor.zoneType);
  }

  // Charged Heavy Attack execution
  public playerChargedAttack(chargeRatio: number) {
    const p = this.player;
    const ctx: ClassAttackContext = {
      player: p,
      projectiles: this.projectiles,
      particles: this.particles,
      enemies: this.enemies,
      mouseWorldX: this.mouseWorldX,
      mouseWorldY: this.mouseWorldY,
      dealMeleeAoEDamage: (x, y, angle, arc, radius, dmg, crit) => this.dealMeleeAoEDamage(x, y, angle, arc, radius, dmg, crit),
      damageEnemy: (enemy, damage, isCrit, isBackstab) => this.damageEnemy(enemy, damage, isCrit, isBackstab),
      triggerHitStop: (dur, intensity) => this.triggerHitStop(dur, intensity),
      addFloatingText: (x, y, text, color, size, bounce) => this.addFloatingText(x, y, text, color, size, bounce),
      checkDestructibles: (x, y, radius, angle, arc) => {
        destructibleManager.checkAttackDestructibles(x, y, radius, angle, arc, this.floor, {
          spawnParticle: (particle) => this.particles.push(particle),
          spawnDrop: (drop) => this.spawnDrop(drop),
          addFloatingText: (tx, ty, text, color, size) => this.addFloatingText(tx, ty, text, color, size),
          triggerScreenShake: (intensity) => this.triggerHitStop(0.04, intensity),
        });
      },
    };

    if (this.attackStrategy.executeChargedAttack) {
      this.attackStrategy.executeChargedAttack(ctx, chargeRatio);
    } else {
      this.attackStrategy.executePrimaryAttack(ctx);
    }
  }

  private executeMeleeSwing() {
    const p = this.player;
    p.isAttacking = true;

    // Advance combo step: 0 -> 1 -> 2 -> 0
    const currentStep = p.comboStep;
    p.comboTimer = 0.85; // Time window to link the next strike
    p.comboStep = (currentStep + 1) % 3;

    const isAxe = p.equipment.weapon?.subType === 'axe';
    const isDagger = p.equipment.weapon?.subType === 'dagger';

    // Different combo parameters per step
    let damageMultiplier = 1.0;
    let attackCooldown = 0.28;
    let attackDuration = 0.22;
    let attackRange = 2.2;
    let attackArc = Math.PI * 0.75;
    let knockbackForce = 4.0;

    if (currentStep === 0) {
      // Step 1: Rapid horizontal slash
      damageMultiplier = 1.0;
      attackCooldown = isDagger ? 0.2 : isAxe ? 0.35 : 0.26;
      attackDuration = 0.2;
    } else if (currentStep === 1) {
      // Step 2: Powerful upward rising cleave
      damageMultiplier = 1.25;
      attackCooldown = isDagger ? 0.22 : isAxe ? 0.38 : 0.28;
      attackDuration = 0.24;
      attackArc = Math.PI * 0.85;
      knockbackForce = 5.0;
    } else {
      // Step 3: FINISHER - Jump into air and overhead slam into ground!
      damageMultiplier = isAxe ? 2.3 : 1.9;
      attackCooldown = isDagger ? 0.28 : isAxe ? 0.48 : 0.38;
      attackDuration = 0.32;
      attackRange = 2.8;
      attackArc = Math.PI * 1.6; // Near 360 AoE slam!
      knockbackForce = 8.0;

      // Leap upward slightly in isometric space
      p.z = 0.38;

      // Ground slam impact dust ring
      this.createExplosionParticles(p.x, p.y, isAxe ? '#f97316' : '#38bdf8', 18);

      // Register 3rd combo step as combo finisher for instant skill synergy chaining!
      ClassSkillComboSystem.registerComboFinisherReady(p);
    }

    p.attackTimer = attackDuration;
    p.attackCooldown = attackCooldown;
    soundManager.playComboSlash(currentStep);

    const hasSweeping = p.enchantments.some(e => e.id === 'sweeping_edge');
    const hasFire = p.enchantments.some(e => e.id === 'fire_aspect');
    const weaponSubType = p.equipment.weapon?.subType || 'sword';

    // Spawn high-fidelity 3D weapon slash arc ribbon via VFX System
    vfxSystem.spawnSlash(
      p.x,
      p.y,
      p.z,
      p.facingAngle,
      currentStep,
      weaponSubType,
      hasFire,
      hasSweeping
    );

    if (hasSweeping) {
      attackRange *= 1.25;
      attackArc = Math.PI * 1.85;
    }

    // Step 3 screen shake/burst effect
    for (const enemy of this.enemies) {
      const dx = enemy.x - p.x;
      const dy = enemy.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= attackRange) {
        const enemyAngle = Math.atan2(dy, dx);
        let angleDiff = Math.abs(enemyAngle - p.facingAngle);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        if (angleDiff <= attackArc / 2) {
          // Hit enemy!
          const isCrit = Math.random() < p.stats.critChance;
          let damage = Math.round(
            p.stats.attack *
            damageMultiplier *
            (isCrit ? 1.85 : 1.0) *
            (0.92 + Math.random() * 0.18)
          );

          // Class System Perk & Backstab Evaluation
          const classEval = classSystem.evaluateAttack(p, enemy, true, dist);
          damage = Math.round(damage * classEval.multiplier);
          damage = Math.max(1, damage - enemy.defense);

          this.damageEnemy(enemy, damage, isCrit, classEval.isBackstab);

          // Frame Freeze (Hit Stop) & Screen Shake feedback
          // Heavy finisher slam or crit yields visceral pause and shake
          const hitStopDur = currentStep === 2 ? 0.11 : isCrit ? 0.085 : 0.055;
          const shakeMag = currentStep === 2 ? 0.45 : isCrit ? 0.35 : 0.20;
          this.triggerHitStop(hitStopDur, shakeMag);

          // Life steal (base + class bonus)
          const totalLifeSteal = p.stats.lifeSteal + classEval.bonusLifeSteal;
          if (totalLifeSteal > 0) {
            const steal = Math.round(damage * totalLifeSteal);
            if (steal > 0 && p.stats.hp < p.stats.maxHp) {
              p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + steal);
            }
          }

          // Dynamic knockback
          enemy.vx += (dx / dist) * knockbackForce;
          enemy.vy += (dy / dist) * knockbackForce;

          // Fire Aspect ignite particle
          if (hasFire) {
            this.createExplosionParticles(enemy.x, enemy.y, '#f97316', 6);
          }
        }
      }
    }

    // Destructible Environmental Objects Breaking (Barrels, Urns, Foliage, Pillars)
    destructibleManager.checkAttackDestructibles(
      p.x,
      p.y,
      attackRange,
      p.facingAngle,
      attackArc,
      this.floor,
      {
        spawnParticle: (particle) => this.particles.push(particle),
        spawnDrop: (drop) => this.spawnDrop(drop),
        addFloatingText: (x, y, text, color, size) => this.addFloatingText(x, y, text, color, size),
        triggerScreenShake: (intensity) => this.triggerHitStop(0.04, intensity),
      }
    );
  }

  // Secondary Attack Skill (R-CLK: Class-specific tactical attack via Strategy Pattern)
  public playerSecondaryAttack() {
    const p = this.player;
    const ctx: ClassAttackContext = {
      player: p,
      projectiles: this.projectiles,
      particles: this.particles,
      enemies: this.enemies,
      mouseWorldX: this.mouseWorldX,
      mouseWorldY: this.mouseWorldY,
      dealMeleeAoEDamage: (x, y, angle, arc, radius, dmg, crit) => this.dealMeleeAoEDamage(x, y, angle, arc, radius, dmg, crit),
      damageEnemy: (enemy, damage, isCrit, isBackstab) => this.damageEnemy(enemy, damage, isCrit, isBackstab),
      triggerHitStop: (dur, intensity) => this.triggerHitStop(dur, intensity),
      addFloatingText: (x, y, text, color, size, bounce) => this.addFloatingText(x, y, text, color, size, bounce),
      checkDestructibles: (x, y, radius, angle, arc) => {
        destructibleManager.checkAttackDestructibles(x, y, radius, angle, arc, this.floor, {
          spawnParticle: (particle) => this.particles.push(particle),
          spawnDrop: (drop) => this.spawnDrop(drop),
          addFloatingText: (tx, ty, text, color, size) => this.addFloatingText(tx, ty, text, color, size),
          triggerScreenShake: (intensity) => this.triggerHitStop(0.04, intensity),
        });
      },
    };

    this.attackStrategy.executeSecondaryAttack(ctx);
  }

  // Alias for backward compatibility
  public playerBowAttack() {
    this.playerSecondaryAttack();
  }

  // Dash / Roll
  public playerDash() {
    const p = this.player;
    if (p.dashCooldown > 0) return;

    p.isDashing = true;
    p.dashTimer = 0.25;
    const hasSwift = p.enchantments.some(e => e.id === 'swiftness_aura');
    let baseCooldown = hasSwift ? 1.2 : 1.8;
    if (p.characterClass === 'rogue') {
      baseCooldown *= 0.65; // Rogue nimble tumble
    }
    p.dashCooldown = baseCooldown;
    p.invulnerableTimer = 0.32;
    soundManager.playDash();

    // Dash particle dust via VFX System
    vfxSystem.spawnDashDust(p.x, p.y, p.facingAngle, '#38bdf8');

    // Class System hook on dash
    classSystem.onDashUsed(p, this.enemies);
  }

  // Dynamic Hotkey Execution
  public useHotkey(key: string) {
    const p = this.player;
    const skillId = p.activeSkills[key];
    
    // Fallback to legacy skills if not bound, for compatibility
    if (!skillId) {
      if (key === '1') return this.useSkill1();
      if (key === '2') return this.useSkill2();
      if (key === '3') return this.useSkill3();
      if (key === '4') return this.useSkill4();
      if (key === 'q') return this.usePotion();
      return;
    }

    if (skillId === 'tnt_toss') return this.useSkill1();
    if (skillId === 'golden_apple') return this.useSkill2();
    if (skillId === 'ender_pearl') return this.useSkill3();
    if (skillId === 'shield_bash' || skillId === 'whirlwind') return this.useSkill4();
    if (skillId === 'potion') return this.usePotion();

    this.castCustomSkill(skillId);
  }

  private castCustomSkill(skillId: string) {
    const p = this.player;
    if ((p.skillCooldowns[skillId] || 0) > 0) return;
    
    const skill = skillSystem.getSkill(skillId);
    if (!skill) return;

    if (p.stats.mana < skill.manaCost) {
      this.addFloatingText(p.x, p.y, '法力不足', '#ef4444', 14);
      return;
    }

    p.stats.mana -= skill.manaCost;
    p.skillCooldowns[skillId] = skill.cooldown;

    // Casting anticipation wind-up animation & position lock for mage-type classes (Arcane Mage, Summoner, Druid)
    const isSpellcaster = p.characterClass === 'mage' || p.characterClass === 'summoner' || p.characterClass === 'druid';
    if (isSpellcaster) {
      p.castLockTimer = 0.22;
      p.castTotalTime = 0.22;
      p.isCastingSpell = true;
      p.castSpellName = skill.name;
      p.castSpellColor = p.characterClass === 'mage' ? '#a855f7' : p.characterClass === 'summoner' ? '#818cf8' : '#10b981';
      p.vx = 0;
      p.vy = 0;
      p.targetX = null;
      p.targetY = null;
    }

    const ctx: AttackContext = {
      player: p,
      projectiles: this.projectiles,
      particles: this.particles,
      mouseWorldX: this.mouseWorldX,
      mouseWorldY: this.mouseWorldY,
      dealMeleeAoEDamage: (x, y, angle, arc, radius, dmg, crit) => this.dealMeleeAoEDamage(x, y, angle, arc, radius, dmg, crit),
      triggerHitStop: (dur, intensity) => this.triggerHitStop(dur, intensity),
      addFloatingText: (x, y, text, color, size) => this.addFloatingText(x, y, text, color, size),
    };

    ClassSkillComboSystem.executeSkill(
      ctx,
      skill,
      skillId,
      (x, y) => this.isWalkable(x, y),
      () => this.playerDash()
    );
  }

  public dealMeleeAoEDamage(
    x: number,
    y: number,
    facingAngle: number,
    arcSpan: number,
    radius: number,
    baseDamage: number,
    canCrit: boolean = true
  ) {
    const p = this.player;
    for (const enemy of this.enemies) {
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const dist = Math.hypot(dx, dy);

      if (dist <= radius) {
        if (arcSpan < Math.PI * 2) {
          const enemyAngle = Math.atan2(dy, dx);
          let angleDiff = Math.abs(enemyAngle - facingAngle);
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          angleDiff = Math.abs(angleDiff);
          if (angleDiff > arcSpan / 2) continue;
        }

        const isCrit = canCrit && Math.random() < p.stats.critChance;
        let dmg = Math.round(baseDamage * (isCrit ? 1.8 : 1.0));
        dmg = Math.max(1, dmg - enemy.defense);

        this.damageEnemy(enemy, dmg, isCrit, false);
        this.triggerHitStop(0.06, 0.25);

        if (dist > 0.001) {
          enemy.vx += (dx / dist) * 8;
          enemy.vy += (dy / dist) * 8;
        }
      }
    }

    // Check destructibles in AoE
    destructibleManager.checkAttackDestructibles(
      x,
      y,
      radius,
      facingAngle,
      arcSpan,
      this.floor,
      {
        spawnParticle: (particle) => this.particles.push(particle),
        spawnDrop: (drop) => this.spawnDrop(drop),
        addFloatingText: (tx, ty, text, color, size) => this.addFloatingText(tx, ty, text, color, size),
        triggerScreenShake: (intensity) => this.triggerHitStop(0.04, intensity),
      }
    );
  }

  // Skill 1: TNT Toss
  public useSkill1() {
    const p = this.player;
    if (p.stats.tntCount <= 0 || (p.skillCooldowns['tnt_toss'] || 0) > 0) return;

    p.stats.tntCount--;
    p.skillCooldowns['tnt_toss'] = 4.0;
    soundManager.playClassSkill(p.characterClass, 'skill1');
    soundManager.playCreeperHiss();

    const speed = 8;
    this.projectiles.push({
      id: `tnt_${Date.now()}`,
      x: p.x,
      y: p.y,
      z: 0.8,
      vx: Math.cos(p.facingAngle) * speed,
      vy: Math.sin(p.facingAngle) * speed,
      vz: 4,
      damage: Math.round(p.stats.attack * 3.2),
      isPlayer: true,
      type: 'tnt',
      timer: 1.2,
      radius: 0.5,
    });
  }

  // Skill 2: Golden Apple
  public useSkill2() {
    const p = this.player;
    if ((p.skillCooldowns['golden_apple'] || 0) > 0) return;

    p.skillCooldowns['golden_apple'] = 18.0;
    p.goldenAppleTimer = 10.0; // 10 seconds of divine golden aegis protective shield!
    soundManager.playClassSkill(p.characterClass, 'skill2');
    soundManager.playPotion();

    const healAmount = Math.round(p.stats.maxHp * 0.5);
    p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + healAmount);
    p.invulnerableTimer = 1.5;

    this.addFloatingText(p.x, p.y, `金苹果神佑 +${healAmount} HP!`, '#fbbf24', 18);
    vfxSystem.spawnDivineAegis(p.x, p.y);
  }

  // Skill 3: Ender Pearl
  public useSkill3() {
    const p = this.player;
    if (p.stats.enderPearls <= 0 || (p.skillCooldowns['ender_pearl'] || 0) > 0) return;

    p.stats.enderPearls--;
    p.skillCooldowns['ender_pearl'] = 6.0;
    soundManager.playClassSkill(p.characterClass, 'skill3');
    soundManager.playTeleport();

    // Teleport close to mouse if walkable
    const targetX = this.mouseWorldX;
    const targetY = this.mouseWorldY;
    if (this.isWalkable(targetX, targetY)) {
      p.x = targetX;
      p.y = targetY;
      this.resolvePlayerMovementAndCollisions(0.016);
    }

    // Release ender spatial vortex
    vfxSystem.spawnEnderVortex(p.x, p.y);
    for (const enemy of this.enemies) {
      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist < 3.5) {
        this.damageEnemy(enemy, Math.round(p.stats.attack * 1.5), true);
        enemy.vx += ((enemy.x - p.x) / (dist || 1)) * 6;
        enemy.vy += ((enemy.y - p.y) / (dist || 1)) * 6;
      }
    }
  }

  // Skill 4: Shield Bash (if shield equipped) or Whirlwind Spin
  public useSkill4() {
    const p = this.player;
    const skillId = p.equipment.offhand?.subType === 'shield' ? 'shield_bash' : 'whirlwind';
    if ((p.skillCooldowns[skillId] || 0) > 0) return;

    soundManager.playClassSkill(p.characterClass, 'skill4');
    const hasShield = p.equipment.offhand?.subType === 'shield';

    if (hasShield) {
      // Shield Bash & Guard
      p.skillCooldowns['shield_bash'] = 5.0;
      p.shieldBlockTimer = 1.0;
      p.invulnerableTimer = 0.8;
      soundManager.playShieldBlock();

      vfxSystem.spawnShockwave(p.x, p.y, 0, 2.4, '#38bdf8', false, 0.3);
      vfxSystem.spawnSparks(p.x, p.y, 0.4, 18, '#ffffff', 6, Math.PI * 0.7, p.facingAngle);

      this.addFloatingText(p.x, p.y, '盾牌壁垒格挡!', '#38bdf8', 16);

      // Knock back and stun enemies in front 120-degree cone
      for (const enemy of this.enemies) {
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 3.2) {
          const enemyAngle = Math.atan2(dy, dx);
          let angleDiff = Math.abs(enemyAngle - p.facingAngle);
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          if (Math.abs(angleDiff) <= Math.PI * 0.4) {
            enemy.vx += (dx / dist) * 10;
            enemy.vy += (dy / dist) * 10;
            this.damageEnemy(enemy, Math.round(p.stats.attack * 1.6), true);
            this.addFloatingText(enemy.x, enemy.y, 'STUNNED!', '#facc15', 14);
            this.triggerHitStop(0.08, 0.36);
          }
        }
      }
    } else {
      // Whirlwind Spin: 360 degree blade storm
      p.skillCooldowns['whirlwind'] = 6.0;
      p.whirlwindTimer = 0.45;
      p.invulnerableTimer = 0.4;
      soundManager.playComboSlash(2);

      vfxSystem.spawnWhirlwind(p.x, p.y, p.z, 3.4, '#38bdf8');
      this.addFloatingText(p.x, p.y, '剑刃风暴 (Whirlwind)!', '#38bdf8', 16, true);

      // Hit all enemies in 360 AoE
      let anyHit = false;
      for (const enemy of this.enemies) {
        const dx = enemy.x - p.x;
        const dy = enemy.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 3.4) {
          this.damageEnemy(enemy, Math.round(p.stats.attack * 2.2), true);
          enemy.vx += (dx / dist) * 7;
          enemy.vy += (dy / dist) * 7;
          anyHit = true;
        }
      }
      if (anyHit) {
        this.triggerHitStop(0.06, 0.28);
      }
    }
  }

  // Potion Hotkey
  public usePotion() {
    const p = this.player;
    if (p.stats.potions <= 0 || (p.skillCooldowns['potion'] || 0) > 0 || p.stats.hp >= p.stats.maxHp) return;

    p.stats.potions--;
    p.skillCooldowns['potion'] = 3.0;
    soundManager.playPotion();

    const heal = Math.round(p.stats.maxHp * 0.6);
    p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + heal);
    this.addFloatingText(p.x, p.y, `+${heal} HP`, '#4ade80', 16);
    this.createExplosionParticles(p.x, p.y, '#ef4444', 12);

    // Class hook on potion used (e.g. Mage Arcane blast)
    classSystem.onPotionUsed(p, this.enemies);
  }

  private updateEnemies(dt: number) {
    // Modular Enemy Manager update: Behavior Tree tactical AI, crowd separation, physics, and animation synchronization
    this.enemyManager.update(
      this.player,
      this.projectiles,
      dt,
      this.floor,
      {
        isWalkable: this.isWalkable.bind(this),
        addFloatingText: this.addFloatingText.bind(this),
        damagePlayer: this.damagePlayer.bind(this),
        onEnemyDied: (enemy) => this.onEnemyDied(enemy),
        spawnParticle: (particle) => this.particles.push(particle),
        triggerScreenShake: (dur, intensity) => this.triggerHitStop(0.04, intensity),
      }
    );
    this.enemies = this.enemyManager.getEnemies();
  }

  private explodeCreeper(enemy: Enemy) {
    soundManager.playExplosion();
    vfxSystem.spawnExplosion(enemy.x, enemy.y, 3.5, '#22c55e');

    const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
    if (dist < 3.2) {
      const dmg = Math.round(55 * (1 - dist / 3.2));
      this.damagePlayer(dmg, '苦力怕自爆');
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.timer -= dt;

      if (proj.type === 'tnt') {
        // TNT ballistic trajectory
        proj.vz -= 9.8 * dt;
        proj.z += proj.vz * dt;
        if (proj.z <= 0) {
          proj.z = 0;
          proj.vx *= 0.6;
          proj.vy *= 0.6;
          proj.vz = -proj.vz * 0.4;
        }
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      // Guided missile steering logic for Mage / homing projectiles
      if (proj.homing && proj.isPlayer) {
        let target = this.enemies.find((e) => e.id === proj.targetEnemyId && e.hp > 0);
        if (!target) {
          let minDist = 11.0;
          for (const e of this.enemies) {
            if (e.hp <= 0) continue;
            const dist = Math.hypot(e.x - proj.x, e.y - proj.y);
            if (dist < minDist) {
              minDist = dist;
              target = e;
            }
          }
          if (target) proj.targetEnemyId = target.id;
        }

        if (target) {
          const dx = target.x - proj.x;
          const dy = target.y - proj.y;
          const targetAngle = Math.atan2(dy, dx);
          const currentAngle = Math.atan2(proj.vy, proj.vx);
          const currentSpeed = Math.hypot(proj.vx, proj.vy) || 16;
          let angleDiff = targetAngle - currentAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          const turnRate = proj.homingTurnRate || 4.5;
          const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnRate * dt);
          proj.vx = Math.cos(newAngle) * currentSpeed;
          proj.vy = Math.sin(newAngle) * currentSpeed;
        }

        // Particle trail
        if (Math.random() < 0.35 && proj.trailColor) {
          this.particles.push({
            x: proj.x + (Math.random() - 0.5) * 0.15,
            y: proj.y + (Math.random() - 0.5) * 0.15,
            z: proj.z || 0.4,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            vz: (Math.random() - 0.5) * 0.4,
            life: 0.28,
            maxLife: 0.28,
            color: proj.trailColor,
            size: 0.1,
            type: 'spark',
          });
        }
      }

      // Projectile timeout or wall hit
      if (proj.timer <= 0 || !this.isWalkable(proj.x, proj.y)) {
        if (proj.type === 'tnt') {
          // TNT Blast
          soundManager.playExplosion();
          vfxSystem.spawnExplosion(proj.x, proj.y, 4.0, '#ef4444');
          for (const enemy of this.enemies) {
            const d = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
            if (d < 3.5) {
              this.damageEnemy(enemy, proj.damage, true);
              enemy.vx += ((enemy.x - proj.x) / (d || 1)) * 8;
              enemy.vy += ((enemy.y - proj.y) / (d || 1)) * 8;
            }
          }
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision
      if (proj.isPlayer) {
        // Hits enemies
        for (const enemy of this.enemies) {
          const d = Math.hypot(enemy.x - proj.x, enemy.y - proj.y);
          if (d < enemy.size * 0.8) {
            // 数值平衡(2026-09)：投射物与近战同规则减防（旧版远程全程无视防御）
            const hitDmg = Math.max(1, proj.damage - enemy.defense);
            this.damageEnemy(enemy, hitDmg, false);
            if (proj.type === 'mage_bolt' && this.player.stats.mana < this.player.stats.maxMana) {
              this.player.stats.mana = Math.min(this.player.stats.maxMana, this.player.stats.mana + 1);
            }
            if (proj.pierceCount && proj.pierceCount > 1) {
              proj.pierceCount--;
            } else {
              this.projectiles.splice(i, 1);
            }
            break;
          }
        }
      } else {
        // Enemy projectile hits player
        const d = Math.hypot(this.player.x - proj.x, this.player.y - proj.y);
        if (d < 0.8) {
          this.damagePlayer(proj.damage, '投射物');
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  public spawnDrop(drop: Omit<DropItem, 'vx' | 'vy' | 'vz' | 'bounces' | 'maxBounces' | 'isGrounded' | 'rotation' | 'rotationSpeed' | 'impactWaveTimer' | 'spawnTime'> & {
    vx?: number;
    vy?: number;
    vz?: number;
    bounces?: number;
    maxBounces?: number;
    isGrounded?: boolean;
    rotation?: number;
    rotationSpeed?: number;
    impactWaveTimer?: number;
    spawnTime?: number;
  }) {
    const angle = Math.random() * Math.PI * 2;
    const scatterSpeed = 1.2 + Math.random() * 2.2;
    const vx = drop.vx !== undefined ? drop.vx : Math.cos(angle) * scatterSpeed;
    const vy = drop.vy !== undefined ? drop.vy : Math.sin(angle) * scatterSpeed;
    const vz = drop.vz !== undefined ? drop.vz : (3.6 + Math.random() * 2.4);

    this.drops.push({
      ...drop,
      vx,
      vy,
      vz,
      scale: 1.0,
      isBeingCollected: false,
      pickupProgress: 0,
      bounces: drop.bounces || 0,
      maxBounces: drop.maxBounces || (2 + Math.floor(Math.random() * 2)),
      isGrounded: drop.isGrounded || false,
      rotation: drop.rotation !== undefined ? drop.rotation : Math.random() * Math.PI * 2,
      rotationSpeed: drop.rotationSpeed !== undefined ? drop.rotationSpeed : (Math.random() - 0.5) * 10,
      impactWaveTimer: 0,
      spawnTime: this.gameTime,
    });
  }

  private updateDrops(dt: number) {
    const p = this.player;
    this.enemyManager.updateDropsPhysics(this.drops, p, dt, {
      onCollectEmerald: (amount) => {
        p.stats.emeralds += amount;
        soundManager.playEmeraldPickup();
      },
      onCollectExp: (amount) => {
        this.addExp(amount);
      },
      onCollectItem: (item, rarity) => {
        const targetSlot = item.slot;
        if (!p.equipment[targetSlot]) {
          p.equipment[targetSlot] = item;
          if (item.attackBonus) p.stats.attack += item.attackBonus;
          if (item.defenseBonus) p.stats.defense += item.defenseBonus;
          if (item.hpBonus) {
            p.stats.maxHp += item.hpBonus;
            p.stats.hp += item.hpBonus;
          }
          if (item.speedBonus) p.stats.speed += item.speedBonus;
          if (item.critChanceBonus) p.stats.critChance += item.critChanceBonus;
          if (item.lifeStealBonus) p.stats.lifeSteal += item.lifeStealBonus;

          setBonusSystem.applySetStatBonuses(p);
          soundManager.playLootDrop(rarity);
          this.addFloatingText(p.x, p.y, `装备成功: ${item.name}`, '#4ade80', 16);
        } else {
          p.inventory.push(item);
          soundManager.playLootDrop(rarity);
          this.addFloatingText(p.x, p.y, `获得战利品: ${item.name}`, '#fbbf24', 14);
        }
      },
      addFloatingText: (x, y, text, color, size) => this.addFloatingText(x, y, text, color, size),
      spawnParticle: (particle) => this.particles.push(particle),
    });
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.gravity) {
        p.vz -= p.gravity * dt;
        p.z += p.vz * dt;
        if (p.z <= 0) p.z = 0;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private updateFloatingTexts(dt: number) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i];
      text.life -= dt;
      text.y += text.vy * dt;
      if (text.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public damageEnemy(
    enemy: Enemy,
    rawDamage: number,
    isCrit: boolean,
    isBackstab: boolean = false,
    elementOverride?: ElementType
  ) {
    // Downed Reviving Undead Execution Strike (allows player to finish off reviving zombies)
    if (enemy.isReviving) {
      enemyDeathSystem.executeDownedEnemy(enemy, {
        addFloatingText: this.addFloatingText.bind(this),
        spawnParticle: (particle) => this.particles.push(particle),
        onTrueDeath: (e) => this.onEnemyDied(e),
        triggerScreenShake: (dur, intensity) => this.triggerHitStop(0.06, intensity),
      });
      return;
    }

    if (enemy.isDying || enemy.hp <= 0) return;

    // Evasive Combat Roll i-frame (e.g. Goblin)
    if (enemy.state === 'rolling') {
      this.addFloatingText(enemy.x, enemy.y, '💨 翻滚闪避!', '#facc15', 12);
      return;
    }

    const p = this.player;

    // 数值平衡(2026-09)：记录战斗时间（法力脱战回复用）
    this.lastCombatTime = this.gameTime;

    // 1. Determine elemental damage type
    let element: ElementType = elementOverride || 'physical';
    if (!elementOverride) {
      if (
        p.enchantments.some((e) => e.id === 'fire_aspect') ||
        p.equipment.weapon?.name?.includes('火焰') ||
        p.equipment.weapon?.name?.includes('烈焰')
      ) {
        element = 'fire';
      } else if (
        p.equipment.weapon?.name?.includes('冰霜') ||
        p.equipment.weapon?.name?.includes('寒冰')
      ) {
        element = 'frost';
      } else if (
        p.enchantments.some((e) => e.id === 'thundershot') ||
        p.equipment.weapon?.name?.includes('雷霆') ||
        p.equipment.weapon?.name?.includes('闪电')
      ) {
        // 数值平衡(2026-09)：移除“法师全职业=闪电”的隐性元素归属，元素只由附魔/武器决定
        element = 'lightning';
      }
    }

    // 2. Evaluate Elemental Damage with Weakness & Resistance
    const elemResult = elementalSystem.evaluateDamage(rawDamage, element, enemy);
    let finalDamage = elemResult.finalDamage;

    // 2.5 Armored Zombie Shield Block
    if (enemy.isBlocking) {
      soundManager.playShieldBlock();
      finalDamage = Math.max(1, Math.round(finalDamage * 0.2)); // 80% damage reduction
      this.addFloatingText(enemy.x, enemy.y, '🛡️ 完美格挡! (-80%)', '#94a3b8', 13);
      vfxSystem.spawnSparks(enemy.x, enemy.y, 0.4, 10, '#cbd5e1', 5);
      p.vx -= Math.cos(p.facingAngle) * 3.0;
      p.vy -= Math.sin(p.facingAngle) * 3.0;
    }

    // 3. Elite Affix: 护盾反射 (Shield Reflect) check
    if (enemy.shieldReflectActive) {
      soundManager.playShieldReflect();
      finalDamage = Math.max(1, Math.round(finalDamage * 0.4)); // 60% damage mitigation
      const reflected = Math.max(1, Math.round(rawDamage * 0.35)); // 35% reflected back
      this.damagePlayer(reflected, '护盾反射');
      this.addFloatingText(p.x, p.y, `护盾反噬 -${reflected}`, '#38bdf8', 14);
      vfxSystem.spawnSparks(enemy.x, enemy.y, 0.4, 14, '#38bdf8', 6);
    }

    // 4. Elite Affix: 瞬移 (Emergency Reaction on heavy hit)
    if (enemy.affixes?.includes('瞬移') && finalDamage >= enemy.maxHp * 0.25) {
      if (Math.random() < 0.45) {
        soundManager.playTeleportBlink();
        vfxSystem.spawnVoidMote(enemy.x, enemy.y, 0.4, 8);
        const escapeAngle = Math.random() * Math.PI * 2;
        const ex = p.x + Math.cos(escapeAngle) * 3.6;
        const ey = p.y + Math.sin(escapeAngle) * 3.6;
        if (this.isWalkable(ex, ey)) {
          enemy.x = ex;
          enemy.y = ey;
          this.addFloatingText(enemy.x, enemy.y, '闪避瞬移!', '#c084fc', 13);
        }
      }
    }

    enemy.hp -= finalDamage;
    enemy.hitTimer = 0.14;
    soundManager.playHit();

    // 打击顿帧（hitStop）保留打击感，但不再驱动屏幕抖动：
    // 主动攻击命中时若整屏抖动，角色看起来像在持续播放受击动效。
    // 屏幕抖动只留给真正的受击/爆炸事件（damagePlayer / TNT 等）。
    this.triggerHitStop(isCrit || isBackstab ? 0.08 : 0.045, 0);

    const hasFire = element === 'fire' || p.enchantments.some((e) => e.id === 'fire_aspect');
    vfxSystem.spawnHitSparks(enemy.x, enemy.y, enemy.z, isCrit, hasFire);

    let text = `${finalDamage}${isCrit ? '!' : ''}`;
    let textColor = isCrit ? '#facc15' : '#f8fafc';
    if (isBackstab) {
      text = `背刺 ${finalDamage}!`;
      textColor = '#06b6d4';
    }

    this.addFloatingText(
      enemy.x,
      enemy.y,
      text,
      textColor,
      isCrit || isBackstab ? 18 : 13,
      isCrit || isBackstab
    );

    // Elemental feedback floating badge
    if (elemResult.feedbackText) {
      this.addFloatingText(
        enemy.x,
        enemy.y - 0.45,
        elemResult.feedbackText,
        elemResult.feedbackColor,
        14,
        elemResult.isWeakness
      );
    }

    // Enemy Death
    if (enemy.hp <= 0 && !enemy.isDying) {
      this.enemyManager.killEnemy(
        enemy,
        (e) => this.onEnemyDied(e),
        this.floor,
        {
          isWalkable: this.isWalkable.bind(this),
          addFloatingText: this.addFloatingText.bind(this),
          damagePlayer: this.damagePlayer.bind(this),
          onEnemyDied: (e) => this.onEnemyDied(e),
          spawnParticle: (particle) => this.particles.push(particle),
          triggerScreenShake: (dur, intensity) => this.triggerHitStop(0.04, intensity),
        }
      );
    }
  }

  private onEnemyDied(enemy: Enemy) {
    this.totalKills++;

    // Broadcast kill event (quest system & future systems subscribe via gameEventBus)
    emitEnemyKilled(enemy, this.player, this.addFloatingText.bind(this));

    // 世界事件写入全城 NPC 记忆——他们会记得领主是谁杀的
    if (enemy.isBoss) {
      npcLifeSim.recordWorldEvent('world_boss', `冒险者击溃了${enemy.name}`);
    }

    // 图鉴死亡机制（分裂等）
    this.enemyManager.handleDeathSplit(enemy);

    // Death explosion particles and voxel debris via VFX System
    const voxelType = enemy.type === 'wither_boss' ? 'nether' : enemy.type === 'enderman' ? 'emerald' : 'stone';
    vfxSystem.spawnVoxelDebris(enemy.x, enemy.y, 0.4, enemy.isElite ? 16 : 9, voxelType, 5);
    this.createExplosionParticles(enemy.x, enemy.y, enemy.type === 'enderman' ? '#c084fc' : '#4ade80', 16);

    // ===== 掉落数值平衡：按图鉴 tier 与玩家等级缩放 =====
    // tierBoost  = 1 + tier * 0.35              （图鉴 tier 0-4 → 1.0x ~ 2.4x；无 defId 的经典怪视为 tier 0 = 1.0x）
    // levelBoost = 1 + min(12, 玩家等级) * 0.12  （玩家 1 级 ~ 12 级 → 1.12x ~ 2.44x，随成长温和通胀）
    const bestiaryDef = enemy.defId ? getMonsterDefinition(enemy.defId) : undefined;
    const monsterTier = bestiaryDef?.tier ?? 0;
    const tierBoost = 1 + monsterTier * 0.35;
    const levelBoost = 1 + Math.min(12, this.player.stats.level) * 0.12;
    // 数值平衡(2026-09)：追加内容等级收益因子 + 血月 1.5 倍宝石（旧版 emeraldMult 从未生效）
    const zoneLv = this.zoneMonsterLevel;
    const zoneFactor = 1 + Math.max(0, zoneLv - 1) * 0.22; // 高内容等级区域经验逐步拉开差距
    const gemZoneScale = 0.8 + 0.2 * zoneLv;
    const moonGemMult = bloodMoonSystem.getMods().emeraldMult;
    const isRichKill = enemy.isBoss || enemy.isElite; // Boss 与精英同享精英级奖励（Boss 不再借 isElite 身份）
    // 数值平衡(2026-09)：掉落幸运 —— 精英/高图鉴 tier 略有出货加成，但压得很轻（好装备保持稀有）
    let dropLuck = 0;
    if (enemy.type === 'wither_boss') dropLuck = 0.35;
    else if (monsterTier >= 4) dropLuck = 0.5;
    else if (monsterTier >= 3) dropLuck = 0.35;
    else if (isRichKill) dropLuck = 0.25;
    else if (monsterTier >= 2) dropLuck = 0.2;

    // Drop EXP with bouncing burst
    // 数值平衡(2026-09)：精英/首领基础 60(≈4×普通)；图鉴 tier 经验权重 0.45/级（高威胁高回报）
    const xpTierBoost = 1 + monsterTier * 0.45;
    let expAmt = Math.round((isRichKill ? 60 : 15) * xpTierBoost * levelBoost * zoneFactor);
    if (enemy.isBoss) expAmt *= 3;
    this.spawnDrop({
      id: `exp_${Date.now()}_${Math.random()}`,
      isExp: true,
      amount: expAmt,
      x: enemy.x,
      y: enemy.y,
      z: 0.6,
      vz: 4.0 + Math.random() * 2.0,
      rarity: 'common',
      name: '经验宝珠',
      color: '#84cc16',
    });

    // Drop Emeralds with bouncing burst
    // 数值平衡(2026-09)：每击杀必掉 ≥1 绿宝石，消除“白打”落空感
    // 金额 = (首领/精英 1-8 / 普通 1-3) × tierBoost × gemZoneScale × 血月(1.5)
    this.spawnDrop({
      id: `gem_${Date.now()}_${Math.random()}`,
      isEmerald: true,
      amount: Math.max(1, Math.floor((Math.random() * (isRichKill ? 8 : 3) + 1) * tierBoost * gemZoneScale * moonGemMult)),
      x: enemy.x,
      y: enemy.y,
      z: 0.7,
      vz: 3.8 + Math.random() * 2.2,
      rarity: 'rare',
      name: '绿宝石',
      color: '#10b981',
    });

    // Drop Equipment Loot with high bouncing arc
    // 数值平衡(2026-09)：普通 0.18 / 精英 0.85 / 首领 1.0 —— 普通降噪、精英抬保底、强敌多件
    const bossKill = enemy.type === 'wither_boss' || monsterTier >= 4;
    let lootChance = bossKill ? 1.0 : isRichKill ? 0.85 : 0.18;
    if (!bossKill && monsterTier >= 2) {
      lootChance = Math.min(1.0, lootChance * 1.5);
    }
    const dropLootItem = (forceRarity?: ItemRarity) => {
      const item = generateRandomItem(
        // 装备层数取 max(区域内容等级, 玩家等级)：深层高区与角色成长同步产出匹配装备
        Math.max(zoneLv, this.player.stats.level),
        forceRarity ?? (enemy.type === 'wither_boss' ? 'legendary' : undefined),
        this.player.characterClass,
        dropLuck
      );
      this.spawnDrop({
        id: `drop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        item,
        amount: 1,
        x: enemy.x + (Math.random() - 0.5) * 0.4,
        y: enemy.y + (Math.random() - 0.5) * 0.4,
        z: 0.8,
        vz: 4.5 + Math.random() * 2.5,
        rarity: item.rarity,
        name: item.name,
        color: item.rarity === 'legendary' ? '#f59e0b' : item.rarity === 'rare' ? '#38bdf8' : item.rarity === 'magic' ? '#a855f7' : '#94a3b8',
      });
      soundManager.playLootDrop(item.rarity);
    };
    if (Math.random() < lootChance) dropLootItem();
    // 数值平衡(2026-09)：精英 35% 概率补第二件、首领/Boss 必掉第二件（同档随机，不再保底稀有，好装备保持稀有）
    const extraChance = bossKill ? 1.0 : isRichKill ? 0.35 : 0;
    if (Math.random() < extraChance) dropLootItem();

    if (enemy.type === 'wither_boss') {
      this.bossDefeatedCount++;
      this.addFloatingText(enemy.x, enemy.y, '领主已被斩杀！通往下一层的传送门已开启！', '#f59e0b', 20);
    }

    // Recover Stolen Emeralds from defeated Goblin
    if (enemy.type === 'goblin' && enemy.stolenCoins && enemy.stolenCoins > 0) {
      for (let i = 0; i < enemy.stolenCoins; i++) {
        this.spawnDrop({
          id: `stolen_gem_${Date.now()}_${i}`,
          isEmerald: true,
          amount: 1,
          x: enemy.x,
          y: enemy.y,
          z: 0.7,
          vz: 4.0 + Math.random() * 2.0,
          rarity: 'rare',
          name: '追回的绿宝石',
          color: '#10b981',
        });
      }
      this.addFloatingText(enemy.x, enemy.y, `💰 追回了 ${enemy.stolenCoins} 绿宝石!`, '#fbbf24', 16, true);
    }
  }

  public damagePlayer(rawDmg: number, source: string) {
    const p = this.player;
    if (p.invulnerableTimer > 0) return;
    this.lastCombatTime = this.gameTime;

    // 数值平衡(2026-09)：战士盾御坚守 -80% 伤害真正生效（此前 shieldBlockTimer 只降计时无人读取）
    if (p.shieldBlockTimer > 0) {
      rawDmg = rawDmg * 0.2;
    }

    // Check Shield block from offhand
    if (p.equipment.offhand?.subType === 'shield') {
      const blockChance = p.equipment.offhand.name.includes('钻石') ? 0.35 : 0.22;
      if (Math.random() < blockChance) {
        soundManager.playHit();
        this.addFloatingText(p.x, p.y, '盾牌格挡！', '#38bdf8', 16);
        this.createExplosionParticles(p.x, p.y, '#38bdf8', 10);
        p.invulnerableTimer = 0.2;
        return; // Complete damage block!
      }
    }

    // Apply Thorns
    const hasThorns = p.enchantments.some(e => e.id === 'thorns_protection');
    let dmg = Math.max(1, rawDmg - p.stats.defense);

    if (hasThorns) {
      dmg = Math.round(dmg * 0.8);
      // Reflect to nearby enemies
      for (const enemy of this.enemies) {
        if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < 3.0) {
          this.damageEnemy(enemy, Math.round(rawDmg * 0.4), false);
        }
      }
    }

    // Check Totem of Undying resurrection on lethal blow
    if (p.stats.hp - dmg <= 0) {
      const hasTotem =
        (p.equipment.offhand && p.equipment.offhand.name.includes('不死图腾')) ||
        (p.equipment.ring && p.equipment.ring.name.includes('不死图腾'));

      if (hasTotem) {
        p.stats.hp = Math.round(p.stats.maxHp * 0.65);
        p.invulnerableTimer = 2.8;
        soundManager.playTotemResurrection();
        this.addFloatingText(p.x, p.y, '不死图腾激活！逆转死亡！', '#facc15', 22);
        vfxSystem.spawnTotemRevive(p.x, p.y);

        // Consume totem
        if (p.equipment.offhand && p.equipment.offhand.name.includes('不死图腾')) {
          p.equipment.offhand = null;
        } else if (p.equipment.ring && p.equipment.ring.name.includes('不死图腾')) {
          p.equipment.ring = null;
        }
        return;
      }
    }

    p.stats.hp -= dmg;
    p.invulnerableTimer = 0.4;
    p.hurtTimer = 0.25; // Trigger hurt flinch animation
    soundManager.playHit();
    this.triggerHitStop(0.06, 0.4); // Trigger rapid screen shake & hitStop on player damage

    this.addFloatingText(p.x, p.y, `-${dmg}`, '#ef4444', 16);

    if (p.stats.hp <= 0) {
      p.stats.hp = 0;
      this.isGameOver = true;
    }
  }

  public addExp(amount: number) {
    const p = this.player;
    soundManager.playEmeraldPickup();
    // 数值平衡(2026-09)：经验统一走 grantExperience —— 支持连升、职业成长、技能点
    const result = grantExperience(p, amount);
    if (result.leveled) {
      soundManager.playLevelUp();
      this.addFloatingText(p.x, p.y, `升级! 等级 ${p.stats.level}`, '#fbbf24', 22);
      vfxSystem.spawnShockwave(p.x, p.y, 0, 3.2, '#fef08a', false, 0.45);
      vfxSystem.spawnSparks(p.x, p.y, 0.5, 20, '#fde047', 6);

      // Trigger 3 Roguelike draft options
      this.triggerLevelUpDraft();
    }
  }

  private triggerLevelUpDraft() {
    this.isLevelingUp = true;
    const shuffled = [...ROGUELIKE_ENCHANTMENTS].sort(() => Math.random() - 0.5);
    this.currentLevelUpChoices = shuffled.slice(0, 3);
  }

  public selectEnchantment(choice: EnchantmentChoice) {
    choice.effect(this.player);

    const existing = this.player.enchantments.find(e => e.id === choice.id);
    if (existing) {
      existing.count++;
    } else {
      this.player.enchantments.push({ id: choice.id, name: choice.name, count: 1 });
    }

    this.isLevelingUp = false;
  }

  private checkTileInteractions() {
    const p = this.player;
    const tx = Math.floor(p.x + 0.5);
    const ty = Math.floor(p.y + 0.5);
    const tile = this.getTile(p.x, p.y);

    // 1. Proximity Chest Opening (Open chest when approaching within 1.3 blocks)
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = tx + dx;
        const cy = ty + dy;
        if (this.getTile(cx, cy) === 'chest') {
          const dist = Math.hypot(p.x - cx, p.y - cy);
          if (dist < 1.45) {
            this.writeTile(cx, cy, 'opened_chest');
            soundManager.playEmeraldPickup();

            // 数值平衡(2026-09)：宝箱 ilvl 与怪物掉落统一 + 少量幸运（不再大幅抬稀有度）
            const item = generateRandomItem(Math.max(this.zoneMonsterLevel, p.stats.level), undefined, this.player.characterClass, 0.25);
            this.spawnDrop({
              id: `chest_item_${Date.now()}`,
              item,
              amount: 1,
              x: cx,
              y: cy,
              z: 0.6,
              vz: 4.8,
              rarity: item.rarity,
              name: item.name,
              color: '#fbbf24',
            });
            this.spawnDrop({
              id: `chest_gem_${Date.now()}`,
              isEmerald: true,
              // 数值平衡(2026-09)：宝箱宝石随区域内容等级增长
              amount: Math.max(5, Math.round((5 + Math.random() * 7) * (0.8 + 0.2 * this.zoneMonsterLevel))),
              x: cx + 0.1,
              y: cy + 0.1,
              z: 0.7,
              vz: 4.2,
              rarity: 'rare',
              name: '绿宝石宝藏',
              color: '#10b981',
            });
            this.addFloatingText(cx, cy, '打开了宝箱!', '#fbbf24', 16);
            emitChestOpened(cx, cy, this.player, this.addFloatingText.bind(this));
          }
        }
      }
    }

    // 2. Zone Gate transitions
    if (tile === 'town_gate') {
      if (this.floor.zoneType === 'keep') {
      // 前哨城塞：戍卫班 + 少量潜入魔物（边境巡逻任务目标）
      this.npcs = FRONTIER_NPC_ROSTER.map((def) => {
        const tile = this.floor.tiles[def.y]?.[def.x];
        if (tile && DECOR_TILES.has(tile)) this.writeTile(def.x, def.y, 'grass');
        return {
          id: def.id, name: def.name, type: def.type,
          x: def.x, y: def.y, z: 0,
          dialogue: def.dialogueStates.pre_expedition,
          icon: def.icon, color: def.color, interactRadius: 2.5,
          homeX: def.x, homeY: def.y, wanderRadius: def.wanderRadius,
        };
      });
      npcLifeSim.attachTown(this.npcs);
      // 潜入城塞的魔物斥候（边境巡逻任务目标）
      for (let i = 0; i < 5; i++) {
        const rx = 6 + Math.random() * (this.floor.width - 12);
        const ry = 6 + Math.random() * (this.floor.height - 12);
        if (!this.isWalkable(rx, ry)) continue;
        this.enemyManager.spawnEnemy(['zombie', 'skeleton', 'spider'][i % 3] as EnemyType, rx, ry, this.zoneMonsterLevel, false, false);
      }
      this.enemies = this.enemyManager.getEnemies();
      this.questSystem.generateQuestForFloor(this.floor, this.enemies, this.npcs);
      return;
    }

    if (this.floor.zoneType === 'town') {
        this.travelToZone('overworld', 0);
      } else {
        this.travelToZone('town', 0);
      }
    } else if (tile === 'biome_gate') {
      // 古老传送门：通往随机未知生态区（排除当前区域）
      const destinations = [...BIOME_ZONES].filter((z) => z !== this.floor.zoneType);
      const target = destinations[Math.floor(Math.random() * destinations.length)] as ZoneType;
      this.addFloatingText(p.x, p.y - 1, '🌀 古老传送门轰然激活...', '#c084fc', 16);
      this.travelToZone(target, 0);
    } else if (tile === 'keep_gate') {
      this.addFloatingText(p.x, p.y - 1, '🏰 前哨城塞就在前方...', '#38bdf8', 15);
      this.travelToZone('keep', 0);
    } else if (tile === 'dungeon_gate') {
      this.travelToZone('dungeon', 1);
    } else if (tile === 'exit_portal') {
      // Step on portal
      this.nextFloor();
    } else if (tile === 'shrine') {
      this.writeTile(tx, ty, 'floor');
      soundManager.playLevelUp();
      p.stats.hp = p.stats.maxHp;
      p.stats.potions = Math.min(5, p.stats.potions + 2);
      this.addFloatingText(tx, ty, '附魔圣坛：生命完全恢复，药水补充！', '#38bdf8', 18);
      this.createExplosionParticles(tx, ty, '#38bdf8', 30);
      emitShrineActivated(tx, ty, this.player, this.addFloatingText.bind(this));
    }
  }

  private checkNPCInteractions(dt: number) {
    const p = this.player;
    let nearMaster = false;

    for (const npc of this.npcs) {
      const dist = Math.hypot(p.x - npc.x, p.y - npc.y);

      if (npc.type === 'class_master' && dist <= (npc.interactRadius || 2.8)) {
        nearMaster = true;
      }

      // Follower behavior
      if (npc.isFollowing && !npc.rescued) {
        if (dist > 1.8) {
          const moveDist = Math.min(dist - 1.5, 3.4 * dt);
          npc.x += ((p.x - npc.x) / dist) * moveDist;
          npc.y += ((p.y - npc.y) / dist) * moveDist;
        }

        // Check if safely escorted to exit portal or town gate
        const tileUnderPlayer = this.getTile(p.x, p.y);
        const tileUnderNPC = this.getTile(npc.x, npc.y);
        if (
          tileUnderPlayer === 'exit_portal' ||
          tileUnderPlayer === 'dungeon_gate' ||
          tileUnderNPC === 'exit_portal' ||
          tileUnderNPC === 'dungeon_gate'
        ) {
          npc.rescued = true;
          npc.isFollowing = false;
          emitNpcRescued(npc, this.player, this.addFloatingText.bind(this));
        }
      }

      if (dist < npc.interactRadius) {
        if (Math.random() < 0.01 * dt) {
          const dialog = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
          this.addFloatingText(npc.x, npc.y + 0.5, dialog, '#fff', 12);
        }
      }
    }

    this.nearbyClassMaster = nearMaster;
  }

  public interactNPC(x: number, y: number): boolean {
    for (const npc of this.npcs) {
      const clickDist = Math.hypot(x - npc.x, y - npc.y);
      const playerDist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
      // Allow interaction if clicked near NPC and player is within interaction range
      if (clickDist < 3.4 && playerDist <= (npc.interactRadius || 2.8) + 2.0) {
        // DQ 式对话：按游戏进度实时解析台词（未收录的 NPC 退回静态台词）
        const def = getTownNpcDefinition(npc.id) ?? getFrontierNpcDefinition(npc.id);
        // 人生模拟：里程碑/熟客台词优先插播（他们记得你）
        const lifeLine = def ? npcLifeSim.recordChat(npc.id, '冒险者') : null;
        if (lifeLine) {
          this.addFloatingText(npc.x, npc.y + 0.8, lifeLine, '#fcd34d', 15);
        }
        const dialog = def
          ? pickDialogueLine(def, { bossesDefeated: this.bossDefeatedCount, isVictory: this.isVictory })
          : npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
        this.addFloatingText(npc.x, npc.y + 0.5, dialog, '#fff', 14);

        // Quest interaction trigger
        emitNpcTalked(npc.id, this.player, this.addFloatingText.bind(this));

        if (npc.type === 'scholar' || npc.type === 'survivor') {
          if (!npc.isFollowing && !npc.rescued) {
            npc.isFollowing = true;
            this.addFloatingText(npc.x, npc.y, '学者埃尔文加入跟随！护送到传送门！', '#38bdf8', 16);
            soundManager.playLevelUp();
          }
        }

        // 城市功能服务
        if (def) {
          this.executeCityService(def, npc.type);
        }
        return true;
      }
    }
    // 野外冒险者：救援 / 接受入队
    const adventurerHit = adventurerManager.interactAt(x, y, this.player, {
      text: (ax, ay, text, color) => this.addFloatingText(ax, ay, text, color ?? '#e2e8f0', 14),
      heal: () => soundManager.playPotion(),
    });
    return adventurerHit;
  }

  /** 执行城市 NPC 服务（收费/回复/打开工坊/转职） */
  private executeCityService(
    def: import('./city/NpcDefinition').CityNpcDefinition,
    npcType: string
  ): void {
    const p = this.player;
    const cost = serviceCostOf(def);

    switch (def.service as CityService) {
      case 'heal_blessing':
        if (p.stats.hp < p.stats.maxHp || p.stats.mana < p.stats.maxMana) {
          p.stats.hp = p.stats.maxHp;
          p.stats.mana = p.stats.maxMana;
          this.addFloatingText(p.x, p.y, '圣光治愈!', '#10b981', 18);
          this.createExplosionParticles(p.x, p.y, '#10b981', 20);
          soundManager.playPotion();
          npcLifeSim.recordService(def.id, 'healed', '用圣光治愈过一位冒险者');
        }
        break;

      case 'inn_rest':
        if (p.stats.emeralds < cost) {
          this.addFloatingText(p.x, p.y - 1, `房费 ${cost} 绿宝石，赊账免谈！`, '#f87171', 15);
          break;
        }
        p.stats.emeralds -= cost;
        p.stats.hp = p.stats.maxHp;
        p.stats.mana = p.stats.maxMana;
        p.stats.potions = Math.min(5, p.stats.potions + 1);
        this.addFloatingText(p.x, p.y - 1, `🛏️ 睡了个好觉！（-${cost} 绿宝石）`, '#38bdf8', 17);
        this.createExplosionParticles(p.x, p.y, '#38bdf8', 24);
        soundManager.playPotion();
        npcLifeSim.recordService(def.id, 'paid', `收留冒险者住店，赚了${cost}绿宝石`);
        break;

      case 'open_camp_blacksmith':
      case 'open_camp_enchanter':
      case 'open_camp_alchemist':
        soundManager.playLevelUp();
        this.onOpenCampHub?.();
        break;

      case 'open_shop':
        soundManager.playEmeraldPickup();
        this.onOpenShop?.();
        break;

      case 'class_transfer':
        soundManager.playLevelUp();
        this.addFloatingText(p.x, p.y - 0.7, '✨ 开启职业圣堂与天赋转职！', '#a855f7', 16);
        this.onOpenClassMaster?.();
        break;

      default:
        break;
    }
    void npcType;
  }

  public equipItem(item: Item) {
    const p = this.player;
    const slot = item.slot;

    // ===== 双手武器规则 =====
    if (slot === 'offhand' && isTwoHandedWeapon(p.equipment.weapon?.subType)) {
      // 当前主手是双手武器：禁止再装副手
      this.addFloatingText(p.x, p.y - 0.8, '⚠️ 双手武器占用双手，无法装备副手！', '#f87171', 15);
      soundManager.playShieldBlock();
      return;
    }

    const current = p.equipment[slot];

    // 装备双手武器时自动卸下副手（回背包，属性同步移除）
    if (slot === 'weapon' && isTwoHandedWeapon(item.subType) && p.equipment.offhand) {
      const off = p.equipment.offhand;
      if (off.defenseBonus) p.stats.defense -= off.defenseBonus;
      if (off.hpBonus) p.stats.maxHp -= off.hpBonus;
      if (off.speedBonus) p.stats.speed -= off.speedBonus;
      if (off.critChanceBonus) p.stats.critChance -= off.critChanceBonus;
      if (off.lifeStealBonus) p.stats.lifeSteal -= off.lifeStealBonus;
      if (off.spellPowerBonus) p.spellPower = Math.max(0, (p.spellPower || 0) - off.spellPowerBonus);
      if (off.attackBonus) p.stats.attack -= off.attackBonus;
      p.stats.maxHp = Math.max(1, p.stats.maxHp);
      p.stats.hp = Math.min(p.stats.hp, p.stats.maxHp);
      p.inventory.push(off);
      p.equipment.offhand = null;
      this.addFloatingText(p.x, p.y - 0.8, `🗡️ 双手武器入主：${off.name} 已卸下`, '#fbbf24', 14);
    }

    // Unequip current stats
    if (current) {
      if (current.attackBonus) p.stats.attack -= current.attackBonus;
      if (current.defenseBonus) p.stats.defense -= current.defenseBonus;
      if (current.hpBonus) p.stats.maxHp -= current.hpBonus;
      if (current.speedBonus) p.stats.speed -= current.speedBonus;
      if (current.critChanceBonus) p.stats.critChance -= current.critChanceBonus;
      if (current.lifeStealBonus) p.stats.lifeSteal -= current.lifeStealBonus;
      if (current.spellPowerBonus) p.spellPower = Math.max(0, (p.spellPower || 0) - current.spellPowerBonus);
      if (current.arcanePenetrationBonus) p.arcanePenetration = Math.max(0, (p.arcanePenetration || 0) - current.arcanePenetrationBonus);
      if (current.minionHpBonus) p.minionHpBonus = Math.max(0, (p.minionHpBonus || 0) - current.minionHpBonus);
      if (current.summonDamageBonus) p.summonDamageBonus = Math.max(0, (p.summonDamageBonus || 0) - current.summonDamageBonus);
      if (current.natureDamageBonus) p.natureDamageBonus = Math.max(0, (p.natureDamageBonus || 0) - current.natureDamageBonus);
      p.inventory.push(current);
    }

    // Equip new item stats
    p.equipment[slot] = item;
    if (item.attackBonus) p.stats.attack += item.attackBonus;
    if (item.defenseBonus) p.stats.defense += item.defenseBonus;
    if (item.hpBonus) {
      p.stats.maxHp += item.hpBonus;
      p.stats.hp = Math.min(p.stats.hp + item.hpBonus, p.stats.maxHp);
    }
    if (item.speedBonus) p.stats.speed += item.speedBonus;
    if (item.critChanceBonus) p.stats.critChance += item.critChanceBonus;
    if (item.lifeStealBonus) p.stats.lifeSteal += item.lifeStealBonus;
    if (item.spellPowerBonus) p.spellPower = (p.spellPower || 0) + item.spellPowerBonus;
    if (item.arcanePenetrationBonus) p.arcanePenetration = (p.arcanePenetration || 0) + item.arcanePenetrationBonus;
    if (item.minionHpBonus) p.minionHpBonus = (p.minionHpBonus || 0) + item.minionHpBonus;
    if (item.summonDamageBonus) p.summonDamageBonus = (p.summonDamageBonus || 0) + item.summonDamageBonus;
    if (item.natureDamageBonus) p.natureDamageBonus = (p.natureDamageBonus || 0) + item.natureDamageBonus;

    // Remove from inventory
    const idx = p.inventory.indexOf(item);
    if (idx !== -1) p.inventory.splice(idx, 1);

    // Recalculate set bonuses & trigger floating text if active
    setBonusSystem.applySetStatBonuses(p);

    // 装备反馈浮字
    this.addFloatingText(p.x, p.y - 0.9, `✔ 已装备 ${item.name}`, '#7dd3fc', 14);
    const activeSets = setBonusSystem.calculateActiveSets(p.equipment);
    const itemSetId = item.setId || setBonusSystem.resolveItemSetId(item);
    const matchedSet = activeSets.find(s => s.setDef.id === itemSetId);
    if (matchedSet && matchedSet.activeBonuses.length > 0) {
      this.addFloatingText(p.x, p.y, `✨ 套装激活: ${matchedSet.setDef.name} (${matchedSet.equippedCount}件)`, '#c084fc', 16, true);
    }

    soundManager.playLootDrop(item.rarity);
  }

  public unequipItem(slot: keyof Player['equipment']) {
    const p = this.player;
    const item = p.equipment[slot];
    if (!item) return;

    if (item.attackBonus) p.stats.attack -= item.attackBonus;
    if (item.defenseBonus) p.stats.defense -= item.defenseBonus;
    if (item.hpBonus) {
      p.stats.maxHp -= item.hpBonus;
      p.stats.hp = Math.min(p.stats.hp, p.stats.maxHp);
    }
    if (item.speedBonus) p.stats.speed -= item.speedBonus;
    if (item.critChanceBonus) p.stats.critChance -= item.critChanceBonus;
    if (item.lifeStealBonus) p.stats.lifeSteal -= item.lifeStealBonus;
    if (item.spellPowerBonus) p.spellPower = Math.max(0, (p.spellPower || 0) - item.spellPowerBonus);
    if (item.arcanePenetrationBonus) p.arcanePenetration = Math.max(0, (p.arcanePenetration || 0) - item.arcanePenetrationBonus);
    if (item.minionHpBonus) p.minionHpBonus = Math.max(0, (p.minionHpBonus || 0) - item.minionHpBonus);
    if (item.summonDamageBonus) p.summonDamageBonus = Math.max(0, (p.summonDamageBonus || 0) - item.summonDamageBonus);
    if (item.natureDamageBonus) p.natureDamageBonus = Math.max(0, (p.natureDamageBonus || 0) - item.natureDamageBonus);

    p.inventory.push(item);
    p.equipment[slot] = null;

    // Reapply set bonuses after unequipping
    setBonusSystem.applySetStatBonuses(p);
  }

  public createExplosionParticles(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        z: 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 1 + Math.random() * 3,
        color,
        size: 4 + Math.random() * 3,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.8,
        gravity: 6,
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, size: number = 14, isCrit: boolean = false) {
    this.floatingTexts.push({
      id: `txt_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      size,
      life: 0.9,
      vy: -0.8,
      isCrit,
    });
  }
}
