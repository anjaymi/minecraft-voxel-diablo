import { SkeletonPose, BoneTransform, SpineActionType } from './spineTypes';
import { SpineKinematics } from './SpineKinematics';
import { SpineFinePoseInterpolator } from './SpineFinePoseInterpolator';

/**
 * Shortest angular difference interpolation to prevent 360-degree joint flipping.
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let diff = (b - a) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return a + diff * t;
}

/**
 * Standard linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Smooth Hermite / EaseInOut interpolation curve for natural limb acceleration & deceleration.
 */
export function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Interpolate a single bone transform with shortest angular lerp.
 */
export function interpolateBone(from: BoneTransform, to: BoneTransform, factor: number): BoneTransform {
  return {
    x: lerp(from.x, to.x, factor),
    y: lerp(from.y, to.y, factor),
    rotation: lerpAngle(from.rotation, to.rotation, factor),
    scaleX: lerp(from.scaleX, to.scaleX, factor),
    scaleY: lerp(from.scaleY, to.scaleY, factor),
  };
}

/**
 * Interpolate two complete skeleton poses across all 6 modular slots.
 */
export function interpolatePose(from: SkeletonPose, to: SkeletonPose, weight: number): SkeletonPose {
  const factor = smoothstep(weight);
  const fine =
    from.fine && to.fine
      ? SpineFinePoseInterpolator.interpolateFine(from.fine, to.fine, factor)
      : to.fine || from.fine;

  return {
    torso: interpolateBone(from.torso, to.torso, factor),
    head: interpolateBone(from.head, to.head, factor),
    armLeft: interpolateBone(from.armLeft, to.armLeft, factor),
    armRight: interpolateBone(from.armRight, to.armRight, factor),
    legLeft: interpolateBone(from.legLeft, to.legLeft, factor),
    legRight: interpolateBone(from.legRight, to.legRight, factor),
    fine,
  };
}

/**
 * Deep-clone a SkeletonPose snapshot.
 */
export function clonePose(pose: SkeletonPose): SkeletonPose {
  return {
    torso: { ...pose.torso },
    head: { ...pose.head },
    armLeft: { ...pose.armLeft },
    armRight: { ...pose.armRight },
    legLeft: { ...pose.legLeft },
    legRight: { ...pose.legRight },
    fine: pose.fine ? SpineFinePoseInterpolator.cloneFine(pose.fine) : undefined,
  };
}

export interface SpineBlendTransitionSample {
  time: number;
  progress: number;
  weight: number;
  headAngleDeg: number;
  torsoAngleDeg: number;
  armRightAngleDeg: number;
  legRightAngleDeg: number;
}

export interface SpineBlendDebugState {
  fromAction: SpineActionType;
  toAction: SpineActionType;
  progress: number;
  elapsedTime: number;
  duration: number;
  isTransitioning: boolean;
  fromPose: SkeletonPose | null;
  targetPose: SkeletonPose;
  currentPose: SkeletonPose;
  curveSamples: SpineBlendTransitionSample[];
}

/**
 * Spine Animation Blender:
 * Controls smooth action transitions and cross-fading within 0.2s window
 * between locomotion and combat states (Run -> Slash / Cast / Idle / Hit).
 */
export class SpineAnimationBlender {
  public static readonly DEFAULT_TRANSITION_DURATION = 0.2; // 0.2 seconds requirement

  private currentAction: SpineActionType = 'idle';
  private previousAction: SpineActionType = 'idle';
  private fromPoseSnapshot: SkeletonPose | null = null;
  private targetPoseSnapshot: SkeletonPose | null = null;
  private transitionProgress: number = 1.0; // 1.0 = fully settled on currentAction
  private transitionDuration: number = SpineAnimationBlender.DEFAULT_TRANSITION_DURATION;
  private lastEvaluatedPose: SkeletonPose;
  private actionElapsed: number = 0;
  private transitionElapsed: number = 0.2;
  private curveSamples: SpineBlendTransitionSample[] = [];

  private poseComputer: (action: SpineActionType, time: number) => SkeletonPose;

  constructor(
    initialAction: SpineActionType = 'idle',
    poseComputer?: (action: SpineActionType, time: number) => SkeletonPose
  ) {
    this.currentAction = initialAction;
    this.previousAction = initialAction;
    this.poseComputer = poseComputer || ((action, time) => SpineKinematics.computeActionPose(action, time));
    this.lastEvaluatedPose = this.poseComputer(initialAction, 0);
    this.generateCurveSamples();
  }

