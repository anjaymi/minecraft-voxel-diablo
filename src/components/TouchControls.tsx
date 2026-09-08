import React, { useRef, useState, useCallback } from 'react';

interface TouchControlsProps {
  onMove: (x: number, y: number) => void; // 摇杆方向（已归一化，模长 0~1）
  onDash: () => void;
  onInteract: () => void;
  onSecondaryAttack: (down: boolean) => void; // 副手特技按住/松开
}

/**
 * TouchControls — 移动端虚拟操控层（仅触屏设备渲染）。
 *
 * 左下：浮动摇杆（触点即中心，拖动控制方向，松开回中）；
 * 右下：技能圆钮（冲刺 / 交互 / 副手特技）。
 * 全部 pointer-events-auto，不遮挡画布其余区域。
 */
export const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onDash,
  onInteract,
  onSecondaryAttack,
}) => {
  const [stick, setStick] = useState<{ active: boolean; ox: number; oy: number; dx: number; dy: number }>({
    active: false, ox: 0, oy: 0, dx: 0, dy: 0,
  });
  const stickIdRef = useRef<number | null>(null);
  const STICK_R = 52; // 摇杆最大行程（像素）

  const handleStickStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    if (!t || stickIdRef.current !== null) return;
    e.preventDefault();
    stickIdRef.current = t.identifier;
    setStick({ active: true, ox: t.clientX, oy: t.clientY, dx: 0, dy: 0 });
  }, []);

  const handleStickMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const id = stickIdRef.current;
      if (id === null) return;
      const t = [...e.changedTouches].find((tt) => tt.identifier === id);
      if (!t) return;
      e.preventDefault();

      let dx = t.clientX - stick.ox;
      let dy = t.clientY - stick.oy;
      const len = Math.hypot(dx, dy);
      if (len > STICK_R) {
        dx = (dx / len) * STICK_R;
        dy = (dy / len) * STICK_R;
      }
      setStick((s) => ({ ...s, dx, dy }));
      // 死区 0.18，避免误触
      const nLen = Math.hypot(dx, dy) / STICK_R;
      if (nLen < 0.18) {
        onMove(0, 0);
      } else {
        onMove(dx / STICK_R, dy / STICK_R);
      }
    },
    [stick.ox, stick.oy, onMove]
  );

  const handleStickEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const id = stickIdRef.current;
      if (id === null) return;
      const t = [...e.changedTouches].find((tt) => tt.identifier === id);
      if (!t) return;
      e.preventDefault();
      stickIdRef.current = null;
      setStick({ active: false, ox: 0, oy: 0, dx: 0, dy: 0 });
      onMove(0, 0);
    },
    [onMove]
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-40 select-none md:hidden">
      {/* 左下浮动摇杆区（半屏高触发带） */}
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[45%] w-[42%]"
        onTouchStart={handleStickStart}
        onTouchMove={handleStickMove}
        onTouchEnd={handleStickEnd}
        onTouchCancel={handleStickEnd}
      >
        {stick.active ? (
          <div className="absolute" style={{ left: stick.ox, top: stick.oy, transform: 'translate(-50%, -50%)' }}>
            <div className="h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/25 bg-stone-900/30 absolute" />
            <div
              className="h-14 w-14 rounded-full border-2 border-amber-300/80 bg-stone-800/80 shadow-[0_0_16px_rgba(251,191,36,0.4)]"
              style={{ transform: `translate(calc(-50% + ${stick.dx}px), calc(-50% + ${stick.dy}px))` }}
            />
          </div>
        ) : (
          <div className="absolute bottom-8 left-8 flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/15 bg-stone-900/25 backdrop-blur-[2px]">
            <span className="text-[10px] font-bold text-stone-400/70">摇杆</span>
          </div>
        )}
      </div>

      {/* 右下技能按钮簇 */}
      <div className="pointer-events-auto absolute bottom-8 right-5 flex flex-col items-end gap-3 safe-right safe-bottom">
        {/* 副手特技（按住） */}
        <button
          className="touch-btn flex h-14 w-14 items-center justify-center rounded-full border-2 border-sky-400/70 bg-sky-950/70 text-xl shadow-[0_0_14px_rgba(56,189,248,0.35)] active:bg-sky-900/80"
          onTouchStart={(e) => {
            e.preventDefault();
            onSecondaryAttack(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onSecondaryAttack(false);
          }}
        >
          ⚡
        </button>
        <div className="flex items-end gap-3">
          {/* 交互 */}
          <button
            className="touch-btn flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400/70 bg-emerald-950/70 text-xl font-black text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.35)]"
            onTouchStart={(e) => {
              e.preventDefault();
              onInteract();
            }}
          >
            E
          </button>
          {/* 冲刺 */}
          <button
            className="touch-btn flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/80 bg-amber-950/70 text-2xl shadow-[0_0_16px_rgba(251,191,36,0.4)]"
            onTouchStart={(e) => {
              e.preventDefault();
              onDash();
            }}
          >
            💨
          </button>
        </div>
      </div>
    </div>
  );
};
