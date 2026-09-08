/**
 * Core types for the Minecraft Voxel Diablo Roguelike Game
 */

export type ItemRarity = 'common' | 'magic' | 'rare' | 'legendary';

export type EquipmentSlot = 'weapon' | 'offhand' | 'armor' | 'helmet' | 'boots' | 'ring';

export type WeaponSubType = 'sword' | 'axe' | 'dagger' | 'bow' | 'staff' | 'wand' | 'hammer' | 'crossbow' | 'greatsword';

export interface Item {
  id: string;
  name: string;
  rarity: ItemRarity;
  slot: EquipmentSlot;
  subType?: WeaponSubType | 'shield' | 'tome' | 'totem' | 'armor' | 'helmet' | 'boots' | 'ring';
  level: number;
  icon: string; // e.g. 'diamond_sword', 'iron_chestplate', etc.
  description: string;
  setId?: string;
  setName?: string;
  attackBonus?: number;
  defenseBonus?: number;
  speedBonus?: number;
  critChanceBonus?: number;
  hpBonus?: number;
  lifeStealBonus?: number;
  affixes: string[];
  uniqueEffect?: string;
  value: number; // Emerald price
  // Weapon-specific enhanced attributes
  refineLevel?: number; // 0 to 5 refinement
  weaponPerk?: string; // e.g. '碎颅震荡: 终结击额外击退并眩晕'
  attackSpeedRating?: 'S' | 'A' | 'B' | 'C';
  weaponRange?: number; // reach in meters
  weaponSweepArc?: number; // sweep angle in radians
  knockbackForce?: number;
  elementalType?: 'physical' | 'fire' | 'cold' | 'lightning' | 'shadow' | 'poison';
  recommendedClass?: CharacterClassId;
  glowColor?: string;
  glowIntensity?: number; // 0.1 - 1.0
  vfxType?: string; // e.g. '弧形剑风', '星辉引导飞弹', '旋风贯穿箭', '暗影毒刃'
  appearanceDesc?: string;
  // Magic class exclusive attributes
  spellPowerBonus?: number;
  arcanePenetrationBonus?: number;
  minionHpBonus?: number;
  summonDamageBonus?: number;
  natureDamageBonus?: number;
}

export interface SetBonusTier {
  pieces: number;
  name: string;
  description: string;
  stats?: Partial<PlayerStats>;
  customEffect?: string;
}

export interface SetDefinition {
  id: string;
  name: string;
  themeColor: string;
  icon: string;
  description: string;
  totalPieces: number;
  piecesSlots: EquipmentSlot[];
  bonuses: SetBonusTier[];
}

export interface ActiveSetInfo {
  setDef: SetDefinition;
  equippedCount: number;
  activeBonuses: SetBonusTier[];
  inactiveBonuses: SetBonusTier[];
}

export interface EnchantmentChoice {
  id: string;
  name: string;
  enName: string;
  description: string;
  icon: string;
  tier: number;
  effect: (player: Player) => void;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  critChance: number;
  speed: number;
  lifeSteal: number;
  exp: number;
  maxExp: number;
  level: number;
  emeralds: number;
  potions: number;
  tntCount: number;
  enderPearls: number;
}

export interface EquippedGear {
  weapon: Item | null;
  offhand: Item | null;
  armor: Item | null;
  helmet: Item | null;
  boots: Item | null;
  ring: Item | null;
}

export type CharacterClassId = 'warrior' | 'ranger' | 'mage' | 'rogue' | 'summoner' | 'druid';

export type SkillType = 'active' | 'passive' | 'aura' | 'dash';
export type SkillElement = 'physical' | 'fire' | 'cold' | 'lightning' | 'holy' | 'shadow' | 'poison';

export interface Skill {
  id: string;
  name: string;
  description: string;
  type: SkillType;
  element: SkillElement;
  cooldown: number; // in milliseconds
  manaCost: number;
  icon: string; // lucide icon name
  reqLevel: number;
  maxLevel: number;
  baseDamage?: number;
  damageScaling?: number; // % of weapon damage or stat
  range?: number;
  radius?: number;
}

export interface SkillNode {
  skillId: string;
  x: number;
  y: number;
  reqNodes: string[]; // skillIds required to unlock
}

export interface SkillTree {
  classId: CharacterClassId;
  nodes: SkillNode[];
}

