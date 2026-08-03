/**
 * h2hStats - MOVED here from pages/rivalry-page/h2h/_shared/ when the rivalry
 * page was deleted. It is pure (data in, data out) and it is exactly what the
 * compare sheet needs: the H2HStatFormat union already encodes per-row
 * polarity, so no component ever hardcodes a direction.
 *
 * `whoLeads` was folded in from the sibling file it used to sit beside.
 */

export type H2HStatFormat =
  | 'count'
  | 'low_better'
  | 'high_better'
  | 'delta_low_better'
  | 'hot_flag';

export interface H2HStatDef {
  key: string;
  label: string;
  format: H2HStatFormat;
  decimals?: number;
}

export interface PlayerStats {
  // Lifetime
  birdies: number;
  eagles: number;
  albatrosses: number;
  aces: number;
  sub80_rounds: number;
  sub_par_rounds: number;
  top100_played: number;
  rounds_played: number;
  // Personal bests
  lowest_gross: number | null;
  best_stableford: number | null;
  lowest_net: number | null;
  // Current form
  handicap_index: number | null;
  delta90: number | null;
  last5_avg_vs_par: number | null;
  is_hot: boolean;
}

export interface HeadToHeadStats {
  me: PlayerStats;
  them: PlayerStats;
  rivalName: string;
}

/** Render a value for display. ASCII only - a plain hyphen for "no figure". */
export function formatValue(
  raw: unknown,
  format: H2HStatFormat,
  decimals?: number,
): string {
  if (format === 'hot_flag') {
    return raw === 'HOT' ? 'HOT' : 'STEADY';
  }
  if (raw == null || raw === '') return '-';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '-';
  if (decimals != null) {
    const sign = format === 'delta_low_better' && n > 0 ? '+' : '';
    return `${sign}${n.toFixed(decimals)}`;
  }
  return String(Math.round(n));
}

export type Winner = 'me' | 'them' | 'tie';

/**
 * Compare a single stat between the two sides. Polarity comes from `format`,
 * never from the call site.
 */
export function whoLeads(
  format: H2HStatFormat,
  me: unknown,
  them: unknown,
): { winner: Winner; diff: number } {
  if (format === 'hot_flag') {
    if (me === 'HOT' && them !== 'HOT') return { winner: 'me', diff: 0 };
    if (them === 'HOT' && me !== 'HOT') return { winner: 'them', diff: 0 };
    return { winner: 'tie', diff: 0 };
  }

  const m = me as number | null | undefined;
  const t = them as number | null | undefined;

  if (m == null && t == null) return { winner: 'tie', diff: 0 };
  if (m == null) return { winner: 'them', diff: 0 };
  if (t == null) return { winner: 'me', diff: 0 };

  // Nobody leads at zero aces.
  if (m === 0 && t === 0) return { winner: 'tie', diff: 0 };

  if (format === 'count' || format === 'high_better') {
    if (m > t) return { winner: 'me', diff: m - t };
    if (t > m) return { winner: 'them', diff: t - m };
    return { winner: 'tie', diff: 0 };
  }
  if (format === 'low_better' || format === 'delta_low_better') {
    if (m < t) return { winner: 'me', diff: t - m };
    if (t < m) return { winner: 'them', diff: m - t };
    return { winner: 'tie', diff: 0 };
  }
  return { winner: 'tie', diff: 0 };
}
