import { Player, Item } from '../../types';
import { GoodSmileColorUtils, GoodSmileFullPalette } from './GoodSmileColorUtils';
import { PlayerWeaponManager } from '../weapons/PlayerWeaponManager';

export class GoodSmileBodyRenderer {
  public static getPalette(player: Player): GoodSmileFullPalette {
    return GoodSmileColorUtils.getFullPalette(player.equipment.armor, player.equipment.boots);
  }

  /**
   * Render GoodSmile 2.5-head chibi rotund body, cute ball-joint limbs, and glossy boots
   */
  public static drawBody(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number,
    bodyBob: number,
    walkCycle: number,
    isMoving: boolean
  ) {
    // 1. Resolve Armor & Boot Palettes
    const palette = this.getPalette(player);

    // 2. Chunky Stubby Chibi Legs & Round Boots with natural pendulum swinging
    this.drawLegs(ctx, bodyBob, walkCycle, palette.bootColor, palette.bootTrim);

    // 3. Round Chibi Torso & Belly
    this.drawTorso(ctx, bodyBob, palette.armorColor, palette.trimColor, palette.specularColor);

    // 4. Little Peach Neck peek & Cute Collar
    this.drawNeckAndCollar(ctx, bodyBob);
  }

  /**
   * Draw empty left arm with cute round clay bean mitten hand (Upper arm -> Forearm -> Palm)
   */
  public static drawEmptyOffhandArm(
    ctx: CanvasRenderingContext2D,
    player: Player,
    bodyBob: number,
    walkCycle: number
  ) {
    const { armorColor } = this.getArmorColors(player.equipment.armor);
    // Sine harmonic arm swing with center-of-gravity lag
    const isMoving = Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05;
    const armSwingAngle = -walkCycle * 0.48;
    const swayX = walkCycle * 1.5;

    ctx.save();
    // Shoulder pivot
    ctx.translate(-10.5 + (isMoving ? swayX * 0.4 : 0), -19.5 - bodyBob);
    ctx.rotate(armSwingAngle);

    // 1. Upper Arm
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-2.3, 0, 4.6, 5.4, 2.3);
    ctx.fill();

    // 2. Forearm (follows swing with subtle flex)
    ctx.translate(0, 4.8);
    ctx.rotate(-armSwingAngle * 0.2);
    ctx.beginPath();
    ctx.roundRect(-2.1, 0, 4.2, 5.0, 2.1);
    ctx.fill();

    // 3. Round Figurine Mitten Hand (Peach clay sphere with thumb)
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.arc(0, 5.0, 3.0, 0, Math.PI * 2);
    ctx.fill();

    // Soft ball-joint shadow
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(0, 5.0, 3.0, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw Right Arm holding mainhand weapon (Upper arm -> Forearm -> Palm)
   */
  public static drawMainhandArm(
    ctx: CanvasRenderingContext2D,
    player: Player,
    bodyBob: number,
    walkCycle: number,
    time: number
  ) {
    const { armorColor } = this.getArmorColors(player.equipment.armor);
    // Sine harmonic arm swing counter-balancing left arm
    const isMoving = Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05;
    const armSwingAngle = walkCycle * 0.48;
    const swayX = walkCycle * 1.5;

    ctx.save();
    // Shoulder pivot
    ctx.translate(10.5 + (isMoving ? swayX * 0.4 : 0), -19.5 - bodyBob);
    ctx.rotate(armSwingAngle);

    // 1. Upper Arm
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-2.3, 0, 4.6, 5.0, 2.3);
    ctx.fill();

    // 2. Forearm
    ctx.translate(0, 4.5);
    ctx.rotate(armSwingAngle * 0.15);
    ctx.beginPath();
    ctx.roundRect(-2.1, 0, 4.2, 4.6, 2.1);
    ctx.fill();

    // 3. Peach Figurine Palm Base (underneath weapon hilt)
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.arc(0, 4.6, 3.0, 0, Math.PI * 2);
    ctx.fill();

    // Rigidly mount handheld weapon onto fist socket
    ctx.save();
    ctx.translate(0, 4.6);
    PlayerWeaponManager.drawMainWeapon(ctx, player, time, true);
    ctx.restore();

    // Cute fingers & thumb tightly wrapped over sword hilt (front layer)
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.arc(0.4, 4.6, 2.3, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.fill();

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-1.1, 4.0, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private static drawLegs(
    ctx: CanvasRenderingContext2D,
    bodyBob: number,
    walkCycle: number,
    bootColor: string,
    bootTrim: string
  ) {
    // Spine-like harmonic leg pendulum swinging with center of gravity shift
    const swayX = walkCycle * 1.8;
    const leftLegRot = walkCycle * 0.52;
    const rightLegRot = -walkCycle * 0.52;
    const leftLift = Math.max(0, walkCycle) * 2.8;
    const rightLift = Math.max(0, -walkCycle) * 2.8;

    // --- Left Stubby Leg (Thigh -> Shin -> Boot) ---
    ctx.save();
    ctx.translate(-6.0 + swayX * 0.6, -9.5 - bodyBob - leftLift);
    ctx.rotate(leftLegRot);

    // 1. Thigh
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-2.7, 0, 5.5, 5.0, 2.4);
    ctx.fill();

    // 2. Shin & Knee
    ctx.translate(0, 4.5);
    const leftKnee = Math.max(0, -leftLegRot * 0.35);
    ctx.rotate(leftKnee);
    ctx.beginPath();
    ctx.roundRect(-2.4, 0, 4.8, 4.8, 1.8);
    ctx.fill();

    // 3. Boot & Toe
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-3.4, 1.5, 6.8, 5.8, [2.5, 2.5, 3.5, 3.5]);
    ctx.fill();
    ctx.fillStyle = bootTrim;
    ctx.fillRect(-3.4, 6.0, 6.8, 1.2);

    // Boot Gloss Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-0.4, 3.8, 1.5, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Right Stubby Leg (Thigh -> Shin -> Boot) ---
    ctx.save();
    ctx.translate(6.0 + swayX * 0.6, -9.5 - bodyBob - rightLift);
    ctx.rotate(rightLegRot);

    // 1. Thigh
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-2.7, 0, 5.5, 5.0, 2.4);
    ctx.fill();

