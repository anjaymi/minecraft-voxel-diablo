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
    // 只看"主指针是否为触摸"：带触摸屏的笔记本/一体机 maxTouchPoints>0
    // 但主输入仍是鼠标（pointer: fine），不能按移动布局渲染。
    return window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
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
