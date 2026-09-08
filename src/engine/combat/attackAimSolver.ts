import { Player } from '../../types';
import { ClassAttackContext } from '../strategies/ClassAttackStrategy';

/**
 * 武器攻击发射瞄准与等距投影弹道数学解算器
 * 确保箭矢、法球、飞刀与武器挥动严格朝向玩家鼠标世界坐标，
 * 消除等距 2:1 坐标系带来的 45° 视角旋转倾斜偏差。
 */
export class AttackAimSolver {
  /**
   * 解算实时攻击发射朝向弧度 (World Facing Angle)
   * 优先使用当前鼠标世界坐标，若无输入则回退至玩家自身朝向
   */
  public static resolveAimAngle(ctx: ClassAttackContext): number {
    const { player: p, mouseWorldX, mouseWorldY } = ctx;

    if (mouseWorldX !== undefined && mouseWorldY !== undefined) {
      const dx = mouseWorldX - p.x;
      const dy = mouseWorldY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.05) {
        const angle = Math.atan2(dy, dx);
        p.facingAngle = angle; // 实时同步玩家实体朝向
        return angle;
      }
    }

    return p.facingAngle;
  }

  /**
   * 将等距世界物理速度 (vx, vy, vz) 投影转换为屏幕像素速度与视觉旋转角
   * 等距 2:1 投影: screenX = (worldX - worldY) * 16, screenY = (worldX + worldY) * 8 - worldZ * 16
   */
  public static getScreenProjectileAngle(
    worldVx: number,
    worldVy: number,
    worldVz: number = 0
  ): number {
    const screenVx = (worldVx - worldVy) * 16;
    const screenVy = (worldVx + worldVy) * 8 - worldVz * 16;
    return Math.atan2(screenVy, screenVx);
  }

  /**
   * 计算弓箭/手弩在角色身上的抬手俯仰瞄准角 (Pitch Offset)
   * 根据鼠标在屏幕空间相对于玩家的垂直高度，动态仰角或俯角瞄准
   */
  public static getAimPitchAngle(
    player: Player,
    mouseWorldX?: number,
    mouseWorldY?: number
  ): number {
    const isAttacking = Boolean(player.isAttacking || (player.attackTimer && player.attackTimer > 0));
    const isBowAiming = Boolean(player.isBowAiming);

    if (!isBowAiming && !isAttacking) {
      return 0;
    }

    let screenDx = 0;
    let screenDy = 0;

    if (mouseWorldX !== undefined && mouseWorldY !== undefined) {
      screenDx = (mouseWorldX - player.x) - (mouseWorldY - player.y);
      screenDy = ((mouseWorldX - player.x) + (mouseWorldY - player.y)) / 2;
    } else {
      const angle = player.facingAngle;
      screenDx = Math.cos(angle) - Math.sin(angle);
      screenDy = (Math.cos(angle) + Math.sin(angle)) / 2;
    }

    const horizontalDist = Math.abs(screenDx) + 0.001;
    const pitch = Math.atan2(screenDy, horizontalDist);

    // 限制俯仰角在 ±30° (-0.52 ~ +0.52 rad) 之内，保持人体工学自然
    return Math.max(-0.52, Math.min(0.52, pitch));
  }
}
