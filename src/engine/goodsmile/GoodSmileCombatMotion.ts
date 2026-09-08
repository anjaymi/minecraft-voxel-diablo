import { Player } from '../../types';
import { MeleeSlashPose } from '../combat/MeleeKinematicsEngine';
import { GoodSmileFullPalette } from './GoodSmileColorUtils';
import { PlayerWeaponManager } from '../weapons/PlayerWeaponManager';

/**
 * GoodSmile Figurine Combat Motion Articulator.
 * Implements lunging stances, torso twists, and weapon-gripping arm kinematics during melee slashes.
 */
export class GoodSmileCombatMotion {
  /**
   * Draw dynamic attack torso with forward lunge, crouch, and rotation
   */
  public static drawCombatTorso(
    ctx: CanvasRenderingContext2D,
    pose: MeleeSlashPose,
    palette: GoodSmileFullPalette,
    bodyBob: number
  ): void {
    const { torso } = pose;

    ctx.save();
    // Translate with forward lunge and center-of-gravity drop
    ctx.translate(torso.offsetX, -bodyBob + torso.offsetY);
    ctx.rotate(torso.rotation);
    ctx.scale(torso.squashX, torso.squashY);

    // Torso Base (Rotund Clay Armor)
    ctx.fillStyle = palette.armorColor;
    ctx.beginPath();
    ctx.roundRect(-8.5, -23.0, 17.0, 15.0, [5, 5, 7, 7]);
    ctx.fill();

    // Chestplate Specular Ceramic Highlight
    ctx.fillStyle = palette.specularColor;
    ctx.beginPath();
    ctx.ellipse(0, -18.5, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metallic Gold/Silver Trim Waistband
    ctx.fillStyle = palette.trimColor;
    ctx.beginPath();
    ctx.roundRect(-8.5, -11.0, 17.0, 2.8, [0, 0, 4, 4]);
    ctx.fill();

    // Peach Figurine Neck & Collar
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.arc(0, -23.0, 3.2, 0, Math.PI);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw wide braced lunge stance legs during melee slash (Thigh -> Shin -> Foot)
   */
  public static drawCombatLegs(
    ctx: CanvasRenderingContext2D,
    pose: MeleeSlashPose,
    palette: GoodSmileFullPalette,
    bodyBob: number
  ): void {
    const { legs, torso } = pose;

    // --- Back Leg (Drives forward propulsion: Thigh -> Shin -> Foot) ---
    ctx.save();
    ctx.translate(-6.0 + torso.offsetX * 0.4, -9.5 - bodyBob + torso.offsetY * 0.5);
    ctx.rotate(legs.leftLegRot);

    // 1. Thigh (Hip to Knee)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-2.6, 0, 5.2, 5.8, [2.5, 2.5, 1.5, 1.5]);
    ctx.fill();

    // 2. Knee & Shin Greave (Knee to Ankle)
    ctx.save();
    ctx.translate(0, 5.4);
    const backKneeBend = Math.max(-0.25, -legs.leftLegRot * 0.4);
    ctx.rotate(backKneeBend);

    // Knee cap armor plate
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Shin cylinder
    ctx.fillStyle = '#172554';
    ctx.beginPath();
    ctx.roundRect(-2.4, 0, 4.8, 5.2, 1.5);
    ctx.fill();

    // 3. Foot / Boot (Ankle to Toe Sole)
    ctx.translate(0, 4.8);
    ctx.fillStyle = palette.bootColor;
    ctx.beginPath();
    ctx.roundRect(-3.4, 0, 6.8, 5.4, [2.0, 2.0, 3.2, 3.2]);
    ctx.fill();
    ctx.fillStyle = palette.bootTrim;
    ctx.fillRect(-3.4, 4.2, 6.8, 1.2);

    // Articulated toe sole gripping ground
    ctx.fillStyle = palette.bootColor;
    ctx.beginPath();
    ctx.roundRect(-2.5, 3.2, 6.0, 2.5, 1.2);
    ctx.fill();

    ctx.restore();
    ctx.restore();

    // --- Front Leg (Deep bend landing stance: Thigh -> Shin -> Foot) ---
    ctx.save();
    ctx.translate(6.0 + torso.offsetX, -9.5 - bodyBob + torso.offsetY);
    ctx.rotate(legs.rightLegRot);

    // 1. Front Thigh (Hip to Knee)
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-2.7, 0, 5.4, 5.8, [2.5, 2.5, 1.5, 1.5]);
    ctx.fill();

    // 2. Front Knee & Shin Greave
    ctx.save();
    ctx.translate(0, 5.4);
    const frontKneeBend = Math.max(0, legs.rightLegRot * 0.5);
    ctx.rotate(frontKneeBend);

    // Front Knee Armor Plate
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Front Shin Greave
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5.0, 5.2, 1.5);
    ctx.fill();

    // 3. Front Foot / Boot & Toe Sole
    ctx.translate(0, 4.8);
    ctx.fillStyle = palette.bootColor;
    ctx.beginPath();
    ctx.roundRect(-3.5, 0, 7.0, 5.4, [2.0, 2.0, 3.2, 3.2]);
    ctx.fill();
    ctx.fillStyle = palette.bootTrim;
    ctx.fillRect(-3.5, 4.2, 7.0, 1.2);

    // Gloss highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0.4, 2.4, 1.4, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }

  /**
   * Draw Right Arm driving the sword swing with dynamic elbow & wrist kinematics
   */
  public static drawCombatMainArm(
    ctx: CanvasRenderingContext2D,
    player: Player,
    pose: MeleeSlashPose,
    armorColor: string,
    bodyBob: number,
    time: number
  ): void {
    const { armRight, torso } = pose;

    ctx.save();
    // Shoulder follows torso lunge
    const shoulderX = 10.5 + torso.offsetX;
    const shoulderY = -19.5 - bodyBob + torso.offsetY;

    ctx.translate(shoulderX, shoulderY);
    ctx.rotate(armRight.shoulderAngle);

    // Upper arm
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-2.4, 0, 4.8, 10.0, 2.4);
    ctx.fill();

    // Forearm extension
    ctx.translate(0, 9.0);
    ctx.rotate(armRight.elbowAngle);

    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-2.2, 0, 4.4, 7.5, 2.2);
    ctx.fill();

