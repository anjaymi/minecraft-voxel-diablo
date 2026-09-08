import React, { useState, useEffect } from 'react';
import { GameEngine } from '../engine/gameEngine';
import { WeaponSubType, WeaponSocketPreset } from '../engine/weapons/WeaponSocketTypes';
import { weaponSocketAdapter, DEFAULT_WEAPON_SOCKET_PRESETS } from '../engine/weapons/WeaponSocketAdapter';
import { Sliders, RotateCcw, Crosshair, Sparkles, Check } from 'lucide-react';

interface WeaponSocketConfigSectionProps {
  engine: GameEngine;
}

export const WeaponSocketConfigSection: React.FC<WeaponSocketConfigSectionProps> = ({ engine }) => {
  const currentWeapon = engine.player.equipment?.weapon;
  const initialSubType = ((currentWeapon?.subType as WeaponSubType) || 'sword') as WeaponSubType;

  const [selectedSubType, setSelectedSubType] = useState<WeaponSubType>(initialSubType);
  const [preset, setPreset] = useState<WeaponSocketPreset>(weaponSocketAdapter.getPreset(selectedSubType));
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const unsub = weaponSocketAdapter.subscribe(() => {
      setPreset(weaponSocketAdapter.getPreset(selectedSubType));
    });
    return unsub;
  }, [selectedSubType]);

  const handleUpdate = (field: keyof WeaponSocketPreset, value: number) => {
    weaponSocketAdapter.updatePreset(selectedSubType, { [field]: value });
    setPreset(weaponSocketAdapter.getPreset(selectedSubType));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1200);
  };

  const handleResetCurrent = () => {
    weaponSocketAdapter.resetPreset(selectedSubType);
    setPreset(weaponSocketAdapter.getPreset(selectedSubType));
  };

  const handleResetAll = () => {
    weaponSocketAdapter.resetAllToDefaults();
    setPreset(weaponSocketAdapter.getPreset(selectedSubType));
  };

  const subTypeOptions: { id: WeaponSubType; name: string }[] = [
    { id: 'sword', name: '单手剑 / 佩剑' },
    { id: 'greatsword', name: '双手大剑' },
    { id: 'dagger', name: '刺客匕首' },
    { id: 'axe', name: '狂战战斧' },
    { id: 'hammer', name: '碎骨战锤' },
    { id: 'staff', name: '奥术法杖' },
    { id: 'wand', name: '秘法权杖' },
    { id: 'bow', name: '游侠战弓' },
    { id: 'crossbow', name: '重装战弩' },
  ];

  const angleDeg = (preset.idleAngle * (180 / Math.PI)) % 360;
  const normalizedDeg = angleDeg < 0 ? angleDeg + 360 : angleDeg;

  return (
    <div className="space-y-5 text-stone-200">
      {/* Weapon SubType Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Crosshair className="h-4 w-4" />
            <span>适配武器类型 (Select Weapon to Adjust)</span>
          </label>
          {isSaved && (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 animate-pulse">
              <Check className="h-3 w-3" />
              已实时应用
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 bg-stone-950/50 p-2 rounded-lg border border-stone-800">
          {subTypeOptions.map((opt) => {
            const isEquipped = currentWeapon?.subType === opt.id || (!currentWeapon && opt.id === 'sword');
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setSelectedSubType(opt.id);
                  setPreset(weaponSocketAdapter.getPreset(opt.id));
                }}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition-all relative truncate ${
                  selectedSubType === opt.id
                    ? 'bg-amber-600 text-white shadow font-bold'
                    : 'bg-stone-800/80 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                }`}
              >
                {opt.name}
                {isEquipped && (
                  <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" title="当前角色已装备" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Sliders Panel */}
      <div className="bg-stone-950/40 p-4 rounded-lg border border-stone-800/80 space-y-4">
        {/* Idle Hold Angle */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-stone-300">
              待机持握角度 (Idle Angle - 避脸与垂持姿势)
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {normalizedDeg.toFixed(1)}° ({preset.idleAngle.toFixed(2)} rad)
            </span>
          </div>
          <input
            type="range"
            min={-Math.PI}
            max={Math.PI}
            step={0.05}
            value={preset.idleAngle}
            onChange={(e) => handleUpdate('idleAngle', parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-stone-500 mt-0.5">
            <span>-180° (反向)</span>
            <span className="text-amber-500/80">推荐 135°~150° (后斜下垂持，绝不遮脸)</span>
            <span>+180°</span>
          </div>
        </div>

        {/* Positional Offsets (X & Y) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Offset X */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">水平抓握偏移 X (Hand Offset X)</span>
              <span className="font-mono text-cyan-400">
                {preset.idleOffsetX > 0 ? `+${preset.idleOffsetX.toFixed(1)}` : preset.idleOffsetX.toFixed(1)} px
              </span>
            </div>
            <input
              type="range"
              min={-8.0}
              max={8.0}
              step={0.2}
              value={preset.idleOffsetX}
              onChange={(e) => handleUpdate('idleOffsetX', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Offset Y */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">垂直抓握偏移 Y (Hand Offset Y)</span>
              <span className="font-mono text-cyan-400">
                {preset.idleOffsetY > 0 ? `+${preset.idleOffsetY.toFixed(1)}` : preset.idleOffsetY.toFixed(1)} px
              </span>
            </div>
            <input
              type="range"
              min={-8.0}
              max={8.0}
              step={0.2}
              value={preset.idleOffsetY}
              onChange={(e) => handleUpdate('idleOffsetY', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Visual Scale & Combat Offset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Visual Scale */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">武器显示缩放 (Weapon Scale)</span>
              <span className="font-mono text-indigo-400">{(preset.scale * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.65}
              max={1.45}
              step={0.05}
              value={preset.scale}
              onChange={(e) => handleUpdate('scale', parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* Combat Angle Bias */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-300">挥砍攻击插槽偏角 (Combat Bias)</span>
              <span className="font-mono text-red-400">
                {(preset.combatAngleOffset * (180 / Math.PI)).toFixed(1)}°
              </span>
            </div>
            <input
              type="range"
              min={-0.8}
              max={0.8}
              step={0.05}
              value={preset.combatAngleOffset}
              onChange={(e) => handleUpdate('combatAngleOffset', parseFloat(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
        </div>
      </div>

      {/* Preset Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          onClick={handleResetCurrent}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
          <span>恢复此武器为最佳适配</span>
        </button>

        <button
          onClick={handleResetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-stone-900 border border-stone-800 hover:border-stone-700 text-xs text-stone-400 hover:text-stone-200 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>重置全部武器预设</span>
        </button>
      </div>
    </div>
  );
};
