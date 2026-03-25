/**
 * getTournamentDisplayState
 *
 * Single source of truth for tournament display state across all surfaces.
 *
 * live     — Sportradar reports inprogress
 * result   — Tournament closed/complete within the last 2 days
 * upcoming — Everything else (scheduled, created, or result window expired)
 */
export type TournamentDisplayState = 'live' | 'result' | 'upcoming';

const RESULT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export function getTournamentDisplayState(
  status: string,
  endDate: string,
  now: Date = new Date()
): TournamentDisplayState {
  if (status === 'inprogress') return 'live';

  if (status === 'closed' || status === 'complete') {
    const end = new Date(endDate);
    const withinWindow = now.getTime() - end.getTime() <= RESULT_WINDOW_MS;
    return withinWindow ? 'result' : 'upcoming';
  }

  return 'upcoming';
}
