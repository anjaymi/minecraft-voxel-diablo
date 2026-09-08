import { DungeonFloor, Player, WeatherType, ZoneType } from '../types';
import { gameEventBus, GameEvents } from '../engine/events';
import { isWaterTileType } from '../engine/map/MapConstants';
import { soundManager } from './soundManager';

/**
 * AmbientLayers — 连续环境音层系统（与 soundManager 的离散单发声互补）。
 *
 * 信号链：噪声/振荡源 → 滤波 → 调幅级（相对颤动，随层增益归零而静音）
 *        → 层增益（按区域剖面平滑过渡）→ 区域总线 → 主输出。
 *
 * ⚠️ 调幅必须作用于独立 modGain 而非直接调制 layerGain：
 *    绝对深度 LFO 会让接近零的层增益摆到负值，产生相位反转的抽吸噪声。
 */

interface AmbientLayer {
  gain: GainNode;
  target: number;
}

type LayerKey = 'wind' | 'rustle' | 'river' | 'rumble' | 'fire' | 'shimmer' | 'rain';

/** 各区域层增益剖面（rain 由天气驱动，默认 0） */
const ZONE_PROFILES: Record<ZoneType, Record<LayerKey, number>> = {
  town:      { wind: 0.030, rustle: 0.012, river: 0.000, rumble: 0.000, fire: 0.000, shimmer: 0.000, rain: 0.000 },
  overworld: { wind: 0.055, rustle: 0.024, river: 0.012, rumble: 0.000, fire: 0.000, shimmer: 0.000, rain: 0.000 },
  dungeon:   { wind: 0.012, rustle: 0.000, river: 0.000, rumble: 0.040, fire: 0.000, shimmer: 0.000, rain: 0.000 },
  nether:    { wind: 0.020, rustle: 0.000, river: 0.000, rumble: 0.038, fire: 0.040, shimmer: 0.000, rain: 0.000 },
  end:       { wind: 0.008, rustle: 0.000, river: 0.000, rumble: 0.018, fire: 0.000, shimmer: 0.028, rain: 0.000 },
  frost:     { wind: 0.060, rustle: 0.000, river: 0.006, rumble: 0.010, fire: 0.000, shimmer: 0.006, rain: 0.000 },
  volcano:   { wind: 0.024, rustle: 0.000, river: 0.000, rumble: 0.048, fire: 0.042, shimmer: 0.000, rain: 0.000 },
  mushroom:  { wind: 0.018, rustle: 0.030, river: 0.004, rumble: 0.008, fire: 0.000, shimmer: 0.014, rain: 0.000 },
  desert:    { wind: 0.048, rustle: 0.000, river: 0.000, rumble: 0.006, fire: 0.000, shimmer: 0.000, rain: 0.000 },
  swamp:     { wind: 0.020, rustle: 0.014, river: 0.018, rumble: 0.012, fire: 0.000, shimmer: 0.004, rain: 0.000 },
  cursed:    { wind: 0.032, rustle: 0.006, river: 0.000, rumble: 0.022, fire: 0.000, shimmer: 0.010, rain: 0.000 },
  keep:      { wind: 0.026, rustle: 0.010, river: 0.000, rumble: 0.008, fire: 0.006, shimmer: 0.000, rain: 0.000 },
};

interface TremoloSpec {
  rateHz: number;
  /** 相对深度（0-0.5）：调制围绕 1 上下摆动，不产生负增益 */
  depth: number;
}

class AmbientLayerSystem {
  private ctx: AudioContext | null = null;
  private zoneBus: GainNode | null = null;
  private layers = new Map<LayerKey, AmbientLayer>();
  private noiseBuffer: AudioBuffer | null = null;
  private currentZone: ZoneType | null = null;
  private lastWeather: WeatherType | null = null;
  private lastMuteState: boolean | null = null;
  private waterScanTimer = 0;
  private nearestWaterDist = 999;

  constructor() {
    gameEventBus.on(GameEvents.ZONE_ENTERED, ({ floor }) => this.setZone(floor));
  }

  /** 切换区域剖面（层增益在 update 中平滑过渡） */
  private setZone(floor: DungeonFloor): void {
    this.currentZone = floor.zoneType;
    this.lastWeather = floor.weather || 'clear';
    this.applyProfile(floor.zoneType, this.lastWeather);
  }

  private applyProfile(zone: ZoneType, weather: WeatherType): void {
    const profile = { ...ZONE_PROFILES[zone] };
    // 天气联动：雨/雷暴时淡入雨声层并增强风层；灰烬风暴增强风与低鸣
    if (weather === 'thunderstorm') {
      profile.wind *= 2.0;
      profile.rain = 0.3;
    } else if (weather === 'rain') {
      profile.wind *= 1.5;
      profile.rain = 0.2;
    } else if (weather === 'ash_storm') {
      profile.wind *= 1.6;
      profile.rain = 0.0;
    } else {
      profile.rain = 0.0;
    }

    for (const [key, layer] of this.layers) {
      layer.target = profile[key] ?? 0;
    }
  }

