/**
 * storyTime — the ONE relative-time reading for a Wire story.
 *
 * It writes no time maths of its own. Inside a week it delegates to the app's
 * existing `formatRelativeAgo` (with the `yesterday` opt-in), and beyond a week
 * it delegates to the existing GB short date formatter. Two existing helpers,
 * composed; no third relative-time implementation.
 */
import { formatRelativeAgo, formatDayMonthShortGB } from '@/i18n/format';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function storyTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  if (Date.now() - t >= WEEK_MS) return formatDayMonthShortGB(new Date(t));
  return formatRelativeAgo(new Date(t), { yesterday: true });
}
