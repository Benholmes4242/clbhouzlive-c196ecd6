import { useEffect, useRef, type RefObject } from 'react';
import { getScrollAncestor } from '@/lib/getScrollParent';

/** Settling window while the hero, Top 10 rail and Clubs card resolve. */
const SETTLE_MS = 1500;

/**
 * One shot per mount: when the profile ARRIVES with ?tab= naming a non-default
 * tab, bring the tab bar to the top of the visible area (below the islands —
 * the offset is the element's scroll-margin-top: var(--chrome-clearance), never
 * a typed number). Re-asserts while the content above grows, for SETTLE_MS,
 * and stops for good on the first touch / wheel / key from the member.
 * Keyed on the mount-time tab only, so tab taps and param stripping never fire it.
 */
export function useDeepLinkTabScroll(
  targetRef: RefObject<HTMLElement>,
  initialTab: string,
  ready: boolean,
  enabled: boolean,
) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current || !ready) return;
    firedRef.current = true;
    if (!enabled || initialTab === 'activity') return;
    const el = targetRef.current;
    if (!el) return;

    const scroller = getScrollAncestor(el);
    let stopped = false;
    let lastTop = NaN;
    const assert = () => {
      if (stopped) return;
      const top = el.getBoundingClientRect().top;
      if (top === lastTop) return;
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      lastTop = el.getBoundingClientRect().top;
    };

    const ro = new ResizeObserver(assert);
    const host = scroller?.firstElementChild ?? document.body;
    ro.observe(host);
    ro.observe(el);
    const raf = requestAnimationFrame(assert);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      ro.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      userEvents.forEach((e) => window.removeEventListener(e, stop, true));
    };
    const userEvents = ['touchstart', 'wheel', 'pointerdown', 'keydown'] as const;
    userEvents.forEach((e) => window.addEventListener(e, stop, { capture: true, passive: true }));
    const timer = window.setTimeout(stop, SETTLE_MS);
    return stop;
  }, [ready, enabled, initialTab, targetRef]);
}
