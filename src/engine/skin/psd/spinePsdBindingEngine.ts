import { SpineSlotData, SpineSlotKey } from '../spineTypes';
import { customSkinManager } from '../CustomSkinManager';
import { PsdBindingOptions, PsdParseResult, PsdSlotBinding, PsdParsedLayerInfo } from './spinePsdTypes';
import { spineImageLoader } from '../SpineSlotImageLoader';
import { CHIBI_2_0_PROFILE, CHIBI_2_5_PROFILE, ChibiStandardProfile } from './ChibiProportionStandards';

export class SpinePsdBindingEngine {
  /**
   * Trim alpha from canvas and recalculate relative pivot coordinates
   */
  public static trimCanvasWithPivot(
    srcCanvas: HTMLCanvasElement,
    oldPivotX: number,
    oldPivotY: number
  ): { trimmedDataUrl: string; newPivotX: number; newPivotY: number; width: number; height: number } {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    if (w === 0 || h === 0) {
      return { trimmedDataUrl: srcCanvas.toDataURL(), newPivotX: oldPivotX, newPivotY: oldPivotY, width: w, height: h };
    }

    const ctx = srcCanvas.getContext('2d');
    if (!ctx) {
      return { trimmedDataUrl: srcCanvas.toDataURL(), newPivotX: oldPivotX, newPivotY: oldPivotY, width: w, height: h };
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 8) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If completely blank or already tight
    if (maxX < minX || maxY < minY) {
      return { trimmedDataUrl: srcCanvas.toDataURL(), newPivotX: oldPivotX, newPivotY: oldPivotY, width: w, height: h };
    }

    // Safe 1px padding
    minX = Math.max(0, minX - 1);
    minY = Math.max(0, minY - 1);
    maxX = Math.min(w - 1, maxX + 1);
    maxY = Math.min(h - 1, maxY + 1);

    const trimmedW = maxX - minX + 1;
    const trimmedH = maxY - minY + 1;

    // Convert old absolute pivot to new cropped space
    const absOldPivotX = oldPivotX * w;
    const absOldPivotY = oldPivotY * h;

    const newPivotX = Math.max(0, Math.min(1, (absOldPivotX - minX) / trimmedW));
    const newPivotY = Math.max(0, Math.min(1, (absOldPivotY - minY) / trimmedH));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = trimmedW;
    outCanvas.height = trimmedH;
    const outCtx = outCanvas.getContext('2d');
    if (outCtx) {
      outCtx.drawImage(srcCanvas, minX, minY, trimmedW, trimmedH, 0, 0, trimmedW, trimmedH);
    }

    return {
      trimmedDataUrl: outCanvas.toDataURL('image/png'),
      newPivotX: Number(newPivotX.toFixed(3)),
      newPivotY: Number(newPivotY.toFixed(3)),
      width: trimmedW,
      height: trimmedH,
    };
  }

  /**
   * Compute offsets relative to Torso marker so character proportion from PSD is preserved
   */
  public static computePreservedOffsets(
    slotBindings: Record<SpineSlotKey, PsdSlotBinding>,
    psdScaleRatio: number = 1.0,
    proportionPreset: '2.0_head' | '2.5_head' = '2.5_head',
    canvasScale: number = 1.0
  ): Record<SpineSlotKey, { offsetX: number; offsetY: number }> {
    const torsoMarker = slotBindings.torso?.boneMarker;
    const result = {} as Record<SpineSlotKey, { offsetX: number; offsetY: number }>;

    const keys: SpineSlotKey[] = ['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'];

    if (!torsoMarker) {
      for (const k of keys) result[k] = { offsetX: 0, offsetY: 0 };
      return result;
    }

    const profile: ChibiStandardProfile = proportionPreset === '2.0_head' ? CHIBI_2_0_PROFILE : CHIBI_2_5_PROFILE;
    const tplTorso = profile.parts.torso;

    for (const k of keys) {
      if (k === 'torso') {
        result[k] = { offsetX: 0, offsetY: 0 };
        continue;
      }
      const marker = slotBindings[k]?.boneMarker;
      const tplPart = profile.parts[k];

      if (marker && tplPart && tplTorso) {
        // Delta from torso in current PSD
        const psdDx = marker.psdX - torsoMarker.psdX;
        const psdDy = marker.psdY - torsoMarker.psdY;

        // Delta from torso in standard reference template scaled to PSD canvas resolution
        const tplDx = (tplPart.boneX - tplTorso.boneX) * canvasScale;
        const tplDy = (tplPart.boneY - tplTorso.boneY) * canvasScale;

        // User intentional displacement in scaled engine pixels
        const userDiffX = (psdDx - tplDx) * psdScaleRatio;
        const userDiffY = (psdDy - tplDy) * psdScaleRatio;

        // Deadzone of 2.5px to ignore sub-pixel rounding or raster quantization
        const finalX = Math.abs(userDiffX) < 2.5 ? 0 : Math.max(-30, Math.min(30, Math.round(userDiffX * 2) / 2));
        const finalY = Math.abs(userDiffY) < 2.5 ? 0 : Math.max(-30, Math.min(30, Math.round(userDiffY * 2) / 2));

        result[k] = { offsetX: finalX, offsetY: finalY };
      } else {
        result[k] = { offsetX: 0, offsetY: 0 };
      }
    }

    return result;
  }

