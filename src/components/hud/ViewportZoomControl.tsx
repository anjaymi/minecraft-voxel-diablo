import React, { useState, useEffect } from 'react';
import { ZoomIn, Eye } from 'lucide-react';
import { gameViewportManager, ZOOM_PRESETS } from '../../engine/camera/GameViewportManager';

export const ViewportZoomControl: React.FC = () => {
  const [zoom, setZoom] = useState<number>(gameViewportManager.getZoom());
  const [showMenu, setShowMenu] = useState<boolean>(false);

  useEffect(() => {
    return gameViewportManager.subscribe((newZoom) => {
      setZoom(newZoom);
    });
  }, []);

  const currentLabel = ZOOM_PRESETS.find((p) => Math.abs(p.value - zoom) < 0.05)?.label || `${Math.round(zoom * 100)}%`;

  return (
    <div className="relative pointer-events-auto">
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border-2 border-cyan-600/80 bg-gradient-to-b from-cyan-950/90 to-stone-950 px-2.5 py-2 text-xs font-bold text-cyan-200 shadow-lg hover:from-cyan-900 hover:to-stone-900 active:scale-95 transition-all"
        title="场景与怪物缩放比例 (Game Scene & Monster Zoom Scale)"
      >
        <ZoomIn className="h-4 w-4 text-cyan-400" />
        <span>视口: {currentLabel}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg border-2 border-cyan-700/80 bg-stone-950/95 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-fade-in">
          <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 border-b border-stone-800 flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" />
            <span>全景与怪物 2.0头身缩放</span>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            {ZOOM_PRESETS.map((preset) => {
              const isSelected = Math.abs(preset.value - zoom) < 0.05;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    gameViewportManager.setZoom(preset.value);
                    setShowMenu(false);
                  }}
                  className={`flex items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-cyan-900/60 font-bold text-cyan-300 border border-cyan-500/50'
                      : 'text-stone-300 hover:bg-stone-800/80'
                  }`}
                >
                  <span className="font-mono">{preset.label}</span>
                  <span className="text-[10px] text-stone-400">{preset.desc}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
