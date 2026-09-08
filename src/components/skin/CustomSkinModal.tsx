import React, { useState, useEffect } from 'react';
import { X, Palette, RefreshCw, Layers, Image as ImageIcon, Smile, Shield, Footprints, Sparkles, Target, Package, FileCode, Compass, Crosshair } from 'lucide-react';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpinePreviewCanvas } from './SpinePreviewCanvas';
import { SpineOrientationSettingsPanel } from './SpineOrientationSettingsPanel';
import { HeadPartTab } from './HeadPartTab';
import { TorsoPartTab } from './TorsoPartTab';
import { LimbsPartTab } from './LimbsPartTab';
import { PresetsPartTab } from './PresetsPartTab';
import { SpineAnchorEditor } from './SpineAnchorEditor';
import { SpineExportPanel } from './SpineExportPanel';
import { SpinePsdImporterPanel } from './psd/SpinePsdImporterPanel';
import { SpineWeaponSocketPanel } from './psd/SpineWeaponSocketPanel';
import { SkinDropZone } from './SkinDropZone';
import { SkinPreviewAndTune } from './SkinPreviewAndTune';
import { SkinPresetSelector } from './SkinPresetSelector';

interface CustomSkinModalProps {
  onClose: () => void;
  onOpenWeaponModal?: () => void;
}

type ModalTabKey = 'head' | 'torso' | 'limbs' | 'weapon' | 'orientation' | 'anchor' | 'psd' | 'export' | 'presets' | 'fullbody';

