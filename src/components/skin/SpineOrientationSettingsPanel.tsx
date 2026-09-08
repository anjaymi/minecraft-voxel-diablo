import React, { useState } from 'react';
import { Compass, RotateCw, Check, Sliders, Target, Footprints, Zap, Lock, AlertTriangle, Sparkles, Sword } from 'lucide-react';
import { SpinePuppetConfig } from '../../engine/skin/spineTypes';
import { CharacterFacingMode, BaseArtFacing } from '../../engine/orientation/CharacterOrientationTypes';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { CharacterOrientationManager } from '../../engine/orientation/CharacterOrientationManager';

interface SpineOrientationSettingsPanelProps {
  config: SpinePuppetConfig;
  onUpdate: () => void;
  onSimulateFacing?: (isLeft: boolean) => void;
}

const FACING_MODES: Array<{
  id: CharacterFacingMode;
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  {
    id: 'aim',
    label: '瞄准优先',
    icon: <Target className="h-3.5 w-3.5 text-amber-400" />,
    desc: '出招斩击与鼠标瞄准优先，攻击动作锁定出招方向',
  },
  {
    id: 'movement',
    label: '移动优先',
    icon: <Footprints className="h-3.5 w-3.5 text-cyan-400" />,
    desc: '随角色跑动位移矢量转向，更具经典动作探险跑图质感',
  },
  {
    id: 'auto',
    label: '智能混控',
    icon: <Zap className="h-3.5 w-3.5 text-emerald-400" />,
    desc: '蓄力时随指针，奔跑时随位移，出招时锁定攻击角度',
  },
  {
    id: 'fixed_right',
    label: '固定朝右',
    icon: <Lock className="h-3.5 w-3.5 text-stone-400" />,
    desc: '锁定角色面向屏幕右侧',
  },
  {
    id: 'fixed_left',
    label: '固定朝左',
    icon: <Lock className="h-3.5 w-3.5 text-stone-400" />,
    desc: '锁定角色面向屏幕左侧',
  },
];

