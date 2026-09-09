/**
 * Procedural Web Audio synthesizer for Minecraft & Diablo sound effects
 * Includes class-specific skill synthesis, dynamic environmental reverb,
 * atmospheric ambient BGM, and environmental acoustics (indoor vs outdoor).
 */

import { CharacterClassId } from '../types';

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  /** 浏览器自动播放策略：首次用户手势前不创建 AudioContext（避免 console 警告） */
  private gestureUnlocked: boolean = false;

  // Environmental Reverb Bus Nodes
  private masterGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;
  private lowpassFilter: BiquadFilterNode | null = null;

  // Environmental state
  public isIndoor: boolean = false;
  public currentZone: string = 'town';

  // Ambient BGM synthesizer state
  private bgmInterval: number | null = null;
  private bgmGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;

  // Dynamic Ambience & Threat System state
  public currentThreatLevel: number = 0; // 0.0 (calm exploration) to 1.0 (deadly melee chaos)
  private tensionGain: GainNode | null = null;
  private waterDripTimeout: number | null = null;
  private pulseTimer: number = 0;
  private lastDripTime: number = 0;

  /** 应用启动时调用一次：首个用户手势（点击/触摸/按键）后解锁音频上下文 */
  public bindGestureUnlock(): void {
    if (typeof window === 'undefined' || this.gestureUnlocked) return;
    const unlock = () => {
      if (this.gestureUnlocked) return;
      this.gestureUnlocked = true;
      this.initCtx();
      if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => undefined);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private initCtx() {
    // 首次手势前不创建上下文：pre-gesture 的 new AudioContext() 会触发
    // Chrome 的自动播放策略警告；此时本就无声，直接跳过（各播放方法均有空守卫）。
    if (!this.gestureUnlocked && !this.ctx) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.75;
      this.masterGain.connect(this.ctx.destination);

      // Dry Bus
      this.dryGain = this.ctx.createGain();
      this.dryGain.gain.value = 0.9;
      this.dryGain.connect(this.masterGain);

      // Wet Bus (Reverb + Dampening Filter)
      this.wetGain = this.ctx.createGain();
      this.wetGain.gain.value = 0.15; // default outdoor

      this.lowpassFilter = this.ctx.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.value = 4500;

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = this.generateImpulseResponse(1.2, 2.5);

      this.lowpassFilter.connect(this.convolver);
      this.convolver.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      // Setup BGM bus
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.14;
      this.bgmGain.connect(this.masterGain);

      // Setup Tension Combat bus
      this.tensionGain = this.ctx.createGain();
      this.tensionGain.gain.value = 0.0;
      this.tensionGain.connect(this.masterGain);

      this.updateReverbAcoustics();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Procedurally generates an impulse response buffer for authentic acoustic spaces
   */
  private generateImpulseResponse(duration: number, decay: number): AudioBuffer {
    if (!this.ctx) return {} as AudioBuffer;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const t = Math.pow(n, decay);
      left[i] = (Math.random() * 2 - 1) * t;
      right[i] = (Math.random() * 2 - 1) * t;
    }

    return impulse;
  }

  /**
   * Route audio node to both dry and wet environmental reverb buses
   */
  private routeAudio(node: AudioNode) {
    if (!this.ctx || !this.dryGain || !this.lowpassFilter) return;
    node.connect(this.dryGain);
    node.connect(this.lowpassFilter);
  }

  /**
   * 共享出口：连续环境音层系统复用同一 AudioContext 与主总线，
   * 保证全局静音开关与音量一致生效。
   */
  public getAudioContext(): AudioContext | null {
    this.initCtx();
    return this.ctx;
  }

  /** 连接节点到主输出总线（持续环境层不进混响，避免浑浊） */
  public connectToMasterBus(node: AudioNode): void {
    if (!this.ctx || !this.masterGain) return;
    node.connect(this.masterGain);
  }

  /**
   * Dynamic Environment Reverb & Acoustics Adjuster
   * @param isIndoor whether the player is in an indoor dungeon/crypt or open air
   * @param zone 'town' | 'overworld' | 'dungeon' | 'nether' | 'end'
   */
  public setEnvironment(isIndoor: boolean, zone: string = 'town') {
    this.isIndoor = isIndoor;
    this.currentZone = zone;
    this.initCtx();
    this.updateReverbAcoustics();
    this.updateAmbientBgmTrack();
  }

  private updateReverbAcoustics() {
    if (!this.ctx || !this.wetGain || !this.dryGain || !this.lowpassFilter || !this.convolver) return;
    const t = this.ctx.currentTime;

    if (this.isIndoor) {
      // Subterranean indoor dungeon: Heavy reverberation, rich reflections, darker echoes
      this.wetGain.gain.setTargetAtTime(0.52, t, 0.2);
      this.dryGain.gain.setTargetAtTime(0.72, t, 0.2);
      this.lowpassFilter.frequency.setTargetAtTime(2400, t, 0.2);
      this.convolver.buffer = this.generateImpulseResponse(2.2, 2.2);
    } else if (this.currentZone === 'town') {
      // Outdoor town: Pleasant open courtyard acoustics, lively resonance
      this.wetGain.gain.setTargetAtTime(0.22, t, 0.2);
      this.dryGain.gain.setTargetAtTime(0.85, t, 0.2);
      this.lowpassFilter.frequency.setTargetAtTime(6000, t, 0.2);
      this.convolver.buffer = this.generateImpulseResponse(0.9, 3.2);
    } else {
      // Outdoor wilderness: Crisp, open, clear, dry audio with bright acoustic dynamics
      this.wetGain.gain.setTargetAtTime(0.08, t, 0.2);
      this.dryGain.gain.setTargetAtTime(0.95, t, 0.2);
      this.lowpassFilter.frequency.setTargetAtTime(8000, t, 0.2);
      this.convolver.buffer = this.generateImpulseResponse(0.4, 4.0);
    }
  }

  // ==========================================
  // DYNAMIC AMBIENT BGM SYNTHESIZER
  // ==========================================

  public startAmbientBGM() {
    if (this.isBgmPlaying) return;
    this.initCtx();
    this.isBgmPlaying = true;
    this.scheduleNextBgmChord();
  }

  private scheduleNextBgmChord() {
    if (!this.isBgmPlaying || !this.enabled || !this.ctx || !this.bgmGain) return;

    const t = this.ctx.currentTime;
    let chordFrequencies: number[] = [];

    if (this.currentThreatLevel > 0.45) {
      // High-threat combat tension: Low dissonant clusters & tritone subterranean dread
      const tensionChords = [
        [58.27, 82.41, 116.54, 164.81], // Bb minor / E tritone dread
        [55.0, 77.78, 110.0, 155.56],   // A diminished demon drone
        [65.41, 92.5, 130.81, 185.0],   // C diminished edge
        [49.0, 73.42, 103.83, 146.83],  // G subterranean rumble
      ];
      chordFrequencies = tensionChords[Math.floor(Math.random() * tensionChords.length)];
    } else if (this.currentZone === 'town') {
      // Town: Serene Celtic / Medieval pentatonic chords (F major / D minor peaceful harp-like notes)
      const townChords = [
        [220, 261.63, 329.63, 392.0], // Dm7
        [174.61, 261.63, 329.63, 440.0], // Fmaj7
        [196.0, 246.94, 293.66, 392.0], // G
        [261.63, 329.63, 392.0, 523.25], // Cmaj7
      ];
      chordFrequencies = townChords[Math.floor(Math.random() * townChords.length)];
    } else if (this.isIndoor || this.currentZone === 'dungeon') {
      // Dungeon: Low dark minor drone pads with ominous reverberations
      const dungeonChords = [
        [73.42, 110.0, 146.83, 174.61], // Low D minor pad
        [65.41, 98.0, 130.81, 164.81], // Low C minor 9
        [55.0, 82.41, 110.0, 138.59], // A diminished cavern drone
      ];
      chordFrequencies = dungeonChords[Math.floor(Math.random() * dungeonChords.length)];
    } else {
      // Outdoor Wilderness: Expansive airy ethereal wind pad
      const wildernessChords = [
        [130.81, 196.0, 246.94, 293.66], // Em/C airy pad
        [146.83, 220.0, 293.66, 369.99], // D maj9 breeze
        [164.81, 246.94, 329.63, 392.0], // Em open
      ];
      chordFrequencies = wildernessChords[Math.floor(Math.random() * wildernessChords.length)];
    }

    // Play chord with soft envelope
    const chordDuration = this.currentThreatLevel > 0.45 ? 3.4 : this.isIndoor ? 5.0 : 4.2;
    chordFrequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = this.currentThreatLevel > 0.45 ? (idx === 0 ? 'sawtooth' : 'triangle') : this.isIndoor ? 'sine' : idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Slow breathing swell
      const baseGain = this.currentThreatLevel > 0.45 ? 0.09 : this.isIndoor ? 0.08 : 0.05;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(baseGain, t + 1.4);
      gain.gain.linearRampToValueAtTime(0.001, t + chordDuration);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(t);
      osc.stop(t + chordDuration);
    });

    // Schedule next harmonic change
    const nextInterval = (chordDuration - 1.2) * 1000;
    this.bgmInterval = window.setTimeout(() => {
      this.scheduleNextBgmChord();
    }, nextInterval);
  }

  /**
   * Update Dynamic Environmental Ambience based on monster density and player state
   */
  public updateDynamicAmbience(context: {
    nearbyMonsterCount: number;
    closestDistance: number;
    isBossAlive: boolean;
    playerHpRatio: number;
    dt: number;
  }) {
    if (!this.enabled || !this.ctx) return;

    // Calculate target threat level (0.0 to 1.0)
    let targetThreat = 0;
    if (context.isBossAlive) {
      targetThreat = 1.0;
    } else if (context.nearbyMonsterCount > 0) {
      const densityThreat = Math.min(0.85, context.nearbyMonsterCount * 0.2);
      const proximityThreat = context.closestDistance < 4 ? 0.8 : context.closestDistance < 8 ? 0.5 : 0.25;
      targetThreat = Math.max(densityThreat, proximityThreat);
      if (context.playerHpRatio < 0.35) {
        targetThreat = Math.min(1.0, targetThreat + 0.25);
      }
    }

    // Smoothly blend threat level over time (interpolate)
    const blendRate = targetThreat > this.currentThreatLevel ? 1.5 : 0.6;
    this.currentThreatLevel += (targetThreat - this.currentThreatLevel) * Math.min(1.0, context.dt * blendRate);

    // Audio filter adjustment based on threat
    if (this.lowpassFilter && this.ctx) {
      const t = this.ctx.currentTime;
      if (this.currentThreatLevel > 0.5) {
        // Claustrophobic combat focus: lowpass filter narrows
        this.lowpassFilter.frequency.setTargetAtTime(1800, t, 0.4);
      } else if (this.isIndoor) {
        this.lowpassFilter.frequency.setTargetAtTime(3200, t, 0.4);
      }
    }

    // Pulse tension heartbeat when in dangerous encounters
    this.pulseTimer += context.dt;
    if (this.currentThreatLevel > 0.45 && this.pulseTimer >= (this.currentThreatLevel > 0.75 ? 0.85 : 1.4)) {
      this.pulseTimer = 0;
      this.playHeartbeatThud(this.currentThreatLevel);
    }

    // Occasional cavern water drop in calm subterranean caves
    if (this.isIndoor && this.currentThreatLevel < 0.3) {
      const now = performance.now();
      if (now - this.lastDripTime > 4500 + Math.random() * 6000) {
        this.lastDripTime = now;
        this.playWaterDrop();
      }
    }
  }

  /**
   * Cavern Water Droplet Acoustic Echo
   */
  public playWaterDrop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 1600 + Math.random() * 400;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 0.4, t + 0.08);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  /**
   * Low-frequency tension heartbeat thud
   */
  public playHeartbeatThud(intensity: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Lub-dub double pulse
      [0, 0.18].forEach((delay, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(idx === 0 ? 58 : 48, t + delay);
        osc.frequency.exponentialRampToValueAtTime(32, t + delay + 0.15);

        const vol = (idx === 0 ? 0.18 : 0.12) * intensity;
        gain.gain.setValueAtTime(vol, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.18);

        osc.connect(gain);
        if (this.masterGain) gain.connect(this.masterGain);
        osc.start(t + delay);
        osc.stop(t + delay + 0.2);
      });
    } catch {}
  }

  /**
   * Satisfying bouncy spring pickup chime with frequency modulation
   */
  public playLootPickupSpring(rarity: string = 'common') {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const baseFreq = rarity === 'legendary' ? 660 : rarity === 'rare' ? 550 : 440;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      // Spring elastic pitch wobble up
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.65, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.45, t + 0.18);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  private updateAmbientBgmTrack() {
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.isBgmPlaying) {
      this.scheduleNextBgmChord();
    }
  }

  // ==========================================
  // CLASS-SPECIFIC SKILL SOUND EFFECTS
  // ==========================================

  public playClassSkill(classId: CharacterClassId, skillKey: 'skill1' | 'skill2' | 'skill3' | 'skill4') {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      switch (classId) {
        case 'warrior':
          this.playWarriorSkill(skillKey, t);
          break;
        case 'ranger':
          this.playRangerSkill(skillKey, t);
          break;
        case 'mage':
          this.playMageSkill(skillKey, t);
          break;
        case 'rogue':
          this.playRogueSkill(skillKey, t);
          break;
        default:
          this.playSlash();
          break;
      }
    } catch {}
  }

  private playWarriorSkill(skillKey: string, t: number) {
    if (!this.ctx) return;
    if (skillKey === 'skill1') {
      // 狂战士 - 战吼 / 地裂践踏 (Heavy Roar & Ground Slam)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.35);
      gain.gain.setValueAtTime(0.42, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.35);
    } else if (skillKey === 'skill2') {
      // 狂战士 - 嗜血狂怒 (Blood Rage Pulse)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(80, t);
      osc1.frequency.exponentialRampToValueAtTime(180, t + 0.2);
      gain1.gain.setValueAtTime(0.35, t);
      gain1.gain.linearRampToValueAtTime(0.01, t + 0.25);
      osc1.connect(gain1);
      this.routeAudio(gain1);
      osc1.start(t);
      osc1.stop(t + 0.25);
    } else if (skillKey === 'skill3') {
      // 狂战士 - 狂暴冲锋 (Iron Charge Rush)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.28);
      gain.gain.setValueAtTime(0.38, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.28);
    } else {
      // 狂战士 - 铁壁盾震 / 旋风大斩
      this.playShieldBlock();
    }
  }

  private playRangerSkill(skillKey: string, t: number) {
    if (!this.ctx) return;
    if (skillKey === 'skill1') {
      // 神射手 - 穿云风爆矢 (Supersonic Wind Arrow)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.18);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (skillKey === 'skill2') {
      // 神射手 - 疾风漫步 (Wind Stride Flute Whistle)
      const notes = [587.33, 739.99, 880.0];
      notes.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.05);
        gain.gain.setValueAtTime(0.18, t + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.15);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.16);
      });
    } else if (skillKey === 'skill3') {
      // 神射手 - 幻影漫游 (Phantom Gale Evade)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.15);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.15);
    } else {
      // 神射手 - 漫天箭雨
      this.playShootArrow();
    }
  }

  private playMageSkill(skillKey: string, t: number) {
    if (!this.ctx) return;
    if (skillKey === 'skill1') {
      // 奥术学者 - 奥术超新星 (Arcane Nova Crystal Burst)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, t); // C6
      osc.frequency.exponentialRampToValueAtTime(261.63, t + 0.28);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.28);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.28);
    } else if (skillKey === 'skill2') {
      // 奥术学者 - 奥术护盾 / 元素共鸣 (Resonant Barrier Shimmer)
      const chords = [523.25, 659.25, 783.99, 1046.5];
      chords.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } else if (skillKey === 'skill3') {
      // 奥术学者 - 虚空瞬移 / 星体折跃 (Astral Warp Blink)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.22);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.22);
    } else {
      this.playTeleport();
    }
  }

  private playRogueSkill(skillKey: string, t: number) {
    if (!this.ctx) return;
    if (skillKey === 'skill1') {
      // 暗影刺客 - 淬毒突袭 / 飞刃 (Poison Ambush Metallic Hiss)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.14);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.14);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.14);
    } else if (skillKey === 'skill2') {
      // 暗影刺客 - 致盲烟幕 (Smoke Vanish Pneumatic Puff)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
      gain.gain.setValueAtTime(0.32, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.22);
    } else if (skillKey === 'skill3') {
      // 暗影刺客 - 影袭背刺 (Critical Shadow Backstab)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.12);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.12);
    } else {
      this.playDash();
    }
  }

  // ==========================================
  // THUNDERSTORM SFX
  // ==========================================

  public playThunder(intensity: number = 1.0) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Sharp initial lightning strike crack
      const crackOsc = this.ctx.createOscillator();
      const crackGain = this.ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(480, t);
      crackOsc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
      crackGain.gain.setValueAtTime(0.45 * intensity, t);
      crackGain.gain.linearRampToValueAtTime(0.01, t + 0.15);
      crackOsc.connect(crackGain);
      this.routeAudio(crackGain);
      crackOsc.start(t);
      crackOsc.stop(t + 0.15);

      // 2. Rolling subterranean thunder bass rumble
      const rumbleOsc = this.ctx.createOscillator();
      const rumbleGain = this.ctx.createGain();
      rumbleOsc.type = 'triangle';
      rumbleOsc.frequency.setValueAtTime(75, t + 0.08);
      rumbleOsc.frequency.linearRampToValueAtTime(32, t + 1.8);
      rumbleGain.gain.setValueAtTime(0.001, t);
      rumbleGain.gain.linearRampToValueAtTime(0.4 * intensity, t + 0.2);
      rumbleGain.gain.linearRampToValueAtTime(0.001, t + 1.8);

      rumbleOsc.connect(rumbleGain);
      this.routeAudio(rumbleGain);
      rumbleOsc.start(t + 0.08);
      rumbleOsc.stop(t + 1.8);
    } catch {}
  }

  // ==========================================
  // CORE COMBAT & INTERACTION SOUNDS
  // ==========================================

  public playSlash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  public playComboSlash(step: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (step === 2) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
      } else if (step === 1) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.14);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.14);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
      }

      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + (step === 2 ? 0.22 : 0.14));
    } catch {}
  }

  public playHit() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.1);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {}
  }

  public playShieldBlock() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  public playShootArrow() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.08);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  public playBowCharge() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.linearRampToValueAtTime(540, t + 0.35);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.35);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  }

  public playDash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  public playEmeraldPickup() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t);
      osc.frequency.setValueAtTime(1318.51, t + 0.06);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  public playZombieGroan() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(85, t + 0.35);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  }

  public playSpiderHiss() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.16);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  public playEnderTeleport() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.25);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  public playSlimeSplash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  public playShootFireball() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.18);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  public playBossDeath() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [80, 110, 150, 220].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);
        osc.frequency.exponentialRampToValueAtTime(35, t + idx * 0.1 + 0.6);
        gain.gain.setValueAtTime(0.4, t + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + 0.6);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.65);
      });
    } catch {}
  }

  public playLootDrop(rarity: string) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      if (rarity === 'legendary') {
        const freqs = [440, 554.37, 659.25, 880];
        freqs.forEach((f, i) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t + i * 0.08);
          gain.gain.setValueAtTime(0.25, t + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.35);
          osc.connect(gain);
          this.routeAudio(gain);
          osc.start(t + i * 0.08);
          osc.stop(t + i * 0.08 + 0.38);
        });
      } else {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, t);
        osc.frequency.setValueAtTime(659.25, t + 0.07);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.2);
      }
    } catch {}
  }

  public playLootBounce() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.05);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  public playLevelUp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + i * 0.09);
        gain.gain.setValueAtTime(0.28, t + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.09 + 0.4);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t + i * 0.09);
        osc.stop(t + i * 0.09 + 0.45);
      });
    } catch {}
  }

  public playExplosion() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.4);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  public playCreeperHiss() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.linearRampToValueAtTime(1200, t + 0.3);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  }

  public playPotion() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(900, t + 0.15);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playTeleport() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.22);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  public playGoblinLaugh() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // High-pitched mischievous staccato laugh
      const pitches = [720, 880, 1020, 780, 940];
      pitches.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = t + idx * 0.055;
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, start + 0.04);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.linearRampToValueAtTime(0.01, start + 0.05);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(start);
        osc.stop(start + 0.05);
      });
    } catch {}
  }

  public playGoblinRoll() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.16);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  public playBabyZombiePounce() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, t);
      osc.frequency.exponentialRampToValueAtTime(1100, t + 0.18);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playButtonClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  public playTotemResurrection() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      fanfare.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.08);
        gain.gain.setValueAtTime(0.3, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.4);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.45);
      });
    } catch {}
  }

  // ==========================================
  // ENVIRONMENTAL AMBIENT SOUNDSCAPES & FOOTSTEPS
  // ==========================================

  private ambientEventTimer: number = 2.0;

  /**
   * Periodically updates environmental audio events based on current zone, theme, weather, and indoor state
   */
  public updateEnvironmentalAmbience(
    dt: number,
    zone: string,
    theme: string,
    weather: string,
    isIndoor: boolean
  ) {
    if (!this.enabled) return;
    this.ambientEventTimer -= dt;
    if (this.ambientEventTimer <= 0) {
      // 与连续环境层（ambientLayers）互补：降低单发声频率避免嘈杂
      this.ambientEventTimer = 5.5 + Math.random() * 5.0;

      // Prioritize weather events if active
      if (weather === 'thunderstorm' && Math.random() < 0.6) {
        this.playThunderRumble();
        return;
      }

      if (zone === 'town') {
        // Peaceful town events: birds, wind chimes, bubbling fountain, campfire crackles
        const roll = Math.random();
        if (roll < 0.35) this.playTownBirdChirp();
        else if (roll < 0.6) this.playWindChime();
        else if (roll < 0.8) this.playFountainSplash();
        else this.playCampfireCrackle();
      } else if (isIndoor || zone === 'dungeon') {
        // Dungeon & subterranean cave events: water drops, ominous wind gusts, deep rumbles
        const roll = Math.random();
        if (theme === 'nether') {
          if (roll < 0.6) this.playMagmaBubble();
          else this.playDungeonWindGust();
        } else if (theme === 'end') {
          if (roll < 0.65) this.playVoidShimmer();
          else this.playSubterraneanRumble();
        } else {
          if (roll < 0.45) this.playCavernWaterDrop();
          else if (roll < 0.75) this.playDungeonWindGust();
          else this.playSubterraneanRumble();
        }
      } else {
        // Overworld wilderness: crickets, forest breeze, bird calls
        const roll = Math.random();
        if (roll < 0.4) this.playForestCricket();
        else if (roll < 0.7) this.playTownBirdChirp();
        else this.playDungeonWindGust();
      }
    }
  }

  /**
   * Terrain-adaptive footstep sounds
   */
  public playFootstep(tileType: string) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      if (tileType === 'grass') {
        // Crunchy foliage / grass shuffle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

        gain.gain.setValueAtTime(0.08, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.08);

        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (tileType === 'bridge' || tileType === 'building') {
        // Hollow wooden plank creak / tap
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220 + Math.random() * 30, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.07);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.07);

        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.07);
      } else if (tileType === 'water' || tileType === 'puddle') {
        // Splashy liquid squelch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.1);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.1);
      } else {
        // Crisp stone / cobblestone tap (floor, road, town_wall)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 + Math.random() * 60, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.06);

        gain.gain.setValueAtTime(0.09, t);
        gain.gain.linearRampToValueAtTime(0.001, t + 0.06);

        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.06);
      }
    } catch {}
  }

  /**
   * Cavern echo water droplet
   */
  public playCavernWaterDrop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const baseFreq = 1600 + Math.random() * 500;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, t + 0.14);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      // High reverb routing for deep cavern echo
      if (this.lowpassFilter) osc.connect(this.lowpassFilter);
      if (this.dryGain) osc.connect(this.dryGain);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {}
  }

  /**
   * Cavern / subterranean eerie wind howl
   */
  public playDungeonWindGust() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(240, t);
      filter.frequency.linearRampToValueAtTime(480, t + 1.2);
      filter.frequency.linearRampToValueAtTime(200, t + 2.5);
      filter.Q.value = 4.0;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.linearRampToValueAtTime(140, t + 1.2);
      osc.frequency.linearRampToValueAtTime(95, t + 2.5);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 1.0);
      gain.gain.linearRampToValueAtTime(0.001, t + 2.5);

      osc.connect(filter);
      filter.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 2.55);
    } catch {}
  }

  /**
   * Subterranean tectonic ominous rumble
   */
  public playSubterraneanRumble() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(52, t);
      osc.frequency.linearRampToValueAtTime(42, t + 2.2);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.8);
      gain.gain.linearRampToValueAtTime(0.001, t + 2.2);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 2.25);
    } catch {}
  }

  /**
   * Peaceful morning town birds chirping
   */
  public playTownBirdChirp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Two quick chirps
      for (let i = 0; i < 2; i++) {
        const chirpStart = t + i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startFreq = 2600 + i * 300 + Math.random() * 200;
        osc.frequency.setValueAtTime(startFreq, chirpStart);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.3, chirpStart + 0.04);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.8, chirpStart + 0.09);

        gain.gain.setValueAtTime(0.001, chirpStart);
        gain.gain.linearRampToValueAtTime(0.08, chirpStart + 0.02);
        gain.gain.linearRampToValueAtTime(0.001, chirpStart + 0.09);

        osc.connect(gain);
        this.routeAudio(gain);

        osc.start(chirpStart);
        osc.stop(chirpStart + 0.1);
      }
    } catch {}
  }

  /**
   * Sparkling crystalline wind chime
   */
  public playWindChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const pentatonic = [1318.51, 1567.98, 1975.53, 2349.32, 2637.02];
      const count = 3 + Math.floor(Math.random() * 2);

      for (let i = 0; i < count; i++) {
        const noteTime = t + i * 0.11 + Math.random() * 0.06;
        const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.07, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);

        osc.connect(gain);
        this.routeAudio(gain);

        osc.start(noteTime);
        osc.stop(noteTime + 1.25);
      }
    } catch {}
  }

  /**
   * Town fountain water bubbling splash
   */
  public playFountainSplash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Soft water bubbling burst
      for (let i = 0; i < 4; i++) {
        const bubbleTime = t + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320 + Math.random() * 380, bubbleTime);
        osc.frequency.exponentialRampToValueAtTime(550 + Math.random() * 200, bubbleTime + 0.08);

        gain.gain.setValueAtTime(0.05, bubbleTime);
        gain.gain.linearRampToValueAtTime(0.001, bubbleTime + 0.08);

        osc.connect(gain);
        this.routeAudio(gain);

        osc.start(bubbleTime);
        osc.stop(bubbleTime + 0.09);
      }
    } catch {}
  }

  /**
   * Warm wooden campfire / hearth crackle
   */
  public playCampfireCrackle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      for (let i = 0; i < 3; i++) {
        const popTime = t + i * 0.09 + Math.random() * 0.05;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 900, popTime);
        osc.frequency.exponentialRampToValueAtTime(150, popTime + 0.03);

        gain.gain.setValueAtTime(0.08, popTime);
        gain.gain.linearRampToValueAtTime(0.001, popTime + 0.03);

        osc.connect(gain);
        this.routeAudio(gain);

        osc.start(popTime);
        osc.stop(popTime + 0.035);
      }
    } catch {}
  }

  /**
   * Forest cricket chirps
   */
  public playForestCricket() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      for (let i = 0; i < 3; i++) {
        const chirpTime = t + i * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(4200, chirpTime);

        gain.gain.setValueAtTime(0.04, chirpTime);
        gain.gain.linearRampToValueAtTime(0.001, chirpTime + 0.04);

        osc.connect(gain);
        this.routeAudio(gain);

        osc.start(chirpTime);
        osc.stop(chirpTime + 0.045);
      }
    } catch {}
  }

  /**
   * Nether viscous magma bubble burst
   */
  public playMagmaBubble() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(65, t + 0.16);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  /**
   * The End ethereal void dimensional resonance
   */
  public playVoidShimmer() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const freqs = [587.33, 783.99, 1174.66];

      freqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (Math.random() - 0.5) * 8, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.06, t + 0.4 + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.001, t + 1.8);

        osc.connect(gain);
        this.routeAudio(gain);

        osc.start(t);
        osc.stop(t + 1.85);
      });
    } catch {}
  }

  /**
   * Distant rolling thunder rumble
   */
  public playThunderRumble() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 2.0);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2.4);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 2.45);
    } catch {}
  }

  /**
   * Destructible Environment: Wooden barrel/crate splintering crunch
   */
  public playWoodShatter() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Noise burst for wood snapping & splintering
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.frequency.exponentialRampToValueAtTime(320, t + 0.18);
      filter.Q.value = 1.8;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      noise.connect(filter);
      filter.connect(gain);
      this.routeAudio(gain);

      noise.start(t);

      // 2. Thump impact of heavy timber planks hitting the floor
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.16);

      oscGain.gain.setValueAtTime(0.3, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(oscGain);
      this.routeAudio(oscGain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {}
  }

  /**
   * Destructible Environment: Grass/foliage crisp shearing rustle
   */
  public playGrassSlash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.frequency.exponentialRampToValueAtTime(3200, t + 0.14);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      noise.connect(filter);
      filter.connect(gain);
      this.routeAudio(gain);

      noise.start(t);
    } catch {}
  }

  /**
   * Destructible Environment: Ceramic pot/urn smash
   */
  public playPotSmash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // High pitched ceramic ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.2);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      this.routeAudio(gain);

      osc.start(t);
      osc.stop(t + 0.21);

      // Clatter noise
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.Q.value = 3.0;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      noise.connect(filter);
      filter.connect(noiseGain);
      this.routeAudio(noiseGain);

      noise.start(t);
    } catch {}
  }

  /**
   * Wither Boss Enraged (狂暴状态觉醒) Roar & Dark Tremor
   */
  public playBossEnrage() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // 1. Deep demonic sub-bass roar
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(140, t);
      osc1.frequency.exponentialRampToValueAtTime(36, t + 1.2);

      gain1.gain.setValueAtTime(0.4, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

      osc1.connect(gain1);
      this.routeAudio(gain1);
      osc1.start(t);
      osc1.stop(t + 1.35);

      // 2. Screaming discordant higher harmonic
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(320, t);
      osc2.frequency.exponentialRampToValueAtTime(80, t + 1.0);

      gain2.gain.setValueAtTime(0.25, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.05);

      osc2.connect(gain2);
      this.routeAudio(gain2);
      osc2.start(t);
      osc2.stop(t + 1.1);

      // 3. Shockwave dark noise rumble
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.exponentialRampToValueAtTime(110, t + 0.8);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(0.35, t);
      nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      noise.connect(filter);
      filter.connect(nGain);
      this.routeAudio(nGain);

      noise.start(t);
    } catch {}
  }

  // ==========================================
  // DESTRUCTIBLES & ELEMENTAL / ELITE SFX
  // ==========================================

  public playBreakWood() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Snappy wood crack
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  public playBreakUrn() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Ceramic shatter high crackle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.14);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.14);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.14);
    } catch {}
  }

  public playBreakStone() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playBreakFoliage() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  public playShieldReflect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // High-frequency crystal ping
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.18);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  public playTeleportBlink() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.15);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  public playElementalWeakness() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Dual bright bell chord
      [880, 1320].forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.005, t + 0.22);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    } catch {}
  }

  public playElementalResist() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, t);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  /**
   * Skeleton shattering into scattered bone obstacle
   */
  public playSkeletonShatter() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // High-pitched crunchy clicks layered with dry thuds
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        const delay = i * 0.035;
        osc.frequency.setValueAtTime(800 - i * 150, t + delay);
        osc.frequency.exponentialRampToValueAtTime(120, t + delay + 0.08);
        gain.gain.setValueAtTime(0.28, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.005, t + delay + 0.08);
        osc.connect(gain);
        this.routeAudio(gain);
        osc.start(t + delay);
        osc.stop(t + delay + 0.09);
      }
    } catch {}
  }

  /**
   * Undead zombie reviving surge
   */
  public playUndeadRevive() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Deep ominous necrotic swell
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(145, t + 0.45);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.55);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.55);
    } catch {}
  }

  /**
   * Agile evasive charge whoosh
   */
  public playDashCharge() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);
      osc.connect(gain);
      this.routeAudio(gain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }
}

export const soundManager = new SoundManager();
