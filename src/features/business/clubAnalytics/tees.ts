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
 * §4.4 THE TEES ARE NOT NAMED — and BRIEF_CLUB_ANALYTICS_PAGE_REBUILD §6.1
 * removed the last trace of naming. `teePosition` and `teeLabel` used to append
 * "back", "middle" or "forward" to the yardage, which rendered "middle" three
 * times in a row directly above a footnote saying we do not guess what a club
 * calls a tee. THE YARDAGE IS THE LABEL. Do not reintroduce a position word: a
 * length order is not a tee name, and a club reads it as one.
 */
import type { ClubAnalyticsTee } from './types';

export const yd = (n: number) => `${n.toLocaleString()} yd`;

/** Tee sets, longest first — the order a card is read in. */
export function sortTees(tees: ClubAnalyticsTee[]): ClubAnalyticsTee[] {
  return [...tees].sort((a, b) => b.yards - a.yards);
}
