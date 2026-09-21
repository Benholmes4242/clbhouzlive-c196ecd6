/**
 * Tour Hub is built on stroke-play grammar: a to-par score where lower is
 * better, a position, and a player per row. Three of the four formats in
 * sr_tournaments.event_type break that contract:
 *
 *   team  — team rows, no player rows; scores and positions are valid
 *   cup   — two team rows, position null, and `score` holds MATCH POINTS,
 *           where HIGHER wins. Taking min(score) names the losing side.
 *   match — player rows with no scores at all
 *
 * Any surface that names a leader, names a champion, or renders a board of
 * to-par scores must gate on isStrokeEvent. Schedules, listings, news and
 * admin must NOT gate — the Ryder Cup belongs in a schedule.
 */
export type EventFormat = 'stroke' | 'team' | 'cup' | 'match';

export function eventFormat(raw: string | null | undefined): EventFormat {
  return raw === 'team' || raw === 'cup' || raw === 'match' ? raw : 'stroke';
}

export function isStrokeEvent(raw: string | null | undefined): boolean {
  return eventFormat(raw) === 'stroke';
}
