import { Player } from '../../types';
import { GoodSmileFaceRenderer } from './GoodSmileFaceRenderer';
import { GoodSmileHairRenderer } from './GoodSmileHairRenderer';
import { GoodSmileBodyRenderer } from './GoodSmileBodyRenderer';
import { GoodSmileCombatMotion } from './GoodSmileCombatMotion';
import { MeleeKinematicsEngine } from '../combat/MeleeKinematicsEngine';
import { PlayerWeaponManager } from '../weapons/PlayerWeaponManager';

export class GoodSmilePlayerRenderer {
  /**
   * Main entry point to render the player as a high-fidelity GoodSmile / Nendoroid figurine
   */
  public static renderFigurine(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    isFacingLeft: boolean
  ) {
    ctx.save();

    // 1. Motion Physics & Combat Kinematics
    const slashPose = MeleeKinematicsEngine.evaluateSlashPose(player, time);
    const isMoving = (Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05) && !slashPose.isActive;
    const walkCycle = isMoving ? Math.sin(time * 12) : 0;
    const idleBob = Math.sin(time * 3.5) * 1.2;
    const bodyBob = isMoving ? Math.abs(walkCycle) * 3.0 : idleBob;
    const waddleTilt = isMoving ? Math.sin(time * 12) * 0.06 : 0;

    if (waddleTilt !== 0) {
      ctx.rotate(waddleTilt);
    }

    // Squash & stretch jelly physics during movement
    if (isMoving) {
      const stretch = 1.0 + Math.sin(time * 24) * 0.04;
      ctx.scale(1 / stretch, stretch);
    }

    const palette = GoodSmileBodyRenderer.getPalette(player);

    // 4. Draw Chibi Limbs & Rotund Body
    if (slashPose.isActive) {
      GoodSmileCombatMotion.drawCombatLegs(ctx, slashPose, palette, bodyBob);
      GoodSmileCombatMotion.drawCombatTorso(ctx, slashPose, palette, bodyBob);
    } else {
      GoodSmileBodyRenderer.drawBody(ctx, player, time, bodyBob, walkCycle, isMoving);
    }

    // 5. Offhand Equipment / Empty Arm
    const offhand = player.equipment.offhand;
    if (slashPose.isActive) {
      if (offhand && !slashPose.isTwoHanded) {
        ctx.save();
        ctx.translate(slashPose.armLeft.offsetX, -bodyBob + slashPose.armLeft.offsetY);
        PlayerWeaponManager.drawOffhandGear(ctx, offhand, player, time);
        ctx.restore();
      } else {
        GoodSmileCombatMotion.drawCombatOffhandArm(ctx, slashPose, palette.armorColor, bodyBob);
      }
    } else {
      if (offhand) {
        ctx.save();
        ctx.translate(0, -bodyBob);
        PlayerWeaponManager.drawOffhandGear(ctx, offhand, player, time);
        ctx.restore();
      } else {
        GoodSmileBodyRenderer.drawEmptyOffhandArm(ctx, player, bodyBob, walkCycle);
      }
    }

    // 6. GoodSmile Head Assembly
    ctx.save();
    if (slashPose.isActive) {
      // Focus glance leaning forward into slash
      ctx.translate(slashPose.head.offsetX, -29 - bodyBob + slashPose.head.offsetY);
      ctx.rotate(slashPose.head.rotation);
      ctx.translate(0, 29 + bodyBob);
    } else {
      // Idle curious head tilt
      const headTilt = !isMoving ? Math.sin(time * 1.8) * 0.035 : 0;
      ctx.translate(0, -29 - bodyBob);
      ctx.rotate(headTilt);
      ctx.translate(0, 29 + bodyBob);
    }

    // Head Base: Porcelain Peach Baby-Cheek Anime Face Shape
    this.drawAnimeHeadBase(ctx, bodyBob);

    // Sculpted Layered Hair & Accessories
    GoodSmileHairRenderer.drawHairAndAccessories(ctx, player, time, bodyBob, isMoving);

    // Expressive GoodSmile Anime Face
    GoodSmileFaceRenderer.drawFace(ctx, player, time, bodyBob);

    ctx.restore(); // Restore head tilt

    // 7. Right Arm & Mainhand Weapon (rigidly integrated with hand socket)
    if (slashPose.isActive) {
      GoodSmileCombatMotion.drawCombatMainArm(ctx, player, slashPose, palette.armorColor, bodyBob, time);
    } else {
      GoodSmileBodyRenderer.drawMainhandArm(ctx, player, bodyBob, walkCycle, time);
    }

    // 8. Gameplay Special Auras
    this.drawGameplayAuras(ctx, player, time);

    ctx.restore(); // Restore 1.35x figurine scale
  }

