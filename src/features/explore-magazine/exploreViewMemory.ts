/**
 * THE VIEW, FOR THIS SESSION ONLY (BRIEF_EXPLORE_MAGAZINE §3b).
 *
 * Sibling of amateurScrollMemory and deliberately the same mechanism: a chip is
 * not a route, so it must not push history, and it must not survive a cold open
 * either — All is the landing view every time the app starts. sessionStorage is
 * exactly that lifetime.
 */

/** THE TAB STRIP, and nothing else: All, Standings (internally 'scores') and
 *  Watch. The ranker's pool argument is a separate type (StreamPool), because
 *  'reviews' is a pool with no tab. */
export type ExploreView = 'all' | 'scores' | 'watch';

/**
 * TRIAL FROM 8 OCT 2026: Explore's All tab is hidden. Nothing behind it is
 * deleted — the 'all' view, its shelves and reads stay compiled and dormant.
 * Flipping this to true restores the tab completely; that one line is the
 * whole restore.
 */
export const EXPLORE_ALL_TAB_ENABLED = false;

/** The tab strip, in strip order. 'all' leads only while the trial flag is on. */
export const EXPLORE_VIEWS: ExploreView[] = EXPLORE_ALL_TAB_ENABLED
  ? ['all', 'scores', 'watch']
  : ['scores', 'watch'];

/** §1 the views that carry the SCOPE ROW. All and Watch never do. */
export const SCOPED_VIEWS: ExploreView[] = ['scores'];

const KEY = 'amateur:view';

export function readExploreView(): ExploreView {
  try {
    const raw = sessionStorage.getItem(KEY);
    /* Anything not in the strip (a session that remembered the deleted
       'courses' or 'reviews', or 'all' while it is hidden) falls through to
       the strip's first view. */
    if (raw && EXPLORE_VIEWS.includes(raw as ExploreView)) return raw as ExploreView;
  } catch {
    /* private mode: the first view. */
  }
  return EXPLORE_VIEWS[0];
}


export function writeExploreView(view: ExploreView): void {
  try {
    sessionStorage.setItem(KEY, view);
  } catch {
    /* private mode: the choice lasts as long as the mount. */
  }
}
