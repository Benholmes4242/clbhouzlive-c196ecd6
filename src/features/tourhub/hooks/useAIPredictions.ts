/**
 * useAIPredictions - Fetches Claude-powered tournament predictions
 * 
 * Priority-based tournament selection:
 * 1. In-progress tournament (status = 'inprogress')
 * 2. Next scheduled tournament (start_date >= now)
 * 
 * Also fetches "next upcoming" tournament when viewing a live one.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { TournamentPhase, NextTournamentPreview } from '../components/tournament-insights/types';

// =============================================
// TYPES
// =============================================

export interface AITopContender {
  rank: number;
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  country: string;
  worldRanking: number;
  winProbability: number;
  courseFitScore: number;
  reasons: string[];
  concern: string;
  promoted?: boolean;
}

export interface AIDarkHorse {
  playerId: string;
  playerName: string;
  photoUrl: string | null;
  pgaTourId: string | null;
  country: string;
  worldRanking: number;
  hook: string;
  keyStat: string;
}

export interface CourseAnalysis {
  winnerProfile: string;
  keyStats: string[];
  insight: string;
  difficulty: string;
}

export interface AIPredictionData {
  tournament: {
    id: string;
    name: string;
    venueName: string;
    venueCity: string;
    venueState: string;
    startDate: string;
    endDate: string;
    purse: number;
    par: number;
    yardage: number;
    status: string;
  };
  topContenders: AITopContender[];
  darkHorses: AIDarkHorse[];
  courseAnalysis: CourseAnalysis;
  confidence: number;
  generatedAt: string;
  isAIPowered: boolean;
  /** True when predictions are >24h old pre-tournament or flagged for regeneration */
  isStale: boolean;
}

export interface UseAIPredictionsResult {
  data: AIPredictionData | null | undefined;
  isLoading: boolean;
  error: Error | null;
  tournamentPhase: TournamentPhase;
  activeTournamentId: string | null;
  nextTournament: NextTournamentPreview | null;
  nextTournamentPredictions: AIPredictionData | null;
  /** Raw preview object — populated even before predictions exist */
  nextTournamentPreview: NextTournamentPreview | null;
  nextTournamentPredictionsLoading: boolean;
}

// =============================================
// (Photo resolution now handled in components)
// =============================================

// =============================================
// MAIN HOOK
// =============================================

