import type { LegendCategory } from '@/lib/gam/types';

/**
 * Canonical category order shared between Course Champions drilldown and
 * the compact Course Champions grid cell on the Compete tab.
 * Gross → Hole-in-one (aces) → Eagle → Birdie → Stableford → Score
 */
export const CHAMPIONS_ORDER_90D: LegendCategory[] = [
  'lowest_gross_90d',
  'best_stableford_90d',
  'most_aces_90d',
  'most_albatrosses_90d',
  'most_eagles_90d',
  'most_birdies_90d',
  'most_rounds_90d',
  'best_score_diff_90d',
];

export const CHAMPIONS_ORDER_ALL_TIME: LegendCategory[] = [
  'lowest_gross_all_time',
  'best_stableford_all_time',
  'most_aces_all_time',
  'most_albatrosses_all_time',
  'most_eagles_all_time',
  'most_birdies_all_time',
  'most_rounds_all_time',
  'best_score_diff_all_time',
];

/** Window-agnostic order keyed by the 90d category — used by the compact grid
 *  which already receives a window-filtered holder map. */
export const CHAMPIONS_ORDER: LegendCategory[] = CHAMPIONS_ORDER_90D;

/**
 * L4: Splice the women's-division gross record into the canonical order
 * IMMEDIATELY after its lowest_gross sibling, but ONLY when the holder map
 * actually contains a row for it. When no woman holds the record on this
 * course, the category is invisible — no unclaimed card, no "coming soon".
 *
 * Callable from both the drilldown (which uses the 90d/all-time arrays
 * directly) and the compact grid (which uses CHAMPIONS_ORDER). Pass the
 * base order and the set of categories present in the holder map.
 */
export function orderWithWomensRecord(
  baseOrder: LegendCategory[],
  presentCategories: Set<LegendCategory> | ReadonlyArray<LegendCategory>,
): LegendCategory[] {
  const present = presentCategories instanceof Set
    ? presentCategories
    : new Set(presentCategories);
  const out: LegendCategory[] = [];
  for (const cat of baseOrder) {
    out.push(cat);
    if (cat === 'lowest_gross_90d' && present.has('lowest_gross_women_90d')) {
      out.push('lowest_gross_women_90d');
    } else if (cat === 'lowest_gross_all_time' && present.has('lowest_gross_women_all_time')) {
      out.push('lowest_gross_women_all_time');
    }
  }
  return out;
}
