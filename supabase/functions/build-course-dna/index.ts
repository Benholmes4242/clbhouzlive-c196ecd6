/**
 * build-course-dna — Builds statistical course DNA profiles from historical tournament data.
 * 
 * For each venue, analyzes past tournament results to determine which player
 * stats correlate most strongly with success. This creates a data-driven
 * course profile that replaces the basic yardage/par rule.
 * 
 * Invoke: supabase.functions.invoke('build-course-dna', { body: { venueName } })
 * Or for all venues: supabase.functions.invoke('build-course-dna', { body: { all: true } })
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatCorrelation {
  statName: string;
  correlation: number;
  importance: number;
}

/**
 * Calculate Spearman rank correlation between a stat and finish position.
 * Negative correlation = higher stat → lower (better) position = good predictor.
 */
function spearmanCorrelation(
  stats: number[],
  positions: number[],
): number {
  const n = stats.length;
  if (n < 5) return 0;

  const rankArray = (arr: number[], ascending = true) => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => ascending ? a.v - b.v : b.v - a.v);
    const ranks = new Array(n);
    for (let i = 0; i < n; i++) ranks[sorted[i].i] = i + 1;
    return ranks;
  };

  const statRanks = rankArray(stats, false);
  const posRanks = rankArray(positions, true);

  let dSquaredSum = 0;
  for (let i = 0; i < n; i++) {
    const d = statRanks[i] - posRanks[i];
    dSquaredSum += d * d;
  }

  return 1 - (6 * dSquaredSum) / (n * (n * n - 1));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { venueName, all } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Get venues to process
    let venues: string[];
    if (all) {
      const { data } = await supabase
        .from('sr_tournaments')
        .select('venue_name')
        .in('status', ['closed', 'complete'])
        .not('venue_name', 'is', null);
      venues = [...new Set((data || []).map((t) => t.venue_name))];
    } else if (venueName) {
      venues = [venueName];
    } else {
      throw new Error('Provide venueName or all: true');
    }

    console.log(`[CourseDNA] Building profiles for ${venues.length} venues`);
    const results: any[] = [];

    for (const venue of venues) {
      try {
        // Get all closed tournaments at this venue
        const { data: tournaments } = await supabase
          .from('sr_tournaments')
          .select('id, name, venue_par, venue_yardage, start_date')
          .eq('venue_name', venue)
          .in('status', ['closed', 'complete'])
          .order('start_date', { ascending: false })
          .limit(5);

        if (!tournaments?.length) continue;

        const tournamentIds = tournaments.map((t) => t.id);

        // Get leaderboard data for these tournaments
        const { data: leaderboardData } = await supabase
          .from('sr_leaderboards')
          .select('tournament_id, player_id, position, score, strokes')
          .in('tournament_id', tournamentIds)
          .gt('strokes', 0)
          .not('position', 'is', null)
          .order('position', { ascending: true });

        if (!leaderboardData?.length) continue;

        // Get player statistics for these players
        const playerIds = [...new Set(leaderboardData.map((l) => l.player_id))];
        const { data: playerStats } = await supabase
          .from('sr_player_statistics')
          .select('player_id, raw_data')
          .in('player_id', playerIds);

        if (!playerStats?.length) continue;

        // Build stat lookup
        const statLookup = new Map<string, any>();
        for (const ps of playerStats) {
          const stats = ps.raw_data?.statistics || {};
          statLookup.set(ps.player_id, {
            driveAvg: parseFloat(stats.drive_avg?.avg) || null,
            driveAcc: parseFloat(stats.drive_acc?.avg) || null,
            girPct: parseFloat(stats.gir_pct?.avg) || null,
            scramblingPct: parseFloat(stats.scrambling_pct?.avg) || null,
            puttAvg: parseFloat(stats.putt_avg?.avg) || null,
            sgTotal: parseFloat(stats.strokes_gained_total?.avg) || null,
            sgTeeGreen: parseFloat(stats.strokes_gained_tee_green?.avg) || null,
            sgOffTee: parseFloat(stats.strokes_gained_off_tee?.avg ?? stats.sg_off_tee) || null,
            sgApproach: parseFloat(stats.strokes_gained_approach?.avg ?? stats.sg_approach) || null,
            sgAroundGreen: parseFloat(stats.strokes_gained_around_green?.avg ?? stats.sg_around_green) || null,
            sgPutting: parseFloat(stats.strokes_gained_putting?.avg ?? stats.sg_putting) || null,
          });
        }

        // Match stats to positions
        const paired: Array<{ position: number; stats: any }> = [];
        for (const lb of leaderboardData) {
          const stats = statLookup.get(lb.player_id);
          if (stats && lb.position) {
            paired.push({ position: lb.position, stats });
          }
        }

        if (paired.length < 20) continue;

        // Calculate correlations for each stat
        const statKeys = [
          { key: 'driveAvg', name: 'Driving Distance', dbField: 'driving_distance_importance' },
          { key: 'driveAcc', name: 'Driving Accuracy', dbField: 'driving_accuracy_importance' },
          { key: 'girPct', name: 'Greens in Regulation', dbField: 'gir_importance' },
          { key: 'scramblingPct', name: 'Scrambling', dbField: 'scrambling_importance' },
          { key: 'puttAvg', name: 'Putting Average', dbField: 'putting_importance' },
          { key: 'sgOffTee', name: 'SG: Off the Tee', dbField: 'sg_off_tee_importance' },
          { key: 'sgApproach', name: 'SG: Approach', dbField: 'sg_approach_importance' },
          { key: 'sgAroundGreen', name: 'SG: Around Green', dbField: 'sg_around_green_importance' },
          { key: 'sgPutting', name: 'SG: Putting', dbField: 'sg_putting_importance' },
        ];

        const correlations: StatCorrelation[] = [];

        for (const { key, name } of statKeys) {
          const validPairs = paired.filter((p) => p.stats[key] !== null);
          if (validPairs.length < 15) continue;

          const statValues = validPairs.map((p) => p.stats[key]);
          const positions = validPairs.map((p) => p.position);

          const corr = spearmanCorrelation(statValues, positions);
          const adjustedCorr = key === 'puttAvg' ? corr : -corr;

          correlations.push({
            statName: name,
            correlation: adjustedCorr,
            importance: Math.round(Math.max(0, Math.min(100, adjustedCorr * 100))),
          });
        }

        // Historical winners
        const winners: any[] = [];
        for (const t of tournaments) {
          const winner = leaderboardData.find(
            (l) => l.tournament_id === t.id && l.position === 1
          );
          if (winner) {
            const { data: playerData } = await supabase
              .from('sr_players')
              .select('first_name, last_name')
              .eq('id', winner.player_id)
              .single();

            winners.push({
              year: new Date(t.start_date).getFullYear(),
              winner: playerData ? `${playerData.first_name} ${playerData.last_name}` : 'Unknown',
              score: winner.score,
            });
          }
        }

        // Determine course type from correlations
        const topStats = correlations
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 3)
          .map((c) => c.statName);

        let courseType = 'balanced';
        if (topStats.includes('Driving Distance') || topStats.includes('SG: Off the Tee')) {
          courseType = 'bombers_paradise';
        } else if (topStats.includes('Driving Accuracy') && topStats.includes('Greens in Regulation')) {
          courseType = 'precision_track';
        } else if (topStats.includes('Scrambling') || topStats.includes('SG: Around Green')) {
          courseType = 'scrambling_course';
        } else if (topStats.includes('SG: Putting') || topStats.includes('Putting Average')) {
          courseType = 'putting_centric';
        }

        // Calculate scoring stats
        const winningScores = leaderboardData
          .filter((l) => l.position === 1 && l.score !== null)
          .map((l) => l.score);

        const avgWinningScore = winningScores.length > 0
          ? winningScores.reduce((a, b) => a + b, 0) / winningScores.length
          : null;

        // Build importance map for DB columns
        const importanceMap: Record<string, number> = {};
        for (const { key, dbField } of statKeys) {
          const corr = correlations.find((c) => c.statName === statKeys.find((s) => s.key === key)?.name);
          importanceMap[dbField] = corr?.importance || 50;
        }

        // Upsert the profile
        const profile = {
          venue_name: venue,
          ...importanceMap,
          course_type: courseType,
          avg_winning_score: avgWinningScore,
          scoring_difficulty: avgWinningScore ? Math.max(1, Math.min(10, 5 + avgWinningScore / 3)) : 5,
          tournaments_analyzed: tournaments.length,
          years_of_data: tournaments.length,
          historical_winners: winners,
          stat_correlations: correlations,
          last_updated: new Date().toISOString(),
        };

        const { error: upsertErr } = await supabase
          .from('course_dna_profiles')
          .upsert(profile, { onConflict: 'venue_name' });

        if (upsertErr) {
          console.error(`[CourseDNA] Error upserting ${venue}:`, upsertErr.message);
        } else {
          console.log(`[CourseDNA] Built profile for ${venue}: type=${courseType}, ` +
            `top stats: ${topStats.join(', ')}, from ${paired.length} player-rounds`);
          results.push({ venue, courseType, topStats, playerRounds: paired.length });
        }

      } catch (venueErr) {
        console.error(`[CourseDNA] Error processing ${venue}:`, venueErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profilesBuilt: results.length,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CourseDNA] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
