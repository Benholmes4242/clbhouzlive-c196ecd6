// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for "what round is it?" across all edge functions.
//
// Why this file exists: over one Tour Hub session we shipped FIVE corrections
// to round detection because the logic lived in 4 independent places that
// were reconciled by ??, letting low-confidence fallbacks silently override
// correct leaderboard-derived values. This consolidates all of them.
//
// Correctness properties (each maps to a bug we hit):
// 1. Participation threshold, not "100% complete"
//    → WD/DQ gaps don't freeze the round.
// 2. Highest round with real participation, not `completedRound + 1`
//    → mid-round stragglers don't overshoot.
// 3. Leaderboard-derived round wins; date-math fallback ONLY runs when there
//    is no leaderboard data at all
//    → a low-confidence fallback can never overwrite a confident value
//      (this is the Italian Open bug).
// 4. No +1 on Sportradar's `round` field — we don't read it at all for live
//    events because the leaderboard rows are more reliable.
// ─────────────────────────────────────────────────────────────────────────────

export type ActiveRoundSource = 'leaderboard' | 'scheduled' | 'fallback';

export interface ActiveRoundResult {
  /** What to display. */
  round: number;
  /** Date-math, venue-local: which round is scheduled for today. */
  scheduledRound: number;
  /** Leaderboard-derived: which round has actually been played into. */
  playingRound: number;
  /** Leaderboard-derived: which round has an agreed mid-round group right now. */
  liveRound: number | null;
  /** Is an agreed group mid-round right now. */
  inProgress: boolean;
  source: ActiveRoundSource;
  confident: boolean;
}

interface TournamentMeta {
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
}

// Active round = highest round number with meaningful field participation.
// A round counts as "underway" once at least MIN_PLAYERS (or MIN_FRACTION of
// the field, whichever is larger) have a score recorded for it. This ignores
// WD/DQ/straggler gaps in earlier rounds and avoids over-advancing on a
// single early poster.
const MIN_FRACTION = 0.10;
const MIN_PLAYERS = 5;
const MIN_LIVE_ROUND_PLAYERS = 3;
const MAX_ROUNDS = 4;

async function loadMeta(
  supabase: any,
  tournamentId: string,
  tournament?: TournamentMeta | null,
): Promise<TournamentMeta | null> {
  if (tournament) return tournament;
  const { data } = await supabase
    .from('sr_tournaments')
    .select('start_date, end_date, timezone')
    .eq('id', tournamentId)
    .maybeSingle();
  return data ?? null;
}

/** Tournament length from dates, inclusive; capped by the four persisted score columns. */
function computeRoundCap(meta: TournamentMeta | null): number {
  if (!meta?.start_date || !meta?.end_date) return MAX_ROUNDS;
  try {
    const start = new Date(meta.start_date + 'T00:00:00Z');
    const end = new Date(meta.end_date + 'T00:00:00Z');
    const span = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (!Number.isFinite(span) || span < 1) return MAX_ROUNDS;
    return Math.min(MAX_ROUNDS, Math.max(1, span));
  } catch {
    return MAX_ROUNDS;
  }
}

/** Venue-local date math: which round is scheduled for today. Capped at the event date span. */
function computeScheduledRound(meta: TournamentMeta | null): number {
  let round = 1;
  if (meta?.start_date && meta?.timezone) {
    try {
      const cap = computeRoundCap(meta);
      const todayAtVenue = new Date().toLocaleDateString('en-CA', { timeZone: meta.timezone });
      const start = new Date(meta.start_date + 'T00:00:00Z');
      const today = new Date(todayAtVenue + 'T00:00:00Z');
      const daysSinceStart = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
      if (daysSinceStart >= 0) {
        round = Math.min(daysSinceStart + 1, cap);
      }
    } catch {
      // Keep round = 1.
    }
  }
  return round;
}

/**
 * Which round has a real group on the course right now.
 *
 * Unlike the old global inProgress boolean, this is round-specific: a player
 * mid-round on N has prior rounds filled, round N still null, and thru 1–17.
 * Require three players to agree so one stale thru row cannot advance the UI.
 */
