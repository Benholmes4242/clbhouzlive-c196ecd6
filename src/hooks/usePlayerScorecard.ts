/**
 * usePlayerScorecard — fetches hole-by-hole scorecard data for a player in a tournament.
 * 
 * Queries sr_scorecards joined with sr_course_holes for par/yardage context.
 * Returns data grouped by round with per-hole scores.
 * 
 * Used by the PlayerScorecardCard when a user taps a player on the live leaderboard.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface HoleScore {
  holeNumber: number;
  strokes: number;
  par: number;
  scoreToPar: number;
  yardage?: number;
}

export interface RoundScorecard {
  roundNumber: number;
  holes: HoleScore[];
  totalStrokes: number;
  totalToPar: number;
  holesCompleted: number;
  // Round-level aggregates (from hole_number=1 row)
  birdies: number;
  bogeys: number;
  eagles: number;
  pars: number;
  doubleBogeys: number;
  holesInOne: number;
}

export interface PlayerScorecardData {
  playerId: string;
  tournamentId: string;
  rounds: RoundScorecard[];
  currentRound: number;
  isLive: boolean;
}

async function fetchPlayerScorecard(
  tournamentId: string,
  playerId: string,
): Promise<PlayerScorecardData | null> {
  // Fetch all scorecard rows for this player in this tournament
  const { data: scorecardRows, error: scError } = await supabase
    .from('sr_scorecards')
    .select('*')
    .eq('tournament_id', tournamentId)
    .eq('player_id', playerId)
    .order('round_number', { ascending: true })
    .order('hole_number', { ascending: true });

  if (scError || !scorecardRows?.length) return null;

  // Fetch course hole data for par/yardage
  // Get course_id from the tournament
  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('course_id')
    .eq('id', tournamentId)
    .single();

  let courseHoles: Record<number, { par: number; yardage: number }> = {};

  if (tournament?.course_id) {
    const { data: holes } = await supabase
      .from('sr_course_holes')
      .select('hole_number, par, yardage')
      .eq('course_id', tournament.course_id)
      .order('hole_number', { ascending: true });

    if (holes) {
      courseHoles = Object.fromEntries(
        holes.map((h) => [h.hole_number, { par: h.par, yardage: h.yardage }])
      );
    }
  }

  // Group by round
  const roundMap = new Map<number, typeof scorecardRows>();
  for (const row of scorecardRows) {
    const existing = roundMap.get(row.round_number) || [];
    existing.push(row);
    roundMap.set(row.round_number, existing);
  }

  const rounds: RoundScorecard[] = [];
  let currentRound = 1;

  for (const [roundNumber, rows] of roundMap) {
    // Separate hole-level rows from round-level aggregate (hole_number=1 has aggregates)
    const holeRows = rows.filter((r) => r.hole_number >= 1);
    const aggregateRow = rows.find((r) => r.hole_number === 1);

    const holes: HoleScore[] = holeRows
      .filter((r) => r.strokes > 0) // Only completed holes
      .map((r) => ({
        holeNumber: r.hole_number,
        strokes: r.strokes,
        par: r.par || courseHoles[r.hole_number]?.par || 4,
        scoreToPar: r.score_to_par ?? (r.strokes - (r.par || courseHoles[r.hole_number]?.par || 4)),
        yardage: courseHoles[r.hole_number]?.yardage,
      }));

    const totalStrokes = holes.reduce((sum, h) => sum + h.strokes, 0);
    const totalToPar = holes.reduce((sum, h) => sum + h.scoreToPar, 0);

    rounds.push({
      roundNumber,
      holes,
      totalStrokes,
      totalToPar,
      holesCompleted: holes.length,
      birdies: aggregateRow?.birdies ?? holes.filter((h) => h.scoreToPar === -1).length,
      bogeys: aggregateRow?.bogeys ?? holes.filter((h) => h.scoreToPar === 1).length,
      eagles: aggregateRow?.eagles ?? holes.filter((h) => h.scoreToPar <= -2).length,
      pars: aggregateRow?.pars ?? holes.filter((h) => h.scoreToPar === 0).length,
      doubleBogeys: aggregateRow?.double_bogeys ?? holes.filter((h) => h.scoreToPar >= 2).length,
      holesInOne: aggregateRow?.holes_in_one ?? 0,
    });

    currentRound = roundNumber;
  }

  return {
    playerId,
    tournamentId,
    rounds,
    currentRound,
    isLive: rounds.some((r) => r.holesCompleted > 0 && r.holesCompleted < 18),
  };
}

export function usePlayerScorecard(
  tournamentId: string | undefined,
  playerId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ['player-scorecard', tournamentId, playerId],
    queryFn: () => fetchPlayerScorecard(tournamentId!, playerId!),
    enabled: enabled && !!tournamentId && !!playerId,
    staleTime: 60_000, // 1 min — matches live sync interval
    refetchInterval: 120_000, // Refetch every 2 min during live viewing
  });
}
