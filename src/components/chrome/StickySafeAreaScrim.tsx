import { useEffect, useRef, useState, type CSSProperties } from 'react';

import { Z } from '@/config/zIndex';

interface StickySafeAreaScrimProps {
  visible: boolean;
  /** The exact paint used by the topmost sticky host. */
  background: CSSProperties['background'];
  /** Match the host's own background transition. Opaque hosts use `none`. */
  transition?: CSSProperties['transition'];
}

/** Shared stuck detection owns both scroll and gate-reveal measurement;
 * hidden sentinels have no layout box and can never paint a notch strip. */
export function useStickySafeAreaState() {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    const measure = () => {
      const sat = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
      setStuck(sentinel.getClientRects().length > 0 && sentinel.getBoundingClientRect().top <= sat);
    };
    const observe = () => {
      observer?.disconnect();
      const satValue = getComputedStyle(document.documentElement).getPropertyValue('--sat');
      const sat = Number.parseFloat(satValue) || 0;
      measure();
      observer = new IntersectionObserver(
        /* STUCK MEANS PASSED, NOT MERELY OUT OF VIEW. A sentinel below a hero
           taller than the viewport is also not intersecting; reading that as
           stuck painted the opaque strip over the hero at rest. Only a
           sentinel above the notch line is stuck. */
        ([entry]) => setStuck(sentinel.getClientRects().length > 0 && !entry.isIntersecting && entry.boundingClientRect.top <= sat),
        { threshold: 0, rootMargin: `-${sat}px 0px 0px 0px` },
      );
      observer.observe(sentinel);
    };

    observe();
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resizeObserver?.observe(sentinel);
    window.addEventListener('resize', observe);
    return () => {
      window.removeEventListener('resize', observe);
      observer?.disconnect();
      resizeObserver?.disconnect();
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