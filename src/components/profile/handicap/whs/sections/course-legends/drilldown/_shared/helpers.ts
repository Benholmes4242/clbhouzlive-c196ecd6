import type { LegendCategory } from '@/lib/gam/types';

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
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

/** Rank tier colour — used for rank chips, champion card border, etc. */
export const RANK_TIER = {
  gold: { color: '#FBBC2E', bg: 'rgba(251,188,46,0.14)', border: 'rgba(251,188,46,0.40)' },
  silver: { color: '#C0C0C0', bg: 'rgba(192,192,192,0.10)', border: 'rgba(192,192,192,0.30)' },
  bronze: { color: '#CD7F32', bg: 'rgba(205,127,50,0.10)', border: 'rgba(205,127,50,0.30)' },
  neutral: { color: 'var(--hcp-t-60)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
};

export function rankTier(rank: number) {
  if (rank === 1) return RANK_TIER.gold;
  if (rank === 2) return RANK_TIER.silver;
  if (rank === 3) return RANK_TIER.bronze;
  return RANK_TIER.neutral;
}

/** Entries newer than this get the green "NEW" badge */
export const NEW_BADGE_DAYS = 7;

/** Categories where a LOWER value beats a higher one. */
export function isLowerBetterCategory(cat: LegendCategory): boolean {
  return (
    cat === 'best_score_diff_90d' ||
    cat === 'best_score_diff_all_time' ||
    cat === 'lowest_gross_90d' ||
    cat === 'lowest_gross_all_time'
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
