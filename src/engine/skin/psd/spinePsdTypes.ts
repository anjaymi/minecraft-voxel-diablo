import { SpineSlotKey, SpineSlotData } from '../spineTypes';

export interface PsdBoneMarker {
  slotKey: SpineSlotKey;
  name: string;
  psdX: number;
  psdY: number;
  source: 'marker_layer' | 'guide' | 'layer_center' | 'default_anatomical' | 'user_adjusted';
}

export interface PsdParsedLayerInfo {
  id: string;
  name: string;
  groupName?: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  canvas?: HTMLCanvasElement;
  dataUrl?: string;
  hidden: boolean;
  opacity: number;
  isBoneMarker?: boolean;
  detectedSlot?: SpineSlotKey;
}

export interface PsdSlotBinding {
  slotKey: SpineSlotKey;
  slotLabel: string;
  matchedLayer?: PsdParsedLayerInfo;
  boneMarker: PsdBoneMarker;
  pivotX: number; // 0.0 - 1.0
  pivotY: number; // 0.0 - 1.0
  offsetX: number; // -30 to 30
  offsetY: number; // -30 to 30
  scale: number;
  autoTrimPadding: boolean;
  status: 'matched' | 'missing' | 'warning';
  warningMessage?: string;
}

export interface PsdParseResult {
  fileName: string;
  fileSizeBytes: number;
  psdWidth: number;
  psdHeight: number;
  compositeDataUrl?: string;
  allLayers: PsdParsedLayerInfo[];
  detectedMarkers: PsdBoneMarker[];
  slotBindings: Record<SpineSlotKey, PsdSlotBinding>;
  hasAllRequiredSlots: boolean;
  guides?: { x: number[]; y: number[] };
  detectedProportion?: '2.0_head' | '2.5_head';
  detectedWeaponSocket?: { x: number; y: number; source: string };
}

export interface PsdBindingOptions {
  autoTrimAlpha: boolean;
  normalizeScale: boolean;
  preserveCanvasOffsets: boolean;
  targetScale: number;
  proportionPreset?: '2.0_head' | '2.5_head';
}
