import { SpineSlotKey } from './spineTypes';

export class SpineSlotImageLoader {
  private static instance: SpineSlotImageLoader | null = null;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private loadedMap: Map<string, boolean> = new Map();
  private onLoadCallbacks: Array<(dataUrl: string) => void> = [];

  public static getInstance(): SpineSlotImageLoader {
    if (!SpineSlotImageLoader.instance) {
      SpineSlotImageLoader.instance = new SpineSlotImageLoader();
    }
    return SpineSlotImageLoader.instance;
  }

  public onLoaded(callback: (dataUrl: string) => void): () => void {
    this.onLoadCallbacks.push(callback);
    return () => {
      this.onLoadCallbacks = this.onLoadCallbacks.filter((c) => c !== callback);
    };
  }

  private triggerLoaded(dataUrl: string) {
    for (const cb of this.onLoadCallbacks) {
      try {
        cb(dataUrl);
      } catch {
        // ignore callback error
      }
    }
  }

  public getImage(dataUrl: string): HTMLImageElement | null {
    if (!dataUrl) return null;
    let img = this.imageCache.get(dataUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
      this.imageCache.set(dataUrl, img);
      img.onload = () => {
        this.loadedMap.set(dataUrl, true);
        this.triggerLoaded(dataUrl);
      };
      img.onerror = () => {
        this.loadedMap.set(dataUrl, false);
      };
      return null;
    }
    return img.complete && img.naturalWidth > 0 ? img : null;
  }

  public preload(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const existing = this.getImage(dataUrl);
      if (existing) {
        resolve(existing);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(dataUrl, img);
        this.loadedMap.set(dataUrl, true);
        this.triggerLoaded(dataUrl);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = dataUrl;
    });
  }

  public clear() {
    this.imageCache.clear();
    this.loadedMap.clear();
  }
}

export const spineImageLoader = SpineSlotImageLoader.getInstance();
