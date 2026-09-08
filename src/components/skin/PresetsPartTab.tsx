import React, { useRef } from 'react';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SPINE_PRESETS } from '../../engine/skin/SpinePresets';
import { Sparkles, Download, Upload, Check } from 'lucide-react';

interface PresetsPartTabProps {
  onUpdate: () => void;
}

export const PresetsPartTab: React.FC<PresetsPartTabProps> = ({ onUpdate }) => {
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const currentPuppet = customSkinManager.getSpinePuppet();

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(currentPuppet, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spine_character_${currentPuppet.name || 'custom'}.json`;
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
        if (parsed && parsed.slots) {
          customSkinManager.updateSpineOverall(parsed);
          onUpdate();
        }
      } catch {
        // error handled
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">【官方套装预设 & 备份】</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 rounded border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs text-stone-300 hover:text-white"
          >
            <Download className="h-3 w-3" />
            <span>导出配置 JSON</span>
          </button>
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center gap-1 rounded border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-xs text-amber-300 hover:bg-amber-900/50"
          >
            <Upload className="h-3 w-3" />
            <span>导入配置 JSON</span>
          </button>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJson}
          />
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SPINE_PRESETS.map((preset) => {
          const isCurrent = currentPuppet.name === preset.name;
          return (
            <button
              key={preset.id}
              onClick={() => {
                customSkinManager.applySpinePreset(preset.id);
                onUpdate();
              }}
              className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                isCurrent
                  ? 'border-amber-400 bg-amber-950/50 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-950/50 hover:bg-stone-900 hover:border-stone-700'
              }`}
            >
              <div className="flex w-full items-center justify-between mb-1">
                <span className="text-base">{preset.icon}</span>
                {isCurrent && <Check className="h-3.5 w-3.5 text-amber-400" />}
              </div>
              <div className="text-xs font-bold text-stone-200">{preset.name}</div>
              <div className="text-[10px] text-stone-400 line-clamp-1">{preset.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
