import { CustomSkinConfig } from '../../types';
import { SpinePuppetConfig, SpineSlotKey, SpineSlotData } from './spineTypes';
import { createSpinePuppet, SPINE_PRESETS } from './SpinePresets';
import { spineImageLoader } from './SpineSlotImageLoader';
import { SkinImageUtils } from './skinImageUtils';

const STORAGE_KEY_MODE = 'mc_rogue_skin_mode_v3';
const STORAGE_KEY_FULLBODY = 'mc_rogue_custom_skin_v2';
const STORAGE_KEY_SPINE = 'mc_rogue_spine_puppet_v3';

export class CustomSkinManager {
  private static instance: CustomSkinManager | null = null;
  private mode: 'default' | 'spine' | 'fullbody' = 'spine';
  private fullbodySkin: CustomSkinConfig | null = null;
  private spinePuppet: SpinePuppetConfig = createSpinePuppet('秘银圣骑装配', 'knight');
  private listeners: Array<() => void> = [];
  private isNotifying: boolean = false;
  private saveTimeoutId: number | null = null;

  private constructor() {
    this.loadFromStorage();
    this.preloadAllSpineImages();
    // Re-render safely when async slot textures finish loading
    spineImageLoader.onLoaded(() => {
      this.notifyListeners();
    });
  }

  public static getInstance(): CustomSkinManager {
    if (!CustomSkinManager.instance) {
      CustomSkinManager.instance = new CustomSkinManager();
    }
    return CustomSkinManager.instance;
  }

  public getActiveMode(): 'default' | 'spine' | 'fullbody' {
    return this.mode;
  }

