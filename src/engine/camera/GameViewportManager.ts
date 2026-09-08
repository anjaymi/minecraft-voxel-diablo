/**
 * Game Viewport and Camera Zoom Manager
 * Controls global game world scale (Default 180% / 1.8x for crisp high-def visibility)
 */

export const ZOOM_PRESETS = [
  { label: '100%', value: 1.0, desc: '原始远景' },
  { label: '140%', value: 1.4, desc: '中距视口' },
  { label: '180% ★', value: 1.8, desc: '实装超清 (180%)' },
  { label: '220%', value: 2.2, desc: '特写微距' },
];

export class GameViewportManager {
  private static instance: GameViewportManager;
  // Default to 1.8x (180%) as requested: "整体游戏场景和怪物等等显示样式放大180%"
  private zoom: number = 1.8;
  private listeners: Set<(zoom: number) => void> = new Set();

  public static getInstance(): GameViewportManager {
    if (!GameViewportManager.instance) {
      GameViewportManager.instance = new GameViewportManager();
    }
    return GameViewportManager.instance;
  }

  public getZoom(): number {
    return this.zoom;
  }

  public setZoom(zoom: number) {
    const clamped = Math.max(0.8, Math.min(3.0, zoom));
    if (Math.abs(this.zoom - clamped) > 0.001) {
      this.zoom = clamped;
      this.notifyListeners();
    }
  }

  public cycleNextZoom(): number {
    const currentIndex = ZOOM_PRESETS.findIndex((p) => Math.abs(p.value - this.zoom) < 0.05);
    const nextIndex = (currentIndex + 1) % ZOOM_PRESETS.length;
    const nextZoom = ZOOM_PRESETS[nextIndex].value;
    this.setZoom(nextZoom);
    return nextZoom;
  }

  public subscribe(listener: (zoom: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.zoom));
  }

  /**
   * Transforms raw canvas mouse coordinates (clientX - canvasRect.left)
   * into unzoomed isometric scene viewport coordinates centered at screen midpoint.
   */
  public static canvasToSceneCoord(
    sx: number,
    sy: number,
    viewportWidth: number,
    viewportHeight: number,
    customZoom?: number
  ): { x: number; y: number } {
    const z = customZoom || GameViewportManager.getInstance().getZoom();
    const halfW = viewportWidth / 2;
    const halfH = viewportHeight / 2;

    const sceneX = (sx - halfW) / z + halfW;
    const sceneY = (sy - halfH) / z + halfH;

    return { x: sceneX, y: sceneY };
  }
}

export const gameViewportManager = GameViewportManager.getInstance();
