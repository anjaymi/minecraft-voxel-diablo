import React from 'react';
import { SpinePuppetConfig, WeaponLayerPreset } from '../../../engine/skin/spineTypes';
import { Layers, Shield, Sword, Eye, Sparkles } from 'lucide-react';

interface SpineWeaponLayerControlProps {
  config: SpinePuppetConfig;
  onUpdate: (partial: Partial<SpinePuppetConfig>) => void;
}

interface LayerPresetItem {
  key: WeaponLayerPreset;
  title: string;
  zIndex: number;
  desc: string;
  icon: string;
}

const LAYER_PRESETS: LayerPresetItem[] = [
  {
    key: 'front',
    title: '身前顶层',
    zIndex: 100,
    desc: '最顶层呈现，不被头或任何肢体遮挡 (双手巨剑/大盾)',
    icon: '🛡️',
  },
  {
    key: 'over_hand',
    title: '掌前握持',
    zIndex: 65,
    desc: '握在主手掌前，标准自然握持状态 (单手剑/魔杖)',
    icon: '⚔️',
  },
  {
    key: 'behind_arm',
    title: '臂后内侧',
    zIndex: 35,
    desc: '夹在小臂内侧与胸腔之间 (反手匕首/暗器/拳刃)',
    icon: '🗡️',
  },
  {
    key: 'behind_body',
    title: '背负身后',
    zIndex: 5,
    desc: '身躯最底层，刀剑入鞘背在背后 (行囊/背部佩剑)',
    icon: '🎒',
  },
];

const BODY_SLOT_LEVELS = [
  { name: '背后(5)', z: 5 },
  { name: '后臂(10)', z: 10 },
  { name: '后腿(20)', z: 20 },
  { name: '躯干(30)', z: 30 },
  { name: '前腿(40)', z: 40 },
  { name: '头部(50)', z: 50 },
  { name: '主手(60)', z: 60 },
  { name: '身前(100)', z: 100 },
];

export const SpineWeaponLayerControl: React.FC<SpineWeaponLayerControlProps> = ({
  config,
  onUpdate,
}) => {
  const isLeftHand = config.weaponHand === 'left';
  const holdingArmZ = isLeftHand ? 10 : 60;

  // Resolve current effective zIndex
  let currentZ = config.weaponZIndex;
  if (currentZ === undefined) {
    const p = config.weaponLayerPreset || 'over_hand';
    if (p === 'front') currentZ = 100;
    else if (p === 'behind_body') currentZ = 5;
    else if (p === 'behind_arm') currentZ = holdingArmZ - 2;
    else currentZ = holdingArmZ + 5;
  }

  const activePreset = config.weaponLayerPreset || (
    currentZ >= 90 ? 'front' :
    currentZ <= 8 ? 'behind_body' :
    currentZ < holdingArmZ ? 'behind_arm' : 'over_hand'
  );

  return (
    <div className="flex flex-col gap-3">
      {/* 4 Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {LAYER_PRESETS.map((item) => {
          const isSelected = activePreset === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onUpdate({
                  weaponLayerPreset: item.key,
                  weaponZIndex: item.zIndex,
                });
              }}
              className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/40 shadow-sm ring-1 ring-amber-400/40'
                  : 'border-stone-800 bg-stone-950/50 hover:border-stone-700 hover:bg-stone-900/60'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-sm">{item.icon}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-stone-500 bg-stone-900'
                }`}>
                  Z: {item.zIndex}
                </span>
              </div>
              <span className={`text-xs font-bold ${isSelected ? 'text-amber-200' : 'text-stone-300'}`}>
                {item.title}
              </span>
              <span className="text-[10px] text-stone-400 leading-tight">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fine Z-Index Slider & Body Benchmark */}
      <div className="flex flex-col gap-2 rounded-xl border border-stone-800/80 bg-stone-950/60 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium text-stone-300">
            <Layers className="h-3.5 w-3.5 text-amber-400" />
            <span>自定义渲染深度层级 (Z-Index):</span>
          </span>
          <span className="font-mono text-xs font-bold text-amber-300">
            层级 Z: {currentZ}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={currentZ}
          onChange={(e) => {
            const z = parseInt(e.target.value, 10);
            onUpdate({
              weaponZIndex: z,
              weaponLayerPreset: 'custom',
            });
          }}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-stone-800 accent-amber-500"
        />

        {/* Anatomical Z-Index benchmark markers */}
        <div className="flex flex-col gap-1 pt-1 border-t border-stone-800/60">
          <div className="flex justify-between text-[9px] text-stone-500 font-mono">
            <span>← 最底层 (背负身后)</span>
            <span>最顶层 (身前覆面) →</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {BODY_SLOT_LEVELS.map((slot) => {
              const isAround = Math.abs(currentZ - slot.z) <= 3;
              return (
                <button
                  key={slot.name}
                  type="button"
                  onClick={() =>
                    onUpdate({
                      weaponZIndex: slot.z,
                      weaponLayerPreset: 'custom',
                    })
                  }
                  className={`rounded px-1.5 py-0.5 text-[9px] font-mono transition-colors ${
                    isAround
                      ? 'border border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                      : 'border border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {slot.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
