import { SkeletonPose, BoneTransform, SpineActionType, SPINE_ACTION_PRESETS } from './spineTypes';
import { Player } from '../../types';
import { SpineAnimationBlender } from './SpineAnimationBlender';
import { SpineKinematicsFine } from './SpineKinematicsFine';

export class SpineKinematics {
  /**
   * Compute pose by specific action type and continuous time or fixed normalized phase [0..1]
   */
  public static computeActionPose(
    action: SpineActionType,
    timeOrPhase: number,
    isNormalizedPhase: boolean = false,
    player?: Player | null
  ): SkeletonPose {
    const preset = SPINE_ACTION_PRESETS.find((p) => p.id === action) || SPINE_ACTION_PRESETS[0];
    const duration = preset.cycleDuration;
    let phase = isNormalizedPhase ? timeOrPhase % 1.0 : (timeOrPhase / duration) % 1.0;

    // Expert 2D Combat: Tie attack animations strictly to player's attackTimer and combo progression
    if (player && player.attackTimer > 0 && (action === 'slash' || action === 'charge_slam')) {
      const isGreatsword = player.equipment?.weapon?.subType === 'greatsword';
      const step = player.currentSlashStep !== undefined ? player.currentSlashStep : (player.comboStep || 0);
      const totalAttackDuration = step === 2 || isGreatsword ? 0.42 : (step === 1 ? 0.24 : 0.20);
      phase = Math.max(0, Math.min(1.0, 1.0 - (player.attackTimer / totalAttackDuration)));
    }

    const angle = phase * Math.PI * 2;

    const basePose = this.computeRawPose(action, phase, angle, player);
    const fine = SpineKinematicsFine.computeFinePose(action, phase, basePose, player);
    basePose.fine = fine;

    // Synchronize compound limb & torso angles for backward-compatible root slot layers
    basePose.armRight.rotation = fine.armRight.upper.rotation;
    basePose.armLeft.rotation = fine.armLeft.upper.rotation;
    basePose.torso.rotation = fine.chest.rotation;

    return basePose;
  }

