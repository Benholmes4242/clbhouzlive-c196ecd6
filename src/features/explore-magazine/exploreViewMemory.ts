/**
 * THE VIEW, FOR THIS SESSION ONLY (BRIEF_EXPLORE_MAGAZINE §3b).
 *
 * Sibling of amateurScrollMemory and deliberately the same mechanism: a chip is
 * not a route, so it must not push history, and it must not survive a cold open
 * either — All is the landing view every time the app starts. sessionStorage is
 * exactly that lifetime.
 */

export type ExploreView = 'all' | 'scores' | 'watch' | 'courses' | 'reviews';

/** PHASE C §1 THE CHIP ROW IS COMPLETE. Courses and Reviews are built, so they
 *  render; a control that cannot change what you see still never appears. */
export const EXPLORE_VIEWS: ExploreView[] = ['all', 'scores', 'watch', 'courses', 'reviews'];

/** §1 the views that carry the SCOPE ROW. All and Watch never do. */
export const SCOPED_VIEWS: ExploreView[] = ['scores', 'courses', 'reviews'];

const KEY = 'amateur:view';

export function readExploreView(): ExploreView {
  try {
    const raw = sessionStorage.getItem(KEY);
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
