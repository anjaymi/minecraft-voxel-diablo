export type CharacterFacingMode = 
  | 'aim'         // 随鼠标/攻击瞄准 (默认战斗模式)
  | 'movement'    // 随移动跑动方向 (探索跑图模式)
  | 'auto'        // 智能混合：奔跑时随移动，静止/蓄力/攻击时随瞄准
  | 'fixed_right' // 固定朝右 (用于展台/拍照)
  | 'fixed_left'; // 固定朝左

export type BaseArtFacing = 'right' | 'left';

export interface OrientationSettings {
  facingMode?: CharacterFacingMode;
  defaultArtFacing?: BaseArtFacing;
  invertFacing?: boolean;
  deadzone?: number; // 转向防抖阈值
}

export interface OrientationResult {
  isFacingLeft: boolean;
  visualScaleX: number; // 1 或 -1 (已融合素体素材基准朝向与镜像反转)
  screenDx: number;
  facingAngle: number;
  source: 'aim' | 'movement' | 'fixed' | 'combat_lock' | 'fallback';
}
