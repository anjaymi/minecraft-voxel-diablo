import { SpineSlotKey } from '../spineTypes';

export type ChibiProportionType = '2.0_head' | '2.5_head';

export interface ChibiPartSpec {
  slot: SpineSlotKey;
  name: string;
  folderName: string;
  left: number;
  top: number;
  width: number;
  height: number;
  boneX: number;
  boneY: number;
  recommendedPivotX: number;
  recommendedPivotY: number;
  color: string;
  label: string;
}

export interface ChibiGuideDef {
  location: number;
  direction: 'horizontal' | 'vertical';
  label: string;
}

export interface ChibiStandardProfile {
  id: ChibiProportionType;
  title: string;
  subtitle: string;
  isGameNative?: boolean;
  gameProportionRatio?: string;
  headRatio: number; // e.g. 0.54 or 0.40
  bodyRatio: number; // e.g. 0.46 or 0.60
  canvasSize: number; // 512 standard
  characterHeight: number;
  parts: Record<SpineSlotKey, ChibiPartSpec>;
  guides: ChibiGuideDef[];
  boneDeltasFromTorso: Record<SpineSlotKey, { dx: number; dy: number }>;
}

/**
 * 2.0-Head Game-Native Standard Profile (Chibi Clay Nendoroid / 游戏原生超萌黏土手办)
 * Head (54%) : Torso (23%) : Stubby Legs (23%)
 * Aligned with in-game GoodSmile player proportions and combat swing sockets.
 */
export const CHIBI_2_0_PROFILE: ChibiStandardProfile = {
  id: '2.0_head',
  title: '2.0 头身 游戏原生粘土手办标准 (Game-Native Nendoroid)',
  subtitle: '完美契合游戏实装角色：1.15:1 萌系大头圆脸，圆润微凸肚腩与短萌球形小靴，战斗动作无穿模',
  isGameNative: true,
  gameProportionRatio: '头 52% : 躯干 24% : 短肢 24%',
  headRatio: 0.52,
  bodyRatio: 0.48,
  canvasSize: 512,
  characterHeight: 316,
  parts: {
    head: {
      slot: 'head',
      name: 'head_sprite',
      folderName: 'head',
      left: 160,
      top: 86,
      width: 192,
      height: 164,
      boneX: 256,
      boneY: 248,
      recommendedPivotX: 0.50,
      recommendedPivotY: 0.90,
      color: '#fde047',
      label: '头部 / 圆萌肉感包子脸 (Head)',
    },
    torso: {
      slot: 'torso',
      name: 'torso_sprite',
      folderName: 'torso',
      left: 210,
      top: 244,
      width: 92,
      height: 76,
      boneX: 256,
      boneY: 280,
      recommendedPivotX: 0.50,
      recommendedPivotY: 0.50,
      color: '#60a5fa',
      label: '躯干 / 短小圆润肚腩 (Torso)',
    },
    armRight: {
      slot: 'armRight',
      name: 'armRight_sprite',
      folderName: 'armRight',
      left: 292,
      top: 248,
      width: 38,
      height: 56,
      boneX: 304,
      boneY: 256,
      recommendedPivotX: 0.32,
      recommendedPivotY: 0.14,
      color: '#f87171',
      label: '右臂 / 主手圆萌肉拳 (Arm Right)',
    },
    armLeft: {
      slot: 'armLeft',
      name: 'armLeft_sprite',
      folderName: 'armLeft',
      left: 182,
      top: 248,
      width: 38,
      height: 56,
      boneX: 208,
      boneY: 256,
      recommendedPivotX: 0.68,
      recommendedPivotY: 0.14,
      color: '#c084fc',
      label: '左臂 / 副手圆萌肉拳 (Arm Left)',
    },
    legRight: {
      slot: 'legRight',
      name: 'legRight_sprite',
      folderName: 'legRight',
      left: 258,
      top: 316,
      width: 40,
      height: 68,
      boneX: 278,
      boneY: 322,
      recommendedPivotX: 0.50,
      recommendedPivotY: 0.10,
      color: '#34d399',
      label: '右腿 / 前侧圆萌短靴 (Leg Right)',
    },
    legLeft: {
      slot: 'legLeft',
      name: 'legLeft_sprite',
      folderName: 'legLeft',
      left: 214,
      top: 316,
      width: 40,
      height: 68,
      boneX: 234,
      boneY: 322,
      recommendedPivotX: 0.50,
      recommendedPivotY: 0.10,
      color: '#2dd4bf',
      label: '左腿 / 后侧圆萌短靴 (Leg Left)',
    },
  },
  guides: [
    { location: 256, direction: 'vertical', label: '角色垂直对称中轴线' },
    { location: 86, direction: 'horizontal', label: '头顶发冠基准线' },
    { location: 168, direction: 'horizontal', label: '萌系大眼瞳中位线' },
    { location: 248, direction: 'horizontal', label: '下颌颈部连接线' },
    { location: 256, direction: 'horizontal', label: '肩部肉拳关节轴线' },
    { location: 320, direction: 'horizontal', label: '肚腹与短腿骨盆轴线' },
    { location: 384, direction: 'horizontal', label: '短靴稳健着地线' },
  ],
  boneDeltasFromTorso: {
    torso: { dx: 0, dy: 0 },
    head: { dx: 0, dy: -32 },
    armLeft: { dx: -48, dy: -24 },
    armRight: { dx: 48, dy: -24 },
    legLeft: { dx: -22, dy: 42 },
    legRight: { dx: 22, dy: 42 },
  },
};

