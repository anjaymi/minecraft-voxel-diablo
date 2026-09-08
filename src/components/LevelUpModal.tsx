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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-4 animate-fade-in">
      <div className="relative flex max-h-[96dvh] w-full max-w-3xl flex-col items-center overflow-y-auto text-center">
        {/* Title & Level Badge */}
        <div className="flex items-center gap-2 text-amber-400">
          <Sparkles className="h-5 w-5 md:h-6 md:w-6 animate-spin text-amber-400" />
          <span className="font-mono text-xs md:text-sm tracking-widest uppercase font-bold text-amber-300">
            等级提升 (LEVEL UP!)
          </span>
          <Sparkles className="h-5 w-5 md:h-6 md:w-6 animate-spin text-amber-400" />
        </div>

        <h1 className="text-xl md:text-3xl lg:text-4xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 mb-1 md:mb-2 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
          选择附魔圣坛赐福
        </h1>
        <p className="text-xs md:text-sm text-stone-400 mb-3 md:mb-8 max-w-md short:hidden">
          英雄已达到等级 <span className="text-emerald-400 font-bold font-mono">Lv.{level}</span>。请从以下三项古代附魔中择一融入灵魂：
        </p>

        {/* 3 Roguelike Choice Cards（矮屏紧凑化，按钮不再被裁切） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 w-full short:gap-2">
          {choices.map((choice) => (
            <div
              key={choice.id}
              onClick={() => onSelect(choice)}
              className="group relative flex flex-col items-center text-center rounded-xl border-2 border-stone-700 bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 p-4 md:p-6 shadow-2xl transition-all duration-200 hover:-translate-y-2 hover:border-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.35)] cursor-pointer active:scale-95 short:p-2.5"
            >
              {/* Card top glow */}
              <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent group-hover:via-amber-300" />

              {/* Icon */}
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-2xl border-2 border-amber-600/50 bg-stone-950 text-3xl md:text-4xl mb-2 md:mb-4 group-hover:scale-110 group-hover:border-amber-400 transition-transform shadow-inner short:h-9 short:w-9 short:text-xl short:mb-1.5">
                {choice.icon}
              </div>

              {/* Title */}
              <h3 className="text-base md:text-lg font-bold text-stone-100 group-hover:text-amber-300 transition-colors mb-0.5 md:mb-1 font-cinzel short:text-xs short:leading-tight">
                {choice.name}
              </h3>
              <span className="text-[11px] font-mono text-purple-400 mb-2 md:mb-3 tracking-wider short:hidden">
                [{choice.enName}]
              </span>

              {/* Description */}
              <p className="text-xs text-stone-300 leading-relaxed mb-3 md:mb-6 flex-1 short:text-[10px] short:mb-1.5 short:leading-snug">
                {choice.description}
              </p>

              {/* Select Action Button */}
              <button className="w-full rounded-lg border border-amber-500/60 bg-gradient-to-r from-amber-700 to-amber-600 py-2 md:py-2.5 text-xs font-bold text-black tracking-wider shadow-lg group-hover:from-amber-500 group-hover:to-amber-400 active:scale-95 transition-all short:py-1.5">
                铭刻此附魔
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
