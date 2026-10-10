/**
 * THE ONE TIME BASE FOR A PLAY DATE on the Explore Scores screen (and every
 * Discover surface that imports this file).
 *
 * play_date is a DATE: no time, no zone. It names the calendar day the member
 * played, in their own day. Reading it at UTC midnight would move it a day
 * back for anyone west of Greenwich; reading it at local midnight puts it on
 * a DST edge. LOCAL NOON of that calendar day is always the same local date in
 * every zone, so the absolute form (weekday, month) and the relative form
 * (today, 3d ago — counted against the member's own clock) can never disagree
 * about which day it was. Timestamps are truncated to their calendar day first.
 */
export function playDateAtLocalNoon(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * relativeDay — THE ONE relative-day formatter Discover uses for a PLAY DATE.
 *
 * Lifted verbatim (behaviour-identical) out of FriendsPlayedRail so the friends
 * rail and the one-thing row read the same wording for the same age instead of
 * carrying a copy each. Within a week it names the weekday, then "Last week",
 * then "{n}w ago".
 *
 * TAKES DATE-ONLY OR FULL TIMESTAMPS: play_date is a DATE, while review_date /
 * created_at are timestamps, so the value is truncated to its calendar day and
 * read at local noon — that keeps the day count off the DST/midnight edges.
 */
export function relativeDay(
  iso: string,
  t: (k: string, o?: any) => string,
  /**
   * The rail prints inside a narrow image chip and keeps 'short'; the one-thing
   * row has the width for the full weekday. THE ONLY difference between callers.
   */
  weekday: 'short' | 'long' = 'short',
): string {
  const then = playDateAtLocalNoon(iso)?.getTime() ?? NaN;
  if (!Number.isFinite(then)) return '';
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return t('discover.when.today');
  if (days === 1) return t('discover.when.yesterday');
  if (days < 7) {
    return new Date(then).toLocaleDateString(undefined, { weekday });
  }
  if (days < 14) return t('discover.when.lastWeek');
  return t('discover.when.weeksAgo', {
    count: Math.floor(days / 7),
  });
}


/**
 * relativeDayCompact — THE BOARD'S WHEN COLUMN (BRIEF_DISCOVER_BOARD_AVATARS
 * AND_RECENT A2). A weekday name only disambiguates inside seven days; the
 * default window is fourteen days and All time is unbounded, so the board reads
 * a relative day on a fixed ladder instead:
 *
 *   0 -> TODAY, 1 -> YEST, 2-6 -> {n}D AGO, 7-69 -> {n}W AGO (nearest week),
 *   70-364 -> {n}M AGO (nearest month), 365+ -> {n}Y AGO.
 *
 * Units are single letters throughout (D, W, M, Y) so the board's WHEN column
 * never wraps to a second line.
 *
 * Uppercasing is the caller's, via textTransform.
 */
export function relativeDayCompact(
  iso: string | null | undefined,
  t: (k: string, o?: any) => string,
): string {
  if (!iso) return '\u2014';
  const then = playDateAtLocalNoon(iso)?.getTime() ?? NaN;
  if (!Number.isFinite(then)) return '\u2014';
  const days = Math.max(0, Math.round((Date.now() - then) / 86_400_000));
  if (days === 0) return t('discover.when.relToday');
  if (days === 1) return t('discover.when.relYest');
  if (days < 7) return t('discover.when.relDaysAgo', { n: days });
  if (days < 70) {
    return t('discover.when.relWeeksAgo', {
      n: Math.max(1, Math.round(days / 7)),
    });
  }
  if (days < 365) {
    return t('discover.when.relMonthsAgo', {
      n: Math.max(1, Math.round(days / 30.44)),
    });
  }
  return t('discover.when.relYearsAgo', {
    n: Math.max(1, Math.round(days / 365.25)),
  });
}

/**
 * relativeDayFull — THE SEE-ALL SHEET'S DAY-GROUP HEADER
 * (BRIEF_DISCOVER_SEE_ALL_SHEETS S4.2). Same ladder as relativeDayCompact, in
 * full words: TODAY, YESTERDAY, 2 DAYS AGO, 3 WEEKS AGO, 4 MONTHS AGO, 2 YEARS
 * AGO. A header has the width the WHEN column never had, so nothing is
 * abbreviated. Uppercasing stays the caller's, via textTransform.
 */
export function relativeDayFull(
  iso: string | null | undefined,
  t: (k: string, o?: any) => string,
): string {
  if (!iso) return '\u2014';
  const then = playDateAtLocalNoon(iso)?.getTime() ?? NaN;
  if (!Number.isFinite(then)) return '\u2014';
  const days = Math.max(0, Math.round((Date.now() - then) / 86_400_000));
  if (days === 0) return t('discover.when.today');
  if (days === 1) return t('discover.when.yesterday');
  if (days < 7) return t('discover.when.fullDaysAgo', { count: days });
  if (days < 70) {
    const n = Math.max(1, Math.round(days / 7));
    return t('discover.when.fullWeeksAgo', { count: n });
  }
  if (days < 365) {
    const n = Math.max(1, Math.round(days / 30.44));
    return t('discover.when.fullMonthsAgo', { count: n });
  }
  const n = Math.max(1, Math.round(days / 365.25));
  return t('discover.when.fullYearsAgo', { count: n });
}