  /**
   * Draw genuine anime bishoujo head contour (Chubby baby cheeks with soft rounded chin)
   */
  private static drawAnimeHeadBase(ctx: CanvasRenderingContext2D, bodyBob: number) {
    ctx.fillStyle = '#fde2d7'; // Tender porcelain peach anime clay tone
    ctx.beginPath();
    // Start at top left forehead
    ctx.moveTo(-13.0, -38.0 - bodyBob);
    // Left chubby cheek arching down to cute round chin
    ctx.bezierCurveTo(-14.5, -28.0 - bodyBob, -9.5, -19.0 - bodyBob, 0, -18.2 - bodyBob);
    // Round chin arching up to right chubby cheek
    ctx.bezierCurveTo(9.5, -19.0 - bodyBob, 14.5, -28.0 - bodyBob, 13.0, -38.0 - bodyBob);
    // Rounded crown arch
    ctx.bezierCurveTo(12.0, -45.0 - bodyBob, -12.0, -45.0 - bodyBob, -13.0, -38.0 - bodyBob);
    ctx.closePath();
    ctx.fill();

    // Subtle soft subsurface scattering warmth around jaw
    const jawGrad = ctx.createRadialGradient(0, -20.0 - bodyBob, 2, 0, -20.0 - bodyBob, 12);
    jawGrad.addColorStop(0, 'rgba(251, 146, 60, 0.15)');
    jawGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = jawGrad;
    ctx.fill();
  }

  /**
   * Draw GoodSmile clear acrylic hex figurine display stand underneath feet
   */
  private static drawAcrylicBase(ctx: CanvasRenderingContext2D, time: number) {
    ctx.save();
    // Clear glossy acrylic pedestal disc
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.ellipse(0, 3.5, 14.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Acrylic edge shine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 3.5, 13.5, 0.8 * Math.PI, 1.4 * Math.PI);
    ctx.stroke();

    // Clear acrylic support peg behind back
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(-1.0, -14, 2.0, 16);
    ctx.restore();
  }

  private static drawGameplayAuras(ctx: CanvasRenderingContext2D, player: Player, time: number) {
    // Golden Apple Divine Aegis Aura
    if (player.goldenAppleTimer && player.goldenAppleTimer > 0) {
      ctx.save();
      const pulse = Math.sin(time * 6) * 2;
      const r = 26 + pulse;
      const aegisGrad = ctx.createRadialGradient(0, -20, r * 0.4, 0, -20, r);
      aegisGrad.addColorStop(0, 'rgba(254, 240, 138, 0.05)');
      aegisGrad.addColorStop(0.7, 'rgba(245, 158, 11, 0.25)');
      aegisGrad.addColorStop(1, 'rgba(251, 191, 36, 0.85)');

      ctx.fillStyle = aegisGrad;
      ctx.beginPath();
      ctx.arc(0, -20, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Orbiting golden runes
      for (let i = 0; i < 3; i++) {
        const runeAngle = time * 3 + (i / 3) * Math.PI * 2;
        const rx = Math.cos(runeAngle) * (r + 2);
        const ry = -20 + Math.sin(runeAngle) * (r * 0.6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(rx - 2, ry - 2, 4, 4);
      }
      ctx.restore();
    }

    // Whirlwind Spin Blade Echoes
    if (player.whirlwindTimer && player.whirlwindTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -18, 30, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
