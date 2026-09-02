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
  const then = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  if (!Number.isFinite(then)) return '';
  const days = Math.round((Date.now() - then) / 86_400_000);
  if (days <= 0) return t('discover.when.today', 'Today');
  if (days === 1) return t('discover.when.yesterday', 'Yesterday');
  if (days < 7) {
    return new Date(then).toLocaleDateString(undefined, { weekday });
  }
  if (days < 14) return t('discover.when.lastWeek', 'Last week');
  return t('discover.when.weeksAgo', {
    defaultValue: '{{count}}w ago',
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
 *   70-364 -> {n}MO AGO (nearest month), 365+ -> {n}Y AGO.
 *
 * Uppercasing is the caller's, via textTransform.
 */
export function relativeDayCompact(
  iso: string | null | undefined,
  t: (k: string, o?: any) => string,
): string {
  if (!iso) return '\u2014';
  const then = new Date(`${iso.slice(0, 10)}T12:00:00`).getTime();
  if (!Number.isFinite(then)) return '\u2014';
  const days = Math.max(0, Math.round((Date.now() - then) / 86_400_000));
  if (days === 0) return t('discover.when.relToday', { defaultValue: 'today' });
  if (days === 1) return t('discover.when.relYest', { defaultValue: 'yest' });
  if (days < 7) return t('discover.when.relDaysAgo', { defaultValue: '{{n}}d ago', n: days });
  if (days < 70) {
    return t('discover.when.relWeeksAgo', {
      defaultValue: '{{n}}w ago',
      n: Math.max(1, Math.round(days / 7)),
    });
  }
  if (days < 365) {
    return t('discover.when.relMonthsAgo', {
      defaultValue: '{{n}}mo ago',
      n: Math.max(1, Math.round(days / 30.44)),
    });
  }
  return t('discover.when.relYearsAgo', {
    defaultValue: '{{n}}y ago',
    n: Math.max(1, Math.round(days / 365.25)),
  });
}
