import React, { useState, useEffect, useRef } from 'react';
import { FloorQuest, QuestObjective } from '../types';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trophy,
  Compass,
  Sparkles,
  Gift,
  Gem,
  Award,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { soundManager } from '../audio/soundManager';

interface QuestTrackerProps {
  quest: FloorQuest | null;
  /** 触摸设备：默认折叠成一行，避免遮挡触控区（DI 式紧凑任务条） */
  defaultCollapsed?: boolean;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ quest, defaultCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [showRewardModal, setShowRewardModal] = useState<boolean>(false);
  const prevCompletedRef = useRef<boolean>(false);

  // Trigger celebration effect when all objectives become completed
  useEffect(() => {
    if (!quest) return;
    const completedCount = quest.objectives.filter((o) => o.isCompleted).length;
    const totalCount = quest.objectives.length;
    const isAllDone = quest.allCompleted || (totalCount > 0 && completedCount === totalCount);

    if (isAllDone && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      soundManager.playLevelUp?.();
      try {
        confetti({
          particleCount: 40,
          spread: 55,
          origin: { x: 0.82, y: 0.18 },
          colors: ['#fbbf24', '#f59e0b', '#10b981', '#38bdf8', '#c084fc'],
          ticks: 150,
          gravity: 1.1,
          scalar: 0.85,
        });
      } catch {
        // Safe fallback if canvas not available
      }
    } else if (!isAllDone) {
      prevCompletedRef.current = false;
    }
  }, [quest?.allCompleted, quest?.objectives]);

  if (!quest) return null;

  const completedCount = quest.objectives.filter((o) => o.isCompleted).length;
  const totalCount = quest.objectives.length;
  const overallPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = quest.allCompleted || (totalCount > 0 && completedCount === totalCount);

  // Calculate total rewards summary
  const totalXp = quest.totalReward?.xp ?? quest.objectives.reduce((acc, o) => acc + (o.reward?.xp || 0), 0);
  const totalEmeralds = quest.totalReward?.emeralds ?? quest.objectives.reduce((acc, o) => acc + (o.reward?.emeralds || 0), 0);
  const totalItemText = quest.totalReward?.itemText || (allDone ? '地下城通关宝箱' : '暗金附魔战利品');

  // Helper for progress bar gradient by objective type
  const getProgressGradient = (type: string, isCompleted: boolean) => {
    if (isCompleted) return 'from-emerald-500 to-teal-400';
    switch (type) {
      case 'kill_monsters':
        return 'from-rose-600 via-orange-500 to-amber-400';
      case 'kill_elite':
        return 'from-amber-500 via-yellow-400 to-amber-200';
      case 'open_chests':
        return 'from-amber-500 via-amber-400 to-yellow-300';
      case 'escort_npc':
        return 'from-sky-500 via-blue-400 to-indigo-300';
      case 'reach_portal':
        return 'from-purple-500 via-fuchsia-400 to-indigo-300';
      default:
        return 'from-amber-500 to-amber-300';
    }
  };

