import { ZoneType } from '../types';
import { soundManager } from './soundManager';

/**
 * bgmSystem — 程序化背景音乐引擎（Web Audio 实时合成，无需素材）。
 *
 * 数值/音乐设计（2026-09）：
 * - 分区曲风：城镇(田园) / 旷野·前哨(行进军) / 生态区(暗黑小调) / 地牢(低音沉闷)。
 * - 一个 16 分音符网格的音序器，按音频时钟(currentTime)提前 0.12s 调度，
 *   铺底 pad(每小节强力和弦) + 贝斯(根音脉冲) + 琶音(五声音阶点缀) + 鼓组。
 * - 战斗强度 intensity(0~1，来自引擎刷怪/Boss 扫描)：越高鼓点越密、贝斯越密、
 *   琶音越亮、速度轻微上提；切区域自动重排并淡入。
 * - 尊重全局静音 soundManager.enabled；自带用户音量 userVolume(0~1)。
 */

const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

interface BgmFamily {
  label: string;
  tempo: number;          // 四分音符 BPM
  rootMidi: number;       // 主音
  scale: number[];        // 半音音阶（五声类）
  progRoots: number[];    // 每小节的根音（绝对 midi）
  bass: 'soft' | 'driving';
  arp: 'gentle' | 'bright' | 'off';
  drums: 'none' | 'light' | 'heavy';
  padOctave: number;      // 铺底音域偏移
}

const FAMILIES: Record<'town' | 'field' | 'wild' | 'dungeon', BgmFamily> = {
  // C 大调五声：温和木管感的田园铺底
  town: {
    label: '小镇·田园',
    tempo: 76,
    rootMidi: 60,
    scale: [0, 2, 4, 7, 9],
    progRoots: [60, 62, 67, 69], // C D G A 上行再回落
    bass: 'soft',
    arp: 'gentle',
    drums: 'light',
    padOctave: 12,
  },
  // A 小调五声：行进军鼓点
  field: {
    label: '旷野·行军',
    tempo: 88,
    rootMidi: 57,
    scale: [0, 3, 5, 7, 10],
    progRoots: [57, 53, 55, 50], // A E G D
    bass: 'driving',
    arp: 'gentle',
    drums: 'light',
    padOctave: 12,
  },
  // G 小调五声：暗黑推进
  wild: {
    label: '生态区·暗行',
    tempo: 94,
    rootMidi: 55,
    scale: [0, 3, 5, 7, 10],
    progRoots: [55, 53, 51, 50], // G F Eb D 下行，压迫感
    bass: 'driving',
    arp: 'gentle',
    drums: 'heavy',
    padOctave: 12,
  },
  // D 小调五声：低音沉闷 + 心跳
  dungeon: {
    label: '地牢·阴郁',
    tempo: 74,
    rootMidi: 50,
    scale: [0, 3, 5, 7, 10],
    progRoots: [50, 45, 48, 43], // D A C G
    bass: 'soft',
    arp: 'off',
    drums: 'none',
    padOctave: 0,
  },
};

const ZONE_FAMILY: Record<ZoneType, keyof typeof FAMILIES> = {
  town: 'town',
  overworld: 'field',
  keep: 'field',
  dungeon: 'dungeon',
  nether: 'dungeon',
  end: 'dungeon',
  frost: 'wild',
  volcano: 'wild',
  mushroom: 'wild',
  desert: 'wild',
  swamp: 'wild',
  cursed: 'wild',
};

const STEPS_PER_BAR = 16; // 16 分音符

class BgmSystem {
  private ctx: AudioContext | null = null;
  private busGain: GainNode | null = null;
  private ticker: number | null = null;

  private userVolume = 0.8;       // 用户音量（0~1），默认 80%
  private enabled = true;         // 镜像 soundManager.enabled

  private zoneType: ZoneType = 'town';
  private isIndoor = false;
  private intensity = 0;          // 平滑后的战斗强度 0~1

  private nextStepTime = 0;
  private totalSteps = 0;         // 已调度的 16 分步数（用于小节定位）
  private lastChordRoot = 0;
  private gestureBound = false;

  private get family(): BgmFamily {
    return FAMILIES[ZONE_FAMILY[this.zoneType] || 'field'];
  }

