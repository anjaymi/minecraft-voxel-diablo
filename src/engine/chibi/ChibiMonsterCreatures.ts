import { Enemy } from '../../types';

/**
 * 2.0-Head Standard Creature & Bestial Monster Renderer:
 * - Creeper (Oversized Cubic Head & 4 Cute Stubby Feet)
 * - Spider (Chunky Bulbous Body, Big Glossy Eyes, 8 Arched Legs)
 * - Piglin Brute (Tusked Snout & Golden Battleaxe)
 * - Slime (Bouncy Gelatinous Cube)
 */
export class ChibiMonsterCreatures {
  /**
   * 2.0-Head Chibi Creeper
   */
  public static drawCreeper(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;
    const isFlashing = enemy.state === 'exploding' && Math.floor(time * 16) % 2 === 0;
    const greenBase = isFlashing ? '#ffffff' : '#22c55e';
    const darkGreen = isFlashing ? '#e2e8f0' : '#15803d';

    // 1. 4 Short stubby feet with cute walking gait
    const legPhase = (pose.limbSwing || (time * 10)) * 0.8;
    // Front-left
    ctx.save();
    ctx.translate(-5, -6);
    ctx.rotate(Math.sin(legPhase) * 0.4);
    ctx.fillStyle = darkGreen;
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.restore();

    // Front-right
    ctx.save();
    ctx.translate(5, -6);
    ctx.rotate(-Math.sin(legPhase) * 0.4);
    ctx.fillStyle = darkGreen;
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.restore();

    // 2. Compact Chunky Torso (23% proportion)
    ctx.fillStyle = greenBase;
    ctx.beginPath();
    ctx.roundRect(-7, -20 - bob, 14, 15, 3);
    ctx.fill();

    // Pixel camouflage spots
    ctx.fillStyle = darkGreen;
    ctx.fillRect(-5, -18 - bob, 4, 3);
    ctx.fillRect(2, -14 - bob, 3, 4);

    // 3. Oversized 2.0-Head Cubic Creeper Head (54% proportion: 22px × 20px)
    ctx.save();
    ctx.translate(0, -25 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.7);

    // Head block
    ctx.fillStyle = greenBase;
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 20, 4);
    ctx.fill();

    // Sad iconic Creeper face
    ctx.fillStyle = '#052e16';
    // Eyes
    ctx.fillRect(-7, -15, 4, 4);
    ctx.fillRect(3, -15, 4, 4);
    // Nose bridge
    ctx.fillRect(-3, -11, 6, 5);
    // Sad downturn mouth
    ctx.fillRect(-5, -6, 3, 5);
    ctx.fillRect(2, -6, 3, 5);
    ctx.fillRect(-2, -6, 4, 2);

    ctx.restore();
  }

  /**
   * 2.0-Head Chibi Spider
   */
  public static drawSpider(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // 1. Chunky bulbous abdomen
    ctx.fillStyle = '#1e1e24';
    ctx.beginPath();
    ctx.ellipse(0, -10 - bob, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Abdomen stripe markings
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.arc(0, -10 - bob, 6, 0, Math.PI);
    ctx.fill();

    // 2. Cute Chibi Head with large red glowing eyes
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.arc(0, -13 - bob, 9, 0, Math.PI * 2);
    ctx.fill();

    // 2 Big glossy ruby eyes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-4, -13 - bob, 3, 0, Math.PI * 2);
    ctx.arc(4, -13 - bob, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-5, -15 - bob, 1.5, 1.5);
    ctx.fillRect(3, -15 - bob, 1.5, 1.5);

    // 4 smaller auxiliary eyes
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(-2, -18 - bob, 1.5, 1.5);
    ctx.fillRect(0.5, -18 - bob, 1.5, 1.5);
    ctx.fillRect(-6.5, -17 - bob, 1.5, 1.5);
    ctx.fillRect(5, -17 - bob, 1.5, 1.5);

    // 3. 8 Cute Arched Jointed Crawling Legs
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2.5;
    const legPhase = pose.limbSwing || (time * 12);

    for (let i = -1.8; i <= 1.8; i += 1.2) {
      const wiggle = Math.sin(legPhase + i * 2) * 4;

      // Left leg
      ctx.beginPath();
      ctx.moveTo(-5, -10 - bob);
      ctx.lineTo(-14, -16 - bob + i * 2 + wiggle);
      ctx.lineTo(-18, 0);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(5, -10 - bob);
      ctx.lineTo(14, -16 - bob + i * 2 - wiggle);
      ctx.lineTo(18, 0);
      ctx.stroke();
    }
  }

  /**
   * 2.0-Head Chibi Piglin Brute
   */
  public static drawPiglinBrute(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    const bob = pose.bodyBob || 0;

    // Legs
    ctx.save();
    ctx.translate(-4, -10);
    ctx.rotate(pose.leftLegAngle || 0);
    ctx.fillStyle = '#78350f'; // Leather greaves
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(4, -10);
    ctx.rotate(pose.rightLegAngle || 0);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(-2.5, 0, 5, 7, 2);
    ctx.fill();
    ctx.restore();

    // Torso: Gold trim leather armor
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(-8, -22 - bob, 16, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#f59e0b'; // Gold belt
    ctx.fillRect(-8, -13 - bob, 16, 3);

    // Right Arm: Golden Battleaxe
    ctx.save();
    ctx.translate(8, -20 - bob);
    ctx.rotate(pose.rightArmAngle || 0);
    ctx.fillStyle = '#f43f5e'; // Pink piglin arm
    ctx.fillRect(-2, 0, 4, 7);

    // Golden Battleaxe
    ctx.translate(0, 8);
    ctx.fillStyle = '#78350f'; // Wooden shaft
    ctx.fillRect(-1.5, -14, 3, 18);
    ctx.fillStyle = '#f59e0b'; // Gold axe blade
    ctx.beginPath();
    ctx.moveTo(1.5, -12);
    ctx.lineTo(9, -15);
    ctx.lineTo(7, -3);
    ctx.lineTo(1.5, -6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Head: 2.0-Head Piglin Snout with Tusks
    ctx.save();
    ctx.translate(0, -26 - bob);
    ctx.rotate((pose.headTilt || 0) * 0.8);
    ctx.fillStyle = '#f43f5e'; // Piglin pink skin
    ctx.beginPath();
    ctx.roundRect(-11, -20, 22, 20, 5);
    ctx.fill();

    // Floppy ears
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-13, -16, 3, 7);
    ctx.fillRect(10, -16, 3, 7);

    // Snout
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.roundRect(-6, -11, 12, 8, 3);
    ctx.fill();
    // Nostrils
    ctx.fillStyle = '#9f1239';
    ctx.fillRect(-3, -8, 2, 3);
    ctx.fillRect(1, -8, 2, 3);

    // Ivory Tusks
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(-7, -11);
    ctx.lineTo(-4, -8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(5, -6);
    ctx.lineTo(7, -11);
    ctx.lineTo(4, -8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
