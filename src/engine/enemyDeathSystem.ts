import { Enemy, DungeonFloor, Particle } from '../types';
import { soundManager } from '../audio/soundManager';
import { vfxSystem } from './vfxSystem';

export interface DeathSystemCallbacks {
  addFloatingText: (x: number, y: number, text: string, color: string, size?: number, isCrit?: boolean) => void;
  spawnParticle: (particle: Particle) => void;
  onTrueDeath: (enemy: Enemy) => void;
  triggerScreenShake?: (duration: number, intensity: number) => void;
}

/**
 * Handles unique death behaviors:
 * 1. Zombie / Armored Zombie resurrection mechanics ("Reviving Undead")
 * 2. Skeleton shattering into collidable bone pile obstacles
 */
export class EnemyDeathSystem {
  /**
   * Evaluates if enemy should execute a unique death behavior instead of standard death.
   * Returns true if special death flow took over (e.g. falling into downed revival).
   */
  public handleDeathTrigger(
    enemy: Enemy,
    floor: DungeonFloor,
    callbacks: DeathSystemCallbacks
  ): boolean {
    // 1. ZOMBIE / ARMORED ZOMBIE RESURRECTION
    if (
      (enemy.type === 'zombie' || enemy.type === 'armored_zombie') &&
      !enemy.hasRevived &&
      !enemy.isBoss
    ) {
      const reviveChance = enemy.type === 'armored_zombie' ? 0.65 : 0.48;
      if (Math.random() < reviveChance) {
        enemy.hasRevived = true;
        enemy.isReviving = true;
        enemy.reviveTimer = 2.4;
        enemy.state = 'reviving';
        enemy.animState = 'death';
        enemy.hp = 0;
        enemy.vx = 0;
        enemy.vy = 0;

        soundManager.playUndeadRevive();
        callbacks.addFloatingText(
          enemy.x,
          enemy.y - 0.3,
          '⚰️ 亡者抽搐... [复生中]',
          '#e879f9',
          14,
          true
        );

        // Spawn eerie necrotic motes
        for (let i = 0; i < 8; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 1.2;
          callbacks.spawnParticle({
            x: enemy.x + (Math.random() - 0.5) * 0.6,
            y: enemy.y + (Math.random() - 0.5) * 0.6,
            z: 0.1,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vz: 0.8 + Math.random() * 1.2,
            color: '#a855f7',
            size: 2.8,
            life: 0.8,
            maxLife: 0.8,
            gravity: -1.0, // Rise like ghostly wisps
          });
        }

        return true; // Special death handled (deferred)
      }
    }

    // 2. SKELETON SHATTERS INTO COLLIDABLE BONE PILE OBSTACLE
    if (enemy.type === 'skeleton') {
      this.spawnSkeletonBonePile(enemy, floor, callbacks);
    }

    return false; // Proceed to standard death
  }

  /**
   * Spawns a physical collidable Bone Pile obstacle where the skeleton fell.
   */
  private spawnSkeletonBonePile(
    enemy: Enemy,
    floor: DungeonFloor,
    callbacks: DeathSystemCallbacks
  ): void {
    soundManager.playSkeletonShatter();

    const tx = Math.floor(enemy.x + 0.5);
    const ty = Math.floor(enemy.y + 0.5);

    // Place obstacle on walkable tile
    if (
      ty >= 0 &&
      ty < floor.height &&
      tx >= 0 &&
      tx < floor.width &&
      (floor.tiles[ty][tx] === 'floor' ||
        floor.tiles[ty][tx] === 'grass' ||
        floor.tiles[ty][tx] === 'road')
    ) {
      floor.tiles[ty][tx] = 'bone_pile';
      callbacks.addFloatingText(enemy.x, enemy.y - 0.2, '🦴 碎裂骨架阻挡!', '#cbd5e1', 13);
    }

    // Explode into bone fragments & flying skull debris
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 2.8;
      callbacks.spawnParticle({
        x: enemy.x,
        y: enemy.y,
        z: 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 2.2 + Math.random() * 3.5,
        color: i % 3 === 0 ? '#f8fafc' : i % 3 === 1 ? '#e2e8f0' : '#94a3b8',
        size: 3.2,
        life: 0.7,
        maxLife: 0.7,
        gravity: 12.0,
      });
    }

    if (callbacks.triggerScreenShake) {
      callbacks.triggerScreenShake(0.03, 0.18);
    }
  }

  /**
   * Updates reviving undead zombies. Handles timer expiration and resurrection shockwave.
   */
  public updateRevivingEnemy(
    enemy: Enemy,
    dt: number,
    callbacks: DeathSystemCallbacks
  ): void {
    if (!enemy.isReviving) return;

    enemy.vx *= 0.5;
    enemy.vy *= 0.5;
    enemy.reviveTimer = (enemy.reviveTimer || 0) - dt;

    // Pulse necrotic particles from the downed corpse
    if (Math.random() < 0.25) {
      callbacks.spawnParticle({
        x: enemy.x + (Math.random() - 0.5) * 0.5,
        y: enemy.y + (Math.random() - 0.5) * 0.5,
        z: 0.05,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: 1.0 + Math.random() * 0.8,
        color: '#22c55e',
        size: 2.2,
        life: 0.5,
        maxLife: 0.5,
        gravity: -1.5,
      });
    }

    // Timer finished -> Complete Resurrection!
    if (enemy.reviveTimer <= 0) {
      enemy.isReviving = false;
      enemy.isDying = false;
      enemy.state = 'chase';
      enemy.animState = 'idle';
      enemy.hp = Math.round(enemy.maxHp * 0.55);
      enemy.isEnraged = true;
      enemy.speed = enemy.speed * 1.25;

      soundManager.playUndeadRevive();
      vfxSystem.spawnShockwave(enemy.x, enemy.y, 0, 2.8, '#22c55e', true, 0.35);

      callbacks.addFloatingText(
        enemy.x,
        enemy.y - 0.5,
        '🧟 亡灵复生! (Undead Revival)',
        '#4ade80',
        17,
        true
      );

      if (callbacks.triggerScreenShake) {
        callbacks.triggerScreenShake(0.06, 0.32);
      }
    }
  }

  /**
   * Premature execution: player hits a downed zombie while it's reviving,
   * canceling resurrection and delivering a rewarding execution kill!
   */
  public executeDownedEnemy(
    enemy: Enemy,
    callbacks: DeathSystemCallbacks
  ): void {
    if (!enemy.isReviving) return;

    enemy.isReviving = false;
    enemy.hp = 0;
    enemy.isDying = true;
    enemy.animState = 'death';
    enemy.deathTimer = 0;

    vfxSystem.spawnExplosion(enemy.x, enemy.y, 1.6, '#ef4444');
    callbacks.addFloatingText(enemy.x, enemy.y - 0.4, '⚡ 处决! 彻底消灭', '#ef4444', 16, true);
    callbacks.onTrueDeath(enemy);
  }
}

export const enemyDeathSystem = new EnemyDeathSystem();
