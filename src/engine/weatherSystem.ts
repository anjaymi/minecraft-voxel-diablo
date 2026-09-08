import { WeatherType } from '../types';
import { soundManager } from '../audio/soundManager';

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
  alpha: number;
}

interface SplashRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

interface FogPuff {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  alpha: number;
  seed: number;
}

interface LightningBolt {
  segments: { x: number; y: number }[];
  alpha: number;
}

interface AshParticle {
  x: number;
  y: number;
  size: number;
  vy: number;        // 下落速度（灰烬为正；余烬为负即上浮）
  swaySeed: number;
  alpha: number;
  isEmber: boolean;  // 余烬（亮橙） vs 灰烬（暗灰）
}

export class WeatherSystem {
  private rainDrops: RainDrop[] = [];
  private ripples: SplashRipple[] = [];
  private fogPuffs: FogPuff[] = [];
  private lightningBolts: LightningBolt[] = [];
  private ashParticles: AshParticle[] = [];

  // Lightning timing
  public screenFlashAlpha: number = 0;
  private lightningTimer: number = 4.0;
  private lastTime: number = 0;

  constructor() {
    this.initFog();
  }

  private initFog() {
    this.fogPuffs = [];
    for (let i = 0; i < 28; i++) {
      this.fogPuffs.push({
        x: Math.random() * 1600,
        y: Math.random() * 1000,
        radius: 120 + Math.random() * 160,
        speedX: (Math.random() - 0.5) * 18,
        speedY: (Math.random() - 0.5) * 10,
        alpha: 0.12 + Math.random() * 0.16,
        seed: Math.random() * 1000,
      });
    }
  }

  public update(dt: number, weather: WeatherType, width: number, height: number, isIndoor: boolean = false) {
    // 1. Rain & Thunderstorm Drop Update（室内不渲染雨幕）
    if ((weather === 'rain' || weather === 'thunderstorm') && !isIndoor) {
      const targetCount = weather === 'thunderstorm' ? 220 : 120;
      while (this.rainDrops.length < targetCount) {
        this.rainDrops.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * -height * 0.5,
          length: 14 + Math.random() * 18,
          speed: 700 + Math.random() * 450,
          thickness: weather === 'thunderstorm' ? 1.5 : 1.0,
          alpha: 0.35 + Math.random() * 0.35,
        });
      }

