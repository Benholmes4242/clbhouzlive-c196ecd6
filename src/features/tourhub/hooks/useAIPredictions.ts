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
import { getPgaTourHeadshotUrl } from '../utils/resolvePhotoUrl';
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
// PHOTO URL RESOLVER
// =============================================

function resolvePlayerPhotoUrl(
  photoUrl: string | null | undefined,
  pgaTourId: string | null | undefined
): string | null {
  if (pgaTourId) {
    return getPgaTourHeadshotUrl(pgaTourId);
  }
  return photoUrl || null;
}

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

  return formatPredictions(
    tournament,
    {
      topContenders: aiPredictions.predictions || [],
      darkHorses: aiPredictions.dark_horses || [],
      courseAnalysis: aiPredictions.course_analysis || {},
      confidence: aiPredictions.confidence || 0.7,
    },
    true,
    aiPredictions.generated_at
  );
}

function formatPredictions(
  tournament: any,
  predictions: any,
  isAIPowered: boolean,
  generatedAt?: string
): AIPredictionData {
  const topContenders = (predictions.topContenders || predictions).map((p: any, index: number) => ({
    ...p,
    rank: p.rank || index + 1,
    photoUrl: resolvePlayerPhotoUrl(p.photoUrl, p.pgaTourId),
  }));

  const darkHorses = (predictions.darkHorses || []).map((dh: any) => ({
    ...dh,
    photoUrl: resolvePlayerPhotoUrl(dh.photoUrl, dh.pgaTourId),
  }));

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
    darkHorses,
    courseAnalysis: predictions.courseAnalysis || {
      winnerProfile: '',
      keyStats: [],
      insight: '',
      difficulty: 'Moderate',
    },
    confidence: predictions.confidence || 0.7,
    generatedAt: generatedAt || new Date().toISOString(),
    isAIPowered,
  };
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
