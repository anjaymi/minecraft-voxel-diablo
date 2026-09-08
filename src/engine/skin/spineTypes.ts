import { FineSkeletonPose } from './spineFineKinematicsTypes';
import { CharacterFacingMode, BaseArtFacing } from '../orientation/CharacterOrientationTypes';

export type SpineSlotKey = 
  | 'head'
  | 'torso'
  | 'armLeft'
  | 'armRight'
  | 'legLeft'
  | 'legRight';

export interface SpineSlotData {
  id: SpineSlotKey;
  name: string;
  dataUrl: string;
  offsetX: number;    // -30 to 30
  offsetY: number;    // -30 to 30
  scale: number;      // 0.4 to 2.5
  rotationDeg: number;// -180 to 180
  pivotX: number;     // 0.0 to 1.0 (relative to image width)
  pivotY: number;     // 0.0 to 1.0 (relative to image height)
  visible: boolean;
  zIndex: number;
}

export type WeaponLayerPreset = 'front' | 'over_hand' | 'behind_arm' | 'behind_body' | 'custom';

export interface SpinePuppetConfig {
  enabled: boolean;
  mode: 'spine' | 'fullbody';
  name: string;
  overallScale: number;
  offsetY: number;
  bounceAnimation: boolean;
  showWeaponOverlay: boolean;
  weaponOffsetX?: number; // horizontal displacement from arm socket
  weaponOffsetY?: number; // vertical displacement down arm to hand grip
  weaponRotationDeg?: number; // tilt angle (-180 to 180)
  weaponScale?: number; // scale multiplier (0.4 to 2.5)
  weaponHand?: 'right' | 'left'; // 主手(右手)还是副手(左手)挂载 (默认 'right')
  weaponLayerPreset?: WeaponLayerPreset; // 武器层级预设 (身前/手前/臂后/身后/自定义)
  weaponZIndex?: number; // 武器精确渲染层级 (0~100)
  weaponFlipX?: boolean; // 武器水平镜像翻转
  weaponFlipY?: boolean; // 武器垂直翻转
  proportionPreset?: '2.0' | '2.5';
  facingMode?: CharacterFacingMode; // 朝向模式 (aim/movement/auto/fixed_right/fixed_left)
  defaultArtFacing?: BaseArtFacing; // 原画素体基准朝向 (right/left)
  invertFacing?: boolean; // 水平镜像翻转
  facingDeadzone?: number; // 转向防抖阈值
  slots: Record<SpineSlotKey, SpineSlotData>;
  fullbodyDataUrl?: string; // fallback or legacy single image
}

export interface BoneTransform {
  x: number;
  y: number;
  rotation: number; // in radians
  scaleX: number;
  scaleY: number;
}

export interface SkeletonPose {
  torso: BoneTransform;
  head: BoneTransform;
  armLeft: BoneTransform;
  armRight: BoneTransform;
  legLeft: BoneTransform;
  legRight: BoneTransform;
  fine?: FineSkeletonPose;
}

export type SpineActionType = 'idle' | 'run' | 'slash' | 'cast' | 'hit' | 'charge_slam';

export interface SpineActionDef {
  id: SpineActionType;
  label: string;
  icon: string;
  desc: string;
  cycleDuration: number;
}

export const SPINE_ACTION_PRESETS: SpineActionDef[] = [
  { id: 'idle', label: '待机呼吸', icon: '🧘', desc: '呼吸起伏与自然静止重心，便于校准基准对齐', cycleDuration: 2.4 },
  { id: 'run', label: '奔跑动势', icon: '🏃', desc: '大幅步态交替与摆臂，检查关节在大角度下是否脱节', cycleDuration: 0.6 },
  { id: 'slash', label: '近战挥砍', icon: '⚔️', desc: '蓄力拔刀与圆弧斜斩，测试末端关节惯性滞后与反弹', cycleDuration: 0.8 },
  { id: 'cast', label: '奥术施法', icon: '✨', desc: '双手引导咏唱，测试轻武器与指尖高频微颤与法术拖尾', cycleDuration: 1.2 },
  { id: 'charge_slam', label: '大剑蓄力插地', icon: '🗡️', desc: '剑士跃空大剑倒悬插地，双手握持巨刃引发大地冲击波', cycleDuration: 1.1 },
  { id: 'hit', label: '受击震颤', icon: '💥', desc: '受击冲击硬直后仰，校准极限后倾姿势下的颈肩连接', cycleDuration: 0.65 },
];
