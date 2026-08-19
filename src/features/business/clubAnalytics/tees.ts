/**
 * BRIEF_CLUB_ANALYTICS_TAB (v2) §4 — THE TEE.
 *
 * THE TEE IS RECOVERABLE FROM distance_yards and nobody had noticed. Hanbury's
 * hole 1 appears at 322, 347 and 351 yards; hole 5 at 385, 422 and 456 — and
 * hole 5 scores LEVEL off 385 and +0.75 off 456. Three quarters of a shot from
 * the tee choice alone. A stroke index ranking taken across every yardage is
 * therefore RANKING THREE GOLF COURSES AT ONCE.
 *
 * HOW YARDAGES ARE GROUPED (§4.1 — this is the judgement, and it is visible):
 *   A tee is the ROUND'S OWN 18-HOLE YARDAGE TOTAL, exact, not clustered.
 *   Every hole row in a round carries the yardage that round was played off, so
 *   the sum of a round's 18 distances is a fingerprint of the tee played. That
 *   gives 5 distinct sets at Sundridge East and 4 at Hanbury — real tee sets,
 *   not the artefacts a per-hole distance clustering would invent. NO
 *   TOLERANCE BAND is applied: two totals that differ by a yard are two sets,
 *   because inventing a merge threshold is a second judgement we do not need.
 *
 * §4.4 THE TEES ARE NOT NAMED. We know the yardage; we do not know whether the
 * club calls it white, yellow or blue. The label IS the yardage plus a neutral
 * position word, and a colour would be a fabrication in a new place.
 */
import type { ClubAnalyticsTee, ClubAnalyticsVerdictScope } from './types';
import { TEE_DOMINANT_SHARE } from './constants';

export const yd = (n: number) => `${n.toLocaleString()} yd`;

/**
 * The neutral position word (§4.4). Derived purely from length order within
 * this course: the longest set is the back, the shortest the forward, and
 * anything between is the middle. No colour, ever.
 */
export function teePosition(yards: number, all: ClubAnalyticsTee[]): string {
  if (all.length <= 1) return 'the only set we measure';
  const lengths = all.map((t) => t.yards);
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  if (yards === max) return 'back';
  if (yards === min) return 'forward';
  return 'middle';
}

export function teeLabel(t: ClubAnalyticsTee, all: ClubAnalyticsTee[]): string {
  return `${yd(t.yards)} · ${teePosition(t.yards, all)}`;
}

/** Tee sets, longest first — the order a card is read in. */
export function sortTees(tees: ClubAnalyticsTee[]): ClubAnalyticsTee[] {
  return [...tees].sort((a, b) => b.yards - a.yards);
}

/**
 * §4.3 — one line naming the spread. It reports the gap between the easiest and
 * hardest-scoring measured yardage, in strokes per round, and makes NO claim
 * that length caused it: at Sundridge East the 6,597-yard set scores BETTER
 * than the 6,476-yard set, because the players who go back are the better
 * players. Stating "longer is harder" would be a finding the data refuses.
 */
export function teeSpreadLine(tees: ClubAnalyticsTee[]): string | null {
  const measured = tees.filter((t) => t.rounds > 0);
  if (measured.length < 2) return null;
  const hardest = measured.reduce((a, b) => (b.avg_to_par > a.avg_to_par ? b : a));
  const easiest = measured.reduce((a, b) => (b.avg_to_par < a.avg_to_par ? b : a));
  const perHole = hardest.avg_to_par - easiest.avg_to_par;
  const perRound = perHole * 18;
  if (perRound < 0.5) {
    return `Your measured sets score within half a shot of each other over 18 holes, so the tee played makes little difference to what gets returned here.`;
  }
  return `Between your ${yd(easiest.yards)} set and your ${yd(hardest.yards)} set there is ${perRound.toFixed(1)} shots a round, on the rounds we hold. That is the gap to price and to set competitions against — it is a difference in what gets returned, not a claim that the longer set is the harder test.`;
}

/**
 * §4.2 — THE MEMBER IS ALWAYS TOLD WHICH TEES THE VERDICT IS ABOUT. A stroke
 * index verdict that silently mixes tees is worse than no verdict.
 *
 * IF ONE TEE DOMINATES the verdict is SCOPED to it and says so; if the rounds
 * are spread it is ADJUSTED — each hole's mean is taken WITHIN a tee set, where
 * all 18 holes share one population, then combined across sets weighted by
 * rounds — and it says that instead.
 */
export function verdictScopeLine(scope: ClubAnalyticsVerdictScope | null | undefined): string {
  if (!scope) {
    return 'We hold no tee breakdown for these rounds, so this ranking is taken across every yardage played here. Read it as the course as a whole rather than as one set of tees.';
  }
  if (scope.mode === 'scoped' && scope.tee_yards != null) {
    return `Measured off your ${yd(scope.tee_yards)} set, which carries ${scope.tee_rounds.toLocaleString()} of the rounds we hold — ${Math.round(scope.tee_share * 100)}% of them. Holes are only ranked against each other when they were played off the same tee.`;
  }
  return `Your rounds are spread across ${scope.tee_count} measured yardages, so each hole is ranked within the set it was played off and those rankings are then combined. A hole played mostly off the back does not look harder for it.`;
}

/** The dominance test, kept beside the copy that reports it. */
export function teeDominates(share: number): boolean {
  return share >= TEE_DOMINANT_SHARE;
}