function computeLiveRound(rows: any[], roundCap: number): number | null {
  const counts = new Map<number, number>();

  for (const row of rows) {
    const thru = Number(row.thru ?? 0);
    if (!Number.isFinite(thru) || thru < 1 || thru > 17) continue;

    const completedCount = Array.from({ length: roundCap }, (_, i) => i + 1)
      .filter((round) => row[`round_${round}`] != null)
      .length;
    const candidate = completedCount + 1;
    if (candidate < 1 || candidate > roundCap) continue;
    if (row[`round_${candidate}`] != null) continue;

    let priorRoundsFilled = true;
    for (let round = 1; round < candidate; round++) {
      if (row[`round_${round}`] == null) {
        priorRoundsFilled = false;
        break;
      }
    }
    if (!priorRoundsFilled) continue;

    counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
  }

  let liveRound: number | null = null;
  counts.forEach((count, round) => {
    if (count >= MIN_LIVE_ROUND_PLAYERS && (liveRound == null || round > liveRound)) {
      liveRound = round;
    }
  });
  return liveRound;
}

/**
 * Resolve the active round for a tournament.
 *
 * Two signals answer two different questions:
 *   - leaderboard participation -> which round is underway (playingRound)
 *   - venue-local date math     -> which round is scheduled today (scheduledRound)
 *
 * Resolution: liveRound answers which round is actually being played right now.
 * If today's scheduled round is underway, show it live. If an earlier delayed
 * round is still being played, keep that delayed round live. Otherwise, when
 * the calendar has rolled ahead of the scored leaderboard, show the scheduled
 * round as pre-play.
 *
 * @param tournament Optional pre-fetched tournament row (saves a roundtrip).
 */
export async function getActiveRound(
  supabase: any,
  tournamentId: string,
  tournament?: TournamentMeta | null,
): Promise<ActiveRoundResult> {
  const { data: rows } = await supabase
    .from('sr_leaderboards')
    .select('round_1, round_2, round_3, round_4, thru')
    .eq('tournament_id', tournamentId)
    .not('strokes', 'is', null);

  const meta = await loadMeta(supabase, tournamentId, tournament);
  const scheduledRound = computeScheduledRound(meta);
  const roundCap = computeRoundCap(meta);

  if (!rows || rows.length === 0) {
    // No play at all yet: date math is all we have.
    return {
      round: scheduledRound,
      scheduledRound,
      playingRound: 1,
      liveRound: null,
      inProgress: false,
      source: 'fallback',
      confident: false,
    };
  }

  const fieldSize = rows.length;
  const threshold = Math.max(MIN_PLAYERS, Math.ceil(fieldSize * MIN_FRACTION));
  const recorded = (r: number) =>
    rows.filter((e: any) => e[`round_${r}`] != null).length;

  let playingRound = 1;
  for (let r = 1; r <= roundCap; r++) {
    if (recorded(r) >= threshold) playingRound = r;
    else break;
  }

  const liveRound = computeLiveRound(rows, roundCap);
  const inProgress = liveRound != null;

  if (liveRound != null && liveRound >= scheduledRound) {
    return {
      round: liveRound,
      scheduledRound,
      playingRound,
      liveRound,
      inProgress,
      source: 'leaderboard',
      confident: true,
    };
  }

  if (liveRound != null && liveRound > playingRound) {
    return {
      round: liveRound,
      scheduledRound,
      playingRound,
      liveRound,
      inProgress,
      source: 'leaderboard',
      confident: true,
    };
  }

  if (scheduledRound > playingRound) {
    return {
      round: scheduledRound,
      scheduledRound,
      playingRound,
      liveRound,
      inProgress,
      source: 'scheduled',
      confident: true,
    };
  }

  return {
    round: playingRound,
    scheduledRound,
    playingRound,
    liveRound,
    inProgress,
    source: 'leaderboard',
    confident: true,
  };
}

/**
 * Has this round actually started for a given competitor?
 *
 * Single shared definition used by:
 *   - sportradar-sync mergeLiveRound guard (don't synthesize empty rounds)
 *   - CinematicFrame liveRoundFor (hero TODAY column)
 *   - FullLeaderboard getLiveRoundData (leaderboard TODAY column)
 *
 * The src/ readers import their own copy (Vite can't pull from supabase/),
 * but both definitions must stay in lockstep — see
 * src/features/tourhub/_shared/roundState.ts.
 */
export function roundStarted(r: any): boolean {
  if (!r) return false;
  const thru = r.thru ?? 0;
  const strokes = r.strokes ?? 0;
  return !(thru === 0 && strokes === 0);
}
