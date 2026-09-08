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
  /** 触摸设备：显示左上头像+细条（DI 式），与宽度无关 */
  isTouch?: boolean;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  player,
  boss,
  zoneName,
  totalKills,
  onOpenSkillTree,
  onOpenClassSelect,
  isTouch = false,
}) => {
  const currentClassDef = classSystem.getClass(player.characterClass || 'warrior');
  const hpPct = Math.max(0, Math.min(100, (player.stats.hp / player.stats.maxHp) * 100));
  const mpPct = Math.max(0, Math.min(100, (player.stats.mana / player.stats.maxMana) * 100));

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:pl-[96px] sm:pr-[210px]">
      {/* 触摸设备：暗黑不朽式左上头像 + 细血/蓝条（替代底部大血球） */}
      <div className={`items-end gap-2 pointer-events-auto ${isTouch ? 'flex' : 'hidden'}`}>
        <div className="relative">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border-2 bg-stone-950/90 text-2xl shadow-lg"
            style={{ borderColor: currentClassDef.themeColor }}
          >
            {currentClassDef.icon}
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded border border-stone-600 bg-stone-900 font-mono text-[10px] font-black text-amber-300 shadow">
            {player.stats.level}
          </span>
        </div>
        <div className="flex w-36 flex-col gap-1 pb-0.5">
          {/* HP 细条 */}
          <div className="relative h-2.5 overflow-hidden rounded-sm border border-stone-950 bg-stone-950/90 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-red-800 via-red-600 to-rose-500 transition-all duration-200"
              style={{ width: `${hpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-bold text-white/90 drop-shadow-[0_1px_1px_#000]">
              {player.stats.hp} / {player.stats.maxHp}
            </span>
          </div>
          {/* MP 细条 */}
          <div className="relative h-2 overflow-hidden rounded-sm border border-stone-950 bg-stone-950/90 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-800 via-blue-500 to-cyan-400 transition-all duration-200"
              style={{ width: `${mpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dungeon info & Currencies */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 sm:gap-3 rounded-lg border-2 border-stone-700 bg-stone-900/85 px-2.5 sm:px-4 py-1.5 sm:py-2 text-stone-200 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-amber-400">
            <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
            <span
              className="text-[11px] sm:text-sm tracking-wide max-w-[130px] sm:max-w-[220px] truncate"
              title={zoneName}
            >
              {zoneName.replace(/\s*\([^)]*\)\s*$/, '')}
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1 text-emerald-400 font-semibold text-xs sm:text-sm">
            <span>💎</span>
            <span>{player.stats.emeralds}</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-stone-700" />
          <div className="flex items-center gap-1 text-red-400 text-[11px] sm:text-xs font-mono">
            <span>⚔ {totalKills}</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-stone-700" />
          <div
            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold"
            style={{ color: currentClassDef.themeColor }}
          >
            <span>{currentClassDef.icon}</span>
            <span className="hidden sm:inline">{currentClassDef.name}</span>
          </div>
        </div>

        {/* Active Enchantments Pill List */}
        {player.enchantments.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1.5 max-w-md">
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
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-950/80 px-2.5 py-1 text-xs text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.5)] animate-pulse max-w-fit">
            <span>✨</span>
            <span className="font-bold">金苹果神佑 (Divine Aegis)</span>
            <span className="font-mono text-amber-400 font-bold">{player.goldenAppleTimer.toFixed(1)}s</span>
          </div>
        ) : null}

        {/* Minion Status Panel for Summoner / Druid active companions */}
        <div className="hidden sm:block">
          <MinionStatusPanel player={player} />
        </div>
      </div>

      {/* Top Center: Boss Health Bar */}
      {boss && (
        <div className="flex flex-col items-center w-[calc(100%-40px)] sm:w-80 md:w-96 animate-fade-in absolute top-16 left-1/2 -translate-x-1/2 sm:static sm:translate-x-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-500 font-black text-xs sm:text-sm tracking-wider uppercase font-cinzel text-shadow">
              💀 {boss.name}
            </span>
            <span className="text-[10px] sm:text-xs text-stone-400">
              ({boss.hp}/{boss.maxHp})
            </span>
          </div>
          <div className="w-full h-3 sm:h-4 bg-stone-950/90 rounded-full border-2 border-red-900 overflow-hidden shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-red-700 via-red-500 to-amber-500 transition-all duration-150"
              style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>
      )}

      {/* Top Right Quick Controls（技能/转职常驻，其余收纳进设置面板）；触摸设备排在状态行下方避免压住小地图 */}
      <div
        className={`pointer-events-auto flex items-center gap-1.5 ${
          isTouch
            ? 'flex-row'
            : 'absolute right-1 top-[86px] flex-col sm:static sm:right-auto sm:top-auto sm:flex-row sm:gap-2'
        }`}
      >
        {onOpenSkillTree && (
          <button
            onClick={onOpenSkillTree}
            className="touch-btn flex items-center gap-1.5 rounded-lg border-2 border-indigo-600/80 bg-gradient-to-b from-indigo-900/90 to-stone-950 px-2.5 sm:px-3 py-2 text-xs font-bold text-indigo-200 shadow-lg hover:from-indigo-800 hover:to-stone-900 active:scale-95 transition-all"
            title="技能树 (Skill Tree)"
          >
            <BrainCircuit className="h-4 w-4 text-indigo-400" />
            <span className="hidden lg:inline">技能 (T)</span>
          </button>
        )}
        {onOpenClassSelect && (
          <button
            onClick={onOpenClassSelect}
            className="touch-btn flex items-center gap-1.5 rounded-lg border-2 border-purple-600/80 bg-gradient-to-b from-purple-900/90 to-stone-950 px-2.5 sm:px-3 py-2 text-xs font-bold text-purple-200 shadow-lg hover:from-purple-800 hover:to-stone-900 active:scale-95 transition-all"
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
