import React, { useState, useEffect } from 'react';
import { Player } from '../../../types';
import { SpinePuppetConfig } from '../../../engine/skin/spineTypes';
import { customSkinManager } from '../../../engine/skin/CustomSkinManager';
import { WeaponSocketCanvasPreview } from './WeaponSocketCanvasPreview';
import { SpineWeaponPositionControl } from './SpineWeaponPositionControl';
import { SpineWeaponLayerControl } from './SpineWeaponLayerControl';
import { SpineWeaponQuickPresets } from './SpineWeaponQuickPresets';
import { Sword, RotateCcw, X, Sparkles, CheckCircle2, ShieldAlert, Target, Crosshair } from 'lucide-react';
import { WeaponBoneCalibrator } from '../../../engine/skin/weaponBoneCalibrator';

interface WeaponSocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: Player;
  onUpdate?: () => void;
}

export const WeaponSocketModal: React.FC<WeaponSocketModalProps> = ({
  isOpen,
  onClose,
  player,
  onUpdate,
}) => {
  const [config, setConfig] = useState<SpinePuppetConfig>(() =>
    customSkinManager.getSpinePuppet()
  );
  const [activeTab, setActiveTab] = useState<'transform' | 'layer'>('transform');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state whenever skin manager changes
  useEffect(() => {
    if (!isOpen) return;
    setConfig(customSkinManager.getSpinePuppet());
    const unsub = customSkinManager.subscribe(() => {
      setConfig(customSkinManager.getSpinePuppet());
    });
    return () => unsub();
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdate = (partial: Partial<SpinePuppetConfig>) => {
    customSkinManager.updateSpineOverall(partial);
    setConfig(customSkinManager.getSpinePuppet());
    if (onUpdate) onUpdate();
  };

  const handBoneInfo = WeaponBoneCalibrator.getHandBoneCoordinates(config, player);

  // 核心功能：自动计算骨骼实时坐标，将武器 X/Y 偏移量精准重置校准至手骨中心点
  const handleAutoCalibrateToHandBone = () => {
    const res = WeaponBoneCalibrator.calibrateToHandBone(config, player);
    handleUpdate(res.updatedConfig);
    showToast(`🎯 已自动校准至【${res.slotName}】(实时坐标 X: ${res.boneX}, Y: ${res.boneY}, 角度: ${res.boneRotationDeg}°)`);
  };

  const isOffsetCorrupted =
    (config.weaponOffsetY ?? 0) <= -20 || Math.abs(config.weaponOffsetX ?? 0) > 30;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative flex max-h-[96vh] max-h-[96dvh] w-full max-w-4xl flex-col rounded-2xl border-2 border-amber-500/70 bg-stone-950 p-4 sm:p-5 text-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-emerald-500/80 bg-emerald-950/95 px-4 py-1.5 text-xs font-bold text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.5)] animate-bounce">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/50 bg-amber-950/60 text-amber-400 shadow">
              <Sword className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-cinzel text-amber-400 tracking-wide">
                  武器手部挂点调校器 (Weapon Socket Configurator)
                </h2>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/40">
                  即时预览网格
                </span>
              </div>
              <p className="text-xs text-stone-400">
                实时调节武器相对于手部骨骼的 X/Y 偏移、旋转角度与渲染层级
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCalibrateToHandBone}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 shadow hover:brightness-110 active:scale-95 transition-all"
              title={`计算骨骼实时坐标并自动将武器偏移重置到${handBoneInfo.slotName}中心点`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>自动校准至手骨</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Guidance / Warning Alert if weapon offset appears corrupted */}
        {isOffsetCorrupted ? (
          <div className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />
              <span>检测到当前武器 Y 偏移值过高（接近头部区域），点击右侧按钮自动校准至手部骨骼：</span>
            </div>
            <button
              type="button"
              onClick={handleAutoCalibrateToHandBone}
              className="flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 font-bold text-white hover:bg-red-500 active:scale-95 text-xs"
            >
              <Target className="h-3.5 w-3.5" />
              <span>自动校准至手骨</span>
            </button>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs text-stone-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>提示：</strong>中心十字准星 (0, 0) 代表手掌肉拳骨骼原点。所有滑动条调整均以毫秒级即时同步至游戏。
            </span>
          </div>
        )}

        {/* Main Content: Left Preview Grid, Right Sliders & Layering */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3.5 overflow-y-auto max-h-[calc(96vh-170px)] max-h-[calc(96dvh-170px)] pr-1">
          {/* Left Column (5 cols): Canvas Preview & Quick Presets */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <WeaponSocketCanvasPreview config={config} player={player} />
            <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-2.5">
              <SpineWeaponQuickPresets config={config} onUpdate={handleUpdate} />
            </div>
          </div>

          {/* Right Column (7 cols): Sliders, Hand Select & Layering */}
          <div className="md:col-span-7 flex flex-col gap-3">
            {/* Hand Selection & Display Toggle */}
            <div className="flex items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-900/70 p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-300 font-medium">装配肢位:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdate({ weaponHand: 'right' })}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                      (config.weaponHand || 'right') === 'right'
                        ? 'border border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    主手 (右手/前臂)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate({ weaponHand: 'left' })}
                    className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                      config.weaponHand === 'left'
                        ? 'border border-cyan-500 bg-cyan-500/20 text-cyan-300'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    副手 (左手/后臂)
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.showWeaponOverlay}
                  onChange={(e) => handleUpdate({ showWeaponOverlay: e.target.checked })}
                  className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-0"
                />
                <span>开启武器显示</span>
              </label>
            </div>

            {/* Sub-Tabs: Transform vs Layer */}
            <div className="flex items-center gap-1 border-b border-stone-800/80 pb-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('transform')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  activeTab === 'transform'
                    ? 'border border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                1. X/Y 位移与旋转调整
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('layer')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  activeTab === 'layer'
                    ? 'border border-amber-500/50 bg-amber-500/20 text-amber-300'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                2. 渲染层级与深度 (Z-Index)
              </button>
            </div>

            {/* Tab 1: Position, Rotation, Scale, Flips */}
            {activeTab === 'transform' && (
              <div className="rounded-xl border border-stone-800/80 bg-stone-900/50 p-2.5">
                <SpineWeaponPositionControl
                  config={config}
                  onUpdate={handleUpdate}
                  onAutoCalibrate={handleAutoCalibrateToHandBone}
                  handBoneInfo={{
                    x: handBoneInfo.boneX,
                    y: handBoneInfo.boneY,
                    name: handBoneInfo.slotName,
                  }}
                />
              </div>
            )}

            {/* Tab 2: Layer Presets & Fine Z-Index */}
            {activeTab === 'layer' && (
              <div className="rounded-xl border border-stone-800/80 bg-stone-900/50 p-2.5">
                <SpineWeaponLayerControl config={config} onUpdate={handleUpdate} />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-stone-800 pt-2.5">
          <div className="flex items-center gap-2 text-[11px] text-stone-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>当前手骨中心: {handBoneInfo.slotName} (X: {handBoneInfo.boneX}, Y: {handBoneInfo.boneY})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCalibrateToHandBone}
              className="flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-800 hover:text-amber-300 transition-colors"
            >
              <Target className="h-3.5 w-3.5" />
              <span>自动校准至手骨</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-amber-500 bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-1.5 text-xs font-bold text-stone-950 hover:brightness-110 shadow"
            >
              保存并完成调校
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
