import {
  differenceInMinutes,
  addMinutes,
  differenceInHours,
  addHours,
  differenceInDays,
  addDays,
  differenceInWeeks,
  addWeeks,
  differenceInMonths,
  addMonths,
  differenceInYears,
  addYears,
  isBefore,
} from 'date-fns';

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`;

/**
 * Returns a human-friendly, Instagram-style "Expires in …" string using calendar-accurate math.
 * Rules:
 * - < 24h          → hours + minutes        (e.g. "Expires in 3h 12m")
 * - 1–6 days       → days + hours           (e.g. "Expires in 2 days, 3h")
 * - 1–4 weeks      → weeks + days           (e.g. "Expires in 3 weeks, 2 days")
 * - 1–11 months    → months + days          (e.g. "Expires in 4 months, 3 days")
 * - ≥ 1 year       → years + months         (e.g. "Expires in 1 year, 2 months")
 */
export function formatExpires(expiresAtISO: string, now: Date = new Date()): string {
  const expiresAt = new Date(expiresAtISO);

  if (isBefore(expiresAt, now)) return 'Expired';

  // < 24 hours → h + m
  const totalHours = differenceInHours(expiresAt, now);
  if (totalHours < 24) {
    const h = totalHours;
    const afterH = addHours(now, h);
    const m = Math.max(0, differenceInMinutes(expiresAt, afterH));
    if (h === 0 && m === 0) return 'Expires in <1m';
    const parts = [];
    if (h > 0) parts.push(plural(h, 'h'));
    if (m > 0) parts.push(plural(m, 'm'));
    return `Expires in ${parts.join(' ')}`;
  }

  // 1–6 days → d + h
  const totalDays = differenceInDays(expiresAt, now);
  if (totalDays < 7) {
    const d = totalDays;
    const afterD = addDays(now, d);
    const h = Math.max(0, differenceInHours(expiresAt, afterD));
    const parts = [plural(d, 'day')];
    if (h > 0) parts.push(plural(h, 'h'));
    return `Expires in ${parts.join(', ')}`;
  }

  // 1–4 weeks → w + d (use calendar weeks)
  const totalWeeks = differenceInWeeks(expiresAt, now);
  if (totalWeeks < 5) {
    const w = totalWeeks;
    const afterW = addWeeks(now, w);
    const d = Math.max(0, differenceInDays(expiresAt, afterW));
    const parts = [plural(w, 'week')];
    if (d > 0) parts.push(plural(d, 'day'));
    return `Expires in ${parts.join(', ')}`;
  }

  // 1–11 months → mo + d (calendar months)
  const totalMonths = differenceInMonths(expiresAt, now);
  if (totalMonths < 12) {
    const mo = totalMonths;
    const afterMo = addMonths(now, mo);
    const d = Math.max(0, differenceInDays(expiresAt, afterMo));
    const parts = [plural(mo, 'month')];
    if (d > 0) parts.push(plural(d, 'day'));
    return `Expires in ${parts.join(', ')}`;
  }

  // ≥ 1 year → y + mo
  const y = differenceInYears(expiresAt, now);
  const afterY = addYears(now, y);
  const mo = Math.max(0, differenceInMonths(expiresAt, afterY));
  const parts = [plural(y, 'year')];
  if (mo > 0) parts.push(plural(mo, 'month'));
  return `Expires in ${parts.join(', ')}`;
}
