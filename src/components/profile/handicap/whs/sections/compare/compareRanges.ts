/**
 * compareRanges - WHERE THE BAR'S SCALE COMES FROM.
 *
 * BRIEF_COMPARE_SHEET_DUEL fix 4: a diverging bar is full at a margin of
 * `range`, and that number must be PER CATEGORY - eight shots and eight
 * birdies are not the same size of gap. Claude's React set them by feel
 * (8 shots, 8 points, 7 rounds, 1.5 birdies) and those are NOT shipped.
 *
 * WHAT IS DERIVABLE WITHOUT A NEW QUERY: the brief asks for the margin at
 * roughly the 90th percentile ACROSS the member's comparable pairs. The sheet
 * holds ONE pair at a time - fetchSharedRounds is called for the selected
 * target only - so a cross-pair percentile would need a query per person the
 * member has ever played with. That is not cheap, so it is not what happens
 * here. Instead the percentile is taken across THE PAIR'S OWN ROUNDS, which
 * the sheet already has in full:
 *
 *   gross rows      p90 of |user_gross - rival_gross| over every shared round
 *   stableford rows p90 of |user_stableford - rival_stableford|
 *   win counts      the number of shared rounds (a clean sweep is a full bar)
 *
 * A full bar therefore means "about as far apart as these two get on a bad
 * day", which is the sentence the brief asks the length to say - measured on
 * the pair in front of the member rather than on a population the sheet cannot
 * see. Career count rows have no per-round population at all, so they fall
 * back to CompareStatRow's derived default: the margin as a share of the
 * larger of the two figures.
 */
import type { SharedRoundResult } from '@/lib/whs/api';

export interface CompareRanges {
  gross: number | null;
  stableford: number | null;
  wins: number | null;
}

/** Nearest-rank p90. Small samples fall back to the maximum observed. */
function p90(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil(0.9 * sorted.length) - 1);
  const v = sorted[Math.max(0, idx)];
  return v > 0 ? v : null;
}

export function deriveCompareRanges(
  rounds: SharedRoundResult[] | undefined,
): CompareRanges {
  const rs = rounds ?? [];
  if (rs.length === 0) return { gross: null, stableford: null, wins: null };
  const grossMargins = rs
    .filter((r) => r.user_gross != null && r.rival_gross != null)
    .map((r) => Math.abs(r.user_gross - r.rival_gross));
  const stMargins = rs
    .filter((r) => r.user_stableford != null && r.rival_stableford != null)
    .map((r) => Math.abs(r.user_stableford - r.rival_stableford));
  return {
    gross: p90(grossMargins),
    stableford: p90(stMargins),
    wins: rs.length,
  };
}
