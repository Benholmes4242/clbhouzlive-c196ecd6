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