export type NPCType =
  | 'merchant' | 'blacksmith' | 'healer' | 'quest_giver' | 'guide'
  | 'survivor' | 'scholar' | 'class_master'
  // 城市住民（DQ 式功能 NPC）
  | 'innkeeper' | 'enchanter' | 'alchemist' | 'bard' | 'lord' | 'guard' | 'child';

export interface SummonedMinion {
  id: string;
  name: string;
  type: 'wolf' | 'skeleton' | 'treant';
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  attack: number;
  speed: number;
  duration: number; // in seconds
  attackCooldown: number;
  maxAttackCooldown?: number;
  attackRange?: number;
  targetId?: string | null;
  icon: string;
  color: string;
  isEnraged?: boolean;
}

export interface NPC {
  id: string;
  name: string;
  type: NPCType;
  x: number;
  y: number;
  z: number;
  dialogue: string[];
  icon: string;
  color: string;
  interactRadius: number;
  inventory?: Item[]; // For merchants
  isFollowing?: boolean;
  rescued?: boolean;
  /** 城市闲逛锚点（初始岗位），配合 wanderRadius 使用 */
  homeX?: number;
  homeY?: number;
  wanderRadius?: number;
  /** 人生模拟：当前活动（渲染器据此画 💤/🎵 等状态图标） */
  activity?: 'work' | 'perform' | 'leisure' | 'sleep' | 'patrol' | 'play' | 'idle' | 'commute';
}

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  title: string;
  description: string;
  icon: string;
  themeColor: string;
  baseStats: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    attack: number;
    defense: number;
    critChance: number;
    speed: number;
    lifeSteal: number;
  };
  passiveName: string;
  passiveDesc: string;
  startingGearSummary: string;
  primaryAttackDesc?: string;
  secondaryAttackDesc?: string;
}

export interface Player {
  characterClass: CharacterClassId;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  targetX: number | null;
  targetY: number | null;
  facingAngle: number;
  isFacingLeft?: boolean;
  stats: PlayerStats;
  equipment: EquippedGear;
  inventory: Item[];
  isAttacking: boolean;
  attackCooldown: number;
  attackTimer: number;
  comboStep: number; // 0: Slash 1, 1: Slash 2 upward, 2: Jump slam 360
  currentSlashStep?: number;
  comboTimer: number;
  isBowAiming: boolean;
  bowDrawProgress: number;
  hurtTimer: number;
  dashCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  dashTrail: Array<{ x: number; y: number; z: number; angle: number; alpha: number; armorColor: string }>;
  invulnerableTimer: number;
  enchantments: { id: string; name: string; count: number }[];
  skillPoints: number;
  unlockedSkills: Record<string, number>; // skillId -> level (0 means locked)
  activeSkills: Record<string, string | null>; // hotkey (e.g., '1', '2', 'Q', 'E', 'RightClick') -> skillId
  skillCooldowns: Record<string, number>; // skillId -> timer
  
  // Keep specific states for hardcoded actions for now to avoid breaking existing logic, but we'll migrate them
  aimingMode: 'bow' | 'tnt' | 'pearl' | 'none' | 'skill';
  activeAimSkill?: string; // which skill is currently being aimed
  goldenAppleTimer: number; // Active golden protective aegis
  whirlwindTimer: number; // Active 360 whirlwind spin attack
  shieldBlockTimer: number; // Active shield guard / parry
  lastRangedTime?: number; // Timestamp of latest ranged attack (for mob AI tactical awareness)
  skillComboState?: {
    lastSkillId: string;
    chainTimer: number; // remaining window in seconds
    comboName: string;
    damageMultiplier: number;
  };
  isStealthed?: boolean;
  stealthTimer?: number;
  poisonCoatingTimer?: number;
  /** 法力药剂购买次数（炼金：价格递增用，会话内累计，通关/读档清零可接受） */
  manaElixirCount?: number;
  minions?: SummonedMinion[];
  spellPower?: number;
  summonDamageBonus?: number;
  arcanePenetration?: number;
  minionHpBonus?: number;
  natureDamageBonus?: number;
  wildShapeForm?: 'bear' | 'none';
  wildShapeTimer?: number;
  wildShapeAttackBonus?: number;
  hitboxRadius?: number;
  isCastingSpell?: boolean;
  castLockTimer?: number;
  castTotalTime?: number;
  castSpellName?: string;
  castSpellColor?: string;
  // Charged Attack System
  isChargingAttack?: boolean;
  chargeTime?: number;
  maxChargeTime?: number;
  chargeLevel?: number; // 0: none, 1: charging, 2: max charged
  chargeReleasePending?: boolean;
  customSkin?: CustomSkinConfig | null;
  spinePuppet?: import('./engine/skin/spineTypes').SpinePuppetConfig | null;
  /** 外观扩展：自定义发色（冒险者随机分配；缺省为经典栗色） */
  hairColor?: string;
}

