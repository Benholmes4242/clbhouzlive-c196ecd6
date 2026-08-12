/**
 * Intl-based formatting wrappers.
 *
 * All user-visible date/time/number formatting will route through here in
 * Wave 1. For the `en` locale, the output of every wrapper MUST byte-match
 * the current hand-rolled formatters at each call site so the Wave 1 swap
 * is invisible.
 *
 * Golf lexicon (Birdie/Eagle/Par/Bogey…) is out of scope for i18n and
 * therefore never touches this module.
 */
import { formatDistanceToNow } from 'date-fns';
import { getActiveLocale } from './index';


type DateInput = Date | string | number;

function toDate(d: DateInput): Date {
  return d instanceof Date ? d : new Date(d);
}

// ─── dates ────────────────────────────────────────────────────────────────

export type DateStyle = 'short' | 'medium' | 'long' | 'full';

export function formatDate(d: DateInput, style: DateStyle = 'medium'): string {
  return new Intl.DateTimeFormat(getActiveLocale(), { dateStyle: style }).format(toDate(d));
}

export function formatTime(d: DateInput, style: DateStyle = 'short'): string {
  return new Intl.DateTimeFormat(getActiveLocale(), { timeStyle: style }).format(toDate(d));
}

// ─── relative time ────────────────────────────────────────────────────────

/**
 * Compact relative time — mirrors `formatTimeAgoShort` in
 * src/utils/formatTime.ts for the buckets it will replace in Wave 1:
 *   < 60s  → "just now"
 *   < 60m  → "{m}m"
 *   < 24h  → "{h}h"
 *   < 7d   → "{d}d"
 *   < 30d  → "{w}w"
 *   < 12mo → "{mo}mo"
 *   else   → "{y}y"
 *
 * English is produced by hand to preserve today's exact output; non-English
 * routes through Intl.RelativeTimeFormat with the 'narrow'/'short' style.
 */
export function formatRelative(d: DateInput): string {
  const date = toDate(d);
  const diffMs = Date.now() - date.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const locale = getActiveLocale();
  if (locale === 'en') {
    if (seconds < 60) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    if (months < 1) return `${weeks}w`;
    if (months < 12) return `${months}mo`;
    return `${years}y`;
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 7) return rtf.format(-days, 'day');
  if (months < 1) return rtf.format(-weeks, 'week');
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-years, 'year');
}

// ─── numbers ──────────────────────────────────────────────────────────────

/**
 * Standard number formatting. For `en`, Intl.NumberFormat groups with commas
 * (`1,234`) — matches today's `toLocaleString('en-US')` and the tabular-nums
 * scorecard columns which never exceed 3 digits. Verified: no NBSP is
 * inserted for the `en` locale (that is a fr-FR quirk).
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat(getActiveLocale()).format(n);
}

/**
 * Compact form — 1.2K / 3M. `en` output byte-matches the existing hand-rolled
 * compact helpers used in engagement counters.
 */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat(getActiveLocale(), {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

/**
 * Compact form (lowercase-suffix flavour) — 1.2k / 3m — used by the watch/feed
 * video engagement counters. English is produced by hand to preserve the exact
 * legacy output (lowercase suffix, `.0` trimmed, and the `1m` rollover at the
 * 999_950–999_999 boundary). Non-en falls back to Intl compact.
 *
 * QUIRKS REPLICATED (en):
 *   - lowercase `k`/`m` (Intl uses uppercase)
 *   - trailing `.0` trimmed for whole units (Intl trims by default)
 *   - `1m` rollover for values that round to `1000.0k`
 */
export function formatCountShort(n: number): string {
  const locale = getActiveLocale();
  if (locale === 'en') {
    if (n < 1000) return String(n);
    const trim = (v: number, suffix: string) => {
      const s = v.toFixed(1);
      return (s.endsWith('.0') ? s.slice(0, -2) : s) + suffix;
    };
    if (n < 1_000_000) {
      const v = n / 1000;
      if (v.toFixed(1) === '1000.0') return '1m';
      return trim(v, 'k');
    }
    return trim(n / 1_000_000, 'm');
  }
  return formatCompact(n);
}

// ─── weekday / month parts ────────────────────────────────────────────────

/**
 * Short weekday name — "Sun", "Mon", … (en byte-matches the legacy DAY_SHORT
 * array used by scheduled-post pills).
 */
export function formatWeekdayShort(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), { weekday: 'short' }).format(toDate(d));
}

/**
 * Short month name — "Jan", "Feb", …, "Sep" (Intl en gives "Sep", not "Sept",
 * byte-matching the legacy MONTH_SHORT array).
 */