/**
 * 2.5-Head Standard Profile (GoodSmile Anime Action Figurine / 手办微Q版)
 * Head : Body = 1 : 1.5 (Head 40%, Torso 30%, Legs 30%)
 */
export const CHIBI_2_5_PROFILE: ChibiStandardProfile = {
  id: '2.5_head',
  title: '2.5 头身 手办级微Q版标准 (GoodSmile Figurine)',
  subtitle: '1:1.5 头身黄金比例，兼具精致二次元面相与修长生动的动作挥砍张力',
  headRatio: 0.40,
  bodyRatio: 0.60,
  canvasSize: 512,
  characterHeight: 360,
  parts: {
    head: {
      slot: 'head',
      name: 'head_sprite',
      folderName: 'head',
      left: 176,
      top: 60,
      width: 160,
      height: 148,
      boneX: 256,
      boneY: 204,
      recommendedPivotX: 0.50,
      recommendedPivotY: 0.86,
      color: '#fbbf24',
      label: '头部 / 精致二次元脸 (Head)',
    },
    torso: {
      slot: 'torso',
      name: 'torso_sprite',
      folderName: 'torso',
      left: 204,
      top: 200,
      width: 104,
      height: 110,
      boneX: 256,
      boneY: 252,
      recommendedPivotX: 0.50,
      recommendedPivotY: 0.47,
      color: '#3b82f6',
      label: '躯干 / 战铠束腰 (Torso)',
    },
    armRight: {
      slot: 'armRight',
      name: 'armRight_sprite',
      folderName: 'armRight',
      left: 298,
      top: 208,
      width: 52,
      height: 98,
      boneX: 316,
      boneY: 224,
      recommendedPivotX: 0.35,
      recommendedPivotY: 0.16,
      color: '#ef4444',
      label: '右臂 / 握剑主手 (Arm Right)',
    },
    armLeft: {
      slot: 'armLeft',
      name: 'armLeft_sprite',
      folderName: 'armLeft',
      left: 162,
      top: 208,
      width: 52,
      height: 98,
      boneX: 196,
      boneY: 224,
      recommendedPivotX: 0.65,
      recommendedPivotY: 0.16,
      color: '#a855f7',
      label: '左臂 / 施法副手 (Arm Left)',
    },
    legRight: {
      slot: 'legRight',
      name: 'legRight_sprite',
      folderName: 'legRight',
      left: 258,
      top: 300,
      width: 46,
      height: 118,
      boneX: 280,
      boneY: 308,
      recommendedPivotX: 0.48,
      recommendedPivotY: 0.08,
      color: '#10b981',
      label: '右腿 / 战靴主腿 (Leg Right)',
    },
    legLeft: {
      slot: 'legLeft',
      name: 'legLeft_sprite',
      folderName: 'legLeft',
      left: 208,
      top: 300,
      width: 46,
      height: 118,
      boneX: 232,
      boneY: 308,
      recommendedPivotX: 0.52,
      recommendedPivotY: 0.08,
      color: '#14b8a6',
      label: '左腿 / 支撑副腿 (Leg Left)',
    },
  },
  guides: [
    { location: 256, direction: 'vertical', label: '角色垂直对称中轴线' },
    { location: 60, direction: 'horizontal', label: '头顶发冠基准线' },
    { location: 140, direction: 'horizontal', label: '双眼视线水平面' },
    { location: 204, direction: 'horizontal', label: '下巴与颈部骨骼点' },
    { location: 224, direction: 'horizontal', label: '双肩铰接水平线' },
    { location: 268, direction: 'horizontal', label: '腰带金扣中线' },
    { location: 308, direction: 'horizontal', label: '大腿根部与骨盆水平线' },
    { location: 360, direction: 'horizontal', label: '膝关节高度' },
    { location: 418, direction: 'horizontal', label: '战靴接地踏平面' },
  ],
  boneDeltasFromTorso: {
    torso: { dx: 0, dy: 0 },
    head: { dx: 0, dy: -48 },
    armLeft: { dx: -60, dy: -28 },
    armRight: { dx: 60, dy: -28 },
    legLeft: { dx: -24, dy: 56 },
    legRight: { dx: 24, dy: 56 },
  },
};

export const CHIBI_PROFILES: Record<ChibiProportionType, ChibiStandardProfile> = {
  '2.0_head': CHIBI_2_0_PROFILE,
  '2.5_head': CHIBI_2_5_PROFILE,
};
