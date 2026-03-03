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
    staleTime: 5 * 1000,          // 5s — Realtime handles freshness
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: false,        // No polling — Realtime pushes updates
    retry: 2,
    enabled: !!tournamentId && !!predictions,
  });
}

async function fetchTrackerData(
  tournamentId: string,
  predictions: AIPredictionData
): Promise<PredictionTrackerData> {
  // Fetch leaderboard data — join sr_players to get the Sportradar sr_id
  // This is critical: ai_predictions stores Sportradar sr_id, but sr_leaderboards.player_id
  // is the internal Supabase UUID (sr_players.id). We must key the map by sr_id.
  const { data: leaderboard } = await supabase
    .from('sr_leaderboards')
    .select('player_id, position, position_tied, score, strokes, thru, status, round_1, round_2, round_3, round_4, sr_players!inner(sr_id, full_name, country)')
    .eq('tournament_id', tournamentId);

  // Key by Sportradar sr_id so predictions can be matched correctly
  const leaderboardMap = new Map<string, any>();
  const leaderboardByName = new Map<string, any>();
  (leaderboard || []).forEach(row => {
    const srId = (row.sr_players as any)?.sr_id;
    const fullName = (row.sr_players as any)?.full_name;
    if (srId) leaderboardMap.set(srId, row);
    if (fullName) leaderboardByName.set(fullName.toLowerCase(), row);
  });

  // Calculate field completion percentage to detect pre-tournament withdrawals.
  // If > 50% of the field has posted scores and a predicted player has NO leaderboard
  // entry at all, they're likely a pre-tournament withdrawal (not just a late tee time).
  const totalInField = leaderboard?.length ?? 0;
  const playersWithScores = (leaderboard ?? []).filter(
    lb => lb.position !== null && lb.strokes > 0
  ).length;
  const fieldCompletionPct = totalInField > 0 ? playersWithScores / totalInField : 0;

  // Match top contenders (all 5 picks)
  const trackedPredictions: TrackedPrediction[] = predictions.topContenders.slice(0, 5).map((p, i) => {
    const lb = leaderboardMap.get(p.playerId)
      ?? leaderboardByName.get(p.playerName?.toLowerCase() ?? '');
    return buildTrackedPrediction(p, i + 1, lb, false, fieldCompletionPct);
  });

  // Backwards compat: if old data had dark horses but < 5 contenders, merge them in
  if (trackedPredictions.length < 5 && predictions.darkHorses?.length > 0) {
    const remaining = 5 - trackedPredictions.length;
    predictions.darkHorses.slice(0, remaining).forEach((dh, i) => {
      const lb = leaderboardMap.get(dh.playerId)
        ?? leaderboardByName.get(dh.playerName?.toLowerCase() ?? '');
      trackedPredictions.push(buildTrackedPrediction(
        { ...dh, reasons: [dh.hook], winProbability: 0 },
        trackedPredictions.length + 1,
        lb,
        false,
        fieldCompletionPct
      ));
    });
  }

  // Calculate accuracy metrics
  const accuracy = calculateAccuracy(trackedPredictions);

  return {
    predictions: trackedPredictions,
    darkHorses: [],
    allPicks: trackedPredictions,
    accuracy,
    lastUpdated: new Date().toISOString(),
  };
}

function buildTrackedPrediction(
  player: any,
  predictedRank: number,
  lb: any | undefined,
  isDarkHorse: boolean,
  fieldCompletionPct: number = 0
): TrackedPrediction {
  const actualPosition = lb?.position ?? null;
  const status = lb?.status ?? null;

  let performanceStatus: TrackedPrediction['performanceStatus'] = 'not-started';
  let positionDelta: number | null = null;

  if (status === 'cut') {
    performanceStatus = 'cut';
  } else if (status === 'wd') {
    performanceStatus = 'withdrawn';
  } else if (lb === undefined) {
    // Player has NO leaderboard entry at all.
    // If > 50% of the field has already posted scores, this player almost certainly
    // withdrew before the tournament started (not just a late tee time).
    performanceStatus = fieldCompletionPct > 0.5 ? 'withdrawn' : 'not-started';
  } else if (actualPosition !== null) {
    // OFF LEAD: how far from the leader (position 1)?
    positionDelta = actualPosition - 1;
    if (actualPosition === 1) {
      performanceStatus = 'outperforming'; // Leading
    } else if (actualPosition <= 5) {
      performanceStatus = 'matching'; // Close to lead
    } else {
      performanceStatus = 'underperforming'; // Behind
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
    isDarkHorse: false,
    actualPosition,
    actualPositionTied: lb?.position_tied ?? false,
    score: lb?.score ?? null,
    thru: lb?.thru ?? null,
    status,
    currentRound,
    positionDelta,
    performanceStatus,
    country: (lb?.sr_players as any)?.country ?? null,
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