  private static computeRawPose(
    action: SpineActionType,
    phase: number,
    angle: number,
    player?: Player | null
  ): SkeletonPose {
    switch (action) {
      case 'charge_slam': {
        const p = phase;
        const leap = p > 0.22 && p < 0.48 ? -22 * Math.sin(((p - 0.22) / 0.26) * Math.PI) : p >= 0.48 && p < 0.72 ? 2 : 0;
        const torso: BoneTransform = { x: 0, y: -22 + leap, rotation: p > 0.48 ? 0.3 : -0.1, scaleX: 1, scaleY: 1 };
        const head: BoneTransform = { x: 0, y: torso.y - 18, rotation: p > 0.48 ? -0.2 : 0.25, scaleX: 1, scaleY: 1 };
        const armLeft: BoneTransform = { x: -8, y: torso.y - 8, rotation: p > 0.48 ? 0.4 : -2.0, scaleX: 1, scaleY: 1 };
        const armRight: BoneTransform = { x: 8, y: torso.y - 8, rotation: p > 0.48 ? 0.4 : -2.0, scaleX: 1, scaleY: 1 };
        const legLeft: BoneTransform = { x: -5, y: torso.y + 14, rotation: p > 0.22 && p < 0.48 ? 0.45 : 0.1, scaleX: 1, scaleY: 1 };
        const legRight: BoneTransform = { x: 5, y: torso.y + 14, rotation: p > 0.22 && p < 0.48 ? 0.45 : -0.1, scaleX: 1, scaleY: 1 };
        return { torso, head, armLeft, armRight, legLeft, legRight };
      }
      case 'idle': {
        const torsoBob = Math.sin(angle) * 1.6;
        const torsoTilt = Math.sin(angle * 0.5) * 0.025;
        const headTilt = torsoTilt + Math.sin(angle + 0.4) * 0.04;

        const torso: BoneTransform = { x: 0, y: -22 - torsoBob, rotation: torsoTilt, scaleX: 1, scaleY: 1 };
        const head: BoneTransform = { x: 0, y: torso.y - 18, rotation: headTilt, scaleX: 1, scaleY: 1 };
        const legLeft: BoneTransform = { x: -5, y: torso.y + 14, rotation: 0, scaleX: 1, scaleY: 1 };
        const legRight: BoneTransform = { x: 5, y: torso.y + 14, rotation: 0, scaleX: 1, scaleY: 1 };
        const armLeft: BoneTransform = { x: -9, y: torso.y - 8, rotation: Math.sin(angle) * 0.08, scaleX: 1, scaleY: 1 };
        const armRight: BoneTransform = { x: 9, y: torso.y - 8, rotation: -Math.sin(angle) * 0.08, scaleX: 1, scaleY: 1 };

        return { torso, head, armLeft, armRight, legLeft, legRight };
      }

      case 'run': {
        // Spine-style dynamic locomotion: center of gravity sway & harmonic limb swinging
        const swayX = Math.sin(angle) * 2.4; // Lateral center of mass shift
        const pelvicTilt = Math.sin(angle) * 0.09; // Pelvic roll during gait cycle
        const torsoBob = Math.abs(Math.sin(angle)) * 3.6; // Vertical bounce per step
        const forwardLean = 0.08; // Natural forward running posture
        const torsoTilt = Math.sin(angle) * 0.06 + forwardLean;
        const headTilt = -torsoTilt * 0.4 + Math.sin(angle + 0.3) * 0.05;

        // Torso & Head follow center of gravity
        const torso: BoneTransform = {
          x: swayX * 0.6,
          y: -22 - torsoBob,
          rotation: torsoTilt,
          scaleX: 1,
          scaleY: 1,
        };
        const head: BoneTransform = {
          x: swayX * 0.35,
          y: torso.y - 18,
          rotation: headTilt,
          scaleX: 1,
          scaleY: 1,
        };

        // Legs: Harmonic gait cycles with foot lift & sway damping
        const legLeftSwing = Math.sin(angle);
        const legRightSwing = -legLeftSwing;
        const legLeftLift = Math.max(0, Math.sin(angle)) * 3.4;
        const legRightLift = Math.max(0, -Math.sin(angle)) * 3.4;

        const legLeft: BoneTransform = {
          x: -5 + swayX * 0.7 + legLeftSwing * 2.2,
          y: torso.y + 14 - legLeftLift,
          rotation: legLeftSwing * 0.72 + pelvicTilt,
          scaleX: 1,
          scaleY: 1,
        };
        const legRight: BoneTransform = {
          x: 5 + swayX * 0.7 + legRightSwing * 2.2,
          y: torso.y + 14 - legRightLift,
          rotation: legRightSwing * 0.72 - pelvicTilt,
          scaleX: 1,
          scaleY: 1,
        };

        // Arms: Cross-coordination swinging with secondary inertia wave
        const armSwing = Math.sin(angle);
        const armInertia = Math.cos(angle * 2) * 0.08;

        const armLeft: BoneTransform = {
          x: -9 + swayX * 0.45 - armSwing * 1.8,
          y: torso.y - 8 + Math.cos(angle) * 1.5,
          rotation: -armSwing * 0.68 + armInertia,
          scaleX: 1,
          scaleY: 1,
        };
        const armRight: BoneTransform = {
          x: 9 + swayX * 0.45 + armSwing * 1.8,
          y: torso.y - 8 - Math.cos(angle) * 1.5,
          rotation: armSwing * 0.68 - armInertia,
          scaleX: 1,
          scaleY: 1,
        };

        return { torso, head, armLeft, armRight, legLeft, legRight };
      }

      case 'slash': {
        const step = player?.currentSlashStep !== undefined ? player.currentSlashStep : (player?.comboStep || 0);
        let torsoTilt = 0;
        let lungeX = 0;
        let squatY = 0;
        let armRightRot = 0;
        let armLeftRot = 0;

        if (step === 1) {
          // Combo 2: Rising Upward Cleave (自下而上挑斩)
          if (phase < 0.22) {
            const p = phase / 0.22;
            const ease = p * p;
            torsoTilt = 0.12 * ease;
            lungeX = 2.0 * ease;
            squatY = 2.5 * ease;
            armRightRot = 1.65 + ease * 0.25; // Sword low near feet
            armLeftRot = -0.3;
          } else if (phase < 0.52) {
            const p = (phase - 0.22) / 0.30;
            const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            torsoTilt = 0.12 - ease * 0.38; // Body arches upward
            lungeX = 2.0 + ease * 6.0;
            squatY = 2.5 - ease * 4.0; // Straightens up
            armRightRot = 1.90 - ease * 3.45; // Whips upward from +1.9 to -1.55 rad
            armLeftRot = -0.3 + ease * 0.7;
          } else if (phase < 0.68) {
            const p = (phase - 0.52) / 0.16;
            const recoil = Math.sin(p * Math.PI * 4) * 0.035;
            torsoTilt = -0.26;
            lungeX = 8.0;
            squatY = -1.5;
            armRightRot = -1.55 + recoil;
            armLeftRot = 0.4;
          } else {
            const p = (phase - 0.68) / 0.32;
            const ease = 1 - Math.cos((p * Math.PI) / 2);
            torsoTilt = -0.26 * (1 - ease);
            lungeX = 8.0 * (1 - ease);
            squatY = -1.5 * (1 - ease);
            armRightRot = -1.55 + ease * 1.5;
            armLeftRot = 0.4 * (1 - ease);
          }
        } else {
          // Combo 1 & Default: Heavy Diagonal Cleave (右上向左下力劈)
          if (phase < 0.22) {
            // 1. Wind-up anticipation: Coils body back, raises arm high
            const p = phase / 0.22;
            const ease = p * p;
            torsoTilt = -0.16 * ease;
            lungeX = -2.0 * ease;
            squatY = 1.5 * ease;
            armRightRot = -0.4 - ease * 1.35; // Raises high above head
            armLeftRot = 0.2 + ease * 0.25;
          } else if (phase < 0.52) {
            // 2. Explosive downward cleave: Plunges forward with cubic whip acceleration
            const p = (phase - 0.22) / 0.30;
            const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            torsoTilt = -0.16 + ease * 0.58; // Torso lurches forward to +0.42
            lungeX = -2.0 + ease * 11.5; // Big lunging step forward
            squatY = 1.5 + ease * 4.5; // Drops center of gravity into deep forward stance
            armRightRot = -1.75 + ease * 3.35; // Sweeps from -1.75 to +1.60 rad
            armLeftRot = 0.45 - ease * 0.85; // Counter-balance swing
          } else if (phase < 0.68) {
            // 3. Impact freeze & micro-recoil
            const p = (phase - 0.52) / 0.16;
            const recoil = Math.sin(p * Math.PI * 4) * 0.035;
            torsoTilt = 0.42 - p * 0.04;
            lungeX = 9.5;
            squatY = 6.0;
            armRightRot = 1.60 + recoil;
            armLeftRot = -0.40;
          } else {
            // 4. Elastic recovery follow-through
            const p = (phase - 0.68) / 0.32;
            const ease = 1 - Math.cos((p * Math.PI) / 2);
            torsoTilt = 0.38 * (1 - ease);
            lungeX = 9.5 * (1 - ease);
            squatY = 6.0 * (1 - ease);
            armRightRot = 1.60 - ease * 1.5;
            armLeftRot = -0.40 + ease * 0.45;
          }
        }

        const torso: BoneTransform = { x: lungeX, y: -22 + squatY, rotation: torsoTilt, scaleX: 1, scaleY: 1 };
        const head: BoneTransform = { x: lungeX * 0.6, y: torso.y - 18, rotation: torsoTilt * 0.55, scaleX: 1, scaleY: 1 };
        const legLeft: BoneTransform = { x: -6 + lungeX * 0.3, y: torso.y + 14 - squatY * 0.3, rotation: -0.35 - torsoTilt * 0.5, scaleX: 1, scaleY: 1 };
        const legRight: BoneTransform = { x: 6 + lungeX, y: torso.y + 14, rotation: 0.45 + torsoTilt * 0.6, scaleX: 1, scaleY: 1 };
        const armLeft: BoneTransform = { x: -9 + lungeX * 0.3, y: torso.y - 8, rotation: armLeftRot, scaleX: 1, scaleY: 1 };
        const armRight: BoneTransform = { x: 9 + lungeX, y: torso.y - 8, rotation: armRightRot, scaleX: 1, scaleY: 1 };

        return { torso, head, armLeft, armRight, legLeft, legRight };
      }

      case 'cast': {
        const floatBob = Math.sin(angle) * 2.8 + 2;
        const pulse = Math.sin(angle * 2) * 0.08;
        const torso: BoneTransform = { x: 0, y: -24 - floatBob, rotation: -0.06, scaleX: 1, scaleY: 1 };
        const head: BoneTransform = { x: 0, y: torso.y - 18, rotation: -0.15 + pulse * 0.5, scaleX: 1, scaleY: 1 };
        const armLeft: BoneTransform = { x: -9, y: torso.y - 8, rotation: -1.9 + pulse, scaleX: 1, scaleY: 1 };
        const armRight: BoneTransform = { x: 9, y: torso.y - 8, rotation: -1.9 - pulse, scaleX: 1, scaleY: 1 };
        const legLeft: BoneTransform = { x: -5, y: torso.y + 14, rotation: 0.22, scaleX: 1, scaleY: 1 };
        const legRight: BoneTransform = { x: 5, y: torso.y + 14, rotation: 0.18, scaleX: 1, scaleY: 1 };
        return { torso, head, armLeft, armRight, legLeft, legRight };
      }

      case 'hit': {
        const p = phase < 0.25 ? phase / 0.25 : 1 - (phase - 0.25) / 0.75;
        const flinchX = -p * 6;
        const flinchTilt = -p * 0.24;
        const shake = phase < 0.4 ? Math.sin(phase * 40) * 1.5 : 0;
        const torso: BoneTransform = { x: flinchX + shake, y: -21, rotation: flinchTilt, scaleX: 1, scaleY: 1 };
        const head: BoneTransform = { x: flinchX * 0.5, y: torso.y - 18, rotation: -p * 0.32, scaleX: 1, scaleY: 1 };
        const armLeft: BoneTransform = { x: -9, y: torso.y - 8, rotation: 0.6 + flinchTilt, scaleX: 1, scaleY: 1 };
        const armRight: BoneTransform = { x: 9, y: torso.y - 8, rotation: 0.7 + flinchTilt, scaleX: 1, scaleY: 1 };
        const legLeft: BoneTransform = { x: -5, y: torso.y + 14, rotation: 0.35, scaleX: 1, scaleY: 1 };
        const legRight: BoneTransform = { x: 5, y: torso.y + 14, rotation: -0.25, scaleX: 1, scaleY: 1 };
        return { torso, head, armLeft, armRight, legLeft, legRight };
      }
    }
  }

