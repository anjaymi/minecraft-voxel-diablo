import React, { useEffect, useRef } from 'react';
import { CustomSkinConfig } from '../../types';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { RotateCcw, Sliders, Sparkles, Check, Trash2, Eye } from 'lucide-react';

interface SkinPreviewAndTuneProps {
  skin: CustomSkinConfig | null;
  onUpdate: () => void;
}

export const SkinPreviewAndTune: React.FC<SkinPreviewAndTuneProps> = ({ skin, onUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const loop = () => {
      const time = (performance.now() - startTime) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Center in canvas
      ctx.translate(canvas.width / 2, canvas.height / 2 + 36);

      // Acrylic pedestal plate
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 4, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const img = customSkinManager.getLoadedImage();
      if (img && img.complete && img.naturalWidth > 0 && skin?.enabled) {
        // Idle breathing bob
        const bodyBob = skin.bounceAnimation ? Math.sin(time * 3.5) * 3 : 0;
        const scale = skin.scale || 1.0;
        const offsetY = skin.offsetY || 0;

        const baseH = 48 * scale;
        const aspect = img.naturalWidth / img.naturalHeight;
        const baseW = baseH * aspect;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 4, baseW * 0.45, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.imageSmoothingEnabled = baseW < 80;
        ctx.drawImage(img, -baseW / 2, -baseH - bodyBob + offsetY, baseW, baseH);
      } else {
        // Placeholder text
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('默认小人外观', 0, -28);
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [skin]);

  if (!skin || !skin.enabled) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-stone-800 bg-stone-900/50 p-6 text-center text-stone-400">
        <p className="text-xs">当前使用默认小人模型</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-stone-800 bg-stone-900/70 p-4">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Live Canvas Preview */}
        <div className="relative flex h-40 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-700 bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 shadow-inner">
          <canvas ref={canvasRef} width={140} height={160} className="w-full h-full" />
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-amber-300 font-mono">
            <Sparkles className="h-3 w-3" />
            <span>实时动效预览</span>
          </div>
        </div>

        {/* Tuning Controls */}
        <div className="flex flex-1 flex-col gap-3 w-full">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-cinzel tracking-wide flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" />
              <span>外观微调设置 ({skin.name || '自定义外观'})</span>
            </span>
            <button
              onClick={() => {
                customSkinManager.resetToDefault();
                onUpdate();
              }}
              className="flex items-center gap-1 rounded border border-red-500/40 bg-red-950/40 px-2 py-1 text-[11px] text-red-300 hover:bg-red-900/60 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>还原默认</span>
            </button>
          </div>

          {/* Scale Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-stone-300">
              <span>模型缩放倍率</span>
              <span className="font-mono text-amber-400">{((skin.scale || 1.0) * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={skin.scale || 1.0}
              onChange={(e) => {
                customSkinManager.updateSkinParams({ scale: parseFloat(e.target.value) });
                onUpdate();
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
            />
          </div>

          {/* Offset Y Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] text-stone-300">
              <span>垂直对齐修正 (Y轴)</span>
              <span className="font-mono text-amber-400">{skin.offsetY || 0}px</span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="1"
              value={skin.offsetY || 0}
              onChange={(e) => {
                customSkinManager.updateSkinParams({ offsetY: parseInt(e.target.value, 10) });
                onUpdate();
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-stone-700 accent-amber-500"
            />
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={skin.bounceAnimation}
                onChange={(e) => {
                  customSkinManager.updateSkinParams({ bounceAnimation: e.target.checked });
                  onUpdate();
                }}
                className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-400"
              />
              <span>启用呼吸/奔跑轻弹动态</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={skin.showWeaponOverlay}
                onChange={(e) => {
                  customSkinManager.updateSkinParams({ showWeaponOverlay: e.target.checked });
                  onUpdate();
                }}
                className="rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-400"
              />
              <span>附着手持武器图层</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
