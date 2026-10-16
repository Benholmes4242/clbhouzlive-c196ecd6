import type { MemberStandingRow } from '@/hooks/gam/useMemberStandings';

/**
 * WHERE YOU STAND — the rules, in one place, reading ONLY RPC columns.
 *
 * THE UI COMPUTES NOTHING. No medal is inferred, no field size is counted, no
 * gap is reconstructed from a rank. The single arithmetic this file performs is
 * the one the brief names — tied_with, and the absolute difference between two
 * columns that are both returned.
 */

/** Score differentials carry one decimal; everything else is a whole number. */
function decimals(category: string): number {
  return category.includes('score_diff') ? 1 : 0;
}

/** Stableford is the ONLY category carrying a unit. */
function unit(category: string): string {
  return category.includes('stableford') ? ' pts' : '';
}

export function formatValue(row: MemberStandingRow): string {
  if (row.value == null) return '—';
  return `${row.value.toFixed(decimals(row.category))}${unit(row.category)}`;
}

export type StandingWindow = 'all' | '90d';

/** The seven boards, in the order the You-tab grid renders them. */
export const BOARD_ORDER = [
  'lowest_gross',
  'best_score_diff',
  'best_stableford',
  'most_birdies',
  'most_eagles',
  'most_aces',
  'most_rounds',
] as const;
export type BoardKey = (typeof BOARD_ORDER)[number];

export const BOARD_LABELS: Record<BoardKey, string> = {
  lowest_gross: 'Lowest gross',
  best_score_diff: 'Best differential',
  best_stableford: 'Best stableford',
  most_birdies: 'Birdies',
  most_eagles: 'Eagles',
  most_aces: 'Holes in one',
  most_rounds: 'Rounds played',
};

/** category -> the board it belongs to and the window it covers. ONE table. */
export const CATEGORY_BOARD: Record<string, { board: BoardKey; window: StandingWindow }> = {
  lowest_gross_all_time: { board: 'lowest_gross', window: 'all' },
  lowest_gross_90d: { board: 'lowest_gross', window: '90d' },
  best_score_diff_all_time: { board: 'best_score_diff', window: 'all' },
  best_score_diff_90d: { board: 'best_score_diff', window: '90d' },
  best_stableford_all_time: { board: 'best_stableford', window: 'all' },
  best_stableford_90d: { board: 'best_stableford', window: '90d' },
  most_rounds_all_time: { board: 'most_rounds', window: 'all' },
  most_rounds_90d: { board: 'most_rounds', window: '90d' },
  most_birdies_all_time: { board: 'most_birdies', window: 'all' },
  most_birdies_90d: { board: 'most_birdies', window: '90d' },
  most_eagles_all_time: { board: 'most_eagles', window: 'all' },
  most_eagles_90d: { board: 'most_eagles', window: '90d' },
  most_aces_all_time: { board: 'most_aces', window: 'all' },
};

/** Derived from the two tables above — Trophy Room strings stay byte-identical. */
export function categoryLabel(category: string): string {
  const m = CATEGORY_BOARD[category];
  if (!m) return category.replace(/_/g, ' ');
  return m.window === '90d' ? `${BOARD_LABELS[m.board]} · 90 days` : BOARD_LABELS[m.board];
}