export function formatMonthShort(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), { month: 'short' }).format(toDate(d));
}

/**
 * Composed weekday + short-month + day + 12h time — matches the composer's
 * scheduled-post pill, toast, and ScheduleSheet readable line:
 *   toLocaleString(undefined, { weekday:'short', month:'short', day:'numeric',
 *                               hour:'numeric', minute:'2-digit' })
 *
 * en output (Intl 'en' resolves to en-US 12h clock): e.g. "Thu, Jul 16, 3:45 PM".
 *
 * QUIRKS REPLICATED (en):
 *   - short weekday with trailing comma ("Thu, ")
 *   - 12-hour clock with AM/PM
 *   - two-digit minutes, one-or-two-digit hour
 */
export function formatScheduleDateTime(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(toDate(d));
}

/**
 * All-numeric short date — matches bare `toLocaleDateString()` fallback in
 * the drafts sheet:  new Date(iso).toLocaleDateString()
 *
 * en output (Intl 'en' resolves to en-US): "7/16/2026" (M/D/YYYY, no padding).
 */
export function formatDateNumeric(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(toDate(d));
}

/**
 * Hour + 2-digit minute time — 12h clock, e.g. "3:45 PM".
 * Matches `toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })`.
 * QUIRK: 12-hour clock with AM/PM in en; two-digit minutes; one-or-two-digit hour.
 * Callers that need uppercase apply `.toUpperCase()` themselves (copy layer).
 */
export function formatTimeHm(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(toDate(d));
}

/**
 * Long weekday name — "Sunday", "Monday", …
 * Matches `toLocaleDateString(undefined, { weekday: 'long' })`.
 */
export function formatWeekdayLong(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), { weekday: 'long' }).format(toDate(d));
}

/**
 * Month + year, short month — "Jul 2026".
 * Matches `toLocaleDateString('en-US', { month: 'short', year: 'numeric' })`.
 */
export function formatMonthYearShort(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'short',
    year: 'numeric',
  }).format(toDate(d));
}

/**
 * Short month + day + year — "Jul 16, 2026".
 * Matches `toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })`.
 */
export function formatMonthDayYearShort(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(toDate(d));
}

/**
 * US-dollar money in whole/decimal form — `$1,234`.
 * Matches `$${n.toLocaleString()}` at money display sites (tour purses, prize
 * money). Currency symbol is fixed English copy for this wave; extraction
 * moves to i18n copy in Wave ≥ 2.
 */
export function formatCurrencyUsd(n: number): string {
  return `$${formatNumber(n)}`;
}

/**
 * US-dollar money in COMPACT form - `$1.2M`, `$850K`. Sibling of
 * formatCurrencyUsd (which renders the full `$1,200,000`); the two do
 * different jobs and must not be merged.
 *
 * Number formatting goes through Intl on the active locale rather than
 * toFixed, so a non-en surface groups and suffixes in its own convention
 * (de: `1,2 Mio.`). Values under 1000 fall through to formatCurrencyUsd
 * because compact notation adds nothing there.
 */
export function formatCurrencyUsdCompact(n: number): string {
  if (Math.abs(n) < 1000) return formatCurrencyUsd(n);
  return `$${formatCompact(n)}`;
}

/**
 * Number with a MAX-fraction-digits cap — matches
 * `n.toLocaleString(undefined, { maximumFractionDigits: max })`.
 * En output byte-matches the legacy call; groups with commas.
 */
export function formatNumberMaxFrac(n: number, max: number): string {
  return new Intl.NumberFormat(getActiveLocale(), { maximumFractionDigits: max }).format(n);
}

/**
 * Short month + numeric day — "Jul 16".
 * Matches date-fns `format(d, 'MMM d')` for en.
 */
export function formatMonthDay(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'short',
    day: 'numeric',
  }).format(toDate(d));
}

/**
 * Tournament date-range formatter — matches the legacy date-fns composition
 * used by EventInfoSection / LeaderboardTab:
 *   only start                       → "MMM d, yyyy"           ("Jul 16, 2026")
 *   same calendar month              → "MMM d – d, yyyy"       ("Jul 16 – 19, 2026")
 *   different months (same year+)    → "MMM d – MMM d, yyyy"   ("Jun 30 – Jul 3, 2026")
 *
 * QUIRK: en dash (U+2013) separator; comma+year suffix; no year on the left
 * side when months differ (matches legacy).
 * QUIRK: month/day ordering is locale-driven via Intl; en output byte-matches
 * the legacy date-fns emission.
 */
