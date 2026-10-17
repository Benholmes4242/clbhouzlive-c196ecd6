/**
 * YOU_TAB_CIRCLE_NAMES_2 — the "who you know has played it" line, derived.
 *
 * ONE SOURCE (S3): the count and the names both come from the single
 * get_board_course_players result the caller passes in — they cannot
 * disagree, because there is nothing else to disagree with.
 *
 * READABLE ONLY (S2): a member whose profile is not readable (null or blank
 * display_name) is absent from the count AND the names.
 *
 * NO SILENT CAP (T1): the read is limited, so a raw result at the limit means
 * the true count is AT LEAST that. `capped` tells the renderer to say
 * "500+" rather than present a capped number as an exact one.
 */

import type { BoardCoursePlayer } from '@/components/explore-tab-new/courseled/hooks/useBoardCoursePlayers';

/* Beyond any plausible circle size at one course; the cap branch exists so
   even the implausible case never prints an exact-looking number. */
export const CIRCLE_PLAYERS_LIMIT = 500;

export interface CircleNamesLine {
  /** Readable members who have logged a round here. */
  count: number;
  /** Up to three of them, for avatars and names. */
  shown: BoardCoursePlayer[];
  /** count minus shown.length. */
  others: number;
  /** True when the raw result hit the read limit — the count is a floor. */
  capped: boolean;
}

export function circleNamesLine(
  players: BoardCoursePlayer[] | undefined,
  limit: number = CIRCLE_PLAYERS_LIMIT,
): CircleNamesLine {
  const raw = players ?? [];
  const capped = raw.length >= limit;
  const readable = raw.filter((p) => p.display_name != null && p.display_name.trim() !== '');
  const shown = readable.slice(0, 3);
  return { count: readable.length, shown, others: readable.length - shown.length, capped };
}
