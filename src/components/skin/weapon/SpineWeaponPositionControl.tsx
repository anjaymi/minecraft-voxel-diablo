import React from 'react';
import { SpinePuppetConfig } from '../../../engine/skin/spineTypes';
import { Move, RotateCw, ZoomIn, FlipHorizontal, FlipVertical, Crosshair, Target } from 'lucide-react';

interface SpineWeaponPositionControlProps {
  config: SpinePuppetConfig;
  onUpdate: (partial: Partial<SpinePuppetConfig>) => void;
  onAutoCalibrate?: () => void;
  handBoneInfo?: { x: number; y: number; name: string };
}

export const SpineWeaponPositionControl: React.FC<SpineWeaponPositionControlProps> = ({
  config,
  onUpdate,
  onAutoCalibrate,
  handBoneInfo,
}) => {
  const currentX = config.weaponOffsetX ?? 0;
  const currentY = config.weaponOffsetY ?? 0;
  const currentRot = config.weaponRotationDeg ?? 0;
  const currentScale = config.weaponScale ?? 1.0;
  const isFlipX = !!config.weaponFlipX;
  const isFlipY = !!config.weaponFlipY;

  const renderStepControls = (
    val: number,
    min: number,
    max: number,
    key: 'weaponOffsetX' | 'weaponOffsetY'
  ) => (
    <div className="flex items-center justify-between text-[10px]">
      <div className="flex gap-1">
        {[-5, -1].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onUpdate({ [key]: Math.max(min, val + step) })}
            className="rounded bg-stone-800 px-1.5 py-0.5 text-stone-300 hover:bg-stone-700"
          >
            {step}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onUpdate({ [key]: 0 })}
        className="text-stone-400 hover:text-amber-300 underline"
      >
        归零 (0)
      </button>
      <div className="flex gap-1">
        {[1, 5].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onUpdate({ [key]: Math.min(max, val + step) })}
            className="rounded bg-stone-800 px-1.5 py-0.5 text-stone-300 hover:bg-stone-700"
          >
            +{step}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Auto Calibrate to Hand Bone Quick Action */}
      {onAutoCalibrate && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-stone-900/60 to-stone-950 p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <span>手部骨骼实时挂接点</span>
                {handBoneInfo && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-mono text-amber-200">
                    ({handBoneInfo.name} X:{handBoneInfo.x}, Y:{handBoneInfo.y})
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400">
                重置偏移至骨骼中心原点 (0, 0)，彻底消除挂在头部错位
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onAutoCalibrate}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 shadow hover:brightness-110 active:scale-95 transition-all shrink-0"
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>自动校准至手骨</span>
          </button>
        </div>
      )}

      {/* Quick step micro-adjusters for X & Y */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Weapon Offset X (Horizontal) */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-stone-300 font-medium">
              <Move className="h-3 w-3 text-amber-400" />
              <span>水平位移 (X):</span>
            </span>
            <span className="font-mono font-bold text-amber-300">{currentX > 0 ? `+${currentX}` : currentX} px</span>
          </div>

          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={currentX}
            onChange={(e) => onUpdate({ weaponOffsetX: parseInt(e.target.value, 10) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-800 accent-amber-500"
          />

          {renderStepControls(currentX, -50, 50, 'weaponOffsetX')}
        </div>

        {/* Weapon Offset Y (Vertical / Grip Height) */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-stone-300 font-medium">
              <Move className="h-3 w-3 text-amber-400 rotate-90" />
              <span>纵向高度 (Y):</span>
            </span>
            <span className="font-mono font-bold text-amber-300">{currentY > 0 ? `+${currentY}` : currentY} px</span>
          </div>

          <input
            type="range"
            min="-35"
            max="45"
            step="1"
            value={currentY}
            onChange={(e) => onUpdate({ weaponOffsetY: parseInt(e.target.value, 10) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-800 accent-amber-500"
          />

          {renderStepControls(currentY, -35, 45, 'weaponOffsetY')}
        </div>
      </div>

      {/* Rotation & Scaling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Rotation */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-stone-300 font-medium">
              <RotateCw className="h-3 w-3 text-cyan-400" />
              <span>倾斜旋转角度:</span>
            </span>
            <span className="font-mono font-bold text-cyan-300">{currentRot}°</span>
          </div>

          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={currentRot}
            onChange={(e) => onUpdate({ weaponRotationDeg: parseInt(e.target.value, 10) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-800 accent-cyan-500"
          />

          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {[-90, -45, 0, 15, 30, 45, 90].map((deg) => (
              <button
                key={deg}
                type="button"
                onClick={() => onUpdate({ weaponRotationDeg: deg })}
                className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                  currentRot === deg
                    ? 'border border-cyan-500 bg-cyan-950/60 text-cyan-300'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>

        {/* Scale & Flips */}
        <div className="flex flex-col gap-1.5 rounded-lg border border-stone-800/80 bg-stone-950/50 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-stone-300 font-medium">
              <ZoomIn className="h-3 w-3 text-amber-400" />
              <span>武器尺寸比例:</span>
            </span>
            <span className="font-mono font-bold text-amber-300">{currentScale.toFixed(2)}x</span>
          </div>

          <input
            type="range"
            min="0.4"
            max="2.2"
            step="0.05"
            value={currentScale}
            onChange={(e) => onUpdate({ weaponScale: parseFloat(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-800 accent-amber-500"
          />

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex gap-1">
              {[0.8, 1.0, 1.25, 1.5].map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => onUpdate({ weaponScale: sc })}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                    Math.abs(currentScale - sc) < 0.01
                      ? 'border border-amber-500 bg-amber-950/60 text-amber-300'
                      : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                  }`}
                >
                  {sc}x
                </button>
              ))}
            </div>

            {/* Mirror Flips */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdate({ weaponFlipX: !isFlipX })}
                title="水平镜像翻转武器"
                className={`flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] transition-colors ${
                  isFlipX
                    ? 'border border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <FlipHorizontal className="h-2.5 w-2.5" />
                <span>镜像X</span>
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ weaponFlipY: !isFlipY })}
                title="垂直翻转武器 (反持)"
                className={`flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] transition-colors ${
                  isFlipY
                    ? 'border border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                }`}
              >
                <FlipVertical className="h-2.5 w-2.5" />
                <span>倒持Y</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
