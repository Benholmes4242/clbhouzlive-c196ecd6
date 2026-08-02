/**
 * timelineUtils — shared date/month helpers for schedule-v2.
 *
 * Deduped from useSeasonTimeline.ts and useMergedSchedule.ts, which carried
 * byte-identical copies. Month labels are locale-driven (formatMonthYearLong)
 * rather than a hardcoded English array.
 */
import { formatMonthYearLong } from '@/i18n/format';

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // yyyy-MM
}

export function monthLabelFromKey(key: string): string {
  return formatMonthYearLong(new Date(`${key}-01T12:00:00Z`)).toUpperCase();
}

export function todayNoonMs(): number {
  const d = new Date();
  return new Date(`${d.toISOString().split('T')[0]}T12:00:00Z`).getTime();
}

export function daysUntil(startDate: string): number | null {
  if (!startDate) return null;
  const t = new Date(`${startDate}T12:00:00Z`).getTime();
  return Math.max(0, Math.ceil((t - todayNoonMs()) / 86_400_000));
}