  /** 惰性构建音频图（首次 update 或首次进入区域时） */
  private ensureGraph(): void {
    if (this.ctx || this.zoneBus) return;
    const ctx = soundManager.getAudioContext();
    if (!ctx) return;
    this.ctx = ctx;

    this.zoneBus = ctx.createGain();
    this.zoneBus.gain.value = 0.75;
    soundManager.connectToMasterBus(this.zoneBus);

    this.noiseBuffer = this.createNoiseBuffer(ctx, 2);

    this.layers.set('wind', {
      gain: this.createNoiseLayer('bandpass', 420, 0.6, { rateHz: 0.09, depth: 0.3 }),
      target: 0,
    });
    this.layers.set('rustle', {
      gain: this.createNoiseLayer('highpass', 2800, 0.7, { rateHz: 0.05, depth: 0.4 }),
      target: 0,
    });
    this.layers.set('river', {
      gain: this.createNoiseLayer('bandpass', 950, 1.3, { rateHz: 0.35, depth: 0.22 }),
      target: 0,
    });
    this.layers.set('rumble', { gain: this.createNoiseLayer('lowpass', 110, 0.8), target: 0 });
    this.layers.set('fire', {
      gain: this.createNoiseLayer('bandpass', 520, 0.9, { rateHz: 1.1, depth: 0.28 }),
      target: 0,
    });
    this.layers.set('shimmer', { gain: this.createDroneLayer(), target: 0 });
    this.layers.set('rain', { gain: this.createNoiseLayer('lowpass', 2000, 0.4), target: 0 });
  }

  /**
   * 噪声层：源 → 滤波 → 调幅级 → 层增益。
   * 调幅级中心为 (1 - depth)，LFO ±depth → 输出在 [1-2d, 1] 相对摆动。
   */
  private createNoiseLayer(
    filterType: BiquadFilterType,
    frequency: number,
    q: number,
    tremolo?: TremoloSpec
  ): GainNode {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    // 调幅级：层静音时输出也为零，杜绝负增益相位反转
    const modGain = ctx.createGain();
    if (tremolo) {
      modGain.gain.value = 1 - tremolo.depth;
      const depthGain = ctx.createGain();
      depthGain.gain.value = tremolo.depth;
      const osc = ctx.createOscillator();
      osc.frequency.value = tremolo.rateHz;
      osc.connect(depthGain);
      depthGain.connect(modGain.gain);
      osc.start();
    } else {
      modGain.gain.value = 1;
    }

    const gain = ctx.createGain();
    gain.gain.value = 0;

    src.connect(filter);
    filter.connect(modGain);
    modGain.connect(gain);
    gain.connect(this.zoneBus!);
    src.start();
    return gain;
  }

  /** 虚空泛音：基频 + 纯五度失谐正弦 */
  private createDroneLayer(): GainNode {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.zoneBus!);

    for (const [freq, detune] of [[110, 0], [165, 7], [220, -5]] as const) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.33;
      osc.connect(voiceGain);
      voiceGain.connect(gain);
      osc.start();
    }
    return gain;
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      // 白噪声 + 轻微布朗化，听感更厚
      const white = Math.random() * 2 - 1;
      last = (last + 0.03 * white) / 1.03;
      data[i] = white * 0.6 + last * 3;
    }
    return buffer;
  }

  /** 每帧更新：邻水扫描 + 层增益平滑 + 静音联动 */
  public update(dt: number, player: Player, floor: DungeonFloor): void {
    this.ensureGraph();
    if (!this.ctx || !this.zoneBus) return;

    const muted = !soundManager.enabled;
    if (muted !== this.lastMuteState) {
      // 仅在静音状态翻转时写入自动化，避免每帧堆积事件
      this.zoneBus.gain.setTargetAtTime(muted ? 0 : 0.75, this.ctx.currentTime, 0.25);
      this.lastMuteState = muted;
    }
    if (muted) return;

    // 首帧 / 换区 / 天气变化时重套剖面（雨停雨落平滑淡入淡出）
    if (this.currentZone !== floor.zoneType || this.lastWeather !== (floor.weather || 'clear')) {
      this.setZone(floor);
    }

    // 每 0.25s 扫描一次邻水距离（半径 7）
    this.waterScanTimer -= dt;
    if (this.waterScanTimer <= 0) {
      this.waterScanTimer = 0.25;
      this.nearestWaterDist = scanNearestWater(floor, player.x, player.y, 7);
    }
    const riverProximity = Math.max(0, 1 - this.nearestWaterDist / 7);

    for (const [key, layer] of this.layers) {
      let target = layer.target;
      if (key === 'river') target += riverProximity * 0.1;
      const current = layer.gain.gain.value;
      layer.gain.gain.value = current + (target - current) * Math.min(1, dt * 1.4);
    }
  }
}

/** 以玩家为中心的方形范围最近水面距离 */
function scanNearestWater(floor: DungeonFloor, px: number, py: number, radius: number): number {
  const cx = Math.round(px);
  const cy = Math.round(py);
  let nearest = 999;
  for (let dy = -radius; dy <= radius; dy++) {
    const row = floor.tiles[cy + dy];
    if (!row) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      if (isWaterTileType(row[cx + dx] ?? '')) {
        const dist = Math.hypot(dx, dy);
        if (dist < nearest) nearest = dist;
      }
    }
  }
  return nearest;
}

export const ambientLayers = new AmbientLayerSystem();
