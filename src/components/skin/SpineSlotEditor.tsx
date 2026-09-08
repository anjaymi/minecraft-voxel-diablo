import React, { useRef, useState } from 'react';
import { SpineSlotKey, SpineSlotData } from '../../engine/skin/spineTypes';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpineSlotProcedural } from '../../engine/skin/SpineSlotProcedural';
import { Upload, RotateCcw, Sliders, Eye, EyeOff, Sparkles, Image as ImageIcon } from 'lucide-react';

interface SpineSlotEditorProps {
  slotId: SpineSlotKey;
  slotData: SpineSlotData;
  onUpdate: () => void;
}

export const SpineSlotEditor: React.FC<SpineSlotEditorProps> = ({
  slotId,
  slotData,
  onUpdate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await customSkinManager.uploadSpineSlotImage(slotId, file);
      onUpdate();
    } catch {
      // error handled
    } finally {
      setIsUploading(false);
    }
  };

  const setProceduralPreset = (preset: 'knight' | 'mage' | 'skeleton' | 'mecha') => {
    const dataUrl = SpineSlotProcedural.createSlotSprite(preset, slotId);
    customSkinManager.updateSpineSlot(slotId, { dataUrl, visible: true });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 font-cinzel">
            定制部位: {slotData.name}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Visibility toggle */}
          <button
            onClick={() => {
              customSkinManager.updateSpineSlot(slotId, { visible: !slotData.visible });
              onUpdate();
            }}
            className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors ${
              slotData.visible
                ? 'border-stone-700 bg-stone-800 text-stone-300 hover:text-white'
                : 'border-red-500/40 bg-red-950/40 text-red-300'
            }`}
          >
            {slotData.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>{slotData.visible ? '显示中' : '已隐藏'}</span>
          </button>

          {/* Reset position & scale */}
          <button
            onClick={() => {
              customSkinManager.updateSpineSlot(slotId, {
                offsetX: 0,
                offsetY: 0,
                scale: 1.0,
                rotationDeg: 0,
              });
              onUpdate();
            }}
            className="flex items-center gap-1 rounded border border-stone-700 bg-stone-800 px-2 py-1 text-[11px] text-stone-300 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>重置姿态</span>
          </button>
        </div>
      </div>

      {/* Upload PNG for this slot & Quick Procedural Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Slot Upload Card */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-stone-700 bg-stone-950/60 p-3 hover:border-amber-500/60 hover:bg-stone-900 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/40 text-amber-400 group-hover:scale-110 transition-transform">
              {isUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                上传此部位专属 PNG
              </div>
              <p className="text-[10px] text-stone-400">单图透明切片，自动绑定骨骼关节</p>
            </div>
          </div>
        </div>

        {/* Quick Style Replacement */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-stone-800 bg-stone-950/40 p-2.5">
          <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>一键应用该部位预设样式:</span>
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'knight', label: '圣骑' },
              { id: 'mage', label: '法师' },
              { id: 'skeleton', label: '骷髅' },
              { id: 'mecha', label: '机甲' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setProceduralPreset(item.id as any)}
                className="rounded border border-stone-700 bg-stone-800/70 py-1 text-[11px] font-semibold text-stone-300 hover:border-amber-500 hover:text-amber-300 transition-all"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders: Offset X, Offset Y, Scale, Rotation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Offset X */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-stone-300">
            <span>X 轴位移</span>
            <span className="font-mono text-amber-400">{slotData.offsetX || 0}px</span>
          </div>
          <input
            type="range"
            min="-25"
            max="25"
            step="1"
            value={slotData.offsetX || 0}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(slotId, { offsetX: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
          />
        </div>

        {/* Offset Y */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-stone-300">
            <span>Y 轴位移</span>
            <span className="font-mono text-amber-400">{slotData.offsetY || 0}px</span>
          </div>
          <input
            type="range"
            min="-25"
            max="25"
            step="1"
            value={slotData.offsetY || 0}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(slotId, { offsetY: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
          />
        </div>

        {/* Scale */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-stone-300">
            <span>尺寸缩放</span>
            <span className="font-mono text-amber-400">
              {((slotData.scale || 1.0) * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.2"
            step="0.05"
            value={slotData.scale || 1.0}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(slotId, { scale: parseFloat(e.target.value) });
              onUpdate();
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
          />
        </div>

        {/* Rotation */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-stone-300">
            <span>关节角度</span>
            <span className="font-mono text-amber-400">{slotData.rotationDeg || 0}°</span>
          </div>
          <input
            type="range"
            min="-90"
            max="90"
            step="2"
            value={slotData.rotationDeg || 0}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(slotId, {
                rotationDeg: parseInt(e.target.value, 10),
              });
              onUpdate();
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
