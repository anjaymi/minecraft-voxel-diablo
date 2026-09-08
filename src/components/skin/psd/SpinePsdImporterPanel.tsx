import React, { useState } from 'react';
import { SpineSlotKey } from '../../../engine/skin/spineTypes';
import { PsdBindingOptions, PsdParseResult, PsdSlotBinding } from '../../../engine/skin/psd/spinePsdTypes';
import { SpinePsdParser } from '../../../engine/skin/psd/spinePsdParser';
import { SpinePsdBindingEngine } from '../../../engine/skin/psd/spinePsdBindingEngine';
import { SpinePsdUploadDropzone } from './SpinePsdUploadDropzone';
import { SpinePsdVisualCanvas } from './SpinePsdVisualCanvas';
import { SpinePsdLayerMappingTable } from './SpinePsdLayerMappingTable';
import { SpinePsdOptionsBar } from './SpinePsdOptionsBar';
import { SPINE_PART_SPECS } from '../../../engine/skin/SpineSpecExporter';
import { FileCode, RefreshCw, CheckCircle } from 'lucide-react';

interface SpinePsdImporterPanelProps {
  onApplied?: () => void;
}

export const SpinePsdImporterPanel: React.FC<SpinePsdImporterPanelProps> = ({ onApplied }) => {
  const [parseResult, setParseResult] = useState<PsdParseResult | null>(null);
  const [slotBindings, setSlotBindings] = useState<Record<SpineSlotKey, PsdSlotBinding> | null>(null);
  const [selectedSlotKey, setSelectedSlotKey] = useState<SpineSlotKey>('head');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [options, setOptions] = useState<PsdBindingOptions>({
    autoTrimAlpha: true,
    normalizeScale: true,
    preserveCanvasOffsets: true,
    targetScale: 1.0,
  });

  const handleFileLoaded = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await SpinePsdParser.parsePsdFile(file);
      setParseResult(res);
      setSlotBindings(res.slotBindings);
    } catch (err: any) {
      console.error('PSD parse failed:', err);
      setError(`PSD 解析失败: ${err.message || '格式不受支持或文件损坏'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMarker = (slotKey: SpineSlotKey, newPsdX: number, newPsdY: number) => {
    if (!slotBindings) return;
    const current = slotBindings[slotKey];
    const layer = current.matchedLayer;

    let pivotX = current.pivotX;
    let pivotY = current.pivotY;
    if (layer && layer.width > 0 && layer.height > 0) {
      pivotX = Math.max(0, Math.min(1, (newPsdX - layer.left) / layer.width));
      pivotY = Math.max(0, Math.min(1, (newPsdY - layer.top) / layer.height));
    }

    const updatedBinding: PsdSlotBinding = {
      ...current,
      boneMarker: {
        ...current.boneMarker,
        psdX: newPsdX,
        psdY: newPsdY,
        source: 'user_adjusted',
      },
      pivotX: Number(pivotX.toFixed(3)),
      pivotY: Number(pivotY.toFixed(3)),
    };

    setSlotBindings({
      ...slotBindings,
      [slotKey]: updatedBinding,
    });
  };

  const handleRemapLayer = (slotKey: SpineSlotKey, layerId: string | undefined) => {
    if (!slotBindings || !parseResult) return;
    const current = slotBindings[slotKey];
    const targetLayer = parseResult.allLayers.find((l) => l.id === layerId);

    const spec = SPINE_PART_SPECS[slotKey];
    let pivotX = spec.defaultPivotX;
    let pivotY = spec.defaultPivotY;
    let markerX = targetLayer ? Math.round(targetLayer.left + targetLayer.width * pivotX) : current.boneMarker.psdX;
    let markerY = targetLayer ? Math.round(targetLayer.top + targetLayer.height * pivotY) : current.boneMarker.psdY;

    const updated: PsdSlotBinding = {
      ...current,
      matchedLayer: targetLayer,
      boneMarker: {
        ...current.boneMarker,
        psdX: markerX,
        psdY: markerY,
        source: 'default_anatomical',
      },
      pivotX,
      pivotY,
      status: targetLayer ? 'matched' : 'missing',
    };

    setSlotBindings({
      ...slotBindings,
      [slotKey]: updated,
    });
  };

  const handleResetMarkerToDefault = (slotKey: SpineSlotKey) => {
    if (!slotBindings) return;
    const spec = SPINE_PART_SPECS[slotKey];
    const current = slotBindings[slotKey];
    const layer = current.matchedLayer;

    let markerX = current.boneMarker.psdX;
    let markerY = current.boneMarker.psdY;
    if (layer && layer.width > 0 && layer.height > 0) {
      markerX = Math.round(layer.left + layer.width * spec.defaultPivotX);
      markerY = Math.round(layer.top + layer.height * spec.defaultPivotY);
    }

    setSlotBindings({
      ...slotBindings,
      [slotKey]: {
        ...current,
        pivotX: spec.defaultPivotX,
        pivotY: spec.defaultPivotY,
        boneMarker: {
          ...current.boneMarker,
          psdX: markerX,
          psdY: markerY,
          source: 'default_anatomical',
        },
      },
    });
  };

  const handleApplyBinding = async () => {
    if (!parseResult || !slotBindings) return;
    setIsApplying(true);
    setSuccessMsg(null);
    try {
      const activeResult: PsdParseResult = {
        ...parseResult,
        slotBindings,
      };
      await SpinePsdBindingEngine.applyPsdBinding(activeResult, options);
      setSuccessMsg('已成功从 PSD 提取部件与骨骼点，并应用装配至 Spine 角色！');
      onApplied?.();
    } catch (err: any) {
      setError(`应用绑定失败: ${err.message}`);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-stone-200">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-bold text-cyan-300 font-cinzel">PSD 骨骼标准范围与锚点导入器</span>
        </div>
        {parseResult && (
          <button
            onClick={() => {
              setParseResult(null);
              setSlotBindings(null);
              setSuccessMsg(null);
            }}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-amber-300 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>更换 PSD 文件</span>
          </button>
        )}
      </div>

      {!parseResult || !slotBindings ? (
        <SpinePsdUploadDropzone
          onFileLoaded={handleFileLoaded}
          isLoading={isLoading}
          error={error}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/60 p-2.5 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Main Inspection Area: Left Canvas, Right Mapping */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            <div className="lg:col-span-5 flex justify-center">
              <SpinePsdVisualCanvas
                parseResult={parseResult}
                slotBindings={slotBindings}
                selectedSlotKey={selectedSlotKey}
                onSelectSlot={setSelectedSlotKey}
                onUpdateMarker={handleUpdateMarker}
              />
            </div>

            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-300">
                  图层槽位智能匹配表 (可调整映射图层或重置骨骼点)
                </span>
                <span className="text-[11px] font-mono text-cyan-400">
                  {parseResult.fileName} ({parseResult.psdWidth}×{parseResult.psdHeight}px)
                </span>
              </div>
              <SpinePsdLayerMappingTable
                slotBindings={slotBindings}
                allLayers={parseResult.allLayers}
                selectedSlotKey={selectedSlotKey}
                onSelectSlot={setSelectedSlotKey}
                onRemapLayer={handleRemapLayer}
                onResetMarkerToDefault={handleResetMarkerToDefault}
              />
            </div>
          </div>

          {/* Bottom Options & Apply */}
          <SpinePsdOptionsBar
            options={options}
            detectedProportion={parseResult.detectedProportion}
            onChangeOptions={(patch) => setOptions((prev) => ({ ...prev, ...patch }))}
            onApply={handleApplyBinding}
            isApplying={isApplying}
            canApply={(Object.values(slotBindings) as PsdSlotBinding[]).some((b) => Boolean(b.matchedLayer))}
          />
        </div>
      )}
    </div>
  );
};
