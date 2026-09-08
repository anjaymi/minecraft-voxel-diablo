import { MotionEasingType } from './AttackMotionTypes';

/**
 * Easing Curves & Shortest-Angular Distance Interpolator for Smooth Slashing Motion.
 */
export class AttackMotionEasing {
  /**
   * Apply named easing function to normalized progress [0.0 - 1.0].
   */
  public static ease(t: number, type: MotionEasingType = 'easeInOutQuad'): number {
    const p = Math.max(0, Math.min(1, t));
    switch (type) {
      case 'linear':
        return p;
      case 'easeInQuad':
        return p * p;
      case 'easeOutQuad':
        return p * (2 - p);
      case 'easeInOutQuad':
        return p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      case 'easeInCubic':
        return p * p * p;
      case 'easeOutCubic': {
        const u = p - 1;
        return u * u * u + 1;
      }
      case 'easeInOutCubic':
        return p < 0.5 ? 4 * p * p * p : (p - 1) * (2 * p - 2) * (2 * p - 2) + 1;
      case 'snapWhip': {
        // Sudden whip explosion in first 35%, followed by locked impact
        if (p < 0.35) {
          const norm = p / 0.35;
          return norm * norm * norm;
        }
        const tail = (p - 0.35) / 0.65;
        return 1.0 + Math.sin(tail * Math.PI) * 0.04;
      }
      case 'elasticHit': {
        // Impact hit stop with decaying harmonic tremble
        if (p <= 0.1) return p * 10;
        const decay = Math.exp(-p * 5);
        return 1.0 - decay * Math.cos(p * Math.PI * 8) * 0.12;
      }
      default:
        return p;
    }
  }

  /**
   * Standard linear scalar interpolation.
   */
  public static lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Shortest-arc Angular Lerp (prevents 360-degree unneeded spins).
   * Computes clean path across circular boundaries [-PI, +PI].
   */
  public static lerpAngle(a: number, b: number, t: number): number {
    let diff = (b - a) % (Math.PI * 2);
    if (diff > Math.PI) {
      diff -= Math.PI * 2;
    } else if (diff < -Math.PI) {
      diff += Math.PI * 2;
    }
    return a + diff * t;
  }

  /**
   * Normalize an angle to [-PI, +PI].
   */
  public static normalizeAngle(rad: number): number {
    let a = rad % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
}