  /**
   * Determine current active Spine action state from Player attributes
   */
  public static detectPlayerAction(
    player: Player | null,
    forceRun: boolean = false,
    forceAttack: boolean = false
  ): SpineActionType {
    if (!player) {
      if (forceAttack) return 'slash';
      if (forceRun) return 'run';
      return 'idle';
    }

    if (player.hurtTimer > 0) {
      return 'hit';
    }
    const isGreatsword = player.equipment?.weapon?.subType === 'greatsword';
    if (player.isChargingAttack || (player.attackTimer > 0 && (player.comboStep === 2 || isGreatsword))) {
      return 'charge_slam';
    }
    if (player.isAttacking || player.attackTimer > 0) {
      return 'slash';
    }
    if (player.isCastingSpell || (player.castLockTimer && player.castLockTimer > 0)) {
      return 'cast';
    }
    const isMoving = Math.abs(player.vx) > 0.05 || Math.abs(player.vy) > 0.05;
    if (isMoving) {
      return 'run';
    }
    return 'idle';
  }

  // WeakMap cache of Animation Blender per Player instance to support seamless 0.2s cross-fading
  private static playerBlenders = new WeakMap<Player, SpineAnimationBlender>();
  private static lastPlayerTime = new WeakMap<Player, number>();

  public static getPlayerBlender(player: Player): SpineAnimationBlender | undefined {
    return this.playerBlenders.get(player);
  }

