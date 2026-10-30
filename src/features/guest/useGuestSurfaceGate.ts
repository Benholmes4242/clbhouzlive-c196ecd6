/**
 * GUEST SCROLL TRIGGERS (brief §4). Scroll depth, NEVER a timer — there is
 * no setTimeout/setInterval in this file by rule.
 *
 * - Clubhouse: the top of the fourth post entering the viewport locks the
 *   surface (IntersectionObserver on the feed's [data-card-index="3"]).
 * - Every other free-look surface (Stage 2.2 ruling): locks at 1.5 viewport
 *   heights scrolled OR within 120px of the page's end, whichever comes
 *   first — and only once the user has actually scrolled (scrollTop > 0).
 *   A page that cannot scroll never locks by scroll; actions still gate.
 *
 * Once locked, a surface stays locked for the app session (guestGateStore);
 * returning to it re-shows the card at the top (GuestGateHost owns that).
 */
import { useEffect } from 'react';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { useIsGuest } from './useIsGuest';
import {
  isSurfaceLocked,
  lockSurface,
  openGuestCard,
  type GuestSurfaceKey,
} from './guestGateStore';
import { trackGuestGateShown } from './guestAnalytics';

function lockAndShow(surface: GuestSurfaceKey): void {
  if (lockSurface(surface)) {
    trackGuestGateShown({ surface, trigger: 'scroll' });
  }
  openGuestCard({ kind: 'scroll', surface });
}

/** Clubhouse: locks when the top of the fourth post enters the viewport. */
export function useGuestClubhouseGate(): void {
  const isGuest = useIsGuest();
  useEffect(() => {
    if (!isGuest || isSurfaceLocked('clubhouse')) return;
    const root = document.getElementById('root');
    if (!root) return;

    let observer: IntersectionObserver | null = null;
    const watch = (el: Element) => {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            lockAndShow('clubhouse');
          }
        },
        { root: null, threshold: 0 },
      );
      observer.observe(el);
    };

    const existing = root.querySelector('[data-card-index="3"]');
    if (existing) {
      watch(existing);
      return () => observer?.disconnect();
    }

    // The feed virtualises; the fourth post may not exist yet.
    const mo = new MutationObserver(() => {
      const el = root.querySelector('[data-card-index="3"]');
      if (el) {
        mo.disconnect();
        watch(el);
      }
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      observer?.disconnect();
    };
  }, [isGuest]);
}

export const GUEST_END_PROXIMITY_PX = 120;
export const GUEST_SCROLL_VIEWPORTS = 1.5;

/** Pure rule for the non-Clubhouse scroll lock. */
export function shouldScrollLock(m: {
  top: number; startTop: number; viewportHeight: number; scrollHeight: number; clientHeight: number;
}): boolean {
  if (m.top <= 0) return false; // never scrolled — a page that cannot scroll never locks
  if (m.top - m.startTop > m.viewportHeight * GUEST_SCROLL_VIEWPORTS) return true;
  const maxTop = m.scrollHeight - m.clientHeight;
  if (maxTop <= 0) return false;
  return maxTop - m.top <= GUEST_END_PROXIMITY_PX;
}

/** Every other free-look surface: 1.5 viewports or the page's end. */
export function useGuestScrollGate(surface: GuestSurfaceKey): void {
  const isGuest = useIsGuest();
  useEffect(() => {
    if (!isGuest || isSurfaceLocked(surface)) return;
    // #root is the page scroller (canon). Listen there directly: the shared
    // resolver can cache <html> if first asked before #root became the scroll
    // container (observed on the preview), and then this listener never fired.
    const root = document.getElementById('root');
    const resolved = getPrimaryScrollElement();
    const scroller = root ?? resolved;
    const startTop = scroller?.scrollTop ?? 0;
    const onScroll = () => {
      const el = scroller ?? document.documentElement;
      if (shouldScrollLock({
        top: el.scrollTop,
        startTop,
        viewportHeight: window.innerHeight,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      })) lockAndShow(surface);
    };
    const target: (HTMLElement | Window) & EventTarget =
      scroller && scroller !== document.documentElement && scroller !== document.body ? scroller : window;
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [isGuest, surface]);
}

/** Generic dispatcher for non-Clubhouse surfaces. */
export function useGuestSurfaceGate(surface: GuestSurfaceKey): void {
  useGuestScrollGate(surface);
}
