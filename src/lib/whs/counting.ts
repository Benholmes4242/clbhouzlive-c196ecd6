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

/**
 * THE COUNTING WINDOW (BRIEF_COUNTER_WINDOW_SCOPE).
 *
 * England Golf refreshes is_counter only for rounds inside the member's
 * current twenty-round window, so the flag is meaningful there and a
 * leftover outside it. Any surface asking whether a round counts must ask
 * inside this window. Input is assumed most-recent-first. The window is a
 * count of rounds, nothing more — no date rule, no differential comparison.
 */
export function counterWindow<T>(rounds: readonly T[]): T[] {
  return rounds.slice(0, 20);
}
