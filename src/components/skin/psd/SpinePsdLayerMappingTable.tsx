import React from 'react';
import { SpineSlotKey } from '../../../engine/skin/spineTypes';
import { PsdParsedLayerInfo, PsdSlotBinding } from '../../../engine/skin/psd/spinePsdTypes';
import { CheckCircle2, AlertTriangle, HelpCircle, RotateCcw } from 'lucide-react';

interface SpinePsdLayerMappingTableProps {
  slotBindings: Record<SpineSlotKey, PsdSlotBinding>;
  allLayers: PsdParsedLayerInfo[];
  selectedSlotKey: SpineSlotKey;
  onSelectSlot: (slotKey: SpineSlotKey) => void;
  onRemapLayer: (slotKey: SpineSlotKey, layerId: string | undefined) => void;
  onResetMarkerToDefault: (slotKey: SpineSlotKey) => void;
}

export const SpinePsdLayerMappingTable: React.FC<SpinePsdLayerMappingTableProps> = ({
  slotBindings,
  allLayers,
  selectedSlotKey,
  onSelectSlot,
  onRemapLayer,
  onResetMarkerToDefault,
}) => {
  const keys: SpineSlotKey[] = ['head', 'torso', 'armRight', 'armLeft', 'legRight', 'legLeft'];

  // Available layers for dropdown (non-marker layers)
  const availableLayers = allLayers.filter((l) => !l.isBoneMarker && l.dataUrl);

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-stone-800 text-stone-400 font-semibold">
            <th className="py-1.5 px-2">骨骼槽位</th>
            <th className="py-1.5 px-2">对应 PSD 图层</th>
            <th className="py-1.5 px-2">缩略图</th>
            <th className="py-1.5 px-2">骨骼点 (PSD)</th>
            <th className="py-1.5 px-2">轴心比例 (Pivot)</th>
            <th className="py-1.5 px-2 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-800/60">
          {keys.map((key) => {
            const binding = slotBindings[key];
            const isSelected = selectedSlotKey === key;
            const marker = binding.boneMarker;
            const matched = binding.matchedLayer;

            return (
              <tr
                key={key}
                onClick={() => onSelectSlot(key)}
                className={`cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-amber-950/40 text-amber-200'
                    : 'hover:bg-stone-900/60 text-stone-300'
                }`}
              >
                {/* Slot Label */}
                <td className="py-1.5 px-2 font-medium">
                  <div className="flex items-center gap-1.5">
                    {binding.status === 'matched' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    )}
                    <span>{binding.slotLabel}</span>
                  </div>
                </td>

                {/* Layer Dropdown */}
                <td className="py-1.5 px-2" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={matched?.id || ''}
                    onChange={(e) => onRemapLayer(key, e.target.value || undefined)}
                    className="w-36 rounded border border-stone-700 bg-stone-900 px-1.5 py-0.5 text-xs text-stone-200 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">-- 未选择 --</option>
                    {availableLayers.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.groupName ? `[${l.groupName}] ` : ''}
                        {l.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Thumbnail */}
                <td className="py-1.5 px-2">
                  {matched?.dataUrl ? (
                    <img
                      src={matched.dataUrl}
                      alt={matched.name}
                      className="h-7 w-7 rounded border border-stone-700 bg-black/60 object-contain p-0.5"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded border border-stone-800 bg-stone-900 text-stone-500">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </div>
                  )}
                </td>

                {/* Bone Marker PSD coord */}
                <td className="py-1.5 px-2 font-mono text-[11px] text-stone-400">
                  {marker ? (
                    <span>
                      ({marker.psdX}, {marker.psdY})
                    </span>
                  ) : (
                    '-'
                  )}
                </td>

                {/* Pivot ratios */}
                <td className="py-1.5 px-2 font-mono text-[11px] text-amber-300">
                  <span>
                    ({binding.pivotX.toFixed(2)}, {binding.pivotY.toFixed(2)})
                  </span>
                </td>

                {/* Reset button */}
                <td className="py-1.5 px-2 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onResetMarkerToDefault(key)}
                    title="重置到标准解剖轴心"
                    className="rounded p-1 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
