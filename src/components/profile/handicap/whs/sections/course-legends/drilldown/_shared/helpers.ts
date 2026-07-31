import type { LegendCategory } from '@/lib/gam/types';
import { formatDay2MonthYearShortGB } from '@/i18n/format';

export function formatHeldFor(days: number): string {
  if (days < 1) return 'Held today';
  if (days < 7) return `Held ${days}d`;
  if (days < 30) return `Held ${Math.floor(days / 7)}w`;
  if (days < 365) return `Held ${Math.floor(days / 30)}mo`;
  return `Held ${Math.floor(days / 365)}y`;
}

export function daysSince(iso: string | null): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
}

export function formatAttainedAt(iso: string): string {
  // en-GB pins day-before-month regardless of option order — matches
  // legacy `{ month:'short', day:'2-digit', year:'numeric' }` → "05 Jul 2026".
  return formatDay2MonthYearShortGB(iso);
}

/* RANK_TIER / rankTier removed with the tinted rank chips
   (BRIEF_COURSE_CHAMPIONS_TAB_TREATMENT §2) — rank is a plain figure now. */


/** Entries newer than this get the green "NEW" badge */
export const NEW_BADGE_DAYS = 7;

/** Categories where a LOWER value beats a higher one. */
export function isLowerBetterCategory(cat: LegendCategory): boolean {
  return (
    cat === 'best_score_diff_90d' ||
    cat === 'best_score_diff_all_time' ||
    cat === 'lowest_gross_90d' ||
    cat === 'lowest_gross_all_time' ||
    cat === 'lowest_gross_women_90d' ||
    cat === 'lowest_gross_women_all_time'
  );
}

/** Signed gap string from champion, e.g. "+4" or "-60". Matches drilldown display rules. */
export function formatGapFromChampion(
  cat: LegendCategory,
  rowValue: number,
  championValue: number,
): string {
  const diff = rowValue - championValue;
  if (isLowerBetterCategory(cat)) {
    const v = diff.toFixed(1).replace(/\.0$/, '');
    return diff > 0 ? `+${v}` : v;
  }
  return diff < 0 ? `${diff}` : `+${diff}`;
}
