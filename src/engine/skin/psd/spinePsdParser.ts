import { readPsd, initializeCanvas } from 'ag-psd';
import { SpineSlotKey } from '../spineTypes';
import { SPINE_PART_SPECS } from '../SpineSpecExporter';
import {
  PsdBoneMarker,
  PsdParsedLayerInfo,
  PsdParseResult,
  PsdSlotBinding,
} from './spinePsdTypes';

const SLOT_KEY_PATTERNS: Record<SpineSlotKey, RegExp[]> = {
  head: [/head/i, /头部?/, /头/i, /face/i, /脸/, /发/, /帽/, /盔/, /面/],
  torso: [/torso/i, /body/i, /躯干/, /身[体躯]?/, /胸/i, /chest/i, /甲/, /衣/, /服/],
  armRight: [/arm.*right/i, /right.*arm/i, /r.*arm/i, /arm.*r\b/i, /右[臂手臂前大]/, /主手/, /右手/, /weapon_arm/i, /hand_r/i],
  armLeft: [/arm.*left/i, /left.*arm/i, /l.*arm/i, /arm.*l\b/i, /左[臂手臂前大]/, /副手/, /左手/, /shield_arm/i, /hand_l/i],
  legRight: [/leg.*right/i, /right.*leg/i, /r.*leg/i, /leg.*r\b/i, /右[腿脚足]/, /前腿/, /前脚/, /foot_r/i],
  legLeft: [/leg.*left/i, /left.*leg/i, /l.*leg/i, /leg.*l\b/i, /左[腿脚足]/, /后腿/, /后脚/, /foot_l/i],
};

