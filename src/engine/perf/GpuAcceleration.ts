/**
 * GpuAcceleration — 主画布 GPU 加速装配。
 *
 * 三层加速（浏览器能力允许时全部生效）：
 * 1. 上下文提示：alpha:false 不透明画布（合成器跳过逐像素混合）+
 *    desynchronized:true 低延迟呈现（Chromium 下走 GPU 直通，减少一帧拷贝）。
 *    注意：提示只在首次 getContext 时生效，运行期切换需刷新页面。
 * 2. 合成层提升：画布挂 will-change:transform + translateZ(0)，
 *    使其成为独立 GPU 图层，镜头抖动/平移在合成器完成。
 * 3. 静态地形位图缓存由 TileChunkCache 承担（OffscreenCanvas GPU 合成），
 *    本模块只负责探测其可用性供设置面板展示。
 *
 * 前置条件：渲染器每帧整屏覆盖背景（render() 开头全屏径向渐变），
 * 因此 alpha:false 不会产生黑帧。
 */

export type GpuMode = 'auto' | 'on' | 'off';

export interface GpuStats {
  mode: GpuMode;
  /** GPU 提示是否已注入当前上下文 */
  active: boolean;
  /** 呈现层 desynchronized 是否实际生效 */
  desynchronized: boolean;
  opaque: boolean;
  layerPromoted: boolean;
  offscreenSupported: boolean;
}

const LS_KEY = 'mvxd_gpu_mode';

class GpuAcceleration {
  private mode: GpuMode = 'auto';
  private attrs: CanvasRenderingContext2DSettings | null = null;
  private active = false;
  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved === 'auto' || saved === 'on' || saved === 'off') this.mode = saved;
    } catch {
      // 隐私模式等存储异常走默认
    }
  }

  public getMode(): GpuMode {
    return this.mode;
  }

  /** 切换偏好（持久化；合成层即时生效，上下文提示刷新页面后生效） */
  public setMode(mode: GpuMode): void {
    this.mode = mode;
    try {
      localStorage.setItem(LS_KEY, mode);
    } catch {
      // 存储不可用时仅本次会话生效
    }
    if (this.canvas) this.applyLayer(mode !== 'off');
  }

  /** 创建主画布 2D 上下文（按当前偏好注入 GPU 提示） */
  public createContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    this.canvas = canvas;
    const gpu = this.mode !== 'off';
    this.active = gpu;
    const ctx = canvas.getContext('2d', gpu ? { alpha: false, desynchronized: true } : { alpha: true });
    if (!ctx) return null;
    this.attrs = ctx.getContextAttributes?.() ?? null;
    if (gpu) this.applyLayer(true);
    return ctx;
  }

  /** 画布合成层提升/解除（运行期可切换） */
  private applyLayer(promote: boolean): void {
    if (!this.canvas) return;
    if (promote) {
      this.canvas.style.willChange = 'transform';
      this.canvas.style.transform = 'translateZ(0)';
    } else {
      this.canvas.style.willChange = '';
      this.canvas.style.transform = '';
    }
  }

  public getStats(): GpuStats {
    return {
      mode: this.mode,
      active: this.active,
      desynchronized: !!this.attrs?.desynchronized,
      opaque: this.attrs ? !this.attrs.alpha : false,
      layerPromoted: !!this.canvas && this.mode !== 'off',
      offscreenSupported: typeof OffscreenCanvas !== 'undefined',
    };
  }
}

export const gpuAcceleration = new GpuAcceleration();
