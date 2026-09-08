import { Player } from '../../types';
import {
  CharacterFacingMode,
  BaseArtFacing,
  OrientationSettings,
  OrientationResult,
} from './CharacterOrientationTypes';
import { customSkinManager } from '../skin/CustomSkinManager';

/**
 * 角色素体朝向与动态镜像管理中枢 (CharacterOrientationManager)
 * 统一管理 2.5D 等距视角下的角色朝向计算、攻击朝向锁定、转向防抖死区与画布翻转。
 */
export class CharacterOrientationManager {
  private static lastFacingMap = new WeakMap<Player, boolean>();
  private static readonly DEFAULT_DEADZONE = 0.055;

  public static readonly UNIFIED_CHIBI_SCALE: number = 0.40;
  public static readonly UNIFIED_FEET_GROUND_OFFSET_Y: number = 0;

  /**
   * 求解角色当前的朝向决策
   */
  public static resolveOrientation(
    player: Player,
    mouseWorldX?: number,
    mouseWorldY?: number,
    settingsOverride?: OrientationSettings
  ): OrientationResult {
    const activeSettings = this.extractSettings(player, settingsOverride);
    const facingMode = activeSettings.facingMode || 'aim';
    const defaultArtFacing = activeSettings.defaultArtFacing || 'right';
    const invertFacing = !!activeSettings.invertFacing;
    const deadzone = activeSettings.deadzone ?? this.DEFAULT_DEADZONE;

    const prevFacingLeft = this.lastFacingMap.get(player) ?? (player.isFacingLeft ?? false);
    let isFacingLeft = prevFacingLeft;
    let screenDx = 0;
    let source: OrientationResult['source'] = 'fallback';

    // 2. 根据朝向模式与当前动作状态进行物理与输入判定
    const isAttacking = this.isCombatAttacking(player);

    if (facingMode === 'fixed_left') {
      isFacingLeft = true;
      source = 'fixed';
    } else if (facingMode === 'fixed_right') {
      isFacingLeft = false;
      source = 'fixed';
    } else if (isAttacking) {
      // 关键优化：正在攻击/出招过程中，角色朝向强制锁定在攻击角度 (player.facingAngle) 上！
      // 避免玩家松开鼠标蓄力或躲避移开指针时，角色身体与斩击方向发生相反撕裂
      const combatFacing = this.evaluateFacingAngle(player.facingAngle, deadzone, prevFacingLeft);
      isFacingLeft = combatFacing.isFacingLeft;
      screenDx = combatFacing.screenDx;
      source = 'combat_lock';
    } else {
      switch (facingMode) {
        case 'movement':
          if (this.isPlayerMoving(player)) {
            screenDx = this.calcScreenDx(player.vx, player.vy);
            if (Math.abs(screenDx) > deadzone) {
              isFacingLeft = screenDx < 0;
              source = 'movement';
            }
          }
          break;

        case 'auto':
          // 智能模式：蓄力/瞄准时随鼠标，跑动时随移动矢量，静止时随指针
          if (player.isChargingAttack || player.isBowAiming) {
            const aimRes = this.evaluateAimFacing(player, mouseWorldX, mouseWorldY, deadzone, prevFacingLeft);
            isFacingLeft = aimRes.isFacingLeft;
            screenDx = aimRes.screenDx;
            source = aimRes.source;
          } else if (this.isPlayerMoving(player)) {
            screenDx = this.calcScreenDx(player.vx, player.vy);
            if (Math.abs(screenDx) > deadzone) {
              isFacingLeft = screenDx < 0;
              source = 'movement';
            }
          } else {
            const aimRes = this.evaluateAimFacing(player, mouseWorldX, mouseWorldY, deadzone, prevFacingLeft);
            isFacingLeft = aimRes.isFacingLeft;
            screenDx = aimRes.screenDx;
            source = aimRes.source;
          }
          break;

        case 'aim':
        default: {
          const aimRes = this.evaluateAimFacing(player, mouseWorldX, mouseWorldY, deadzone, prevFacingLeft);
          isFacingLeft = aimRes.isFacingLeft;
          screenDx = aimRes.screenDx;
          source = aimRes.source;
          break;
        }
      }
    }

    // 3. 更新缓存与实体状态
    this.lastFacingMap.set(player, isFacingLeft);
    player.isFacingLeft = isFacingLeft;

    // 4. 计算最终视觉缩放 (结合素材基准朝向与镜像反转)
    const visualScaleX = this.computeVisualScaleX(isFacingLeft, defaultArtFacing, invertFacing);

    return {
      isFacingLeft,
      visualScaleX,
      screenDx,
      facingAngle: player.facingAngle,
      source,
    };
  }

  /**
   * 应用素体朝向翻转与统一 40% 缩放系数至 Canvas 变换矩阵
   * 修复缩小 40% 时引起的位移偏移 bug，确保素体脚底接触面牢牢锚定在地面等距坐标中心
   */
  public static applyOrientation(
    ctx: CanvasRenderingContext2D,
    orientation: OrientationResult,
    customScale?: number,
    customOffsetY?: number
  ): void {
    const scale = customScale ?? this.UNIFIED_CHIBI_SCALE;
    const offsetY = customOffsetY ?? this.UNIFIED_FEET_GROUND_OFFSET_Y;
    if (offsetY !== 0) {
      ctx.translate(0, offsetY);
    }
    ctx.scale(orientation.visualScaleX * scale, scale);
  }