    // Hand Wrist & Palm Socket
    ctx.save();
    ctx.translate(0, 7.5);
    ctx.rotate(armRight.wristAngle);

    // 1. Hand palm base (underneath hilt)
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Main weapon mounted into hand socket
    PlayerWeaponManager.drawMainWeapon(ctx, player, time, true);

    // 3. Fingers tightly wrapped over sword hilt (front layer)
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.arc(0.4, 0, 2.3, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.fill();

    // 4. Thumb wrapping around handle
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-1.1, -0.4, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }

  /**
   * Draw Offhand Arm (Supports two-handed grip on heavy weapons or flares for balance)
   */
  public static drawCombatOffhandArm(
    ctx: CanvasRenderingContext2D,
    pose: MeleeSlashPose,
    armorColor: string,
    bodyBob: number
  ): void {
    const { armLeft, torso, isTwoHanded } = pose;

    ctx.save();
    if (isTwoHanded) {
      // Two-handed grip: Left hand reaches across torso to wrap sword handle
      const shoulderX = -7.5 + torso.offsetX;
      const shoulderY = -19.0 - bodyBob + torso.offsetY;
      ctx.translate(shoulderX, shoulderY);
      ctx.rotate(armLeft.angle);

      // 1. Upper arm
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.roundRect(-2.2, 0, 4.4, 6.0, 2.2);
      ctx.fill();

      // 2. Forearm
      ctx.translate(0, 5.5);
      ctx.rotate(0.25);
      ctx.beginPath();
      ctx.roundRect(-2.0, 0, 4.0, 5.5, 2.0);
      ctx.fill();

      // 3. Palm & knuckle grip
      ctx.fillStyle = '#fde2d7';
      ctx.beginPath();
      ctx.arc(0, 5.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // One-handed balance flair
      const shoulderX = -10.5 + torso.offsetX * 0.4;
      const shoulderY = -19.5 - bodyBob + torso.offsetY * 0.5;
      ctx.translate(shoulderX, shoulderY);
      ctx.rotate(armLeft.angle);

      // 1. Upper arm
      ctx.fillStyle = armorColor;
      ctx.beginPath();
      ctx.roundRect(-2.2, 0, 4.4, 5.5, 2.2);
      ctx.fill();

      // 2. Forearm
      ctx.translate(0, 5.0);
      ctx.rotate(-0.15);
      ctx.beginPath();
      ctx.roundRect(-2.0, 0, 4.0, 4.8, 2.0);
      ctx.fill();

      // 3. Palm flair
      ctx.fillStyle = '#fde2d7';
      ctx.beginPath();
      ctx.arc(0, 4.8, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
