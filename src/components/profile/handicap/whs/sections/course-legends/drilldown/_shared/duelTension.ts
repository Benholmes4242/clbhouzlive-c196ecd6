import type { LegendCategory } from '@/lib/gam/types';
import { formatLegendGap } from '@/lib/gam/visuals';

/** Gap window that maps to "full tension" for value categories. */
const VALUE_CAP: Partial<Record<LegendCategory, number>> = {
  lowest_gross_90d: 10, lowest_gross_all_time: 10,
  best_stableford_90d: 15, best_stableford_all_time: 15,
  best_score_diff_90d: 8, best_score_diff_all_time: 8,
};

const isCountCategory = (cat: LegendCategory) => cat.startsWith('most_');

/**
 * Tension-bar fill (0.08–0.92) for the duel. Returned fill is the LEFT
 * (crown) side's share of the bar.
 */
export function duelTension(cat: LegendCategory, leftValue: number, rightValue: number): number {
  const clamp = (n: number) => Math.max(0.08, Math.min(0.92, n));
  if (isCountCategory(cat)) {
    const total = leftValue + rightValue;
    if (total <= 0) return 0.5;
    return clamp(leftValue / total);
  }
  const cap = VALUE_CAP[cat] ?? 10;
  const gap = Math.abs(leftValue - rightValue);
  const dominance = Math.min(gap / cap, 1);
  return clamp(0.5 + dominance * 0.42);
}

/** The emotional line under the bar. */
export function duelLine(
  cat: LegendCategory,
  championValue: number,
  opponentValue: number,
  defending: boolean,
  standsAlone: boolean,
): string {
  if (standsAlone) return 'The champion stands alone. Be the first to challenge.';
  const gap = Math.abs(championValue - opponentValue);
  if (gap === 0) return 'Tied for the crown';
  const gapText = formatLegendGap(cat, gap);
  return defending ? `Defending by ${gapText}` : `${gapText} to take the crown`;
}
