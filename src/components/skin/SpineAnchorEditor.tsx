import React, { useRef, useState, useEffect, useCallback } from 'react';
import { customSkinManager } from '../../engine/skin/CustomSkinManager';
import { SpineSlotKey } from '../../engine/skin/spineTypes';
import { ModularSpineRenderer } from '../../engine/skin/ModularSpineRenderer';
import { SpineKinematics } from '../../engine/skin/SpineKinematics';
import { SPINE_PART_SPECS } from '../../engine/skin/SpineSpecExporter';
import { Move, Target, FileCode } from 'lucide-react';
import { AnchorNudgePad } from './AnchorNudgePad';

interface SpineAnchorEditorProps {
  onUpdate: () => void;
  onSwitchToPsd?: () => void;
}

const SLOT_OPTIONS: { key: SpineSlotKey; label: string; icon: string }[] = [
  { key: 'head', label: '头部', icon: '👤' },
  { key: 'torso', label: '躯干', icon: '👕' },
  { key: 'armRight', label: '右臂(主手)', icon: '🦾' },
  { key: 'armLeft', label: '左臂(副手)', icon: '🦾' },
  { key: 'legRight', label: '右腿(前)', icon: '🦵' },
  { key: 'legLeft', label: '左腿(后)', icon: '🦵' },
];

export const SpineAnchorEditor: React.FC<SpineAnchorEditorProps> = ({ onUpdate, onSwitchToPsd }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SpineSlotKey>('head');
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startOffsetX: number; startOffsetY: number }>({
    mouseX: 0,
    mouseY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  const puppet = customSkinManager.getSpinePuppet();
  const slotData = puppet.slots[selectedSlot];
  const spec = SPINE_PART_SPECS[selectedSlot];

  const scale = 2.4;
  const centerX = 180;
  const centerY = 150;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Grid Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    const step = 20;
    for (let x = 0; x <= canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Origin Crosshair
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Render Neutral Calibration Pose
    const pose = SpineKinematics.computeActionPose('idle', 0, true);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scale, scale);

    ModularSpineRenderer.renderSpinePuppet(ctx, puppet, null, 0, pose);
    ctx.restore();

    // 3. Highlight Selected Slot Anchor & Bounding Gizmo
    const bone = pose[selectedSlot];
    if (bone && slotData) {
      const boneScreenX = centerX + (bone.x + slotData.offsetX) * scale;
      const boneScreenY = centerY + (bone.y + slotData.offsetY) * scale;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(boneScreenX, boneScreenY, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fill();

      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(boneScreenX - 18, boneScreenY);
      ctx.lineTo(boneScreenX + 18, boneScreenY);
      ctx.moveTo(boneScreenX, boneScreenY - 18);
      ctx.lineTo(boneScreenX, boneScreenY + 18);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        `${slotData.name} Δ(${slotData.offsetX > 0 ? '+' : ''}${slotData.offsetX}, ${slotData.offsetY > 0 ? '+' : ''}${slotData.offsetY})`,
        boneScreenX + 18,
        boneScreenY - 6
      );
    }
  }, [puppet, selectedSlot, slotData]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !slotData) return;
    const rect = canvas.getBoundingClientRect();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX - rect.left,
      mouseY: e.clientY - rect.top,
      startOffsetX: slotData.offsetX ?? 0,
      startOffsetY: slotData.offsetY ?? 0,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !slotData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curX = e.clientX - rect.left;
    const curY = e.clientY - rect.top;

    const dx = (curX - dragStartRef.current.mouseX) / scale;
    const dy = (curY - dragStartRef.current.mouseY) / scale;

    const newX = Math.max(-30, Math.min(30, Math.round((dragStartRef.current.startOffsetX + dx) * 2) / 2));
    const newY = Math.max(-30, Math.min(30, Math.round((dragStartRef.current.startOffsetY + dy) * 2) / 2));

    customSkinManager.updateSpineSlot(selectedSlot, { offsetX: newX, offsetY: newY });
    onUpdate();
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleNudge = (dx: number, dy: number) => {
    if (!slotData) return;
    const newX = Math.max(-30, Math.min(30, Number((slotData.offsetX + dx).toFixed(1))));
    const newY = Math.max(-30, Math.min(30, Number((slotData.offsetY + dy).toFixed(1))));
    customSkinManager.updateSpineSlot(selectedSlot, { offsetX: newX, offsetY: newY });
    onUpdate();
  };

  const handleReset = () => {
    if (!spec) return;
    customSkinManager.updateSpineSlot(selectedSlot, {
      pivotX: spec.defaultPivotX,
      pivotY: spec.defaultPivotY,
      offsetX: 0,
      offsetY: 0,
    });
    onUpdate();
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-stone-800 bg-stone-900/60 p-3 text-stone-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-stone-800 pb-2 gap-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-300 font-cinzel">骨骼锚点与对齐编辑器 (Anchor & Seam Editor)</span>
        </div>
        <div className="flex items-center gap-2">
          {onSwitchToPsd && (
            <button
              onClick={onSwitchToPsd}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-700/60 bg-cyan-950/70 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/90 transition-colors shadow"
            >
              <FileCode className="h-3.5 w-3.5 text-cyan-400" />
              <span>导入 PSD 骨骼点与图层</span>
            </button>
          )}
          <span className="text-xs text-stone-400 hidden sm:inline">拖动画布金色锚点，消除肢体缝隙</span>
        </div>
      </div>

      {/* Slot Selector */}
      <div className="flex flex-wrap gap-1.5">
        {SLOT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelectedSlot(opt.key)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
              selectedSlot === opt.key
                ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.25)]'
                : 'border-stone-800 bg-stone-900/70 text-stone-400 hover:text-stone-200'
            }`}
          >
            <span>{opt.icon}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Main Work Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-7 flex flex-col items-center">
          <div className="relative rounded-lg border border-stone-700 bg-black overflow-hidden shadow-inner cursor-move">
            <canvas
              ref={canvasRef}
              width={360}
              height={290}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="block"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-amber-300/90 border border-amber-500/30">
              <Move className="h-3 w-3" />
              <span>按住鼠标拖拽锚点</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-5">
          <AnchorNudgePad
            slotData={slotData}
            spec={spec}
            onNudge={handleNudge}
            onReset={handleReset}
          />
        </div>
      </div>
    </div>
  );
};
