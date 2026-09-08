import { CharacterClassId, EquippedGear, Player } from '../../types';
import { classSystem } from '../classSystem';
import { assignPresetSkin } from './PresetSkinRenderer';

/**
 * AdventurerActor — 野外冒险者（复用玩家骨骼框架的"同类"）。
 *
 * 核心：createAdventurerActor 产出一个 Player 形状的伪玩家，
 * 直接喂给 GoodSmilePlayerRenderer.renderFigurine——与玩家完全同一套
 * 骨骼/装备/动画管线，因此他们看起来就是"另一个冒险者"。
 */

export type AdventurerPersonality = 'kind' | 'brave' | 'greedy';

export type AdventurerState =
  | 'roam'      // 漫游（在营地附近巡逻）
  | 'hunt'      // 狩魔（锁定怪物进攻）
  | 'loot'      // 搜刮（战斗结束走向尸体位置）
  | 'rescue'    // 求救（重伤倒地，等待救援）
  | 'join_offer'// 邀请（想加入队伍，等玩家回应）
  | 'follow';   // 已入队（跟随玩家并肩作战）

export interface AdventurerEntity {
  id: string;
  /** 复用玩家骨骼的伪玩家（位置/装备/攻击动画全在这里） */
  actor: Player;
  name: string;
  personality: AdventurerPersonality;
  state: AdventurerState;
  hp: number;
  maxHp: number;
  damage: number;
  /** 不含武器加成的基础攻击（换武器时重算用） */
  baseDamage: number;
  /** 队伍契约剩余时长（秒）：归零后队友告别离队 */
  serviceDuration: number;
  level: number;
  attackCd: number;
  targetEnemyId: string | null;
  /** 漫游/搜刮目标点 */
  wanderTx: number;
  wanderTy: number;
  lootTimer: number;
  /** 求救/邀请发言节流 */
  callTimer: number;
  askedToJoin: boolean;
  /** 朝向粘滞（停止移动时保持最后朝向） */
  facingLeft: boolean;
  kills: number;
}

const CLASS_POOL: CharacterClassId[] = ['warrior', 'ranger', 'mage', 'rogue', 'summoner', 'druid'];

const NAME_PARTS = {
  prefix: ['佣兵', '游侠', '见习者', '猎手', '剑士', '术士', '浪人', '猎人'],
  name: ['雷克', '艾拉', '皮普', '加洛', '缪尔', '布兰', '缇娜', '奥索', '芬恩', '洛卡'],
};

/** 自然发色池：黑 / 金 / 银白 / 红棕 / 亚麻 / 深栗 / 棕金 */
const HAIR_COLORS = ['#2b2118', '#c8973f', '#b8bcc4', '#8a4a2a', '#d9c38a', '#5a3825', '#a86a3a'];

const PERSONALITY_BY_CLASS: Partial<Record<CharacterClassId, AdventurerPersonality>> = {
  warrior: 'brave',
  ranger: 'brave',
  rogue: 'greedy',
  mage: 'kind',
  summoner: 'kind',
  druid: 'kind',
};

/** 伪玩家基座：与 createInitialPlayer 同构的安全默认值 */
function baseActor(x: number, y: number): Player {
  return {
    characterClass: 'warrior',
    x, y, z: 0,
    vx: 0, vy: 0,
    targetX: null, targetY: null,
    facingAngle: 0,
    stats: {
      hp: 100, maxHp: 100, mana: 50, maxMana: 50,
      attack: 12, defense: 4, critChance: 0.1, speed: 3.4, lifeSteal: 0,
      exp: 0, maxExp: 100, level: 1, emeralds: 0, potions: 0, tntCount: 0, enderPearls: 0,
    },
    equipment: { weapon: null, offhand: null, armor: null, helmet: null, boots: null, ring: null } as EquippedGear,
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
    activeSkills: {},
    skillCooldowns: {},
    goldenAppleTimer: 0,
    whirlwindTimer: 0,
    shieldBlockTimer: 0,
    aimingMode: 'none',
  };
}

/** 随机名字（职业前缀搭配） */
export function rollAdventurerName(rng: () => number = Math.random): string {
  const prefix = NAME_PARTS.prefix[Math.floor(rng() * NAME_PARTS.prefix.length)];
  const name = NAME_PARTS.name[Math.floor(rng() * NAME_PARTS.name.length)];
  return `${prefix} ${name}`;
}

/**
 * 生成一位野外冒险者（玩家骨骼框架兼容）。
 * @param tier 区域等级带（1-3），影响血量与攻击
 */
export function createAdventurerEntity(
  id: string,
  x: number,
  y: number,
  tier: number = 1,
  rng: () => number = Math.random
): AdventurerEntity {
  const actor = baseActor(x, y);
  const charClass = CLASS_POOL[Math.floor(rng() * CLASS_POOL.length)];
  actor.characterClass = charClass;
  actor.hairColor = HAIR_COLORS[Math.floor(rng() * HAIR_COLORS.length)];
  actor.equipment = classSystem.generateStartingGear(charClass);
  // 预设像素皮肤（与玩家同一视觉语言，替代废弃的黏土人比例）
  assignPresetSkin(actor, charClass, rng);
  actor.stats.level = tier;
  actor.stats.attack = Math.round((10 + tier * 6) * (0.9 + rng() * 0.3));

  const maxHp = Math.round(60 + tier * 45);
  const personality: AdventurerPersonality =
    PERSONALITY_BY_CLASS[charClass] ?? (rng() < 0.5 ? 'kind' : 'brave');

  // 15% 概率生成时已负伤（野外遇险，等待救援）
  const wounded = rng() < 0.15;
  const hp = wounded ? Math.round(maxHp * (0.2 + rng() * 0.12)) : maxHp;

  return {
    id,
    actor,
    name: rollAdventurerName(rng),
    personality,
    state: wounded ? 'rescue' : 'roam',
    hp,
    maxHp,
    damage: actor.stats.attack,
    baseDamage: actor.stats.attack,
    serviceDuration: 0,
    level: tier,
    attackCd: 0,
    targetEnemyId: null,
    wanderTx: x,
    wanderTy: y,
    lootTimer: 0,
    callTimer: 1 + rng() * 2,
    askedToJoin: false,
    facingLeft: rng() < 0.5,
    kills: 0,
  };
}
