import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { Z } from '@/config/zIndex';

interface StickySafeAreaScrimProps {
  visible: boolean;
  /** The exact paint used by the topmost sticky host. */
  background: CSSProperties['background'];
  /** Match the host's own background transition. Opaque hosts use `none`. */
  transition?: CSSProperties['transition'];
}

/** Shared safe-area-aware stuck detection for every scrim consumer. */
export function useStickySafeAreaState() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      const satValue = getComputedStyle(document.documentElement).getPropertyValue('--sat');
      const sat = Number.parseFloat(satValue) || 0;
      setStuck(sentinel.getBoundingClientRect().top <= sat);
      observer = new IntersectionObserver(
        ([entry]) => setStuck(!entry.isIntersecting),
        { threshold: 0, rootMargin: `-${sat}px 0px 0px 0px` },
      );
      observer.observe(sentinel);
    };

    observe();
    window.addEventListener('resize', observe);
    return () => {
      window.removeEventListener('resize', observe);
      observer?.disconnect();
    };
  }, []);

  return { sentinelRef, stuck };
}

/**
 * The single opt-in notch scrim for immersive pages with sticky chrome.
 * It never owns inset spacing: it only paints the fixed var(--sat) strip while
 * the host's sentinel says the chrome is stuck.
 */
export function StickySafeAreaScrim({
  visible,
  background,
  transition = 'none',
}: StickySafeAreaScrimProps) {
  return (
    <div
      aria-hidden="true"
      data-visible={visible ? 'true' : 'false'}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--sat, env(safe-area-inset-top, 0px))',
        background,
        opacity: visible ? 1 : 0,
        transition,
        pointerEvents: 'none',
        zIndex: Z.stickySafeArea,
      }}
    />
  );
}

export default StickySafeAreaScrim;