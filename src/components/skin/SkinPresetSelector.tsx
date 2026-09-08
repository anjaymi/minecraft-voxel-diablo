import React from 'react';
import { DEFAULT_SKIN_PRESETS, SkinPreset } from '../../engine/skin/CustomSkinPresets';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { CustomSkinConfig } from '../../types';
import { Check, Sparkles } from 'lucide-react';

interface SkinPresetSelectorProps {
  currentSkin: CustomSkinConfig | null;
  onSelect: () => void;
}

export const SkinPresetSelector: React.FC<SkinPresetSelectorProps> = ({ currentSkin, onSelect }) => {
  const handleSelectPreset = (preset: SkinPreset) => {
    customSkinManager.setSkin({ ...preset.config });
    onSelect();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        <span>精选内置外观预设 (一键快速切换)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {DEFAULT_SKIN_PRESETS.map((preset) => {
          const isSelected = currentSkin?.enabled && currentSkin.name === preset.name;
          return (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_12px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                  : 'border-stone-800 bg-stone-900/60 hover:border-stone-600 hover:bg-stone-800/60'
              }`}
            >
              {/* Preset Icon / Mini Preview */}
              <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-stone-700 bg-stone-950 shadow-inner group-hover:scale-105 transition-transform">
                <img
                  src={preset.config.dataUrl}
                  alt={preset.name}
                  className="h-10 w-10 object-contain image-rendering-pixelated"
                />
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-stone-950 shadow">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
                {preset.name}
              </span>
              <span className="mt-0.5 text-[10px] text-stone-400 line-clamp-1">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