      for (let i = this.rainDrops.length - 1; i >= 0; i--) {
        const drop = this.rainDrops[i];
        drop.x -= 160 * dt; // Slanted by wind
        drop.y += drop.speed * dt;

        if (drop.y > height) {
          // Chance to spawn ground ripple splash
          if (Math.random() < 0.25) {
            this.ripples.push({
              x: drop.x,
              y: Math.min(height - 10, drop.y - Math.random() * 40),
              radius: 2,
              maxRadius: 10 + Math.random() * 12,
              alpha: 0.6,
            });
          }
          // Reset rain drop to top
          drop.x = Math.random() * (width + 200) - 100;
          drop.y = -Math.random() * 50;
        }
      }
    } else {
      this.rainDrops = [];
    }

    // 2. Splash Ripples update
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += 36 * dt;
      rip.alpha -= 1.8 * dt;
      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 2.5 灰烬风暴（火山/熔岩灰）—— 仅室外：灰烬飘落 + 余烬上浮闪烁
    if (weather === 'ash_storm' && !isIndoor) {
      while (this.ashParticles.length < 130) {
        const isEmber = Math.random() < 0.3;
        this.ashParticles.push({
          x: Math.random() * (width + 160) - 80,
          y: Math.random() * height,
          size: isEmber ? 1.2 + Math.random() * 1.6 : 1.6 + Math.random() * 2.6,
          vy: isEmber ? -(16 + Math.random() * 26) : 26 + Math.random() * 48,
          swaySeed: Math.random() * 1000,
          alpha: 0.5 + Math.random() * 0.4,
          isEmber,
        });
      }
      for (let i = this.ashParticles.length - 1; i >= 0; i--) {
        const ash = this.ashParticles[i];
        ash.y += ash.vy * dt;
        ash.x += Math.sin(this.lightningTimer * 0.6 + ash.swaySeed) * 14 * dt; // 阵风横向摆动
        if (ash.y < -20 || ash.y > height + 20) {
          ash.x = Math.random() * (width + 160) - 80;
          ash.y = ash.isEmber ? height + 10 : -10; // 灰烬自上而下重生，余烬自下而上
          ash.vy = ash.isEmber ? -(16 + Math.random() * 26) : 26 + Math.random() * 48;
        }
      }
    } else if (this.ashParticles.length > 0) {
      this.ashParticles = [];
    }

    // 3. Lightning & Screen Flashes during Thunderstorm
    if (weather === 'thunderstorm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.triggerLightning(width, height);
        this.lightningTimer = 5.0 + Math.random() * 7.0; // Next strike in 5-12s
      }
    } else {
      this.lightningBolts = [];
    }

    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - dt * 3.8);
    }

    // Decay lightning bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      this.lightningBolts[i].alpha -= dt * 5.0;
      if (this.lightningBolts[i].alpha <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }

    // 4. Fog Puffs Drift
    if (weather === 'fog') {
      for (const puff of this.fogPuffs) {
        puff.x += puff.speedX * dt;
        puff.y += puff.speedY * dt;
        if (puff.x < -puff.radius) puff.x = width + puff.radius;
        if (puff.x > width + puff.radius) puff.x = -puff.radius;
        if (puff.y < -puff.radius) puff.y = height + puff.radius;
        if (puff.y > height + puff.radius) puff.y = -puff.radius;
      }
    }
  }

  private triggerLightning(width: number, height: number) {
    this.screenFlashAlpha = 0.85;
    soundManager.playThunder(1.0);

    // Create jagged procedural lightning bolt branching
    const startX = width * 0.2 + Math.random() * (width * 0.6);
    let curX = startX;
    let curY = 0;
    const targetY = height * 0.55 + Math.random() * (height * 0.35);

    const segments: { x: number; y: number }[] = [{ x: curX, y: curY }];

    while (curY < targetY) {
      curY += 25 + Math.random() * 35;
      curX += (Math.random() - 0.5) * 70;
      segments.push({ x: curX, y: curY });
    }

    this.lightningBolts.push({
      segments,
      alpha: 1.0,
    });
  }

  /**
   * Main Render Pass for Weather & Atmosphere
   */
  public render(
    ctx: CanvasRenderingContext2D,
    weather: WeatherType,
    isIndoor: boolean,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();

    // 1. Render Fog / Frost Mist
    if (weather === 'fog' || (isIndoor && weather === 'clear')) {
      for (const puff of this.fogPuffs) {
        const pulse = Math.sin(time * 0.8 + puff.seed) * 0.04;
        const currentAlpha = Math.max(0, puff.alpha + pulse);

        const grad = ctx.createRadialGradient(
          puff.x,
          puff.y,
          puff.radius * 0.1,
          puff.x,
          puff.y,
          puff.radius
        );

        if (isIndoor) {
          // Cavernous damp cold subterranean blue-white mist
          grad.addColorStop(0, `rgba(186, 230, 253, ${currentAlpha * 0.8})`);
          grad.addColorStop(0.6, `rgba(125, 211, 252, ${currentAlpha * 0.35})`);
          grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        } else {
          // Open wilderness rolling white-grey mist
          grad.addColorStop(0, `rgba(241, 245, 249, ${currentAlpha * 0.9})`);
          grad.addColorStop(0.6, `rgba(203, 213, 225, ${currentAlpha * 0.4})`);
          grad.addColorStop(1, 'rgba(148, 163, 184, 0)');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cold frost border vignette
      const frostVignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.35,
        width / 2,
        height / 2,
        width * 0.72
      );
      frostVignette.addColorStop(0, 'rgba(186, 230, 253, 0)');
      frostVignette.addColorStop(1, 'rgba(56, 189, 248, 0.12)');
      ctx.fillStyle = frostVignette;
      ctx.fillRect(0, 0, width, height);
    }

    // 1.5 灰烬风暴：飘落灰烬 + 余烬辉光 + 暗琥珀色调
    if (weather === 'ash_storm' && this.ashParticles.length > 0) {
      ctx.save();
      for (const ash of this.ashParticles) {
        const pulse = 0.6 + Math.sin(this.lightningTimer * 1.6 + ash.swaySeed) * 0.3;
        ctx.globalAlpha = Math.max(0.15, ash.alpha * pulse);
        ctx.fillStyle = ash.isEmber
          ? ash.swaySeed % 2 === 0
            ? 'rgba(249, 115, 22, 0.95)'
            : 'rgba(239, 68, 68, 0.9)'
          : 'rgba(64, 64, 64, 0.85)';
        if (ash.isEmber) {
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(ash.x, ash.y, ash.size, ash.size * 0.8);
      }
      ctx.restore();
      // 暗琥珀环境色调
      ctx.fillStyle = 'rgba(87, 43, 17, 0.10)';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Render Ground Splash Ripples
    if (this.ripples.length > 0) {
      for (const rip of this.ripples) {
        ctx.save();
        ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha * 0.7})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Isometric flat ground ellipse
        ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Render Rain Drops
    if (this.rainDrops.length > 0) {
      ctx.save();
      ctx.strokeStyle = weather === 'thunderstorm' ? '#93c5fd' : '#bae6fd';
      ctx.lineCap = 'round';

      for (const drop of this.rainDrops) {
        ctx.globalAlpha = drop.alpha;
        ctx.lineWidth = drop.thickness;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        // Slanted down-left
        ctx.lineTo(drop.x - 7, drop.y + drop.length);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Render Lightning Bolts
    if (this.lightningBolts.length > 0) {
      for (const bolt of this.lightningBolts) {
        ctx.save();
        ctx.globalAlpha = bolt.alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#60a5fa';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        for (let i = 0; i < bolt.segments.length; i++) {
          const pt = bolt.segments[i];
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Inner glowing core
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Blinding Screen Flash for Lightning
    if (this.screenFlashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(224, 242, 254, ${this.screenFlashAlpha * 0.75})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.restore();
  }
}

export const weatherSystem = new WeatherSystem();