export interface CustomSkinConfig {
  enabled: boolean;
  dataUrl: string; // Base64 or image URL
  name?: string;
  scale: number; // 0.5 to 2.5, default 1.0
  offsetY: number; // -40 to 40 px, default 0
  bounceAnimation: boolean; // whether to apply idle/running bounce
  showWeaponOverlay: boolean; // whether to draw held weapon over the custom sprite
  facingMode?: import('./engine/orientation/CharacterOrientationTypes').CharacterFacingMode;
  defaultArtFacing?: import('./engine/orientation/CharacterOrientationTypes').BaseArtFacing;
  invertFacing?: boolean;
}

export type EnemyType = 
  | 'zombie' 
  | 'skeleton' 
  | 'creeper' 
  | 'spider' 
  | 'enderman' 
  | 'wither_boss'
  | 'piglin_brute'
  | 'blaze'
  | 'necromancer'
  | 'slime'
  | 'witch'
  | 'drowned'
  | 'armored_zombie'
  | 'baby_zombie'
  | 'goblin'
  | 'chimera';

export interface Enemy {
  id: string;
  type: EnemyType;
  /** 图鉴定义 id（monsterCatalog，普通怪为空） */
  defId?: string;
  name: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz?: number;
  facingAngle?: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  defense: number;
  attackCooldown: number;
  attackTimer: number;
  range: number;
  isElite: boolean;
  affixes: string[];
  color: string;
  size: number;
  state: 'idle' | 'wander' | 'chase' | 'ranged_alert' | 'windup' | 'attack' | 'charge' | 'retreat' | 'exploding' | 'hit' | 'enraged' | 'pounce' | 'blocking' | 'rolling' | 'reviving' | 'evasive_dash' | 'seeking_cover' | 'in_cover';
  chargeTimer: number; // for Creeper explosion or Boss charge or attack windup
  windupTimer?: number;
  windupMax?: number;
  hitTimer: number;
  // Specialized mob combat fields
  isBlocking?: boolean;
  blockCooldown?: number;
  rollTimer?: number;
  weaponSwingAngle?: number;
  comboAttackStep?: number;
  daggerCooldown?: number;
  stolenCoins?: number;
  leapProgress?: number;
  // Tactical Adaptation & Death Behavior fields
  isReviving?: boolean;
  hasRevived?: boolean;
  reviveTimer?: number;
  evasiveDashCooldown?: number;
  isEvasiveDashing?: boolean;
  evasiveDashTimer?: number;
  evasiveDashAngle?: number;
  coverCooldown?: number;
  coverTargetX?: number;
  coverTargetY?: number;
  coverPeekTimer?: number;
  inCoverTimer?: number;
  // Behavior Tree Tactical fields
  wanderTimer?: number;
  wanderTargetX?: number;
  wanderTargetY?: number;
  strafeDir?: number;
  strafeTimer?: number;
  specialSkillTimer?: number;
  // Specific monster fields
  slimeScaleY?: number;
  blazeRodAngle?: number;
  summonCount?: number;
  isMinion?: boolean;
  // Boss multi-phase fields
  isBoss?: boolean;
  bossPhase?: number;
  isEnraged?: boolean;
  bossSkillTimer?: number;
  // Animation Frame Management
  animState?: 'idle' | 'walk' | 'windup' | 'attack' | 'hit' | 'death' | 'knockback';
  animTimer?: number;
  limbSwing?: number;
  attackAnimProgress?: number;
  deathTimer?: number;
  isDying?: boolean;
  stunTimer?: number; // Incapacitated hit-stun / stagger duration in seconds
  knockbackTimer?: number; // Active knockback slide duration
  knockbackDuration?: number; // Initial duration for animation easing
  knockbackVx?: number; // Directional slide momentum
  knockbackVy?: number;
  // Squad / Team Awareness Tactics
  squadRole?: 'frontline' | 'flanker' | 'sniper' | 'ambusher' | 'commander';
  encircleAngle?: number;
  tacticalMode?: 'encircle' | 'focus_fire' | 'covering_fire' | 'pincer_rush' | 'ambush' | 'chase';
  teamAwarenessTimer?: number;
  packAggroBoost?: number;
  // Distinct Mob Movement Mechanisms
  hopTimer?: number;
  isHopping?: boolean;
  pounceTimer?: number;
  isPouncing?: boolean;
  creeperSwell?: number;
  stalkTimer?: number;
  teleportCooldown?: number;
  phaseDodgeTimer?: number;
  strafeAngle?: number;
  blazeHoverPhase?: number;
  // Elite Affix States
  eliteTitle?: string;
  shieldReflectActive?: boolean;
  shieldReflectTimer?: number;
  toxicAuraTimer?: number;
  summonMinionTimer?: number;
  hasSummonedMinions?: boolean;
  moltenTrailTimer?: number;
  // Elemental Status Effects
  burnTimer?: number;
  burnDps?: number;
  chillTimer?: number;
  chillSlow?: number;
  shockTimer?: number;
  poisonTimer?: number;
  /** 中毒持续伤害（数值平衡：随命中伤害比例设定） */
  poisonDps?: number;
}

