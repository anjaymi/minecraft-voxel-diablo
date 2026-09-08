import React from 'react';
import { Play, Pause, StepBack, StepForward } from 'lucide-react';

interface SpinePlaybackBarProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  manualPhase: number;
  onPhaseChange: (phase: number) => void;
  showWireframe: boolean;
  onToggleWireframe: (show: boolean) => void;
}

export const SpinePlaybackBar: React.FC<SpinePlaybackBarProps> = ({
  isPlaying,
  onTogglePlay,
  manualPhase,
  onPhaseChange,
  showWireframe,
  onToggleWireframe,
}) => {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/50 p-2">
      <button
        onClick={onTogglePlay}
        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border transition-all ${
          isPlaying
            ? 'border-amber-500/50 bg-amber-950/60 text-amber-300 hover:bg-amber-900/60'
            : 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
        }`}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        <span>{isPlaying ? '定格' : '播放'}</span>
      </button>

      <button
        disabled={isPlaying}
        onClick={() => onPhaseChange(Math.max(0, (manualPhase - 0.05 + 1) % 1))}
        className="p-1 rounded border border-stone-700 bg-stone-800 text-stone-300 hover:text-white disabled:opacity-30"
        title="后退一帧"
      >
        <StepBack className="h-3 w-3" />
      </button>
      <button
        disabled={isPlaying}
        onClick={() => onPhaseChange((manualPhase + 0.05) % 1)}
        className="p-1 rounded border border-stone-700 bg-stone-800 text-stone-300 hover:text-white disabled:opacity-30"
        title="前进一帧"
      >
        <StepForward className="h-3 w-3" />
      </button>

      <div className="flex flex-1 items-center gap-2 ml-1">
        <span className="text-[10px] text-stone-400 whitespace-nowrap">
          {isPlaying ? '循环中' : `${Math.round(manualPhase * 100)}%`}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={manualPhase}
          disabled={isPlaying}
          onChange={(e) => onPhaseChange(parseFloat(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500 disabled:opacity-40"
        />
      </div>

      <label className="flex items-center gap-1 text-[11px] text-sky-400 cursor-pointer ml-1">
        <input
          type="checkbox"
          checked={showWireframe}
          onChange={(e) => onToggleWireframe(e.target.checked)}
          className="rounded border-stone-600 bg-stone-800 text-sky-500"
        />
        <span className="whitespace-nowrap">骨骼透视</span>
      </label>
    </div>
  );
};
