import { Particle, VFXSlash, VFXShockwave, Player } from '../types';
import { worldToScreen, ScreenCoord } from './isometric';

export class VFXSystem {
  public slashes: VFXSlash[] = [];
  public shockwaves: VFXShockwave[] = [];
  public particles: Particle[] = [];

  public clear() {
    this.slashes = [];
    this.shockwaves = [];
    this.particles = [];
  }

  // ==========================================
  // SPAWN METHODS
  // ==========================================

  /**
   * Spawn high-fidelity weapon slash wave ribbon
   */
  public spawnSlash(
    x: number,
    y: number,
    z: number,
    angle: number,
    comboStep: number,
    weaponSubType: string = 'sword',
    hasFire: boolean = false,
    hasSweeping: boolean = false
  ) {
    const isAxe = weaponSubType === 'axe';
    const isDagger = weaponSubType === 'dagger';

    let radius = 2.4;
    let arcSpan = Math.PI * 0.75;
    let width = 0.55;
    let duration = 0.22;
    let colorCore = '#ffffff';
    let colorOuter = '#38bdf8';

    if (comboStep === 0) {
      // Step 1: Rapid horizontal crescent sweep
      radius = isAxe ? 2.6 : isDagger ? 2.0 : 2.4;
      arcSpan = Math.PI * 0.8;
      width = 0.45;
      duration = isDagger ? 0.16 : 0.2;
      colorOuter = isAxe ? '#f59e0b' : isDagger ? '#c084fc' : '#38bdf8';
    } else if (comboStep === 1) {
      // Step 2: Powerful rising diagonal upper cleave
      radius = isAxe ? 2.8 : isDagger ? 2.2 : 2.6;
      arcSpan = Math.PI * 0.9;
      width = 0.55;
      duration = 0.22;
      colorOuter = isAxe ? '#ea580c' : '#60a5fa';
    } else {
      // Step 2 (Finisher 3): 360 Overhead leap slam into the ground!
      radius = isAxe ? 3.3 : 2.9;
      arcSpan = Math.PI * 1.55;
      width = 0.85;
      duration = 0.32;
      colorOuter = isAxe ? '#dc2626' : '#f59e0b';
      colorCore = '#fef08a';

      // Ground fracture shockwave on impact
      this.spawnShockwave(x, y, 0, isAxe ? 3.4 : 2.8, colorOuter, true, 0.4);
      this.spawnVoxelDebris(x, y, 0.2, 14, isAxe ? 'nether' : 'stone', 4.5);
    }

    if (hasSweeping) {
      radius *= 1.25;
      arcSpan = Math.PI * 1.6;
    }

    if (hasFire) {
      colorOuter = '#f97316';
      colorCore = '#fef08a';
      // Spawn fire trail embers
      for (let i = 0; i < 8; i++) {
        const pAngle = angle - arcSpan / 2 + Math.random() * arcSpan;
        const pR = radius * (0.6 + Math.random() * 0.4);
        this.particles.push({
          x: x + Math.cos(pAngle) * pR,
          y: y + Math.sin(pAngle) * pR,
          z: z + 0.2,
          vx: Math.cos(pAngle) * 1.5,
          vy: Math.sin(pAngle) * 1.5,
          vz: 0.8 + Math.random() * 1.2,
          color: Math.random() > 0.4 ? '#f97316' : '#fbbf24',
          size: 4 + Math.random() * 3,
          life: 0.35,
          maxLife: 0.35,
          type: 'flame',
          gravity: -1.5, // floats up
        });
      }
    }

    // Leading edge sparks
    const tipCount = isDagger ? 4 : 8;
    for (let i = 0; i < tipCount; i++) {
      const pAngle = angle - arcSpan * 0.3 + Math.random() * arcSpan * 0.6;
      const speed = 3 + Math.random() * 4;
      this.particles.push({
        x: x + Math.cos(pAngle) * radius * 0.9,
        y: y + Math.sin(pAngle) * radius * 0.9,
        z: z + 0.2,
        vx: Math.cos(pAngle) * speed,
        vy: Math.sin(pAngle) * speed,
        vz: 0.5 + Math.random() * 1.5,
        color: colorCore,
        size: 2.5,
        life: 0.18 + Math.random() * 0.1,
        maxLife: 0.28,
        type: 'spark',
        stretch: 2.5,
      });
    }

    this.slashes.push({
      id: `slash_${Date.now()}_${Math.random()}`,
      x,
      y,
      z,
      angle,
      life: duration,
      maxLife: duration,
      radius,
      arcSpan,
      colorCore,
      colorOuter,
      width,
      comboStep,
      weaponSubType,
      hasFire,
      hasSweeping,
    });
  }

