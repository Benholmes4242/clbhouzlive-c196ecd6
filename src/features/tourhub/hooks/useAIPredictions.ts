/**
 * useAIPredictions - Fetches Claude-powered tournament predictions
 * 
 * Retrieves pre-generated AI predictions from the ai_predictions table.
 * Falls back to algorithmic predictions if AI predictions aren't available.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getPgaTourHeadshotUrl } from '@/utils/headshots';

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
  };
  topContenders: AITopContender[];
  darkHorses: AIDarkHorse[];
  courseAnalysis: CourseAnalysis;
  confidence: number;
  generatedAt: string;
  isAIPowered: boolean;
}

// =============================================
// PHOTO URL RESOLVER
// =============================================

function resolvePlayerPhotoUrl(
  photoUrl: string | null | undefined,
  pgaTourId: string | null | undefined
): string | null {
  // Priority 1: PGA Tour CDN headshot
  if (pgaTourId) {
    return getPgaTourHeadshotUrl(pgaTourId);
  }
  // Priority 2: Stored photo URL
  return photoUrl || null;
}

// =============================================
// MAIN HOOK
// =============================================

export function useAIPredictions() {
  return useQuery({
    queryKey: ['ai-predictions', 'next-tournament'],
    queryFn: fetchAIPredictions,
    staleTime: 15 * 60 * 1000,  // 15 minutes
    gcTime: 60 * 60 * 1000,     // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

async function fetchAIPredictions(): Promise<AIPredictionData | null> {
  // Step 1: Get the current PGA season
  const { data: seasons } = await supabase
    .from('sr_seasons')
    .select('id')
    .ilike('tour_name', 'pga')
    .order('year', { ascending: false })
    .limit(1);

  const pgaSeasonId = seasons?.[0]?.id;
  if (!pgaSeasonId) {
    console.error('[useAIPredictions] No PGA season found');
    return null;
  }

  // Step 2: Get next scheduled PGA tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('sr_tournaments')
    .select('*')
    .eq('status', 'scheduled')
    .eq('season_id', pgaSeasonId)
    .order('start_date', { ascending: true })
    .limit(1)
    .single();

  if (tournamentError || !tournament) {
    console.error('[useAIPredictions] No upcoming tournament found:', tournamentError);
    return null;
  }

  // Step 3: Fetch AI predictions for this tournament
  const { data: aiPredictions, error: predictionError } = await supabase
    .from('ai_predictions')
    .select('*')
    .eq('tournament_id', tournament.id)
    .maybeSingle();

  // If no AI predictions, trigger generation (optional - can be done manually)
  if (!aiPredictions) {
    console.log('[useAIPredictions] No AI predictions found for tournament');
    
    // Optionally trigger generation
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

  // Step 4: Format and return predictions
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
  // Enhance contenders with resolved photo URLs
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
