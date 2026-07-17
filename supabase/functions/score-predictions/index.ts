import { corsFor } from '../_shared/cors.ts';
/**
 * score-predictions — Auto-scores prediction accuracy when a tournament closes.
 * 
 * Called from tournament-round-complete when tournament status changes to 'closed'.
 * Compares stored predictions against actual leaderboard results.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tournamentId } = await req.json();
    if (!tournamentId) throw new Error('tournamentId required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    console.log(`[ScorePredictions] Scoring predictions for tournament ${tournamentId}`);

    // 1. Get the tournament details
    const { data: tournament, error: tErr } = await supabase
      .from('sr_tournaments')
      .select('id, name, venue_name, season:sr_seasons!inner(tour_name, year)')
      .eq('id', tournamentId)
      .single();

    if (tErr || !tournament) {
      console.error('[ScorePredictions] Tournament not found:', tErr?.message);
      return new Response(JSON.stringify({ error: 'Tournament not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Get the stored predictions
    const { data: prediction, error: pErr } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    if (pErr || !prediction) {
      console.log('[ScorePredictions] No predictions found for this tournament — skipping');
      return new Response(JSON.stringify({ message: 'No predictions to score' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Get the full final leaderboard
    const { data: leaderboard, error: lErr } = await supabase
      .from('sr_leaderboards')
      .select('player_id, position, score, status, strokes')
      .eq('tournament_id', tournamentId)
      .not('position', 'is', null)
      .order('position', { ascending: true });

    if (lErr || !leaderboard?.length) {
      console.error('[ScorePredictions] No leaderboard data:', lErr?.message);
      return new Response(JSON.stringify({ error: 'No leaderboard data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build position lookup
    const positionMap = new Map<string, { position: number; score: number; status: string }>();
    for (const entry of leaderboard) {
      positionMap.set(entry.player_id, {
        position: entry.position,
        score: entry.score ?? 0,
        status: entry.status || 'complete',
      });
    }

    const fieldSize = leaderboard.length;

    // 4. Score each pick
    const picks = [
      ...(prediction.predictions || []),
      ...(prediction.dark_horses || []),
    ];

    const pickResults = picks.map((pick: any, index: number) => {
      const result = positionMap.get(pick.playerId);
      const actualPosition = result?.position ?? null;
      const actualScore = result?.score ?? null;
      const status = result?.status || 'unknown';
      const missedCut = status === 'cut' || status === 'wd' || status === 'dq';

      return {
        playerId: pick.playerId,
        playerName: pick.playerName || pick.name || 'Unknown',
        predictedRank: pick.rank || index + 1,
        winProbability: pick.winProbability || 0,
        courseFitScore: pick.courseFitScore || 0,
        actualPosition,
        actualScore,
        status,
        missedCut,
        finished: actualPosition !== null,
        // Position percentile (0-100, lower position = higher percentile)
        positionPercentile: actualPosition
          ? Math.round(((fieldSize - actualPosition) / fieldSize) * 100)
          : 0,
      };
    });

    // Only score the top 5 display picks (not alternates)
    const displayPicks = pickResults.slice(0, 5);

    // 5. Calculate aggregate metrics
    const inTop5 = displayPicks.filter((p) => p.actualPosition && p.actualPosition <= 5).length;
    const inTop10 = displayPicks.filter((p) => p.actualPosition && p.actualPosition <= 10).length;
    const inTop20 = displayPicks.filter((p) => p.actualPosition && p.actualPosition <= 20).length;
    const madeCut = displayPicks.filter((p) => !p.missedCut && p.finished).length;
    const missedCut = displayPicks.filter((p) => p.missedCut).length;

    const finishedPicks = displayPicks.filter((p) => p.actualPosition !== null);
    const avgPosition = finishedPicks.length > 0
      ? finishedPicks.reduce((sum, p) => sum + (p.actualPosition || 0), 0) / finishedPicks.length
      : null;

    // Best pick = lowest actual position
    const bestPick = finishedPicks.reduce(
      (best, p) => (!best || (p.actualPosition && p.actualPosition < (best.actualPosition || 999)))
        ? p : best,
      null as typeof pickResults[0] | null,
    );

    // Grade
    let grade: string;
    if (inTop10 >= 4) grade = 'excellent';
    else if (inTop10 >= 3) grade = 'good';
    else if (inTop10 >= 2) grade = 'mixed';
    else grade = 'poor';

    // Average predicted fit score
    const avgFitPredicted = displayPicks.length > 0
      ? displayPicks.reduce((sum, p) => sum + (p.courseFitScore || 0), 0) / displayPicks.length
      : null;

    // Average actual fit (based on position percentile)
    const avgFitActual = finishedPicks.length > 0
      ? finishedPicks.reduce((sum, p) => sum + p.positionPercentile, 0) / finishedPicks.length
      : null;

    // 6. Upsert accuracy record
    const accuracyRecord = {
      tournament_id: tournamentId,
      prediction_id: prediction.id,
      tournament_name: tournament.name,
      tour_code: (tournament.season as any)?.tour_name || 'unknown',
      season_year: (tournament.season as any)?.year || new Date().getFullYear(),
      pick_results: pickResults,
      picks_in_top_5: inTop5,
      picks_in_top_10: inTop10,
      picks_in_top_20: inTop20,
      picks_made_cut: madeCut,
      picks_missed_cut: missedCut,
      best_pick_position: bestPick?.actualPosition || null,
      best_pick_player_id: bestPick?.playerId || null,
      best_pick_player_name: bestPick?.playerName || null,
      average_pick_position: avgPosition,
      accuracy_grade: grade,
      average_fit_score_predicted: avgFitPredicted,
      average_fit_score_actual: avgFitActual,
      model_version: prediction.model_version || 'unknown',
      prompt_version: prediction.prompt_version || 'unknown',
      consensus_method: 'single_model',
      scored_at: new Date().toISOString(),
    };

    const { error: upsertErr } = await supabase
      .from('ai_prediction_accuracy')
      .upsert(accuracyRecord, { onConflict: 'tournament_id' });

    if (upsertErr) {
      console.error('[ScorePredictions] Upsert error:', upsertErr.message);
      throw upsertErr;
    }

    console.log(`[ScorePredictions] Scored: ${tournament.name} — Grade: ${grade}, ` +
      `Top 5: ${inTop5}/5, Top 10: ${inTop10}/5, Top 20: ${inTop20}/5, ` +
      `Best: ${bestPick?.playerName} (${bestPick?.actualPosition}), ` +
      `Avg Position: ${avgPosition?.toFixed(1)}`);

    return new Response(JSON.stringify({
      success: true,
      grade,
      picksInTop5: inTop5,
      picksInTop10: inTop10,
      picksInTop20: inTop20,
      bestPick: bestPick?.playerName,
      bestPickPosition: bestPick?.actualPosition,
      averagePosition: avgPosition,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ScorePredictions] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
