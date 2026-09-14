/**
 * BRIEF_WATCH_MIXED_FEED §4 — THE CHIPS ARE RELATIONSHIP AND TYPE.
 *
 * No invented topics. The mock's "Course vlogs" and "Tips" do not exist as
 * data and are not built.
 *
 * THE HONEST LIMIT, stated once here so no call site can forget it:
 *   get_watch_shorts_v2 takes p_mode ('for_you' | 'trending' | 'latest') AND
 *   p_filter ('following' | 'played_courses'), so all three relationships are
 *   real for CLIPS.
 *   get_long_form_videos_v2 takes p_mode ('latest' | 'popular' | 'following')
 *   — 'following' IS supported (contrary to the brief's §4 statement) but
 *   there is NO played-courses mode. So:
 *     For you  -> videos 'popular' (viewer-aware: the RPC damps posts this
 *                 member has already been shown, keyed on p_user_id)
 *     Friends  -> videos 'following' (a real server-side follow filter)
 *     Your courses -> CLIPS ONLY. Nothing is shown unfiltered under a filter.
 *   The proposed RPC change that would give videos a played-courses mode is
 *   docs/sql/watch_long_form_played_courses.sql, UNAPPLIED.
 */

export const WATCH_FILTERS = ['all', 'for_you', 'friends', 'your_courses', 'clips', 'videos'] as const;

export type WatchFilter = (typeof WATCH_FILTERS)[number];

/** Long-form params, or null where long-form CANNOT honour the filter. */
export function videoParams(filter: WatchFilter): { mode: string } | null {
  switch (filter) {
    case 'clips':
      return null;
    /* NO PLAYED-COURSES MODE EXISTS. Clips only, rather than a page of videos
       that ignore the chip the member just tapped. */
    case 'your_courses':
      return null;
    case 'for_you':
      return { mode: 'popular' };
    case 'friends':
      return { mode: 'following' };
    case 'videos':
    case 'all':
    default:
      return { mode: 'latest' };
  }
}

/** Clip params, or null where the filter is long-form only. */
export function clipParams(filter: WatchFilter): { mode: string; filter?: string } | null {
  switch (filter) {
    case 'videos':
      return null;
    case 'for_you':
      return { mode: 'for_you' };
    case 'friends':
      return { mode: 'latest', filter: 'following' };
    case 'your_courses':
      return { mode: 'latest', filter: 'played_courses' };
    case 'clips':
      return { mode: 'for_you' };
    case 'all':
    default:
      return { mode: 'trending' };
  }
}

/** THE CLIPS-ONLY SHAPE: a 3-up vertical grid, not the mixed feed. */
export function isClipsOnly(filter: WatchFilter): boolean {
  return filter === 'clips' || filter === 'your_courses';
}

/** Community photos have no server search path, so rails stand down on search. */
export function railsWanted(filter: WatchFilter, searching: boolean): boolean {
  return !searching && filter !== 'videos' && !isClipsOnly(filter);
}
