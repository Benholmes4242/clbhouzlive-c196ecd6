/**
 * storyTime — the ONE relative-time reading for a Wire story.
 *
 * Story freshness is elapsed-time based, never calendar-day based. In
 * particular, YESTERDAY means 24–48 real hours ago; it is not a date label.
 */
import { formatDayMonthShortGB } from '@/i18n/format';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'] as const;

function storyDate(date: Date): string {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function storyTime(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const ageMs = Math.max(0, now.getTime() - t);
  const elapsedHours = Math.floor(ageMs / (60 * 60 * 1000));
  if (elapsedHours < 1) return 'JUST NOW';
  if (elapsedHours < 24) return `${elapsedHours}H AGO`;
  if (elapsedHours < 48) return 'YESTERDAY';
  if (ageMs < WEEK_MS) return `${Math.floor(elapsedHours / 24)} DAYS AGO`;
  return storyDate(new Date(t));
}
