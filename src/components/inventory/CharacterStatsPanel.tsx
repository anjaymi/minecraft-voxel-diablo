import React from 'react';
import { Player } from '../../types';
import { Sparkles } from 'lucide-react';

interface CharacterStatsPanelProps {
  player: Player;
}

export const CharacterStatsPanel: React.FC<CharacterStatsPanelProps> = ({ player }) => {
  return (
    <div className="rounded-lg border border-stone-800 bg-stone-950/70 p-3 flex flex-col gap-1.5 text-xs font-mono">
      <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        角色面板总属性 (Combined Stats)
      </h4>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">等级 (Level)</span>
        <span className="text-emerald-400 font-bold">{player.stats.level}</span>
      </div>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">生命值 (HP)</span>
        <span className="text-red-400 font-bold">{player.stats.hp} / {player.stats.maxHp}</span>
      </div>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">攻击力 (Attack)</span>
        <span className="text-amber-400 font-bold">{player.stats.attack}</span>
      </div>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">防御力 (Defense)</span>
        <span className="text-blue-400 font-bold">{player.stats.defense}</span>
      </div>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">暴击率 (Crit Rate)</span>
        <span className="text-yellow-300 font-bold">{Math.round(player.stats.critChance * 100)}%</span>
      </div>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">移动速度 (Speed)</span>
        <span className="text-stone-200 font-bold">{player.stats.speed.toFixed(1)}</span>
      </div>
      <div className="flex justify-between border-b border-stone-800/80 pb-0.5">
        <span className="text-stone-400">法强 / 召唤加成</span>
        <span className="text-purple-400 font-bold">
          +{player.spellPower || 0} / +{Math.round((player.summonDamageBonus || 0) * 100)}%
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-400">绿宝石 (Emeralds)</span>
        <span className="text-emerald-400 font-bold font-mono">💎 {player.stats.emeralds}</span>
      </div>
    </div>
  );
};
