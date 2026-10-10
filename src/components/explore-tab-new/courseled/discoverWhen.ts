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

/**
 * THE DAY LADDER (Leaderboards Phase 9.8) — the feed grammar's one grouping,
 * used by the lead board and the see-all sheet alike:
 *
 *   Today / Yesterday / This week / Last week / {Month} / {Month Year}
 *
 * "This week" is the current Monday-to-Sunday week, excluding today and
 * yesterday; "Last week" is the previous Monday-to-Sunday week. Older rows group
 * by calendar month, with the year only when it is not the current year. Every
 * date is read through playDateAtLocalNoon, the same base relativeDayCompact uses.
 * Uppercasing is the caller's.
 */
export function dayLadder(
  iso: string | null | undefined,
  t: (k: string, o?: any) => string,
  locale?: string,
  now: Date = new Date(),
): { key: string; label: string } {
  const d = playDateAtLocalNoon(iso);
  if (!d) return { key: 'none', label: '\u2014' };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return { key: 'today', label: t('discover.when.ladder.today') };
  if (days === 1) return { key: 'yesterday', label: t('discover.when.ladder.yesterday') };
  /* Monday of the current week, at local noon. getDay(): Sunday = 0. */
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  if (d.getTime() >= monday.getTime()) return { key: 'thisWeek', label: t('discover.when.ladder.thisWeek') };
  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);
  if (d.getTime() >= lastMonday.getTime()) return { key: 'lastWeek', label: t('discover.when.ladder.lastWeek') };
  const sameYear = d.getFullYear() === today.getFullYear();
  return {
    key: `m:${d.getFullYear()}-${d.getMonth()}`,
    label: d.toLocaleDateString(locale, sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' }),
  };
}

/*
 * THE TWO PLAY-DATE FORMS — THE RULE.
 * A date may omit its year ONLY where an ancestor already states it. The day
 * ladder's month groups state the year for anything outside the current year,
 * so a row inside them takes the undated form. Anywhere with no such ancestor —
 * a ranked board, a feat tile, the you slab — takes the dated form, which
 * appends the year when the date is not in the current year. A bare '12 Jun' on
 * a 2024 round is the fault this rule exists to prevent.
 */

/** UNDATED FORM ("12 Jun"): only beneath a year-stating ancestor (a day-ladder group). */
export function playDateUnderYearHeader(iso: string | null | undefined, locale?: string): string {
  const d = playDateAtLocalNoon(iso);
  return d ? d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : '';
}

/** DATED FORM ("12 Jun 2024", "24 Sept"): everywhere with no year-stating ancestor. */
export function playDateStandalone(iso: string | null | undefined, locale?: string, now: Date = new Date()): string {
  const d = playDateAtLocalNoon(iso);
  if (!d) return '';
  return d.getFullYear() === now.getFullYear()
    ? playDateUnderYearHeader(iso, locale)
    : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Former name of playDateUnderYearHeader, kept so the signed-off lead board's
 * call sites are untouched until their form is decided (RARE AIR D.3).
 */
export const playDateShort = playDateUnderYearHeader;
