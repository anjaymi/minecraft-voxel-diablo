import React from 'react';

interface GameGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameGuideModal: React.FC<GameGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border-2 border-stone-700 bg-stone-900 p-4 sm:p-6 text-stone-200 shadow-2xl max-h-[92vh] overflow-y-auto safe-top safe-bottom"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold font-cinzel text-amber-400 mb-3">
          🎮 方块暗黑破坏神 · 操作与玩法指南
        </h2>
        <div className="space-y-2.5 text-xs text-stone-300 font-sans leading-relaxed">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-300 font-mono">WASD / 鼠标左键:</span>
            <span>控制角色移动，左键近战挥剑砍杀，右键发射多重破甲箭矢。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-300 font-mono">空格 (Space):</span>
            <span>战术翻滚冲刺，带有短暂无敌帧，可穿梭突破怪群包围。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-300 font-mono">数字键 1 / 2 / 3:</span>
            <span>[1]投掷TNT引信炸药桶、[2]金苹果生命吸收护盾、[3]末影珍珠震波传送。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-red-400 font-mono">按键 V / 动效按钮:</span>
            <span>[V / 点击动效] 唤起攻击动效控制器，实时调节关键帧手腕与武器插槽补间角度，体验丝滑斩击！</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-purple-400 font-mono">按键 C / 职业导师:</span>
            <span>[C / 点击导师NPC] 切换六大职业专精（战士/游侠/盗贼/奥术法师/死灵召唤师/荒野德鲁伊）。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-300 font-mono">按键 P / 换肤按钮:</span>
            <span>[P] 唤起自定义角色外观面板，可上传本地透明 PNG 图片立绘，或一键选用精选预设！</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-emerald-400 font-mono">按键 H / F3:</span>
            <span>开启/关闭碰撞体积调试层，可视化角色绿色胶囊体、障碍物红色等轴线框及实时坐标。</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-300 font-mono">打击反馈 & 动态阴影:</span>
            <span>近战命中产生顿挫帧冻结(Hit Stop)与震屏，全动态高斯投影强化空间层次！</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-amber-600 hover:bg-amber-500 py-2 text-xs font-bold text-black transition-colors"
        >
          明白，进入冒险！
        </button>
      </div>
    </div>
  );
};
