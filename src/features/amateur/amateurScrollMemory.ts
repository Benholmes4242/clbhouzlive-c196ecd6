/**
 * AMATEUR PAGE SCROLL MEMORY (BRIEF_AMATEUR_PAGE).
 *
 * Choosing the COURSE's media set over the set on screen is only defensible if
 * coming back is free: a member who taps a tile eight rows down must land back
 * on that row, not at the hero. The fullscreen viewer is an overlay and never
 * unmounts this page, so it costs nothing there; a SEE-ALL, a course row or a
 * story is a real route change and remounts the page, which is what this pays
 * for.
 *
 * sessionStorage, not router state: the browser/OS BACK gesture arrives without
 * any state we could have attached to a forward navigation.
 */
import { getPageScrollTop, scrollPageTo } from '@/lib/getScrollParent';

const KEY = 'amateur:return-scroll';
/** A stale offset from yesterday's session is worse than the top of the page. */
const MAX_AGE_MS = 30 * 60_000;

/** Call IMMEDIATELY BEFORE any navigation that leaves /amateur. */
export function rememberAmateurScroll(): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ y: getPageScrollTop(), at: Date.now() }));
  } catch {
    /* private mode: the page simply opens at the top. */
  }
}

/** Reads and CLEARS the snapshot, so a fresh entry is never restored. */
export function takeAmateurScroll(): number | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { y?: number; at?: number };
    if (typeof parsed.y !== 'number' || typeof parsed.at !== 'number') return null;
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed.y;
  } catch {
    return null;
  }
}

/**
 * Restores the offset once the page is tall enough to hold it. Blocks land
 * progressively, so a single scrollTo on mount would clamp to a short document;
 * this retries per frame until the position sticks or the budget runs out.
 */
export function restoreAmateurScroll(y: number, onDone?: () => void): () => void {
  let frames = 0;
  let raf = 0;
  const step = () => {
    scrollPageTo(y, 'instant');
    frames += 1;
    if (Math.abs(getPageScrollTop() - y) < 2 || frames >= 180) {
      onDone?.();
      return;
    }
    raf = window.requestAnimationFrame(step);
  };
  raf = window.requestAnimationFrame(step);
  return () => window.cancelAnimationFrame(raf);
}