  /**
   * Spawn 360 whirlwind spin attack (Skill 4)
   */
  public spawnWhirlwind(x: number, y: number, z: number, radius: number = 3.2, color: string = '#38bdf8') {
    this.slashes.push({
      id: `whirl_${Date.now()}`,
      x,
      y,
      z,
      angle: 0,
      life: 0.4,
      maxLife: 0.4,
      radius,
      arcSpan: Math.PI * 2,
      colorCore: '#ffffff',
      colorOuter: color,
      width: 0.8,
      comboStep: 2,
      weaponSubType: 'sword',
      hasSweeping: true,
    });

    this.spawnShockwave(x, y, 0, radius, color, false, 0.35);

    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      this.particles.push({
        x: x + Math.cos(a) * (radius * 0.85),
        y: y + Math.sin(a) * (radius * 0.85),
        z: z + 0.2,
        vx: Math.cos(a + Math.PI / 2) * 6,
        vy: Math.sin(a + Math.PI / 2) * 6,
        vz: 0.5,
        color: i % 2 === 0 ? '#ffffff' : color,
        size: 3,
        life: 0.3,
        maxLife: 0.3,
        type: 'spark',
        stretch: 3,
      });
    }
  }

  /**
   * Expanding ground shockwave with optional fracture cracks
   */
  public spawnShockwave(
    x: number,
    y: number,
    z: number,
    maxRadius: number,
    color: string = '#f59e0b',
    hasCracks: boolean = false,
    duration: number = 0.35
  ) {
    this.shockwaves.push({
      id: `shock_${Date.now()}_${Math.random()}`,
      x,
      y,
      z,
      life: duration,
      maxLife: duration,
      maxRadius,
      color,
      lineWidth: 3,
      hasCracks,
    });
  }

  /**
   * Directional velocity-stretched sparks
   */
  public spawnSparks(
    x: number,
    y: number,
    z: number,
    count: number,
    color: string = '#facc15',
    speed: number = 5,
    spread: number = Math.PI * 2,
    baseAngle: number = 0
  ) {
    for (let i = 0; i < count; i++) {
      const angle = baseAngle - spread / 2 + Math.random() * spread;
      const spd = speed * (0.6 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        z: Math.max(0.1, z),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: 1 + Math.random() * 3,
        color,
        size: 2.5,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        type: 'spark',
        stretch: 2.8,
        gravity: 12,
      });
    }
  }

  /**
   * 3D Minecraft tumbling voxel blocks
   */
  public spawnVoxelDebris(
    x: number,
    y: number,
    z: number,
    count: number,
    type: 'stone' | 'nether' | 'gold' | 'dirt' | 'emerald' | 'wood' = 'stone',
    speed: number = 4
  ) {
    let topColor = '#94a3b8';
    let sideColor = '#475569';

    if (type === 'nether') {
      topColor = '#ef4444';
      sideColor = '#7f1d1d';
    } else if (type === 'gold') {
      topColor = '#fef08a';
      sideColor = '#d97706';
    } else if (type === 'emerald') {
      topColor = '#a7f3d0';
      sideColor = '#059669';
    } else if (type === 'wood') {
      topColor = '#d97706';
      sideColor = '#78350f';
    } else if (type === 'dirt') {
      topColor = '#84cc16';
      sideColor = '#713f12';
    }

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = speed * (0.5 + Math.random() * 0.9);
      this.particles.push({
        x,
        y,
        z: Math.max(0.2, z),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: 2.5 + Math.random() * 3.5,
        color: topColor,
        size: 4 + Math.random() * 4,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        type: 'voxel',
        gravity: 16,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 14,
        voxelTopColor: topColor,
        voxelSideColor: sideColor,
        bounces: 2,
      });
    }
  }

  /**
   * Destructible Environment: Wooden barrel/crate splintering debris
   */
  public spawnWoodSplinters(x: number, y: number, z: number, count: number = 14) {
    // 1. Tumbling wooden planks and chips
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3.5 + Math.random() * 4.5;
      const isPlank = i % 2 === 0;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + (Math.random() - 0.5) * 0.4,
        z: Math.max(0.2, z),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: 3.5 + Math.random() * 4.0,
        color: i % 3 === 0 ? '#b45309' : i % 3 === 1 ? '#d97706' : '#78350f',
        size: isPlank ? 8 + Math.random() * 6 : 4 + Math.random() * 4,
        life: 0.65 + Math.random() * 0.35,
        maxLife: 1.0,
        type: 'splinter',
        gravity: 16,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 16,
        bounces: 2,
      });
    }

    // 2. Iron nail sparks and dust
    this.spawnSparks(x, y, z + 0.2, 8, '#cbd5e1', 5);
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x,
        y,
        z: z + 0.1,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: 0.8 + Math.random() * 1.2,
        color: '#94a3b8',
        size: 8,
        life: 0.35,
        maxLife: 0.35,
        type: 'smoke',
        gravity: 2,
      });
    }
  }

  /**
   * Destructible Environment: Grass & foliage fluttering leaf debris
   */
  public spawnLeafDebris(x: number, y: number, z: number, count: number = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 2.0 + Math.random() * 3.5;
      const colors = ['#22c55e', '#16a34a', '#84cc16', '#4ade80', '#15803d'];
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.5,
        y: y + (Math.random() - 0.5) * 0.5,
        z: Math.max(0.1, z),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: 2.5 + Math.random() * 3.5,
        color: colors[i % colors.length],
        size: 5 + Math.random() * 4,
        life: 0.75 + Math.random() * 0.45,
        maxLife: 1.2,
        type: 'leaf',
        gravity: 7, // gentler gravity for organic floating leaves
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 12,
        bounces: 1,
      });
    }
  }

  /**
   * Ender teleport purple motes
   */
  public spawnVoidMote(x: number, y: number, z: number, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.2;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.4,
        y: y + (Math.random() - 0.5) * 0.4,
        z: Math.max(0.1, z + Math.random() * 0.8),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: 1.2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#c084fc' : '#a855f7',
        size: 3.5,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        type: 'spark',
        stretch: 1.4,
        gravity: 2,
      });
    }
  }

  /**
   * Destructible Environment: Ceramic pot / terracotta urn shards
   */
  public spawnPotShards(x: number, y: number, z: number, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 3.0 + Math.random() * 4.0;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 0.3,
        y: y + (Math.random() - 0.5) * 0.3,
        z: Math.max(0.15, z),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        vz: 2.8 + Math.random() * 3.8,
        color: i % 2 === 0 ? '#ea580c' : '#c2410c',
        size: 5 + Math.random() * 5,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.9,
        type: 'shard',
        gravity: 17,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 14,
        bounces: 2,
      });
    }
  }

  /**
   * Hit impact feedback (critical strike, fire, cleave)
   */
  public spawnHitSparks(x: number, y: number, z: number, isCrit: boolean, hasFire: boolean = false) {
    const count = isCrit ? 14 : 7;
    const color = isCrit ? '#fef08a' : '#ffffff';
    this.spawnSparks(x, y, z, count, color, isCrit ? 6 : 4);

    if (isCrit) {
      // Golden stars
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          x,
          y,
          z: z + 0.3,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3,
          vz: 1.5 + Math.random() * 2,
          color: '#fbbf24',
          size: 6,
          life: 0.45,
          maxLife: 0.45,
          type: 'star',
          rotation: Math.random() * Math.PI,
          rotationSpeed: 6,
          gravity: 8,
        });
      }
    }

    if (hasFire) {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 0.4,
          y: y + (Math.random() - 0.5) * 0.4,
          z: z + 0.2,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          vz: 1 + Math.random() * 2,
          color: '#f97316',
          size: 4,
          life: 0.35,
          maxLife: 0.35,
          type: 'flame',
          gravity: -2,
        });
      }
    }
  }

  /**
   * TNT or Creeper blast explosion
   */
  public spawnExplosion(x: number, y: number, radius: number = 3.5, color: string = '#ef4444') {
    // 1. Dual Shockwave Rings
    this.spawnShockwave(x, y, 0, radius * 1.2, '#f97316', true, 0.45);
    this.spawnShockwave(x, y, 0, radius * 0.7, '#ffffff', false, 0.25);

    // 2. Flying Voxel Shrapnel
    this.spawnVoxelDebris(x, y, 0.5, 18, 'nether', 6.5);
    this.spawnSparks(x, y, 0.5, 24, '#fef08a', 8);

    // 3. Billowing Smoke Plumes
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = Math.random() * 1.2;
      this.particles.push({
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        z: 0.3,
        vx: Math.cos(a) * (1.5 + Math.random() * 2.5),
        vy: Math.sin(a) * (1.5 + Math.random() * 2.5),
        vz: 1.5 + Math.random() * 2,
        color: i % 3 === 0 ? '#451a03' : i % 2 === 0 ? '#27272a' : '#71717a',
        size: 10 + Math.random() * 8,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        type: 'smoke',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 4,
        gravity: -1.2,
      });
    }

    // 4. Central Fire Flash
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      this.particles.push({
        x: x + Math.cos(a) * 0.5,
        y: y + Math.sin(a) * 0.5,
        z: 0.4,
        vx: Math.cos(a) * 3,
        vy: Math.sin(a) * 3,
        vz: 2,
        color: '#f97316',
        size: 12,
        life: 0.25,
        maxLife: 0.25,
        type: 'flame',
      });
    }
  }

  /**
   * Ender Pearl spatial warp rupture
   */
  public spawnEnderVortex(x: number, y: number) {
    this.spawnShockwave(x, y, 0, 3.2, '#c084fc', false, 0.35);

    // Inward and outward void particles
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * Math.PI * 2;
      const dist = 0.5 + Math.random() * 2.2;
      this.particles.push({
        x: x + Math.cos(a) * dist,
        y: y + Math.sin(a) * dist,
        z: 0.2 + Math.random() * 0.8,
        vx: -Math.cos(a) * 3, // sucked inward then explodes
        vy: -Math.sin(a) * 3,
        vz: (Math.random() - 0.5) * 2,
        color: i % 2 === 0 ? '#a855f7' : '#e9d5ff',
        size: 4 + Math.random() * 3,
        life: 0.45,
        maxLife: 0.45,
        type: 'void',
        rotation: Math.random() * Math.PI,
        rotationSpeed: 6,
      });
    }
  }

  /**
   * Golden Apple Divine Aegis activation
   */
  public spawnDivineAegis(x: number, y: number) {
    this.spawnShockwave(x, y, 0, 2.5, '#fbbf24', false, 0.4);

    // Rising golden hearts & sparkles
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.2;
      this.particles.push({
        x: x + Math.cos(a) * r,
        y: y + Math.sin(a) * r,
        z: 0.2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: 1.8 + Math.random() * 1.5,
        color: '#fbbf24',
        size: 8,
        life: 0.6,
        maxLife: 0.6,
        type: 'heart',
        gravity: -1,
      });
    }
  }

  /**
   * Totem of Undying resurrection apparition
   */
  public spawnTotemRevive(x: number, y: number) {
    this.spawnShockwave(x, y, 0, 4.0, '#10b981', false, 0.6);
    this.spawnShockwave(x, y, 0, 2.8, '#fbbf24', false, 0.4);

    // Rising giant totem spirit
    this.particles.push({
      x,
      y,
      z: 0.5,
      vx: 0,
      vy: 0,
      vz: 2.2,
      color: '#f59e0b',
      size: 28,
      life: 0.85,
      maxLife: 0.85,
      type: 'totem',
      gravity: -0.5,
    });

    // Radiant emerald & gold sunburst
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 5;
      this.particles.push({
        x,
        y,
        z: 1.0,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        vz: (Math.random() - 0.3) * 3,
        color: i % 2 === 0 ? '#10b981' : '#fef08a',
        size: 4,
        life: 0.55,
        maxLife: 0.55,
        type: 'spark',
        stretch: 3,
      });
    }
  }

  /**
   * Dash skid dust puffs
   */
  public spawnDashDust(x: number, y: number, angle: number, armorColor: string = '#38bdf8') {
    for (let i = 0; i < 7; i++) {
      const backAngle = angle + Math.PI + (Math.random() - 0.5) * 0.9;
      const spd = 2 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        z: 0.05,
        vx: Math.cos(backAngle) * spd,
        vy: Math.sin(backAngle) * spd,
        vz: 0.4 + Math.random() * 0.8,
        color: i % 2 === 0 ? armorColor : '#cbd5e1',
        size: 5 + Math.random() * 4,
        life: 0.28,
        maxLife: 0.28,
        type: 'smoke',
        gravity: 4,
      });
    }
  }

  // ==========================================
  // UPDATE LOOP
  // ==========================================

  public update(dt: number) {
    // 1. Update Slashes
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      const s = this.slashes[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // 2. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Gravity and bouncing
      if (p.gravity) {
        p.vz -= p.gravity * dt;
      }
      p.z += p.vz * dt;

      // Floor bounce
      if (p.z <= 0) {
        p.z = 0;
        if (p.bounces && p.bounces > 0) {
          p.bounces--;
          p.vz = -p.vz * 0.45;
          p.vx *= 0.65;
          p.vy *= 0.65;
        } else {
          p.vz = 0;
          p.vx *= 0.85;
          p.vy *= 0.85;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.rotationSpeed) {
        p.rotation = (p.rotation || 0) + p.rotationSpeed * dt;
      }
    }
  }

  // ==========================================
  // RENDERING METHODS
  // ==========================================

  /**
   * Render ground-level effects (shockwaves, cracks, decals)
   */
  public renderGroundVFX(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    ctx.save();

    for (const sw of this.shockwaves) {
      const progress = 1 - sw.life / sw.maxLife;
      const curRadius = sw.maxRadius * progress;
      const alpha = Math.max(0, 1 - progress);

      const center = worldToScreen(sw.x, sw.y, 0, camX, camY, viewportWidth, viewportHeight);

      // Expanding isometric ground ring
      const rx = curRadius * 32;
      const ry = curRadius * 16;

      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(1, sw.lineWidth * (1 - progress * 0.7));
      ctx.globalAlpha = alpha;

      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Second inner glow wave
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx * 0.82, ry * 0.82, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Ground Fracture Cracks if heavy slam
      if (sw.hasCracks) {
        const crackAlpha = Math.max(0, (1 - progress) * 0.8);
        ctx.strokeStyle = `rgba(245, 158, 11, ${crackAlpha})`;
        ctx.lineWidth = 2;

        const crackCount = 6;
        for (let c = 0; c < crackCount; c++) {
          const crackAngle = (c / crackCount) * Math.PI * 2 + 0.2;
          const crackLength = curRadius * 0.9;
          const endPt = worldToScreen(
            sw.x + Math.cos(crackAngle) * crackLength,
            sw.y + Math.sin(crackAngle) * crackLength,
            0,
            camX,
            camY,
            viewportWidth,
            viewportHeight
          );
          ctx.beginPath();
          ctx.moveTo(center.x, center.y);
          ctx.lineTo(endPt.x, endPt.y);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Render dynamic slashes, ribbons, voxels, and particles
   */
  public renderMidVFX(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    ctx.save();

    // 1. Render Slashes & Sword Sweep Ribbons
    for (const s of this.slashes) {
      this.drawSlashRibbon(ctx, s, camX, camY, viewportWidth, viewportHeight);
    }

    // 2. Render Particles
    for (const p of this.particles) {
      this.drawParticle(ctx, p, camX, camY, viewportWidth, viewportHeight);
    }

    ctx.restore();
  }

  /**
   * Draw continuous tapered weapon slash ribbon in isometric 3D space
   */
  private drawSlashRibbon(
    ctx: CanvasRenderingContext2D,
    s: VFXSlash,
    camX: number,
    camY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const progress = 1 - s.life / s.maxLife; // 0 -> 1
    const alpha = Math.sin(progress * Math.PI); // Smooth in and out

    const segments = 16;
    const startA = s.angle - s.arcSpan / 2;
    const currentSweep = s.arcSpan * Math.min(1, progress * 1.35);

    // Construct the outer and inner ring points in screen coordinates
    const outerPoints: ScreenCoord[] = [];
    const innerPoints: ScreenCoord[] = [];

    const innerRadius = Math.max(0.6, s.radius - s.width);
    const outerRadius = s.radius;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Angle along arc
      const curA = startA + t * currentSweep;

      // Thickness tapers at the tail (t=0) and razor-sharp tip (t=1)
      const taper = Math.sin(t * Math.PI);
      const rOuter = innerRadius + (outerRadius - innerRadius) * (0.3 + taper * 0.7);
      const rInner = innerRadius + (outerRadius - innerRadius) * (1 - taper) * 0.2;

      const wxOut = s.x + Math.cos(curA) * rOuter;
      const wyOut = s.y + Math.sin(curA) * rOuter;
      const spOut = worldToScreen(wxOut, wyOut, s.z + 0.3, camX, camY, viewportWidth, viewportHeight);
      outerPoints.push(spOut);

      const wxIn = s.x + Math.cos(curA) * rInner;
      const wyIn = s.y + Math.sin(curA) * rInner;
      const spIn = worldToScreen(wxIn, wyIn, s.z + 0.3, camX, camY, viewportWidth, viewportHeight);
      innerPoints.push(spIn);
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.95));

    // Outer Trail Mesh
    ctx.beginPath();
    ctx.moveTo(outerPoints[0].x, outerPoints[0].y);
    for (let i = 1; i < outerPoints.length; i++) {
      ctx.lineTo(outerPoints[i].x, outerPoints[i].y);
    }
    for (let i = innerPoints.length - 1; i >= 0; i--) {
      ctx.lineTo(innerPoints[i].x, innerPoints[i].y);
    }
    ctx.closePath();

    // Radiant gradient along slash
    const headPt = outerPoints[outerPoints.length - 1];
    const tailPt = outerPoints[0];
    const grad = ctx.createLinearGradient(tailPt.x, tailPt.y, headPt.x, headPt.y);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.65, s.colorOuter);
    grad.addColorStop(1, s.colorCore);

    ctx.fillStyle = grad;
    ctx.fill();

    // Bright Razor Blade Edge
    ctx.beginPath();
    ctx.moveTo(outerPoints[0].x, outerPoints[0].y);
    for (let i = 1; i < outerPoints.length; i++) {
      ctx.lineTo(outerPoints[i].x, outerPoints[i].y);
    }
    ctx.strokeStyle = s.colorCore;
    ctx.lineWidth = s.comboStep === 2 ? 3.5 : 2.0;
    ctx.stroke();

    // Speed Lines & Blade Glint at Tip
    if (progress > 0.1 && progress < 0.85) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(headPt.x, headPt.y, s.comboStep === 2 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw individual specialized particle
   */
  private drawParticle(
    ctx: CanvasRenderingContext2D,
    p: Particle,
    camX: number,
    camY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    const s = worldToScreen(p.x, p.y, p.z, camX, camY, viewportWidth, viewportHeight);
    const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));

    ctx.save();
    ctx.globalAlpha = alpha;

    if (p.type === 'spark') {
      // Directional velocity stretched spark streak
      const stretch = p.stretch || 2;
      const prevX = s.x - p.vx * stretch;
      const prevY = s.y - p.vy * stretch * 0.5 + p.vz * stretch;

      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size * alpha);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Spark tip gleam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x - 1, s.y - 1, 2, 2);
    } else if (p.type === 'voxel') {
      // 3D Isometric Tumbling Minecraft Voxel Block
      ctx.save();
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);

      const sz = p.size;
      const topCol = p.voxelTopColor || p.color;
      const sideCol = p.voxelSideColor || '#334155';

      // Top face
      ctx.fillStyle = topCol;
      ctx.fillRect(-sz / 2, -sz / 2, sz, sz * 0.6);

      // Side face
      ctx.fillStyle = sideCol;
      ctx.fillRect(-sz / 2, -sz / 2 + sz * 0.6, sz, sz * 0.6);

      ctx.restore();
    } else if (p.type === 'smoke') {
      // Soft expanding smoke cloud
      const growSize = p.size * (1 + (1 - alpha) * 0.6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, growSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'flame') {
      // Flickering fiery cube
      const sz = p.size * (0.6 + alpha * 0.4);
      ctx.fillStyle = p.color;
      ctx.fillRect(s.x - sz / 2, s.y - sz / 2, sz, sz);
      // Bright inner core
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(s.x - sz / 4, s.y - sz / 4, sz / 2, sz / 2);
    } else if (p.type === 'star') {
      // Critical Strike 4-pointed Star
      ctx.save();
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      const sz = p.size * (0.8 + (1 - alpha) * 0.4);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.25, -sz * 0.25);
      ctx.lineTo(sz, 0);
      ctx.lineTo(sz * 0.25, sz * 0.25);
      ctx.lineTo(0, sz);
      ctx.lineTo(-sz * 0.25, sz * 0.25);
      ctx.lineTo(-sz, 0);
      ctx.lineTo(-sz * 0.25, -sz * 0.25);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (p.type === 'heart') {
      // Healing Heart
      ctx.font = `${Math.round(p.size)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('❤️', s.x, s.y);
    } else if (p.type === 'void') {
      // Ender Void Rune
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (p.type === 'totem') {
      // Totem of Undying Apparition Spirit
      const sz = p.size * 1.5;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(s.x - sz * 0.3, s.y - sz * 0.6, sz * 0.6, sz * 0.9);
      // Wings
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(s.x - sz * 0.6, s.y - sz * 0.4, sz * 0.3, sz * 0.4);
      ctx.fillRect(s.x + sz * 0.3, s.y - sz * 0.4, sz * 0.3, sz * 0.4);
      // Glowing Emerald Eyes
      ctx.fillStyle = '#10b981';
      ctx.fillRect(s.x - sz * 0.2, s.y - sz * 0.4, sz * 0.12, sz * 0.12);
      ctx.fillRect(s.x + sz * 0.08, s.y - sz * 0.4, sz * 0.12, sz * 0.12);
    } else if (p.type === 'splinter') {
      // Tumbling wooden plank / splinter
      ctx.save();
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      const w = p.size;
      const h = Math.max(2.5, p.size * 0.38);

      // Wood plank base
      ctx.fillStyle = p.color;
      ctx.fillRect(-w / 2, -h / 2, w, h);

      // Darker wood grain stripe
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(-w / 2, -1, w, 1.2);

      // Highlight bevel edge
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(-w / 2, -h / 2, w, 0.8);
      ctx.restore();
    } else if (p.type === 'leaf') {
      // Organic fluttering foliage leaf
      ctx.save();
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      const sz = p.size;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      // Pointed leaf oval
      ctx.moveTo(0, -sz * 0.7);
      ctx.quadraticCurveTo(sz * 0.5, 0, 0, sz * 0.7);
      ctx.quadraticCurveTo(-sz * 0.5, 0, 0, -sz * 0.7);
      ctx.fill();

      // Leaf central vein line
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.6);
      ctx.lineTo(0, sz * 0.6);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'shard') {
      // Terracotta ceramic jagged shard
      ctx.save();
      ctx.translate(s.x, s.y);
      if (p.rotation) ctx.rotate(p.rotation);
      const sz = p.size;

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.5, -sz * 0.4);
      ctx.lineTo(sz * 0.6, -sz * 0.2);
      ctx.lineTo(sz * 0.2, sz * 0.5);
      ctx.lineTo(-sz * 0.4, sz * 0.3);
      ctx.closePath();
      ctx.fill();

      // Glaze highlight
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(-sz * 0.2, -sz * 0.2, sz * 0.4, 1.5);
      ctx.restore();
    } else {
      // Default flat particle
      ctx.fillStyle = p.color;
      ctx.fillRect(s.x - p.size / 2, s.y - p.size / 2, p.size, p.size);
    }

    ctx.restore();
  }

  /**
   * Render dynamic aim lines & reticles for Bow, TNT, and Ender Pearl
   */
  public renderAimingOverlay(
    ctx: CanvasRenderingContext2D,
    player: Player,
    mouseWorldX: number,
    mouseWorldY: number,
    camX: number,
    camY: number,
    viewportWidth: number,
    viewportHeight: number,
    time: number
  ) {
    if (player.isBowAiming) {
      // Bow Aiming Trajectory Guide Line & Reticle
      const pScreen = worldToScreen(player.x, player.y, 0.4, camX, camY, viewportWidth, viewportHeight);
      const mScreen = worldToScreen(mouseWorldX, mouseWorldY, 0, camX, camY, viewportWidth, viewportHeight);

      ctx.save();
      // Glowing Dashed Laser Trajectory
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -time * 30;

      ctx.beginPath();
      ctx.moveTo(pScreen.x, pScreen.y);
      ctx.lineTo(mScreen.x, mScreen.y);
      ctx.stroke();

      // Ground Target Reticle
      const pulse = Math.sin(time * 8) * 3;
      const reticleR = 14 + pulse;

      ctx.setLineDash([]);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(mScreen.x, mScreen.y, reticleR, reticleR * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(mScreen.x - reticleR - 4, mScreen.y);
      ctx.lineTo(mScreen.x + reticleR + 4, mScreen.y);
      ctx.moveTo(mScreen.x, mScreen.y - reticleR * 0.5 - 4);
      ctx.lineTo(mScreen.x, mScreen.y + reticleR * 0.5 + 4);
      ctx.stroke();

      // Center bright pip
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(mScreen.x, mScreen.y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

export const vfxSystem = new VFXSystem();
