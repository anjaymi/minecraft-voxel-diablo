import { Player } from '../../types';
import { LimbChain2D, FineSkeletonPose } from './spineFineKinematicsTypes';
import { BoneTransform } from './spineTypes';

/**
 * Procedural Articulated 3-segment limbs and segmented armor renderer:
 * - Arm: Upper Arm (大臂) -> Forearm (前臂) -> Palm/Fingers (手掌/指尖)
 * - Leg: Thigh (大腿) -> Shin (小腿) -> Foot/Toe (脚掌/脚尖)
 * - Weapon physics trails & ground impale shockwave
 */
export class SpineDetailedLimbRenderer {
  /**
   * Draw 3-segment articulated arm (Upper arm, elbow joint, gauntlet forearm, hand/palm)
   */
  public static drawArticulatedArm(
    ctx: CanvasRenderingContext2D,
    limb: LimbChain2D,
    isRightArm: boolean,
    player: Player
  ): void {
    const mainColor = isRightArm ? '#60a5fa' : '#2563eb';
    const darkColor = isRightArm ? '#1d4ed8' : '#1e3a8a';
    const gauntletColor = '#78350f';
    const metalBuckle = '#fbbf24';

    // 1. Upper Arm (Shoulder to Elbow)
    ctx.save();
    ctx.translate(limb.upper.x, limb.upper.y);
    ctx.rotate(limb.upper.rotation);

    // Shoulder Pauldron / Ball joint
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Biceps Tunic
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, 10, 2.5);
    ctx.fill();
    ctx.restore();

    // 2. Elbow & Forearm (Elbow to Wrist)
    ctx.save();
    ctx.translate(limb.lower.x, limb.lower.y);
    ctx.rotate(limb.lower.rotation);

    // Elbow Guard hinge
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Forearm Bracer / Gauntlet
    ctx.fillStyle = gauntletColor;
    ctx.beginPath();
    ctx.roundRect(-3.2, 0, 6.4, 9, 2);
    ctx.fill();

    // Golden strap buckle on wrist
    ctx.fillStyle = metalBuckle;
    ctx.fillRect(-3.6, 5, 7.2, 1.8);
    ctx.restore();

    // 3. Palm & Fingers (Terminal joint)
    ctx.save();
    const palm = limb.palm || limb.end;
    ctx.translate(palm.x, palm.y);
    ctx.rotate(palm.rotation);

    // Leather glove palm
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(-2.8, -1.5, 5.6, 5.5, 1.8);
    ctx.fill();