  public setActiveMode(mode: 'default' | 'spine' | 'fullbody') {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'spine') {
      this.spinePuppet.enabled = true;
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  // === Spine Modular Puppet Methods ===
  public getSpinePuppet(): SpinePuppetConfig {
    return this.spinePuppet;
  }

  public setSpinePuppet(config: SpinePuppetConfig) {
    this.spinePuppet = {
      ...config,
      enabled: true,
    };
    this.mode = 'spine';
    this.preloadAllSpineImages();
    this.saveToStorage();
    this.notifyListeners();
  }

  public updateSpineSlot(slotId: SpineSlotKey, patch: Partial<SpineSlotData>) {
    if (!this.spinePuppet.slots[slotId]) return;
    this.spinePuppet.slots[slotId] = {
      ...this.spinePuppet.slots[slotId],
      ...patch,
    };
    this.spinePuppet.enabled = true;
    this.mode = 'spine';
    if (patch.dataUrl) {
      spineImageLoader.preload(patch.dataUrl).catch(() => {});
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public updateSpineOverall(patch: Partial<SpinePuppetConfig>) {
    this.spinePuppet = {
      ...this.spinePuppet,
      ...patch,
      enabled: patch.enabled !== undefined ? patch.enabled : true,
    };
    this.mode = 'spine';
    this.saveToStorage();
    this.notifyListeners();
  }

  public async uploadSpineSlotImage(slotId: SpineSlotKey, file: File): Promise<string> {
    const dataUrl = await SkinImageUtils.processAndTrimSlotImage(file, slotId);
    this.updateSpineSlot(slotId, {
      dataUrl,
      visible: true,
    });
    return dataUrl;
  }

  public applySpinePreset(bundleId: string) {
    const found = SPINE_PRESETS.find((p) => p.id === bundleId);
    if (found) {
      // Deep clone preset config
      this.spinePuppet = JSON.parse(JSON.stringify(found.config));
      this.spinePuppet.enabled = true;
      this.mode = 'spine';
      this.preloadAllSpineImages();
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // === Legacy Single-PNG Fullbody Methods ===
  public getSkin(): CustomSkinConfig | null {
    return this.fullbodySkin;
  }

  public getLoadedImage(): HTMLImageElement | null {
    if (!this.fullbodySkin?.dataUrl) return null;
    return spineImageLoader.getImage(this.fullbodySkin.dataUrl);
  }

  public setSkin(skin: CustomSkinConfig | null) {
    this.fullbodySkin = skin;
    if (skin) {
      this.mode = 'fullbody';
      spineImageLoader.preload(skin.dataUrl).catch(() => {});
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public updateSkinParams(params: Partial<CustomSkinConfig>) {
    if (!this.fullbodySkin) return;
    this.fullbodySkin = {
      ...this.fullbodySkin,
      ...params,
    };
    this.saveToStorage();
    this.notifyListeners();
  }

  public async processUploadFile(file: File): Promise<CustomSkinConfig> {
    const dataUrl = await SkinImageUtils.fileToOptimizedDataUrl(file, 256);
    const newConfig: CustomSkinConfig = {
      enabled: true,
      dataUrl,
      name: file.name.replace(/\.[^/.]+$/, ''),
      scale: 1.0,
      offsetY: 0,
      bounceAnimation: true,
      showWeaponOverlay: false,
    };
    this.setSkin(newConfig);
    return newConfig;
  }

  public resetToDefault() {
    this.mode = 'default';
    this.saveToStorage();
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private preloadAllSpineImages() {
    if (this.spinePuppet?.slots) {
      for (const key of Object.keys(this.spinePuppet.slots) as SpineSlotKey[]) {
        const slot = this.spinePuppet.slots[key];
        if (slot?.dataUrl) {
          spineImageLoader.preload(slot.dataUrl).catch(() => {});
        }
      }
    }
    if (this.fullbodySkin?.dataUrl) {
      spineImageLoader.preload(this.fullbodySkin.dataUrl).catch(() => {});
    }
  }

  private loadFromStorage() {
    try {
      const storedMode = localStorage.getItem(STORAGE_KEY_MODE);
      if (storedMode === 'default' || storedMode === 'spine' || storedMode === 'fullbody') {
        this.mode = storedMode;
      }
      const storedSpine = localStorage.getItem(STORAGE_KEY_SPINE);
      if (storedSpine) {
        const parsed = JSON.parse(storedSpine);
        if (parsed && parsed.slots && parsed.slots.head) {
          // Self-heal corrupted negative offsets that accidentally pinned weapon to the head
          if (
            (parsed.weaponOffsetY !== undefined && parsed.weaponOffsetY <= -18) ||
            (parsed.weaponOffsetX !== undefined && Math.abs(parsed.weaponOffsetX) > 20)
          ) {
            parsed.weaponOffsetX = 0;
            parsed.weaponOffsetY = 0;
          }
          this.spinePuppet = parsed;
        }
      }
      const storedFull = localStorage.getItem(STORAGE_KEY_FULLBODY);
      if (storedFull) {
        this.fullbodySkin = JSON.parse(storedFull);
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage() {
    if (this.saveTimeoutId !== null) {
      clearTimeout(this.saveTimeoutId);
    }
    // Debounce storage writes by 200ms to avoid main thread I/O stalls during gameplay
    this.saveTimeoutId = window.setTimeout(() => {
      this.saveTimeoutId = null;
      try {
        localStorage.setItem(STORAGE_KEY_MODE, this.mode);
        localStorage.setItem(STORAGE_KEY_SPINE, JSON.stringify(this.spinePuppet));
        if (this.fullbodySkin) {
          localStorage.setItem(STORAGE_KEY_FULLBODY, JSON.stringify(this.fullbodySkin));
        }
      } catch {
        // ignore storage quota errors
      }
    }, 200);
  }

  private notifyListeners() {
    if (this.isNotifying) return; // Prevent cascading re-entrancy loops
    this.isNotifying = true;
    try {
      const snapshot = [...this.listeners];
      for (const listener of snapshot) {
        try {
          listener();
        } catch {
          // ignore
        }
      }
    } finally {
      this.isNotifying = false;
    }
  }
}

export const customSkinManager = CustomSkinManager.getInstance();
