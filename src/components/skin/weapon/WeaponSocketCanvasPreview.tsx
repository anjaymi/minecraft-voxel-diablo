import React, { useEffect, useRef, useState } from 'react';
import { Player, WeaponSubType } from '../../../types';
import { SpinePuppetConfig } from '../../../engine/skin/spineTypes';
import { PlayerWeaponManager } from '../../../engine/weapons/PlayerWeaponManager';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Grid, Crosshair } from 'lucide-react';

interface WeaponSocketCanvasPreviewProps {
  config: SpinePuppetConfig;
  player?: Player;
  onUpdateOffset?: (x: number, y: number) => void;
}

const WEAPON_TEST_TYPES: { id: WeaponSubType; name: string; icon: string }[] = [
  { id: 'sword', name: '单手剑', icon: '⚔️' },
  { id: 'greatsword', name: '双手巨剑', icon: '🗡️' },
  { id: 'dagger', name: '刺客匕首', icon: '🥷' },
  { id: 'axe', name: '狂暴战斧', icon: '🪓' },
  { id: 'hammer', name: '重装战锤', icon: '🔨' },
  { id: 'staff', name: '奥术法杖', icon: '🪄' },
  { id: 'bow', name: '长弓', icon: '🏹' },
];

export const WeaponSocketCanvasPreview: React.FC<WeaponSocketCanvasPreviewProps> = ({
  config,
  player,
  onUpdateOffset,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(2.0);
  const [showGrid, setShowGrid] = useState(true);
  const [showSkeletonReference, setShowSkeletonReference] = useState(true);
  const [selectedWeaponType, setSelectedWeaponType] = useState<WeaponSubType>(
    (player?.equipment?.weapon?.subType as WeaponSubType) || 'sword'
  );

  const offX = config.weaponOffsetX ?? 0;
  const offY = config.weaponOffsetY ?? 0;
  const rotDeg = config.weaponRotationDeg ?? 0;
  const scale = config.weaponScale ?? 1.0;
  const flipX = !!config.weaponFlipX;
  const flipY = !!config.weaponFlipY;
  const isLeft = config.weaponHand === 'left';

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const time = performance.now() / 1000;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2 + 10; // slightly shifted down so head at -38px has room

      ctx.clearRect(0, 0, width, height);

      // 1. Dark Blueprint Background
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, width, height);

      // 2. Coordinate Grid (Major & Minor)
      if (showGrid) {
        ctx.save();
        const step = 20 * zoom;
        const subStep = 10 * zoom;

        // Minor grid
        ctx.strokeStyle = 'rgba(68, 64, 60, 0.25)';
        ctx.lineWidth = 1;
        for (let x = (centerX % subStep); x < width; x += subStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = (centerY % subStep); y < height; y += subStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Major grid
        ctx.strokeStyle = 'rgba(120, 113, 108, 0.4)';
        for (let x = (centerX % step); x < width; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = (centerY % step); y < height; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Axes (Passing through hand bone 0,0)
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)'; // X Axis (Amber)
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)'; // Y Axis (Emerald)
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, height);
        ctx.stroke();

        // Pixel Coordinate Labels
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(168, 162, 158, 0.65)';
        [-40, -20, 20, 40].forEach((val) => {
          ctx.fillText(`${val}`, centerX + val * zoom - 6, centerY + 12);
          ctx.fillText(`${val}`, centerX + 4, centerY + val * zoom + 3);
        });

        ctx.restore();
      }

      // 3. Body Skeleton Reference (Head vs Arm vs Hand)
      if (showSkeletonReference) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(zoom, zoom);

        // Head Marker (at y: -38px)
        const headY = -38;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(0, headY, 12, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fill();

        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 7px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ 头部位置 (-38px)', 0, headY - 14);
        ctx.font = '6px sans-serif';
        ctx.fillStyle = '#fca5a5';
        ctx.fillText('武器不应在此', 0, headY + 2);

        // Arm connecting to hand
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(isLeft ? 8 : -8, -16);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Hand / Fist socket representation at (0, 0)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      }

      // 4. Hand Bone Socket Crosshair & Indicator at (0, 0)
      ctx.save();
      const pulse = 1 + Math.sin(time * 4) * 0.15;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 7 * pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🎯 手掌骨骼点 (0, 0)', centerX + 12, centerY - 8);
      ctx.restore();

      // 5. Draw Offset Vector from (0,0) to weapon anchor
      if (offX !== 0 || offY !== 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + offX * zoom, centerY + offY * zoom);
        ctx.stroke();

        ctx.fillStyle = '#fda4af';
        ctx.font = '9px monospace';
        ctx.fillText(`Δ (${offX > 0 ? '+' : ''}${offX}, ${offY > 0 ? '+' : ''}${offY})`, centerX + offX * zoom + 5, centerY + offY * zoom - 5);
        ctx.restore();
      }

      // 6. Draw Weapon with dynamic transforms relative to Hand Bone
      ctx.save();
      ctx.translate(centerX + offX * zoom, centerY + offY * zoom);
      ctx.scale(zoom, zoom);

      if (rotDeg !== 0) {
        ctx.rotate((rotDeg * Math.PI) / 180);
      }

      const totalScaleX = (flipX ? -1 : 1) * scale;
      const totalScaleY = (flipY ? -1 : 1) * scale;
      if (totalScaleX !== 1.0 || totalScaleY !== 1.0) {
        ctx.scale(totalScaleX, totalScaleY);
      }

      const mockPlayer: Partial<Player> = {
        equipment: {
          weapon: {
            id: 'preview_weap',
            name: '测试武器',
            type: 'weapon',
            subType: selectedWeaponType,
            rarity: 'epic',
            level: 1,
            stats: { damage: 30 },
            icon: '🗡️',
          } as any,
        } as any,
        characterClass: (player?.characterClass || 'warrior') as any,
        isAttacking: false,
      };

      PlayerWeaponManager.drawMainWeapon(ctx, mockPlayer as Player, time, true);
      ctx.restore();

      // 7. Aim & Firing Vector Indicator (Forward direction along character facing)
      ctx.save();
      ctx.translate(centerX + offX * zoom, centerY + offY * zoom);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(8 * zoom, 0);
      ctx.lineTo(32 * zoom, 0);
      ctx.stroke();
      // Arrow head pointing forward
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(32 * zoom, 0);
      ctx.lineTo(26 * zoom, -3 * zoom);
      ctx.lineTo(26 * zoom, 3 * zoom);
      ctx.closePath();
      ctx.fill();
      ctx.font = '8px sans-serif';
      ctx.fillText('发射/斩击朝向 ➔', 10 * zoom, -4);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [zoom, showGrid, showSkeletonReference, offX, offY, rotDeg, scale, flipX, flipY, isLeft, selectedWeaponType, player]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-stone-800 bg-stone-950/80 p-3 shadow-inner">
      {/* Top Controls: Weapon Type & Zoom & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-2">
        {/* Weapon Type Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-medium">武器类型:</span>
          <div className="flex flex-wrap gap-1">
            {WEAPON_TEST_TYPES.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWeaponType(w.id)}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors ${
                  selectedWeaponType === w.id
                    ? 'border border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                    : 'bg-stone-900 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <span>{w.icon}</span>
                <span>{w.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Zoom & View Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="显示/隐藏网格"
            className={`rounded p-1 text-xs transition-colors ${
              showGrid ? 'bg-amber-500/20 text-amber-300' : 'bg-stone-900 text-stone-500 hover:text-stone-300'
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSkeletonReference(!showSkeletonReference)}
            title="显示/隐藏身体参照(头部与小臂)"
            className={`rounded p-1 text-xs transition-colors ${
              showSkeletonReference ? 'bg-cyan-500/20 text-cyan-300' : 'bg-stone-900 text-stone-500 hover:text-stone-300'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <div className="flex items-center gap-0.5 rounded bg-stone-900 p-0.5 border border-stone-800">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1.0, z - 0.5))}
              className="rounded p-1 text-stone-400 hover:text-stone-200"
              title="缩小"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="px-1 text-[10px] font-mono text-amber-300">{zoom.toFixed(1)}x</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3.5, z + 0.5))}
              className="rounded p-1 text-stone-400 hover:text-stone-200"
              title="放大"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(2.0)}
              className="rounded p-1 text-stone-400 hover:text-stone-200"
              title="重置缩放"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex justify-center items-center overflow-hidden rounded-lg border border-stone-800 bg-stone-950">
        <canvas
          ref={canvasRef}
          width={380}
          height={260}
          className="block w-full max-w-[420px] aspect-[19/13]"
        />

        {/* Live Vector Overlay Badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-md bg-stone-900/90 border border-stone-800 px-2 py-1 text-[10px] font-mono text-stone-300 backdrop-blur-sm">
          <span className="text-amber-400 font-bold">手掌偏移:</span>
          <span>X: {offX > 0 ? `+${offX}` : offX}px</span>
          <span>Y: {offY > 0 ? `+${offY}` : offY}px</span>
          <span className="text-cyan-400">旋转: {rotDeg}°</span>
        </div>
      </div>
    </div>
  );
};
