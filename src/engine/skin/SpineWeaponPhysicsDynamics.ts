import { WeaponPhysicsCategory, WeaponPhysicsDynamics, ParticleTrailPoint } from './spineFineKinematicsTypes';
import { Player, WeaponSubType } from '../../types';

/**
 * Calculates inertial trajectory, wrist lag, impact recoil oscillation,
 * and particle emission based on equipped weapon archetype.
 */
export class SpineWeaponPhysicsDynamics {
  /**
   * Determine physics category from equipped weapon or player class.
   */
  public static resolveCategory(player?: Player | null): WeaponPhysicsCategory {
    if (!player || !player.equipment?.weapon) {
      if (player?.characterClass === 'mage') return 'staff';
      if (player?.characterClass === 'rogue') return 'light';
      return 'medium';
    }

    const subType = player.equipment.weapon.subType as WeaponSubType | undefined;
    if (subType === 'greatsword') return 'greatsword';
    if (subType === 'axe' || subType === 'hammer') return 'heavy';
    if (subType === 'staff') return 'staff';
    if (subType === 'wand' || subType === 'dagger') return 'light';
    return 'medium';
  }

  /**
   * Compute dynamic inertia, wrist lag, and rebound oscillation for melee slash.
   */
  public static computeSlashDynamics(
    phase: number,
    category: WeaponPhysicsCategory
  ): WeaponPhysicsDynamics {
    let wristLagAngle = 0;
    let reboundOffsetX = 0;
    let reboundOffsetY = 0;
    const isTwoHanded = category === 'greatsword' || category === 'heavy';

    if (category === 'greatsword' || category === 'heavy') {
      const weightMult = category === 'greatsword' ? 1.35 : 1.1;

      if (phase < 0.28) {
        // Windup: Heavy mass drags hand backward
        const p = phase / 0.28;
        wristLagAngle = (0.18 + p * 0.2) * weightMult;
      } else if (phase < 0.58) {
        // High-velocity downswing: Severe inertial trail lag
        const p = (phase - 0.28) / 0.3;
        // Peak lag at mid-slash
        const lagCurve = Math.sin(p * Math.PI);
        wristLagAngle = (-0.48 * lagCurve) * weightMult;
      } else if (phase < 0.76) {
        // Impact Cut Stop: Violent harmonic damped rebound oscillation
        const p = (phase - 0.58) / 0.18;
        const decay = Math.exp(-p * 5);
        const osc = Math.sin(p * Math.PI * 5);
        wristLagAngle = osc * decay * 0.28 * weightMult;
        reboundOffsetX = osc * decay * 2.5 * weightMult;
        reboundOffsetY = -Math.abs(osc) * decay * 2.0 * weightMult;
      } else {
        // Recovery
        const p = (phase - 0.76) / 0.24;
        wristLagAngle = 0.05 * (1 - p);
      }
    } else if (category === 'light') {
      // Light dagger / rapier: Crisp agile flick
      if (phase >= 0.3 && phase <= 0.6) {
        const p = (phase - 0.3) / 0.3;
        wristLagAngle = Math.sin(p * Math.PI) * 0.12;
      }
    } else {
      // Medium sword
      if (phase >= 0.28 && phase <= 0.58) {
        const p = (phase - 0.28) / 0.3;
        wristLagAngle = -0.22 * Math.sin(p * Math.PI);
      } else if (phase > 0.58 && phase < 0.72) {
        const p = (phase - 0.58) / 0.14;
        wristLagAngle = Math.sin(p * Math.PI * 3) * Math.exp(-p * 3) * 0.1;
      }
    }

    const trailPoints = this.generateSlashTrailParticles(phase, category);

    return {
      category,
      wristLagAngle,
      reboundOffsetX,
      reboundOffsetY,
      isTwoHandedGrip: isTwoHanded,
      trailPoints,
    };
  }

  /**
   * Compute dynamics for magical spellcasting (fingertip trails, gentle micro-tremors).
   */
  public static computeCastDynamics(
    phase: number,
    angle: number,
    category: WeaponPhysicsCategory
  ): WeaponPhysicsDynamics {
    const isLightCaster = category === 'light' || category === 'staff';
    const tremorFreq = isLightCaster ? 16 : 8;
    const tremorAmp = isLightCaster ? 0.06 : 0.03;
    const wristLagAngle = Math.sin(phase * tremorFreq) * tremorAmp;

    const trailPoints: ParticleTrailPoint[] = [];
    if (isLightCaster) {
      // Flowing luminous sparkles emanating from fingertips
      for (let i = 0; i < 4; i++) {
        const t = (phase + i * 0.25) % 1.0;
        trailPoints.push({
          x: Math.sin(t * Math.PI * 2) * 5,
          y: -18 - Math.cos(t * Math.PI * 2) * 6,
          alpha: 0.85 - t * 0.7,
          color: i % 2 === 0 ? '#38bdf8' : '#c084fc',
          radius: 1.8 - t * 0.8,
        });
      }
    }

    return {
      category,
      wristLagAngle,
      reboundOffsetX: 0,
      reboundOffsetY: 0,
      isTwoHandedGrip: false,
      trailPoints,
    };
  }

  /**
   * Generate dynamic particle trails for blade edge or fingertips.
   */
  private static generateSlashTrailParticles(
    phase: number,
    category: WeaponPhysicsCategory
  ): ParticleTrailPoint[] {
    const points: ParticleTrailPoint[] = [];
    if (phase > 0.28 && phase < 0.65) {
      const isGreatsword = category === 'greatsword';
      const color = isGreatsword ? '#f59e0b' : category === 'heavy' ? '#f97316' : '#38bdf8';
      const count = isGreatsword ? 5 : 3;
      for (let i = 0; i < count; i++) {
        const offset = i * 4;
        points.push({
          x: 10 + offset * 0.6,
          y: -10 + offset * 1.8,
          alpha: 0.9 - i * 0.18,
          color,
          radius: isGreatsword ? 2.5 : 1.8,
        });
      }
    }
    return points;
  }
}