  /**
   * Request transition to a new action with cross-fading.
   */
  public switchAction(
    newAction: SpineActionType,
    duration?: number,
    forceRestart: boolean = false
  ): void {
    if (newAction === this.currentAction && this.transitionProgress >= 1.0 && !forceRestart) {
      return;
    }

    // Snappy 0.04s transition for attacks, standard for locomotion
    const defaultDur = (newAction === 'slash' || newAction === 'charge_slam') ? 0.04 : SpineAnimationBlender.DEFAULT_TRANSITION_DURATION;
    const finalDuration = duration !== undefined ? duration : defaultDur;

    this.previousAction = this.currentAction;
    this.fromPoseSnapshot = clonePose(this.lastEvaluatedPose);
    this.currentAction = newAction;
    this.transitionProgress = 0.0;
    this.transitionElapsed = 0.0;
    this.transitionDuration = Math.max(0.02, finalDuration);
    this.actionElapsed = 0;
    this.targetPoseSnapshot = this.poseComputer(newAction, 0);

    this.generateCurveSamples();
  }

  private generateCurveSamples(): void {
    if (!this.fromPoseSnapshot) {
      this.fromPoseSnapshot = clonePose(this.lastEvaluatedPose);
    }
    const targetPose = this.targetPoseSnapshot || this.poseComputer(this.currentAction, 0.05);
    const from = this.fromPoseSnapshot;
    const samples: SpineBlendTransitionSample[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const w = smoothstep(p);
      const hRot = lerpAngle(from.head.rotation, targetPose.head.rotation, w) * (180 / Math.PI);
      const tRot = lerpAngle(from.torso.rotation, targetPose.torso.rotation, w) * (180 / Math.PI);
      const arRot = lerpAngle(from.armRight.rotation, targetPose.armRight.rotation, w) * (180 / Math.PI);
      const lrRot = lerpAngle(from.legRight.rotation, targetPose.legRight.rotation, w) * (180 / Math.PI);

      samples.push({
        time: p * this.transitionDuration,
        progress: p,
        weight: w,
        headAngleDeg: hRot,
        torsoAngleDeg: tRot,
        armRightAngleDeg: arRot,
        legRightAngleDeg: lrRot,
      });
    }
    this.curveSamples = samples;
  }

  /**
   * Update the animation blender with time or delta-time, returning cross-faded SkeletonPose.
   */
  public evaluate(
    targetAction: SpineActionType,
    time: number,
    dt: number = 0.016,
    speedMultiplier: number = 1.0
  ): SkeletonPose {
    // 1. Detect action change
    if (targetAction !== this.currentAction) {
      this.switchAction(targetAction, this.transitionDuration);
    }

    // 2. Advance timers
    this.actionElapsed += dt * speedMultiplier;

    // 3. Compute target action's raw dynamic pose at current phase
    const toPose = this.poseComputer(this.currentAction, this.actionElapsed);
    this.targetPoseSnapshot = toPose;

    // 4. If in transition, blend from snapshot to target pose
    if (this.transitionProgress < 1.0 && this.fromPoseSnapshot) {
      this.transitionElapsed += dt;
      this.transitionProgress = Math.min(1.0, this.transitionElapsed / this.transitionDuration);

      const blended = interpolatePose(this.fromPoseSnapshot, toPose, this.transitionProgress);
      this.lastEvaluatedPose = blended;

      if (this.transitionProgress >= 1.0) {
        this.fromPoseSnapshot = null;
      }
      return blended;
    }

    // 5. Steady state
    this.lastEvaluatedPose = toPose;
    return toPose;
  }

  /**
   * Return real-time debug state for Cross-fading UI & Curve Plotting
   */
  public getDebugState(): SpineBlendDebugState {
    const targetPose = this.targetPoseSnapshot || this.lastEvaluatedPose;
    return {
      fromAction: this.previousAction,
      toAction: this.currentAction,
      progress: this.transitionProgress,
      elapsedTime: Math.min(this.transitionDuration, this.transitionElapsed),
      duration: this.transitionDuration,
      isTransitioning: this.transitionProgress < 1.0,
      fromPose: this.fromPoseSnapshot,
      targetPose,
      currentPose: this.lastEvaluatedPose,
      curveSamples: this.curveSamples,
    };
  }

  public getProgress(): number {
    return this.transitionProgress;
  }

  public getCurrentAction(): SpineActionType {
    return this.currentAction;
  }

  public getPreviousAction(): SpineActionType {
    return this.previousAction;
  }

  public resetTo(action: SpineActionType, time: number = 0): void {
    this.currentAction = action;
    this.previousAction = action;
    this.transitionProgress = 1.0;
    this.transitionElapsed = this.transitionDuration;
    this.fromPoseSnapshot = null;
    this.actionElapsed = 0;
    this.lastEvaluatedPose = this.poseComputer(action, time);
    this.generateCurveSamples();
  }
}
