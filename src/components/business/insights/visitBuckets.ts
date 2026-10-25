/** CB83: UTC keys own visits/post alignment; slice the RPC's opening extra
 * day. Ninety days is thirteen seven-day sums ending on the last series day.
 * Latest ties win; source aliases merge before ordering, other always last. */
import type { VisitsSeriesPoint } from '@/hooks/useBusinessInsights';
export interface VisitBucket { day: string; end: string; total: number; posts: number }
export type SourceName = 'search' | 'feed' | 'content' | 'course' | 'directory' | 'shared' | 'other';
export const utcDay = (date: string | Date | number) => new Date(date).toISOString().slice(0, 10);
export const previousDay = (day: string) => utcDay(new Date(`${day}T00:00:00Z`).getTime() - 86400000);
export function visitBuckets(series: VisitsSeriesPoint[], dates: string[], days: number): VisitBucket[] {
  const posts = new Map<string, number>();
  dates.forEach(date => { const day = utcDay(date); posts.set(day, (posts.get(day) ?? 0) + 1); });
  const daily = series.slice(-(days === 90 ? 91 : days));
  const size = days === 90 ? 7 : 1;
  const result: VisitBucket[] = [];
  for (let i = 0; i < daily.length; i += size) {
    const run = daily.slice(i, i + size), first = run[0], last = run[run.length - 1];
    if (!first || !last) continue;
    result.push({ day: first.day, end: last.day, total: run.reduce((n, p) => n + p.total, 0), posts: run.reduce((n, p) => n + (posts.get(p.day) ?? 0), 0) });
  }
  return result;
}
export function axisIndices(length: number, days: number): number[] {
  if (days === 7) return Array.from({ length }, (_, i) => i);
  return Array.from(new Set(Array.from({ length: Math.min(4, length) }, (_, i) => Math.round(i * (length - 1) / 3))));
}
export function busiestPeriod(buckets: VisitBucket[], dates: string[], days: number, today = utcDay(new Date())) {
  const best = buckets.reduce<VisitBucket | null>((a, b) => b.total > 0 && (!a || b.total >= a.total) ? b : a, null);
  if (!best) return null;
  const posted = dates.map(date => utcDay(date));
  const relation = days === 90 ? null : posted.includes(best.day) ? 'same' : posted.includes(previousDay(best.day)) ? 'after' : null;
  // CB83.1 counts only the clause's UTC day, never both adjacent days.
  const postCount = relation ? posted.filter(day => day === (relation === 'same' ? best.day : previousDay(best.day))).length : 0;
  return { ...best, relation, postCount, dateKind: days === 90 ? 'date' : best.day === today ? 'today' : best.day === previousDay(today) ? 'yesterday' : 'date' } as const;
}
export function sourceName(source: string | null): SourceName {
  switch (source) {
    case 'search': return 'search'; case 'feed': return 'feed'; case 'content': return 'content';
    case 'course_page': return 'course'; case 'directory': return 'directory';
    case 'share': case 'shared': return 'shared'; default: return 'other';
  }
}
export function sourceBuckets(sources: { source: string | null; count: number }[]) {
  const merged = new Map<SourceName, number>();
  sources.forEach(({ source, count }) => {
    if (count <= 0) return;
    const name = sourceName(source); merged.set(name, (merged.get(name) ?? 0) + count);
  });
  return Array.from(merged, ([name, count]) => ({ name, count })).sort((a, b) => a.name === 'other' ? 1 : b.name === 'other' ? -1 : b.count - a.count);
}