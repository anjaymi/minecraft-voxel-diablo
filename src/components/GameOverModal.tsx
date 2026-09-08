import React, { useEffect } from 'react';
import { Player } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RefreshCw, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  player: Player;
  floorNumber: number;
  totalKills: number;
  bossesDefeated: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  player,
  floorNumber,
  totalKills,
  bossesDefeated,
  onRestart,
}) => {
  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none safe-top safe-bottom">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-stone-700 bg-gradient-to-b from-stone-900 to-stone-950 p-6 sm:p-8 shadow-2xl text-stone-100 flex flex-col items-center text-center max-h-[92vh] overflow-y-auto">
        {/* Banner Icon */}
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-3xl border-2 mb-4 shadow-xl ${
            isVictory
              ? 'border-amber-500 bg-amber-950/80 text-amber-400'
              : 'border-red-600 bg-red-950/80 text-red-500'
          }`}
        >
          {isVictory ? <Trophy className="h-10 w-10 animate-bounce" /> : <Skull className="h-10 w-10" />}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl md:text-3xl font-black font-cinzel tracking-wider mb-2 ${
            isVictory
              ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500'
              : 'text-red-500'
          }`}
        >
          {isVictory ? '地牢终极通关胜利！' : '你倒在了地牢深处...'}
        </h2>
        <p className="text-xs text-stone-400 mb-6">
          {isVictory
            ? '恭喜勇士！你彻底粉碎了下界与末地的魔影入侵，成为方块世界的传奇英雄！'
            : '虽然本次冒险折戟沉沙，但积累的经验将化为下一次冲锋的利刃。'}
        </p>

        {/* Run Statistics Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-6 font-mono text-xs">
          <div className="flex flex-col items-center rounded-lg border border-stone-800 bg-stone-950/70 p-3">
            <span className="text-stone-400 text-[11px]">达到层数</span>
            <span className="text-amber-400 font-bold text-base mt-0.5">第 {floorNumber} 层</span>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-stone-800 bg-stone-950/70 p-3">
            <span className="text-stone-400 text-[11px]">最终等级</span>
            <span className="text-emerald-400 font-bold text-base mt-0.5">Lv.{player.stats.level}</span>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-stone-800 bg-stone-950/70 p-3">
            <span className="text-stone-400 text-[11px]">怪物击杀数</span>
            <span className="text-red-400 font-bold text-base mt-0.5">{totalKills} 只</span>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-stone-800 bg-stone-950/70 p-3">
            <span className="text-stone-400 text-[11px]">绿宝石财富</span>
            <span className="text-emerald-400 font-bold text-base mt-0.5">💎 {player.stats.emeralds}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-amber-500/60 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 font-bold text-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          <span>开始新的一局 (Start New Run)</span>
        </button>
      </div>
    </div>
  );
};
