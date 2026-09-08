import React, { useRef, useState } from 'react';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpineSlotProcedural } from '../../engine/skin/SpineSlotProcedural';
import { Upload, RotateCcw, Eye, EyeOff, Sparkles, Scissors, Shield } from 'lucide-react';

interface TorsoPartTabProps {
  onUpdate: () => void;
}

export const TorsoPartTab: React.FC<TorsoPartTabProps> = ({ onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const puppet = customSkinManager.getSpinePuppet();
  const slot = puppet.slots.torso;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      await customSkinManager.uploadSpineSlotImage('torso', file);
      onUpdate();
    } finally {
      setIsProcessing(false);
    }
  };

  const setPreset = (type: 'knight' | 'mage' | 'skeleton' | 'mecha') => {
    const dataUrl = SpineSlotProcedural.createSlotSprite(type, 'torso');
    customSkinManager.updateSpineSlot('torso', { dataUrl, visible: true });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">【身体 / 躯干】皮肤部件定制</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              customSkinManager.updateSpineSlot('torso', { visible: !slot.visible });
              onUpdate();
            }}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs border ${
              slot.visible
                ? 'border-stone-700 bg-stone-800 text-stone-300 hover:text-white'
                : 'border-red-500/40 bg-red-950/40 text-red-300'
            }`}
          >
            {slot.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            <span>{slot.visible ? '显示中' : '已隐藏'}</span>
          </button>
          <button
            onClick={() => {
              customSkinManager.updateSpineSlot('torso', { offsetX: 0, offsetY: 0, scale: 1.0, rotationDeg: 0 });
              onUpdate();
            }}
            className="flex items-center gap-1 rounded border border-stone-700 bg-stone-800 px-2 py-1 text-xs text-stone-300 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>重置微调</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Upload Card */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-stone-700 bg-stone-950/60 p-3 hover:border-amber-500/60 hover:bg-stone-900 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-950/50 border border-blue-500/40 text-blue-400 group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                {isProcessing ? '裁剪规范中...' : '上传躯干/服饰 PNG'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                <Scissors className="h-3 w-3" />
                <span>自动透明边界裁剪 + 居中轴心对齐</span>
              </div>
            </div>
          </div>
          {slot.dataUrl && (
            <div className="h-10 w-10 overflow-hidden rounded border border-stone-700 bg-stone-900 p-0.5 flex items-center justify-center">
              <img src={slot.dataUrl} alt="Torso Slot" className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </div>

        {/* Quick Style Presets */}
        <div className="flex flex-col justify-center rounded-lg border border-stone-800 bg-stone-950/40 p-3">
          <span className="text-[11px] font-semibold text-stone-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>或套用甲胄躯干原型:</span>
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            <button onClick={() => setPreset('knight')} className="rounded bg-stone-800 py-1 text-[11px] text-stone-300 hover:bg-blue-900/60 hover:text-white">重铠</button>
            <button onClick={() => setPreset('mage')} className="rounded bg-stone-800 py-1 text-[11px] text-stone-300 hover:bg-purple-900/60 hover:text-white">法袍</button>
            <button onClick={() => setPreset('skeleton')} className="rounded bg-stone-800 py-1 text-[11px] text-stone-300 hover:bg-stone-700 hover:text-white">肋骨</button>
            <button onClick={() => setPreset('mecha')} className="rounded bg-stone-800 py-1 text-[11px] text-stone-300 hover:bg-cyan-900/60 hover:text-white">装甲</button>
          </div>
        </div>
      </div>

      {/* Fine-Tuning Sliders */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-stone-800/60">
        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>缩放: {slot.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.2"
            step="0.05"
            value={slot.scale}
            onChange={(e) => {
              customSkinManager.updateSpineSlot('torso', { scale: parseFloat(e.target.value) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>上下偏移: {slot.offsetY}px</span>
          </div>
          <input
            type="range"
            min="-25"
            max="25"
            step="1"
            value={slot.offsetY}
            onChange={(e) => {
              customSkinManager.updateSpineSlot('torso', { offsetY: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>左右偏移: {slot.offsetX}px</span>
          </div>
          <input
            type="range"
            min="-25"
            max="25"
            step="1"
            value={slot.offsetX}
            onChange={(e) => {
              customSkinManager.updateSpineSlot('torso', { offsetX: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>角度: {slot.rotationDeg}°</span>
          </div>
          <input
            type="range"
            min="-45"
            max="45"
            step="1"
            value={slot.rotationDeg}
            onChange={(e) => {
              customSkinManager.updateSpineSlot('torso', { rotationDeg: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
