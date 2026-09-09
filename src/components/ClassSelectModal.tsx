import React, { useState } from 'react';
import { CharacterClassId } from '../types';
import { classSystem } from '../engine/classSystem';
import { soundManager } from '../audio/soundManager';
import { X, Shield, Zap, Sparkles, Check, Flame, Award, Swords } from 'lucide-react';

interface ClassSelectModalProps {
  currentClassId: CharacterClassId;
  onSelectClass: (classId: CharacterClassId, replaceGear: boolean) => void;
  onClose: () => void;
  /** 触摸设备：全屏呈现 */
  fullscreen?: boolean;
}

export const ClassSelectModal: React.FC<ClassSelectModalProps> = ({
  currentClassId,
  onSelectClass,
  onClose,
  fullscreen = false,
}) => {
  const [selectedId, setSelectedId] = useState<CharacterClassId>(currentClassId);
  const [replaceGear, setReplaceGear] = useState<boolean>(true);

  const allClasses = classSystem.getAllClasses();
  const activeClassDef = classSystem.getClass(selectedId);

  const handleConfirm = () => {
    onSelectClass(selectedId, replaceGear);
    soundManager.playLevelUp();
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-black/85 backdrop-blur-md animate-in fade-in duration-200 ${
        fullscreen ? 'items-stretch' : 'items-end justify-center p-2 sm:items-center sm:p-4'
      }`}
    >
      <div className={`relative w-full max-w-4xl bg-stone-900 text-stone-100 shadow-2xl overflow-hidden flex flex-col ${fullscreen ? 'h-full rounded-none border-0' : 'max-h-[94dvh] sm:max-h-[92dvh] rounded-2xl border-2 border-stone-600'}`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-stone-700 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 px-3 sm:px-6 py-3 sm:py-4 safe-top">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-amber-500/50 bg-amber-500/10 text-xl sm:text-2xl">
              ⚔️
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-black tracking-wide text-amber-400 font-mono flex items-center gap-2">
                <span className="hidden sm:inline">英雄职业殿堂 (HERO CLASS SANCTUARY)</span>
                <span className="sm:hidden">英雄职业殿堂</span>
              </h2>
              <p className="hidden sm:block text-xs text-stone-400">
                切换专精职业以获取独有被动天赋、专属攻击倍率与定制起始神兵
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="touch-btn rounded-lg p-2 text-stone-400 hover:bg-stone-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Left Class Selector Grid, Right Class Details */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left: Class Cards (compact 2-col grid) */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
              选择职业分支
            </span>
            <div className="grid grid-cols-2 gap-2">
              {allClasses.map((c) => {
                const isSelected = selectedId === c.id;
                const isCurrent = currentClassId === c.id;

                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedId(c.id);
                      soundManager.playButtonClick();
                    }}
                    className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-stone-800 shadow-lg shadow-amber-500/10'
                        : 'border-stone-700/80 bg-stone-800/60 hover:border-stone-500 hover:bg-stone-800'
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xl border border-white/10"
                      style={{ backgroundColor: `${c.themeColor}22` }}
                    >
                      {c.icon}
                    </div>
                    <span className={`text-sm font-bold leading-none transition-colors ${isSelected ? 'text-amber-300' : 'text-stone-100'}`}>
                      {c.name}
                    </span>
                    <span className="text-[10px] text-stone-400 leading-none">{c.title}</span>
                    {isCurrent && (
                      <span className="absolute -top-1.5 -right-1.5 rounded bg-emerald-500 px-1 py-px text-[9px] font-bold text-stone-950">
                        现役
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Gear Replace Option（紧凑开关） */}
            <label
              htmlFor="replace-gear-checkbox"
              className={`mt-1 flex items-center gap-2.5 rounded-lg border p-2.5 cursor-pointer select-none transition-colors ${
                replaceGear ? 'border-amber-500/50 bg-amber-500/10' : 'border-stone-700 bg-stone-950/60'
              }`}
            >
              <input
                type="checkbox"
                id="replace-gear-checkbox"
                checked={replaceGear}
                onChange={(e) => setReplaceGear(e.target.checked)}
                className="h-4 w-4 rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-400 cursor-pointer"
              />
              <span className="text-xs text-stone-300 leading-snug">
                <span className="font-bold text-amber-300">发放该职业专属新手武装</span>
                <span className="block text-[10px] text-stone-500">转职立即换装专属神兵</span>
              </span>
            </label>
          </div>

          {/* Right: Class Detail Inspection */}
          <div className="md:col-span-8 flex flex-col justify-between rounded-xl border-2 border-stone-700 bg-stone-950/80 p-4">
            <div className="flex flex-col gap-3">
              {/* Header Info */}
              <div className="flex items-start justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl text-3xl border border-white/20 shadow-inner"
                    style={{ backgroundColor: `${activeClassDef.themeColor}33` }}
                  >
                    {activeClassDef.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-100 flex items-center gap-2">
                      {activeClassDef.name}
                      <span className="text-xs font-normal text-stone-400 font-mono">
                        ({activeClassDef.title})
                      </span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">{activeClassDef.description}</p>
                  </div>
                </div>
              </div>

              {/* Passive Traits & Combat Perks */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  职业专属战斗特质 (PASSIVE PERKS)
                </span>
                <div className="rounded-lg border border-stone-800 bg-stone-900/90 p-3 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    {activeClassDef.passiveName}
                  </span>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {activeClassDef.passiveDesc}
                  </p>
                </div>
              </div>

              {/* Starting Gear Summary */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5 mb-2">
                  <Flame className="h-4 w-4 text-sky-400" />
                  专属武装配置 (STARTER WEAPONRY)
                </span>
                <div className="rounded-lg border border-stone-800 bg-stone-900/60 p-2.5 text-xs text-stone-300 font-mono">
                  {activeClassDef.startingGearSummary}
                </div>
              </div>

              {/* Class Unique Attack & Tactical Modes */}
              {(activeClassDef.primaryAttackDesc || activeClassDef.secondaryAttackDesc) && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    专属攻击机制与战术动作 (COMBAT MODES)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {activeClassDef.primaryAttackDesc && (
                      <div className="rounded-lg border border-stone-800 bg-stone-900/90 p-2.5 flex flex-col gap-1">
                        <span className="text-stone-400 font-bold text-[11px] flex items-center gap-1">
                          <span className="text-amber-400 font-mono">L-CLK</span> 主手攻击:
                        </span>
                        <span className="text-amber-200 text-xs leading-snug">{activeClassDef.primaryAttackDesc}</span>
                      </div>
                    )}
                    {activeClassDef.secondaryAttackDesc && (
                      <div className="rounded-lg border border-stone-800 bg-stone-900/90 p-2.5 flex flex-col gap-1">
                        <span className="text-stone-400 font-bold text-[11px] flex items-center gap-1">
                          <span className="text-sky-400 font-mono">R-CLK</span> 战术右键:
                        </span>
                        <span className="text-sky-200 text-xs leading-snug">{activeClassDef.secondaryAttackDesc}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stat Modifiers Grid */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5 mb-2">
                  <Swords className="h-4 w-4 text-stone-400" />
                  基础属性修正 (BASE ATTRIBUTES)
                </span>
                <div className="grid grid-cols-6 gap-1.5 text-center">
                  {[
                    { label: '生命', value: String(activeClassDef.baseStats.hp), color: 'text-red-400' },
                    { label: '攻击', value: String(activeClassDef.baseStats.attack), color: 'text-amber-400' },
                    { label: '护甲', value: String(activeClassDef.baseStats.defense), color: 'text-blue-400' },
                    { label: '暴击', value: `${Math.round(activeClassDef.baseStats.critChance * 100)}%`, color: 'text-yellow-400' },
                    { label: '移速', value: String(activeClassDef.baseStats.speed), color: 'text-emerald-400' },
                    { label: '偷取', value: `${Math.round(activeClassDef.baseStats.lifeSteal * 100)}%`, color: 'text-purple-400' },
                  ].map((chip) => (
                    <div key={chip.label} className="rounded-lg border border-stone-800 bg-stone-900/60 px-1 py-1.5">
                      <span className="text-[9px] text-stone-500 block leading-none mb-0.5">{chip.label}</span>
                      <span className={`text-xs font-bold ${chip.color}`}>{chip.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bottom */}
            <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                随时可以在营地或HUD重新转换职业
              </span>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black px-6 py-2.5 shadow-lg shadow-amber-600/30 active:scale-95 transition-all text-sm"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                确认转职: {activeClassDef.name}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
