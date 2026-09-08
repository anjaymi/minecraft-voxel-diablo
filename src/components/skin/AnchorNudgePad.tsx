import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { SpineSlotData } from '../../engine/skin/spineTypes';
import { SpinePartSpec } from '../../engine/skin/SpineSpecExporter';

interface AnchorNudgePadProps {
  slotData: SpineSlotData | undefined;
  spec: SpinePartSpec | undefined;
  onNudge: (dx: number, dy: number) => void;
  onReset: () => void;
}

export const AnchorNudgePad: React.FC<AnchorNudgePadProps> = ({
  slotData,
  spec,
  onNudge,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-2.5 text-xs">
      {/* Active Slot Info Box */}
      <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-2.5">
        <div className="font-bold text-amber-300 flex items-center justify-between">
          <span>{spec?.label} 标准参考</span>
          <span className="font-mono text-[11px] text-amber-400/90">
            {spec?.recommendedWidth}×{spec?.recommendedHeight}px
          </span>
        </div>
        <p className="mt-1 text-[11px] text-stone-300 leading-relaxed">{spec?.description}</p>
      </div>

      {/* Current Offset Values */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col rounded-lg border border-stone-800 bg-stone-950/80 p-2">
          <span className="text-[10px] text-stone-400">X 轴偏移量</span>
          <span className="font-mono text-sm font-bold text-amber-400">
            {slotData ? `${slotData.offsetX > 0 ? '+' : ''}${slotData.offsetX}px` : '0px'}
          </span>
        </div>
        <div className="flex flex-col rounded-lg border border-stone-800 bg-stone-950/80 p-2">
          <span className="text-[10px] text-stone-400">Y 轴偏移量</span>
          <span className="font-mono text-sm font-bold text-amber-400">
            {slotData ? `${slotData.offsetY > 0 ? '+' : ''}${slotData.offsetY}px` : '0px'}
          </span>
        </div>
      </div>

      {/* Micro Nudge Directional Pad */}
      <div className="flex flex-col items-center gap-1 py-1">
        <span className="text-[11px] text-stone-400 font-semibold">1像素微调校准</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNudge(0, -1)}
            className="rounded border border-stone-700 bg-stone-800 p-1.5 hover:border-amber-400 hover:text-amber-300 transition-colors"
            title="上移 1px"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNudge(-1, 0)}
            className="rounded border border-stone-700 bg-stone-800 p-1.5 hover:border-amber-400 hover:text-amber-300 transition-colors"
            title="左移 1px"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="rounded border border-stone-800 bg-stone-950 px-2 py-1 font-mono text-[10px] text-stone-400">
            (0,0)
          </span>
          <button
            onClick={() => onNudge(1, 0)}
            className="rounded border border-stone-700 bg-stone-800 p-1.5 hover:border-amber-400 hover:text-amber-300 transition-colors"
            title="右移 1px"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onNudge(0, 1)}
            className="rounded border border-stone-700 bg-stone-800 p-1.5 hover:border-amber-400 hover:text-amber-300 transition-colors"
            title="下移 1px"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Reset Action */}
      <button
        onClick={onReset}
        className="flex items-center justify-center gap-1 rounded-lg border border-amber-600/50 bg-amber-950/40 py-1.5 text-xs text-amber-300 hover:bg-amber-900/60 transition-colors"
      >
        <RotateCcw className="h-3 w-3" />
        <span>复位推荐对准</span>
      </button>
    </div>
  );
};
