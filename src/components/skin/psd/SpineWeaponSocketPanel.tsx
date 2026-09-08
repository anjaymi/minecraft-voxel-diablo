import React, { useState } from 'react';
import { SpinePuppetConfig } from '../../../engine/skin/spineTypes';
import { customSkinManager } from '../../../engine/skin/CustomSkinManager';
import { SpineWeaponPositionControl } from '../weapon/SpineWeaponPositionControl';
import { SpineWeaponLayerControl } from '../weapon/SpineWeaponLayerControl';
import { SpineWeaponQuickPresets } from '../weapon/SpineWeaponQuickPresets';
import { Sword, RotateCcw, Move, Layers, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

interface SpineWeaponSocketPanelProps {
  config: SpinePuppetConfig;
  onUpdate: () => void;
}

type TabType = 'position' | 'layer' | 'presets';

export const SpineWeaponSocketPanel: React.FC<SpineWeaponSocketPanelProps> = ({
  config,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('position');

  const handleUpdate = (partial: Partial<SpinePuppetConfig>) => {
    customSkinManager.updateSpineOverall(partial);
    onUpdate();
  };

  const handleReset = () => {
    handleUpdate({
      weaponOffsetX: 0,
      weaponOffsetY: 0,
      weaponRotationDeg: 0,
      weaponScale: 1.0,
      weaponFlipX: false,
      weaponFlipY: false,
      weaponLayerPreset: 'over_hand',
      weaponZIndex: (config.weaponHand === 'left' ? 10 : 60) + 5,
    });
  };

  const isLeft = config.weaponHand === 'left';
  const layerPresetName =
    config.weaponLayerPreset === 'front' ? '身前顶层' :
    config.weaponLayerPreset === 'behind_body' ? '背负身后' :
    config.weaponLayerPreset === 'behind_arm' ? '臂后内侧' :
    config.weaponLayerPreset === 'custom' ? `自定义 Z:${config.weaponZIndex}` : '掌前握持';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/80 p-3.5 shadow-lg backdrop-blur-sm">
      {/* Header & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Sword className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-amber-300 font-cinzel">
            武器装配系统 (Weapon Positioning & Layering)
          </span>
          <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded font-mono">
            {isLeft ? '副手' : '主手'} · {layerPresetName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-stone-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showWeaponOverlay}
              onChange={(e) => handleUpdate({ showWeaponOverlay: e.target.checked })}
              className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-0"
            />
            <span>开启武器显示</span>
          </label>

          <button
            type="button"
            onClick={handleReset}
            title="一键精准吸附至手掌肉拳骨骼掌心点 (0, 0) 并恢复标准握持层级"
            className="flex items-center gap-1 rounded border border-amber-600/60 bg-amber-950/40 px-2 py-1 text-[11px] text-amber-200 transition-colors hover:bg-amber-900/60 hover:text-white"
          >
            <RotateCcw className="h-3 w-3" />
            <span>吸附手心归零</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 rounded bg-stone-800 px-2 py-1 text-xs text-stone-300 hover:bg-stone-700"
          >
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          {/* Hand Choice: Right vs Left */}
          <div className="flex items-center justify-between gap-2 bg-stone-950/40 px-2.5 py-1.5 rounded-lg border border-stone-800/60">
            <span className="text-[11px] text-stone-300 font-medium">持握手肢位:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleUpdate({ weaponHand: 'right' })}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
                  (config.weaponHand || 'right') === 'right'
                    ? 'border border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm'
                    : 'border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                主手 (右手/前臂)
              </button>
              <button
                type="button"
                onClick={() => handleUpdate({ weaponHand: 'left' })}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
                  config.weaponHand === 'left'
                    ? 'border border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-sm'
                    : 'border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
                }`}
              >
                副手 (左手/后臂)
              </button>
            </div>
          </div>

          {/* Sub-navigation Tabs: Position vs Layer vs Presets */}
          <div className="flex items-center gap-1 border-b border-stone-800/60 pb-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('position')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'position'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Move className="h-3 w-3" />
              <span>位置与旋转调整</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('layer')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'layer'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>层级与深度调整</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                activeTab === 'presets'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              <span>常用姿态预设</span>
            </button>
          </div>

          {/* Tab Panels */}
          {activeTab === 'position' && (
            <SpineWeaponPositionControl config={config} onUpdate={handleUpdate} />
          )}

          {activeTab === 'layer' && (
            <SpineWeaponLayerControl config={config} onUpdate={handleUpdate} />
          )}

          {activeTab === 'presets' && (
            <SpineWeaponQuickPresets config={config} onUpdate={handleUpdate} />
          )}
        </>
      )}
    </div>
  );
};
