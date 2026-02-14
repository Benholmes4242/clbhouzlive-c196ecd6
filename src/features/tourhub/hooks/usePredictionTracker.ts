/**
 * usePredictionTracker - Joins AI predictions with live leaderboard data
 * 
 * Matches predicted players against their actual tournament positions
 * to show live tracking during in-progress tournaments.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  TrackedPrediction,
  AccuracyMetrics,
  PredictionTrackerData,
} from '../components/tournament-insights/types';
import type { AIPredictionData } from './useAIPredictions';
import { getCurrentRound } from '../utils/formatThruDisplay';

export function usePredictionTracker(
  tournamentId: string | null,
  predictions: AIPredictionData | null | undefined
) {
  return useQuery({
    queryKey: ['prediction-tracker', tournamentId],
    queryFn: () => fetchTrackerData(tournamentId!, predictions!),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 3 * 60 * 1000,
    retry: 2,
    enabled: !!tournamentId && !!predictions,
  });
}

async function fetchTrackerData(
  tournamentId: string,
  predictions: AIPredictionData
): Promise<PredictionTrackerData> {
  // Fetch leaderboard data
  const { data: leaderboard } = await supabase
    .from('sr_leaderboards')
    .select('player_id, position, position_tied, score, strokes, thru, status, round_1, round_2, round_3, round_4')
    .eq('tournament_id', tournamentId);

  const leaderboardMap = new Map<string, any>();
  (leaderboard || []).forEach(row => {
    leaderboardMap.set(row.player_id, row);
  });

  // Match top contenders
  const trackedPredictions: TrackedPrediction[] = predictions.topContenders.map((p, i) => {
    const lb = leaderboardMap.get(p.playerId);
    return buildTrackedPrediction(p, i + 1, lb, false);
  });

  // Match dark horses
  const trackedDarkHorses: TrackedPrediction[] = predictions.darkHorses.map((dh, i) => {
    const lb = leaderboardMap.get(dh.playerId);
    return buildTrackedPrediction(
      { ...dh, reasons: [dh.hook], winProbability: 0 },
      predictions.topContenders.length + i + 1,
      lb,
      true
    );
  });

  // Calculate accuracy metrics (based on top contenders only)
  const accuracy = calculateAccuracy(trackedPredictions);

  return {
    predictions: trackedPredictions,
    darkHorses: trackedDarkHorses,
    allPicks: [...trackedPredictions, ...trackedDarkHorses],
    accuracy,
    lastUpdated: new Date().toISOString(),
  };
}

function buildTrackedPrediction(
  player: any,
  predictedRank: number,
  lb: any | undefined,
  isDarkHorse: boolean
): TrackedPrediction {
  const actualPosition = lb?.position ?? null;
  const status = lb?.status ?? null;

  let performanceStatus: TrackedPrediction['performanceStatus'] = 'not-started';
  let positionDelta: number | null = null;

  if (status === 'cut') {
    performanceStatus = 'cut';
  } else if (status === 'wd') {
    performanceStatus = 'withdrawn';
  } else if (actualPosition !== null) {
    positionDelta = predictedRank - actualPosition;
    if (actualPosition < predictedRank) {
      performanceStatus = 'outperforming';
    } else if (actualPosition === predictedRank) {
      performanceStatus = 'matching';
    } else {
      performanceStatus = 'underperforming';
    }
  }

  // Determine current round from which round fields are populated
  let currentRound: number | null = null;
  if (lb) {
    const roundInfo = getCurrentRound(lb.round_1, lb.round_2, lb.round_3, lb.round_4);
    currentRound = roundInfo.number > 0 ? roundInfo.number : null;
  }

  return {
    playerName: player.playerName,
    playerId: player.playerId,
    pgaTourId: player.pgaTourId || '',
    predictedRank,
    winProbability: player.winProbability || 0,
    reasons: player.reasons || [],
    isDarkHorse,
    actualPosition,
    actualPositionTied: lb?.position_tied ?? false,
    score: lb?.score ?? null,
    thru: lb?.thru ?? null,
    status,
    currentRound,
    positionDelta,
    performanceStatus,
  };
}

function calculateAccuracy(predictions: TrackedPrediction[]): AccuracyMetrics {
  const activePredictions = predictions.filter(
    p => p.performanceStatus !== 'not-started'
  );

  const inTop5 = activePredictions.filter(
    p => p.actualPosition !== null && p.actualPosition <= 5 && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn'
  ).length;

  const inTop10 = activePredictions.filter(
    p => p.actualPosition !== null && p.actualPosition <= 10 && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn'
  ).length;

  const inTop20 = activePredictions.filter(
    p => p.actualPosition !== null && p.actualPosition <= 20 && p.performanceStatus !== 'cut' && p.performanceStatus !== 'withdrawn'
  ).length;

  const total = predictions.length;
  const accuracyLabel = `${inTop10}/${total} picks in the Top 10`;

  let overallGrade: AccuracyMetrics['overallGrade'];
  if (inTop10 >= 4) overallGrade = 'excellent';
  else if (inTop10 >= 3) overallGrade = 'good';
  else if (inTop10 >= 2) overallGrade = 'mixed';
  else overallGrade = 'poor';

  return {
    totalPredictions: total,
    inTop5,
    inTop10,
    inTop20,
    accuracyLabel,
    overallGrade,
  };
}
