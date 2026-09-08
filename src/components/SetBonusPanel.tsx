import React from 'react';
import { ActiveSetInfo } from '../types';
import { SET_DEFINITIONS } from '../engine/setBonusSystem';
import { Layers } from 'lucide-react';

interface SetBonusPanelProps {
  activeSets: ActiveSetInfo[];
}

export const SetBonusPanel: React.FC<SetBonusPanelProps> = ({ activeSets }) => {
  return (
    <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-950/20 p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 text-purple-400" />
          <span>套装共鸣 (Set Bonuses)</span>
        </span>
        <span className="text-[10px] text-purple-400 font-mono font-semibold">
          {activeSets.length > 0 ? `${activeSets.length} 套装生效` : '暂无'}
        </span>
      </div>

      {activeSets.length === 0 ? (
        <div className="text-[11px] text-stone-500 italic leading-relaxed">
          穿戴同系列防具（如钻石套、精铁套、皮革套、黄金套等）可激活额外属性词条与专属特效！
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {activeSets.map((s) => (
            <div key={s.setDef.id} className="rounded border border-purple-500/30 bg-stone-900/90 p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold flex items-center gap-1" style={{ color: s.setDef.themeColor }}>
                  <span>{s.setDef.icon}</span>
                  <span>{s.setDef.name}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-200 font-mono font-bold">
                  {s.equippedCount} / {s.setDef.totalPieces} 件
                </span>
              </div>

              {s.activeBonuses.map((b) => (
                <div key={b.pieces} className="text-[11px] text-emerald-300 flex items-start gap-1 mt-0.5">
                  <span className="text-emerald-400 font-bold shrink-0">✓ [{b.pieces}件套]</span>
                  <span className="leading-tight">{b.name}: {b.description}</span>
                </div>
              ))}

              {s.inactiveBonuses.map((b) => (
                <div key={b.pieces} className="text-[11px] text-stone-500 flex items-start gap-1 mt-0.5">
                  <span className="shrink-0">🔒 [{b.pieces}件套]</span>
                  <span className="leading-tight">{b.name}: {b.description}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