export const CustomSkinModal: React.FC<CustomSkinModalProps> = ({ onClose, onOpenWeaponModal }) => {
  const [activeTab, setActiveTab] = useState<ModalTabKey>('head');
  const [activeMode, setActiveMode] = useState<'default' | 'spine' | 'fullbody'>(
    customSkinManager.getActiveMode()
  );
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = customSkinManager.subscribe(() => {
      setActiveMode(customSkinManager.getActiveMode());
      setTick((t) => t + 1);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      unsub();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSwitchTab = (tab: ModalTabKey) => {
    setActiveTab(tab);
    if (tab === 'fullbody') {
      customSkinManager.setActiveMode('fullbody');
    } else {
      customSkinManager.setActiveMode('spine');
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleApplySpineToGame = () => {
    customSkinManager.setActiveMode('spine');
    showToast('✨ Spine 骨骼装配已成功应用至游戏角色！');
    setTick((t) => t + 1);
  };

  const handleApplyFullbodyToGame = () => {
    customSkinManager.setActiveMode('fullbody');
    showToast('✨ 单张立绘外观已成功应用至游戏角色！');
    setTick((t) => t + 1);
  };

  const handleResetToDefault = () => {
    customSkinManager.resetToDefault();
    showToast('🔄 已恢复为原版黏土手办外观');
    setTick((t) => t + 1);
  };

  const handleRefresh = () => {
    setTick((t) => t + 1);
    showToast('✅ 外观部件已更新并即时同步生效！');
  };

  const spineConfig = customSkinManager.getSpinePuppet();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl border-2 border-amber-600/60 bg-stone-950 p-4 sm:p-6 text-stone-200 shadow-[0_16px_40px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-emerald-500/80 bg-emerald-950/95 px-4 py-1.5 text-xs font-bold text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.5)] transition-all animate-bounce">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-950/60 text-amber-400 shadow">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-cinzel text-amber-400 tracking-wide">
                Spine 骨骼拆分与外观装配工坊
              </h2>
              <p className="text-xs text-stone-400">
                支持【头部 / 身体 / 四肢】独立上传 PNG 素材，上传自动边缘裁剪与尺寸规范化，实时骨骼动画合成
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-700 bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Real-time Activation Status & One-Click Apply Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 bg-stone-900/90 border border-stone-800 rounded-xl px-3.5 py-2 mt-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium">当前游戏外观：</span>
            {activeMode === 'spine' ? (
              <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/50 bg-emerald-950/70 px-2.5 py-1 text-xs font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                🟢 Spine 骨骼装配生效中 (已同步至游戏)
              </span>
            ) : activeMode === 'fullbody' ? (
              <span className="flex items-center gap-1.5 rounded-md border border-cyan-500/50 bg-cyan-950/70 px-2.5 py-1 text-xs font-bold text-cyan-300">
                🟢 单张立绘生效中 (已同步至游戏)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-md border border-stone-700 bg-stone-800 px-2.5 py-1 text-xs font-semibold text-stone-400">
                ⚪ 原版手办外观 (未应用自定义装配)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'fullbody' ? (
              <button
                onClick={handleApplyFullbodyToGame}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500 bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow hover:brightness-110 active:scale-95 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>立即应用立绘到角色</span>
              </button>
            ) : (
              <button
                onClick={handleApplySpineToGame}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-gradient-to-r from-amber-600 to-orange-600 px-3.5 py-1 text-xs font-bold text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition-all"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>立即应用骨骼装配到游戏角色</span>
              </button>
            )}

            <button
              onClick={handleResetToDefault}
              className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-900/80 px-2.5 py-1 text-xs text-stone-400 hover:border-amber-500/60 hover:text-amber-300 transition-colors"
              title="清除所有自定义部件并还原为默认黏土小人"
            >
              <RefreshCw className="h-3 w-3" />
              <span>还原默认</span>
            </button>
          </div>
        </div>

        {/* Top Multi-Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between border-b border-stone-800/80 pt-3 pb-2 gap-2">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleSwitchTab('head')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'head'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smile className="h-3.5 w-3.5 text-amber-400" />
              <span>👤 头部 (Head)</span>
            </button>

            <button
              onClick={() => handleSwitchTab('torso')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'torso'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-blue-400" />
              <span>👕 身体 (Torso)</span>
            </button>

            <button
              onClick={() => handleSwitchTab('limbs')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'limbs'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Footprints className="h-3.5 w-3.5 text-emerald-400" />
              <span>🦾 四肢 (Limbs)</span>
            </button>

            <button
              onClick={() => handleSwitchTab('weapon')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'weapon'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Crosshair className="h-3.5 w-3.5 text-amber-400" />
              <span>⚔️ 武器挂点</span>
            </button>

            <button
              onClick={() => handleSwitchTab('orientation')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'orientation'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-amber-400" />
              <span>🧭 素体朝向</span>
            </button>

            <button
              onClick={() => handleSwitchTab('anchor')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'anchor'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Target className="h-3.5 w-3.5 text-amber-400" />
              <span>⚓ 骨骼锚点</span>
            </button>

            <button
              onClick={() => handleSwitchTab('psd')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'psd'
                  ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              <span>🎨 PSD 骨骼导入</span>
            </button>

            <button
              onClick={() => handleSwitchTab('export')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'export'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Package className="h-3.5 w-3.5 text-cyan-400" />
              <span>📦 规范导出</span>
            </button>

            <button
              onClick={() => handleSwitchTab('presets')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'presets'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>🎨 套装预设</span>
            </button>

            <button
              onClick={() => handleSwitchTab('fullbody')}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'fullbody'
                  ? 'border-amber-400 bg-amber-950/70 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                  : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-stone-200'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5 text-rose-400" />
              <span>🖼️ 单张立绘模式</span>
            </button>
          </div>

          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-900/80 px-2.5 py-1.5 text-xs text-stone-400 hover:border-amber-500/60 hover:text-amber-300 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>还原默认外观</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex flex-col gap-4 overflow-y-auto pr-1 py-3">
          {/* Always Visible Top Real-time Composite Spine Preview */}
          {activeTab !== 'fullbody' && (
            <SpinePreviewCanvas config={spineConfig} onUpdate={handleRefresh} />
          )}

          {/* Active Tab Panel Content */}
          {activeTab === 'head' && <HeadPartTab onUpdate={handleRefresh} />}
          {activeTab === 'torso' && <TorsoPartTab onUpdate={handleRefresh} />}
          {activeTab === 'limbs' && <LimbsPartTab onUpdate={handleRefresh} />}
          {activeTab === 'weapon' && (
            <div className="flex flex-col gap-3">
              {onOpenWeaponModal && (
                <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 shadow-inner">
                  <div>
                    <h4 className="text-xs font-bold text-amber-300">需要更大画布与网格精确对齐？</h4>
                    <p className="text-[11px] text-stone-400">打开带有手部骨骼准星与动态微距标尺的专用调校弹窗</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenWeaponModal}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30 active:scale-95 transition-all"
                  >
                    <Crosshair className="h-3.5 w-3.5 text-amber-400" />
                    <span>打开独立网格调校器</span>
                  </button>
                </div>
              )}
              <SpineWeaponSocketPanel config={spineConfig} onUpdate={handleRefresh} />
            </div>
          )}
          {activeTab === 'orientation' && (
            <SpineOrientationSettingsPanel config={spineConfig} onUpdate={handleRefresh} />
          )}
          {activeTab === 'anchor' && (
            <SpineAnchorEditor
              onUpdate={handleRefresh}
              onSwitchToPsd={() => handleSwitchTab('psd')}
            />
          )}
          {activeTab === 'psd' && <SpinePsdImporterPanel onApplied={handleRefresh} />}
          {activeTab === 'export' && <SpineExportPanel />}
          {activeTab === 'presets' && <PresetsPartTab onUpdate={handleRefresh} />}

          {activeTab === 'fullbody' && (
            <div className="flex flex-col gap-4">
              <SkinPreviewAndTune
                skin={customSkinManager.getSkin()}
                onUpdate={handleRefresh}
              />
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>上传单张透明 PNG 立绘</span>
                  </span>
                </div>
                <SkinDropZone onSuccess={handleRefresh} />
              </div>
              <SkinPresetSelector
                currentSkin={customSkinManager.getSkin()}
                onSelect={handleRefresh}
              />
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="mt-auto flex flex-wrap items-center justify-between border-t border-stone-800 pt-3 text-xs text-stone-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[11px] text-amber-300">
              按键 P
            </span>
            <span>随时开关工坊 · 当前状态:</span>
            <span className="font-mono text-amber-300 font-bold">
              {activeMode === 'spine'
                ? '🦴 Spine 骨骼层级定制生效'
                : activeMode === 'fullbody'
                ? '🖼️ 单张立绘生效'
                : '🧸 默认萌系角色'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-gradient-to-b from-amber-600 to-amber-700 px-5 py-1.5 font-bold text-stone-950 shadow hover:from-amber-500 hover:to-amber-600 active:scale-95 transition-all"
          >
            完成装配进入地牢
          </button>
        </div>
      </div>
    </div>
  );
};