  private static async extractCanvasFromLayer(layer: PsdParsedLayerInfo): Promise<HTMLCanvasElement | null> {
    if (layer.canvas) return layer.canvas;
    if (!layer.dataUrl) return null;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || img.width;
        c.height = img.naturalHeight || img.height;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(c);
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = layer.dataUrl!;
    });
  }

  /**
   * Apply PSD parse result directly into CustomSkinManager's Spine Puppet
   */
  public static async applyPsdBinding(
    parseResult: PsdParseResult,
    options: PsdBindingOptions
  ): Promise<boolean> {
    const { slotBindings } = parseResult;

    const selectedProportion = options.proportionPreset || parseResult.detectedProportion || '2.5_head';
    const profile: ChibiStandardProfile = selectedProportion === '2.0_head' ? CHIBI_2_0_PROFILE : CHIBI_2_5_PROFILE;

    // Standard puppet character height in game world is ~114px
    const inGameReferenceHeight = 114;
    // Canvas scale if PSD resolution is not 512 (e.g. 1024 or 256)
    const canvasScale = parseResult.psdWidth > 0 ? parseResult.psdWidth / profile.canvasSize : 1.0;
    const charHeightInPsd = profile.characterHeight * canvasScale;

    // Ratio from PSD artwork pixels down to game spine coordinates
    const basePsdScale = options.normalizeScale
      ? inGameReferenceHeight / Math.max(80, charHeightInPsd)
      : 1.0;

    const preservedOffsets = options.preserveCanvasOffsets
      ? this.computePreservedOffsets(slotBindings, basePsdScale, selectedProportion, canvasScale)
      : null;

    const keys: SpineSlotKey[] = ['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'];
    let appliedCount = 0;

    for (const key of keys) {
      const binding = slotBindings[key];
      if (!binding || !binding.matchedLayer || (!binding.matchedLayer.canvas && !binding.matchedLayer.dataUrl)) {
        continue;
      }

      const layerCanvas = await this.extractCanvasFromLayer(binding.matchedLayer);
      let finalDataUrl = binding.matchedLayer.dataUrl || '';
      let finalPivotX = binding.pivotX;
      let finalPivotY = binding.pivotY;

      // Auto trim alpha if selected and canvas is available
      if (options.autoTrimAlpha && layerCanvas) {
        const trimmed = this.trimCanvasWithPivot(layerCanvas, binding.pivotX, binding.pivotY);
        finalDataUrl = trimmed.trimmedDataUrl;
        finalPivotX = trimmed.newPivotX;
        finalPivotY = trimmed.newPivotY;
      }

      if (!finalDataUrl) {
        continue;
      }

      const offsets = preservedOffsets ? preservedOffsets[key] : { offsetX: binding.offsetX, offsetY: binding.offsetY };
      const finalSlotScale = Number((basePsdScale * binding.scale * options.targetScale).toFixed(3));

      const updatedSlot: Partial<SpineSlotData> = {
        dataUrl: finalDataUrl,
        pivotX: finalPivotX,
        pivotY: finalPivotY,
        offsetX: offsets.offsetX,
        offsetY: offsets.offsetY,
        scale: finalSlotScale,
        visible: true,
      };

      customSkinManager.updateSpineSlot(key, updatedSlot);
      spineImageLoader.preload(finalDataUrl).catch(() => {});
      appliedCount++;
    }

    if (appliedCount === 0) {
      throw new Error('未检测到可应用的图层数据。请检查图层是否可见，或在右侧表格中手动指定图层映射。');
    }

    // 2头身/2.5头身骨骼：手掌位置已由骨骼动力学及手臂掌心锚点自动对准末端肉拳
    // 默认相对手腕的微调偏移为 0；若用户在 PSD 中手动平移了 bone_weapon，则保留用户的人为位移增量
    let weaponOffsetX = 0;
    let weaponOffsetY = 0;

    if (parseResult.detectedWeaponSocket) {
      const rightArm = profile.parts.armRight;
      const stdGripX = Math.round((rightArm.left + rightArm.width * 0.50) * canvasScale);
      const stdGripY = Math.round((rightArm.top + rightArm.height * 0.78) * canvasScale);

      const socket = parseResult.detectedWeaponSocket;
      const distFromGrip = Math.hypot(socket.x - stdGripX, socket.y - stdGripY);

      // Sanity check: socket marker must be plausible (within 90px in PSD of right arm palm, away from canvas edges)
      if (distFromGrip <= 90 * canvasScale && socket.x > 25 && socket.y > 25) {
        const userDeltaX = (socket.x - stdGripX) * basePsdScale;
        const userDeltaY = (socket.y - stdGripY) * basePsdScale;

        // Deadzone of 2.5px prevents rasterization jitter from causing false offset
        if (Math.abs(userDeltaX) >= 2.5) {
          weaponOffsetX = Math.max(-15, Math.min(15, Math.round(userDeltaX * 2) / 2));
        }
        if (Math.abs(userDeltaY) >= 2.5) {
          weaponOffsetY = Math.max(-15, Math.min(15, Math.round(userDeltaY * 2) / 2));
        }
      } else {
        // Socket too far or degenerate (e.g. top-left (0, 0)) -> cleanly anchor to hand grip center (0, 0)
        weaponOffsetX = 0;
        weaponOffsetY = 0;
      }
    }

    customSkinManager.updateSpineOverall({
      enabled: true,
      showWeaponOverlay: true,
      weaponOffsetX,
      weaponOffsetY,
      weaponRotationDeg: 0,
      weaponScale: 1.0,
      proportionPreset: selectedProportion === '2.0_head' ? '2.0' : '2.5',
    });
    customSkinManager.setActiveMode('spine');
    return true;
  }
}