    // 2. Shin & Knee
    ctx.translate(0, 4.5);
    const rightKnee = Math.max(0, rightLegRot * 0.35);
    ctx.rotate(rightKnee);
    ctx.beginPath();
    ctx.roundRect(-2.4, 0, 4.8, 4.8, 1.8);
    ctx.fill();

    // 3. Boot & Toe
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-3.4, 1.5, 6.8, 5.8, [2.5, 2.5, 3.5, 3.5]);
    ctx.fill();
    ctx.fillStyle = bootTrim;
    ctx.fillRect(-3.4, 6.0, 6.8, 1.2);

    // Boot Gloss Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0.4, 3.8, 1.5, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private static drawTorso(
    ctx: CanvasRenderingContext2D,
    bodyBob: number,
    armorColor: string,
    trimColor: string,
    specularColor: string
  ) {
    // Chubby belly silhouette (19px wide x 13.5px tall)
    ctx.fillStyle = armorColor;
    ctx.beginPath();
    ctx.roundRect(-9.5, -20.5 - bodyBob, 19, 13.5, 5.5);
    ctx.fill();

    // Matte PVC Upper Curvature Highlight
    ctx.fillStyle = specularColor;
    ctx.beginPath();
    ctx.roundRect(-8.0, -20.0 - bodyBob, 16.0, 3.0, 2.0);
    ctx.fill();

    // Cute Adventurer Belt with Golden Buckle
    ctx.fillStyle = trimColor;
    ctx.fillRect(-9.5, -11.0 - bodyBob, 19, 3.0);

    // Mini Golden Buckle
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-3.0, -11.5 - bodyBob, 6.0, 4.0, 1.2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-1.0, -10.5 - bodyBob, 2.0, 2.0);

    // Buckle Sparkle
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2.2, -11.0 - bodyBob, 1.2, 1.2);
  }

  private static drawNeckAndCollar(ctx: CanvasRenderingContext2D, bodyBob: number) {
    // Under-chin soft drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, -20.0 - bodyBob, 7.5, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute peach V-neck collar peek
    ctx.fillStyle = '#fde2d7';
    ctx.beginPath();
    ctx.moveTo(-3.0, -20.5 - bodyBob);
    ctx.lineTo(0, -17.5 - bodyBob);
    ctx.lineTo(3.0, -20.5 - bodyBob);
    ctx.closePath();
    ctx.fill();
  }

  private static getArmorColors(armor?: Item) {
    return GoodSmileColorUtils.getArmorColors(armor);
  }

  private static getBootColors(boots?: Item) {
    return GoodSmileColorUtils.getBootColors(boots);
  }
}
