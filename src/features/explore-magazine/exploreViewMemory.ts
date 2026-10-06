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

/** THREE TABS, in strip order. */
export const EXPLORE_VIEWS: ExploreView[] = ['all', 'scores', 'watch'];

/** §1 the views that carry the SCOPE ROW. All and Watch never do. */
export const SCOPED_VIEWS: ExploreView[] = ['scores'];

const KEY = 'amateur:view';

export function readExploreView(): ExploreView {
  try {
    const raw = sessionStorage.getItem(KEY);
    /* Anything that is not one of the three tabs (including a session that
       remembered the deleted 'courses' or 'reviews') falls through to All. */
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
