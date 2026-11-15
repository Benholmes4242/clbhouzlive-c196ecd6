/**
 * The reviewer's own rounds behind a review on the Latest reviews rail
 * (BRIEF_COURSES_MEMBERS_SECTIONS §2).
 *
 * get_review_author_rounds answers only when the reviewer has a round at that
 * course AND the viewer may see that reviewer's handicap, so an absent row is
 * an honest absence: no strip, no placeholder, never an invented figure.
 *
 * The read belongs to the viewer, so the viewer belongs in the query key.
 */

/** One row of get_review_author_rounds. */
export interface ReviewAuthorRound {
  review_id: string;
  rounds_here: number;
  /** Null when the reviewer has no 18-hole round at that course. */
  best_gross: number | null;
  best_to_par: number | null;
}

/** get_review_author_rounds accepts at most 100 ids per call. */
export const AUTHOR_ROUNDS_MAX_IDS = 100;

/** +7 over, E for level, −2 under (U+2212). */
export function toParFigure(n: number): string {
  if (n === 0) return 'E';
  return n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`;
}

/** One round reads "ROUND HERE". */
export function roundsLabel(rounds: number): string {
  return rounds === 1 ? 'ROUND HERE' : 'ROUNDS HERE';
}

/** The viewer's own review names the score as theirs. */
export function bestLabel(mine: boolean): string {
  return mine ? 'YOUR BEST' : 'THEIR BEST';
}

/** Rows keyed by review id; anything incomplete is dropped, never guessed at. */
export function toAuthorRoundsMap(rows: unknown): Map<string, ReviewAuthorRound> {
  const map = new Map<string, ReviewAuthorRound>();
  if (!Array.isArray(rows)) return map;
  for (const raw of rows) {
    const row = raw as Partial<ReviewAuthorRound> | null;
    if (!row || typeof row.review_id !== 'string' || typeof row.rounds_here !== 'number') continue;
    map.set(row.review_id, {
      review_id: row.review_id,
      rounds_here: row.rounds_here,
      best_gross: typeof row.best_gross === 'number' ? row.best_gross : null,
      best_to_par: typeof row.best_to_par === 'number' ? row.best_to_par : null,
    });
  }
  return map;
}
