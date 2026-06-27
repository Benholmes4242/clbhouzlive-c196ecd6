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

export type ActiveRoundSource = 'leaderboard' | 'fallback';

export interface ActiveRoundResult {
  round: number;
  source: ActiveRoundSource;
  confident: boolean;
}

interface TournamentMeta {
  start_date?: string | null;
  timezone?: string | null;
  total_rounds?: number | null;
}

// Active round = highest round number with meaningful field participation.
// A round counts as "underway" once at least MIN_PLAYERS (or MIN_FRACTION of
// the field, whichever is larger) have a score recorded for it. This ignores
// WD/DQ/straggler gaps in earlier rounds and avoids over-advancing on a
// single early poster.
const MIN_FRACTION = 0.10;
const MIN_PLAYERS = 5;

/**
 * Resolve the active round for a tournament.
 *
 * Reads the full field (no LIMIT) from sr_leaderboards. Falls back to
 * venue-local date math ONLY if the leaderboard table has no rows yet —
 * the fallback can never override a confident leaderboard-derived round.
 *
 * @param tournament Optional pre-fetched tournament row (saves a roundtrip).
 *                   Used only for the fallback path.
 */
export async function getActiveRound(
  supabase: any,
  tournamentId: string,
  tournament?: TournamentMeta | null,
): Promise<ActiveRoundResult> {
  // ── PRIMARY: leaderboard participation threshold ─────────────────────
  const { data: rows } = await supabase
    .from('sr_leaderboards')
    .select('round_1, round_2, round_3, round_4')
    .eq('tournament_id', tournamentId)
    .not('strokes', 'is', null);

  if (rows && rows.length > 0) {
    const fieldSize = rows.length;
    const threshold = Math.max(MIN_PLAYERS, Math.ceil(fieldSize * MIN_FRACTION));
    const recorded = (r: number) =>
      rows.filter((e: any) => e[`round_${r}`] != null).length;

    let active = 1;
    for (let r = 1; r <= 4; r++) {
      if (recorded(r) >= threshold) active = r;
      else break;
    }
    return { round: active, source: 'leaderboard', confident: true };
  }

  // ── FALLBACK: pre-play only. Never overrides leaderboard data. ───────
  let meta: TournamentMeta | null | undefined = tournament;
  if (!meta) {
    const { data } = await supabase
      .from('sr_tournaments')
      .select('start_date, timezone, total_rounds')
      .eq('id', tournamentId)
      .maybeSingle();
    meta = data ?? null;
  }

  let round = 1;
  if (meta?.start_date && meta?.timezone) {
    try {
      const cap = meta.total_rounds ?? 4;
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
  return { round, source: 'fallback', confident: false };
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
