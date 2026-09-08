import React from 'react';
import { Player, SummonedMinion } from '../../types';
import { Shield, Zap, Skull, Flame, Crosshair } from 'lucide-react';

interface MinionStatusPanelProps {
  player: Player;
}

export const MinionStatusPanel: React.FC<MinionStatusPanelProps> = ({ player }) => {
  const activeMinions = player.minions || [];
  const isSummonerOrDruid = player.characterClass === 'summoner' || player.characterClass === 'druid';

  // Only render if summoner/druid or if there are active summoned minions
  if (!isSummonerOrDruid && activeMinions.length === 0) {
    return null;
  }

  // Active skill cooldowns for summoner/druid
  const skillCds = player.skillCooldowns || {};

  return (
    <div className="flex flex-col gap-1.5 animate-fade-in pointer-events-auto">
      {/* Minion List Panel */}
      {activeMinions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-500/30 bg-slate-950/85 px-3 py-1.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 pr-2 border-r border-slate-700">
            <Shield className="h-3.5 w-3.5 text-indigo-400" />
            <span>召唤战团 ({activeMinions.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {activeMinions.map((minion) => {
              const hpPct = Math.max(0, Math.min(100, Math.round((minion.hp / Math.max(1, minion.maxHp)) * 100)));
              const isCooling = minion.attackCooldown > 0;
              const cdText = isCooling ? `${minion.attackCooldown.toFixed(1)}s` : '就绪';

              return (
                <div
                  key={minion.id}
                  className={`flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs transition-all ${
                    minion.isEnraged
                      ? 'border-red-500/70 bg-red-950/40 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : 'border-slate-700 bg-slate-900/90'
                  }`}
                >
                  {/* Minion Icon & Name */}
                  <span className="text-sm select-none">{minion.icon}</span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-100 text-[11px]">{minion.name}</span>
                      {minion.isEnraged && (
                        <span className="flex items-center text-[10px] text-red-400 font-bold animate-pulse">
                          <Flame className="h-2.5 w-2.5 inline mr-0.5" />狂暴
                        </span>
                      )}
                      {minion.targetId && (
                        <span className="flex items-center text-[10px] text-amber-400">
                          <Crosshair className="h-2.5 w-2.5 inline mr-0.5" />锁定
                        </span>
                      )}
                    </div>

                    {/* HP Bar & CD Status */}
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-200 ${
                            hpPct > 50
                              ? 'bg-emerald-500'
                              : hpPct > 25
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${hpPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-300 font-bold">{hpPct}%</span>
                      <span className="text-slate-600 text-[9px]">|</span>
                      <span
                        className={`font-mono text-[10px] ${
                          isCooling ? 'text-amber-400' : 'text-emerald-400 font-bold'
                        }`}
                        title="主动攻势/技能冷却"
                      >
                        ⚡ {cdText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-400 backdrop-blur-sm">
          <span>💀 暂无活跃召唤物 (按数字键 1/2/3 召唤狼魂与骷髅战团)</span>
        </div>
      )}

      {/* Summoner Active Master Skill CD Quick Tracker */}
      {isSummonerOrDruid && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
          <Zap className="h-3 w-3 text-indigo-400" />
          <span>统御指令CD:</span>
          {(Object.entries(skillCds) as [string, number][]).map(([skillId, cd]) => {
            if (typeof cd !== 'number' || cd <= 0) return null;
            return (
              <span
                key={skillId}
                className="rounded bg-slate-800/80 border border-slate-700 px-1.5 py-0.5 text-amber-300 font-mono"
              >
                {skillId.replace('summon_', '').replace('druid_', '')}: {cd.toFixed(1)}s
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
