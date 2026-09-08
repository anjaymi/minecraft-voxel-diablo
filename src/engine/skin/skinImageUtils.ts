import { SpineSlotKey } from './spineTypes';

export interface AutoTrimOptions {
  alphaThreshold?: number; // alpha > threshold counts as non-empty, default 10
  padding?: number; // padding pixels around trimmed content, default 2
  targetHeight?: number; // target normalized height for spine slot
  maxDim?: number; // fallback max dimension
}

/**
 * Standard recommended pixel bounds for modular Spine slots
 */
export const SLOT_NORMALIZED_DIMENSIONS: Record<SpineSlotKey, { width: number; height: number }> = {
  head: { width: 44, height: 44 },
  torso: { width: 36, height: 42 },
  armLeft: { width: 18, height: 32 },
  armRight: { width: 18, height: 32 },
  legLeft: { width: 16, height: 32 },
  legRight: { width: 16, height: 32 },
};

export class SkinImageUtils {
  /**
   * Process and auto-trim transparent outer padding, then normalize scale
   */
  public static async processAndTrimSlotImage(
    file: File,
    slotKey?: SpineSlotKey,
    options?: AutoTrimOptions
  ): Promise<string> {
    const rawDataUrl = await this.readAsDataUrl(file);
    const img = await this.loadImage(rawDataUrl);

    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;

    // 1. Draw to memory canvas to sample alpha
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = origW;
    srcCanvas.height = origH;
    const srcCtx = srcCanvas.getContext('2d');
    if (!srcCtx) throw new Error('Canvas 2D Context not available');

    srcCtx.drawImage(img, 0, 0);
    const imgData = srcCtx.getImageData(0, 0, origW, origH);
    const pixels = imgData.data;

    const threshold = options?.alphaThreshold ?? 12;
    let minX = origW;
    let minY = origH;
    let maxX = -1;
    let maxY = -1;

    // 2. Scan bounding box of visible pixels
    for (let y = 0; y < origH; y++) {
      for (let x = 0; x < origW; x++) {
        const idx = (y * origW + x) * 4;
        const alpha = pixels[idx + 3];
        if (alpha > threshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If completely transparent, fallback to center or original
    if (maxX < minX || maxY < minY) {
      minX = 0;
      minY = 0;
      maxX = origW - 1;
      maxY = origH - 1;
    }

    // Add safe padding
    const padding = options?.padding ?? 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(origW - 1, maxX + padding);
    maxY = Math.min(origH - 1, maxY + padding);

    const cropW = Math.max(1, maxX - minX + 1);
    const cropH = Math.max(1, maxY - minY + 1);

    // 3. Compute normalized target dimensions
    let destW = cropW;
    let destH = cropH;

    const slotSpec = slotKey ? SLOT_NORMALIZED_DIMENSIONS[slotKey] : null;
    const targetHeight = options?.targetHeight ?? (slotSpec ? slotSpec.height : 48);
    const maxDim = options?.maxDim ?? 128;

    if (slotSpec) {
      // Scale proportionally so that the height matches standard limb/body height
      const scale = targetHeight / cropH;
      destW = Math.max(6, Math.round(cropW * scale));
      destH = Math.max(6, Math.round(cropH * scale));
    } else if (cropW > maxDim || cropH > maxDim) {
      const scale = Math.min(maxDim / cropW, maxDim / cropH);
      destW = Math.max(8, Math.round(cropW * scale));
      destH = Math.max(8, Math.round(cropH * scale));
    }

    // 4. Draw trimmed & scaled result into output canvas
    const destCanvas = document.createElement('canvas');
    destCanvas.width = destW;
    destCanvas.height = destH;
    const destCtx = destCanvas.getContext('2d');
    if (!destCtx) throw new Error('Dest Canvas context failed');

    destCtx.imageSmoothingEnabled = destW < 64; // Retain crisp pixel-art style
    destCtx.drawImage(
      srcCanvas,
      minX, minY, cropW, cropH,
      0, 0, destW, destH
    );

    return destCanvas.toDataURL('image/png');
  }

  public static async fileToOptimizedDataUrl(file: File, maxDim: number = 256): Promise<string> {
    return this.processAndTrimSlotImage(file, undefined, { maxDim });
  }

  private static readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) resolve(result);
        else reject(new Error('无法读取文件数据'));
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsDataURL(file);
    });
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = src;
    });
  }
}