export type ElementType = 'physical' | 'fire' | 'frost' | 'lightning';

export interface Projectile {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  isPlayer: boolean;
  type: 'arrow' | 'tnt' | 'sonic_boom' | 'ender_pearl' | 'fireball' | 'potion_splash' | 'trident' | 'fang' | 'mage_bolt';
  timer: number;
  radius: number;
  color?: string;
  effect?: 'poison' | 'slow' | 'none';
  homing?: boolean;
  homingTurnRate?: number;
  targetEnemyId?: string;
  trailColor?: string;
  pierceCount?: number;
}

export interface DropItem {
  id: string;
  item?: Item;
  isEmerald?: boolean;
  isExp?: boolean;
  amount: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  bounces: number;
  maxBounces: number;
  isGrounded: boolean;
  rotation: number;
  rotationSpeed: number;
  impactWaveTimer: number;
  spawnTime: number;
  magnetized?: boolean;
  rarity: ItemRarity;
  name: string;
  color: string;
  // Pickup spring & parabolic animation
  scale?: number;
  pickupProgress?: number;
  isBeingCollected?: boolean;
  collectTargetX?: number;
  collectTargetY?: number;
  collectTargetZ?: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  vy: number;
  isCrit?: boolean;
}

export type ParticleType = 
  | 'spark' 
  | 'voxel' 
  | 'smoke' 
  | 'flame' 
  | 'fire'
  | 'heart' 
  | 'star' 
  | 'void' 
  | 'ring' 
  | 'totem'
  | 'rune'
  | 'magic'
  | 'splinter'
  | 'leaf'
  | 'shard';

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  gravity?: number;
  type?: ParticleType;
  rotation?: number;
  rotationSpeed?: number;
  stretch?: number;
  alpha?: number;
  voxelTopColor?: string;
  voxelSideColor?: string;
  bounces?: number;
}

export interface VFXSlash {
  id: string;
  x: number;
  y: number;
  z: number;
  angle: number;
  life: number;
  maxLife: number;
  radius: number;
  arcSpan: number;
  colorCore: string;
  colorOuter: string;
  width: number;
  comboStep: number;
  weaponSubType: string;
  hasFire?: boolean;
  hasSweeping?: boolean;
}

export interface VFXShockwave {
  id: string;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  hasCracks?: boolean;
}

export type WeatherType = 'clear' | 'rain' | 'thunderstorm' | 'fog' | 'ash_storm';

export type ZoneType =
  | 'town'
  | 'overworld'
  | 'dungeon'
  | 'nether'
  | 'end'
  // 六大生态探索区（随机地图轮换）
  | 'frost'
  | 'volcano'
  | 'mushroom'
  | 'desert'
  | 'swamp'
  | 'cursed'
  | 'keep';   // 前哨城塞（边境安全城市）