export function formatTournamentDateRange(
  start: DateInput | null | undefined,
  end: DateInput | null | undefined,
): string | null {
  if (start == null) return null;
  const s = toDate(start);
  if (end == null) return formatMonthDayYearShort(s);
  const e = toDate(end);
  const sameMonth = s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth();
  if (sameMonth) {
    // "MMM d – d, yyyy"
    return `${formatMonthDay(s)} \u2013 ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${formatMonthDay(s)} \u2013 ${formatMonthDayYearShort(e)}`;
}

// ─── locale-pinned display wrappers ───────────────────────────────────────
// A handful of editorial/table surfaces (season calendars, exploration tab,
// unified course card "last played" chip) were hand-pinned to `en-GB` at the
// call site to force day-before-month ordering. Wave 1 preserves that exact
// byte output by pinning these wrappers to `en-GB` rather than routing
// through getActiveLocale(). Non-en localisation is handled by copy overrides
// in a later wave.

/**
 * en-GB short day + month — "16 Jul".
 * Matches `toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })`.
 * QUIRK: day-before-month ordering; pinned to en-GB.
 */
export function formatDayMonthShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(toDate(d));
}

/**
 * en-GB day + short month + year — "16 Jul 2026".
 * Matches BOTH `toLocaleDateString('en-GB', { day, month:'short', year })`
 * AND date-fns `format(d, 'd MMM yyyy')` for en.
 * QUIRK: day-before-month ordering; pinned to en-GB.
 */
export function formatDayMonthYearShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(toDate(d));
}

/**
 * 4-digit year — "2026". Matches `toLocaleDateString(*, { year: 'numeric' })`.
 * Locale-neutral for latin-digit locales; kept in one place for future
 * per-locale numeral overrides.
 */
export function formatYearNumeric(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    year: 'numeric',
  }).format(toDate(d));
}

// Additional en-GB pinned display wrappers (Wave 1 sub-batch 1e).

/** en-GB "05 Jul 2026" — day 2-digit, short month, numeric year. */
export function formatDay2MonthYearShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(toDate(d));
}

/** en-GB "Jul 05" — short month + 2-digit day. */
export function formatMonthDay2ShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short', day: '2-digit',
  }).format(toDate(d));
}

/** en-GB "Jul 2026" — short month + numeric year. */
export function formatMonthYearShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short', year: 'numeric',
  }).format(toDate(d));
}

/** en-GB "July 2026" — long month + numeric year. */
export function formatMonthYearLongGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long', year: 'numeric',
  }).format(toDate(d));
}

/** en-GB "Jul" — short month only. */
export function formatMonthShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(toDate(d));
}

/** en-GB "Sat" — short weekday only. */
export function formatWeekdayShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(toDate(d));
}

/** en-GB "Sat 16 Jul" — short weekday + day + short month. */
export function formatWeekdayDayMonthShortGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(toDate(d));
}

/**
 * en-GB "16 July 2026" — long month, numeric day + year.
 * Replaces `toLocaleDateString(undefined, { day:'numeric', month:'long', year:'numeric' })`
 * on English editorial pages (legal docs). Pinned en-GB for day-before-month.
 */
export function formatDayMonthLongYearGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(toDate(d));
}

/**
 * "now" / "{n}m" / "{n}h" / "{n}d" / "{n}w" / "{n}mo" / "{n}y" using
 * Math.round bucket boundaries (NOT floor). Preserves the exact byte output
 * of EchoHistoryPage's inline `relativeTime`, which rolls up on the nearest
 * boundary rather than the floor.
 *
 * en output:
 *   round(min) < 1     → "now"
 *   round(min) < 60    → "{min}m"
 *   round(hr)  < 24    → "{hr}h"
 *   round(day) < 7     → "{day}d"
 *   round(wk)  < 5     → "{wk}w"
 *   round(mo)  < 12    → "{mo}mo"
 *   else               → "{y}y"
 */
export function formatRelativeRounded(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const min = Math.round(diff / 60000);
  const locale = getActiveLocale();
  if (locale === 'en') {
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.round(hr / 24);
    if (day < 7) return `${day}d`;
    const wk = Math.round(day / 7);
    if (wk < 5) return `${wk}w`;
    const mo = Math.round(day / 30);
    if (mo < 12) return `${mo}mo`;
    return `${Math.round(day / 365)}y`;
  }
  return formatRelative(then);
}

/** "July 16, 2026" — long month, day, year (en-US ordering). Matches date-fns `MMMM d, yyyy`. */
export function formatMonthLongDayYear(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'long', day: 'numeric', year: 'numeric',
  }).format(toDate(d));
}

