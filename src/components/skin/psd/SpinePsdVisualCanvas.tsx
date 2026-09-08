import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PsdParseResult, PsdSlotBinding } from '../../../engine/skin/psd/spinePsdTypes';
import { SpineSlotKey } from '../../../engine/skin/spineTypes';
import { Eye, Layers, Crosshair } from 'lucide-react';

interface SpinePsdVisualCanvasProps {
  parseResult: PsdParseResult;
  slotBindings: Record<SpineSlotKey, PsdSlotBinding>;
  onUpdateMarker: (slotKey: SpineSlotKey, newPsdX: number, newPsdY: number) => void;
  selectedSlotKey: SpineSlotKey;
  onSelectSlot: (slotKey: SpineSlotKey) => void;
}

const SLOT_COLORS: Record<SpineSlotKey, string> = {
  head: '#fbbf24',
  torso: '#60a5fa',
  armRight: '#f87171',
  armLeft: '#c084fc',
  legRight: '#34d399',
  legLeft: '#2dd4bf',
};

export const SpinePsdVisualCanvas: React.FC<SpinePsdVisualCanvasProps> = ({
  parseResult,
  slotBindings,
  onUpdateMarker,
  selectedSlotKey,
  onSelectSlot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [showBones, setShowBones] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [draggingSlot, setDraggingSlot] = useState<SpineSlotKey | null>(null);

  const psdW = parseResult.psdWidth || 256;
  const psdH = parseResult.psdHeight || 256;

  // Viewport display size
  const viewSize = 340;
  const scale = viewSize / Math.max(psdW, psdH);
  const offsetX = (viewSize - psdW * scale) / 2;
  const offsetY = (viewSize - psdH * scale) / 2;

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Checkerboard Background
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const checkSize = 12;
    ctx.fillStyle = '#1f2937';
    for (let y = 0; y < canvas.height; y += checkSize * 2) {
      for (let x = 0; x < canvas.width; x += checkSize * 2) {
        ctx.fillRect(x, y, checkSize, checkSize);
        ctx.fillRect(x + checkSize, y + checkSize, checkSize, checkSize);
      }
    }

    // 2. Render PSD Composite or Layer Canvases
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // PSD Canvas Border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1 / scale;
    ctx.strokeRect(0, 0, psdW, psdH);

    // Draw individual layer canvases
    const keys = Object.keys(slotBindings) as SpineSlotKey[];
    for (const k of keys) {
      const binding = slotBindings[k];
      const layer = binding.matchedLayer;
      if (layer && layer.canvas && !layer.hidden) {
        ctx.drawImage(layer.canvas, layer.left, layer.top);
      }
    }

    // 3. Photoshop Guides
    if (showGuides && parseResult.guides) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.setLineDash([3 / scale, 3 / scale]);
      ctx.lineWidth = 1 / scale;

      for (const gx of parseResult.guides.x) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, psdH);
        ctx.stroke();
      }
      for (const gy of parseResult.guides.y) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(psdW, gy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 4. Bounding Boxes
    if (showBoxes) {
      for (const k of keys) {
        const binding = slotBindings[k];
        const layer = binding.matchedLayer;
        if (!layer) continue;

        const isSelected = selectedSlotKey === k;
        const col = SLOT_COLORS[k];

        ctx.strokeStyle = isSelected ? '#f59e0b' : col;
        ctx.lineWidth = (isSelected ? 2 : 1) / scale;
        ctx.strokeRect(layer.left, layer.top, layer.width, layer.height);

        // Label
        ctx.fillStyle = isSelected ? '#fef08a' : col;
        ctx.font = `${Math.max(9, Math.round(9 / scale))}px sans-serif`;
        ctx.fillText(binding.slotLabel.split(' ')[0], layer.left + 2 / scale, layer.top + 10 / scale);
      }
    }

    // 5. Bone Hierarchy Lines
    if (showBones) {
      const torsoM = slotBindings.torso?.boneMarker;
      if (torsoM) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1.5 / scale;
        const targets: SpineSlotKey[] = ['head', 'armLeft', 'armRight', 'legLeft', 'legRight'];
        for (const t of targets) {
          const m = slotBindings[t]?.boneMarker;
          if (m) {
            ctx.beginPath();
            ctx.moveTo(torsoM.psdX, torsoM.psdY);
            ctx.lineTo(m.psdX, m.psdY);
            ctx.stroke();
          }
        }
      }
    }

    // 6. Bone Anchor Markers
    for (const k of keys) {
      const binding = slotBindings[k];
      const m = binding.boneMarker;
      if (!m) continue;

      const isSelected = selectedSlotKey === k;
      const col = SLOT_COLORS[k];

      // Draw Marker Circle
      ctx.fillStyle = isSelected ? '#f59e0b' : col;
      ctx.beginPath();
      ctx.arc(m.psdX, m.psdY, (isSelected ? 5.5 : 4) / scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2 / scale;
      ctx.stroke();

      // Crosshair lines
      ctx.strokeStyle = isSelected ? '#fef08a' : col;
      ctx.lineWidth = 1 / scale;
      const armLen = 7 / scale;
      ctx.beginPath();
      ctx.moveTo(m.psdX - armLen, m.psdY);
      ctx.lineTo(m.psdX + armLen, m.psdY);
      ctx.moveTo(m.psdX, m.psdY - armLen);
      ctx.lineTo(m.psdX, m.psdY + armLen);
      ctx.stroke();
    }

    ctx.restore();
  }, [parseResult, slotBindings, selectedSlotKey, showBoxes, showBones, showGuides, scale, offsetX, offsetY, psdW, psdH]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Handle Mouse Drag on Marker
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offsetX) / scale;
    const my = (e.clientY - rect.top - offsetY) / scale;

    // Check hit on any marker
    const keys = Object.keys(slotBindings) as SpineSlotKey[];
    for (const k of keys) {
      const m = slotBindings[k]?.boneMarker;
      if (!m) continue;
      const dist = Math.hypot(m.psdX - mx, m.psdY - my);
      if (dist < 12 / scale) {
        setDraggingSlot(k);
        onSelectSlot(k);
        return;
      }
    }

    // If clicked inside layer box, select it
    for (const k of keys) {
      const layer = slotBindings[k]?.matchedLayer;
      if (layer && mx >= layer.left && mx <= layer.right && my >= layer.top && my <= layer.bottom) {
        onSelectSlot(k);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingSlot) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const curPsdX = Math.round((e.clientX - rect.left - offsetX) / scale);
    const curPsdY = Math.round((e.clientY - rect.top - offsetY) / scale);

    onUpdateMarker(draggingSlot, Math.max(0, Math.min(psdW, curPsdX)), Math.max(0, Math.min(psdH, curPsdY)));
  };

  const handleMouseUp = () => {
    setDraggingSlot(null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Canvas Box */}
      <div className="relative rounded-xl border border-stone-800 bg-stone-950 overflow-hidden shadow-inner cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={viewSize}
          height={viewSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block"
        />

        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/80 px-2 py-1 text-[10px] font-mono text-stone-300 border border-stone-700/60">
          <Crosshair className="h-3 w-3 text-amber-400" />
          <span>PSD画布: {psdW}×{psdH}px</span>
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setShowBoxes((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 transition-colors ${
            showBoxes
              ? 'border-blue-500/50 bg-blue-950/60 text-blue-300'
              : 'border-stone-800 bg-stone-900 text-stone-400'
          }`}
        >
          <Layers className="h-3 w-3" />
          <span>图层边框</span>
        </button>

        <button
          onClick={() => setShowBones((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 transition-colors ${
            showBones
              ? 'border-amber-500/50 bg-amber-950/60 text-amber-300'
              : 'border-stone-800 bg-stone-900 text-stone-400'
          }`}
        >
          <Crosshair className="h-3 w-3" />
          <span>骨骼连线与点</span>
        </button>

        <button
          onClick={() => setShowGuides((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 transition-colors ${
            showGuides
              ? 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300'
              : 'border-stone-800 bg-stone-900 text-stone-400'
          }`}
        >
          <Eye className="h-3 w-3" />
          <span>参考线</span>
        </button>
      </div>
    </div>
  );
};
