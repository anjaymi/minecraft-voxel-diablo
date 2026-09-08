import React from 'react';
import { SPINE_PRESETS, SpinePresetBundle } from '../../engine/skin/SpinePresets';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { Sparkles, Check, Download, Upload } from 'lucide-react';

interface SpinePresetGridProps {
  currentPresetName: string;
  onSelect: () => void;
}

export const SpinePresetGrid: React.FC<SpinePresetGridProps> = ({
  currentPresetName,
  onSelect,
}) => {
  const handleApply = (preset: SpinePresetBundle) => {
    customSkinManager.applySpinePreset(preset.id);
    onSelect();
  };

  const handleExportJson = () => {
    const config = customSkinManager.getSpinePuppet();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spine_character_${config.name || 'custom'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.slots && parsed.slots.head) {
          customSkinManager.setSpinePuppet(parsed);
          onSelect();
        }
      } catch {
        // ignore
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between text-xs font-bold text-stone-300">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>全套 Spine 骨骼预设 (一键整套应用或混搭)</span>
        </span>
        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1 text-[11px] text-stone-400 hover:text-amber-300">
            <Upload className="h-3 w-3" />
            <span>导入配置</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportJson}
            />
          </label>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-amber-300"
          >
            <Download className="h-3 w-3" />
            <span>导出配置</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SPINE_PRESETS.map((preset) => {
          const isSelected = currentPresetName === preset.name;

          return (
            <button
              key={preset.id}
              onClick={() => handleApply(preset)}
              className={`group relative flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_12px_rgba(251,191,36,0.3)] ring-1 ring-amber-400'
                  : 'border-stone-800 bg-stone-900/60 hover:border-stone-600 hover:bg-stone-800/60'
              }`}
            >
              <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-stone-700 bg-stone-950 shadow-inner group-hover:scale-105 transition-transform">
                <span className="text-2xl">{preset.icon}</span>
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
