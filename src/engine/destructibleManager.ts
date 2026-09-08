import { DungeonFloor, TileType, Particle, DropItem } from '../types';
import { soundManager } from '../audio/soundManager';
import { tileChunkCache } from './perf/TileChunkCache';

export interface DestructibleCallbacks {
  spawnParticle: (particle: Particle) => void;
  spawnDrop?: (drop: Omit<DropItem, 'vx' | 'vy' | 'vz' | 'bounces' | 'maxBounces' | 'isGrounded' | 'rotation' | 'rotationSpeed' | 'impactWaveTimer' | 'spawnTime'>) => void;
  addFloatingText: (x: number, y: number, text: string, color: string, size: number) => void;
  triggerScreenShake?: (intensity: number, duration: number) => void;
}

export class DestructibleManager {
  /**
   * Check if a tile type is destructible
   */
  public isDestructible(tile: TileType): boolean {
    return (
      tile === 'barrel' ||
      tile === 'urn' ||
      tile === 'bush' ||
      tile === 'vines' ||
      tile === 'pillar' ||
      tile === 'bone_pile'
    );
  }

  /**
   * Break a tile at (tx, ty) in the dungeon floor
   */
  public breakTile(
    tx: number,
    ty: number,
    floor: DungeonFloor,
    callbacks: DestructibleCallbacks
  ): boolean {
    if (ty < 0 || ty >= floor.height || tx < 0 || tx >= floor.width) return false;
    const tile = floor.tiles[ty]?.[tx];
    if (!tile || !this.isDestructible(tile)) return false;

    // Convert tile back to natural walkable floor
    const replacementTile: TileType = floor.zoneType === 'overworld' ? 'grass' : 'floor';
    floor.tiles[ty][tx] = replacementTile;
    tileChunkCache.invalidateTile(tx, ty);

    const worldX = tx + 0.5;
    const worldY = ty + 0.5;

    switch (tile) {
      case 'barrel':
        this.breakBarrel(worldX, worldY, callbacks);
        break;
      case 'urn':
        this.breakUrn(worldX, worldY, callbacks);
        break;
      case 'bush':
      case 'vines':
        this.breakFoliage(worldX, worldY, tile, callbacks);
        break;
      case 'pillar':
        this.breakPillar(worldX, worldY, callbacks);
        break;
      case 'bone_pile':
        this.breakBonePile(worldX, worldY, callbacks);
        break;
    }

    if (callbacks.triggerScreenShake) {
      callbacks.triggerScreenShake(0.18, 0.12);
    }

    return true;
  }

