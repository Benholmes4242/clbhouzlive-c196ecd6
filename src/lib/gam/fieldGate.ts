/**
 * TWO THRESHOLDS, TWO QUESTIONS. Both live here so nobody can tell them apart
 * by accident, and nobody can "unify" them without reading why they differ.
 *
 * FIELD_MIN_PLAYERS gates an AVERAGE. The scorecard sheet's per-hole FIELD row
 * and beat-the-field sentence ask "is there a field to average against?" -- a
 * statistical claim, and a mean over four golfers is not one. Five is the floor.
 *
 * CROWN_MIN_OTHERS gates a CONTEST. A course record asks the binary question
 * "did anyone else play here?". If one other golfer posted a round and you are
 * top of that board, you beat them: a small contest, not an absent one. So the
 * floor is one, which is the only non-arbitrary answer to that question.
 *
 * DO NOT COLLAPSE THEM. Raising the crown floor to five would call a genuine
 * win over one golfer "uncontested"; lowering the field floor to one would print
 * a per-hole average computed from a single round. Two thresholds on two
 * surfaces is correct when the surfaces ask different questions.
 *
 * WHAT IS SHARED IS THE COUNT, NOT THE FLOOR. Both read distinct players with a
 * scored round at the course EXCLUDING the member being described, and that
 * count always comes from get_course_hole_field / the batched
 * get_course_field_sizes read -- never from a client-side head count of crown
 * holders. The excluded member matters: a member compared against a pool
 * containing themselves is comparing themselves to themselves.
 *
 * Import these -- do not restate the 5 or the 1.
 */
export const FIELD_MIN_PLAYERS = 5;

/** The crown contest floor: one other golfer having played is a contest. */
export const CROWN_MIN_OTHERS = 1;

/** True when a course has a field the subject can be AVERAGED against. */
export function hasField(otherPlayers: number | null | undefined): boolean {
  return otherPlayers != null && otherPlayers >= FIELD_MIN_PLAYERS;
}

/** True when a record at this course was WON against somebody. */
export function hasContest(otherPlayers: number | null | undefined): boolean {
  return otherPlayers != null && otherPlayers >= CROWN_MIN_OTHERS;
}
