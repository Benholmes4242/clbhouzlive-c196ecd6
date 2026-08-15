import { corsFor } from '../_shared/cors.ts';
/**
 * score-predictions — Auto-scores prediction accuracy when a tournament closes.
 *
 * Called from tournament-round-complete when tournament status changes to 'closed',
 * and daily from cron with no body (backlog sweep over closed tournaments).
 * Compares stored predictions against actual leaderboard results.
 *
 * GUARANTEES
 *  - CLOSED ONLY: a tournament whose status is not 'closed' is never scored, so a
 *    grade is never written against a leaderboard that is still moving.
 *  - HONEST PREDICTION ONLY: ai_predictions is append-only, so a tournament can
 *    hold several rows. We score the LATEST row that was generated BEFORE the
 *    tournament started. A prediction generated after the start (a post-hoc
 *    regeneration) is not a prediction and is never scored.
 *  - IDEMPOTENT: the accuracy upsert conflicts on tournament_id.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* cron sends no body */ }
    const tournamentId: string | undefined = body?.tournamentId;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── Backlog sweep: no tournamentId → score every closed tournament that has
    //    a prediction. Idempotent, so already-scored tournaments simply rewrite
    //    the same result.
    if (!tournamentId) {
      const { data: rows, error: sweepErr } = await supabase
        .from('ai_predictions')
        .select('tournament_id, sr_tournaments!inner(id, status)')
        .eq('sr_tournaments.status', 'closed');

      if (sweepErr) throw sweepErr;

      const ids = [...new Set((rows ?? []).map((r: any) => r.tournament_id))];
      console.log(`[ScorePredictions] Backlog sweep over ${ids.length} closed tournaments`);

      const results: any[] = [];
      for (const id of ids) {
        const r = await scoreOne(supabase, id);
        results.push({ tournamentId: id, ...r });
      }
      return new Response(JSON.stringify({ swept: ids.length, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const single = await scoreOne(supabase, tournamentId);
    return new Response(JSON.stringify(single), {
      status: single.error ? 400 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[ScorePredictions] Error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function scoreOne(supabase: any, tournamentId: string): Promise<any> {
  try {
    console.log(`[ScorePredictions] Scoring predictions for tournament ${tournamentId}`);

    // 1. Get the tournament details
    const { data: tournament, error: tErr } = await supabase
      .from('sr_tournaments')
      .select('id, name, venue_name, status, start_date, season:sr_seasons!inner(tour_name, year)')
      .eq('id', tournamentId)
      .single();

    if (tErr || !tournament) {
      console.error('[ScorePredictions] Tournament not found:', tErr?.message);
      return { skipped: true, reason: 'tournament_not_found' };
    }

    // 1b. CLOSED ONLY — never grade a live or scheduled tournament.
    if (tournament.status !== 'closed') {
      console.log(`[ScorePredictions] ${tournament.name} is '${tournament.status}' — not closed, skipping`);
      return { skipped: true, reason: `tournament_not_closed:${tournament.status}` };
    }

    // 2. Get the prediction that was actually MADE for this tournament:
    //    latest row generated before the tournament started.
    const { data: predictionRows, error: pErr } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('generated_at', { ascending: false });

    if (pErr) throw pErr;
    if (!predictionRows?.length) {
      console.log('[ScorePredictions] No predictions found for this tournament — skipping');
      return { skipped: true, reason: 'no_prediction_row' };
    }

    const startMs = tournament.start_date ? new Date(tournament.start_date).getTime() : null;
    const prediction = startMs === null
      ? predictionRows[0]
      : predictionRows.find((p: any) => new Date(p.generated_at).getTime() <= startMs);

    if (!prediction) {
      console.log('[ScorePredictions] Every stored prediction post-dates the start — cannot score honestly');
      return { skipped: true, reason: 'prediction_generated_after_start' };
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
