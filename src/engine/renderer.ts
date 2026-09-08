import { DungeonFloor, Player, Enemy, Projectile, DropItem, Particle, FloatingText, NPC, SummonedMinion } from '../types';
import { worldToScreen, TILE_WIDTH, TILE_HEIGHT, BLOCK_HEIGHT } from './isometric';
import { RARITY_COLORS } from './lootSystem';
import { vfxSystem } from './vfxSystem';
import { shadowSystem } from './shadowSystem';
import { weatherSystem } from './weatherSystem';
import { enemyAnimationManager } from './enemyAnimationManager';
import { elementalSystem } from './elementalSystem';
import { drawSpecialEnemyModel } from './specialEnemyRenderer';
import { MinionRenderer } from './minionRenderer';
import { WildShapeRenderer } from './wildShapeRenderer';
import { ChargedAttackRenderer } from './combat/ChargedAttackRenderer';
import { PlayerWeaponManager } from './weapons/PlayerWeaponManager';
import { DropWeaponRenderer } from './weapons/DropWeaponRenderer';
import { GoodSmilePlayerRenderer } from './goodsmile/GoodSmilePlayerRenderer';
import { CustomSkinRenderer } from './skin/CustomSkinRenderer';
import { SpineBlendDebugOverlay } from './skin/SpineBlendDebugOverlay';
import { CharacterOrientationManager } from './orientation/CharacterOrientationManager';
import { gameViewportManager } from './camera/GameViewportManager';
import { renderChibiMonsterModel } from './chibi/ChibiMonsterDispatcher';
import { drawWaterTile } from './render/WaterRenderer';
import { drawGroundDecor, drawTree } from './render/VegetationRenderer';
import { drawTallVegetation } from './render/TallVegetationRenderer';
import { drawTower, drawWell, drawBiomeGate, drawKeepGate } from './render/StructureRenderer';
import { drawMarketStall, drawBed, drawTable, drawCounter } from './render/FurnitureRenderer';
import { drawTownDoor } from './render/TownDoorRenderer';
import { getTownLook } from './render/TownStyles';
import { drawBiomeGround, BIOME_GROUND_TILES } from './render/BiomeGroundRenderer';
import { drawNpcHumanoid } from './render/NpcHumanoidRenderer';
import { tileChunkCache } from './perf/TileChunkCache';
import { perfManager } from './perf/PerformanceManager';
import { bloodMoonSystem } from './monsters/BloodMoonSystem';
import { AdventurerEntity } from './adventurers/AdventurerActor';
import { drawAdventurer, drawBanditAdventurer } from './adventurers/AdventurerRenderer';
import { diamondPath } from './render/IsoPrimitives';
import { cameraShakeSystem } from './camera/CameraShakeSystem';
import { summonVFXSystem } from './vfx/SummonVFXSystem';
import { WeaponBoneOffsetCompensator, WeaponBoneDeviationResult } from './weapons/WeaponBoneOffsetCompensator';
import { MeleeKinematicsEngine } from './combat/MeleeKinematicsEngine';
import { MeleeSlashPose } from './combat/MeleeSlashTypes';
import { weaponSocketAdapter } from './weapons/WeaponSocketAdapter';
import { AttackAimSolver } from './combat/attackAimSolver';

