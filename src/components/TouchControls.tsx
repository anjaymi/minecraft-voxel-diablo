import React, { useRef, useState, useCallback } from 'react';
import { Player } from '../types';
import { SKILLS } from '../engine/skillSystem';

interface TouchControlsProps {
  player: Player;
  onMove: (x: number, y: number) => void;
  onPrimaryDown: () => void;
  onPrimaryUp: () => void;
  onSecondaryDown: () => void;
  onSecondaryUp: () => void;
  onSkill: (slot: '1' | '2' | '3' | '4') => void;
  onPotion: () => void;
  onDash: () => void;
  onInteract: () => void;
}

/**
 * TouchControls — 暗黑不朽风格移动操控层（仅触屏/小屏渲染）。
 *
 * 布局范式（参考 DI 手游横版）：
 *  - 左下：固定半透明摇杆（外圈+内杆，拖动控制方向，松开回中）；
 *  - 右下：大普攻按钮 + 环绕技能弧（副手/1-4 技能/药水），
 *    冷却用数字角标显示；
 *  - 摇杆上方：交互按钮（E）与冲刺。
 */
export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  onMove,
  onPrimaryDown,
  onPrimaryUp,
  onSecondaryDown,
  onSecondaryUp,
  onSkill,
  onPotion,
  onDash,
  onInteract,
}) => {
  const [knob, setKnob] = useState<{ dx: number; dy: number; active: boolean }>({ dx: 0, dy: 0, active: false });
  const stickIdRef = useRef<number | null>(null);
  const STICK_R = 44; // 内杆最大行程（像素）

  // ===== 摇杆（固定位置，触点须落在摇杆区内） =====
  const handleStickStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    if (!t || stickIdRef.current !== null) return;
    e.preventDefault();
    stickIdRef.current = t.identifier;
    setKnob({ dx: 0, dy: 0, active: true });
  }, []);

  const handleStickMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const id = stickIdRef.current;
      if (id === null) return;
      const t = [...e.changedTouches].find((tt) => tt.identifier === id);
      if (!t) return;
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = t.clientX - cx;
      let dy = t.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > STICK_R) {
        dx = (dx / len) * STICK_R;
        dy = (dy / len) * STICK_R;
      }
      setKnob((s) => ({ ...s, dx, dy }));
      const nLen = Math.hypot(dx, dy) / STICK_R;
      if (nLen < 0.18) onMove(0, 0);
      else onMove(dx / STICK_R, dy / STICK_R);
    },
    [onMove]
  );

  const handleStickEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const id = stickIdRef.current;
      if (id === null) return;
      const t = [...e.changedTouches].find((tt) => tt.identifier === id);
      if (!t) return;
      e.preventDefault();
      stickIdRef.current = null;
      setKnob({ dx: 0, dy: 0, active: false });
      onMove(0, 0);
    },
    [onMove]
  );

  // ===== 冷却读取（与桌面热键条同源） =====
  const cd = (slot: string, fallbackId?: string): number => {
    const skillId = player.activeSkills[slot];
    if (skillId) return player.skillCooldowns[skillId] || 0;
    if (fallbackId) return player.skillCooldowns[fallbackId] || 0;
    return 0;
  };
  const skillSlot = (slot: '1' | '2' | '3' | '4') => {
    const skillId = player.activeSkills[slot];
    return skillId ? SKILLS[skillId] : null;
  };

  /** 圆形触控按钮：图标 + 冷却角标 */
  const TouchBtn: React.FC<{
    icon: React.ReactNode;
    size: number;
    onPress: () => void;
    onRelease?: () => void;
    cooldown?: number;
    label?: string;
    className?: string;
    style?: React.CSSProperties;
  }> = ({ icon, size, onPress, onRelease, cooldown, label, className = '', style }) => (
    <button
      className={`touch-btn relative flex items-center justify-center rounded-full border-2 select-none ${className}`}
      style={{ width: size, height: size, ...style }}
      onTouchStart={(e) => {
        e.preventDefault();
        onPress();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onRelease?.();
      }}
    >
      <span className="pointer-events-none" style={{ fontSize: size * 0.42 }}>{icon}</span>
      {!!cooldown && cooldown > 0 && (
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/70 font-mono text-sm font-black text-cyan-300 pointer-events-none">
          {cooldown.toFixed(1)}
        </span>
      )}
      {label && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-stone-300/80 pointer-events-none">
          {label}
        </span>
      )}
    </button>
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-40 select-none md:hidden">
      {/* ===== 左下：固定摇杆（DI 式暗色，不抢视野） ===== */}
      <div
        className="pointer-events-auto absolute bottom-6 left-6 flex h-32 w-32 items-center justify-center rounded-full border border-white/10 bg-stone-950/25 safe-left safe-bottom"
        onTouchStart={handleStickStart}
        onTouchMove={handleStickMove}
        onTouchEnd={handleStickEnd}
        onTouchCancel={handleStickEnd}
      >
        {/* 十字方向提示 */}
        <div className="absolute h-full w-full pointer-events-none opacity-15">
          <div className="absolute left-1/2 top-2 h-3 w-0.5 -translate-x-1/2 bg-white" />
          <div className="absolute left-1/2 bottom-2 h-3 w-0.5 -translate-x-1/2 bg-white" />
          <div className="absolute top-1/2 left-2 h-0.5 w-3 -translate-y-1/2 bg-white" />
          <div className="absolute top-1/2 right-2 h-0.5 w-3 -translate-y-1/2 bg-white" />
        </div>
        {/* 内杆 */}
        <div
          className={`h-16 w-16 rounded-full border shadow-lg transition-colors ${
            knob.active ? 'border-amber-300/70 bg-stone-700/80' : 'border-white/20 bg-stone-800/50'
          }`}
          style={{ transform: `translate(${knob.dx}px, ${knob.dy}px)` }}
        />
      </div>

      {/* ===== 摇杆上方：交互 / 冲刺 ===== */}
      <div className="pointer-events-auto absolute left-8 flex flex-col gap-3" style={{ bottom: '170px' }}>
        <TouchBtn icon="E" size={52} onPress={onInteract} className="border-emerald-400/70 bg-emerald-950/70 text-emerald-300 font-black shadow-[0_0_12px_rgba(52,211,153,0.35)]" label="交互" />
        <TouchBtn icon="💨" size={52} onPress={onDash} cooldown={player.dashCooldown} className="border-amber-400/70 bg-amber-950/70 shadow-[0_0_12px_rgba(251,191,36,0.35)]" label="冲刺" />
      </div>

      {/* ===== 右下：DI 风格技能轮盘 ===== */}
      <div className="pointer-events-auto absolute bottom-5 right-5 safe-right safe-bottom" style={{ width: 240, height: 200 }}>
        {/* 环绕弧：副手 + 技能1-4（绕大按钮左上方弧线排布） */}
        <TouchBtn
          icon="⚡"
          size={54}
          onPress={onSecondaryDown}
          onRelease={onSecondaryUp}
          className="absolute border-sky-400/70 bg-sky-950/70 shadow-[0_0_12px_rgba(56,189,248,0.35)]"
          style={{ right: 132, bottom: 96 }}
        />
        {(['1', '2', '3', '4'] as const).map((slot, i) => {
          const skill = skillSlot(slot);
          const fallbackIcons = ['💣', '🍎', '👁️', player.equipment.offhand?.subType === 'shield' ? '🛡️' : '🌪️'];
          const fallbackIds = ['tnt_toss', 'golden_apple', 'ender_pearl', player.equipment.offhand?.subType === 'shield' ? 'shield_bash' : 'whirlwind'];
          const angles = [200, 240, 280, 320]; // 弧线角度（度，右下原点系）
          const arcR = 104;
          const rad = (angles[i] * Math.PI) / 180;
          const x = 190 + Math.cos(rad) * arcR * 1.05;
          const y = 128 + Math.sin(rad) * arcR * 0.72;
          return (
            <TouchBtn
              key={slot}
              icon={skill ? skill.icon : fallbackIcons[i]}
              size={54}
              onPress={() => onSkill(slot)}
              cooldown={cd(slot, fallbackIds[i])}
              className={`absolute ${skill ? 'border-amber-400/80 bg-amber-950/70 shadow-[0_0_12px_rgba(251,191,36,0.35)]' : 'border-stone-500/70 bg-stone-800/80'}`}
              style={{ right: 240 - x, bottom: y - 64 }}
            />
          );
        })}

        {/* 药水（大按钮左侧） */}
        <TouchBtn
          icon="🧪"
          size={58}
          onPress={onPotion}
          cooldown={cd('q', 'potion')}
          className="absolute border-rose-400/70 bg-rose-950/70 shadow-[0_0_12px_rgba(251,113,133,0.35)]"
          style={{ right: 150, bottom: 22 }}
          label={`x${player.stats.potions}`}
        />

        {/* 大普攻按钮（最右下） */}
        <TouchBtn
          icon="⚔️"
          size={84}
          onPress={onPrimaryDown}
          onRelease={onPrimaryUp}
          className="absolute border-amber-300/90 bg-gradient-to-b from-amber-800/80 to-stone-900/90 shadow-[0_0_20px_rgba(251,191,36,0.45)]"
          style={{ right: 12, bottom: 18 }}
        />
      </div>
    </div>
  );
};