  return (
    <motion.div
      id="dynamic-quest-tracker"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="pointer-events-auto w-56 sm:w-72 md:w-84 font-sans select-none origin-top-right scale-[0.88] sm:scale-100"
    >
      <div
        className={`rounded-2xl border-2 transition-all duration-300 shadow-2xl backdrop-blur-md overflow-hidden ${
          allDone
            ? 'border-amber-400/90 bg-stone-950/95 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
            : 'border-stone-700/80 bg-stone-950/90 shadow-stone-950/70'
        }`}
      >
        {/* Header Bar */}
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`relative flex items-center justify-between px-3.5 py-2.5 cursor-pointer border-b transition-colors ${
            allDone
              ? 'bg-gradient-to-r from-amber-950/70 via-stone-900 to-amber-950/50 border-amber-500/40 hover:from-amber-900/70'
              : 'bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 border-stone-800 hover:from-stone-850'
          }`}
        >
          {/* Subtle animated sheen bar when completed */}
          {allDone && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent pointer-events-none"
            />
          )}

          <div className="flex items-center gap-2.5 overflow-hidden">
            <motion.div
              animate={allDone ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
              transition={{ repeat: allDone ? Infinity : 0, duration: 2.5 }}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs shadow-md ${
                allDone
                  ? 'border-amber-400 bg-amber-500/25 text-amber-300'
                  : 'border-indigo-500/60 bg-indigo-500/20 text-indigo-300'
              }`}
            >
              {allDone ? <Trophy className="h-4 w-4 text-amber-400" /> : <Compass className="h-4 w-4 text-indigo-400" />}
            </motion.div>

            <div className="flex flex-col truncate">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-bold text-stone-100 font-cinzel truncate tracking-wide">
                  {quest.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                <span>目标进度: {completedCount}/{totalCount}</span>
                <span className="text-amber-400 font-semibold">{overallPercent}%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 shrink-0">
            {allDone ? (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 rounded-full border border-amber-400/80 bg-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-300 shadow-sm"
              >
                <Sparkles className="h-2.5 w-2.5 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                <span>已达成</span>
              </motion.span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRewardModal(!showRewardModal);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 text-[9px] transition-colors"
                title="查看层目标奖励预览"
              >
                <Gift className="h-2.5 w-2.5 text-amber-400" />
                <span>奖励</span>
              </button>
            )}

            <button
              type="button"
              className="text-stone-400 hover:text-white p-1 transition-colors"
              title={isCollapsed ? '展开任务追踪器' : '收起任务追踪器'}
            >
              {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Global Floor Quest Progress Bar */}
        <div className="w-full bg-stone-950 h-1.5 relative overflow-hidden border-b border-stone-800/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full ${
              allDone
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                : 'bg-gradient-to-r from-indigo-600 via-amber-500 to-amber-400'
            }`}
          />
        </div>

        {/* Quest Objectives & Rewards Body */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key="quest-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="p-3 space-y-2.5 overflow-hidden"
            >
              {/* Reward Preview Badge Ribbon */}
              <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border border-stone-800 bg-stone-900/50 text-[10px]">
                <div className="flex items-center gap-1.5 text-stone-400 font-medium">
                  <Award className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>通关奖励预览:</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {totalEmeralds > 0 && (
                    <span className="flex items-center gap-0.5 text-emerald-400 font-bold font-mono">
                      <Gem className="h-3 w-3" />
                      +{totalEmeralds}
                    </span>
                  )}
                  {totalXp > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-300 font-bold font-mono">
                      <Zap className="h-3 w-3" />
                      +{totalXp} XP
                    </span>
                  )}
                </div>
              </div>

              {/* Objective Cards */}
              <div className="space-y-2">
                {quest.objectives.map((obj: QuestObjective) => {
                  const progressPercent = Math.min(100, Math.round((obj.current / obj.target) * 100));
                  const isDone = obj.isCompleted;

                  return (
                    <motion.div
                      layout
                      key={obj.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-xl border p-2.5 transition-all duration-200 ${
                        isDone
                          ? 'border-emerald-700/60 bg-emerald-950/25 shadow-inner'
                          : 'border-stone-800/90 bg-stone-900/70 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 overflow-hidden">
                          <span className="text-base shrink-0 select-none mt-0.5">{obj.icon}</span>
                          <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-xs font-semibold leading-tight truncate ${
                                  isDone ? 'text-emerald-300 line-through opacity-85' : 'text-stone-100'
                                }`}
                              >
                                {obj.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 leading-tight mt-0.5 line-clamp-2">
                              {obj.desc}
                            </span>
                          </div>
                        </div>

                        {/* Status Checkmark or Count Badge */}
                        <div className="shrink-0 flex items-center gap-1 mt-0.5">
                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: [0, 1.3, 1] }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                            </motion.div>
                          ) : (
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-stone-950 border border-stone-800 text-amber-400">
                              {obj.current}/{obj.target}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Smooth Progress Bar */}
                      <div className="mt-2 w-full h-1.5 bg-stone-950 rounded-full border border-stone-800/80 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${getProgressGradient(obj.type, isDone)} ${
                            isDone ? 'shadow-[0_0_6px_rgba(16,185,129,0.6)]' : ''
                          }`}
                        />
                      </div>

                      {/* Objective Specific Reward Chip */}
                      {obj.reward && (
                        <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono border-t border-stone-800/60 pt-1">
                          <span className="text-stone-500 flex items-center gap-1">
                            <Gift className="h-2.5 w-2.5 text-stone-500" />
                            <span>单项达成:</span>
                          </span>
                          <span className={isDone ? 'text-emerald-400 font-bold' : 'text-amber-300 font-medium'}>
                            {obj.reward.text || `+${obj.reward.xp || 0} EXP`}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Completion Celebratory Banner or Helpful Hint */}
              <AnimatePresence>
                {allDone ? (
                  <motion.div
                    key="completed-banner"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-stone-900 p-2.5 text-center text-xs text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                  >
                    <div className="font-bold flex items-center justify-center gap-1.5 text-amber-300 tracking-wide">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <span>✨ 本层所有目标圆满达成！ ✨</span>
                    </div>
                    <div className="text-[10px] text-amber-300/80 mt-1">
                      传送门封印解除，踏入传送门即可前往下一层或获取通关奖励！
                    </div>
                    {totalItemText && (
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[9px] text-amber-200 font-bold">
                        <Gift className="h-3 w-3 text-amber-300" />
                        <span>已获得: {totalItemText}</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono px-1">
                    <span>提示: 击败怪物、开启宝箱可推动任务</span>
                    <span className="text-amber-400/80 font-medium">地下城探索</span>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
