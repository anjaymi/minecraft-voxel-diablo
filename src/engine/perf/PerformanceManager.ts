/**
 * PerformanceManager — 帧率监控与自适应画质。
 *
 * 低帧自动降级（关闭全屏渐变动画等昂贵层），
 * 高帧持续 6 秒后恢复。供设置面板展示 FPS 与质量状态。
 */

export interface PerfStats {
  fps: number;
  lowQuality: boolean;
}

class PerformanceManager {
  private fpsEma = 60;
  private clock = 0;
  private lowSince: number | null = null;
  private highSince: number | null = null;
  private lowQuality = false;

  /** 每帧采样（dt 秒） */
  public sample(dt: number): void {
    if (dt <= 0) return;
    this.clock += dt;
    const fps = 1 / dt;
    this.fpsEma += (fps - this.fpsEma) * 0.05;

    if (!this.lowQuality && this.fpsEma < 38) {
      this.lowSince = this.lowSince ?? this.clock;
      if (this.clock - this.lowSince > 2) this.setLowQuality(true);
    } else {
      this.lowSince = null;
    }
    if (this.lowQuality && this.fpsEma > 55) {
      this.highSince = this.highSince ?? this.clock;
      if (this.clock - this.highSince > 6) this.setLowQuality(false);
    } else {
      this.highSince = null;
    }
  }

  public setLowQuality(v: boolean): void {
    this.lowQuality = v;
    this.lowSince = null;
    this.highSince = null;
  }

  public isLowQuality(): boolean {
    return this.lowQuality;
  }

  public getFps(): number {
    return Math.round(this.fpsEma);
  }

  public getStats(): PerfStats {
    return { fps: this.getFps(), lowQuality: this.lowQuality };
  }
}

export const perfManager = new PerformanceManager();

/** 粒子数量上限（超出后丢弃最旧） */
export const MAX_PARTICLES = 400;