  public static getOrCreatePlayerBlender(player: Player): SpineAnimationBlender {
    let blender = this.playerBlenders.get(player);
    if (!blender) {
      blender = new SpineAnimationBlender('idle', (action, t) => this.computeActionPose(action, t, false, player));
      this.playerBlenders.set(player, blender);
    }
    return blender;
  }

  /**
   * Compute hierarchical Spine pose with 0.2s cross-fading between locomotion and combat states.
   */
  public static computeBlendedPose(
    player: Player,
    time: number,
    dt?: number
  ): SkeletonPose {
    const blender = this.getOrCreatePlayerBlender(player);
    if (!this.lastPlayerTime.has(player)) {
      this.lastPlayerTime.set(player, time);
    }

    const prevTime = this.lastPlayerTime.get(player) ?? time;
    this.lastPlayerTime.set(player, time);
    const calculatedDt = dt ?? Math.min(0.1, Math.max(0.001, time - prevTime || 0.016));

    const targetAction = this.detectPlayerAction(player);
    const isAttackingNow = targetAction === 'slash' || targetAction === 'charge_slam';
    if (isAttackingNow && blender.getCurrentAction() !== targetAction) {
      blender.switchAction(targetAction, 0.03, true);
    }
    const currentSpeed = Math.hypot(player.vx, player.vy);
    const speedMultiplier = targetAction === 'run' ? Math.max(0.7, Math.min(1.8, currentSpeed / 3.8)) : 1.0;

    return blender.evaluate(targetAction, time, calculatedDt, speedMultiplier);
  }

  /**
   * Main runtime adapter: Compute hierarchical Spine pose based on in-game Player state
   */
  public static computePose(
    player: Player | null,
    time: number,
    forceRun: boolean = false,
    forceAttack: boolean = false
  ): SkeletonPose {
    if (player) {
      return this.computeBlendedPose(player, time);
    }

    const action = this.detectPlayerAction(null, forceRun, forceAttack);
    return this.computeActionPose(action, time);
  }
}
