/** YC2: history means all returned 18-hole points (within the hook's global
 * read ceiling), not the list row's round count. Only the plot slices to 15.
 * Keep decisions here so chart geometry, trend and facts share one basis. */
import type { CourseRoundPoint } from '@/hooks/gam/useMyRoundsByCourse';

export function fmtSigned(n: number, digits: number): string {
  const rounded = Number(n.toFixed(digits));
  const abs = Math.abs(rounded).toFixed(digits);
  return rounded > 0 ? `+${abs}` : rounded < 0 ? `-${abs}` : abs;
}

/** Preserve the existing exact-percent rare-outcome rule, including its 0.1 floor. */
export function fmtBucketPct(pct: number, pctExact: number, count: number): string {
  if (count > 0 && pct === 0) {
    return `${Math.max(0.1, Number(pctExact.toFixed(1))).toFixed(1)}%`;
  }
  return `${pct}%`;
}

export function ordinal(n: number): string {
  const hundred = n % 100;
  const suffix = hundred >= 11 && hundred <= 13 ? 'th'
    : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
  return `${n}${suffix}`;
}

export function roundDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date));
}

export function openCourseHistory(points: CourseRoundPoint[]) {
  const ordered = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const count = ordered.length;
  const average = count ? ordered.reduce((sum, p) => sum + p.toPar, 0) / count : null;
  const last10 = count >= 15
    ? ordered.slice(-10).reduce((sum, p) => sum + p.toPar, 0) / 10 : null;
  const difference = average != null && last10 != null ? average - last10 : null;
  const trend = difference == null ? null
    : difference >= 0.3 - Number.EPSILON * 16 ? 'better'
    : difference <= -0.3 + Number.EPSILON * 16 ? 'worse' : 'inline';
  const best = ordered.reduce<CourseRoundPoint | null>((best, p) =>
    best == null || p.toPar < best.toPar ? p : best, null);
  const shown = count >= 3 ? ordered.slice(-15) : [];
  const low = shown.length ? Math.min(...shown.map(p => p.toPar)) : 0;
  const high = shown.length ? Math.max(...shown.map(p => p.toPar)) : 0;
  const padding = Math.max(0.5, (high - low) * 0.1);
  const y = (value: number) => 8 + ((value - low + padding) / (high - low + padding * 2)) * 94;
  const plot = shown.map((p, i) => ({ ...p, x: 4 + i / (shown.length - 1) * 318, y: y(p.toPar) }));
  const bestShown = plot.reduce<(typeof plot)[number] | null>((best, p) =>
    best == null || p.toPar < best.toPar ? p : best, null);
  return { count, average, last10, difference, trend, best, shown, plot, bestShown,
    averageY: average == null ? null : y(average) };
}