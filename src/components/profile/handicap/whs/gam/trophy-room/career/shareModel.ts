/**
 * The rounding and floor rules for every measured figure in the room.
 * They live here so no component invents its own precision.
 *
 * WHY THE DENOMINATOR FLOOR EXISTS: with 30 indexed members every share is a
 * multiple of 3.3 percent, so "held by 3% of members" is exactly one person.
 * Below gam_share_min_denominator NO share renders anywhere in the room and
 * counting rows fall back to counts and thresholds. The plumbing is built so
 * the feature switches itself on when the population arrives. Do not tune the
 * floor down to make the lines appear.
 *
 * RATES AND HANDICAP BANDS ARE DELIBERATELY NOT BUILT. At 6 to 8 members per
 * band a percentile is dead code on real data, so B2 leads with the share.
 * Do not add a rate line back until the population supports a band.
 */
import type { Top100DistributionRow } from '@/hooks/gam/useTop100Distribution';

/** Never imply a precision the sample cannot support. */
export function roundToFive(pct: number): number {
  return Math.max(0, Math.min(100, Math.round(pct / 5) * 5));
}

export interface ShareInput {
  holders: number;
  denominator: number;
}

/**
 * The measured share of members holding something, or null when the
 * population is too small to say anything honest.
 */
export function measuredShare(
  input: ShareInput | undefined,
  minDenominator: number,
): number | null {
  if (!input) return null;
  if (input.denominator < minDenominator) return null;
  if (input.denominator <= 0) return null;
  return roundToFive((input.holders / input.denominator) * 100);
}

/** The highest threshold the member has reached, and who else reached it. */
export function distributionAt(
  rows: Top100DistributionRow[],
  listSlug: string,
  count: number,
): Top100DistributionRow | null {
  const forList = rows
    .filter((r) => r.list_slug === listSlug && r.threshold <= count)
    .sort((a, b) => b.threshold - a.threshold);
  return forList[0] ?? null;
}

/** The next threshold above the member's count, and who has reached it. */
export function nextDistribution(
  rows: Top100DistributionRow[],
  listSlug: string,
  count: number,
): Top100DistributionRow | null {
  const forList = rows
    .filter((r) => r.list_slug === listSlug && r.threshold > count)
    .sort((a, b) => a.threshold - b.threshold);
  return forList[0] ?? null;
}

export type Top100Standing =
  | { kind: 'share'; pct: number }
  | { kind: 'ordinal'; members: number }
  | { kind: 'none' };

/**
 * Below the floor: silence. At or above it: the share of members the member
 * is ahead of. Above the crossover the share saturates ("more than 94%"
 * stops discriminating), so an ordinal bound reads better.
 */
export function top100Standing(
  rows: Top100DistributionRow[],
  listSlug: string,
  count: number,
  floor: number,
  crossover: number,
  minDenominator: number,
): Top100Standing {
  if (count < floor) return { kind: 'none' };
  const row = distributionAt(rows, listSlug, count);
  if (!row || row.denominator < minDenominator) return { kind: 'none' };
  if (count > crossover) return { kind: 'ordinal', members: row.members_at_or_above };
  const pct = roundToFive((row.members_at_or_above / row.denominator) * 100);
  return { kind: 'share', pct: Math.max(0, 100 - pct) };
}