const BONE_MARKER_REGEX = /(?:bone|pivot|anchor|point|骨骼|锚点|关节|#bone|#pivot|#anchor)/i;

export class SpinePsdParser {
  public static async parsePsdFile(file: File): Promise<PsdParseResult> {
    const arrayBuffer = await file.arrayBuffer();
    return this.parsePsdBuffer(arrayBuffer, file.name, file.size);
  }

  public static async parsePsdBuffer(
    buffer: ArrayBuffer,
    fileName: string = 'character.psd',
    fileSizeBytes: number = buffer.byteLength
  ): Promise<PsdParseResult> {
    // Read PSD with image data
    const psd = readPsd(buffer, {
      skipCompositeImageData: false,
      skipLayerImageData: false,
      skipThumbnail: true,
    });

    const psdWidth = psd.width || 256;
    const psdHeight = psd.height || 256;

    let compositeDataUrl: string | undefined;
    if (psd.canvas) {
      try {
        compositeDataUrl = psd.canvas.toDataURL('image/png');
      } catch {
        // ignore canvas extraction error in restricted env
      }
    }

    const flatLayers: PsdParsedLayerInfo[] = [];
    const boneMarkers: PsdBoneMarker[] = [];
    let detectedWeaponSocket: { x: number; y: number; source: string } | undefined;

    // Traverse root children
    if (psd.children && psd.children.length > 0) {
      detectedWeaponSocket = this.traverseChildren(psd.children, '', flatLayers, boneMarkers);
    }

    // Parse guides
    const guides = { x: [] as number[], y: [] as number[] };
    const rawGuides = (psd as any).guides;
    if (rawGuides && Array.isArray(rawGuides)) {
      for (const g of rawGuides) {
        if (g.direction === 'vertical') guides.x.push(Math.round(g.location));
        if (g.direction === 'horizontal') guides.y.push(Math.round(g.location));
      }
    }

    // Build slot bindings
    const slotBindings = this.buildInitialBindings(flatLayers, boneMarkers, psdWidth, psdHeight);

    const hasAllRequiredSlots = (['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'] as SpineSlotKey[]).every(
      (k) => slotBindings[k].status === 'matched'
    );

    // Calculate estimated head-to-body proportion
    let detectedProportion: '2.0_head' | '2.5_head' = '2.5_head';
    const headLayer = slotBindings.head?.matchedLayer;
    const torsoLayer = slotBindings.torso?.matchedLayer;
    const legLayer = slotBindings.legRight?.matchedLayer || slotBindings.legLeft?.matchedLayer;
    if (headLayer && torsoLayer) {
      const headH = headLayer.height;
      const bodyH = torsoLayer.height + (legLayer ? legLayer.height : torsoLayer.height);
      const totalH = headH + bodyH;
      if (totalH > 0 && headH / totalH >= 0.46) {
        detectedProportion = '2.0_head';
      }
    }

    return {
      fileName,
      fileSizeBytes,
      psdWidth,
      psdHeight,
      compositeDataUrl,
      allLayers: flatLayers,
      detectedMarkers: boneMarkers,
      slotBindings,
      hasAllRequiredSlots,
      guides,
      detectedProportion,
      detectedWeaponSocket,
    };
  }

  private static traverseChildren(
    layers: any[],
    parentGroupName: string,
    resultList: PsdParsedLayerInfo[],
    boneMarkers: PsdBoneMarker[]
  ): { x: number; y: number; source: string } | undefined {
    let foundWeaponSocket: { x: number; y: number; source: string } | undefined;

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const name = (layer.name || `Layer_${i}`).trim();
      const isGroup = Array.isArray(layer.children);

      const left = typeof layer.left === 'number' ? layer.left : 0;
      const top = typeof layer.top === 'number' ? layer.top : 0;
      const right = typeof layer.right === 'number' ? layer.right : left + (layer.width || 0);
      const bottom = typeof layer.bottom === 'number' ? layer.bottom : top + (layer.height || 0);
      const width = Math.max(0, right - left);
      const height = Math.max(0, bottom - top);

      let dataUrl: string | undefined;
      if (layer.canvas) {
        try {
          dataUrl = layer.canvas.toDataURL('image/png');
        } catch {
          // fallback
        }
      }

      // Only leaf layers (non-groups) can be markers or socket anchors!
      const isMarker = !isGroup && BONE_MARKER_REGEX.test(name);
      const isWeaponSocket = !isGroup && (
        /(?:bone_weapon|weapon_bone|weapon_socket|weapon_anchor|weapon_point|weapon_mount|weapon_slot|武器挂点|武器锚点|握剑点|主手挂点)/i.test(name) ||
        (/(?:weapon_socket|武器挂点)/i.test(parentGroupName) && /(?:bone|point|anchor|dot|#|挂点|锚点|slot)/i.test(name))
      );

      // Must be a valid non-zero marker point (ignore 0,0 corrupted layers)
      const hasValidPoint = (width > 0 || height > 0) || (left > 15 && top > 15);

      if (isWeaponSocket && !foundWeaponSocket && hasValidPoint) {
        foundWeaponSocket = {
          x: Math.round(left + (width > 0 ? width / 2 : 0)),
          y: Math.round(top + (height > 0 ? height / 2 : 0)),
          source: name,
        };
      }

      const detectedSlot = this.detectSlotKey(name, parentGroupName);

      const info: PsdParsedLayerInfo = {
        id: `layer_${Math.random().toString(36).substr(2, 9)}`,
        name,
        groupName: parentGroupName || undefined,
        left,
        top,
        right,
        bottom,
        width,
        height,
        canvas: layer.canvas,
        dataUrl,
        hidden: Boolean(layer.hidden),
        opacity: typeof layer.opacity === 'number' ? layer.opacity : 1.0,
        isBoneMarker: isMarker || isWeaponSocket,
        detectedSlot,
      };

      if (isMarker && detectedSlot && hasValidPoint) {
        const markerX = Math.round(left + width / 2);
        const markerY = Math.round(top + height / 2);
        boneMarkers.push({
          slotKey: detectedSlot,
          name,
          psdX: markerX,
          psdY: markerY,
          source: 'marker_layer',
        });
      }

      if (!isGroup) {
        resultList.push(info);
      } else {
        const childSocket = this.traverseChildren(layer.children, name, resultList, boneMarkers);
        if (childSocket && !foundWeaponSocket) {
          foundWeaponSocket = childSocket;
        }
      }
    }

    return foundWeaponSocket;
  }

  public static detectSlotKey(layerName: string, groupName?: string): SpineSlotKey | undefined {
    const combined = `${groupName || ''} ${layerName}`.toLowerCase();
    const keys: SpineSlotKey[] = ['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'];

    for (const key of keys) {
      const patterns = SLOT_KEY_PATTERNS[key];
      for (const pattern of patterns) {
        if (pattern.test(combined)) {
          return key;
        }
      }
    }
    return undefined;
  }

  private static buildInitialBindings(
    layers: PsdParsedLayerInfo[],
    markers: PsdBoneMarker[],
    psdWidth: number,
    psdHeight: number
  ): Record<SpineSlotKey, PsdSlotBinding> {
    const keys: SpineSlotKey[] = ['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'];
    const bindings = {} as Record<SpineSlotKey, PsdSlotBinding>;
    const matchedLayerIds = new Set<string>();

    // Pass 1: Pattern-based direct matching
    for (const key of keys) {
      const matchedLayer = layers.find(
        (l) => !l.isBoneMarker && l.detectedSlot === key && (l.dataUrl || l.canvas) && !matchedLayerIds.has(l.id)
      );
      if (matchedLayer) {
        matchedLayerIds.add(matchedLayer.id);
      }
    }

    // Pass 2: Spatial heuristic fallback for missing slots from remaining layers
    const availableLayers = layers.filter((l) => !l.isBoneMarker && (l.dataUrl || l.canvas));

    for (const key of keys) {
      const spec = SPINE_PART_SPECS[key];
      let matchedLayer = layers.find(
        (l) => !l.isBoneMarker && l.detectedSlot === key && (l.dataUrl || l.canvas)
      );

      // If missing and we have unassigned art layers, use spatial layout heuristic
      if (!matchedLayer && availableLayers.length > 0) {
        const remaining = availableLayers.filter((l) => !matchedLayerIds.has(l.id));
        if (remaining.length > 0) {
          // Sort by anatomical vertical ordering: top to bottom
          const sortedByY = [...remaining].sort((a, b) => a.top - b.top);
          if (key === 'head' && sortedByY[0]) {
            matchedLayer = sortedByY[0];
          } else if (key === 'torso' && sortedByY.length > 1) {
            matchedLayer = sortedByY[Math.min(1, sortedByY.length - 1)];
          } else if (remaining.length > 0) {
            matchedLayer = remaining[0];
          }
          if (matchedLayer) {
            matchedLayerIds.add(matchedLayer.id);
          }
        }
      }

      // Find marker for this slot if any
      let marker = markers.find((m) => m.slotKey === key);

      let pivotX = spec.defaultPivotX;
      let pivotY = spec.defaultPivotY;
      let markerX = Math.round(psdWidth * 0.5);
      let markerY = Math.round(psdHeight * 0.5);

      if (matchedLayer && matchedLayer.width > 0 && matchedLayer.height > 0) {
        if (marker) {
          pivotX = Math.max(0, Math.min(1, (marker.psdX - matchedLayer.left) / matchedLayer.width));
          pivotY = Math.max(0, Math.min(1, (marker.psdY - matchedLayer.top) / matchedLayer.height));
          markerX = marker.psdX;
          markerY = marker.psdY;
        } else {
          markerX = Math.round(matchedLayer.left + matchedLayer.width * pivotX);
          markerY = Math.round(matchedLayer.top + matchedLayer.height * pivotY);
        }
      }
      if (!marker) {
        marker = {
          slotKey: key,
          name: `default_${key}`,
          psdX: markerX,
          psdY: markerY,
          source: 'default_anatomical',
        };
      }

      bindings[key] = {
        slotKey: key,
        slotLabel: spec.label,
        matchedLayer,
        boneMarker: marker,
        pivotX: Number(pivotX.toFixed(3)),
        pivotY: Number(pivotY.toFixed(3)),
        offsetX: 0,
        offsetY: 0,
        scale: 1.0,
        autoTrimPadding: true,
        status: matchedLayer ? 'matched' : 'missing',
        warningMessage: matchedLayer ? undefined : `未检测到匹配图层，请在图层列表指定或使用标准命名`,
      };
    }

    return bindings;
  }
}
