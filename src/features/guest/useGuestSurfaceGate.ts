/**
 * GUEST SCROLL TRIGGERS (brief §4). Scroll depth, NEVER a timer — there is
 * no setTimeout/setInterval in this file by rule.
 *
 * - Clubhouse: the top of any post with data-card-index >= 3 inside the
 *   viewport locks the surface, checked against live nodes on every scroll,
 *   after mount and on feed changes (no single-node observer: Virtuoso
 *   replaces item nodes).
 * - Every other free-look surface (Stage 2.2 ruling): locks at 1.5 viewport
 *   heights scrolled OR within 120px of the page's end, whichever comes
 *   first — and only once the user has actually scrolled (scrollTop > 0).
 *   A page that cannot scroll never locks by scroll; actions still gate.
 *
 * Once locked, a surface stays locked for the app session (guestGateStore);
 * returning to it re-shows the card at the top (GuestGateHost owns that).
 */
import { useEffect, useState } from 'react';
import { getPrimaryScrollElement } from '@/lib/getScrollParent';
import { useIsGuest } from './useIsGuest';
import {
  isSurfaceLocked,
  lockSurface,
  openGuestCard,
  courseSurfaceKey,
  registerGuestCourseSheet,
  getGuestCardRequest,
  type GuestSurfaceKey,
} from './guestGateStore';
import { trackGuestGateShown } from './guestAnalytics';

function lockAndShow(surface: GuestSurfaceKey): void {
  if (lockSurface(surface)) {
    trackGuestGateShown({ surface, trigger: 'scroll' });
  }
  openGuestCard({ kind: 'scroll', surface });
}

/** True when the top of any rendered post with data-card-index >= 3 is
 *  inside the viewport. Reads whatever nodes exist right now, because the
 *  virtualised feed replaces item nodes freely (Stage 2.7). */
export function clubhouseShouldLock(root: ParentNode = document): boolean {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const nodes = root.querySelectorAll('[data-card-index]');
  for (const el of Array.from(nodes)) {
    const idx = Number(el.getAttribute('data-card-index'));
    if (!Number.isFinite(idx) || idx < 3) continue;
    const top = el.getBoundingClientRect().top;
    // At or above the viewport bottom: either in view or already flung past.
    if (top < vh) return true;
  }
  return false;
}

/** Clubhouse: locks when the top of the fourth (or any later) post is in view.
 *  Checked on every scroll (document capture, one check per frame), once
 *  after mount, and whenever the feed's items change. */
export function useGuestClubhouseGate(): void {
  const isGuest = useIsGuest();
  useEffect(() => {
    if (!isGuest) return;
    if (isSurfaceLocked('clubhouse')) {
      // Returning to a locked Clubhouse re-shows the card at the top.
      if (!getGuestCardRequest()) openGuestCard({ kind: 'scroll', surface: 'clubhouse' });
      return;
    }
    let raf = 0;
    let done = false;
    const cleanup = () => {
      done = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      document.removeEventListener('scroll', schedule, true);
      mo?.disconnect();
    };
    const check = () => {
      raf = 0;
      if (done) return;
      if (clubhouseShouldLock()) {
        cleanup();
        lockAndShow('clubhouse');
      }
    };
    function schedule() {
      if (done || raf) return;
      raf = requestAnimationFrame(check);
    }
    document.addEventListener('scroll', schedule, { capture: true, passive: true });
    // Re-check when the feed's items change (skeleton swap, merges, slides).
    const root = document.getElementById('root');
    const mo = root && typeof MutationObserver !== 'undefined' ? new MutationObserver(schedule) : null;
    mo?.observe(root as HTMLElement, { childList: true, subtree: true });
    schedule();
    return cleanup;
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
    // One definition of the page scroller (Stage 2.3: the shared resolver
    // now always returns #root when it exists).
    const scroller = getPrimaryScrollElement();
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

/**
 * Stage 2.3 — a course's holes and rounds sheets share the course page's free
 * look: same lock key, same rule measured on the sheet's own scroller (1.5
 * sheet heights or within 120px of its end, only after the user scrolled it).
 * A locked course shows the card as soon as its sheet opens. Returns a
 * callback ref for the sheet's scrolling region.
 */
export function useGuestSheetScrollGate(courseId: string | undefined, open: boolean): (el: HTMLElement | null) => void {
  const isGuest = useIsGuest();
  const [scroller, setScroller] = useState<HTMLElement | null>(null);
  const surface = courseId ? courseSurfaceKey(courseId) : null;

  useEffect(() => {
    if (!isGuest || !open || !surface) return;
    const release = registerGuestCourseSheet();
    if (isSurfaceLocked(surface)) openGuestCard({ kind: 'scroll', surface });
    return release;
  }, [isGuest, open, surface]);

  useEffect(() => {
    if (!isGuest || !open || !surface || !scroller || isSurfaceLocked(surface)) return;
    const startTop = scroller.scrollTop;
    const onScroll = () => {
      if (isSurfaceLocked(surface)) return;
      if (shouldScrollLock({
        top: scroller.scrollTop,
        startTop,
        viewportHeight: scroller.clientHeight,
        scrollHeight: scroller.scrollHeight,
        clientHeight: scroller.clientHeight,
      })) lockAndShow(surface);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [isGuest, open, surface, scroller]);

  return setScroller;
}
