import React from 'react';
import { Player } from '../../types';
import { calculateDynamicWeaponStats } from '../../engine/weaponBaseConfig';
import { Zap, Crosshair, Flame, Sparkles } from 'lucide-react';

interface CombatFeedbackBarProps {
  player: Player;
}

export const CombatFeedbackBar: React.FC<CombatFeedbackBarProps> = ({ player }) => {
  const classId = player.characterClass || 'warrior';
  const stats = calculateDynamicWeaponStats(player.equipment.weapon, classId, player.stats);

  const glowColor = stats.vfx.glowColor;

  return (
    <div
      className="pointer-events-auto flex items-center justify-between gap-3 px-3 py-1 rounded-full border border-stone-800 bg-stone-950/85 backdrop-blur-md shadow-lg text-stone-200 text-[10px] font-mono mb-1 transition-all"
      style={{
        boxShadow: `0 0 12px ${glowColor}33`,
        borderColor: `${glowColor}55`,
      }}
    >
      {/* Weapon Name & VFX Pill */}
      <div className="flex items-center gap-1.5 truncate max-w-[170px]">
        <Sparkles className="h-3 w-3 shrink-0" style={{ color: glowColor }} />
        <span className="font-bold text-amber-300 truncate">{stats.name}</span>
        <span
          className="text-[9px] px-1 py-0.2 rounded font-bold border shrink-0"
          style={{
            borderColor: `${glowColor}66`,
            color: glowColor,
            backgroundColor: `${glowColor}1a`,
          }}
        >
          {stats.vfx.effectName}
        </span>
      </div>

      <div className="h-3 w-px bg-stone-800 shrink-0" />

      {/* Metrics Feed */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Attack Damage */}
        <span className="flex items-center gap-0.5 text-stone-300">
          <span className="text-amber-400 font-bold">⚔️</span>
          <span className="font-bold text-amber-300">{stats.estimatedDamage}</span>
        </span>

        {/* Attack Speed & Rating */}
        <span className="flex items-center gap-0.5">
          <Zap className="h-3 w-3 text-amber-400" />
          <span
            className={`font-black ${
              stats.speedRating === 'S'
                ? 'text-cyan-400'
                : stats.speedRating === 'A'
                ? 'text-emerald-400'
                : stats.speedRating === 'B'
                ? 'text-amber-400'
                : 'text-stone-400'
            }`}
          >
            {stats.speedRating}级
          </span>
          <span className="text-stone-400 text-[9px]">({stats.effectiveAttackSpeed}/s)</span>
        </span>

        {/* Range / Arc */}
        <span className="flex items-center gap-0.5 text-stone-300">
          <Crosshair className="h-3 w-3 text-blue-400" />
          <span className="font-bold">{stats.effectiveRange}m</span>
          <span className="text-stone-400 text-[9px]">
            {stats.effectiveArcDeg > 0 ? `(${stats.effectiveArcDeg}°)` : '(直射)'}
          </span>
        </span>

        {/* Crit Rate */}
        <span className="flex items-center gap-0.5 text-stone-300">
          <Flame className="h-3 w-3 text-red-400" />
          <span className="font-bold text-yellow-300">
            {Math.round(stats.effectiveCritChance * 100)}%
          </span>
        </span>
      </div>
    </div>
  );
};