  /**
   * 结合素材基准方向与镜像配置计算最终 ScaleX
   */
  public static computeVisualScaleX(
    isFacingLeft: boolean,
    defaultArtFacing: BaseArtFacing,
    invertFacing: boolean
  ): number {
    // 若原素材朝右，则向左需要镜像；若原素材朝左，则向右需要镜像
    const baseFlipped = defaultArtFacing === 'left' ? !isFacingLeft : isFacingLeft;
    // 叠加上用户手动镜像反转设置
    const finalFlipped = invertFacing ? !baseFlipped : baseFlipped;
    return finalFlipped ? -1 : 1;
  }

  /**
   * 快速反转角色的素体朝向设置并持久化保存
   */
  public static toggleInvertFacing(player?: Player): boolean {
    const currentConfig = customSkinManager.getSpinePuppet();
    const newInvert = !currentConfig.invertFacing;
    customSkinManager.updateSpineOverall({ invertFacing: newInvert });
    if (player) {
      if (player.spinePuppet) {
        player.spinePuppet.invertFacing = newInvert;
      }
      if (player.customSkin) {
        player.customSkin.invertFacing = newInvert;
      }
    }
    return newInvert;
  }

  /**
   * 设置角色的素体原素材基准朝向并持久化保存
   */
  public static setDefaultArtFacing(facing: BaseArtFacing, player?: Player): void {
    customSkinManager.updateSpineOverall({ defaultArtFacing: facing });
    if (player) {
      if (player.spinePuppet) {
        player.spinePuppet.defaultArtFacing = facing;
      }
      if (player.customSkin) {
        player.customSkin.defaultArtFacing = facing;
      }
    }
  }

  /**
   * 判定等距视角下基于鼠标瞄准的朝向
   */
  private static evaluateAimFacing(
    player: Player,
    mouseWorldX: number | undefined,
    mouseWorldY: number | undefined,
    deadzone: number,
    prevFacingLeft: boolean
  ): { isFacingLeft: boolean; screenDx: number; source: OrientationResult['source'] } {
    if (mouseWorldX !== undefined && mouseWorldY !== undefined) {
      // 2:1 等距投影屏幕 X 偏移为 (worldX - player.x) - (worldY - player.y)
      const screenDx = (mouseWorldX - player.x) - (mouseWorldY - player.y);
      if (Math.abs(screenDx) > deadzone) {
        return {
          isFacingLeft: screenDx < 0,
          screenDx,
          source: 'aim',
        };
      }
      return {
        isFacingLeft: prevFacingLeft,
        screenDx,
        source: 'aim',
      };
    }

    return this.evaluateFacingAngle(player.facingAngle, deadzone, prevFacingLeft);
  }

  /**
   * 基于世界朝向弧度 (facingAngle) 投影为屏幕等距方向
   */
  public static evaluateFacingAngle(
    facingAngle: number,
    deadzone: number = 0.055,
    prevFacingLeft: boolean = false
  ): { isFacingLeft: boolean; screenDx: number; source: OrientationResult['source'] } {
    // 2:1 等距投影: 屏幕水平投影分量 = cos(angle) - sin(angle)
    const screenCos = Math.cos(facingAngle) - Math.sin(facingAngle);
    if (Math.abs(screenCos) > deadzone) {
      return {
        isFacingLeft: screenCos < 0,
        screenDx: screenCos,
        source: 'fallback',
      };
    }

    return {
      isFacingLeft: prevFacingLeft,
      screenDx: screenCos,
      source: 'fallback',
    };
  }

  /**
   * 计算等距世界速度在屏幕空间的水平位移
   */
  public static calcScreenDx(vx: number, vy: number): number {
    return vx - vy;
  }

  private static isPlayerMoving(player: Player): boolean {
    return Math.hypot(player.vx || 0, player.vy || 0) > 0.08;
  }

  /**
   * 判定玩家当前是否处于攻击打出/连招/法术锁硬直中
   */
  private static isCombatAttacking(player: Player): boolean {
    return Boolean(
      player.isAttacking ||
      (player.attackTimer !== undefined && player.attackTimer > 0) ||
      (player.comboTimer !== undefined && player.comboTimer > 0) ||
      (player.castLockTimer !== undefined && player.castLockTimer > 0)
    );
  }

  /**
   * 从角色或配置中提取素体朝向设置
   */
  private static extractSettings(
    player: Player,
    override?: OrientationSettings
  ): OrientationSettings {
    if (override && (override.facingMode || override.defaultArtFacing || override.invertFacing !== undefined)) {
      return override;
    }

    const spinePuppet = player.spinePuppet || customSkinManager.getSpinePuppet();
    if (spinePuppet) {
      return {
        facingMode: spinePuppet.facingMode,
        defaultArtFacing: spinePuppet.defaultArtFacing,
        invertFacing: spinePuppet.invertFacing,
        deadzone: spinePuppet.facingDeadzone,
      };
    }

    const customSkin = player.customSkin || customSkinManager.getSkin();
    if (customSkin) {
      return {
        facingMode: customSkin.facingMode,
        defaultArtFacing: customSkin.defaultArtFacing,
        invertFacing: customSkin.invertFacing,
      };
    }

    return {};
  }
}