export const SpineOrientationSettingsPanel: React.FC<SpineOrientationSettingsPanelProps> = ({
  config,
  onUpdate,
  onSimulateFacing,
}) => {
  const currentMode: CharacterFacingMode = config.facingMode || 'aim';
  const defaultArtFacing: BaseArtFacing = config.defaultArtFacing || 'right';
  const invertFacing = !!config.invertFacing;
  const deadzone = config.facingDeadzone ?? 0.055;
  const [fixedNotice, setFixedNotice] = useState<string | null>(null);

  const handleSetMode = (mode: CharacterFacingMode) => {
    customSkinManager.updateSpineOverall({ facingMode: mode });
    onUpdate();
  };

  const handleSetDefaultArtFacing = (artFacing: BaseArtFacing) => {
    CharacterOrientationManager.setDefaultArtFacing(artFacing);
    onUpdate();
  };

  const handleToggleInvertFacing = () => {
    CharacterOrientationManager.toggleInvertFacing();
    onUpdate();
  };

  const handleChangeDeadzone = (val: number) => {
    customSkinManager.updateSpineOverall({ facingDeadzone: val });
    onUpdate();
  };

  // 一键校正素体朝向颠倒问题（往左打却朝右）
  const handleQuickFixInversion = () => {
    // 切换原画朝向基准或翻转镜像
    if (defaultArtFacing === 'right') {
      CharacterOrientationManager.setDefaultArtFacing('left');
      setFixedNotice('已将素材基准设为【👈 原画朝左】！现在向左攻击将正确面向左侧。');
    } else {
      CharacterOrientationManager.setDefaultArtFacing('right');
      setFixedNotice('已将素材基准设为【👉 原画朝右】！');
    }
    onUpdate();
    setTimeout(() => setFixedNotice(null), 4500);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/70 p-3 sm:p-4 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-950/80 border border-amber-600/40 text-amber-400">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-stone-200 tracking-wide text-sm font-cinzel">
            素体朝向与攻击转向校准
          </span>
        </div>

        {/* Current status summary badge */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-400 bg-stone-950/80 px-2 py-0.5 rounded-md border border-stone-800">
          <span className="text-amber-400 font-semibold">
            {FACING_MODES.find((m) => m.id === currentMode)?.label}
          </span>
          <span className="text-stone-600">|</span>
          <span>原图:{defaultArtFacing === 'right' ? '朝右' : '朝左'}</span>
          {invertFacing && (
            <>
              <span className="text-stone-600">|</span>
              <span className="text-orange-400 font-bold">已镜像</span>
            </>
          )}
        </div>
      </div>

      {/* 快捷修复横幅：解决“攻击方向是左边但是角色朝向右边” */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-lg border border-amber-600/40 bg-amber-950/30 p-2.5">
        <div className="flex items-center gap-2 text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-bold text-amber-300">遇到向左攻击角色朝向右边？</span>
            <span className="text-[11px] text-amber-200/80">
              因为立绘/素材原画若为朝左绘制，基准相反会导致向左打反向朝右。在游戏中也可随时按 <kbd className="px-1 py-0.5 rounded bg-stone-800 border border-stone-600 text-white font-mono text-[10px]">O</kbd> 键一键校准。
            </span>
          </div>
        </div>
        <button
          onClick={handleQuickFixInversion}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-md shadow-orange-950/60 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>⚡ 一键矫正朝向颠倒</span>
        </button>
      </div>

      {fixedNotice && (
        <div className="rounded-md border border-emerald-500/60 bg-emerald-950/60 p-2 text-emerald-200 text-[11px] font-medium animate-fade-in">
          {fixedNotice}
        </div>
      )}

      {/* 1. Facing Mode Selector Grid */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-stone-400 font-medium">朝向决策模式：</span>
          <span className="text-[11px] text-stone-500">攻击出招时将严格锁定攻击朝向</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
          {FACING_MODES.map((mode) => {
            const isSelected = currentMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleSetMode(mode.id)}
                className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-950/60 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                    : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
                title={mode.desc}
              >
                <div className="flex items-center gap-1 font-semibold text-xs">
                  {mode.icon}
                  <span>{mode.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Art Baseline & Invert Flip Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Raw Artwork Orientation Baseline */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-300">素体原画基准朝向：</span>
            <span className="text-[10px] text-stone-500 font-mono">原图人物脸部朝向</span>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => handleSetDefaultArtFacing('right')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border py-1.5 font-medium transition-all ${
                defaultArtFacing === 'right'
                  ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold'
                  : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>👉 原素材朝右</span>
            </button>
            <button
              onClick={() => handleSetDefaultArtFacing('left')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md border py-1.5 font-medium transition-all ${
                defaultArtFacing === 'left'
                  ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                  : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>👈 原素材朝左 (校正向左打)</span>
            </button>
          </div>
        </div>

        {/* Quick Invert Horizontal & Anti-Jitter Deadzone */}
        <div className="flex flex-col gap-2 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2.5">
          {/* Invert Flip Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <RotateCw className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-semibold text-stone-300">全身镜像水平翻转</span>
            </div>
            <button
              onClick={handleToggleInvertFacing}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold transition-all ${
                invertFacing
                  ? 'border-orange-500 bg-orange-950/80 text-orange-300 shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                  : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200'
              }`}
            >
              <Check className={`h-3 w-3 ${invertFacing ? 'opacity-100' : 'opacity-0'}`} />
              <span>{invertFacing ? '已镜像翻转' : '正常无翻转'}</span>
            </button>
          </div>

          {/* Anti-Jitter Deadzone Slider */}
          <div className="flex flex-col gap-1 pt-1 border-t border-stone-800/60">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400 flex items-center gap-1">
                <Sliders className="h-3 w-3 text-stone-500" />
                转向防抖死区
              </span>
              <span className="font-mono text-amber-400 font-bold">{deadzone.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min={0.02}
              max={0.15}
              step={0.005}
              value={deadzone}
              onChange={(e) => handleChangeDeadzone(parseFloat(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-amber-500 bg-stone-800 rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