export function useAIPredictions(): UseAIPredictionsResult {
  const mainQuery = useQuery({
    queryKey: ['ai-predictions', 'active-tournament'],
    queryFn: fetchActiveTournamentPredictions,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const result = mainQuery.data;
  const tournamentPhase = result?.tournamentPhase ?? 'pre-tournament';
  const isLive = tournamentPhase === 'in-progress';
  const activeTournamentId = result?.predictions?.tournament?.id ?? null;

  // Fetch next tournament preview when live
  const nextQuery = useQuery({
    queryKey: ['ai-predictions', 'next-tournament-preview'],
    queryFn: fetchNextTournamentPreview,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: true,
  });

  // Live polling: refetch main query every 3 minutes during live tournaments
  useQuery({
    queryKey: ['ai-predictions', 'active-tournament'],
    queryFn: fetchActiveTournamentPredictions,
    refetchInterval: isLive ? 3 * 60 * 1000 : false,
  });

  return {
    data: result?.predictions ?? undefined,
    isLoading: mainQuery.isLoading,
    error: mainQuery.error,
    tournamentPhase,
    activeTournamentId,
    nextTournament: nextQuery.data?.preview ?? null,
    nextTournamentPredictions: nextQuery.data?.predictions ?? null,
    nextTournamentPreview: nextQuery.data?.preview ?? null,
    nextTournamentPredictionsLoading: nextQuery.isLoading,
  };
}

// =============================================
// FETCH: Active tournament (priority-based)
// =============================================

interface ActiveTournamentResult {
  predictions: AIPredictionData | null;
  tournamentPhase: TournamentPhase;
}

async function fetchActiveTournamentPredictions(): Promise<ActiveTournamentResult> {
  const pgaSeasonId = await getPgaSeasonId();
  if (!pgaSeasonId) return { predictions: null, tournamentPhase: 'pre-tournament' };

  // Priority 1: In-progress tournament
  const { data: activeTournament } = await supabase
    .from('sr_tournaments')
    .select('*')
    .eq('season_id', pgaSeasonId)
    .eq('status', 'inprogress')
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (activeTournament) {
    const predictions = await fetchPredictionsForTournament(activeTournament);
    return {
      predictions,
      tournamentPhase: 'in-progress',
    };
  }

  // Check for recently completed tournament (within 24h)
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: completedTournament } = await supabase
    .from('sr_tournaments')
    .select('*')
    .eq('season_id', pgaSeasonId)
    .in('status', ['closed', 'complete'])
    .gte('end_date', threeDaysAgo)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (completedTournament) {
    const predictions = await fetchPredictionsForTournament(completedTournament);
    if (predictions) {
      return {
        predictions,
        tournamentPhase: 'completed',
      };
    }
  }

  // Priority 2: Next scheduled tournament
  const now = new Date().toISOString();
  const { data: nextTournament } = await supabase
    .from('sr_tournaments')
    .select('*')
    .eq('season_id', pgaSeasonId)
    .in('status', ['scheduled', 'created'])
    .gte('start_date', now)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextTournament) {
    const predictions = await fetchPredictionsForTournament(nextTournament);
    return { predictions, tournamentPhase: 'pre-tournament' };
  }

  return { predictions: null, tournamentPhase: 'pre-tournament' };
}

// =============================================
// FETCH: Next tournament preview (when live)
// =============================================

interface NextTournamentResult {
  preview: NextTournamentPreview | null;
  predictions: AIPredictionData | null;
}

async function fetchNextTournamentPreview(): Promise<NextTournamentResult> {
  const pgaSeasonId = await getPgaSeasonId();
  if (!pgaSeasonId) return { preview: null, predictions: null };

  const now = new Date().toISOString();
  const { data: nextTournament } = await supabase
    .from('sr_tournaments')
    .select('*')
    .eq('season_id', pgaSeasonId)
    .in('status', ['scheduled', 'created'])
    .gte('start_date', now)
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextTournament) return { preview: null, predictions: null };

  const preview: NextTournamentPreview = {
    id: nextTournament.id,
    name: nextTournament.name,
    courseName: nextTournament.venue_name || '',
    startDate: nextTournament.start_date,
    hasPredictions: false, // updated below
  };

  // Fetch (or generate) full predictions — same pattern as active tournament
  const predictions = await fetchPredictionsForTournament(nextTournament);
  preview.hasPredictions = !!predictions;

  return { preview, predictions };
}

// =============================================
// SHARED HELPERS
// =============================================

async function getPgaSeasonId(): Promise<string | null> {
  const { data: seasons } = await supabase
    .from('sr_seasons')
    .select('id')
    .ilike('tour_name', 'pga')
    .order('year', { ascending: false })
    .limit(1);

  return seasons?.[0]?.id ?? null;
}

async function fetchPredictionsForTournament(tournament: any): Promise<AIPredictionData | null> {
  const { data: aiPredictions } = await supabase
    .from('ai_predictions')
    .select('*')
    .eq('tournament_id', tournament.id)
    .maybeSingle();

  if (!aiPredictions) {
    // Try to generate predictions
    try {
      const { data, error } = await supabase.functions.invoke('generate-predictions', {
        body: { tournamentId: tournament.id },
      });
      if (!error && data?.predictions) {
        return formatPredictions(tournament, data.predictions, true);
      }
    } catch (err) {
      console.error('[useAIPredictions] Failed to generate predictions:', err);
    }
    return null;
  }

  const rawPredictions = {
    topContenders: (aiPredictions.predictions || []) as any[],
    darkHorses: (aiPredictions.dark_horses || []) as any[],
    courseAnalysis: aiPredictions.course_analysis || {},
    confidence: aiPredictions.confidence || 0.7,
  };

  // WD validation: check if any predicted players have withdrawn
  const validatedPredictions = await validatePicksAgainstField(
    tournament.id,
    rawPredictions
  );

  return formatPredictions(
    tournament,
    validatedPredictions,
    true,
    aiPredictions.generated_at,
    aiPredictions.research_context
  );
}