  /**
   * Check and break any destructible tiles in an attack arc / AoE
   */
  public checkAttackDestructibles(
    originX: number,
    originY: number,
    range: number,
    facingAngle: number,
    arcSpan: number,
    floor: DungeonFloor,
    callbacks: DestructibleCallbacks
  ): number {
    let brokenCount = 0;
    const minTileX = Math.max(0, Math.floor(originX - range - 0.5));
    const maxTileX = Math.min(floor.width - 1, Math.ceil(originX + range + 0.5));
    const minTileY = Math.max(0, Math.floor(originY - range - 0.5));
    const maxTileY = Math.min(floor.height - 1, Math.ceil(originY + range + 0.5));

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tile = floor.tiles[ty]?.[tx];
        if (tile && this.isDestructible(tile)) {
          const tileCenterX = tx + 0.5;
          const tileCenterY = ty + 0.5;
          const dx = tileCenterX - originX;
          const dy = tileCenterY - originY;
          const dist = Math.hypot(dx, dy);

          if (dist <= range + 0.4) {
            // Arc check if arcSpan < 2*PI
            let inArc = true;
            if (arcSpan < Math.PI * 1.95) {
              const angle = Math.atan2(dy, dx);
              let diff = Math.abs(angle - facingAngle);
              while (diff > Math.PI) diff -= Math.PI * 2;
              inArc = Math.abs(diff) <= arcSpan / 2 + 0.35;
            }

            if (inArc) {
              if (this.breakTile(tx, ty, floor, callbacks)) {
                brokenCount++;
              }
            }
          }
        }
      }
    }
    return brokenCount;
  }

  private breakBarrel(x: number, y: number, cb: DestructibleCallbacks): void {
    soundManager.playBreakWood();
    cb.addFloatingText(x, y, '木桶破碎', '#f59e0b', 13);

    // Wooden splinters flying outward in 3D
    for (let i = 0; i < 9; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.4 + Math.random() * 2.6;
      cb.spawnParticle({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + (Math.random() - 0.5) * 0.4,
        z: 0.2 + Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 2.2 + Math.random() * 3.2,
        color: Math.random() < 0.6 ? '#78350f' : '#b45309',
        size: 3.5 + Math.random() * 2.5,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        gravity: 12,
        type: 'splinter',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 12,
      });
    }

    // Barrel loot roll (emeralds or food)
    if (cb.spawnDrop) {
      const rand = Math.random();
      if (rand < 0.48) {
        cb.spawnDrop({
          id: `drop_destructible_${Date.now()}_${Math.random()}`,
          isEmerald: true,
          amount: 1 + Math.floor(Math.random() * 3),
          rarity: 'common',
          name: '绿宝石',
          color: '#10b981',
          x,
          y,
          z: 0.3,
        });
      } else if (rand < 0.72) {
        cb.spawnDrop({
          id: `drop_destructible_${Date.now()}_${Math.random()}`,
          isExp: true,
          amount: 8 + Math.floor(Math.random() * 12),
          rarity: 'common',
          name: '经验球',
          color: '#84cc16',
          x,
          y,
          z: 0.3,
        });
      }
    }
  }

  private breakUrn(x: number, y: number, cb: DestructibleCallbacks): void {
    soundManager.playBreakUrn();
    cb.addFloatingText(x, y, '陶罐粉碎', '#ea580c', 13);

    // Terracotta ceramic shards
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 2.8;
      cb.spawnParticle({
        x,
        y,
        z: 0.25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 2.5 + Math.random() * 3.5,
        color: Math.random() < 0.5 ? '#c2410c' : '#ea580c',
        size: 3 + Math.random() * 2.5,
        life: 0.55 + Math.random() * 0.3,
        maxLife: 0.85,
        gravity: 14,
        type: 'shard',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 14,
      });
    }

    if (cb.spawnDrop && Math.random() < 0.55) {
      cb.spawnDrop({
        id: `drop_urn_${Date.now()}_${Math.random()}`,
        isEmerald: true,
        amount: 2 + Math.floor(Math.random() * 4),
        rarity: 'magic',
        name: '陶罐藏金',
        color: '#10b981',
        x,
        y,
        z: 0.3,
      });
    }
  }

  private breakFoliage(x: number, y: number, tile: TileType, cb: DestructibleCallbacks): void {
    soundManager.playBreakFoliage();
    cb.addFloatingText(x, y, tile === 'vines' ? '斩断藤蔓' : '灌木粉碎', '#22c55e', 12);

    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.0;
      cb.spawnParticle({
        x: x + (Math.random() - 0.5) * 0.3,
        y: y + (Math.random() - 0.5) * 0.3,
        z: 0.15 + Math.random() * 0.25,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 1.8 + Math.random() * 2.2,
        color: Math.random() < 0.5 ? '#16a34a' : '#4ade80',
        size: 3.5 + Math.random() * 2,
        life: 0.5 + Math.random() * 0.25,
        maxLife: 0.75,
        gravity: 8,
        type: 'leaf',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }
  }

  private breakPillar(x: number, y: number, cb: DestructibleCallbacks): void {
    soundManager.playBreakStone();
    cb.addFloatingText(x, y, '石柱崩塌', '#94a3b8', 14);

    for (let i = 0; i < 11; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 3.0;
      cb.spawnParticle({
        x,
        y,
        z: 0.4 + Math.random() * 0.4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 2.8 + Math.random() * 3.8,
        color: Math.random() < 0.5 ? '#64748b' : '#94a3b8',
        size: 4 + Math.random() * 3,
        life: 0.7 + Math.random() * 0.3,
        maxLife: 1.0,
        gravity: 15,
        type: 'shard',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }
  }

  private breakBonePile(x: number, y: number, cb: DestructibleCallbacks): void {
    soundManager.playSkeletonShatter();
    cb.addFloatingText(x, y, '🦴 碎骨迸裂!', '#cbd5e1', 14);

    for (let i = 0; i < 9; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      cb.spawnParticle({
        x,
        y,
        z: 0.2 + Math.random() * 0.3,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 2.0 + Math.random() * 2.5,
        color: i % 2 === 0 ? '#f8fafc' : '#cbd5e1',
        size: 3 + Math.random() * 2,
        life: 0.6 + Math.random() * 0.2,
        maxLife: 0.8,
        gravity: 14,
        type: 'shard',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }
  }
}

export const destructibleManager = new DestructibleManager();