export { WeaponBoneOffsetCompensator, type WeaponBoneDeviationResult };

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private lastGameTime: number = 0;
  private zoneBannerTimer: number = 0;
  private lastZoneName: string = '';

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public showHitboxes: boolean = false;
  public showBlendDebug: boolean = false;

  public triggerScreenShake(duration: number = 0.12, intensity: number = 0.35) {
    cameraShakeSystem.trigger(duration, intensity);
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
  }

  public render(
    floor: DungeonFloor,
    player: Player,
    enemies: Enemy[],
    npcs: NPC[],
    projectiles: Projectile[],
    drops: DropItem[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    adventurers: AdventurerEntity[],
    rawCamX: number,
    rawCamY: number,
    gameTime: number,
    mouseWorldX?: number,
    mouseWorldY?: number,
    showHitboxes?: boolean,
    showBlendDebug?: boolean,
    hitStop?: boolean | number
  ) {
    const ctx = this.ctx;
    // 不透明画布（GPU 加速 alpha:false）下 clearRect 即为黑底，
    // 紧随的整屏径向渐变背景会完全覆盖，无需分支处理。
    ctx.clearRect(0, 0, this.width, this.height);

    const dt = Math.min(0.1, Math.max(0.001, gameTime - (this.lastGameTime || gameTime - 0.016)));
    this.lastGameTime = gameTime;

    // 0. Update Summon VFX lifecycle
    summonVFXSystem.update(dt);

    // 0.5 Screen Shake Visual Jitter:
    // Applies stochastic micro-offsets to camera during hitStop and on damage events
    const { camX, camY } = cameraShakeSystem.updateAndApply(rawCamX, rawCamY, hitStop, dt);

    if (floor.zoneName && floor.zoneName !== this.lastZoneName) {
      this.lastZoneName = floor.zoneName;
      this.zoneBannerTimer = 3.8;
    }

    weatherSystem.update(dt, floor.weather || 'clear', this.width, this.height, floor.isIndoor);

    // Deep dungeon or open sky ambient background
    const bgGradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 50,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.8
    );
    if (floor.zoneType === 'town') {
      bgGradient.addColorStop(0, '#0f766e');
      bgGradient.addColorStop(1, '#022c22');
    } else if (floor.zoneType === 'overworld') {
      bgGradient.addColorStop(0, '#1e293b');
      bgGradient.addColorStop(1, '#090d16');
    } else if (floor.theme === 'nether') {
      bgGradient.addColorStop(0, '#1c0808');
      bgGradient.addColorStop(1, '#080101');
    } else if (floor.theme === 'end') {
      bgGradient.addColorStop(0, '#0c0818');
      bgGradient.addColorStop(1, '#030108');
    } else {
      bgGradient.addColorStop(0, '#111827');
      bgGradient.addColorStop(1, '#030712');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Global 180% Camera Scene Zoom (applied around viewport midpoint)
    const zoom = gameViewportManager.getZoom();
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-this.width / 2, -this.height / 2);

    // View culling bounds in tile coordinates
    const minTileX = Math.max(0, Math.floor(camX - 18));
    const maxTileX = Math.min(floor.width - 1, Math.ceil(camX + 18));
    const minTileY = Math.max(0, Math.floor(camY - 18));
    const maxTileY = Math.min(floor.height - 1, Math.ceil(camY + 18));

    // 1. Draw floor tiles (z = 0)
    for (let y = minTileY; y <= maxTileY; y++) {
      for (let x = minTileX; x <= maxTileX; x++) {
        const tile = floor.tiles[y][x];
        if (tile !== 'void') {
          this.drawFloorTile(x, y, tile, floor, camX, camY, gameTime);
        }
      }
    }

    // 1.5 Render Ground VFX (Shockwaves, ground fracture fissures, decals, summon circles)
    vfxSystem.renderGroundVFX(this.ctx, camX, camY, this.width, this.height);
    summonVFXSystem.renderGround(this.ctx, camX, camY, this.width, this.height);

    // 2. Collect all renderable entities for depth-sorted rendering
    type Renderable = 
      | { type: 'wall'; x: number; y: number; tile: string; depth: number }
      | { type: 'player'; entity: Player; depth: number }
      | { type: 'enemy'; entity: Enemy; depth: number }
      | { type: 'npc'; entity: NPC; depth: number }
      | { type: 'drop'; entity: DropItem; depth: number }
      | { type: 'minion'; entity: SummonedMinion; depth: number }
      | { type: 'adventurer'; entity: AdventurerEntity; depth: number }
      | { type: 'projectile'; entity: Projectile; depth: number }
      | { type: 'particle'; entity: Particle; depth: number };

    const renderables: Renderable[] = [];

    // Walls and stationary 3D block props
    for (let y = minTileY; y <= maxTileY; y++) {
      for (let x = minTileX; x <= maxTileX; x++) {
        const tile = floor.tiles[y][x];
        if (
          tile === 'wall' ||
          tile === 'chest' ||
          tile === 'opened_chest' ||
          tile === 'spawner' ||
          tile === 'shrine' ||
          tile === 'exit_portal' ||
          tile === 'building' ||
          tile === 'town_wall' ||
          tile === 'town_gate' ||
          tile === 'dungeon_gate' ||
          tile === 'lantern' ||
          tile === 'fountain' ||
          tile === 'barrel' ||
          tile === 'bush' ||
          tile === 'urn' ||
          tile === 'tree' ||
          tile === 'tower' ||
          tile === 'well' ||
          tile === 'cactus' ||
          tile === 'giant_mushroom' ||
          tile === 'dead_tree' ||
          tile === 'biome_gate' ||
          tile === 'keep_gate' ||
          tile === 'market_stall' ||
          tile === 'bed' ||
          tile === 'table' ||
          tile === 'counter' ||
          tile === 'door'
        ) {
          renderables.push({
            type: 'wall',
            x,
            y,
            tile,
            depth: (x + y) * 1000 + 50,
          });
        }
      }
    }

    // Player
    renderables.push({
      type: 'player',
      entity: player,
      depth: (player.x + player.y) * 1000 + 100 + player.z * 10,
    });

    // Enemies
    for (const enemy of enemies) {
      renderables.push({
        type: 'enemy',
        entity: enemy,
        depth: (enemy.x + enemy.y) * 1000 + 90 + enemy.z * 10,
      });
    }

    // Minions
    if (player.minions) {
      for (const minion of player.minions) {
        renderables.push({
          type: 'minion',
          entity: minion,
          depth: (minion.x + minion.y) * 1000 + 92 + (minion.z || 0) * 10,
        });
      }
    }

    // NPCs
    if (npcs) {
      for (const npc of npcs) {
        renderables.push({
          type: 'npc',
          entity: npc,
          depth: (npc.x + npc.y) * 1000 + 95 + npc.z * 10,
        });
      }
    }

    // 野外冒险者（玩家骨架框架）
    for (const adv of adventurers) {
      renderables.push({
        type: 'adventurer',
        entity: adv,
        depth: (adv.actor.x + adv.actor.y) * 1000 + 96,
      });
    }

    // Loot drops
    for (const drop of drops) {
      renderables.push({
        type: 'drop',
        entity: drop,
        depth: (drop.x + drop.y) * 1000 + 70 + drop.z * 10,
      });
    }

    // Projectiles
    for (const proj of projectiles) {
      renderables.push({
        type: 'projectile',
        entity: proj,
        depth: (proj.x + proj.y) * 1000 + 110 + proj.z * 10,
      });
    }

    // Particles
    for (const p of particles) {
      renderables.push({
        type: 'particle',
        entity: p,
        depth: (p.x + p.y) * 1000 + 120 + p.z * 10,
      });
    }

    // Sort all entities back to front (lower depth first)
    renderables.sort((a, b) => a.depth - b.depth);

    // 3. Render sorted elements
    for (const item of renderables) {
      if (item.type === 'wall') {
        this.drawVoxelBlock(item.x, item.y, item.tile, floor.theme, camX, camY, gameTime, floor, player);
      } else if (item.type === 'player') {
        this.drawPlayer(item.entity, camX, camY, gameTime, mouseWorldX, mouseWorldY);
      } else if (item.type === 'enemy') {
        this.drawEnemy(item.entity, camX, camY, gameTime);
      } else if (item.type === 'npc') {
        this.drawNPC(item.entity, camX, camY, gameTime, player);
      } else if (item.type === 'minion') {
        MinionRenderer.drawMinion(this.ctx, item.entity, camX, camY, this.width, this.height, gameTime);
      } else if (item.type === 'adventurer') {
        drawAdventurer(this.ctx, item.entity, camX, camY, this.width, this.height, gameTime);
      } else if (item.type === 'drop') {
        this.drawDropItem(item.entity, camX, camY, gameTime);
      } else if (item.type === 'projectile') {
        this.drawProjectile(item.entity, camX, camY);
      } else if (item.type === 'particle') {
        this.drawParticle(item.entity, camX, camY);
      }
    }

    // 3.5 Render Mid-Air & Blade VFX (Slash wave ribbons, specialized voxels, stars, embers, summon light pillars)
    vfxSystem.renderMidVFX(this.ctx, camX, camY, this.width, this.height);
    summonVFXSystem.renderPillars(this.ctx, camX, camY, this.width, this.height);

    // 3.6 Render Aiming & Trajectory Overlays (Bow laser, reticle, skill trajectories)
    if (mouseWorldX !== undefined && mouseWorldY !== undefined) {
      vfxSystem.renderAimingOverlay(
        this.ctx,
        player,
        mouseWorldX,
        mouseWorldY,
        camX,
        camY,
        this.width,
        this.height,
        gameTime
      );
    }

    // 4. Torchlight, dynamic flicker & multi-source light overlay
    this.drawLightingOverlay(player, camX, camY, gameTime, floor);

    // 4.1 血月氛围：红色边缘暗角 + 全场血色薄雾（低画质模式跳过呼吸动画）
    if (bloodMoonSystem.isActive() && !perfManager.isLowQuality()) {
      const vign = ctx.createRadialGradient(this.width / 2, this.height / 2, Math.min(this.width, this.height) * 0.32, this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.72);
      vign.addColorStop(0, 'rgba(120, 10, 10, 0)');
      vign.addColorStop(1, `rgba(120, 10, 10, ${0.32 + Math.sin(gameTime * 1.2) * 0.05})`);
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = 'rgba(180, 30, 30, 0.05)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 5. Atmospheric Environment Weather & Floating Motes (Cellar dust, Nether embers, End void sparks)
    this.drawAmbientWeatherAndAtmosphere(floor.theme, camX, camY, gameTime);

    // 6. Floating Damage Numbers & Combat text
    this.drawFloatingTexts(floatingTexts, camX, camY);

    // 9. Optional Debug Collision Hitboxes & Boundary Overlay
    if (showHitboxes ?? this.showHitboxes) {
      this.drawDebugColliders(floor, player, enemies, camX, camY);
    }

    // End global 180% camera scene zoom
    ctx.restore();

    // 7. Dynamic Weather (Rain droplets, lightning flashes, ripples, frost fog)
    weatherSystem.render(ctx, floor.weather || 'clear', floor.isIndoor, this.width, this.height, gameTime);

    // 8. Cinematic Zone Entrance Title Card
    this.drawZoneBanner(floor, dt);

    // 10. Real-time Spine Action Cross-fading Debug Oscilloscope & Bone Curves
    const isBlendDebugActive = showBlendDebug ?? this.showBlendDebug ?? SpineBlendDebugOverlay.isVisible;
    if (isBlendDebugActive && player) {
      SpineBlendDebugOverlay.render(ctx, player, gameTime, this.width, this.height);
    }
  }

  /**
   * Debug collision visualizer
   * Draws exact player collision circle, velocity vector, probe points,
   * environment obstacle isometric footprints and 3D wireframe boxes,
   * and enemy collision hitboxes.
   */
  private drawDebugColliders(floor: DungeonFloor, player: Player, enemies: Enemy[], camX: number, camY: number) {
    const ctx = this.ctx;
    ctx.save();

    const minTileX = Math.max(0, Math.floor(camX - 18));
    const maxTileX = Math.min(floor.width - 1, Math.ceil(camX + 18));
    const minTileY = Math.max(0, Math.floor(camY - 18));
    const maxTileY = Math.min(floor.height - 1, Math.ceil(camY + 18));

    let obstacleCount = 0;

    // 1. Draw Obstacle Layer Footprints & Colliders
    for (let ty = minTileY; ty <= maxTileY; ty++) {
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const tile = floor.tiles[ty][tx];
        const isObstacle =
          tile === 'wall' ||
          tile === 'town_wall' ||
          tile === 'building' ||
          tile === 'water' ||
          tile === 'fountain' ||
          tile === 'lantern' ||
          tile === 'chest' ||
          tile === 'spawner' ||
          tile === 'shrine' ||
          tile === 'void';

        if (isObstacle) {
          obstacleCount++;
          // Tile footprint corners: centered at (tx, ty), extending +-0.5 in world
          const pTop = worldToScreen(tx - 0.5, ty - 0.5, 0, camX, camY, this.width, this.height);
          const pRight = worldToScreen(tx + 0.5, ty - 0.5, 0, camX, camY, this.width, this.height);
          const pBottom = worldToScreen(tx + 0.5, ty + 0.5, 0, camX, camY, this.width, this.height);
          const pLeft = worldToScreen(tx - 0.5, ty + 0.5, 0, camX, camY, this.width, this.height);

          // Translucent fill
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pRight.x, pRight.y);
          ctx.lineTo(pBottom.x, pBottom.y);
          ctx.lineTo(pLeft.x, pLeft.y);
          ctx.closePath();

          ctx.fillStyle = tile === 'water' ? 'rgba(56, 189, 248, 0.22)' : 'rgba(239, 68, 68, 0.28)';
          ctx.fill();

          // High-contrast wireframe stroke
          ctx.strokeStyle = tile === 'water' ? '#38bdf8' : '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Diagonal X
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pBottom.x, pBottom.y);
          ctx.moveTo(pLeft.x, pLeft.y);
          ctx.lineTo(pRight.x, pRight.y);
          ctx.strokeStyle = tile === 'water' ? 'rgba(56, 189, 248, 0.45)' : 'rgba(239, 68, 68, 0.45)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // 3D Voxel Wireframe top face for elevated blocks
          if (tile === 'wall' || tile === 'town_wall' || tile === 'building' || tile === 'fountain' || tile === 'spawner') {
            const zTop = 1.0;
            const tTop = worldToScreen(tx - 0.5, ty - 0.5, zTop, camX, camY, this.width, this.height);
            const tRight = worldToScreen(tx + 0.5, ty - 0.5, zTop, camX, camY, this.width, this.height);
            const tBottom = worldToScreen(tx + 0.5, ty + 0.5, zTop, camX, camY, this.width, this.height);
            const tLeft = worldToScreen(tx - 0.5, ty + 0.5, zTop, camX, camY, this.width, this.height);

            // Vertical pillar corners
            ctx.beginPath();
            ctx.moveTo(pTop.x, pTop.y); ctx.lineTo(tTop.x, tTop.y);
            ctx.moveTo(pRight.x, pRight.y); ctx.lineTo(tRight.x, tRight.y);
            ctx.moveTo(pBottom.x, pBottom.y); ctx.lineTo(tBottom.x, tBottom.y);
            ctx.moveTo(pLeft.x, pLeft.y); ctx.lineTo(tLeft.x, tLeft.y);
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Top boundary
            ctx.beginPath();
            ctx.moveTo(tTop.x, tTop.y);
            ctx.lineTo(tRight.x, tRight.y);
            ctx.lineTo(tBottom.x, tBottom.y);
            ctx.lineTo(tLeft.x, tLeft.y);
            ctx.closePath();
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          // Small text tag for obstacle type & coords
          const center = worldToScreen(tx, ty, 0, camX, camY, this.width, this.height);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${tile} [${tx},${ty}]`, center.x, center.y);
        } else {
          // Interactive walkable triggers: gates, exit, opened chest
          if (tile === 'town_gate' || tile === 'dungeon_gate' || tile === 'exit_portal' || tile === 'opened_chest') {
            const pTop = worldToScreen(tx - 0.5, ty - 0.5, 0, camX, camY, this.width, this.height);
            const pRight = worldToScreen(tx + 0.5, ty - 0.5, 0, camX, camY, this.width, this.height);
            const pBottom = worldToScreen(tx + 0.5, ty + 0.5, 0, camX, camY, this.width, this.height);
            const pLeft = worldToScreen(tx - 0.5, ty + 0.5, 0, camX, camY, this.width, this.height);

            ctx.beginPath();
            ctx.moveTo(pTop.x, pTop.y);
            ctx.lineTo(pRight.x, pRight.y);
            ctx.lineTo(pBottom.x, pBottom.y);
            ctx.lineTo(pLeft.x, pLeft.y);
            ctx.closePath();
            ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
            ctx.fill();
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      }
    }

    // 2. Draw Map Outer Bounds Lines
    const b0 = worldToScreen(-0.5, -0.5, 0, camX, camY, this.width, this.height);
    const b1 = worldToScreen(floor.width - 0.5, -0.5, 0, camX, camY, this.width, this.height);
    const b2 = worldToScreen(floor.width - 0.5, floor.height - 0.5, 0, camX, camY, this.width, this.height);
    const b3 = worldToScreen(-0.5, floor.height - 0.5, 0, camX, camY, this.width, this.height);

    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.lineTo(b1.x, b1.y);
    ctx.lineTo(b2.x, b2.y);
    ctx.lineTo(b3.x, b3.y);
    ctx.closePath();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Enemy Hitboxes
    for (const enemy of enemies) {
      const eRadius = enemy.size * 0.35;
      const center = worldToScreen(enemy.x, enemy.y, enemy.z, camX, camY, this.width, this.height);

      // 16-point circle transformed to isometric ground
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        const pt = worldToScreen(
          enemy.x + Math.cos(angle) * eRadius,
          enemy.y + Math.sin(angle) * eRadius,
          enemy.z,
          camX,
          camY,
          this.width,
          this.height
        );
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Enemy label
      ctx.fillStyle = '#fef08a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${enemy.name} [r:${eRadius.toFixed(2)}]`, center.x, center.y - 25);
    }

    // 4. Draw Player Collision Collider
    const pRadius = 0.28;
    const pCenter = worldToScreen(player.x, player.y, player.z, camX, camY, this.width, this.height);

    // Ground collision circle transformed to isometric ellipse
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const pt = worldToScreen(
        player.x + Math.cos(angle) * pRadius,
        player.y + Math.sin(angle) * pRadius,
        player.z,
        camX,
        camY,
        this.width,
        this.height
      );
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4 Collision Corner Probes (X & Y bounding probe checks)
    const probes = [
      { x: player.x + pRadius, y: player.y },
      { x: player.x - pRadius, y: player.y },
      { x: player.x, y: player.y + pRadius },
      { x: player.x, y: player.y - pRadius },
    ];
    for (const probe of probes) {
      const pt = worldToScreen(probe.x, probe.y, player.z, camX, camY, this.width, this.height);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#22c55e';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Velocity Vector
    if (Math.hypot(player.vx, player.vy) > 0.1) {
      const targetPt = worldToScreen(
        player.x + player.vx * 0.35,
        player.y + player.vy * 0.35,
        player.z,
        camX,
        camY,
        this.width,
        this.height
      );
      ctx.beginPath();
      ctx.moveTo(pCenter.x, pCenter.y);
      ctx.lineTo(targetPt.x, targetPt.y);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.arc(targetPt.x, targetPt.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
    }

    // Player position and collision radius badge above player
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(pCenter.x - 85, pCenter.y - 65, 170, 22);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.strokeRect(pCenter.x - 85, pCenter.y - 65, 170, 22);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Player (${player.x.toFixed(2)}, ${player.y.toFixed(2)}) r: 0.28`, pCenter.x, pCenter.y - 54);

    // 5. On-Screen Debug Status HUD
    const hudW = 290;
    const hudH = 118;
    const hudX = 16;
    const hudY = 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(hudX, hudY, hudW, hudH);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(hudX, hudY, hudW, hudH);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('🛠️ 碰撞调试模式 (HITBOX DEBUGGER) [ON]', hudX + 12, hudY + 10);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(`坐标: X: ${player.x.toFixed(2)}  Y: ${player.y.toFixed(2)}  Z: ${player.z.toFixed(2)}`, hudX + 12, hudY + 34);
    ctx.fillText(`速度: Vx: ${player.vx.toFixed(2)}  Vy: ${player.vy.toFixed(2)}`, hudX + 12, hudY + 52);
    ctx.fillText(`地图尺寸: ${floor.width} x ${floor.height} (${floor.zoneType})`, hudX + 12, hudY + 70);
    ctx.fillText(`视野内障碍物: ${obstacleCount} | 敌人: ${enemies.length}`, hudX + 12, hudY + 88);

    ctx.restore();
  }

  /** 装饰瓦片底面：户外草皮（与 grass 分支同配色） */
  private paintGrassBase(ctx: CanvasRenderingContext2D, cx: number, cy: number, x: number, y: number) {
    const isAlt = (x + y) % 2 === 0;
    diamondPath(ctx, cx, cy);
    ctx.fillStyle = isAlt ? '#15803d' : '#166534';
    ctx.fill();
    ctx.strokeStyle = 'rgba(20, 83, 45, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /** 装饰瓦片底面：室内/地牢石板（随主题配色） */
  private paintDungeonFloorBase(ctx: CanvasRenderingContext2D, cx: number, cy: number, x: number, y: number, theme: string) {
    const isAlt = (x + y) % 2 === 0;
    diamondPath(ctx, cx, cy);
    ctx.fillStyle = theme === 'nether' ? (isAlt ? '#451010' : '#390c0c')
      : theme === 'end' ? (isAlt ? '#2d283e' : '#252033')
      : (isAlt ? '#374151' : '#323a48');
    ctx.fill();
    ctx.strokeStyle = theme === 'nether' ? 'rgba(80, 20, 20, 0.4)' : 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawFloorTile(x: number, y: number, tile: string, floor: DungeonFloor, camX: number, camY: number, time: number) {
    const s = worldToScreen(x, y, 0, camX, camY, this.width, this.height);
    this.drawFloorTileAt(this.ctx, x, y, tile, floor, s.x, s.y, time);
  }

  /** 在指定屏幕中心绘制瓦片（drawFloorTile 的可复用核心，分块缓存与实时层共用） */
  private drawFloorTileAt(ctx: CanvasRenderingContext2D, x: number, y: number, tile: string, floor: DungeonFloor, sx: number, sy: number, time: number) {
    const s = { x: sx, y: sy };
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const theme = floor.theme;

    // 环境增强地形：委托专用渲染器（自建路径，无需预构建菱形）
    if (tile === 'water' || tile === 'puddle' || tile === 'murkwater') {
      const isWaterAt = (dx: number, dy: number): boolean => {
        const t = floor.tiles[y + dy]?.[x + dx];
        return t === 'water' || t === 'puddle' || t === 'murkwater';
      };
      drawWaterTile(ctx, s.x, s.y, x, y, time, isWaterAt, tile === 'puddle', tile === 'murkwater' ? 'murk' : 'clear');
      return;
    }
    if (BIOME_GROUND_TILES.has(tile)) {
      drawBiomeGround(ctx, tile, s.x, s.y, x, y, time);
      return;
    }
    if (tile === 'tall_grass' || tile === 'flower_patch' || tile === 'mushroom' || tile === 'pebble') {
      const isOutdoor = floor.zoneType === 'town' || floor.zoneType === 'overworld';
      if (isOutdoor) {
        this.paintGrassBase(ctx, s.x, s.y, x, y);
      } else {
        this.paintDungeonFloorBase(ctx, s.x, s.y, x, y, theme);
      }
      drawGroundDecor(ctx, tile, s.x, s.y, x, y, time);
      return;
    }

    // 城镇室内木板地（旅店/酒馆地板，由 TownStyles 标记）
    if (tile === 'floor' && floor.zoneType === 'town') {
      const wood = getTownLook(floor).woodFloors.has(y * 4096 + x);
      if (wood) {
        const isAlt = (x + y) % 2 === 0;
        ctx.save();
        diamondPath(ctx, s.x, s.y);
        ctx.clip();
        ctx.fillStyle = isAlt ? '#8a5a33' : '#7e502d';
        ctx.fillRect(s.x - hw, s.y - hh, hw * 2, hh * 2);
        // 板缝（横切菱形，越界由裁剪处理）
        ctx.strokeStyle = 'rgba(59, 36, 17, 0.5)';
        ctx.lineWidth = 1;
        for (let dy = -7; dy <= 7; dy += 4.5) {
          ctx.beginPath();
          ctx.moveTo(s.x - hw, s.y + dy);
          ctx.lineTo(s.x + hw, s.y + dy);
          ctx.stroke();
        }
        // 木板随机端头缝
        const seam = ((x * 1307) ^ (y * 911)) >>> 0;
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        for (let i = 0; i < 3; i++) {
          const sx2 = s.x - hw + ((seam >> (i * 3)) % 26) + 4;
          const sy2 = s.y - hh + 4 + i * 5;
          ctx.beginPath();
          ctx.moveTo(sx2, sy2);
          ctx.lineTo(sx2 + 5, sy2);
          ctx.stroke();
        }
        // 西北光高光
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - hh);
        ctx.lineTo(s.x + hw * 0.85, s.y);
        ctx.lineTo(s.x - hw * 0.45, s.y + hh * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        return;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - hh);
    ctx.lineTo(s.x + hw, s.y);
    ctx.lineTo(s.x, s.y + hh);
    ctx.lineTo(s.x - hw, s.y);
    ctx.closePath();

    if (tile === 'bridge') {
      // Wooden bridge over water
      ctx.fillStyle = '#854d0e';
      ctx.fill();
      ctx.strokeStyle = '#58310c';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Plank slats
      ctx.strokeStyle = '#3d2005';
      ctx.beginPath();
      ctx.moveTo(s.x - hw * 0.6, s.y - 2);
      ctx.lineTo(s.x + hw * 0.6, s.y - 2);
      ctx.moveTo(s.x - hw * 0.6, s.y + 2);
      ctx.lineTo(s.x + hw * 0.6, s.y + 2);
      ctx.stroke();
    } else if (tile === 'road') {
      // Cobblestone Avenues & Paved roads
      const isAlt = (x + y) % 2 === 0;
      ctx.fillStyle = isAlt ? '#475569' : '#334155';
      ctx.fill();
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Cobble paving stones
      ctx.fillStyle = 'rgba(203, 213, 225, 0.12)';
      ctx.fillRect(s.x - 3, s.y - 2, 6, 4);
    } else if (tile === 'grass') {
      // Lush grassy lawn
      const isAlt = (x + y) % 2 === 0;
      ctx.fillStyle = isAlt ? '#15803d' : '#166534';
      ctx.fill();
      ctx.strokeStyle = 'rgba(20, 83, 45, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Flowers & grass sprinkles
      const flowerHash = ((x * 1234567) ^ (y * 7654321)) >>> 0;
      if (flowerHash % 5 === 0) {
        ctx.fillStyle = (flowerHash % 2 === 0) ? '#facc15' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tile === 'lava') {
      // Dynamic pulsating magma pool with animated heat crust
      const pulse = Math.sin(time * 2.5 + x * 0.8 + y * 0.7) * 0.15 + 0.85;
      const r = Math.floor(225 * pulse);
      const g = Math.floor((70 + Math.sin(time * 3 + x) * 20) * pulse);
      ctx.fillStyle = `rgb(${r}, ${g}, 10)`;
      ctx.fill();

      // Glowing magma crust edges
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Magma crust veins
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - 10, s.y + 1);
      ctx.lineTo(s.x + 3, s.y - 2);
      ctx.lineTo(s.x + 12, s.y + 3);
      ctx.stroke();

      // Procedural Magma Bubbles & Popping Effects
      const bubbleSeed = ((x * 73856093) ^ (y * 19349663)) >>> 0;
      const cycleSpeed = 1.2 + ((bubbleSeed % 50) / 100);
      const phase = (time * cycleSpeed + (bubbleSeed % 100) / 100) % 1.0;
      const bx = s.x + ((bubbleSeed % 22) - 11);
      const by = s.y + (((bubbleSeed >> 4) % 12) - 6);

      if (phase < 0.65) {
        // Bubble grows & rises
        const swell = phase / 0.65;
        const bRadius = 1.2 + swell * 4.2;
        // Orange bulb
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
        ctx.fill();
        // Yellow core gleam
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(bx - bRadius * 0.25, by - bRadius * 0.25, bRadius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (phase < 0.85) {
        // Bubble bursts with pop wave ring & embers
        const popProgress = (phase - 0.65) / 0.2;
        const popRadius = 4.5 + popProgress * 7;
        ctx.strokeStyle = `rgba(254, 240, 138, ${1 - popProgress})`;
        ctx.lineWidth = 1.5 * (1 - popProgress);
        ctx.beginPath();
        ctx.ellipse(bx, by, popRadius, popRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Flying lava spark droplet
        const dropletY = by - popProgress * 12;
        ctx.fillStyle = '#f97316';
        ctx.fillRect(bx - 1, dropletY, 2, 2);
      }
    } else {
      // Checkerboard subtle variation with cracked cobblestone / netherrack details
      const isAlt = (x + y) % 2 === 0;
      if (theme === 'nether') {
        ctx.fillStyle = isAlt ? '#451010' : '#390c0c';
      } else if (theme === 'end') {
        ctx.fillStyle = isAlt ? '#2d283e' : '#252033';
      } else {
        ctx.fillStyle = isAlt ? '#374151' : '#323a48';
      }
      ctx.fill();

      // Stone grid seams
      ctx.strokeStyle = theme === 'nether' ? 'rgba(80, 20, 20, 0.4)' : 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ambient floor texture accents (cobble cracks or moss)
      const tileHash = ((x * 374761393) ^ (y * 668265263)) >>> 0;
      if (tileHash % 5 === 0) {
        ctx.fillStyle = theme === 'nether' ? 'rgba(127, 29, 29, 0.3)' : 'rgba(74, 222, 128, 0.12)';
        ctx.fillRect(s.x - 4, s.y - 2, 8, 4);
      }
    }
    ctx.restore();
  }

  private drawVoxelBlock(x: number, y: number, tile: string, theme: string, camX: number, camY: number, time: number, floor?: DungeonFloor, player?: Player) {
    const ctx = this.ctx;
    const s = worldToScreen(x, y, 0, camX, camY, this.width, this.height);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const h = BLOCK_HEIGHT;

    // 城镇建筑身份：旅店/酒馆/铁匠铺/神秘公会 专属取色与门脸（空表时自然回退默认）
    const townLook = floor && (tile === 'building' || tile === 'door') ? getTownLook(floor) : undefined;
    const cellStyle = townLook?.walls.get(y * 4096 + x);

    // 环境增强地标：委托专用渲染器
    if (tile === 'tree') {
      drawTree(ctx, x, y, time, camX, camY, this.width, this.height, player?.x, player?.y);
      return;
    }
    if (tile === 'tower') {
      drawTower(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'well') {
      drawWell(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'cactus' || tile === 'giant_mushroom' || tile === 'dead_tree') {
      drawTallVegetation(ctx, tile, x, y, time, camX, camY, this.width, this.height, player?.x, player?.y);
      return;
    }
    if (tile === 'biome_gate') {
      drawBiomeGate(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'keep_gate') {
      drawKeepGate(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'market_stall') {
      drawMarketStall(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'bed') {
      drawBed(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'table') {
      drawTable(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'counter') {
      drawCounter(ctx, x, y, time, camX, camY, this.width, this.height);
      return;
    }
    if (tile === 'door') {
      const pal = cellStyle?.palette;
      drawTownDoor(
        ctx,
        x,
        y,
        time,
        camX,
        camY,
        this.width,
        this.height,
        pal ? { frame: pal.frame, glass: pal.glass, sign: pal.sign } : undefined
      );
      return;
    }

    // Determine colors
    let topColor = '#6b7280';
    let leftColor = '#4b5563';
    let rightColor = '#374151';

    if (tile === 'wall') {
      if (theme === 'nether') {
        topColor = '#7f1d1d';
        leftColor = '#5e1414';
        rightColor = '#450a0a';
      } else if (theme === 'end') {
        topColor = '#e2e8f0';
        leftColor = '#cbd5e1';
        rightColor = '#94a3b8';
      } else {
        // Mossy Cobblestone
        topColor = '#4b5563';
        leftColor = '#374151';
        rightColor = '#1f2937';
      }
    } else if (tile === 'chest' || tile === 'opened_chest') {
      topColor = '#b45309';
      leftColor = '#92400e';
      rightColor = '#78350f';
    } else if (tile === 'spawner') {
      topColor = '#1e293b';
      leftColor = '#0f172a';
      rightColor = '#020617';
    } else if (tile === 'shrine') {
      topColor = '#1d4ed8';
      leftColor = '#1e40af';
      rightColor = '#172554';
    } else if (tile === 'exit_portal') {
      topColor = '#1e1b4b';
      leftColor = '#0f0e26';
      rightColor = '#070617';
    } else if (tile === 'building') {
      topColor = cellStyle?.palette.roof ?? '#b91c1c'; // 依建筑身份取屋顶色（默认赤陶）
      leftColor = cellStyle?.palette.wallL ?? '#78350f';
      rightColor = cellStyle?.palette.wallR ?? '#451a03';
    } else if (tile === 'town_wall') {
      topColor = '#64748b'; // Crenellated fortress stone
      leftColor = '#475569';
      rightColor = '#334155';
    } else if (tile === 'town_gate') {
      topColor = '#059669'; // Emerald citadel gateway
      leftColor = '#047857';
      rightColor = '#065f46';
    } else if (tile === 'dungeon_gate') {
      topColor = '#581c87'; // Nether/End obsidian crypt gate
      leftColor = '#3b0764';
      rightColor = '#1e1b4b';
    } else if (tile === 'lantern') {
      topColor = '#1e293b'; // Iron street lamp
      leftColor = '#0f172a';
      rightColor = '#020617';
    } else if (tile === 'fountain') {
      topColor = '#38bdf8'; // Crystal blue water basin
      leftColor = '#0284c7';
      rightColor = '#0369a1';
    } else if (tile === 'barrel') {
      topColor = '#d97706'; // Golden oak stave lid
      leftColor = '#b45309';
      rightColor = '#78350f';
    } else if (tile === 'bush') {
      topColor = '#22c55e'; // Lush green foliage
      leftColor = '#16a34a';
      rightColor = '#15803d';
    } else if (tile === 'urn') {
      topColor = '#ea580c'; // Terracotta clay urn
      leftColor = '#c2410c';
      rightColor = '#9a3412';
    } else if (tile === 'pillar') {
      topColor = '#94a3b8'; // Ancient stone pillar capital
      leftColor = '#64748b';
      rightColor = '#475569';
    } else if (tile === 'vines') {
      topColor = '#15803d'; // Thick hanging forest vines
      leftColor = '#166534';
      rightColor = '#14532d';
    }

    ctx.save();

    // Left Face
    ctx.beginPath();
    ctx.moveTo(s.x - hw, s.y);
    ctx.lineTo(s.x, s.y + hh);
    ctx.lineTo(s.x, s.y + hh - h);
    ctx.lineTo(s.x - hw, s.y - h);
    ctx.closePath();
    ctx.fillStyle = leftColor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Right Face
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + hh);
    ctx.lineTo(s.x + hw, s.y);
    ctx.lineTo(s.x + hw, s.y - h);
    ctx.lineTo(s.x, s.y + hh - h);
    ctx.closePath();
    ctx.fillStyle = rightColor;
    ctx.fill();
    ctx.stroke();

    // Top Face
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - hh - h);
    ctx.lineTo(s.x + hw, s.y - h);
    ctx.lineTo(s.x, s.y + hh - h);
    ctx.lineTo(s.x - hw, s.y - h);
    ctx.closePath();
    ctx.fillStyle = topColor;
    ctx.fill();
    ctx.stroke();

    // Details for special block types
    if (tile === 'wall') {
      // Procedural Dungeon Wall Torches
      const wallHash = ((x * 15485863) ^ (y * 2038074743)) >>> 0;
      if (wallHash % 9 === 0) {
        const torchX = s.x - 2;
        const torchY = s.y + hh / 2 - h - 1;
        // Wood slant stick bracket
        ctx.fillStyle = '#78350f';
        ctx.fillRect(torchX, torchY, 3, 9);
        // Flickering torch flame
        const flameFlicker = Math.sin(time * 14 + wallHash) * 1.5;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(torchX - 1, torchY - 5 + flameFlicker, 5, 5);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(torchX, torchY - 4 + flameFlicker, 3, 3);
        // Subtle smoke particle
        const smokeOffset = (time * 6 + (wallHash % 10)) % 10;
        ctx.fillStyle = 'rgba(203, 213, 225, 0.35)';
        ctx.fillRect(torchX, torchY - 8 - smokeOffset, 2, 2);
      }
    } else if (tile === 'chest') {
      // Chest latch (golden lock)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(s.x - 3, s.y - h + 2, 6, 8);
    } else if (tile === 'exit_portal') {
      // Swirling Nether/End portal center
      const portalGradient = ctx.createRadialGradient(s.x, s.y - h, 2, s.x, s.y - h, hw * 0.8);
      portalGradient.addColorStop(0, '#c084fc');
      portalGradient.addColorStop(0.5, '#7e22ce');
      portalGradient.addColorStop(1, '#3b0764');
      ctx.fillStyle = portalGradient;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - h, hw * 0.7, hh * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Portal swirl beam
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (tile === 'spawner') {
      // Spinning miniature fire inside mob spawner
      const flameH = Math.sin(time * 6) * 4;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(s.x, s.y - h - 4 + flameH, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (tile === 'shrine') {
      // Floating glowing enchanting book / gem
      const bob = Math.sin(time * 3) * 6;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(s.x - 6, s.y - h - 16 + bob, 12, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(s.x - 4, s.y - h - 14 + bob, 8, 2);
    } else if (tile === 'lantern') {
      // Iron street lamp post with glowing warm lantern core
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(s.x - 4, s.y - h - 8, 8, 8);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x - 4, s.y - h - 8, 8, 8);
      // Top iron cap
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(s.x - 5, s.y - h - 10, 10, 2);
    } else if (tile === 'fountain') {
      // 3D bubbling water spray
      const waterJetH = 10 + Math.sin(time * 6) * 4;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(s.x - 1.5, s.y - h - waterJetH, 3, waterJetH);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(s.x, s.y - h - waterJetH, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (tile === 'town_gate') {
      // Grand Emerald Citadel Gate Vortex
      const portalGrad = ctx.createRadialGradient(s.x, s.y - h, 2, s.x, s.y - h, hw * 0.85);
      portalGrad.addColorStop(0, '#6ee7b7');
      portalGrad.addColorStop(0.5, '#10b981');
      portalGrad.addColorStop(1, '#047857');
      ctx.fillStyle = portalGrad;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - h, hw * 0.75, hh * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (tile === 'dungeon_gate') {
      // Menacing Obsidian Crypt Gate Vortex
      const portalGrad = ctx.createRadialGradient(s.x, s.y - h, 2, s.x, s.y - h, hw * 0.85);
      portalGrad.addColorStop(0, '#e879f9');
      portalGrad.addColorStop(0.5, '#9333ea');
      portalGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = portalGrad;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - h, hw * 0.75, hh * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (tile === 'building') {
      // House window: 依建筑身份配窗光与窗框色
      const glass = cellStyle?.palette.glass ?? '#fef08a';
      const frame = cellStyle?.palette.frame ?? '#78350f';
      ctx.fillStyle = glass;
      ctx.fillRect(s.x - 4, s.y - h / 2 - 2, 8, 8);
      ctx.strokeStyle = frame;
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x - 4, s.y - h / 2 - 2, 8, 8);
      // 窗格十字
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - h / 2 - 2);
      ctx.lineTo(s.x, s.y - h / 2 + 6);
      ctx.stroke();
      // 屋顶脊线微光（西北受光侧）
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - hw, s.y - h);
      ctx.lineTo(s.x, s.y - h - hh);
      ctx.lineTo(s.x + hw, s.y - h);
      ctx.stroke();
    } else if (tile === 'town_wall') {
      // Rampart crenel battlements
      ctx.fillStyle = '#475569';
      ctx.fillRect(s.x - 6, s.y - h - 5, 4, 5);
      ctx.fillRect(s.x + 2, s.y - h - 5, 4, 5);
    } else if (tile === 'barrel') {
      // 3D Wooden Barrel with Iron Bands, Plank Seams, and Bung
      // Top iron rim
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - h, hw * 0.72, hh * 0.72, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Top wood plank seam line
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s.x - hw * 0.45, s.y - h);
      ctx.lineTo(s.x + hw * 0.45, s.y - h);
      ctx.stroke();

      // Barrel bung cork
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(s.x, s.y - h, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Iron hoop bands across the barrel sides
      ctx.fillStyle = '#475569';
      // Upper hoop
      ctx.fillRect(s.x - hw * 0.85, s.y + hh * 0.2 - h + 5, hw * 1.7, 3);
      // Lower hoop
      ctx.fillRect(s.x - hw * 0.85, s.y + hh * 0.6 - h + 14, hw * 1.7, 3);
      // Silver rivet nails
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(s.x - 4, s.y + hh * 0.2 - h + 5.5, 1.5, 1.5);
      ctx.fillRect(s.x + 3, s.y + hh * 0.2 - h + 5.5, 1.5, 1.5);
      ctx.fillRect(s.x - 4, s.y + hh * 0.6 - h + 14.5, 1.5, 1.5);
      ctx.fillRect(s.x + 3, s.y + hh * 0.6 - h + 14.5, 1.5, 1.5);
    } else if (tile === 'bush') {
      // 3D Organic Foliage Bush with wind sway
      const sway = Math.sin(time * 3.5 + x * 2.5 + y * 1.8) * 2;
      // Main leafy crown
      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(s.x + sway, s.y - h - 3, 9, 0, Math.PI * 2);
      ctx.fill();

      // Side foliage clumps
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(s.x - 7 + sway * 0.5, s.y - h + 3, 7, 0, Math.PI * 2);
      ctx.arc(s.x + 7 + sway * 0.5, s.y - h + 3, 7, 0, Math.PI * 2);
      ctx.fill();

      // Small wild berries on bushes
      const bushHash = ((x * 101) ^ (y * 197)) >>> 0;
      if (bushHash % 2 === 0) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(s.x - 3 + sway, s.y - h - 2, 2.5, 2.5);
        ctx.fillRect(s.x + 4 + sway, s.y - h + 4, 2.5, 2.5);
        ctx.fillRect(s.x - 6 + sway * 0.5, s.y - h + 2, 2, 2);
      }
    } else if (tile === 'urn') {
      // Terracotta ancient pottery urn
      // Neck & Rim
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(s.x - 5, s.y - h - 7, 10, 3.5);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(s.x - 6, s.y - h - 9, 12, 2.5);

      // Gold engraved pattern band
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(s.x - 7, s.y - h + 4, 14, 2.5);
    } else if (tile === 'bone_pile') {
      // 3D Isometric Scattered Skeleton Bone Pile Obstacle
      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 2, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scattered rib cage & femur bones
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(s.x - 9, s.y - 4, 18, 3.5);
      ctx.fillRect(s.x - 7, s.y - 7, 14, 3);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(s.x - 6, s.y - 1, 12, 3);

      // Skull resting on top of the pile
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(s.x - 5, s.y - 14, 10, 8, [3, 3, 2, 2]);
      ctx.fill();

      // Hollow eye sockets & teeth
      ctx.fillStyle = '#334155';
      ctx.fillRect(s.x - 3.5, s.y - 11, 2.5, 2.5);
      ctx.fillRect(s.x + 1, s.y - 11, 2.5, 2.5);
      ctx.fillRect(s.x - 2, s.y - 8, 4, 1.5);
    }

    ctx.restore();
  }

  private drawPlayer(
    player: Player,
    camX: number,
    camY: number,
    time: number,
    mouseWorldX?: number,
    mouseWorldY?: number
  ) {
    const ctx = this.ctx;

    // 1. Dashing ghost afterimages
    if (player.dashTrail && player.dashTrail.length > 0) {
      for (const ghost of player.dashTrail) {
        const gs = worldToScreen(ghost.x, ghost.y, ghost.z, camX, camY, this.width, this.height);
        ctx.save();
        ctx.globalAlpha = Math.max(0, ghost.alpha * 0.55);
        ctx.fillStyle = ghost.armorColor;
        // Cute 2.0-head chibi clay doll silhouette in motion
        ctx.translate(gs.x, gs.y);
        ctx.scale(0.40, 0.40);
        ctx.beginPath();
        ctx.roundRect(-10, -44, 20, 18, 6); // Head (chibi proportion)
        ctx.roundRect(-7, -26, 14, 14, 4);  // Torso
        ctx.roundRect(-6, -12, 5, 12, 2);   // Left leg
        ctx.roundRect(1, -12, 5, 12, 2);    // Right leg
        ctx.fill();
        ctx.restore();
      }
    }

    const s = worldToScreen(player.x, player.y, player.z, camX, camY, this.width, this.height);

    // Spellcasting Anticipation Runic Circle & Wind-Up Pre-warning
    WildShapeRenderer.drawCastingWarningAura(ctx, player, s.x, s.y, time);

    // Charged Attack Ring, Sparks & Overhead Meter
    ctx.save();
    ctx.translate(s.x, s.y);
    ChargedAttackRenderer.drawChargeIndicator(ctx, player, time);
    ctx.restore();

    // 2. High-fidelity Dynamic Blurred Shadow Projection (Independent Ground Layer)
    shadowSystem.drawPlayerShadow(ctx, player, camX, camY, this.width, this.height);

    // 3. Centralized Character Skeletal Model Layer (Isolated Sandbox Layer)
    const orientation = CharacterOrientationManager.resolveOrientation(player, mouseWorldX, mouseWorldY);
    const isFacingLeft = orientation.isFacingLeft;

    ctx.save();
    ctx.translate(s.x, s.y);
    CharacterOrientationManager.applyOrientation(ctx, orientation);

    // Wild Shape Bear Form override & custom attack animation sequence
    if (WildShapeRenderer.isTransformed(player)) {
      WildShapeRenderer.drawBearForm(ctx, player, time, isFacingLeft);
      ctx.filter = 'none';
      ctx.restore();
      return;
    }

    // Hurt flinch & invulnerability flash
    if (player.hurtTimer > 0) {
      ctx.filter = 'drop-shadow(0 0 6px #ef4444) brightness(1.35)';
      ctx.translate(-3, 0); // Flinch backward
    } else if (player.invulnerableTimer > 0 && Math.floor(time * 24) % 2 === 0) {
      ctx.filter = 'brightness(2.2)';
    }

    // Custom User PNG Avatar / Spine Skeleton Puppet / GoodSmile Figurine
    const hasCustomSkin = CustomSkinRenderer.renderCustomSkin(ctx, player, time, isFacingLeft);
    if (!hasCustomSkin) {
      GoodSmilePlayerRenderer.renderFigurine(ctx, player, time, isFacingLeft);
    }

    // Strict Layer Isolation: ensure filters and matrices never bleed into the scene
    ctx.filter = 'none';
    ctx.restore();
  }

  /**
   * Calculates skeletal proportion offset compensation for the weapon mount point in GameRenderer.
   * Computes the vector deviation between the wrist joint and weapon center under the 40% scale,
   * ensuring that the weapon hilt remains strictly anchored to the palm during attack animation frames.
   */
  public static calculateWeaponSocketOffsetCompensation(
    player: Player,
    time: number = performance.now() / 1000,
    slashPose?: MeleeSlashPose,
    scale: number = CharacterOrientationManager.UNIFIED_CHIBI_SCALE
  ): WeaponBoneDeviationResult {
    const pose = slashPose || MeleeKinematicsEngine.evaluateSlashPose(player, time);
    const subType = (player.equipment.weapon?.subType || 'sword') as any;
    const preset = weaponSocketAdapter.getPreset(subType);
    const currentAngle = pose.isActive
      ? preset.idleAngle + preset.combatAngleOffset
      : preset.idleAngle;
    return WeaponBoneOffsetCompensator.calculateWristToWeaponDeviation(
      player,
      pose,
      currentAngle,
      scale,
      preset
    );
  }

  /**
   * Instance helper for weapon socket offset compensation calculation.
   */
  public getWeaponSocketCompensation(
    player: Player,
    time: number = performance.now() / 1000,
    slashPose?: MeleeSlashPose
  ): WeaponBoneDeviationResult {
    return GameRenderer.calculateWeaponSocketOffsetCompensation(player, time, slashPose);
  }

  private drawNPC(npc: NPC, camX: number, camY: number, time: number, player?: Player) {
    const ctx = this.ctx;
    const s = worldToScreen(npc.x, npc.y, npc.z, camX, camY, this.width, this.height);
    const scale = 1.0;

    ctx.save();
    
    // Draw shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 10 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(s.x, s.y);
    
    // Bobbing animation
    const bob = Math.sin(time * 2 + npc.x) * 2;
    
    if (npc.type === 'class_master') {
      // Mystical arcane circle under Class Master
      ctx.save();
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 * scale, 8 * scale, time * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Chibi humanoid body（人形化：头/发/脸/袍/手/脚 + 职业服饰）
    drawNpcHumanoid(ctx, npc, time, bob);

    // Icon floating above head
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(npc.icon, 0, -46 * scale + bob);

    // Floating nameplate
    ctx.fillStyle = npc.color;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(npc.name, 0, -55 * scale + bob);

    if (npc.type === 'class_master') {
      const isPlayerNear = player ? Math.hypot(player.x - npc.x, player.y - npc.y) <= (npc.interactRadius || 2.8) : true;
      if (isPlayerNear) {
        const pulse = 0.85 + Math.sin(time * 5) * 0.15;
        ctx.save();
        const badgeText = '✨ [点击NPC / 按E 切换职业与天赋]';
        ctx.font = 'bold 11px sans-serif';
        const tw = ctx.measureText(badgeText).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = `rgba(192, 132, 252, ${pulse})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-tw / 2 - 8, -54 * scale + bob, tw + 16, 18, 9);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeText, 0, -45 * scale + bob);

        // Pointer triangle
        ctx.fillStyle = `rgba(192, 132, 252, ${pulse})`;
        ctx.beginPath();
        ctx.moveTo(-4, -36 * scale + bob);
        ctx.lineTo(4, -36 * scale + bob);
        ctx.lineTo(0, -32 * scale + bob);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('[职业导师]', 0, -42 * scale + bob);
      }
    }

    ctx.restore();
  }

  private drawEnemy(enemy: Enemy, camX: number, camY: number, time: number) {
    const ctx = this.ctx;
    const s = worldToScreen(enemy.x, enemy.y, enemy.z, camX, camY, this.width, this.height);

    const pose = enemyAnimationManager.getPose(enemy, time);
    if (pose.alpha <= 0.01) return;

    ctx.save();
    ctx.globalAlpha = pose.alpha;

    // 图鉴怪族系识别环（defId 怪物脚下彩色光环，与经典怪一眼区分）
    if (enemy.defId && !enemy.isDying) {
      ctx.strokeStyle = enemy.color;
      ctx.globalAlpha = pose.alpha * 0.55;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y + 2, 11 * enemy.size, 5 * enemy.size, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = pose.alpha;
    }

    // 敌对人形冒险者（掠夺者）：复用玩家骨骼框架渲染
    if (enemy.defId === 'wandering_bandit') {
      drawBanditAdventurer(ctx, enemy, camX, camY, this.width, this.height, time);
      ctx.restore();
      return;
    }

    // 1. Dynamic Blurred Ground Shadow Projection
    shadowSystem.drawEnemyShadow(ctx, enemy, camX, camY, this.width, this.height);

    // 2. Attack Windup Telegraph & Creeper Blast Radius on Ground
    if (!enemy.isDying) {
      if (enemy.state === 'windup') {
        const facing = enemy.facingAngle || 0;
        const warnRadius = 24 * enemy.size;
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, warnRadius, warnRadius * 0.5, 0, facing - Math.PI * 0.35, facing + Math.PI * 0.35);
        ctx.lineTo(s.x, s.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pulsing Exclamation Mark overhead
        const warnPulse = Math.sin(time * 16) * 3;
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fillText('!', s.x, s.y - 54 * enemy.size + warnPulse);
        ctx.shadowBlur = 0;
        ctx.restore();
      } else if (enemy.state === 'exploding' && enemy.type === 'creeper') {
        const fuseProgress = Math.min(1.0, enemy.chargeTimer / 1.3);
        const ringRadius = 14 + fuseProgress * 36;
        ctx.save();
        ctx.strokeStyle = fuseProgress > 0.7 ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, ringRadius, ringRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      } else if (enemy.isReviving) {
        // Undead Necrotic Revival Circle
        ctx.save();
        const pulse = Math.sin(time * 8) * 0.2 + 0.8;
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.85 * pulse})`;
        ctx.fillStyle = `rgba(34, 197, 94, ${0.2 * pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 22 * enemy.size, 11 * enemy.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const progress = Math.max(0, Math.min(1, (enemy.reviveTimer || 0) / 2.4));
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 24 * enemy.size, 12 * enemy.size, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - progress));
        ctx.stroke();
        ctx.restore();
      } else if (enemy.state === 'evasive_dash') {
        // Evasive Dash Speed Lines & Golden Streak
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
        ctx.lineWidth = 2.5;
        const trailDist = 18 * enemy.size;
        const dashAngle = enemy.facingAngle || 0;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(dashAngle) * trailDist, s.y - Math.sin(dashAngle) * trailDist * 0.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Render Animated Monster Model
    ctx.save();
    if (pose.isHitFlashing || enemy.hitTimer > 0) {
      ctx.filter = 'brightness(2.5) saturate(0.2)';
    }

    // Position monster with hit flinch & scaling
    ctx.translate(s.x + pose.hitFlinchX, s.y + pose.hitFlinchY);

    // Apply death topple or movement body tilt
    if (pose.deathTopple !== 0) {
      ctx.rotate(pose.deathTopple);
    } else if (pose.bodyTilt !== 0) {
      ctx.rotate(pose.bodyTilt);
    }

    ctx.scale(pose.scaleX * enemy.size, pose.scaleY * enemy.size);

    this.drawEnemyModel(ctx, enemy, pose, time);
    ctx.restore();

    // 4. Status Overlays & Health Bar (Kept upright above enemy)
    if (!enemy.isDying) {
      // 4.1 Shield Reflect Crystalline Barrier
      if (enemy.shieldReflectActive) {
        ctx.save();
        const barrierPulse = Math.sin(time * 7) * 2;
        const bRadius = 18 * enemy.size + barrierPulse;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + time * 1.5;
          const hx = s.x + Math.cos(a) * bRadius;
          const hy = s.y - 18 * enemy.size + Math.sin(a) * (bRadius * 0.75);
          if (k === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ 护盾反射', s.x, s.y - 56 * enemy.size);
        ctx.restore();
      }

      // 4.2 Elite Gold Aura & Affix Badge
      if (enemy.isElite) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, 16 * enemy.size, 8 * enemy.size, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        const affixesText = enemy.affixes.length > 0 ? `[${enemy.affixes.join('·')}]` : '';
        ctx.fillText(`★ 精英 ${affixesText}`, s.x, s.y - 48 * enemy.size);
      }

      // Tactical Behavior Tag (In Cover / Seeking Cover / Reviving)
      if (enemy.state === 'in_cover') {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ [掩体规避]', s.x, s.y - 48 * enemy.size);
      } else if (enemy.state === 'seeking_cover') {
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧱 [奔向掩体]', s.x, s.y - 48 * enemy.size);
      } else if (enemy.isReviving) {
        ctx.fillStyle = '#e879f9';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        const secLeft = Math.max(0, enemy.reviveTimer || 0).toFixed(1);
        ctx.fillText(`⚰️ 亡灵复苏 ${secLeft}s [可处决!]`, s.x, s.y - 44 * enemy.size);
      }

      // 4.25 图鉴怪名字牌（新怪物识别）
      if (enemy.defId) {
        ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(enemy.name, s.x, s.y - 44 * enemy.size);
      }

      // 4.3 Enemy Health Bar
      const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
      const barW = 28 * enemy.size;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(s.x - barW / 2, s.y - 40 * enemy.size, barW, 4);
      ctx.fillStyle = enemy.isElite ? '#f59e0b' : '#ef4444';
      ctx.fillRect(s.x - barW / 2, s.y - 40 * enemy.size, barW * hpRatio, 4);

      // 4.4 Elemental Weaknesses & Resistances Badges
      const badges = elementalSystem.getAffinityBadges(enemy.type);
      if (badges.length > 0) {
        const badgeW = 26;
        const totalW = badges.length * (badgeW + 2);
        let startBadgeX = s.x - totalW / 2;
        const badgeY = s.y - 32 * enemy.size;

        badges.forEach((b) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(startBadgeX, badgeY - 6, badgeW, 8);
          ctx.fillStyle = b.color;
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(b.text, startBadgeX + badgeW / 2, badgeY);
          startBadgeX += badgeW + 2;
        });
      }
    }

    ctx.restore();
  }

  private drawEnemyModel(ctx: CanvasRenderingContext2D, enemy: Enemy, pose: any, time: number) {
    // 2.0-Head Standard Chibi Hand-crafted Figurine Monster Model
    if (renderChibiMonsterModel(ctx, enemy, pose, time)) {
      return;
    }

    if (drawSpecialEnemyModel(ctx, enemy, pose, time)) {
      return;
    }

    const bob = pose.bodyBob;

    if (enemy.type === 'zombie') {
      // Legs
      ctx.save();
      ctx.translate(-3, -12);
      ctx.rotate(pose.leftLegAngle);
      ctx.fillStyle = '#4c1d95'; // pants
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      ctx.save();
      ctx.translate(3, -12);
      ctx.rotate(pose.rightLegAngle);
      ctx.fillStyle = '#4c1d95';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      // Torso
      ctx.fillStyle = '#0284c7'; // cyan shirt
      ctx.fillRect(-7, -26 - bob, 14, 14);

      // Arms (Outstretched with animated swing)
      ctx.save();
      ctx.translate(-7, -24 - bob);
      ctx.rotate(pose.leftArmAngle);
      ctx.fillStyle = '#15803d'; // green arms
      ctx.fillRect(-3, 0, 6, 12);
      ctx.restore();

      ctx.save();
      ctx.translate(7, -24 - bob);
      ctx.rotate(pose.rightArmAngle);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-3, 0, 6, 12);
      ctx.restore();

      // Head
      ctx.save();
      ctx.translate(0, -32 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-6, -12, 12, 12);
      // Dark sunken eyes
      ctx.fillStyle = '#052e16';
      ctx.fillRect(-4, -8, 2, 2);
      ctx.fillRect(2, -8, 2, 2);
      ctx.restore();
    } else if (enemy.type === 'skeleton') {
      // Bone Legs
      ctx.save();
      ctx.translate(-3, -12);
      ctx.rotate(pose.leftLegAngle);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-1.5, 0, 3, 12);
      ctx.restore();

      ctx.save();
      ctx.translate(3, -12);
      ctx.rotate(pose.rightLegAngle);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-1.5, 0, 3, 12);
      ctx.restore();

      // Ribs Torso
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-5, -24 - bob, 10, 12);

      // Arms & Bow
      ctx.save();
      ctx.translate(-5, -22 - bob);
      ctx.rotate(pose.leftArmAngle);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-1.5, 0, 3, 11);
      ctx.restore();

      ctx.save();
      ctx.translate(5, -22 - bob);
      ctx.rotate(pose.rightArmAngle);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-1.5, 0, 3, 11);
      // Wooden Bow
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(3, 8, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.restore();

      // Skull
      ctx.save();
      ctx.translate(0, -30 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-6, -12, 12, 12);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, -8, 3, 3);
      ctx.fillRect(1, -8, 3, 3);
      ctx.restore();
    } else if (enemy.type === 'creeper') {
      const isFlashing = enemy.state === 'exploding' && Math.floor(time * 16) % 2 === 0;
      ctx.fillStyle = isFlashing ? '#ffffff' : '#22c55e';

      // 4 Feet with walking animation
      ctx.save();
      ctx.translate(-4, -8);
      ctx.rotate(pose.leftLegAngle * 0.7);
      ctx.fillRect(-3, 0, 5, 8);
      ctx.restore();

      ctx.save();
      ctx.translate(3, -8);
      ctx.rotate(pose.rightLegAngle * 0.7);
      ctx.fillRect(-2, 0, 5, 8);
      ctx.restore();

      // Creeper Body
      ctx.fillStyle = isFlashing ? '#ffffff' : '#22c55e';
      ctx.fillRect(-6, -24 - bob, 12, 16);

      // Creeper Head
      ctx.save();
      ctx.translate(0, -31 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = isFlashing ? '#ffffff' : '#22c55e';
      ctx.fillRect(-8, -14, 16, 14);

      // Sad Creeper Face
      ctx.fillStyle = '#052e16';
      ctx.fillRect(-5, -10, 3, 3);
      ctx.fillRect(2, -10, 3, 3);
      ctx.fillRect(-2, -7, 4, 4);
      ctx.fillRect(-4, -3, 2, 4);
      ctx.fillRect(2, -3, 2, 4);
      ctx.restore();
    } else if (enemy.type === 'spider') {
      // Low arachnid body
      ctx.fillStyle = '#1e1e1e';
      ctx.beginPath();
      ctx.ellipse(0, -8 - bob, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spider 8 Red Eyes
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-6, -12 - bob, 3, 3);
      ctx.fillRect(3, -12 - bob, 3, 3);
      ctx.fillRect(-2, -11 - bob, 2, 2);
      ctx.fillRect(0, -11 - bob, 2, 2);

      // 8 Animated Legs crawling with limbSwing
      ctx.strokeStyle = '#262626';
      ctx.lineWidth = 2;
      const legPhase = pose.limbSwing || (time * 12);
      for (let i = -2; i <= 2; i += 1.3) {
        const legWiggle = Math.sin(legPhase + i * 1.5) * 3;
        ctx.beginPath();
        ctx.moveTo(-6, -8 - bob);
        ctx.lineTo(-16, -12 - bob + i * 2 + legWiggle);
        ctx.lineTo(-20, 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(6, -8 - bob);
        ctx.lineTo(16, -12 - bob + i * 2 - legWiggle);
        ctx.lineTo(20, 2);
        ctx.stroke();
      }
    } else if (enemy.type === 'enderman') {
      // Tall, slender, animated long limbs
      ctx.fillStyle = '#0f0e17';
      // Left leg
      ctx.save();
      ctx.translate(-2, -26);
      ctx.rotate(pose.leftLegAngle * 0.6);
      ctx.fillRect(-1, 0, 2, 26);
      ctx.restore();

      // Right leg
      ctx.save();
      ctx.translate(2, -26);
      ctx.rotate(pose.rightLegAngle * 0.6);
      ctx.fillRect(-1, 0, 2, 26);
      ctx.restore();

      // Slender Torso
      ctx.fillStyle = '#0f0e17';
      ctx.fillRect(-4, -48 - bob, 8, 22);

      // Long Arms
      ctx.save();
      ctx.translate(-5, -46 - bob);
      ctx.rotate(pose.leftArmAngle * 0.5);
      ctx.fillRect(-1, 0, 2, 28);
      ctx.restore();

      ctx.save();
      ctx.translate(5, -46 - bob);
      ctx.rotate(pose.rightArmAngle * 0.5);
      ctx.fillRect(-1, 0, 2, 28);
      ctx.restore();

      // Head
      ctx.save();
      ctx.translate(0, -54 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#0f0e17';
      ctx.fillRect(-5, -12, 10, 12);

      // Glowing Violet Eyes
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(-3, -8, 2, 2);
      ctx.fillRect(1, -8, 2, 2);
      ctx.restore();
    } else if (enemy.type === 'wither_boss') {
      const hover = Math.sin(time * 4) * 8 - bob;
      const isEnraged = enemy.isEnraged || enemy.state === 'enraged' || (enemy.hp / enemy.maxHp <= 0.5);

      // Phase 2 Enraged Crimson/Nether Aura
      if (isEnraged) {
        ctx.save();
        const auraPulse = Math.sin(time * 8) * 4;
        const auraGrad = ctx.createRadialGradient(0, -32 + hover, 10, 0, -32 + hover, 48 + auraPulse);
        auraGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
        auraGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, -32 + hover, 48 + auraPulse, 0, Math.PI * 2);
        ctx.fill();

        // Crackling lightning arcs
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        const sparkAngle = time * 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(sparkAngle) * 32, -32 + hover + Math.sin(sparkAngle) * 20);
        ctx.lineTo(Math.cos(sparkAngle + 1.2) * 26, -32 + hover + Math.sin(sparkAngle + 1.2) * 16);
        ctx.lineTo(Math.cos(sparkAngle + 2.4) * 34, -32 + hover + Math.sin(sparkAngle + 2.4) * 24);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = isEnraged ? '#3b0764' : '#1e1b4b';

      // Center skull
      ctx.fillRect(-12, -48 + hover, 24, 20);
      // Left skull with independent bob
      const lBob = Math.sin(time * 5) * 3;
      ctx.fillRect(-32, -42 + hover + lBob, 18, 16);
      // Right skull with independent bob
      const rBob = Math.cos(time * 5) * 3;
      ctx.fillRect(14, -42 + hover + rBob, 18, 16);

      // Spine & ribs
      ctx.fillRect(-6, -28 + hover, 12, 18);
      ctx.fillRect(-14, -24 + hover, 28, 4);
      ctx.fillRect(-10, -18 + hover, 20, 4);

      // Glowing eyes
      const eyeColor = isEnraged ? '#ef4444' : '#ffffff';
      ctx.fillStyle = eyeColor;
      ctx.fillRect(-7, -42 + hover, 4, 4);
      ctx.fillRect(3, -42 + hover, 4, 4);
      ctx.fillRect(-27, -36 + hover + lBob, 3, 3);
      ctx.fillRect(-20, -36 + hover + lBob, 3, 3);
      ctx.fillRect(18, -36 + hover + rBob, 3, 3);
      ctx.fillRect(25, -36 + hover + rBob, 3, 3);
    } else if (enemy.type === 'piglin_brute') {
      const isEnraged = enemy.isEnraged || (enemy.hp / enemy.maxHp <= 0.4);

      // Legs
      ctx.save();
      ctx.translate(-3, -12);
      ctx.rotate(pose.leftLegAngle);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      ctx.save();
      ctx.translate(3, -12);
      ctx.rotate(pose.rightLegAngle);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      // Golden Chestplate
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-8, -28 - bob, 16, 16);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-10, -28 - bob, 4, 8); // Pauldron L
      ctx.fillRect(6, -28 - bob, 4, 8);  // Pauldron R

      // Head
      ctx.save();
      ctx.translate(0, -35 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-7, -12, 14, 14);
      // Ears
      ctx.fillRect(-11, -8, 4, 6);
      ctx.fillRect(7, -8, 4, 6);
      // Snout & Tusks
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(-4, -5, 8, 5);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5, -3, 2, 4);
      ctx.fillRect(3, -3, 2, 4);
      // Eyes
      ctx.fillStyle = isEnraged ? '#ef4444' : '#ffffff';
      ctx.fillRect(-4, -8, 2, 2);
      ctx.fillRect(2, -8, 2, 2);
      ctx.restore();

      // Giant Golden Battleaxe with arm swing
      ctx.save();
      ctx.translate(8, -26 - bob);
      ctx.rotate(pose.rightArmAngle * 1.2);
      ctx.fillStyle = '#78350f'; // handle
      ctx.fillRect(-1.5, -10, 3, 24);
      ctx.fillStyle = '#fbbf24'; // blade
      ctx.fillRect(-2, -16, 10, 10);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(3, -18, 4, 14);
      ctx.restore();
    } else if (enemy.type === 'blaze') {
      const hover = Math.sin(time * 5 + enemy.x) * 6 - bob;
      // Dark fiery head
      ctx.fillStyle = '#7c2d12';
      ctx.fillRect(-6, -32 + hover, 12, 12);
      // Glowing yellow/orange eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -28 + hover, 2, 3);
      ctx.fillRect(2, -28 + hover, 2, 3);

      // 3 Orbiting Blaze Rods with rotation and elevation bob
      const baseAngle = enemy.blazeRodAngle || (time * 4);
      for (let r = 0; r < 3; r++) {
        const angle = baseAngle + (r * Math.PI * 2) / 3;
        const rx = Math.cos(angle) * 16;
        const ry = -24 + hover + Math.sin(angle) * 8;
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(rx - 2, ry - 7, 4, 14);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(rx - 1, ry - 5, 2, 10);
      }
    } else if (enemy.type === 'necromancer') {
      // Robe
      ctx.fillStyle = '#312e81';
      ctx.fillRect(-7, -26 - bob, 14, 26);
      ctx.fillStyle = '#4338ca';
      ctx.fillRect(-8, -42 - bob, 16, 16);

      // Bone Mask
      ctx.save();
      ctx.translate(0, -35 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-5, -8, 10, 10);
      ctx.fillStyle = '#7c3aed'; // Glowing occult eyes
      ctx.fillRect(-3, -6, 2, 2);
      ctx.fillRect(1, -6, 2, 2);
      ctx.restore();

      // Bone Staff with floating soul crystal
      ctx.save();
      ctx.translate(8, -26 - bob);
      ctx.rotate(pose.rightArmAngle * 0.8);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-1.5, -8, 3, 28);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, -12, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (enemy.type === 'slime') {
      // Translucent bouncing green cube with animated squash & stretch
      const slimeH = 20;
      const slimeW = 20;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.75)';
      ctx.fillRect(-slimeW / 2, -slimeH - bob, slimeW, slimeH);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-slimeW / 2, -slimeH - bob, slimeW, slimeH);

      // Inner Core
      const coreH = slimeH * 0.55;
      const coreW = slimeW * 0.55;
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-coreW / 2, -slimeH * 0.75 - bob, coreW, coreH);
      // Eyes
      ctx.fillStyle = '#052e16';
      ctx.fillRect(-coreW * 0.4, -slimeH * 0.7 - bob, 3, 3);
      ctx.fillRect(coreW * 0.1, -slimeH * 0.7 - bob, 3, 3);
    } else if (enemy.type === 'witch') {
      // Purple Robe
      ctx.fillStyle = '#581c87';
      ctx.fillRect(-6, -24 - bob, 12, 24);

      // Head & Big Nose
      ctx.save();
      ctx.translate(0, -30 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(-5, -6, 10, 12);
      ctx.fillRect(-2, -2, 4, 6); // nose

      // Pointy Witch Hat
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-10, -8, 20, 3);
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(7, -8);
      ctx.lineTo(0, -24);
      ctx.closePath();
      ctx.fill();

      // Green Buckle
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-2, -11, 4, 3);
      ctx.restore();

      // Potion Flask in Hand
      ctx.save();
      ctx.translate(8, -20 - bob);
      ctx.rotate(pose.rightArmAngle);
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (enemy.type === 'drowned') {
      // Waterlogged teal pants
      ctx.save();
      ctx.translate(-3, -12);
      ctx.rotate(pose.leftLegAngle);
      ctx.fillStyle = '#164e63';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      ctx.save();
      ctx.translate(3, -12);
      ctx.rotate(pose.rightLegAngle);
      ctx.fillStyle = '#164e63';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      // Teal decomposed flesh
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-7, -26 - bob, 14, 14);

      // Seaweed strands
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-4, -25 - bob, 2, 6);
      ctx.fillRect(2, -26 - bob, 2, 8);

      // Arms & Trident
      ctx.save();
      ctx.translate(-7, -24 - bob);
      ctx.rotate(pose.leftArmAngle);
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-2, 0, 4, 12);
      ctx.restore();

      ctx.save();
      ctx.translate(7, -24 - bob);
      ctx.rotate(pose.rightArmAngle);
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-2, 0, 4, 12);
      // Sea Trident
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(1, -12, 2, 26);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-2, -18, 8, 4);
      ctx.fillRect(-2, -22, 2, 4);
      ctx.fillRect(1, -24, 2, 6);
      ctx.fillRect(4, -22, 2, 4);
      ctx.restore();

      // Head
      ctx.save();
      ctx.translate(0, -32 - bob);
      ctx.rotate(pose.headTilt);
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-6, -12, 12, 12);
      // Glowing Cyan Eyes
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-4, -8, 2, 2);
      ctx.fillRect(2, -8, 2, 2);
      ctx.restore();
    }
  }

  private drawDropItem(drop: DropItem, camX: number, camY: number, time: number) {
    const ctx = this.ctx;
    const s = worldToScreen(drop.x, drop.y, drop.z, camX, camY, this.width, this.height);
    const sGround = worldToScreen(drop.x, drop.y, 0, camX, camY, this.width, this.height);

    const isGrounded = drop.isGrounded ?? (drop.z <= 0.05);
    const bob = isGrounded ? Math.sin(time * 5 + drop.x * 3) * 3 : 0;
    const rarityConfig = RARITY_COLORS[drop.rarity || 'common'];

    ctx.save();

    // 1. Dynamic Blurred Ground Shadow Projection (altitude-diffused)
    shadowSystem.drawDropShadow(ctx, drop, camX, camY, this.width, this.height);

    // 2. Landing Bounce Impact Wave Ring
    if (drop.impactWaveTimer && drop.impactWaveTimer > 0) {
      const p = 1 - drop.impactWaveTimer / 0.35;
      const waveRadius = 10 + p * 22;
      ctx.strokeStyle = rarityConfig.beam;
      ctx.lineWidth = 2.5 * (1 - p);
      ctx.beginPath();
      ctx.ellipse(sGround.x, sGround.y, waveRadius, waveRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 3. Diablo-style vertical pillar of light for rare/legendary loot
    if (drop.rarity === 'legendary' || drop.rarity === 'rare' || drop.rarity === 'magic') {
      const beamHeight = drop.rarity === 'legendary' ? 140 : 100;
      const beamGrad = ctx.createLinearGradient(sGround.x, sGround.y, sGround.x, sGround.y - beamHeight);
      beamGrad.addColorStop(0, rarityConfig.glow);
      beamGrad.addColorStop(0.8, rarityConfig.beam + '33');
      beamGrad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = beamGrad;
      ctx.fillRect(sGround.x - 8, sGround.y - beamHeight, 16, beamHeight);

      // Core bright light line
      ctx.strokeStyle = rarityConfig.beam;
      ctx.lineWidth = drop.rarity === 'legendary' ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(sGround.x, sGround.y);
      ctx.lineTo(sGround.x, sGround.y - beamHeight);
      ctx.stroke();
    }

    // Ground glow ring
    ctx.strokeStyle = rarityConfig.beam;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sGround.x, sGround.y, 11, 5.5, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Render 3D Tumbling / Floating Loot Entity
    ctx.save();
    ctx.translate(s.x, s.y - 12 + bob);

    // Dynamic pickup scale rebound / bounce scaling
    const itemScale = drop.scale !== undefined ? drop.scale : 1.0;
    if (itemScale !== 1.0) {
      ctx.scale(itemScale, itemScale);
    }

    if (drop.isBeingCollected) {
      // Golden / rare collection halo ring while snapping to player
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = rarityConfig.glow;
      ctx.fill();
    }

    if (!isGrounded && drop.rotation !== undefined) {
      ctx.rotate(drop.rotation);
    }

    if (drop.isEmerald) {
      // Sparkling green emerald gem
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 7);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Facet gleam
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, 2);
      ctx.closePath();
      ctx.fill();
    } else if (drop.isExp) {
      // Rotating Minecraft EXP orb
      const expColor = Math.floor(time * 12) % 2 === 0 ? '#84cc16' : '#eab308';
      ctx.fillStyle = expColor;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // High-Fidelity Weapon Loot Rendering or Armor fallback
      const renderedWeapon = DropWeaponRenderer.drawDroppedWeapon(ctx, drop.item, rarityConfig.border);
      if (!renderedWeapon) {
        const sub = drop.item?.subType || 'armor';
        if (sub === 'shield') {
          // Shield Icon
          ctx.fillStyle = rarityConfig.bg;
          ctx.fillRect(-5, -7, 10, 14);
          ctx.strokeStyle = rarityConfig.border;
          ctx.lineWidth = 2;
          ctx.strokeRect(-5, -7, 10, 14);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-2, -3, 4, 6);
        } else if (sub === 'totem' || drop.name.includes('不死图腾') || drop.name.includes('秘典') || drop.name.includes('头骨')) {
          // Totem / Tome Icon
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(-4, -6, 8, 12, 2);
          ctx.fill();
          ctx.fillStyle = '#10b981';
          ctx.fillRect(-2.5, -4, 2, 2);
          ctx.fillRect(0.5, -4, 2, 2);
        } else {
          // Armor or accessory item
          ctx.fillStyle = rarityConfig.border;
          ctx.fillRect(-6, -6, 12, 12);
          ctx.fillStyle = rarityConfig.bg;
          ctx.fillRect(-4, -4, 8, 8);
          ctx.fillStyle = rarityConfig.text;
          ctx.fillRect(-2, -2, 4, 4);
        }
      }
    }

    ctx.restore();

    // 5. Floating Loot Label Badge
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(drop.name).width;
    const labelY = s.y - 28 + bob;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(s.x - textWidth / 2 - 5, labelY - 10, textWidth + 10, 14);
    ctx.strokeStyle = rarityConfig.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x - textWidth / 2 - 5, labelY - 10, textWidth + 10, 14);

    ctx.fillStyle = rarityConfig.text;
    ctx.textAlign = 'center';
    ctx.fillText(drop.name, s.x, labelY + 1);

    ctx.restore();
  }

  private drawProjectile(proj: Projectile, camX: number, camY: number) {
    const ctx = this.ctx;
    const s = worldToScreen(proj.x, proj.y, proj.z, camX, camY, this.width, this.height);

    ctx.save();
    if (proj.type === 'arrow') {
      // Minecraft Arrow: use exact isometric screen trajectory angle
      const angle = AttackAimSolver.getScreenProjectileAngle(proj.vx, proj.vy, proj.vz);
      ctx.translate(s.x, s.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#b45309'; // wood shaft
      ctx.fillRect(-8, -1, 16, 2);
      ctx.fillStyle = '#94a3b8'; // arrow head
      ctx.fillRect(6, -2, 4, 4);
      ctx.fillStyle = '#f8fafc'; // feather
      ctx.fillRect(-8, -3, 3, 6);
    } else if (proj.type === 'tnt') {
      // Flying TNT block
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(s.x - 8, s.y - 12, 16, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x - 8, s.y - 7, 16, 4);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TNT', s.x, s.y - 3);
    } else if (proj.type === 'ender_pearl') {
      // Purple pearl
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(s.x - 2, s.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'potion_splash') {
      // Witch Potion bottle
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e8ff';
      ctx.fillRect(s.x - 2, s.y - 8, 4, 4); // neck
      ctx.strokeStyle = '#6b21a8';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (proj.type === 'trident') {
      // Drowned Sea Trident: use exact isometric screen trajectory angle
      const angle = AttackAimSolver.getScreenProjectileAngle(proj.vx, proj.vy, proj.vz);
      ctx.translate(s.x, s.y);
      ctx.rotate(angle);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-10, -1.5, 20, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(6, -4, 4, 8); // prongs
      ctx.fillRect(8, -6, 2, 4);
      ctx.fillRect(10, -2, 4, 4);
      ctx.fillRect(8, 2, 2, 4);
    } else if (proj.type === 'fang') {
      // Necromancer Ground Fang
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(s.x - 6, s.y + 4);
      ctx.lineTo(s.x, s.y - 12);
      ctx.lineTo(s.x + 6, s.y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(s.x - 1.5, s.y - 6, 3, 6);
    } else if (proj.type === 'mage_bolt') {
      // Arcane Energy Bolt
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Fireball / Sonic boom
      ctx.fillStyle = proj.color || '#f97316';
      ctx.beginPath();
      ctx.arc(s.x, s.y, proj.radius * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private drawParticle(p: Particle, camX: number, camY: number) {
    const ctx = this.ctx;
    const s = worldToScreen(p.x, p.y, p.z, camX, camY, this.width, this.height);
    const alpha = Math.max(0, p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.type === 'splinter') {
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size * 0.2, p.size, p.size * 0.4);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-p.size / 2, -1, p.size, 1);
    } else if (p.type === 'leaf') {
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.7);
      ctx.quadraticCurveTo(p.size * 0.5, 0, 0, p.size * 0.7);
      ctx.quadraticCurveTo(-p.size * 0.5, 0, 0, -p.size * 0.7);
      ctx.fill();
    } else if (p.type === 'shard') {
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(-p.size * 0.5, -p.size * 0.4);
      ctx.lineTo(p.size * 0.6, -p.size * 0.2);
      ctx.lineTo(p.size * 0.2, p.size * 0.5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(s.x - p.size / 2, s.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }

  private drawLightingOverlay(player: Player, camX: number, camY: number, time: number, floor?: DungeonFloor) {
    const ctx = this.ctx;
    const s = worldToScreen(player.x, player.y, player.z, camX, camY, this.width, this.height);

    ctx.save();
    // 1. Organic Torchlight Flicker around player
    const flicker = Math.sin(time * 8.7) * 9 + Math.cos(time * 16.3) * 5 + Math.sin(time * 26.5) * 3;
    const radius = 330 + flicker;

    const lightGrad = ctx.createRadialGradient(s.x, s.y - 20, 35, s.x, s.y - 20, radius);
    if (floor?.zoneType === 'town') {
      // Pleasant sunlit / twilight courtyard ambience
      lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.04)');
      lightGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.12)');
      lightGrad.addColorStop(1, 'rgba(15, 23, 42, 0.28)');
    } else if (floor?.zoneType === 'overworld') {
      // Moody open wilderness overcast
      lightGrad.addColorStop(0, 'rgba(224, 242, 254, 0.05)');
      lightGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.32)');
      lightGrad.addColorStop(1, 'rgba(9, 13, 22, 0.65)');
    } else {
      // Subterranean dark dungeon torch halos
      lightGrad.addColorStop(0, 'rgba(251, 191, 36, 0.09)');
      lightGrad.addColorStop(0.55, 'rgba(15, 23, 42, 0.38)');
      lightGrad.addColorStop(1, 'rgba(3, 7, 18, 0.88)');
    }

    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. Secondary Light Wells (Exit portal, Shrines, Spawners, Lava, Lanterns, and Gates)
    if (floor) {
      ctx.globalCompositeOperation = 'lighter';

      const minX = Math.max(0, Math.floor(camX - 10));
      const maxX = Math.min(floor.width - 1, Math.ceil(camX + 10));
      const minY = Math.max(0, Math.floor(camY - 10));
      const maxY = Math.min(floor.height - 1, Math.ceil(camY + 10));

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const tile = floor.tiles[y][x];
          if (
            tile === 'exit_portal' ||
            tile === 'shrine' ||
            tile === 'spawner' ||
            tile === 'lava' ||
            tile === 'lantern' ||
            tile === 'town_gate' ||
            tile === 'dungeon_gate'
          ) {
            const ls = worldToScreen(x, y, 0, camX, camY, this.width, this.height);
            let emitR = 100;
            let emitColor = 'rgba(192, 132, 252, 0.18)';

            if (tile === 'exit_portal') {
              emitR = 180 + Math.sin(time * 4) * 15;
              emitColor = 'rgba(168, 85, 247, 0.25)';
            } else if (tile === 'shrine') {
              emitR = 140 + Math.sin(time * 3) * 10;
              emitColor = 'rgba(56, 189, 248, 0.22)';
            } else if (tile === 'spawner') {
              emitR = 110 + Math.sin(time * 6) * 12;
              emitColor = 'rgba(239, 68, 68, 0.2)';
            } else if (tile === 'lava') {
              emitR = 75 + Math.sin(time * 2 + x) * 8;
              emitColor = 'rgba(249, 115, 22, 0.14)';
            } else if (tile === 'lantern') {
              emitR = 145 + Math.sin(time * 5 + x) * 8;
              emitColor = 'rgba(254, 240, 138, 0.28)';
            } else if (tile === 'town_gate') {
              emitR = 180 + Math.sin(time * 3) * 12;
              emitColor = 'rgba(110, 231, 183, 0.26)';
            } else if (tile === 'dungeon_gate') {
              emitR = 190 + Math.sin(time * 4) * 14;
              emitColor = 'rgba(192, 132, 252, 0.28)';
            }

            const eGrad = ctx.createRadialGradient(ls.x, ls.y, 5, ls.x, ls.y, emitR);
            eGrad.addColorStop(0, emitColor);
            eGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = eGrad;
            ctx.beginPath();
            ctx.arc(ls.x, ls.y, emitR, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    ctx.restore();
  }

  private drawZoneBanner(floor: DungeonFloor, dt: number) {
    if (this.zoneBannerTimer > 0) {
      this.zoneBannerTimer -= dt;
      const ctx = this.ctx;
      ctx.save();
      const alpha = Math.min(1, this.zoneBannerTimer > 0.6 ? (3.8 - this.zoneBannerTimer) / 0.6 : this.zoneBannerTimer / 0.6);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      const bx = this.width / 2;
      const by = 80;

      // Banner background
      const grad = ctx.createLinearGradient(bx - 240, by, bx + 240, by);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      grad.addColorStop(0.2, 'rgba(15, 23, 42, 0.88)');
      grad.addColorStop(0.5, 'rgba(2, 6, 23, 0.96)');
      grad.addColorStop(0.8, 'rgba(15, 23, 42, 0.88)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

      ctx.fillStyle = grad;
      ctx.fillRect(bx - 240, by - 34, 480, 68);

      // Gold border trim lines
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - 200, by - 34);
      ctx.lineTo(bx + 200, by - 34);
      ctx.moveTo(bx - 200, by + 34);
      ctx.lineTo(bx + 200, by + 34);
      ctx.stroke();

      // Zone Title
      ctx.font = 'bold 20px "Cinzel", "Press Start 2P", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 8;
      ctx.fillText(floor.zoneName, bx, by - 4);

      // Subtitle / Environment badge
      ctx.font = '12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = floor.isIndoor ? '#93c5fd' : '#86efac';
      const weatherLabel =
        floor.weather === 'rain'
          ? '暴雨倾盆'
          : floor.weather === 'thunderstorm'
          ? '狂暴雷暴'
          : floor.weather === 'fog'
          ? '浓烈寒雾'
          : floor.weather === 'ash_storm'
          ? '熔岩灰烬'
          : '晴朗微风';
      ctx.fillText(
        `${floor.isIndoor ? '【室内 · 深邃遗迹】' : '【室外 · 广袤天地】'} · 天气: ${weatherLabel}`,
        bx,
        by + 20
      );

      ctx.restore();
    }
  }

  private drawAmbientWeatherAndAtmosphere(theme: string, camX: number, camY: number, time: number) {
    const ctx = this.ctx;
    ctx.save();

    const particleCount = 85;

    for (let i = 0; i < particleCount; i++) {
      const seed = i * 19937 + 1013904223;
      const speedFactor = 0.5 + ((seed % 50) / 100);

      if (theme === 'nether') {
        // Nether Theme: Fiery floating embers and swirling black/grey ash flakes
        const px = ((seed * 29 + Math.sin(time * 1.8 + i) * 35 + camX * 8) % (this.width + 120)) - 60;
        // Rising upwards
        const rawY = (seed * 43 - time * 55 * speedFactor) % (this.height + 120);
        const py = rawY < 0 ? rawY + (this.height + 120) - 60 : rawY - 60;

        const isEmber = i % 3 !== 0;
        const size = isEmber ? (seed % 3) + 1.5 : (seed % 4) + 2.5;
        const pulse = Math.sin(time * 5 + i) * 0.3 + 0.7;

        if (isEmber) {
          ctx.fillStyle = (i % 2 === 0) ? `rgba(249, 115, 22, ${0.75 * pulse})` : `rgba(239, 68, 68, ${0.85 * pulse})`;
          ctx.fillRect(px, py, size, size);
          // Spark aura
          ctx.fillStyle = `rgba(254, 240, 138, ${0.4 * pulse})`;
          ctx.fillRect(px - 1, py - 1, size + 2, size + 2);
        } else {
          // Ash flake
          ctx.fillStyle = `rgba(38, 38, 38, ${0.65 * pulse})`;
          ctx.fillRect(px, py, size, size * 0.8);
        }
      } else if (theme === 'end') {
        // The End Theme: Ethereal purple Ender void motes and twinkling void rift dust
        const px = ((seed * 37 + Math.cos(time * 1.2 + i * 0.4) * 45) % (this.width + 100)) - 50;
        const rawY = (seed * 51 - time * 28 * speedFactor) % (this.height + 100);
        const py = rawY < 0 ? rawY + (this.height + 100) - 50 : rawY - 50;

        const twinkle = Math.abs(Math.sin(time * 3 + i * 1.3));
        const size = (seed % 3) + 2;

        ctx.fillStyle = (i % 2 === 0) ? `rgba(192, 132, 252, ${0.8 * twinkle})` : `rgba(147, 51, 234, ${0.7 * twinkle})`;
        ctx.beginPath();
        ctx.moveTo(px, py - size);
        ctx.lineTo(px + size * 0.8, py);
        ctx.lineTo(px, py + size);
        ctx.lineTo(px - size * 0.8, py);
        ctx.closePath();
        ctx.fill();
      } else {
        // Cellar / Dungeon Theme: Floating dust motes drifting through torchlight
        const px = ((seed * 17 + time * 14 * speedFactor + Math.sin(time * 0.8 + i) * 20) % (this.width + 100)) - 50;
        const py = ((seed * 31 + Math.sin(time * 1.4 + i * 0.6) * 30 + time * 4) % (this.height + 100)) - 50;

        const size = (seed % 3) + 1.2;
        const alpha = (0.28 + Math.sin(time * 2.2 + i) * 0.15);

        ctx.fillStyle = (i % 3 === 0) ? `rgba(254, 240, 138, ${alpha})` : `rgba(226, 232, 240, ${alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawFloatingTexts(floatingTexts: FloatingText[], camX: number, camY: number) {
    if (!floatingTexts || !Array.isArray(floatingTexts)) return;
    const ctx = this.ctx;

    for (const text of floatingTexts) {
      const s = worldToScreen(text.x, text.y, 1.2, camX, camY, this.width, this.height);
      const alpha = Math.max(0, text.life / 1.0);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = text.isCrit ? 'bold 18px "Cinzel", "Press Start 2P", sans-serif' : 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';

      // Outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(text.text, s.x, s.y);

      // Fill
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, s.x, s.y);

      ctx.restore();
    }
  }
}
