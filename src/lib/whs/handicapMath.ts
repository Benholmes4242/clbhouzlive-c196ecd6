import type { WhsScoreWithIndex } from './types';

export interface NextRoundProjection {
  /** Differential needed to cut handicap below current. Beat this and you drop. */
  cutTarget: number;
  /** Where handicap settles if next round doesn't make top 8. */
  settleAt: number;
  /** True if settleAt > currentHandicap (handicap rises unless cut target is beaten). */
  isAtRisk: boolean;
  /** Whether projection is reliable (need at least 8 rounds with diffs). */
  hasData: boolean;
  /** Raw (unrounded) settle value — lets the UI decide visibility on the displayed delta. */
  settleAtRaw: number;
  /** True if the round rolling off (oldest of last 20) is currently in the counting top 8. */
  counterDropping: boolean;
}

/**
 * Project the outcome of the user's next round.
 *
 * Assumes WHS rolling-20: when a new round is added, the oldest round in the
 * last 20 drops out. We simulate this and compute three values:
 *
 * - cutTarget: differential to beat for a handicap cut
 * - settleAt: handicap value if next round doesn't enter top 8 (worse than cutTarget)
 * - isAtRisk: true if settleAt > currentHandicap (good counter is dropping)
 *
 * @param last20 - up to 20 most recent rounds, ordered by play_date DESC
 * @param currentHandicap - current handicap index
 */
export function projectNextRound(
  last20: WhsScoreWithIndex[],
  currentHandicap: number,
): NextRoundProjection {
  const validDiffs = last20
    .map((r) => r.handicap_differential)
    .filter((d): d is number => d != null);

  if (validDiffs.length < 8) {
    return {
      cutTarget: 0, settleAt: currentHandicap, isAtRisk: false, hasData: false,
      settleAtRaw: currentHandicap, counterDropping: false,
    };
  }

  // Sort last20 by play_date ascending to identify the OLDEST (which rolls out)
  const sortedByDate = [...last20].sort(
    (a, b) => new Date(a.play_date).getTime() - new Date(b.play_date).getTime(),
  );

  // Remaining 19 = drop the oldest (index 0 after asc sort)
  const remaining19 = sortedByDate.slice(1);
  const remaining19Diffs = remaining19
    .map((r) => r.handicap_differential)
    .filter((d): d is number => d != null);

  // Sort remaining diffs ASCENDING to pick the top 8 (lowest = best)
  const remainingSorted = [...remaining19Diffs].sort((a, b) => a - b);
  const top8Remaining = remainingSorted.slice(0, 8);
  const top7Remaining = remainingSorted.slice(0, 7);

  const sumTop7 = top7Remaining.reduce((s, d) => s + d, 0);
  const cutTarget = 8 * currentHandicap - sumTop7;

  const settleAt = top8Remaining.reduce((s, d) => s + d, 0) / 8;

  const isAtRisk = settleAt > currentHandicap + 0.05;

  // Is the oldest round (the one rolling off) currently in the counting top 8?
  const currentTop8Ids = new Set(
    [...last20]
      .filter((r) => r.handicap_differential != null)
      .sort(
        (a, b) =>
          (a.handicap_differential as number) - (b.handicap_differential as number),
      )
      .slice(0, 8)
      .map((r) => r.id),
  );
  const oldestRound = sortedByDate[0];
  const counterDropping = oldestRound ? currentTop8Ids.has(oldestRound.id) : false;

  return {
    cutTarget: Number(cutTarget.toFixed(1)),
    settleAt: Number(settleAt.toFixed(1)),
    isAtRisk,
    hasData: true,
    settleAtRaw: settleAt,
    counterDropping,
  };
}

// ─── Sanity filters ─────────────────────────────────────────────────────────
// These predicates filter out corrupt WHS rows (incomplete syncs, 9-hole
// rounds mis-flagged as 18, etc.) before they pollute "best ever" stats.
// Thresholds are deliberately generous — far below any humanly achievable
// 18-hole round — so legitimate "round of a lifetime" scores pass through.

/**
 * Minimum plausible 18-hole gross score.
 * World record for 18 holes is 55 (2012, on a par-72). Anything below 50
 * is essentially guaranteed to be a data error, not a real round.
 */
export const MIN_REASONABLE_GROSS = 50;

/**
 * Minimum plausible handicap differential. Differentials below -10 are
 * implausible — they would imply shooting 10+ strokes better than the
 * course rating. A tour pro on a great day might hit -3 to -5.
 */
export const MIN_REASONABLE_DIFF = -10;

/** True if the round's adjusted_gross is in a humanly-achievable range. */
export function isReasonableGross(s: { adjusted_gross: number | null }): boolean {
  return s.adjusted_gross != null && s.adjusted_gross >= MIN_REASONABLE_GROSS;
}

/** True if the round's handicap_differential is plausible. */
export function isReasonableDiff(s: { handicap_differential: number | null }): boolean {
  return s.handicap_differential != null && s.handicap_differential >= MIN_REASONABLE_DIFF;
}