/**
 * Validates top picks against the live leaderboard / tee-time field.
 * If a top-5 pick has status 'wd' or is missing from the field entirely
 * (and the tournament has started), promote an alternate from dark_horses.
 */
async function validatePicksAgainstField(
  tournamentId: string,
  predictions: {
    topContenders: any[];
    darkHorses: any[];
    courseAnalysis: any;
    confidence: number;
  }
) {
  const contenders = [...(predictions.topContenders || [])];
  const alternates = [...(predictions.darkHorses || [])];

  if (contenders.length === 0) return predictions;

  // Collect all player IDs (sr_ids) from picks + alternates
  const allPlayerIds = [
    ...contenders.map((p: any) => p.playerId),
    ...alternates.map((p: any) => p.playerId),
  ].filter(Boolean);

  if (allPlayerIds.length === 0) return predictions;

  // Query leaderboard for these players' statuses
  const { data: lbRows } = await supabase
    .from('sr_leaderboards')
    .select('player_id, status, sr_players!inner(sr_id)')
    .eq('tournament_id', tournamentId);

  if (!lbRows || lbRows.length === 0) {
    // No leaderboard data yet (pre-tournament) — check tee times instead
    // sr_tee_time_players -> sr_tee_times (via tee_time_id) -> tournament_id
    const { data: teeTimeIds } = await supabase
      .from('sr_tee_times')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (!teeTimeIds || teeTimeIds.length === 0) return predictions;

    const { data: ttRows } = await supabase
      .from('sr_tee_time_players')
      .select('player_id, sr_players!inner(sr_id)')
      .in('tee_time_id', teeTimeIds.map(t => t.id));

    // If no tee time player data, return as-is
    if (!ttRows || ttRows.length === 0) return predictions;

    // Build set of players confirmed in the field via tee times
    const fieldSet = new Set(ttRows.map((r: any) => (r.sr_players as any)?.sr_id).filter(Boolean));

    // If field data exists but is very small, don't filter (might be partial data)
    if (fieldSet.size < 20) return predictions;

    // Check if any top-5 picks are NOT in the tee-time field
    const validContenders: any[] = [];
    const withdrawnPicks: any[] = [];
    for (const p of contenders) {
      if (fieldSet.has(p.playerId)) {
        validContenders.push(p);
      } else {
        withdrawnPicks.push({ ...p, withdrawnStatus: 'wd' });
      }
    }

    // Promote alternates to fill gaps
    let promoted = 0;
    for (const alt of alternates) {
      if (validContenders.length >= 5) break;
      if (fieldSet.has(alt.playerId)) {
        validContenders.push({
          ...alt,
          rank: validContenders.length + 1,
          promoted: true,
        });
        promoted++;
      }
    }

    if (promoted > 0) {
      console.log(`[useAIPredictions] Promoted ${promoted} alternate(s) to replace WD picks`);
    }

    return {
      ...predictions,
      topContenders: validContenders,
      withdrawnPicks,
    };
  }

  // Build status map keyed by sr_id
  const statusMap = new Map<string, string>();
  lbRows.forEach((row: any) => {
    const srId = (row.sr_players as any)?.sr_id;
    if (srId) statusMap.set(srId, row.status || 'active');
  });

  // Filter out withdrawn picks
  const validContenders: any[] = [];
  const withdrawnPicks: any[] = [];

  for (const p of contenders) {
    const status = statusMap.get(p.playerId);
    if (status === 'wd' || status === 'dsq') {
      withdrawnPicks.push({ ...p, withdrawnStatus: status });
    } else {
      validContenders.push(p);
    }
  }

  // Promote alternates
  let promoted = 0;
  for (const alt of alternates) {
    if (validContenders.length >= 5) break;
    const altStatus = statusMap.get(alt.playerId);
    if (altStatus !== 'wd' && altStatus !== 'dsq') {
      validContenders.push({
        ...alt,
        rank: validContenders.length + 1,
        promoted: true,
      });
      promoted++;
    }
  }

  if (promoted > 0) {
    console.log(`[useAIPredictions] Promoted ${promoted} alternate(s) to replace WD picks`);
  }

  return {
    ...predictions,
    topContenders: validContenders,
    withdrawnPicks,
  };
}