  private get stepDur(): number {
    // 强度 0→1 时速度上提 ≤12%
    const tempo = this.family.tempo * (1 + this.intensity * 0.12);
    return 60 / tempo / 4; // 16 分音符秒数
  }

  /** 供外部设置用户音量（0~1），并写入 bus 增益 */
  public setVolume(v: number): void {
    this.userVolume = Math.max(0, Math.min(1, v));
    this.applyBusGain();
  }

  /** 从引擎同步状态（每帧调用，廉价） */
  public syncFromGame(zoneType: ZoneType, isIndoor: boolean, intensity: number): void {
    const shouldRun = !!soundManager.enabled;
    if (shouldRun !== this.enabled) {
      this.enabled = shouldRun;
      this.applyBusGain();
    }

    const zoneChanged = zoneType !== this.zoneType || isIndoor !== this.isIndoor;
    this.zoneType = zoneType;
    this.isIndoor = isIndoor;
    this.intensity = this.intensity * 0.82 + Math.max(0, Math.min(1, intensity)) * 0.18;

    if (!this.ctx) {
      this.ctx = soundManager.getAudioContext();
      if (!this.ctx) return;
      this.ensureBus();
      this.totalSteps = 0;
    }
    if (zoneChanged) {
      // 换区：对齐到下一小节起点
      this.totalSteps = Math.ceil(this.totalSteps / STEPS_PER_BAR) * STEPS_PER_BAR;
      this.lastChordRoot = 0;
    }
    this.ensureScheduler();
  }

  private ensureBus(): void {
    if (!this.ctx || this.busGain) return;
    this.busGain = this.ctx.createGain();
    this.busGain.gain.value = 0;
    // 走 master 总线（音效 master 0.75 之上再乘 BGM 档位），从而跟随全局静音
    soundManager.connectToMasterBus(this.busGain);
    this.applyBusGain();
  }

