/**
 * THE VIEW, FOR THIS SESSION ONLY (BRIEF_EXPLORE_MAGAZINE §3b).
 *
 * Sibling of amateurScrollMemory and deliberately the same mechanism: a chip is
 * not a route, so it must not push history, and it must not survive a cold open
 * either — All is the landing view every time the app starts. sessionStorage is
 * exactly that lifetime.
 */

export type ExploreView = 'all' | 'scores' | 'watch' | 'courses' | 'reviews';

/** The views Phase A can actually answer. A chip that cannot change what you
 *  see does not render, so Scores/Courses/Reviews are absent until they work. */
export const PHASE_A_VIEWS: ExploreView[] = ['all', 'watch'];

const KEY = 'amateur:view';

export function readExploreView(): ExploreView {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw && PHASE_A_VIEWS.includes(raw as ExploreView)) return raw as ExploreView;
  } catch {
    /* private mode: All. */
  }
  return 'all';
}

export function writeExploreView(view: ExploreView): void {
  try {
    sessionStorage.setItem(KEY, view);
  } catch {
    /* private mode: the choice lasts as long as the mount. */
  }
}
