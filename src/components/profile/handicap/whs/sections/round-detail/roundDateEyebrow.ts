/**
 * THE ROUND'S DATE LINE, in one place.
 *
 * Extracted from RoundDetailSheet unchanged so the swipe preview prints the
 * date exactly as the sheet does (BRIEF_ROUND_SHEET_PEEK §1) — a second copy
 * would be a second format the moment either was touched.
 *
 * Two named formats live here, and only here:
 *  - fmtDateEyebrow — short caps ("FRI, 2 OCT") for the TOUR eyebrow (KICKER,
 *    nowrap 252px at 390pt; the long form clips there).
 *  - fmtDateLong — the locale's long date, weekday, no year ("Friday 2 October")
 *    for the MEMBER place line. No ordinal: Intl has none, and composing one
 *    is English sentence structure.
 */

import { formatWeekdayShortGB, formatMonthShortGB } from '@/i18n/format';

export function fmtDateEyebrow(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dow = formatWeekdayShortGB(d).toUpperCase();
  const day = d.getDate();
  const mon = formatMonthShortGB(d).toUpperCase();
  return `${dow}, ${day} ${mon}`;
}

/** fmtDateLong lives in @/i18n/format (shared with Explore's featured round). */
export { fmtDateLong } from '@/i18n/format';
