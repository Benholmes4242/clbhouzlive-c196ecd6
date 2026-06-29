/**
 * getTournamentDisplayState
 *
 * Single source of truth for tournament display state across all surfaces.
 *
 * live       — Sportradar reports inprogress
 * unresolved — Play is happening or not yet decided (playoff, suspended, weather, delayed)
 *              Treated like live by pickers/buckets, but hero shows an awaiting-playoff /
 *              suspended treatment rather than crowning a champion.
 * result     — Tournament closed/complete within the last 2 days, with a decided winner
 * upcoming   — Everything else (scheduled, created, or result window expired)
 */
export type TournamentDisplayState = 'live' | 'unresolved' | 'result' | 'upcoming';

const RESULT_WINDOW_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

// Statuses meaning "play is happening" — fully live
const LIVE_STATUSES = ['inprogress', 'in_progress'];

// Statuses meaning "play not finished / not yet decided"
const UNRESOLVED_STATUSES = [
  'playoff',
  'inplayoff',
  'in_playoff',
  'suspended',
  'delayed',
  'weather',
  'holdup',
];

export interface DisplayStateOpts {
  /** True when leaderboard shows a tie at position 1 with no confirmed winner. */
  topTie?: boolean;
  /** True when an event_winners row exists (authoritative champion). */
  winnerConfirmed?: boolean;
}

export function getTournamentDisplayState(
  status: string,
  endDate: string,
  now: Date = new Date(),
  opts?: DisplayStateOpts
): TournamentDisplayState {
  const s = (status || '').toLowerCase().trim();

  if (LIVE_STATUSES.includes(s)) return 'live';

  // Playoff / suspended / weather-delayed — play not finished.
  // Stay featured, never crown.
  if (UNRESOLVED_STATUSES.includes(s)) return 'unresolved';

  if (s === 'closed' || s === 'complete' || s === 'completed') {
    // Defensive: Sportradar can flip to closed mid-playoff before the actual
    // winner is recorded. Treat a tied top with no confirmed winner as unresolved.
    if (opts?.topTie && !opts?.winnerConfirmed) return 'unresolved';
    const within = now.getTime() - new Date(endDate).getTime() <= RESULT_WINDOW_MS;
    return within ? 'result' : 'upcoming';
  }

  // Cancelled is handled downstream as a results/cancelled variant.
  if (s === 'cancelled' || s === 'canceled') return 'result';

  return 'upcoming';
}

export { UNRESOLVED_STATUSES, LIVE_STATUSES };