export type TileType =
  | 'void'
  | 'floor'
  | 'wall'
  | 'door'
  | 'chest'
  | 'opened_chest'
  | 'exit_portal'
  | 'lava'
  | 'spawner'
  | 'shrine'
  | 'water'
  | 'bridge'
  | 'fountain'
  | 'road'
  | 'grass'
  | 'town_wall'
  | 'town_gate'
  | 'building'
  | 'lantern'
  | 'dungeon_gate'
  | 'barrel'
  | 'bush'
  | 'urn'
  | 'pillar'
  | 'bone_pile'
  | 'vines'
  // 环境增强地形（随机散布层）
  | 'tree'         // 高大树木（树冠遮挡）
  | 'tower'        // 瞭望塔/法师塔（高层结构）
  | 'well'         // 水井
  | 'puddle'       // 水洼（浅水，可通行，反射）
  | 'tall_grass'   // 高草丛（可通行）
  | 'flower_patch' // 花丛（可通行）
  | 'mushroom'     // 蘑菇簇（可通行，洞穴发光）
  | 'pebble'       // 碎石堆（可通行）
  // 六大生态区专属瓦片
  | 'snow'         // 雪原地面（可通行）
  | 'ice'          // 冻结湖面（可通行，冰裂高光）
  | 'sand'         // 沙丘地面（可通行）
  | 'scorched'     // 焦土（可通行）
  | 'murkwater'    // 沼泽浊水（可通行，缓慢）
  | 'cactus'       // 仙人掌（障碍）
  | 'giant_mushroom' // 巨型蘑菇（障碍）
  | 'dead_tree'    // 枯树（障碍）
  | 'biome_gate'   // 古老生态传送门（随机通往未知区域）
  | 'keep_gate'    // 边境传送门（通往前哨城塞）
  // 建筑内容物（摊位/家具）
  | 'market_stall'   // 商人摊位（货架摊棚，障碍）
  | 'bed'            // 旅店床铺（障碍）
  | 'table'          // 酒馆桌（障碍）
  | 'counter'        // 柜台（障碍）

export interface DungeonRoom {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'normal' | 'spawn' | 'boss' | 'treasure' | 'shrine' | 'town_square' | 'forge' | 'alchemy' | 'overworld_clearing' | 'ruins';
  cleared: boolean;
}

export interface DungeonFloor {
  floorNumber: number;
  theme: 'caves' | 'nether' | 'end';
  zoneType: ZoneType;
  zoneName: string;
  isIndoor: boolean;
  weather: WeatherType;
  description?: string;
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: DungeonRoom[];
  spawnX: number;
  spawnY: number;
  exitX: number;
  exitY: number;
  portalTownX?: number;
  portalTownY?: number;
  portalOverworldX?: number;
  portalOverworldY?: number;
  portalDungeonX?: number;
  portalDungeonY?: number;
  /** 巨兽巢穴（大地图区域首领刷新点） */
  lairX?: number;
  lairY?: number;
  lairBoss?: string;
}

export interface GameSavePlayer {
  characterClass: CharacterClassId;
  x: number;
  y: number;
  stats: PlayerStats;
  equipment: Record<EquipmentSlot, Item | null>;
  inventory: Item[];
  enchantments: { id: string; name: string; count: number }[];
  skillPoints: number;
  unlockedSkills: Record<string, number>;
  activeSkills: Record<string, string | null>;
  skillCooldowns: Record<string, number>;
  hairColor?: string;
}

export interface GameSaveData {
  version: 1;
  savedAt: string;
  player: GameSavePlayer;
  progress: { totalKills: number; bossDefeatedCount: number; isVictory: boolean };
  floor: {
    zoneType: ZoneType;
    floorNumber: number;
    zoneName: string;
    theme: 'caves' | 'nether' | 'end';
    weather: WeatherType;
    isIndoor: boolean;
    width: number;
    height: number;
    tiles: TileType[][];
    spawnX: number;
    spawnY: number;
    exitX: number;
    exitY: number;
    portalTownX?: number;
    portalTownY?: number;
  };
  quest: FloorQuest | null;
}

export interface GameSettings {
  soundEnabled: boolean;
  controlMode: 'keyboard' | 'mouse'; // 'keyboard' = WASD+mouse, 'mouse' = classic click-to-move
  showDamageNumbers: boolean;
  screenShake: boolean;
}

export type ObjectiveType = 
  | 'kill_monsters'
  | 'kill_elite'
  | 'open_chests'
  | 'activate_shrine'
  | 'escort_npc'
  | 'reach_portal';

export interface QuestObjective {
  id: string;
  title: string;
  desc: string;
  icon: string;
  type: ObjectiveType;
  current: number;
  target: number;
  isCompleted: boolean;
  reward?: {
    xp?: number;
    emeralds?: number;
    text?: string;
  };
}

export interface FloorQuest {
  floorNumber: number;
  zoneType: ZoneType;
  title: string;
  subtitle: string;
  objectives: QuestObjective[];
  allCompleted: boolean;
  rewardClaimed: boolean;
  totalReward?: {
    xp: number;
    emeralds: number;
    itemText?: string;
  };
}
