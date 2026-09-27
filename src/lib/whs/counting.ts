/**
 * ONE DEFINITION OF "COUNTING" (BRIEF_HANDICAP_TAB_PHASE_2 §3).
 *
 * A round counts towards the index when the federation says it does:
 * whs_scores.is_counter. Nothing on the handicap surface compares a
 * differential against a cut to decide this — two hand-written comparisons
 * disagreed at exactly the cut value in the prototype. Every place that says
 * whether a round counts calls this.
 */
export function countsTowardIndex(round: { is_counter?: boolean | null }): boolean {
  return round.is_counter === true;
}
