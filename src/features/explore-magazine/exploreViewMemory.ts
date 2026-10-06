/**
 * THE VIEW, FOR THIS SESSION ONLY (BRIEF_EXPLORE_MAGAZINE §3b).
 *
 * Sibling of amateurScrollMemory and deliberately the same mechanism: a chip is
 * not a route, so it must not push history, and it must not survive a cold open
 * either — All is the landing view every time the app starts. sessionStorage is
 * exactly that lifetime.
 */

/** 'reviews' IS RETIRED AS A VIEW (BRIEF_COURSES_MERGED §1) and kept in the type
 *  ON PURPOSE: the server ranker still answers p_view = 'reviews', the client
 *  composition still composes it, and the merged Courses view reads BOTH pools.
 *  Nothing about the reviews path is deleted; it simply has no chip. */
export type ExploreView = 'all' | 'scores' | 'watch' | 'courses' | 'reviews';

/** THREE CHIPS (BRIEF EXPLORE — HIDE THE COURSES TAB). 'courses' is HIDDEN, not
 *  deleted: it stays in ExploreView and still renders if set, it has no chip.
 *  Previously FOUR CHIPS (BRIEF_COURSES_MERGED §1). Courses and Reviews are ONE view named
 *  Courses: a member arriving wants places to play, not a data type. It also
 *  fixes the live 320px bleed the fifth chip caused. */
export const EXPLORE_VIEWS: ExploreView[] = ['all', 'scores', 'watch'];

/** §1 the views that carry the SCOPE ROW. All and Watch never do. */
export const SCOPED_VIEWS: ExploreView[] = ['scores'];

const KEY = 'amateur:view';

export function readExploreView(): ExploreView {
  try {
    const raw = sessionStorage.getItem(KEY);
    /* A SESSION THAT REMEMBERED EITHER RETIRED VIEW — 'reviews' or the hidden
       'courses' — LANDS ON ALL, never on a view with no chip selected and no
       way back to it. */
    if (raw === 'reviews' || raw === 'courses') return 'all';
    if (raw && EXPLORE_VIEWS.includes(raw as ExploreView)) return raw as ExploreView;
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
