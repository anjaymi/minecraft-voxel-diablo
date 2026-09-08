import { SkeletonPose, BoneTransform } from './spineTypes';

/**
 * Helper to render debug skeleton wireframe & articulated joint crosses.
 * Visualizes 2-segment fine kinematic chains (Shoulder -> Elbow -> Wrist; Hip -> Knee -> Ankle).
 */
export class SpineWireframeRenderer {
  public static drawWireframe(ctx: CanvasRenderingContext2D, pose: SkeletonPose) {
    ctx.save();

    if (pose.fine) {
      this.drawFineArticulatedWireframe(ctx, pose);
    } else {
      this.drawBasicWireframe(ctx, pose);
    }

    ctx.restore();
  }

  private static drawFineArticulatedWireframe(ctx: CanvasRenderingContext2D, pose: SkeletonPose) {
    const f = pose.fine!;

    // 1. Draw Kinematic Chain Segments
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'; // Electric cyan bone lines
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);

    // Spine chain: Pelvis -> Chest -> Head
    ctx.beginPath();
    ctx.moveTo(f.pelvis.x, f.pelvis.y);
    ctx.lineTo(f.chest.x, f.chest.y);
    ctx.lineTo(f.head.x, f.head.y);
    ctx.stroke();

    // Right Arm: Chest -> Shoulder -> Elbow -> Wrist -> Weapon
    ctx.beginPath();
    ctx.moveTo(f.chest.x, f.chest.y);
    ctx.lineTo(f.armRight.upper.x, f.armRight.upper.y);
    ctx.lineTo(f.armRight.lower.x, f.armRight.lower.y);
    ctx.lineTo(f.armRight.end.x, f.armRight.end.y);
    ctx.lineTo(f.weapon.x, f.weapon.y);
    ctx.stroke();

    // Left Arm: Chest -> Shoulder -> Elbow -> Wrist
    ctx.beginPath();
    ctx.moveTo(f.chest.x, f.chest.y);
    ctx.lineTo(f.armLeft.upper.x, f.armLeft.upper.y);
    ctx.lineTo(f.armLeft.lower.x, f.armLeft.lower.y);
    ctx.lineTo(f.armLeft.end.x, f.armLeft.end.y);
    ctx.stroke();

    // Right Leg: Pelvis -> Hip -> Knee -> Ankle
    ctx.beginPath();
    ctx.moveTo(f.pelvis.x, f.pelvis.y);
    ctx.lineTo(f.legRight.upper.x, f.legRight.upper.y);
    ctx.lineTo(f.legRight.lower.x, f.legRight.lower.y);
    ctx.lineTo(f.legRight.end.x, f.legRight.end.y);
    ctx.stroke();

    // Left Leg: Pelvis -> Hip -> Knee -> Ankle
    ctx.beginPath();
    ctx.moveTo(f.pelvis.x, f.pelvis.y);
    ctx.lineTo(f.legLeft.upper.x, f.legLeft.upper.y);
    ctx.lineTo(f.legLeft.lower.x, f.legLeft.lower.y);
    ctx.lineTo(f.legLeft.end.x, f.legLeft.end.y);
    ctx.stroke();

    ctx.setLineDash([]);

    // 2. Articulated Joint Dots
    const fineJoints = [
      { name: 'Head', bone: f.head, color: '#f59e0b', r: 3.5 },
      { name: 'Chest', bone: f.chest, color: '#3b82f6', r: 4 },
      { name: 'Pelvis', bone: f.pelvis, color: '#2563eb', r: 3.5 },
      // Elbows & Knees (Upper -> Forearm / Thigh -> Shin pivots)
      { name: 'R Elbow', bone: f.armRight.lower, color: '#fbbf24', r: 3 },
      { name: 'L Elbow', bone: f.armLeft.lower, color: '#fbbf24', r: 3 },
      { name: 'R Palm', bone: f.armRight.palm || f.armRight.end, color: '#10b981', r: 3.2 },
      { name: 'L Palm', bone: f.armLeft.palm || f.armLeft.end, color: '#10b981', r: 3 },
      { name: 'R Knee', bone: f.legRight.lower, color: '#c084fc', r: 3 },
      { name: 'L Knee', bone: f.legLeft.lower, color: '#c084fc', r: 3 },
      { name: 'R Foot', bone: f.legRight.foot || f.legRight.end, color: '#a855f7', r: 3.0 },
      { name: 'L Foot', bone: f.legLeft.foot || f.legLeft.end, color: '#a855f7', r: 3.0 },
      { name: 'Weapon', bone: f.weapon, color: '#ef4444', r: 3.5 },
    ];

    if (f.armRight.fingertip) {
      fineJoints.push({ name: 'R Finger', bone: f.armRight.fingertip, color: '#38bdf8', r: 2.2 });
    }

    for (const j of fineJoints) {
      this.drawJointMarker(ctx, j.bone.x, j.bone.y, j.color, j.r);
    }
  }

  private static drawBasicWireframe(ctx: CanvasRenderingContext2D, pose: SkeletonPose) {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);

    // Spine
    ctx.beginPath();
    ctx.moveTo(pose.torso.x, pose.torso.y);
    ctx.lineTo(pose.head.x, pose.head.y);
    // Shoulders
    ctx.moveTo(pose.torso.x, pose.torso.y - 8);
    ctx.lineTo(pose.armLeft.x, pose.armLeft.y);
    ctx.moveTo(pose.torso.x, pose.torso.y - 8);
    ctx.lineTo(pose.armRight.x, pose.armRight.y);
    // Pelvis
    ctx.moveTo(pose.torso.x, pose.torso.y + 10);
    ctx.lineTo(pose.legLeft.x, pose.legLeft.y);
    ctx.moveTo(pose.torso.x, pose.torso.y + 10);
    ctx.lineTo(pose.legRight.x, pose.legRight.y);
    ctx.stroke();

    ctx.setLineDash([]);

    const joints = [
      { bone: pose.head, color: '#f59e0b', r: 3.5 },
      { bone: pose.torso, color: '#3b82f6', r: 4 },
      { bone: pose.armLeft, color: '#10b981', r: 3 },
      { bone: pose.armRight, color: '#10b981', r: 3 },
      { bone: pose.legLeft, color: '#a855f7', r: 3 },
      { bone: pose.legRight, color: '#a855f7', r: 3 },
    ];

    for (const j of joints) {
      this.drawJointMarker(ctx, j.bone.x, j.bone.y, j.color, j.r);
    }
  }

  private static drawJointMarker(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    color: string,
    radius: number
  ) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 4, by);
    ctx.lineTo(bx + 4, by);
    ctx.moveTo(bx, by - 4);
    ctx.lineTo(bx, by + 4);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
