import { Player, Enemy } from '../../types';

export class BeastCollisionResolver {
  /**
   * Returns effective collision hitbox radius for the player.
   * Human form: 0.28, Wild Shape Bear: 0.65 (bulky beast body).
   */
  public static getEffectiveHitboxRadius(player: Player): number {
    if (player.wildShapeForm === 'bear' && (player.wildShapeTimer || 0) > 0) {
      return 0.65;
    }
    return player.hitboxRadius || 0.28;
  }

  /**
   * Resolves physical body mass displacement between the beast player and surrounding enemies.
   * Pushes lighter enemies outward when the wild beast steps forward or collides.
   */
  public static resolveBeastEnemyPush(
    player: Player,
    enemies: Enemy[],
    dt: number,
    spawnParticle?: (p: any) => void
  ) {
    const isBear = player.wildShapeForm === 'bear' && (player.wildShapeTimer || 0) > 0;
    const playerRadius = this.getEffectiveHitboxRadius(player);
    const isMoving = Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1;
    const beastSpeed = Math.hypot(player.vx, player.vy);

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.isDying || enemy.hp <= 0) continue;

      const enemyRadius = (enemy.size || 1) * 0.35;
      const minDist = playerRadius + enemyRadius;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist && dist > 0.0001) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        if (isBear) {
          // Massive Beast Displacement: Bear pushes enemy away strongly!
          const pushWeight = isMoving ? 9.5 + beastSpeed * 1.5 : 5.0;
          enemy.x += nx * overlap * Math.min(1.0, dt * 14);
          enemy.y += ny * overlap * Math.min(1.0, dt * 14);

          // Give enemy a lingering outward velocity
          enemy.vx += nx * pushWeight * dt;
          enemy.vy += ny * pushWeight * dt;

          // Minor player reaction pushback (bear is heavy, only nudged slightly)
          player.x -= nx * overlap * 0.15;
          player.y -= ny * overlap * 0.15;

          // Impact dust when plowing into mob
          if (isMoving && Math.random() < 0.25 && spawnParticle) {
            spawnParticle({
              x: enemy.x,
              y: enemy.y,
              z: 0.2,
              vx: nx * 2,
              vy: ny * 2,
              vz: 0.5,
              life: 0.3,
              maxLife: 0.3,
              color: '#78350f',
              size: 0.18,
              type: 'smoke',
            });
          }
        } else {
          // Normal equal mutual separation
          const sep = overlap * 0.5;
          player.x -= nx * sep;
          player.y -= ny * sep;
          enemy.x += nx * sep;
          enemy.y += ny * sep;
        }
      }
    }
  }
}