/** "Jul 16, 15:45" — short month + numeric day + 24h HH:MM.
 *  Matches date-fns `MMM d, HH:mm` — comma from en-US locale ordering. */
export function formatMonthDayHm24(d: DateInput): string {
  const date = toDate(d);
  const md = new Intl.DateTimeFormat(getActiveLocale(), { month: 'short', day: 'numeric' }).format(date);
  const hm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${md}, ${hm}`;
}

/** "16 July, 2026" — en-GB day + long month + comma + year. Matches date-fns `d MMMM, yyyy`. */
export function formatDayMonthLongYearCommaGB(d: DateInput): string {
  const date = toDate(d);
  const dm = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(date);
  return `${dm}, ${date.getFullYear()}`;
}

/** "Saturday, 16 July" — en-GB long weekday + comma + day + long month.
 *  Matches date-fns `EEEE, d MMMM`. */
export function formatWeekdayLongDayMonthLongGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(toDate(d));
}

// ─── Wave 1 sub-batch 1f (final sweep) additions ─────────────────────────

/** en-GB long month only — "July". Pinned en-GB for editorial forecast copy. */
export function formatMonthLongGB(d: DateInput): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(toDate(d));
}

/** en-US "Thu, Jul 16" — short weekday + short month + day. Matches the
 *  upload-scheduled toast pill (weekday:'short', month:'short', day:'numeric'). */
export function formatWeekdayMonthDayShortUS(d: DateInput): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(toDate(d));
}

/** en-US "3:45 PM" — hour + 2-digit minute, 12h clock. Matches
 *  `toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })`. */
export function formatTimeHmUS(d: DateInput): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit',
  }).format(toDate(d));
}

/** en-US "Jul 16, 2026, 03:45 PM" — full news timestamp. Matches
 *  `toLocaleDateString('en-US', { year, month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })`. */
export function formatNewsTimestampUS(d: DateInput): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(toDate(d));
}

/** "July 16, 2026 at 3:45 PM" — dateStyle:'long' + timeStyle:'short'.
 *  Matches `toLocaleString(undefined, { dateStyle:'long', timeStyle:'short' })`. */
export function formatDateLongTimeShort(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    dateStyle: 'long', timeStyle: 'short',
  }).format(toDate(d));
}

/** Locale-driven long month + numeric year — "July 2026" for en. Matches
 *  `toLocaleString('default', { month:'long', year:'numeric' })` (default →
 *  active locale). */
export function formatMonthYearLong(d: DateInput): string {
  return new Intl.DateTimeFormat(getActiveLocale(), {
    month: 'long', year: 'numeric',
  }).format(toDate(d));
}

/**
 * Long "X ago" with the date-fns "about"/"almost"/"over" en prefixes RETAINED.
 * Thin wrapper around `formatDistanceToNow(d, { addSuffix: true })` so callers
 * route through the i18n boundary. Non-en falls through to Intl long.
 *
 * QUIRK: date-fns emits "about 1 hour ago" / "almost 2 years ago" — those
 * prefixes are en-only date-fns copy and move into i18n keys during Wave ≥ 2.
 */
export function formatDistanceToNowAgo(d: DateInput): string {
  const date = toDate(d);
  const locale = getActiveLocale();
  if (locale === 'en') {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return formatRelativeAgoLong(date.toISOString());
}

















// ─── ordinals ─────────────────────────────────────────────────────────────

const EN_ORDINAL_SUFFIX: Record<Intl.LDMLPluralRule, string> = {
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
};

export function formatOrdinal(n: number): string {
  const locale = getActiveLocale();
  if (locale.startsWith('en')) {
    const rule = new Intl.PluralRules('en', { type: 'ordinal' }).select(n);
    return `${n}${EN_ORDINAL_SUFFIX[rule]}`;
  }
  // For non-en locales we fall back to plain digits until we ship per-locale
  // suffix maps in a later wave.
  return formatNumber(n);
}

// ─── additional relative-time variants (Wave 1 drift-consolidation) ──────
//
// The codebase grew half a dozen slightly-different local relative-time
// formatters (feed cards, GAM trophy room, Echo history, drafts, activity
// pills). Wave 1 pulls the DISPLAY shapes here so localisation can move
// them later. Each variant preserves its call-site's exact en output.

/**
 * "X ago"-style relative time. Buckets and copy match the deleted
 * `src/lib/gam/visuals.ts` helper (and, when `yesterday` is off, the inline
 * formatter from the deleted championship friends-activity feed).
 *
 * en output:
 *   < 60s          → "just now"
 *   < 60m          → "{m}m ago"
 *   < 24h          → "{h}h ago"
 *   1d & yesterday → "yesterday"      (opt-in via options.yesterday)
 *   < 30d          → "{d}d ago"
 *   < 12mo         → "{mo}mo ago"
 *   else           → "{y}y ago"
 */
export function formatRelativeAgo(
  d: DateInput | null | undefined,
  options: { yesterday?: boolean } = {},
): string {
  if (d == null) return '';
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  const locale = getActiveLocale();
  if (locale === 'en') {
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (options.yesterday && days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 30) return rtf.format(-days, 'day');
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-years, 'year');
}

/**
 * Feed-card compact relative time. Matches the local `timeAgo` in
 * `feed/FeedCard.tsx`, `fullscreen-feed/ImmersiveFullscreenChrome.tsx`,
 * and `posts-tab/LightFeedCard.tsx`.
 *
 * en output (all lowercase, no space):
 *   < 60s  → "{s}s"           (min 1s — mirrors Math.max(1, …))
 *   < 60m  → "{m}m"
 *   < 24h  → "{h}h"
 *   < 7d   → "{d}d"
 *   < 5w   → "{w}w"            (feed cards cap weeks at 5, then months)
 *   < 12mo → "{mo}mo"
 *   else   → "{y}y"
 */
export function formatRelativeWithSeconds(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!isFinite(t)) return '';
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  const locale = getActiveLocale();
  if (locale === 'en') {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w}w`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo`;
    return `${Math.floor(d / 365)}y`;
  }
  return formatRelative(t);
}

/**
 * Month-only compact relative time. Matches `src/utils/relativeTime.ts` —
 * NEVER rolls over to years; anything ≥ 30 days is emitted in months.
 *
 * en output:
 *   < 60s → "now"
 *   < 60m → "{m}m"
 *   < 24h → "{h}h"
 *   < 7d  → "{d}d"
 *   < 30d → "{w}w"
 *   else  → "{mo}mo"              (no year rollover — quirk preserved)
 */
export function formatRelativeMonths(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  const locale = getActiveLocale();
  if (locale === 'en') {
    if (diffSec < 60) return 'now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay}d`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)}w`;
    return `${Math.floor(diffDay / 30)}mo`;
  }
  return formatRelative(date);
}

/**
 * Long "X ago" — matches `date-fns`' `formatDistanceToNow(d, {addSuffix:true})`
 * output in en (e.g. "5 minutes ago", "about 1 hour ago", "3 days ago"), with
 * the LastUpdatedPill's "less than a minute" → "just now" normalisation.
 *
 * Kept on date-fns for en to preserve byte-identity (date-fns emits "about",
 * Intl RelativeTimeFormat does not). Non-en falls through to Intl long.
 *
 * QUIRK: the "about" prefix is date-fns-specific en copy and moves into
 * i18n keys during Wave ≥ 2.
 */
export function formatRelativeAgoLong(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const locale = getActiveLocale();
  if (locale === 'en') {
    const raw = formatDistanceToNow(date, { addSuffix: false });
    if (raw === 'less than a minute') return 'just now';
    return `${raw} ago`;
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' });
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24) return rtf.format(-hours, 'hour');
  if (days < 30) return rtf.format(-days, 'day');
  if (months < 12) return rtf.format(-months, 'month');
  return rtf.format(-years, 'year');
}

// ─── additional compact-count variants ────────────────────────────────────

/**
 * Feed engagement counts. Matches the local `formatCount` in
 * `feed/FeedCard`, `feed/FeedTopActionBar`, `feed/FeedActionRail`,
 * `fullscreen-feed/ImmersiveFullscreenChrome`, `posts-tab/LightFeedCard`.
 *
 * en quirks (all preserved):
 *   - uppercase `M`, lowercase `k` (mixed case — Intl uses matching case)
 *   - always `.1` decimal for units (Intl trims `.0`)
 *   - `n < 1000` renders as plain integer via `String(n)`
 */
export function formatCountKilo(n: number): string {
  const locale = getActiveLocale();
  if (locale === 'en') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }
  return formatCompact(n);
}

/**
 * Uppercase, always-padded compact. Matches `LoopCard.formatCompact` and the
 * old `posts-tab/utils.ts` shape: `1.2K` / `3.4M`, `.0` retained.
 *
 * QUIRK: `.0` retained for whole units (Intl trims by default).
 */
export function formatCountUpperPadded(n: number): string {
  const locale = getActiveLocale();
  if (locale === 'en') {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }
  return formatCompact(n);
}

