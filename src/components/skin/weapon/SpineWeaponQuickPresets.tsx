import React from 'react';
import { SpinePuppetConfig, WeaponLayerPreset } from '../../../engine/skin/spineTypes';
import { Sparkles, Sword, Shield, Zap } from 'lucide-react';

interface SpineWeaponQuickPresetsProps {
  config: SpinePuppetConfig;
  onUpdate: (partial: Partial<SpinePuppetConfig>) => void;
}

interface QuickWeaponPreset {
  id: string;
  name: string;
  icon: string;
  x: number;
  y: number;
  rot: number;
  scale: number;
  layer: WeaponLayerPreset;
  zIndex: number;
  flipX?: boolean;
}

const PRESETS: QuickWeaponPreset[] = [
  {
    id: 'standard_grip',
    name: '掌心正握',
    icon: '⚔️',
    x: 0,
    y: 0,
    rot: 0,
    scale: 1.0,
    layer: 'over_hand',
    zIndex: 65,
  },
  {
    id: 'berserk_greatsword',
    name: '狂战大剑',
    icon: '🗡️',
    x: 2,
    y: -2,
    rot: 20,
    scale: 1.3,
    layer: 'front',
    zIndex: 100,
  },
  {
    id: 'back_sheath',
    name: '背负长剑',
    icon: '🎒',
    x: -4,
    y: 6,
    rot: -45,
    scale: 0.95,
    layer: 'behind_body',
    zIndex: 5,
  },
  {
    id: 'assassin_reverse',
    name: '刺客反刃',
    icon: '🥷',
    x: -2,
    y: 1,
    rot: -75,
    scale: 0.9,
    layer: 'behind_arm',
    zIndex: 35,
  },
  {
    id: 'combat_tilt',
    name: '战斗微倾',
    icon: '⚡',
    x: 1,
    y: -1,
    rot: 15,
    scale: 1.0,
    layer: 'over_hand',
    zIndex: 65,
  },
];

export const SpineWeaponQuickPresets: React.FC<SpineWeaponQuickPresetsProps> = ({
  config,
  onUpdate,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] text-stone-400">
        <span className="flex items-center gap-1 font-semibold">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>一键装配常用姿态预设:</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {PRESETS.map((p) => {
          const isMatched =
            (config.weaponOffsetX ?? 0) === p.x &&
            (config.weaponOffsetY ?? 0) === p.y &&
            (config.weaponRotationDeg ?? 0) === p.rot &&
            config.weaponLayerPreset === p.layer;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onUpdate({
                  weaponOffsetX: p.x,
                  weaponOffsetY: p.y,
                  weaponRotationDeg: p.rot,
                  weaponScale: p.scale,
                  weaponLayerPreset: p.layer,
                  weaponZIndex: p.zIndex,
                  weaponFlipX: p.flipX || false,
                  showWeaponOverlay: true,
                });
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-all ${
                isMatched
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                  : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
