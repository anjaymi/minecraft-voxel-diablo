import React from 'react';
import { EnchantmentChoice } from '../types';
import { Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  choices: EnchantmentChoice[];
  onSelect: (choice: EnchantmentChoice) => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ level, choices, onSelect }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl flex flex-col items-center text-center">
        {/* Title & Level Badge */}
        <div className="mb-2 flex items-center gap-2 text-amber-400">
          <Sparkles className="h-6 w-6 animate-spin text-amber-400" />
          <span className="font-mono text-sm tracking-widest uppercase font-bold text-amber-300">
            等级提升 (LEVEL UP!)
          </span>
          <Sparkles className="h-6 w-6 animate-spin text-amber-400" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 mb-2 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
          选择附魔圣坛赐福 (Choose Enchantment)
        </h1>
        <p className="text-sm text-stone-400 mb-8 max-w-md">
          英雄已达到等级 <span className="text-emerald-400 font-bold font-mono">Lv.{level}</span>。请从以下三项古代附魔中择一融入灵魂：
        </p>

        {/* 3 Roguelike Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {choices.map((choice) => (
            <div
              key={choice.id}
              onClick={() => onSelect(choice)}
              className="group relative flex flex-col items-center text-center rounded-xl border-2 border-stone-700 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 p-6 shadow-2xl transition-all duration-200 hover:-translate-y-2 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] cursor-pointer"
            >
              {/* Card top glow */}
              <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent group-hover:via-amber-300" />

              {/* Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-amber-600/50 bg-stone-950 text-4xl mb-4 group-hover:scale-110 group-hover:border-amber-400 transition-transform shadow-inner">
                {choice.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors mb-1 font-cinzel">
                {choice.name}
              </h3>
              <span className="text-[11px] font-mono text-purple-400 mb-3 tracking-wider">
                [{choice.enName}]
              </span>

              {/* Description */}
              <p className="text-xs text-stone-300 leading-relaxed mb-6 flex-1">
                {choice.description}
              </p>

              {/* Select Action Button */}
              <button className="w-full rounded-lg border border-amber-500/60 bg-gradient-to-r from-amber-700 to-amber-600 py-2.5 text-xs font-bold text-black tracking-wider shadow-lg group-hover:from-amber-500 group-hover:to-amber-400 active:scale-95 transition-all">
                铭刻此附魔
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
