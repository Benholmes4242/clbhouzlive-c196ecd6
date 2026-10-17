import type { LegendCategory } from '@/lib/gam/types';

/** State 3: category semantics live with the order, not in cabinet consumers.
 * Stableford is a single-round score but cannot be inferred from a gross range.
 */
export type ChampionsBoardKind = 'projectable' | 'not-projectable' | 'cumulative';
type BoardData = { kind: ChampionsBoardKind; projection?: 'gross' | 'net' | 'differential'; name: string };
export const CHAMPIONS_BOARD_DATA: Record<LegendCategory, BoardData> = {
  lowest_gross_all_time: { kind: 'projectable', projection: 'gross', name: 'gross' },
  lowest_gross_90d: { kind: 'projectable', projection: 'gross', name: 'gross' },
  lowest_gross_women_all_time: { kind: 'projectable', projection: 'gross', name: "women's gross" },
  lowest_gross_women_90d: { kind: 'projectable', projection: 'gross', name: "women's gross" },
  lowest_net_all_time: { kind: 'projectable', projection: 'net', name: 'net' },
  best_score_diff_all_time: { kind: 'projectable', projection: 'differential', name: 'differential' },
  best_score_diff_90d: { kind: 'projectable', projection: 'differential', name: 'differential' },
  best_stableford_all_time: { kind: 'not-projectable', name: 'stableford' },
  best_stableford_90d: { kind: 'not-projectable', name: 'stableford' },
  most_birdies_all_time: { kind: 'cumulative', name: 'birdies' },
  most_birdies_90d: { kind: 'cumulative', name: 'birdies' },
  most_eagles_all_time: { kind: 'cumulative', name: 'eagles' },
  most_eagles_90d: { kind: 'cumulative', name: 'eagles' },
  most_aces_all_time: { kind: 'cumulative', name: 'aces' },
  most_aces_90d: { kind: 'cumulative', name: 'aces' },
  most_albatrosses_all_time: { kind: 'cumulative', name: 'albatrosses' },
  most_albatrosses_90d: { kind: 'cumulative', name: 'albatrosses' },
  most_rounds_all_time: { kind: 'cumulative', name: 'rounds' },
  most_rounds_90d: { kind: 'cumulative', name: 'rounds' },
};

/** CHAMPIONS_ELSEWHERE_N: the ONE display name per board, short enough for the
 * 114px cabinet tile. Every Champions surface reads it; none spells its own.
 * Display only - database category names are unchanged. */
const BOARD_DISPLAY_BY_BASE: Record<string, string> = {
  lowest_gross: 'Gross', lowest_gross_women: "Women's gross", lowest_net: 'Net',
  best_stableford: 'Stableford', best_score_diff: 'Differential',
  most_eagles: 'Eagles', most_birdies: 'Birdies', most_rounds: 'Rounds',
  most_aces: 'Aces', most_albatrosses: 'Albatrosses',
};
export function championsBoardName(category: LegendCategory): string {
  return BOARD_DISPLAY_BY_BASE[category.replace(/_(all_time|90d)$/, '')] ?? category;
}

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
  /* BRIEF_STANDING_TAP 2b - Net sits directly under Gross: same question,
     the other scoring basis. All-time only; absent from the 90d order. */
  'lowest_net_all_time',
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

/** CHAMPIONS_NET_SOURCE_1 RA3–RA5: a board whose SOURCE is unavailable (fetch
 * failed or source absent) is dropped before anything is counted. A source
 * that answered with zero rows is a real, never-claimed board and stays.
 * Decided by query outcome, never by row count.
 */
export function withAvailableSources(order: readonly LegendCategory[], unavailable: ReadonlySet<LegendCategory>): LegendCategory[] {
  return order.filter(category => !unavailable.has(category));
}

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
