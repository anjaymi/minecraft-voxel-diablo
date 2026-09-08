import React, { useEffect, useRef, useState } from 'react';
import { SpinePuppetConfig, SkeletonPose, SpineActionType, SPINE_ACTION_PRESETS } from '../../engine/skin/spineTypes';
import { ModularSpineRenderer } from '../../engine/skin/ModularSpineRenderer';
import { SpineKinematics } from '../../engine/skin/SpineKinematics';
import { SpineAnimationBlender } from '../../engine/skin/SpineAnimationBlender';
import { SpineWireframeRenderer } from '../../engine/skin/SpineWireframeRenderer';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { CharacterOrientationManager } from '../../engine/orientation/CharacterOrientationManager';
import { Sparkles, Eye, Grid, ArrowLeftRight, ZoomIn } from 'lucide-react';
import { SpinePlaybackBar } from './SpinePlaybackBar';

interface SpinePreviewCanvasProps {
  config: SpinePuppetConfig;
  onUpdate: () => void;
}

const ZOOM_LEVELS = [
  { label: '100%', value: 1.0 },
  { label: '140%', value: 1.4 },
  { label: '180% ★', value: 1.8 },
  { label: '220%', value: 2.2 },
];

export const SpinePreviewCanvas: React.FC<SpinePreviewCanvasProps> = ({ config, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedAction, setSelectedAction] = useState<SpineActionType>('run');
  const [isPlaying, setIsPlaying] = useState(true);
  const [manualPhase, setManualPhase] = useState(0.2);
  const [showWireframe, setShowWireframe] = useState(false);
  const [checkerBg, setCheckerBg] = useState(false);
  const [previewFacingLeft, setPreviewFacingLeft] = useState(false);
  // Default to 180% zoom (1.8x) as requested: "首先得显示样式放大180% 现在太小了 内容"
  const [viewZoom, setViewZoom] = useState<number>(1.8);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const manualPhaseRef = useRef(manualPhase);
  manualPhaseRef.current = manualPhase;
  const blenderRef = useRef<SpineAnimationBlender>(new SpineAnimationBlender('run'));

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localTime = 0;
    let lastStamp = performance.now();

    const renderLoop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastStamp) / 1000));
      lastStamp = now;

      if (isPlayingRef.current) localTime += dt;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (checkerBg) {
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#292524';
        const sz = 16;
        for (let x = 0; x < canvas.width; x += sz) {
          for (let y = 0; y < canvas.height; y += sz) {
            if ((x / sz + y / sz) % 2 === 0) ctx.fillRect(x, y, sz, sz);
          }
        }
      }

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 46);
      ctx.scale(viewZoom, viewZoom);

      const groundY = (config.offsetY || 0) + ModularSpineRenderer.SKELETON_GROUND_ALIGNMENT_Y;
      const overallScale = config.overallScale || 1.0;

      // 1. Acrylic pedestal plate anchored on ground contact surface
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, groundY, 26 * overallScale, 8 * overallScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner soft gold rim
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, groundY, 20 * overallScale, 6 * overallScale, 0, 0, Math.PI * 2);
      ctx.stroke();

      const pose: SkeletonPose = isPlayingRef.current
        ? blenderRef.current.evaluate(selectedAction, localTime, dt)
        : SpineKinematics.computeActionPose(selectedAction, manualPhaseRef.current, true);

      const visualScaleX = CharacterOrientationManager.computeVisualScaleX(
        previewFacingLeft,
        config.defaultArtFacing || 'right',
        !!config.invertFacing
      );
      if (visualScaleX !== 1) ctx.scale(visualScaleX, 1);

      ModularSpineRenderer.renderSpinePuppet(ctx, config, null, localTime, pose);

      if (showWireframe) {
        // Wireframe accurately shares the identical transform matrix as the modular puppet
        ctx.save();
        ctx.translate(0, groundY);
        ctx.scale(overallScale, overallScale);
        SpineWireframeRenderer.drawWireframe(ctx, pose);
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [config, selectedAction, showWireframe, checkerBg, previewFacingLeft, viewZoom]);

  const activeDef = SPINE_ACTION_PRESETS.find((p) => p.id === selectedAction) || SPINE_ACTION_PRESETS[0];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 rounded-xl border border-stone-800 bg-stone-900/70 p-3 sm:p-4">
      {/* Canvas Viewport Box */}
      <div className="relative flex h-60 w-56 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-600/30 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 shadow-inner">
        <canvas ref={canvasRef} width={224} height={240} className="w-full h-full" />

        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] text-amber-300 font-mono border border-stone-700">
          <span>{activeDef.icon}</span>
          <span>{activeDef.label}</span>
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-amber-400 font-mono border border-amber-500/30">
          <ZoomIn className="h-2.5 w-2.5" />
          <span>{(viewZoom * 100).toFixed(0)}% 显示</span>
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => setPreviewFacingLeft((v) => !v)}
            title={`测试素体朝向翻转 (当前:${previewFacingLeft ? '朝左' : '朝右'})`}
            className={`p-1 rounded border text-[10px] transition-colors ${
              previewFacingLeft ? 'border-orange-400 bg-orange-950/80 text-orange-300' : 'border-stone-700 bg-black/60 text-stone-400 hover:text-stone-200'
            }`}
          >
            <ArrowLeftRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setCheckerBg((v) => !v)}
            title="切换透明棋盘格背景"
            className={`p-1 rounded border text-[10px] transition-colors ${
              checkerBg ? 'border-amber-400 bg-amber-950/80 text-amber-300' : 'border-stone-700 bg-black/60 text-stone-400'
            }`}
          >
            <Grid className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowWireframe((v) => !v)}
            title="切换骨骼透视连线"
            className={`p-1 rounded border text-[10px] transition-colors ${
              showWireframe ? 'border-sky-400 bg-sky-950/80 text-sky-300' : 'border-stone-700 bg-black/60 text-stone-400'
            }`}
          >
            <Eye className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Global Puppet Tuning & Motion Selector */}
      <div className="flex flex-1 flex-col gap-2.5 w-full">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-stone-300 font-cinzel flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>动作测试:</span>
          </span>

          <div className="flex items-center gap-1 bg-stone-950/70 border border-stone-800 rounded-lg p-0.5 text-xs">
            <span className="text-[10px] text-stone-400 px-1">显示缩放:</span>
            {ZOOM_LEVELS.map((z) => (
              <button
                key={z.value}
                onClick={() => setViewZoom(z.value)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                  viewZoom === z.value
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {SPINE_ACTION_PRESETS.map((preset) => {
            const isSelected = selectedAction === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedAction(preset.id)}
                className={`flex flex-col items-center justify-center rounded-lg border py-1.5 px-1 text-center transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/60 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)] font-bold'
                    : 'border-stone-700 bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <span className="text-sm">{preset.icon}</span>
                <span className="text-[11px] mt-0.5">{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Playback Controls Component */}
        <SpinePlaybackBar
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          manualPhase={manualPhase}
          onPhaseChange={(phase) => setManualPhase(phase)}
          showWireframe={showWireframe}
          onToggleWireframe={(show) => setShowWireframe(show)}
        />

        {/* Sliders: Overall Scale, Global Offset Y, Weapon Overlay */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-0.5">
          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>角色基础缩放</span>
              <span className="font-mono text-amber-400">{((config.overallScale || 1.0) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1.8"
              step="0.02"
              value={config.overallScale || 1.0}
              onChange={(e) => {
                customSkinManager.updateSpineOverall({ overallScale: parseFloat(e.target.value) });
                onUpdate();
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>着地垂直微调</span>
              <span className="font-mono text-amber-400">{config.offsetY || 0}px</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={config.offsetY || 0}
              onChange={(e) => {
                customSkinManager.updateSpineOverall({ offsetY: parseInt(e.target.value, 10) });
                onUpdate();
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center">
            <label className="flex items-center gap-1.5 text-[11px] text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showWeaponOverlay}
                onChange={(e) => {
                  customSkinManager.updateSpineOverall({ showWeaponOverlay: e.target.checked });
                  onUpdate();
                }}
                className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-400"
              />
              <span>主手挂载武器</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
