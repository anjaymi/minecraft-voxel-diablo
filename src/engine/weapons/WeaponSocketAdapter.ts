import { WeaponSubType, WeaponSocketPreset, WeaponSocketTransformResult } from './WeaponSocketTypes';
import { Player } from '../../types';
import { MeleeSlashPose } from '../combat/MeleeSlashTypes';
import { attackMotionController } from '../combat/motion/PlayerAttackMotionController';
import { AttackMotionEasing } from '../combat/motion/AttackMotionEasing';
import { DEFAULT_WEAPON_SOCKET_PRESETS } from './WeaponSocketPresets';
import { WeaponBoneOffsetCompensator } from './WeaponBoneOffsetCompensator';

export { DEFAULT_WEAPON_SOCKET_PRESETS };

const STORAGE_KEY = 'mc_rogue_weapon_socket_config_v4';

export class WeaponSocketAdapter {
  private static instance: WeaponSocketAdapter | null = null;
  private presets: Record<WeaponSubType, WeaponSocketPreset>;
  private listeners: Array<() => void> = [];

  private constructor() {
    this.presets = { ...DEFAULT_WEAPON_SOCKET_PRESETS };
    this.loadFromStorage();
  }

  public static getInstance(): WeaponSocketAdapter {
    if (!WeaponSocketAdapter.instance) {
      WeaponSocketAdapter.instance = new WeaponSocketAdapter();
    }
    return WeaponSocketAdapter.instance;
  }

  public getPreset(subType: string): WeaponSocketPreset {
    const key = (subType as WeaponSubType) || 'sword';
    return this.presets[key] || this.presets.sword;
  }

  public getAllPresets(): Record<WeaponSubType, WeaponSocketPreset> {
    return { ...this.presets };
  }

  public updatePreset(subType: WeaponSubType, patch: Partial<WeaponSocketPreset>): void {
    if (!this.presets[subType]) return;
    this.presets[subType] = {
      ...this.presets[subType],
      ...patch,
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  public resetPreset(subType: WeaponSubType): void {
    this.presets[subType] = { ...DEFAULT_WEAPON_SOCKET_PRESETS[subType] };
    this.saveToStorage();
    this.notifyListeners();
  }

  public resetAllToDefaults(): void {
    this.presets = { ...DEFAULT_WEAPON_SOCKET_PRESETS };
    this.saveToStorage();
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.presets = {
          ...DEFAULT_WEAPON_SOCKET_PRESETS,
          ...parsed,
        };
      }
    } catch {
      // Ignore local storage error
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
    } catch {
      // Ignore local storage error
    }
  }

  /**
   * Main evaluation logic resolving anatomical socket coordinate & angle
   */
  public solveSocket(
    player: Player,
    slashPose: MeleeSlashPose,
    isMountedOnBone: boolean = true
  ): WeaponSocketTransformResult {
    const weapon = player.equipment.weapon;
    const subType = ((weapon?.subType as WeaponSubType) || 'sword') as WeaponSubType;
    const preset = this.getPreset(subType);

    if (!slashPose.isActive) {
      // Idle or walking poise: calculate resting wrist-to-palm alignment
      const comp = WeaponBoneOffsetCompensator.calculateWristToWeaponDeviation(
        player,
        slashPose,
        preset.idleAngle,
        0.40,
        preset
      );
      return {
        x: preset.idleOffsetX + comp.compensationX,
        y: preset.idleOffsetY + comp.compensationY,
        angle: preset.idleAngle,
        scale: preset.scale,
        recoil: 0,
        isCombatGrip: false,
      };
    }

    // Active slash combat grip
    const { comboStep, phase } = slashPose;

    if (isMountedOnBone) {
      // 2头身骨骼挂载模式：动力学斩击姿态解算
      // 结合关键帧动力学角度与手持平滑过渡，确保武器在劈砍时完整斩出弧光且牢固锚定在手心
      let combatAngle = preset.idleAngle;

      if (phase < 0.22) {
        // 1. 蓄力引刀 (Windup): 从待机姿势平滑过渡到蓄力后仰角度
        const p = phase / 0.22;
        const easedP = p * p;
        combatAngle = AttackMotionEasing.lerpAngle(preset.idleAngle, slashPose.weapon.angle, easedP);
      } else if (phase < 0.68) {
        // 2. 破空斩击与命中定格 (Slash & Impact): 武器完全顺应下劈/挑斩切线劈出，斩出华丽攻击弧光
        combatAngle = slashPose.weapon.angle;
      } else {
        // 3. 收势回正 (Recovery): 从挥击顺势平滑归位至稳妥待机架势
        const p = (phase - 0.68) / 0.32;
        const easedP = 1 - Math.cos((p * Math.PI) / 2);
        combatAngle = AttackMotionEasing.lerpAngle(slashPose.weapon.angle, preset.idleAngle, easedP);
      }

      const targetAngle = combatAngle + preset.combatAngleOffset;
      const recoil = slashPose.weapon.recoilShake || 0;

      // 基于40%骨骼比例计算手腕到武器中心的矢量偏差补偿，确保武器始终精确锚定在手掌位置
      const comp = WeaponBoneOffsetCompensator.calculateWristToWeaponDeviation(
        player,
        slashPose,
        targetAngle,
        0.40,
        preset
      );

      return {
        x: preset.idleOffsetX + comp.compensationX,
        y: preset.idleOffsetY + comp.compensationY,
        angle: targetAngle,
        scale: preset.scale,
        recoil,
        isCombatGrip: true,
      };
    }

    // 非骨骼普通渲染（旧版静态立绘/平面移动），采用全局武器旋转
    const { angle, recoil } = attackMotionController.solveSocketAngle(phase, comboStep);

    return {
      x: preset.idleOffsetX,
      y: preset.idleOffsetY,
      angle: angle + preset.combatAngleOffset,
      scale: preset.scale,
      recoil,
      isCombatGrip: true,
    };
  }
}

export const weaponSocketAdapter = WeaponSocketAdapter.getInstance();
