import { SpinePuppetConfig, SpineSlotKey } from './spineTypes';
import { SpineKinematics } from './SpineKinematics';
import { Player } from '../../types';

export interface HandBoneCalibrationResult {
  slotKey: SpineSlotKey;
  slotName: string;
  boneX: number;
  boneY: number;
  boneRotationDeg: number;
  updatedConfig: Partial<SpinePuppetConfig>;
}

/**
 * 计算机甲/2头身骨骼素体手部骨骼的实时空间坐标，
 * 将武器的挂点 (X/Y 偏移、旋转角度、镜像) 精准重置校准至手骨中心点。
 */
export class WeaponBoneCalibrator {
  /**
   * 获取当前手部骨骼的实时计算坐标
   */
  public static getHandBoneCoordinates(
    config: SpinePuppetConfig,
    player?: Player | null
  ): {
    slotKey: SpineSlotKey;
    slotName: string;
    boneX: number;
    boneY: number;
    boneRotationDeg: number;
  } {
    const isLeftHand = config.weaponHand === 'left';
    const slotKey: SpineSlotKey = isLeftHand ? 'armLeft' : 'armRight';
    const slotName = isLeftHand ? '左手掌骨 (Left Hand)' : '右手掌骨 (Right Hand)';

    // 获取标准待机姿势下的实时骨骼解算结果
    const pose = SpineKinematics.computeActionPose('idle', 0, false, player);

    let boneX = 0;
    let boneY = 0;
    let boneRotRad = 0;

    if (pose.fine) {
      const limb = isLeftHand ? pose.fine.armLeft : pose.fine.armRight;
      const handBone = limb.palm || limb.end;
      boneX = handBone.x;
      boneY = handBone.y;
      boneRotRad = handBone.rotation;
    } else {
      const arm = isLeftHand ? pose.armLeft : pose.armRight;
      boneX = arm.x;
      boneY = arm.y + 14;
      boneRotRad = arm.rotation;
    }

    const boneRotationDeg = Math.round((boneRotRad * 180) / Math.PI);

    return {
      slotKey,
      slotName,
      boneX: Math.round(boneX * 10) / 10,
      boneY: Math.round(boneY * 10) / 10,
      boneRotationDeg,
    };
  }

  /**
   * 执行自动校准：重置 X/Y 偏移至该骨骼中心 (0, 0)，
   * 消除头部错位 (-38px) 与意外镜像反转，恢复标准武器挂持层级。
   */
  public static calibrateToHandBone(
    config: SpinePuppetConfig,
    player?: Player | null
  ): HandBoneCalibrationResult {
    const coords = this.getHandBoneCoordinates(config, player);
    const isLeftHand = config.weaponHand === 'left';
    const baseArmZ = isLeftHand ? 10 : 60;

    const updatedConfig: Partial<SpinePuppetConfig> = {
      weaponOffsetX: 0,
      weaponOffsetY: 0,
      weaponRotationDeg: 0,
      weaponScale: 1.0,
      weaponFlipX: false,
      weaponFlipY: false,
      weaponLayerPreset: 'over_hand',
      weaponZIndex: baseArmZ + 5,
      showWeaponOverlay: true,
    };

    return {
      slotKey: coords.slotKey,
      slotName: coords.slotName,
      boneX: coords.boneX,
      boneY: coords.boneY,
      boneRotationDeg: coords.boneRotationDeg,
      updatedConfig,
    };
  }
}
