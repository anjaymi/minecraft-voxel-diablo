import { useEffect, useState } from 'react';

/**
 * useIsTouch — 以"触摸能力"而非屏幕宽度判定移动布局。
 *
 * 横屏手机宽度可达 900px+，会命中 Tailwind sm/md 断点导致桌面 HUD
 * 覆盖触控层；触摸设备（pointer: coarse 或 maxTouchPoints）一律走
 * 移动版布局，与视口宽度解耦。
 */
function detectTouch(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  } catch {
    return 'ontouchstart' in window;
  }
}

export function useIsTouch(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(detectTouch);

  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia('(pointer: coarse)');
    } catch {
      mq = null;
    }
    const onChange = () => setIsTouch(detectTouch());
    mq?.addEventListener?.('change', onChange);
    window.addEventListener('resize', onChange);
    return () => {
      mq?.removeEventListener?.('change', onChange);
      window.removeEventListener('resize', onChange);
    };
  }, []);

  return isTouch;
}
