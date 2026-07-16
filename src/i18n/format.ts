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
    if (seconds < 60) return 'just now';
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