function formatPredictions(
  tournament: any,
  predictions: any,
  isAIPowered: boolean,
  generatedAt?: string,
  researchContext?: any
): AIPredictionData {
  // All 5 display picks come directly from Claude (no legacy padding needed)
  const rawContenders = (predictions.topContenders || predictions || []).map((p: any, index: number) => ({
    ...p,
    rank: p.rank || index + 1,
    photoUrl: p.photoUrl || null,
    reasons: ensureThreeReasons(p.reasons),
  }));

  const topContenders = rawContenders.slice(0, 5);

  return {
    tournament: {
      id: tournament.id,
      name: tournament.name,
      venueName: tournament.venue_name,
      venueCity: tournament.venue_city,
      venueState: tournament.venue_state || tournament.venue_country,
      startDate: tournament.start_date,
      endDate: tournament.end_date,
      purse: tournament.purse,
      par: tournament.venue_par,
      yardage: tournament.venue_yardage,
      status: tournament.status,
    },
    topContenders,
    darkHorses: [],
    courseAnalysis: predictions.courseAnalysis || {
      winnerProfile: '',
      keyStats: [],
      insight: '',
      difficulty: 'Moderate',
    },
    confidence: predictions.confidence || 0.7,
    generatedAt: generatedAt || new Date().toISOString(),
    isAIPowered,
    isStale: isPredictionStale(tournament, generatedAt, researchContext),
  };
}

/**
 * Returns true when predictions should be considered stale:
 * - Generated >24h ago AND tournament hasn't started yet
 * - Flagged as needs_full_regeneration by the validation edge function
 */
function isPredictionStale(
  tournament: any,
  generatedAt?: string,
  researchContext?: any
): boolean {
  if (researchContext?.needs_full_regeneration) return true;

  const status = tournament?.status;
  if (status === 'inprogress' || status === 'closed' || status === 'complete') {
    return false;
  }

  if (!generatedAt) return false;

  const generatedTime = new Date(generatedAt).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return (Date.now() - generatedTime) > twentyFourHours;
}

/**
 * Ensures exactly 3 reasons per pick, strips odds/betting language
 */
function ensureThreeReasons(reasons: string[]): string[] {
  const cleaned = (reasons || []).filter(r =>
    r &&
    !/[+-]\d{3,}/.test(r) &&
    !r.toLowerCase().includes('odds') &&
    !r.toLowerCase().includes('betting') &&
    !r.toLowerCase().includes('longshot') &&
    !r.toLowerCase().includes('payout')
  );
  const fallbacks = [
    'Strong recent form on tour',
    'Course profile suits their game',
    'Proven record at similar venues',
  ];
  while (cleaned.length < 3) {
    cleaned.push(fallbacks[cleaned.length]);
  }
  return cleaned.slice(0, 3);
}

// =============================================
// REGENERATION HOOK (for admin use)
// =============================================

export function useRegenerateAIPredictions() {
  const regenerate = async (tournamentId?: string) => {
    const { data, error } = await supabase.functions.invoke('generate-predictions', {
      body: { tournamentId, forceRegenerate: true },
    });

    if (error) {
      throw new Error(`Failed to regenerate: ${error.message}`);
    }

    return data;
  };

  return { regenerate };
}
