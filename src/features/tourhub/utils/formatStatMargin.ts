/**
 * formatStatMargin — single source of truth for #1-vs-#2 gap copy
 * across Stat Watch hero pills and StatOfTheWeek.
 *
 * Behavior:
 *   - Equal values  → { copy: 'tied with #2', variant: 'normal' }
 *   - Higher-better → "+{gap}{unit}"  variant 'highlight'
 *   - Lower-better  → "−{gap}{unit}"  variant 'highlight'   (U+2212, NOT hyphen)
 *
 * Per-stat precision/units are encoded inline (mirrors the old
 * useGamifiedLeaderboards.formatMarginValue logic so back-port
 * produces byte-identical output for existing surfaces).
 */

export interface StatMarginInput {
  leaderValue: number;
  runnerValue: number;
  /** Category unit (e.g. 'yds', '%', 'events', 'cuts', '' ). */
  unit: string;
  higherIsBetter: boolean;
  /**
   * Optional category key — lets the formatter apply the same
   * per-stat precision rules as the legacy formatMarginValue
   * (earnings, putt_avg, scoring_avg, strokes_gained_total, top_10).
   */
  categoryKey?: string;
  /** Override decimals; ignored when categoryKey rule fires. */
  precision?: number;
}

export interface StatMarginOutput {
  copy: string;
  variant: 'highlight' | 'normal';
}

/** U+2212 MINUS SIGN — typographic minus, not the hyphen-minus '-'. */
const MINUS = '\u2212';

/**
 * Format an absolute gap value (no sign, no "tied" copy) using the
 * same per-stat precision rules formatStatMargin uses internally.
 *
 * Exported so `useGamifiedLeaderboards.formatMarginValue` can delegate
 * here without duplicating precision logic, while still producing the
 * sign-less display StatOfTheWeek expects.
 */
export function formatStatMarginGap(
  gap: number,
  unit: string,
  categoryKey?: string,
  precision?: number,
): string {
  // Earnings — currency formatting, no trailing unit.
  if (categoryKey === 'earnings') {
    if (gap >= 1_000_000) return `$${(gap / 1_000_000).toFixed(2)}M`;
    if (gap >= 1_000) return `$${(gap / 1_000).toFixed(0)}K`;
    return `$${Math.round(gap).toLocaleString()}`;
  }

  // Per-stat precision rules (preserved from legacy formatMarginValue).
  if (categoryKey === 'putt_avg' || categoryKey === 'scoring_avg') {
    return `${gap.toFixed(3)}${unit ? ` ${unit}` : ''}`;
  }
  if (categoryKey === 'strokes_gained_total') {
    return gap.toFixed(2);
  }
  if (
    unit === 'events' ||
    unit === 'cuts' ||
    categoryKey === 'top_10' ||
    categoryKey === 'cuts_made' ||
    categoryKey === 'events_played'
  ) {
    return `${Math.round(gap)}${unit ? ` ${unit}` : ''}`;
  }

  // Unit-driven defaults.
  if (unit === 'yds') return `${gap.toFixed(1)} yds`;
  if (unit === '%') return `${gap.toFixed(1)}%`;

  // Generic fallback.
  const decimals = precision ?? 2;
  return `${gap.toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
}

export function formatStatMargin(input: StatMarginInput): StatMarginOutput {
  const { leaderValue, runnerValue, unit, higherIsBetter, categoryKey, precision } = input;

  if (leaderValue === runnerValue) {
    return { copy: 'tied with #2', variant: 'normal' };
  }

  const gap = higherIsBetter
    ? leaderValue - runnerValue
    : runnerValue - leaderValue;

  // If gap is negative the leader is on the wrong side of #2 (data anomaly);
  // use absolute and let direction be inferred from higherIsBetter.
  const absGap = Math.abs(gap);
  const formatted = formatStatMarginGap(absGap, unit, categoryKey, precision);
  const sign = higherIsBetter ? '+' : MINUS;

  return { copy: `${sign}${formatted}`, variant: 'highlight' };
}
