import React from 'react';
import { SpineSlotKey, SpineSlotData } from '../../engine/skin/spineTypes';
import { User, Shield, Crosshair, Sparkles } from 'lucide-react';

interface SpineSlotSelectorProps {
  slots: Record<SpineSlotKey, SpineSlotData>;
  selectedSlot: SpineSlotKey;
  onSelectSlot: (slot: SpineSlotKey) => void;
}

interface SlotMeta {
  key: SpineSlotKey;
  title: string;
  icon: string;
  desc: string;
}

const SLOT_METAS: SlotMeta[] = [
  { key: 'head', title: '头部', icon: '🧢', desc: '头盔/发型/面部/帽子' },
  { key: 'torso', title: '躯干', icon: '🥋', desc: '胸甲/衣服/核心身体' },
  { key: 'armRight', title: '右手(主手)', icon: '⚔️', desc: '持武手/前臂挥砍' },
  { key: 'armLeft', title: '左手(副手)', icon: '🛡️', desc: '盾牌手/后臂摆动' },
  { key: 'legRight', title: '右腿(前腿)', icon: '🦵', desc: '前侧腿部奔跑交叉' },
  { key: 'legLeft', title: '左腿(后腿)', icon: '🦿', desc: '后侧腿部交替支撑' },
];

export const SpineSlotSelector: React.FC<SpineSlotSelectorProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-bold text-stone-300">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>选择 Spine 骨骼部位 (点击定制或上传)</span>
        </span>
        <span className="text-[11px] text-amber-400/80 font-mono">6个骨骼关节插槽</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {SLOT_METAS.map((meta) => {
          const slot = slots[meta.key];
          const isSelected = selectedSlot === meta.key;

          return (
            <button
              key={meta.key}
              onClick={() => onSelectSlot(meta.key)}
              className={`group relative flex flex-col items-center rounded-xl border p-2.5 text-center transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-950/50 shadow-[0_0_12px_rgba(251,191,36,0.35)] ring-1 ring-amber-400 scale-[1.02]'
                  : 'border-stone-800 bg-stone-900/60 hover:border-stone-600 hover:bg-stone-800/60'
              }`}
            >
              {/* Slot Sprite Miniature */}
              <div className="relative mb-1.5 flex h-11 w-11 items-center justify-center rounded-lg border border-stone-700 bg-stone-950 p-1 shadow-inner group-hover:scale-105 transition-transform">
                {slot?.dataUrl ? (
                  <img
                    src={slot.dataUrl}
                    alt={meta.title}
                    className="h-full w-full object-contain image-rendering-pixelated"
                  />
                ) : (
                  <span className="text-lg">{meta.icon}</span>
                )}
                {!slot?.visible && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/70 text-[9px] text-red-400">
                    隐藏
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-stone-200 group-hover:text-amber-300">
                  {meta.title}
                </span>
              </div>
              <span className="mt-0.5 text-[9px] text-stone-400 line-clamp-1 font-mono">
                {meta.key}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
