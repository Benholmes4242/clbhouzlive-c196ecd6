/**
 * THE WATCH CHIPS (ER1): For you / Shorts / Long form / Community, in that order.
 * For you is the old All view, Shorts is the old Quick hits view, Long form
 * is unchanged. Community opens its own grid; the community rail stays in For you.
 *
 * OLD VALUES MAP (WS1 §1): a remembered or linked filter value from the old
 * chip set lands on its replacement — all → For you, quick → Shorts,
 * community → Community. `mapWatchFilter` is the one place that mapping lives;
 * every entry point (WatchFeed's initialFilter, ExploreMagazine's watchEntry)
 * passes through it.
 *
 * "Quick hits" and "Long form" still filter on QUICK_HIT_MAX and nothing
 * else — both reads are fetched and split client-side by duration.
 *
 * THE HONEST LIMIT, stated once here: the long-form RPC has NO
 * played-courses mode, so the old played-courses note lives on in
 * docs/sql/watch_long_form_played_courses.sql, UNAPPLIED.
 */

/* "Your courses" was removed from the chips (user request, Oct 2026); the
   played-courses clip read and its header note remain for the badge logic.
   Friends was removed from the chips (founder decision, 2026-10-22); the
   'following' modes stay available server-side and only the client stops
   asking for them. ER1 restores Community as its own view. */
export const WATCH_CHIPS = ['all', 'quick', 'long', 'community'] as const;
export const WATCH_FILTERS = WATCH_CHIPS;

export type WatchFilter = (typeof WATCH_FILTERS)[number];

/** WS1 — map a remembered or linked value onto the current chip set:
 *  all → For you, quick → Shorts, long → Long form, community → Community. */
export function mapWatchFilter(value: string | null | undefined): WatchFilter {
  return value === 'quick' || value === 'long' || value === 'community' ? value : 'all';
}

/** Long-form read params. */
export function videoParams(_filter: WatchFilter): { mode: string } {
  return { mode: 'latest' };
}

/** Clip read params. */
export function clipParams(_filter: WatchFilter): { mode: string; filter?: string } {
  return { mode: 'trending' };
}

export function showsQuickHits(filter: WatchFilter): boolean {
  return filter === 'all' || filter === 'quick';
}

export function showsLongForm(filter: WatchFilter): boolean {
  return filter === 'all' || filter === 'long';
}

/** Continue watching, the lead, the rounds shelf and the
 *  community rail render on For you only, never under search. */
export function allOnly(filter: WatchFilter, searching: boolean): boolean {
  return filter === 'all' && !searching;
}
