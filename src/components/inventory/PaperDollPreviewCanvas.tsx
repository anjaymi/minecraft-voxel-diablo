import React, { useEffect, useRef } from 'react';
import { Player } from '../../types';
import { GoodSmilePlayerRenderer } from '../../engine/goodsmile/GoodSmilePlayerRenderer';
import { CustomSkinRenderer } from '../../engine/skin/CustomSkinRenderer';
import { CharacterOrientationManager } from '../../engine/orientation/CharacterOrientationManager';

interface PaperDollPreviewCanvasProps {
  player: Player;
}

export const PaperDollPreviewCanvas: React.FC<PaperDollPreviewCanvasProps> = ({ player }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const renderLoop = () => {
      const now = performance.now();
      const time = (now - startTime) / 1000;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Center & scale for high-res crisp Nendoroid doll view
      ctx.translate(canvas.width / 2, canvas.height / 2 + 32);
      ctx.scale(1.4, 1.4);

      // Create a static idle clone of player for showcase
      const showcasePlayer: Player = {
        ...player,
        vx: 0,
        vy: 0,
        facingAngle: 0, // Face forward/right
      };

      const orientation = CharacterOrientationManager.resolveOrientation(showcasePlayer, undefined, undefined, {
        facingMode: 'fixed_right',
      });
      CharacterOrientationManager.applyOrientation(ctx, orientation);

      const hasCustom = CustomSkinRenderer.renderCustomSkin(ctx, showcasePlayer, time, orientation.isFacingLeft);
      if (!hasCustom) {
        GoodSmilePlayerRenderer.renderFigurine(ctx, showcasePlayer, time, orientation.isFacingLeft);
      }
      ctx.restore();

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [player]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={220}
      className="absolute pointer-events-none z-0 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] opacity-95"
    />
  );
};
