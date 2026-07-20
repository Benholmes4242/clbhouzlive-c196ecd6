/**
 * useImpressionObserver — IntersectionObserver + 1s dwell timer.
 *
 * Fires `track(postId)` once the referenced element has been ≥50% visible for
 * ≥1 continuous second. Leaving the threshold cancels the pending timer; the
 * next re-entry starts a fresh 1s dwell. Fires at most once per mount, but
 * unmount/remount (e.g. virtualized recycle) allows re-recording — the
 * session-level buffer coalesces bursts within a flush window.
 */
import { useEffect, type RefObject } from 'react';
import { track } from './impressionTracker';

const VISIBILITY_THRESHOLD = 0.5;
const DWELL_MS = 1000;

export function useImpressionObserver(
  ref: RefObject<HTMLElement | null>,
  postId: string | null | undefined,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !postId) return;
    if (typeof IntersectionObserver === 'undefined') return;

    let dwellTimer: number | null = null;
    let fired = false;

    const clearDwell = () => {
      if (dwellTimer != null) {
        window.clearTimeout(dwellTimer);
        dwellTimer = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (fired) return;
          if (entry.isIntersecting && entry.intersectionRatio >= VISIBILITY_THRESHOLD) {
            if (dwellTimer == null) {
              dwellTimer = window.setTimeout(() => {
                fired = true;
                dwellTimer = null;
                track(postId);
                observer.disconnect();
              }, DWELL_MS);
            }
          } else {
            clearDwell();
          }
        }
      },
      { threshold: [VISIBILITY_THRESHOLD] },
    );

    observer.observe(el);
    return () => {
      clearDwell();
      observer.disconnect();
    };
  }, [ref, postId]);
}