    // Finger knuckleguard
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-2.5, 1.5, 5, 2);
    ctx.restore();
  }

  /**
   * Draw 3-segment articulated leg (Thigh, knee guard, shin greaves, articulated foot)
   */
  public static drawArticulatedLeg(
    ctx: CanvasRenderingContext2D,
    limb: LimbChain2D,
    isFrontLeg: boolean,
    player: Player
  ): void {
    const mainColor = isFrontLeg ? '#1d4ed8' : '#172554';
    const armorPlate = isFrontLeg ? '#334155' : '#1e293b';
    const bootColor = isFrontLeg ? '#451a03' : '#290e02';

    // 1. Thigh (Hip to Knee)
    ctx.save();
    ctx.translate(limb.upper.x, limb.upper.y);
    ctx.rotate(limb.upper.rotation);

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(-3, 0, 6, 11.5, 2.5);
    ctx.fill();
    ctx.restore();

    // 2. Knee Guard & Shin Greave (Knee to Ankle)
    ctx.save();
    ctx.translate(limb.lower.x, limb.lower.y);
    ctx.rotate(limb.lower.rotation);

    // Knee cap armor plate (protrudes on bend)
    ctx.fillStyle = armorPlate;
    ctx.beginPath();
    ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // Shin Greave
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.roundRect(-2.6, 0, 5.2, 9, 1.5);
    ctx.fill();
    ctx.restore();

    // 3. Foot / Boot & Toe (Ankle to Toe Sole)
    ctx.save();
    const foot = limb.foot || limb.end;
    ctx.translate(foot.x, foot.y);
    ctx.rotate(foot.rotation);

    // Boot Heel & Foot Sole
    ctx.fillStyle = bootColor;
    ctx.beginPath();
    ctx.roundRect(-3.5, -2, 7.5, 5.5, 2);
    ctx.fill();

    // Articulated toe sole (gripping floor)
    ctx.beginPath();
    ctx.roundRect(-1.5, 2.5, 6.5, 3.5, 1.5);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Draw segmented dual-plate torso (Chestplate + Fauld Pelvis)
   */
  public static drawSegmentedTorso(
    ctx: CanvasRenderingContext2D,
    chest: BoneTransform,
    pelvis: BoneTransform,
    player: Player
  ): void {
    // 1. Lower Core & Belt (Follows Pelvis)
    ctx.save();
    ctx.translate(pelvis.x, pelvis.y);
    ctx.rotate(pelvis.rotation);

    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(-7, -4, 14, 8, 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-8, -3, 16, 4);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(-3, -4, 6, 6);
    ctx.restore();

    // 2. Upper Ribcage & Breastplate (Follows Chest)
    ctx.save();
    ctx.translate(chest.x, chest.y);
    ctx.rotate(chest.rotation);

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-8.5, -8, 17, 15, 3.5);
    ctx.fill();

    // Gold trim inlay
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(0, 4);
    ctx.lineTo(5, -6);
    ctx.stroke();

    // Gorget / Neck guard
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(-6, -9, 12, 3, 1);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Draw dynamic blade slash arc trail.
   */
  public static drawSlashWaveTrail(
    ctx: CanvasRenderingContext2D,
    fine: FineSkeletonPose
  ): void {
    const intensity = fine.slashTrailProgress ?? 0;
    if (intensity <= 0.05) return;

    ctx.save();
    const wrist = fine.weapon;
    const slashAngle = wrist.rotation;

    ctx.translate(wrist.x, wrist.y);
    ctx.rotate(slashAngle);

    const arcRadius = 28;
    const isGreatsword = fine.weaponDynamics?.category === 'greatsword';
    const edgeColor = isGreatsword ? '#f59e0b' : '#38bdf8';

    const grad = ctx.createRadialGradient(0, -arcRadius * 0.7, 4, 0, -arcRadius * 0.7, arcRadius * 1.4);
    grad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
    grad.addColorStop(0.4, isGreatsword ? `rgba(245, 158, 11, ${0.85 * intensity})` : `rgba(56, 189, 248, ${0.8 * intensity})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -arcRadius * 0.7, arcRadius, -Math.PI * 0.7, Math.PI * 0.25);
    ctx.arc(0, -arcRadius * 0.7, arcRadius * 0.45, Math.PI * 0.25, -Math.PI * 0.7, true);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity})`;
    ctx.lineWidth = isGreatsword ? 3 : 2;
    ctx.beginPath();
    ctx.arc(0, -arcRadius * 0.7, arcRadius, -Math.PI * 0.55, Math.PI * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw light weapon fingertip magic trails & heavy blade trailing particles.
   */
  public static drawPhysicsParticles(
    ctx: CanvasRenderingContext2D,
    fine: FineSkeletonPose
  ): void {
    const trailPoints = fine.weaponDynamics?.trailPoints;
    if (!trailPoints || trailPoints.length === 0) return;

    ctx.save();
    for (const pt of trailPoints) {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Draw ground impale shockwave and radial earth fissures when sword is plunged into dirt.
   */
  public static drawGroundImpaleShockwave(
    ctx: CanvasRenderingContext2D,
    fine: FineSkeletonPose
  ): void {
    if (!fine.isGroundImpaling) return;
    const p = fine.shockwaveProgress ?? 0;
    if (p <= 0) return;

    ctx.save();
    const impactX = fine.weapon.x;
    const impactY = fine.weapon.y + 14;

    // Expanding elliptical ground shockwave
    ctx.strokeStyle = `rgba(251, 191, 36, ${Math.max(0, 1 - p * 0.8)})`;
    ctx.lineWidth = 2.5 * (1 - p * 0.5);
    ctx.beginPath();
    ctx.ellipse(impactX, impactY, 20 * p, 8 * p, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Ground cracks / fissures
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(impactX - 2, impactY);
    ctx.lineTo(impactX - 14 * p, impactY + 3);
    ctx.moveTo(impactX + 2, impactY);
    ctx.lineTo(impactX + 16 * p, impactY + 2);
    ctx.moveTo(impactX, impactY - 1);
    ctx.lineTo(impactX + 5 * p, impactY + 6 * p);
    ctx.stroke();

    ctx.restore();
  }
}
