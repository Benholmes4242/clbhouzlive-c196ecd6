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
 *   Community IS a chip, the last one. It is the only chip that filters
 *              photographs rather than video — the shared mosaic — so both
 *              the long-form and the clip read stand down on it: it has no
 *              video or clip source.
 */

/* "Your courses" was removed from the chips (user request, Oct 2026); the
   played-courses clip read and its header note remain for the badge logic. */
export const WATCH_CHIPS = ['all', 'quick', 'long', 'friends', 'community'] as const;
export const WATCH_FILTERS = WATCH_CHIPS;

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
