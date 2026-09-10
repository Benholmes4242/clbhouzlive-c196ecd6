/**
 * THE ONE FIELD THRESHOLD, for every surface that asks "is there a field here".
 *
 * A field exists at a course when FIVE OR MORE distinct players have posted a
 * scored round there, EXCLUDING the member being described. The excluded member
 * matters: a member compared against a pool containing themselves is comparing
 * themselves to themselves, and a crown "won" against nobody is not won.
 *
 * The count itself always comes from get_course_hole_field / the batched
 * course-field read, never from a client-side head count of crown holders.
 * Two definitions of "a field" on two surfaces is the fault this constant
 * exists to prevent, so import it — do not restate the 5.
 *
 * Read by: the scorecard sheet's per-hole FIELD row and beat-the-field
 * sentence, and the trophy room's won / uncontested course-records split.
 */
export const FIELD_MIN_PLAYERS = 5;

/** True when a course has a field the subject can be measured against. */
export function hasField(otherPlayers: number | null | undefined): boolean {
  return otherPlayers != null && otherPlayers >= FIELD_MIN_PLAYERS;
}
