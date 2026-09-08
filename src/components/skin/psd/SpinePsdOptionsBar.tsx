import React from 'react';
import { PsdBindingOptions } from '../../../engine/skin/psd/spinePsdTypes';
import { Sparkles, Scissors, Compass, Sliders, Check, Ruler } from 'lucide-react';

interface SpinePsdOptionsBarProps {
  options: PsdBindingOptions;
  detectedProportion?: '2.0_head' | '2.5_head';
  onChangeOptions: (updated: Partial<PsdBindingOptions>) => void;
  onApply: () => void;
  isApplying: boolean;
  canApply: boolean;
}

export const SpinePsdOptionsBar: React.FC<SpinePsdOptionsBarProps> = ({
  options,
  detectedProportion,
  onChangeOptions,
  onApply,
  isApplying,
  canApply,
}) => {
  const currentProportion = options.proportionPreset || detectedProportion || '2.5_head';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/70 p-3">
      {/* Proportion Preset & Option Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2 text-xs">
          <Ruler className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-stone-300">骨骼头身比校准:</span>
          <div className="flex items-center rounded-lg border border-stone-800 bg-stone-950 p-0.5">
            <button
              onClick={() => onChangeOptions({ proportionPreset: '2.5_head' })}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                currentProportion === '2.5_head'
                  ? 'bg-amber-600/90 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2.5 头身 (手办微Q版)
            </button>
            <button
              onClick={() => onChangeOptions({ proportionPreset: '2.0_head' })}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                currentProportion === '2.0_head'
                  ? 'bg-cyan-600/90 text-stone-950 shadow'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              2.0 头身 (Q版黏土人)
            </button>
          </div>
        </div>

        {detectedProportion && (
          <span className="text-[11px] font-mono text-stone-400">
            识别建议: <strong className="text-amber-400">{detectedProportion === '2.5_head' ? '2.5 头身' : '2.0 头身'}</strong>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Auto Trim */}
        <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-stone-800 bg-stone-950/60 p-2 text-xs transition-colors hover:border-stone-700">
          <input
            type="checkbox"
            checked={options.autoTrimAlpha}
            onChange={(e) => onChangeOptions({ autoTrimAlpha: e.target.checked })}
            className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-0"
          />
          <Scissors className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-stone-300">自动裁切透明边缘</span>
        </label>

        {/* Preserve Canvas Offsets */}
        <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-stone-800 bg-stone-950/60 p-2 text-xs transition-colors hover:border-stone-700">
          <input
            type="checkbox"
            checked={options.preserveCanvasOffsets}
            onChange={(e) => onChangeOptions({ preserveCanvasOffsets: e.target.checked })}
            className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-0"
          />
          <Compass className="h-3.5 w-3.5 text-blue-400 shrink-0" />
          <span className="text-stone-300">保持 PSD 画面相对位移</span>
        </label>

        {/* Normalize Scale */}
        <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-stone-800 bg-stone-950/60 p-2 text-xs transition-colors hover:border-stone-700">
          <input
            type="checkbox"
            checked={options.normalizeScale}
            onChange={(e) => onChangeOptions({ normalizeScale: e.target.checked })}
            className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-0"
          />
          <Sliders className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-stone-300">自适应标准角色尺寸</span>
        </label>
      </div>

      {/* Scale Slider & Apply Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-stone-800/80">
        <div className="flex items-center gap-2 text-xs text-stone-300">
          <span className="text-stone-400">输出缩放倍率:</span>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={options.targetScale}
            onChange={(e) => onChangeOptions({ targetScale: parseFloat(e.target.value) })}
            className="w-28 accent-amber-500 cursor-pointer"
          />
          <span className="w-10 font-mono text-amber-400">{(options.targetScale * 100).toFixed(0)}%</span>
        </div>

        <button
          onClick={onApply}
          disabled={!canApply || isApplying}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-md ${
            canApply && !isApplying
              ? 'border border-amber-500 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 hover:from-amber-500 hover:to-amber-400 cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'border border-stone-800 bg-stone-800/50 text-stone-500 cursor-not-allowed'
          }`}
        >
          {isApplying ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 stroke-[3]" />
          )}
          <span>一键应用装配至骨骼角色</span>
        </button>
      </div>
    </div>
  );
};
