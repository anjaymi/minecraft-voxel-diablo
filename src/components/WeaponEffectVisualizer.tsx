import React from 'react';
import { Item, CharacterClassId } from '../types';
import { calculateDynamicWeaponStats } from '../engine/weaponBaseConfig';
import { Sparkles, Zap, Flame, Crosshair, ShieldAlert } from 'lucide-react';

interface WeaponEffectVisualizerProps {
  weapon: Item | null;
  classId: CharacterClassId;
  compact?: boolean;
}

export const WeaponEffectVisualizer: React.FC<WeaponEffectVisualizerProps> = ({
  weapon,
  classId,
  compact = false,
}) => {
  if (!weapon || weapon.slot !== 'weapon') return null;

  const stats = calculateDynamicWeaponStats(weapon, classId);
  const glowColor = stats.vfx.glowColor;
  const glowOpacity = Math.max(0.3, Math.min(1.0, stats.vfx.glowIntensity));

  return (
    <div
      className={`rounded-lg border border-stone-800 bg-stone-950/90 ${
        compact ? 'p-2' : 'p-3'
      } flex flex-col gap-2 relative overflow-hidden transition-all`}
      style={{
        boxShadow: `0 0 16px ${glowColor}${Math.round(glowOpacity * 50).toString(16).padStart(2, '0')}`,
      }}
    >
      {/* Dynamic Background Aura Glow */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-40 transition-opacity"
        style={{ backgroundColor: glowColor }}
      />

      {/* Header: Effect Name & Archetype */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" style={{ color: glowColor }} />
          <span className="text-xs font-bold text-stone-200">
            {stats.vfx.effectName}
          </span>
        </div>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border"
          style={{
            borderColor: `${glowColor}66`,
            color: glowColor,
            backgroundColor: `${glowColor}1a`,
          }}
        >
          {stats.vfx.archetypeDesc.split(' ')[0]}
        </span>
      </div>

      {/* Weapon Appearance Description (if present) */}
      {weapon.appearanceDesc && !compact && (
        <div className="text-[11px] text-stone-400 italic leading-snug border-l-2 pl-2 border-stone-700">
          “{weapon.appearanceDesc}”
        </div>
      )}

      {/* Visual Indicator Meters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 z-10 text-[10px] font-mono">
        {/* Speed Rating */}
        <div className="rounded border border-stone-800 bg-stone-900/90 p-1.5 flex flex-col">
          <span className="text-stone-500 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400" />
            攻速评级
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`font-black text-xs ${
                stats.speedRating === 'S'
                  ? 'text-cyan-400'
                  : stats.speedRating === 'A'
                  ? 'text-emerald-400'
                  : stats.speedRating === 'B'
                  ? 'text-amber-400'
                  : 'text-stone-400'
              }`}
            >
              {stats.speedRating} 级
            </span>
            <span className="text-stone-400 text-[9px]">({stats.effectiveAttackSpeed}/s)</span>
          </div>
        </div>

        {/* Range & Arc */}
        <div className="rounded border border-stone-800 bg-stone-900/90 p-1.5 flex flex-col">
          <span className="text-stone-500 flex items-center gap-1">
            <Crosshair className="h-3 w-3 text-blue-400" />
            判定范围
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-bold text-stone-200 text-xs">
              {stats.effectiveRange}m
            </span>
            <span className="text-stone-400 text-[9px]">
              {stats.effectiveArcDeg > 0 ? `${stats.effectiveArcDeg}°扇面` : '直线弹道'}
            </span>
          </div>
        </div>

        {/* Crit Rate */}
        <div className="rounded border border-stone-800 bg-stone-900/90 p-1.5 flex flex-col">
          <span className="text-stone-500 flex items-center gap-1">
            <Flame className="h-3 w-3 text-red-400" />
            暴击加成
          </span>
          <span className="font-bold text-yellow-300 text-xs mt-0.5">
            {Math.round(stats.effectiveCritChance * 100)}%
          </span>
        </div>

        {/* Knockback */}
        <div className="rounded border border-stone-800 bg-stone-900/90 p-1.5 flex flex-col">
          <span className="text-stone-500 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 text-purple-400" />
            击退力度
          </span>
          <span className="font-bold text-purple-300 text-xs mt-0.5">
            {stats.effectiveKnockback} N
          </span>
        </div>
      </div>

      {/* Class Synergy Banner */}
      <div
        className={`rounded px-2 py-1 text-[10px] font-semibold flex items-center justify-between border ${
          stats.classSynergy
            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
            : 'border-stone-800 bg-stone-900/50 text-stone-400'
        }`}
      >
        <span>{stats.synergyBonusText}</span>
        {stats.classSynergy && (
          <span className="font-bold text-emerald-400 text-[9px] bg-emerald-900/50 px-1 py-0.2 rounded">
            契合激活
          </span>
        )}
      </div>
    </div>
  );
};
