import { Player } from '../../types';

export class WildShapeBearModel {
  /**
   * Renders the heavy ancient bear beast body with rich earthy tones,
   * thick fur layers, shoulder hump, and savage claws.
   */
  public static drawBearBody(
    ctx: CanvasRenderingContext2D,
    player: Player,
    time: number
  ) {
    const isMoving = Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05;
    const stride = isMoving ? Math.sin(time * 10) : 0;
    const breathe = Math.sin(time * 3.5) * 1.5;

    ctx.save();
    // Heavy Wild Beast Scaling (1.45x bulky physique)
    ctx.scale(1.45, 1.45);

    // Subtle beast aura silhouette glow
    ctx.shadowColor = '#059669';
    ctx.shadowBlur = 8;

    // 1. Massive Hind Legs & Heavy Paws (Deep Grizzly Bark Wood #2e1005)
    ctx.fillStyle = '#270e04';
    const hindSwing = stride * 4;
    ctx.beginPath();
    ctx.roundRect(-15, -12 + hindSwing, 9, 13, 3.5);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(6, -12 - hindSwing, 9, 13, 3.5);
    ctx.fill();

    // 2. Thick Layered Torso (Heavy Grizzled Fur + Underbelly Shading)
    // Dark base body
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(0, -18 + breathe, 17, 14, 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Underbelly lighter fur layer
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(1, -15 + breathe, 13, 9, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Muscular Shoulder Hump (Grizzly Beast Ridge)
    ctx.fillStyle = '#1c0902';
    ctx.beginPath();
    ctx.ellipse(-3.5, -24 + breathe, 13, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Fur Tufts on Shoulder Ridge
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-9, -29 + breathe);
    ctx.lineTo(-4, -32 + breathe);
    ctx.lineTo(-2, -28 + breathe);
    ctx.lineTo(3, -31 + breathe);
    ctx.lineTo(6, -26 + breathe);
    ctx.closePath();
    ctx.fill();

    // Ancient Glowing Druidic Vines / Runes on Bear Pelt
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#34d399';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-6, -21 + breathe);
    ctx.quadraticCurveTo(0, -24 + breathe, 4, -19 + breathe);
    ctx.lineTo(1, -14 + breathe);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Beast Head, Snout & Fierce Fangs
    ctx.save();
    ctx.translate(11, -26 + breathe);

    // Rounded Heavy Bear Ears
    ctx.fillStyle = '#270e04';
    ctx.beginPath();
    ctx.arc(-4, -9, 4.5, 0, Math.PI * 2);
    ctx.arc(3, -10, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.arc(-4, -9, 2.2, 0, Math.PI * 2);
    ctx.arc(3, -10, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Head Base Box
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(-8, -8, 16, 14, 5);
    ctx.fill();

    // Snout with Deep Ochre Leather
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(1, -3, 10, 8, 3);
    ctx.fill();

    // Nostrils / Wet Black Nose
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(8, -3, 3, 3);

    // Sharp White Fangs
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(3, 4);
    ctx.lineTo(5, 7);
    ctx.lineTo(7, 4);
    ctx.closePath();
    ctx.fill();

    // Glowing Emerald Beast Eyes
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#34d399';
    ctx.shadowBlur = 6;
    ctx.fillRect(2, -5, 3.5, 2.5);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 4. Heavy Forearms, Razor Claws & Attack Animation Frames
    const isAttacking = player.isAttacking;
    const step = player.comboStep || 0;

    let leftPawAngle = -0.2;
    let rightPawAngle = 0.3;
    let clawSlashActive = false;

    if (isAttacking) {
      clawSlashActive = true;
      const p = Math.max(0, Math.min(1, player.attackTimer / 0.28));
      if (step === 1) {
        // Step 1: Savage Horizontal Cleave
        rightPawAngle = -1.5 + (1 - p) * 3.0;
      } else if (step === 2) {
        // Step 2: Uppercut Claw Maul
        rightPawAngle = 1.7 - (1 - p) * 3.4;
        leftPawAngle = 0.9 - (1 - p) * 1.8;
      } else {
        // Step 0: Double Seismic Ground Slam
        rightPawAngle = -1.9 + (1 - p) * 3.4;
        leftPawAngle = -1.9 + (1 - p) * 3.4;
      }
    } else {
      leftPawAngle = stride * 0.45;
      rightPawAngle = -stride * 0.45;
    }

    // Left Forearm
    ctx.save();
    ctx.translate(-4, -14);
    ctx.rotate(leftPawAngle);
    ctx.fillStyle = '#270e04';
    ctx.beginPath();
    ctx.roundRect(-3.5, 0, 8, 15, 3.5);
    ctx.fill();
    // White Ivory Claws
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, 14, 2.2, 3.5);
    ctx.fillRect(2, 14, 2.2, 3.5);
    ctx.restore();

    // Right Forearm (Primary Maul Paw)
    ctx.save();
    ctx.translate(6, -14);
    ctx.rotate(rightPawAngle);
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(-3.5, 0, 9, 16, 3.5);
    ctx.fill();

    // Extra Heavy Serrated Claws
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-2, 15, 2.2, 4.5);
    ctx.fillRect(1, 15, 2.2, 4.5);
    ctx.fillRect(4, 15, 2.2, 4.5);

    // Glowing Emerald Wind Trails during Attack
    if (clawSlashActive) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.arc(2, 16, 16, -0.6, 0.8);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(2, 16, 20, -0.8, 0.6);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // Overhead Form Badge
    ctx.save();
    ctx.scale(1 / 1.45, 1 / 1.45);
    const remTime = (player.wildShapeTimer || 0).toFixed(0);
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(`🐻 远古狂怒巨熊 (${remTime}s)`, 0, -48);
    ctx.restore();

    ctx.restore();
  }
}
