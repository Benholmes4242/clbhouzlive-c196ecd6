/**
 * THE WATCH CHIPS (BRIEF_WATCH_PAGE K.8): All / Quick hits / Long form /
 * Friends / Your courses. "Quick hits" and "Long form" filter on QUICK_HIT_MAX
 * and nothing else — both reads are fetched and split client-side by duration.
 *
 * THE HONEST LIMITS, stated once here:
 *   Friends -> videos p_mode 'following' + clips p_filter 'following' (both
 *              server-side follow filters).
 *   Your courses -> clips p_filter 'played_courses' (server-side). The long-form
 *              RPC has NO played-courses mode, so long-form is the 'latest'
 *              read filtered client-side to the member's own courses; it only
 *              sees loaded pages. The proposed RPC change is
 *              docs/sql/watch_long_form_played_courses.sql, UNAPPLIED.
 *   'community' is not a chip. It is the entry state Explore's community
 *              see-all and the rail's See all open — the shared mosaic.
 */

export const WATCH_CHIPS = ['all', 'quick', 'long', 'friends', 'your_courses'] as const;
export const WATCH_FILTERS = [...WATCH_CHIPS, 'community'] as const;

export type WatchFilter = (typeof WATCH_FILTERS)[number];

/** Long-form read params, or null where the long-form read stands down. */
export function videoParams(filter: WatchFilter): { mode: string } | null {
  switch (filter) {
    case 'community':
      return null;
    case 'friends':
      return { mode: 'following' };
    default:
      return { mode: 'latest' };
  }
}

/** Clip read params, or null where the clip read stands down. */
export function clipParams(filter: WatchFilter): { mode: string; filter?: string } | null {
  switch (filter) {
    case 'community':
      return null;
    case 'friends':
      return { mode: 'latest', filter: 'following' };
    case 'your_courses':
      return { mode: 'latest', filter: 'played_courses' };
    default:
      return { mode: 'trending' };
  }
}

export function isCommunityOnly(filter: WatchFilter): boolean {
  return filter === 'community';
}

export function showsQuickHits(filter: WatchFilter): boolean {
  return filter !== 'long' && filter !== 'community';
}

export function showsLongForm(filter: WatchFilter): boolean {
  return filter !== 'quick' && filter !== 'community';
}

/** Continue watching and the community rail render on All only, never under search. */
export function allOnly(filter: WatchFilter, searching: boolean): boolean {
  return filter === 'all' && !searching;
}
