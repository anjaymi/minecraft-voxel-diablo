import React, { useRef, useState } from 'react';
import { SpineSlotKey } from '../../engine/skin/spineTypes';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpineSlotProcedural } from '../../engine/skin/SpineSlotProcedural';
import { Upload, RotateCcw, Copy, Scissors, Footprints, Sword } from 'lucide-react';

interface LimbsPartTabProps {
  onUpdate: () => void;
}

const LIMB_SLOTS: { id: SpineSlotKey; label: string; icon: string; desc: string }[] = [
  { id: 'armLeft', label: '左手臂 (副手侧)', icon: '🛡️', desc: '后层手臂，自然摆动' },
  { id: 'armRight', label: '右手臂 (主手持剑)', icon: '⚔️', desc: '前层主臂，负责挥砍与攻击' },
  { id: 'legLeft', label: '左腿 (后侧肢)', icon: '🦵', desc: '后侧支撑步态' },
  { id: 'legRight', label: '右腿 (前侧肢)', icon: '👢', desc: '前侧迈步与跑动' },
];

export const LimbsPartTab: React.FC<LimbsPartTabProps> = ({ onUpdate }) => {
  const [selectedLimb, setSelectedLimb] = useState<SpineSlotKey>('armRight');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const puppet = customSkinManager.getSpinePuppet();
  const activeSlot = puppet.slots[selectedLimb];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      await customSkinManager.uploadSpineSlotImage(selectedLimb, file);
      onUpdate();
    } finally {
      setIsProcessing(false);
    }
  };

  // Mirror copy helper (e.g. Left Arm -> Right Arm or Left Leg -> Right Leg)
  const handleMirrorSymmetry = (from: SpineSlotKey, to: SpineSlotKey) => {
    const src = puppet.slots[from];
    if (!src || !src.dataUrl) return;
    customSkinManager.updateSpineSlot(to, {
      dataUrl: src.dataUrl,
      scale: src.scale,
      visible: true,
    });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-4">
      {/* Sub-selector for limbs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-1.5">
          <Footprints className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300">【四肢部件定制】</span>
        </div>

        {/* Quick symmetry shortcuts */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => handleMirrorSymmetry('armLeft', 'armRight')}
            className="flex items-center gap-1 rounded border border-stone-700 bg-stone-800/80 px-2 py-1 text-[11px] text-stone-300 hover:text-amber-300 transition-colors"
            title="把左臂材质直接同步给右臂"
          >
            <Copy className="h-3 w-3" />
            <span>左臂复制到右臂</span>
          </button>
          <button
            onClick={() => handleMirrorSymmetry('legLeft', 'legRight')}
            className="flex items-center gap-1 rounded border border-stone-700 bg-stone-800/80 px-2 py-1 text-[11px] text-stone-300 hover:text-amber-300 transition-colors"
            title="把左腿材质直接同步给右腿"
          >
            <Copy className="h-3 w-3" />
            <span>左腿复制到右腿</span>
          </button>
        </div>
      </div>

      {/* 4-Limb Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LIMB_SLOTS.map((limb) => {
          const isSelected = selectedLimb === limb.id;
          const slotData = puppet.slots[limb.id];
          return (
            <button
              key={limb.id}
              onClick={() => setSelectedLimb(limb.id)}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/50 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
                  : 'border-stone-800 bg-stone-950/40 hover:bg-stone-900 text-stone-400'
              }`}
            >
              <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded border border-stone-700 bg-stone-900 flex items-center justify-center text-xs">
                {slotData.dataUrl ? (
                  <img src={slotData.dataUrl} alt={limb.label} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span>{limb.icon}</span>
                )}
              </div>
              <div className="overflow-hidden">
                <div className={`text-xs font-bold truncate ${isSelected ? 'text-amber-300' : 'text-stone-300'}`}>
                  {limb.label}
                </div>
                <div className="text-[10px] text-stone-500 truncate">{limb.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Upload and Tuning for selected limb */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-400 group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                {isProcessing ? '裁剪规范中...' : `上传【${activeSlot.name}】PNG`}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
                <Scissors className="h-3 w-3" />
                <span>自动透明边界裁剪 + 肢体比例规范化</span>
              </div>
            </div>
          </div>
          {activeSlot.dataUrl && (
            <div className="h-10 w-10 overflow-hidden rounded border border-stone-700 bg-stone-900 p-0.5 flex items-center justify-center">
              <img src={activeSlot.dataUrl} alt="Limb Slot" className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </div>

        {/* Quick Style Presets for selected limb */}
        <div className="flex flex-col justify-center rounded-lg border border-stone-800 bg-stone-950/40 p-3">
          <span className="text-[11px] font-semibold text-stone-400 mb-1.5 flex items-center gap-1">
            <Sword className="h-3 w-3 text-amber-400" />
            <span>套用程序化肢体素材:</span>
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {(['knight', 'mage', 'skeleton', 'mecha'] as const).map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  const dataUrl = SpineSlotProcedural.createSlotSprite(preset, selectedLimb);
                  customSkinManager.updateSpineSlot(selectedLimb, { dataUrl, visible: true });
                  onUpdate();
                }}
                className="rounded bg-stone-800 py-1 text-[11px] text-stone-300 hover:bg-stone-700 hover:text-white"
              >
                {preset === 'knight' ? '重装' : preset === 'mage' ? '法袍' : preset === 'skeleton' ? '骨骼' : '机甲'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders for active limb */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-stone-800/60">
        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>缩放: {activeSlot.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.4"
            max="2.2"
            step="0.05"
            value={activeSlot.scale}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(selectedLimb, { scale: parseFloat(e.target.value) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>上下偏移: {activeSlot.offsetY}px</span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={activeSlot.offsetY}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(selectedLimb, { offsetY: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>左右偏移: {activeSlot.offsetX}px</span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={activeSlot.offsetX}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(selectedLimb, { offsetX: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-stone-400 mb-0.5">
            <span>角度: {activeSlot.rotationDeg}°</span>
          </div>
          <input
            type="range"
            min="-60"
            max="60"
            step="1"
            value={activeSlot.rotationDeg}
            onChange={(e) => {
              customSkinManager.updateSpineSlot(selectedLimb, { rotationDeg: parseInt(e.target.value, 10) });
              onUpdate();
            }}
            className="w-full accent-amber-500 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
