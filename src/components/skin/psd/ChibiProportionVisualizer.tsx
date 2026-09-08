import React, { useRef, useEffect, useState } from 'react';
import { ChibiStandardProfile, ChibiPartSpec } from '../../../engine/skin/psd/ChibiProportionStandards';
import { ZoomIn, Eye, Sparkles } from 'lucide-react';

interface ChibiProportionVisualizerProps {
  profile: ChibiStandardProfile;
}

export const ChibiProportionVisualizer: React.FC<ChibiProportionVisualizerProps> = ({ profile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Default to 1.8x (180%) display scaling as requested by user
  const [scale180, setScale180] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showBonePoints, setShowBonePoints] = useState(true);

  const zoomFactor = scale180 ? 1.8 : 1.0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Blueprint dark grid background
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1;
    const gridStep = 16 * zoomFactor;
    for (let x = 0; x <= canvas.width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.save();
    // Center alignment in viewport
    const offsetX = (canvas.width - profile.canvasSize * (zoomFactor * 0.45)) / 2;
    const offsetY = 12;
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoomFactor * 0.45, zoomFactor * 0.45);

    // 2. Draw 512x512 Canvas Outline Box
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.lineWidth = 2 / (zoomFactor * 0.45);
    ctx.strokeRect(0, 0, 512, 512);

    // Ground line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.beginPath();
    ctx.ellipse(256, 400, 110, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Draw Part Bounding Boxes & Stylized Silhouettes
    const parts: ChibiPartSpec[] = Object.values(profile.parts) as ChibiPartSpec[];
    for (const part of parts) {
      // Part box
      ctx.fillStyle = `${part.color}15`;
      ctx.fillRect(part.left, part.top, part.width, part.height);
      ctx.strokeStyle = part.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(part.left, part.top, part.width, part.height);

      // Part label inside box
      ctx.fillStyle = part.color;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(part.slot, part.left + 4, part.top + 14);

      // Bone Crosshair
      if (showBonePoints) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        const bX = part.boneX;
        const bY = part.boneY;

        ctx.beginPath();
        ctx.arc(bX, bY, 5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bX - 8, bY);
        ctx.lineTo(bX + 8, bY);
        ctx.moveTo(bX, bY - 8);
        ctx.lineTo(bX, bY + 8);
        ctx.stroke();
      }
    }

    // 4. Photoshop Guide lines
    if (showGuides && profile.guides) {
      ctx.setLineDash([4, 4]);
      for (const g of profile.guides) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (g.direction === 'horizontal') {
          ctx.moveTo(0, g.location);
          ctx.lineTo(512, g.location);
        } else {
          ctx.moveTo(g.location, 0);
          ctx.lineTo(g.location, 512);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [profile, zoomFactor, showGuides, showBonePoints]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-stone-800 bg-stone-900/90 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-400">
            <Sparkles className="h-4 w-4" />
            <span>人体比例与骨骼层级解构视口</span>
          </span>
          {profile.isGameNative && (
            <span className="rounded-full bg-emerald-950/80 border border-emerald-500/50 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              🟢 当前游戏实装原生比例
            </span>
          )}
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale180((v) => !v)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold border transition-all ${
              scale180
                ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                : 'border-stone-700 bg-stone-800 text-stone-300'
            }`}
          >
            <ZoomIn className="h-3.5 w-3.5 text-amber-400" />
            <span>{scale180 ? '✨ 180% 超清放大视口' : '100% 原始视口'}</span>
          </button>

          <button
            onClick={() => setShowGuides((v) => !v)}
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              showGuides
                ? 'border-cyan-500/60 bg-cyan-950/60 text-cyan-300'
                : 'border-stone-700 bg-stone-800 text-stone-400'
            }`}
            title="显示/隐藏 PS 标尺参考线"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="relative flex h-64 sm:h-72 w-full items-center justify-center overflow-hidden rounded-lg border border-stone-800 bg-stone-950">
        <canvas ref={canvasRef} width={480} height={280} className="w-full h-full object-contain" />

        {/* Floating Stat Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 text-[11px] bg-black/80 p-2 rounded-lg border border-stone-800 backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">标准类型:</span>
            <span className="font-bold text-amber-300">{profile.title.split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">比例分配:</span>
            <span className="font-bold text-cyan-300">{profile.gameProportionRatio || `${Math.round(profile.headRatio * 100)}% 头部 : ${Math.round(profile.bodyRatio * 100)}% 身体`}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">标准画布:</span>
            <span className="font-mono text-stone-300">512 × 512 px (72DPI)</span>
          </div>
        </div>

        {/* Real-time Alignment Help */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded-lg border border-stone-800 text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500"></span>
            <span>红点: 骨骼旋转中心</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-400"></span>
            <span>青线: PS 参考线</span>
          </span>
        </div>
      </div>
    </div>
  );
};
