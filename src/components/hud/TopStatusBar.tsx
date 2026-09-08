import React from 'react';
import { Player, Enemy } from '../../types';
import { classSystem } from '../../engine/classSystem';
import { Compass, Sparkles, BrainCircuit } from 'lucide-react';
import { MinionStatusPanel } from './MinionStatusPanel';

interface TopStatusBarProps {
  player: Player;
  boss: Enemy | undefined;
  zoneName: string;
  totalKills: number;
  onOpenSkillTree?: () => void;
  onOpenClassSelect?: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  player,
  boss,
  zoneName,
  totalKills,
  onOpenSkillTree,
  onOpenClassSelect,
}) => {
  const currentClassDef = classSystem.getClass(player.characterClass || 'warrior');

  return (
    <div className="flex items-start justify-between pl-[96px] pr-[210px]">
      {/* Dungeon info & Currencies */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-lg border-2 border-stone-700 bg-stone-900/85 px-4 py-2 text-stone-200 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Compass className="h-5 w-5 text-amber-500" />
            <span
              className="text-sm tracking-wide max-w-[220px] truncate"
              title={zoneName}
            >
              {zoneName.replace(/\s*\([^)]*\)\s*$/, '')}
            </span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="text-base">💎</span>
            <span>{player.stats.emeralds} 绿宝石</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1 text-red-400 text-xs font-mono">
            <span>击杀: {totalKills}</span>
          </div>
          <div className="h-4 w-px bg-stone-700" />
          <div
            className="flex items-center gap-1.5 text-xs font-bold"
            style={{ color: currentClassDef.themeColor }}
          >
            <span>{currentClassDef.icon}</span>
            <span>{currentClassDef.name}</span>
          </div>
        </div>

        {/* Active Enchantments Pill List */}
        {player.enchantments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-w-md">
            {player.enchantments.map((ench) => (
              <div
                key={ench.id}
                className="flex items-center gap-1 rounded border border-purple-500/40 bg-purple-950/70 px-2 py-0.5 text-xs text-purple-200 shadow"
              >
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span>{ench.name}</span>
                {ench.count > 1 && <span className="text-amber-400 font-bold">x{ench.count}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Active Buffs Pill */}
        {player.goldenAppleTimer && player.goldenAppleTimer > 0 ? (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-950/80 px-2.5 py-1 text-xs text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse max-w-fit">
            <span>✨</span>
            <span className="font-bold">金苹果神佑 (Divine Aegis)</span>
            <span className="font-mono text-amber-400 font-bold">{player.goldenAppleTimer.toFixed(1)}s</span>
          </div>
        ) : null}

        {/* Minion Status Panel for Summoner / Druid active companions */}
        <MinionStatusPanel player={player} />
      </div>

      {/* Top Center: Boss Health Bar */}
      {boss && (
        <div className="flex flex-col items-center w-80 md:w-96 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-500 font-black text-sm tracking-wider uppercase font-cinzel text-shadow">
              💀 {boss.name}
            </span>
            <span className="text-xs text-stone-400">
              ({boss.hp}/{boss.maxHp})
            </span>
          </div>
          <div className="w-full h-4 bg-stone-950/90 rounded-full border-2 border-red-900 overflow-hidden shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 transition-all duration-150"
              style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {/* Top Right Quick Controls（技能/转职常驻，其余收纳进设置面板） */}
      <div className="pointer-events-auto flex items-center gap-2">
        {onOpenSkillTree && (
          <button
            onClick={onOpenSkillTree}
            className="flex items-center gap-1.5 rounded-lg border-2 border-indigo-600/80 bg-gradient-to-b from-indigo-900/90 to-stone-950 px-3 py-2 text-xs font-bold text-indigo-200 shadow-lg hover:from-indigo-800 hover:to-stone-900 active:scale-95 transition-all"
            title="技能树 (Skill Tree)"
          >
            <BrainCircuit className="h-4 w-4 text-indigo-400" />
            <span className="hidden lg:inline">技能 (T)</span>
          </button>
        )}
        {onOpenClassSelect && (
          <button
            onClick={onOpenClassSelect}
            className="flex items-center gap-1.5 rounded-lg border-2 border-purple-600/80 bg-gradient-to-b from-purple-900/90 to-stone-950 px-3 py-2 text-xs font-bold text-purple-200 shadow-lg hover:from-purple-800 hover:to-stone-900 active:scale-95 transition-all"
            title="切换专精职业 (Hero Class Sanctuary)"
          >
            <span>{currentClassDef.icon}</span>
            <span className="hidden lg:inline">转职 (C)</span>
          </button>
        )}
      </div>
    </div>
  );
};
