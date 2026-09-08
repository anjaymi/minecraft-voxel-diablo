import React, { useEffect, useState } from 'react';

interface BossIntroBannerProps {
  banner: { name: string; zone: string } | null;
}

/**
 * BossIntroBanner — 巨型首领入场横幅（进入有巢穴首领的区域时播放一次）。
 * 淡入停留 3 秒后淡出；pointer-events 全透，不影响操作。
 */
export const BossIntroBanner: React.FC<BossIntroBannerProps> = ({ banner }) => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{ name: string; zone: string } | null>(banner);

  useEffect(() => {
    if (!banner) return;
    setData(banner);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(t);
  }, [banner]);

  if (!data) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-16 z-[60] flex justify-center transition-opacity duration-700 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative px-12 py-3 text-center">
        <div className="absolute inset-0 rounded-2xl border-y-2 border-amber-500/60 bg-gradient-to-r from-stone-950/0 via-stone-950/90 to-stone-950/0 shadow-[0_0_40px_rgba(0,0,0,0.6)]" />
        <div className="relative">
          <div className="text-[11px] font-black tracking-[0.35em] text-rose-300/90">⚔ 巨型首领 来袭 ⚔</div>
          <div className="mt-0.5 text-2xl font-black text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            👑 {data.name}
          </div>
          <div className="mt-1 text-[11px] text-stone-400">{data.zone}</div>
        </div>
      </div>
    </div>
  );
};
