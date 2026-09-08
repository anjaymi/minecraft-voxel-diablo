import React from 'react';
import { Settings } from 'lucide-react';

interface GameTopBarControlsProps {
  onOpenSettings: () => void;
}

/** 主界面左上角：单一设置入口（原音效/指南/调试按钮已收纳进 SettingsModal） */
export const GameTopBarControls: React.FC<GameTopBarControlsProps> = ({ onOpenSettings }) => {
  return (
    <div
      className="absolute top-4 left-4 z-30 flex items-center gap-2 pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 rounded-lg border border-stone-700 bg-stone-900/80 px-3 py-2 text-stone-300 shadow transition-colors hover:text-white hover:bg-stone-800"
        title="设置（音效 / 显示 / 调试工具）"
      >
        <Settings className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-bold">设置</span>
      </button>
    </div>
  );
};
