import { Player } from '../../types';
import { MeleeSlashPose, DEFAULT_IDLE_POSE } from './MeleeSlashTypes';
import { attackMotionController } from './motion/PlayerAttackMotionController';

export type { MeleeSlashPose };
export { DEFAULT_IDLE_POSE };

/**
 * Professional 2D Action Kinematics Engine for Melee Attacks.
 * Seamlessly integrates with PlayerAttackMotionController for keyframe-assisted,
 * continuously tweened hand and weapon slashing kinematics.
 */
export class MeleeKinematicsEngine {
  public static evaluateSlashPose(player: Player, time: number): MeleeSlashPose {
    const isAttacking = Boolean(player.isAttacking || (player.attackTimer && player.attackTimer > 0));
    if (!isAttacking) {
      return DEFAULT_IDLE_POSE;
    }

    const subType = player.equipment?.weapon?.subType || 'sword';
    const isGreatsword = subType === 'greatsword';
    const isHeavy = subType === 'axe' || subType === 'hammer';
    const isDagger = subType === 'dagger';
    const isTwoHanded = isGreatsword || isHeavy;
    const comboStep = (player.currentSlashStep !== undefined ? player.currentSlashStep : (player.comboStep || 0)) % 3;

    // Determine attack cycle duration based on weapon & combo step
    let totalDuration = 0.22;
    if (isGreatsword) totalDuration = comboStep === 2 ? 0.44 : 0.32;
    else if (isHeavy) totalDuration = comboStep === 2 ? 0.38 : 0.28;
    else if (isDagger) totalDuration = 0.16;
    else totalDuration = comboStep === 2 ? 0.34 : 0.22;

    const remaining = Math.max(0, player.attackTimer || 0);
    // phase: 0.0 (start of slash) -> 1.0 (finish/recovery)
    const phase = Math.min(1.0, Math.max(0, 1.0 - remaining / totalDuration));

    // Evaluate pose via Keyframe-Assisted Tween Controller
    return attackMotionController.evaluatePose(phase, comboStep, subType, isTwoHanded);
  }
}
