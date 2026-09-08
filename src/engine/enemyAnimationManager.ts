import { Enemy } from '../types';

export interface EnemyPose {
  leftArmAngle: number;
  rightArmAngle: number;
  leftLegAngle: number;
  rightLegAngle: number;
  bodyBob: number;
  bodyTilt: number;
  headTilt: number;
  scaleX: number;
  scaleY: number;
  alpha: number;
  deathTopple: number;
  hitFlinchX: number;
  hitFlinchY: number;
  isHitFlashing: boolean;
  attackLunge: number;
  eyeScale: number;
}

export class EnemyAnimationManager {
  /**
   * Compute smooth procedural animation pose and keyframe transitions for any enemy
   */
  public getPose(enemy: Enemy, time: number): EnemyPose {
    const state = enemy.animState || (enemy.isDying ? 'death' : 'idle');
    const animTimer = enemy.animTimer || time;
    const limbSwing = enemy.limbSwing || (time * 8 + enemy.x * 2);

    let leftArmAngle = 0;
    let rightArmAngle = 0;
    let leftLegAngle = 0;
    let rightLegAngle = 0;
    let bodyBob = 0;
    let bodyTilt = 0;
    let headTilt = 0;
    let scaleX = 1.0;
    let scaleY = 1.0;
    let alpha = 1.0;
    let deathTopple = 0;
    let hitFlinchX = 0;
    let hitFlinchY = 0;
    let isHitFlashing = false;
    let attackLunge = 0;
    let eyeScale = 1.0;

    switch (state) {
      case 'idle': {
        // Breathing rhythm & subtle sway
        bodyBob = Math.sin(time * 3 + enemy.x) * 1.5;
        leftArmAngle = Math.sin(time * 2.5) * 0.12;
        rightArmAngle = -Math.sin(time * 2.5) * 0.12;
        headTilt = Math.sin(time * 1.8) * 0.06;
        scaleX = 1.0 + Math.sin(time * 3) * 0.03;
        scaleY = 1.0 - Math.sin(time * 3) * 0.03;
        break;
      }

      case 'walk': {
        // Opposing limbs swing with natural gait
        const swing = Math.sin(limbSwing);
        leftLegAngle = swing * 0.55;
        rightLegAngle = -swing * 0.55;
        leftArmAngle = -swing * 0.45;
        rightArmAngle = swing * 0.45;
        bodyBob = Math.abs(Math.sin(limbSwing)) * 2.2;
        bodyTilt = 0.08;
        headTilt = Math.sin(limbSwing * 0.5) * 0.08;
        break;
      }

      case 'windup': {
        // Tension build-up, weapons raised high, shudder tremor
        const tremble = Math.sin(time * 40) * 1.2;
        hitFlinchX = tremble;
        bodyBob = -2.0;
        leftArmAngle = -1.2;
        rightArmAngle = -1.2;
        bodyTilt = -0.15;
        scaleY = 1.08;
        scaleX = 0.94;
        eyeScale = 1.35;
        break;
      }

      case 'attack': {
        // Snappy forward strike / slash extension
        const p = enemy.attackAnimProgress || 0; // 1 -> 0
        attackLunge = p * 6;
        bodyTilt = 0.25 * p;
        leftArmAngle = 0.8 * p;
        rightArmAngle = 1.4 * p;
        bodyBob = 1.5 * p;
        scaleX = 1.1;
        scaleY = 0.92;
        break;
      }

      case 'hit': {
        // Recoil back, shudder & flash
        isHitFlashing = true;
        const flinchProgress = Math.min(1.0, enemy.hitTimer / 0.25);
        bodyTilt = -0.3 * flinchProgress;
        hitFlinchX = (Math.random() - 0.5) * 3 * flinchProgress;
        hitFlinchY = -flinchProgress * 2;
        leftArmAngle = -0.5;
        rightArmAngle = -0.5;
        scaleX = 0.9;
        scaleY = 1.1;
        break;
      }

      case 'knockback': {
        // High-impact violent knockback frames: body swept backwards, flailing limbs, skidding squash/stretch
        isHitFlashing = true;
        const kbTotal = Math.max(0.1, enemy.knockbackDuration || 0.4);
        const kbProgress = Math.min(1.0, (enemy.knockbackTimer || 0) / kbTotal);
        // Violent backward recoil tilt & head snap
        bodyTilt = -0.65 * kbProgress;
        headTilt = -0.45 * kbProgress;
        // Arms flung back defensively
        leftArmAngle = -1.4 * kbProgress;
        rightArmAngle = -1.4 * kbProgress;
        // Legs swept off-ground / staggered stumble
        leftLegAngle = -0.65 * kbProgress;
        rightLegAngle = -0.4 * kbProgress;
        // Impact squash and slide horizontal stretch
        scaleX = 1.25 * kbProgress + 1.0 * (1 - kbProgress);
        scaleY = 0.82 * kbProgress + 1.0 * (1 - kbProgress);
        // Stagger tremor shudder
        hitFlinchX = (Math.random() - 0.5) * 5.0 * kbProgress;
        hitFlinchY = -kbProgress * 3.5;
        bodyBob = -kbProgress * 4.0;
        break;
      }

      case 'death': {
        // Topple over 90 degrees and fade to smoke
        const dProgress = Math.min(1.0, (enemy.deathTimer || 0) / 0.45);
        deathTopple = dProgress * (Math.PI / 2);
        alpha = Math.max(0, 1.0 - dProgress);
        bodyBob = dProgress * 6;
        bodyTilt = deathTopple;
        break;
      }
    }

    // Slime custom vertical squash & stretch override
    if (enemy.type === 'slime' && enemy.slimeScaleY !== undefined) {
      scaleY = enemy.slimeScaleY;
      scaleX = 1 / Math.sqrt(Math.max(0.2, scaleY));
    }

    // Creeper countdown swelling and high-frequency tremor
    if (enemy.type === 'creeper' && (enemy.creeperSwell || 0) > 0) {
      const swell = enemy.creeperSwell || 0;
      scaleX = 1.0 + swell * 0.45;
      scaleY = 1.0 + swell * 0.55;
      hitFlinchX = (Math.random() - 0.5) * swell * 5;
      hitFlinchY = (Math.random() - 0.5) * swell * 2;
      isHitFlashing = Math.sin(time * 30) > 0;
    }

    // Spider pounce leap pose (legs splayed backward, head raised)
    if (enemy.type === 'spider' && enemy.isPouncing) {
      bodyTilt = 0.35;
      leftLegAngle = -0.7;
      rightLegAngle = -0.7;
      bodyBob = -4;
    }

    // Blaze airborne hover oscillation
    if (enemy.type === 'blaze') {
      bodyBob += Math.sin(time * 4 + (enemy.blazeHoverPhase || 0)) * 3.5;
    }

    // Enderman erratic phase jitter
    if (enemy.type === 'enderman' && enemy.state === 'chase') {
      hitFlinchX += (Math.random() - 0.5) * 1.5;
    }

    return {
      leftArmAngle,
      rightArmAngle,
      leftLegAngle,
      rightLegAngle,
      bodyBob,
      bodyTilt,
      headTilt,
      scaleX,
      scaleY,
      alpha,
      deathTopple,
      hitFlinchX,
      hitFlinchY,
      isHitFlashing,
      attackLunge,
      eyeScale,
    };
  }
}

export const enemyAnimationManager = new EnemyAnimationManager();