  private applyBusGain(): void {
    if (!this.busGain || !this.ctx) return;
    const target = this.enabled ? 0.6 * this.userVolume : 0;
    this.busGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  private ensureScheduler(): void {
    if (!this.ctx) return;
    if (this.ctx.state !== 'running') {
      // 首次用户手势前 ctx 处于 suspended：由手势触发的任何音效都会 resume，
      // 这里轮询等待 running 后再开排
      if (!this.gestureBound && typeof window !== 'undefined') {
        this.gestureBound = true;
        const tryResume = () => {
          if (this.ctx) this.ctx.resume().catch(() => undefined);
        };
        window.addEventListener('pointerdown', tryResume, { once: false });
        window.addEventListener('keydown', tryResume, { once: false });
      }
      if (this.ticker !== null) {
        window.clearInterval(this.ticker);
        this.ticker = null;
      }
      return;
    }
    if (this.ticker === null) {
      this.nextStepTime = this.ctx.currentTime + 0.08;
      this.ticker = window.setInterval(() => this.tick(), 40);
    }
  }

  private tick(): void {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const horizon = this.ctx.currentTime + 0.14;
    while (this.nextStepTime < horizon) {
      this.scheduleStep(this.nextStepTime, this.totalSteps);
      this.nextStepTime += this.stepDur;
      this.totalSteps++;
    }
  }

  // ---------- 每步调度 ----------

  private scheduleStep(t: number, stepIndex: number): void {
    const fam = this.family;
    const step = ((stepIndex % STEPS_PER_BAR) + STEPS_PER_BAR) % STEPS_PER_BAR;
    const barIndex = Math.floor(stepIndex / STEPS_PER_BAR);
    const chordRoot = fam.progRoots[barIndex % fam.progRoots.length];
    const inten = this.intensity;

    if (step === 0 || (this.lastChordRoot !== chordRoot)) {
      this.lastChordRoot = chordRoot;
      if (step === 0) this.playPad(t, fam, chordRoot);
    }

    // 贝斯
    const bassSteps = fam.bass === 'driving' ? [0, 6, 8, 14] : [0, 8];
    if (bassSteps.includes(step) || (inten > 0.55 && step % 4 === 0)) {
      this.playBass(t, fam, chordRoot, inten);
    }

    // 鼓组
    this.playDrums(t, fam, step, inten);

    // 琶音
    const arpActive = fam.arp !== 'off' || inten > 0.4;
    if (arpActive && step % 2 === 0 && (fam.arp !== 'off' || step % 4 === 0)) {
      const pattern = [0, 1, 2, 3, 4, 3, 2, 1];
      const idx = pattern[Math.floor(step / 2) % pattern.length];
      if (Math.random() < (inten > 0.6 ? 0.85 : 0.6)) {
        this.playArpNote(t, fam, chordRoot, idx, inten);
      }
    }
  }

  private playPad(t: number, fam: BgmFamily, root: number): void {
    // 强力五度和弦铺底（根音 + 五度 + 高八度根音）
    this.note(t, root - 12, 0.5, 0.04, 1.9, 'sine');
    this.note(t, root + 7 - 12, 0.4, 0.04, 1.9, 'sine');
    if (fam.padOctave > 0) {
      this.note(t, root + fam.padOctave, 0.16, 0.06, 1.6, 'triangle');
    }
  }

  private playBass(t: number, fam: BgmFamily, root: number, inten: number): void {
    const freq = midiToFreq(root - 24);
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    const vol = fam.bass === 'driving' ? 0.11 : 0.07;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g);
    g.connect(this.busGain!);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  private playDrums(t: number, fam: BgmFamily, step: number, inten: number): void {
    // 档位：家族默认 → 战斗强度升档（无鼓地牢在高压下转为“心跳”低鼓）
    let style: 'none' | 'light' | 'heavy' | 'heartbeat' = fam.drums;
    if (fam.drums === 'none' && inten > 0.7) style = 'heartbeat';
    else if (fam.drums === 'light' && inten > 0.55) style = 'heavy';
    if (style === 'none') return;

    if (style === 'light') {
      if (step === 0) this.kick(t, 0.5);
      if (step === 8) this.hat(t, 0.35, false);
      if (step === 4 || step === 12) this.hat(t, 0.22, false);
      return;
    }
    if (style === 'heavy') {
      if (step % 4 === 0) this.kick(t, step === 0 ? 0.62 : 0.5);
      if (step === 4 || step === 12) this.snare(t, inten);
      if (step % 2 === 0) this.hat(t, step % 4 === 0 ? 0.4 : 0.24, step === 14 && inten > 0.5);
      return;
    }
    if (style === 'heartbeat') {
      // 地牢在战斗中的“心跳”低鼓
      if (step === 0) this.kick(t, 0.4);
      if (step === 8) this.kick(t, 0.26);
    }
  }

  private kick(t: number, vol: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    g.gain.setValueAtTime(vol * 0.16, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osc.connect(g);
    g.connect(this.busGain!);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  private snare(t: number, inten: number): void {
    if (!this.ctx) return;
    // 噪声短促军鼓（高频带通）
    const len = Math.floor(this.ctx.sampleRate * 0.14);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.9;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.1 + inten * 0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.busGain!);
    src.start(t);
    src.stop(t + 0.14);
  }

  private hat(t: number, vol: number, open: boolean): void {
    if (!this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * (open ? 0.18 : 0.05));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * 0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (open ? 0.16 : 0.04));
    src.connect(hp);
    hp.connect(g);
    g.connect(this.busGain!);
    src.start(t);
    src.stop(t + (open ? 0.18 : 0.05));
  }

  private playArpNote(t: number, fam: BgmFamily, root: number, idx: number, inten: number): void {
    const tone = fam.scale[idx % fam.scale.length];
    const oct = idx >= 3 ? 12 : 0;
    const midi = root + tone + 12 + oct;
    this.note(t, midi, inten > 0.6 ? 0.055 : 0.042, 0.012, 0.24, fam.arp === 'bright' || inten > 0.6 ? 'triangle' : 'sine');
  }

  /** 通用单音：短包络，可选振荡器波形 */
  private note(t: number, midi: number, vol: number, attack: number, decay: number, type: OscillatorType): void {
    if (!this.ctx || !this.busGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(midiToFreq(midi), t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    osc.connect(g);
    g.connect(this.busGain);
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  }
}

export const bgmSystem = new BgmSystem();
