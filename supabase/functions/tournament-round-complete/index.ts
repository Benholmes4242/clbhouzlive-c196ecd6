/**
 * tournament-round-complete - Fetches scorecards + hole statistics
 * 
 * Triggered by tournament-live-sync when it detects round completion
 * (≥80% of active players show thru=18/F). Runs ONCE per round per tournament.
 * 
 * This replaces the old pattern of fetching scorecards/hole-stats every sync
 * cycle, saving ~2,400+ API calls/day.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getAccessLevel = () => Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 'production';
const getTourBaseUrl = (tour: string = 'pga') =>
  `https://api.sportradar.com/golf/${getAccessLevel()}/${tour}/v3/en`;

function mapTourName(tourName: string): string {
  const name = tourName.toLowerCase();
  if (name.includes('liv')) return 'liv';
  if (name.includes('lpga')) return 'lpga';
  if (name.includes('dp world') || name.includes('european') || name.includes('euro')) return 'euro';
  if (name.includes('champions') || name.includes('champ')) return 'champ';
  if (name.includes('korn ferry') || name.includes('pgad')) return 'pgad';
  if (name.includes('pga')) return 'pga';
  return 'pga';
}

// Tours that support hole statistics via Sportradar API
function tourSupportsHoleStats(tourSlug: string): boolean {
  const unsupported = ['liv', 'oly', 'usga'];
  return !unsupported.includes(tourSlug.toLowerCase());
}

async function fetchSportradar(url: string, apiKey: string): Promise<any> {
  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
  }
  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sportradarApiKey = Deno.env.get('SPORTRADAR_API_KEY');

    if (!sportradarApiKey) {
      return new Response(
        JSON.stringify({ error: 'SPORTRADAR_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { tournamentId, roundNumber } = await req.json();

    if (!tournamentId || !roundNumber) {
      return new Response(
        JSON.stringify({ error: 'tournamentId and roundNumber required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RoundComplete] Processing tournament ${tournamentId}, round ${roundNumber}`);

    // Get tournament details
    const { data: tournament } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, season_id')
      .eq('id', tournamentId)
      .single();

    if (!tournament) {
      return new Response(
        JSON.stringify({ error: 'Tournament not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get season info for API URL construction
    const { data: seasonData } = await supabase
      .from('sr_seasons')
      .select('id, year, tour_name')
      .eq('id', tournament.season_id)
      .maybeSingle();

    const year = seasonData?.year || new Date().getFullYear();
    const tour = mapTourName(seasonData?.tour_name || 'pga');

    let holeStatsRecords = 0;
    let scorecardsRecords = 0;

    // ── 1. Fetch Hole Statistics ──────────────────────────────────────
    if (!tourSupportsHoleStats(tour)) {
      console.log(`[RoundComplete] Skipping hole stats for ${tournament.name} — ${tour} tour not supported`);
    } else try {
      const holeStatsUrl = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournament.sr_id}/hole-statistics.json`;
      const holeData = await fetchSportradar(holeStatsUrl, sportradarApiKey);
      
      const rounds = holeData.rounds || [];
      
      if (!rounds || rounds.length === 0) {
        console.warn(`[RoundComplete] No hole stats available yet for round ${roundNumber}. Will be picked up on next sync.`);
      }
      
      for (const round of rounds) {
        const roundNum = round.number;
        const courses = round.courses || [];
        for (const course of courses) {
          const holes = course.holes || [];
          for (const hole of holes) {
            const stats = hole.statistics || {};
            const { error } = await supabase.from('sr_hole_statistics').upsert({
              tournament_id: tournament.id,
              round_number: roundNum,
              hole_number: hole.number,
              par: hole.par,
              yardage: hole.yardage,
              scoring_average: stats.scoring_avg ?? stats.scoring_average ?? hole.scoring_average ?? hole.scoring_avg ?? hole.strokes_avg ?? null,
              avg_diff: stats.avg_diff ?? stats.relative_to_par ?? hole.avg_diff ?? null,
              eagles: stats.eagles ?? hole.eagles ?? 0,
              birdies: stats.birdies ?? hole.birdies ?? 0,
              pars: stats.pars ?? hole.pars ?? 0,
              bogeys: stats.bogeys ?? hole.bogeys ?? 0,
              double_bogeys: stats.double_bogeys ?? hole.double_bogeys ?? 0,
              other: stats.other ?? hole.other ?? hole.other_scores ?? 0,
              raw_data: hole,
            }, { onConflict: 'tournament_id,round_number,hole_number' });
            if (!error) holeStatsRecords++;
          }
        }
      }
      console.log(`[RoundComplete] Hole stats: ${holeStatsRecords} records`);
    } catch (err) {
      console.error(`[RoundComplete] Hole stats error:`, err.message);
    }

    // Small delay between API calls to be respectful
    await new Promise(resolve => setTimeout(resolve, 500));

    // ── 2. Bulk sync ALL players' scorecards for the completed round ──
    // Uses /rounds/{round}/scores.json — returns entire field in one API call
    console.log(`[RoundComplete] Triggering bulk scorecards sync for round ${roundNumber}`);

    try {
      const { error: bulkScError } = await supabase.functions.invoke('sportradar-sync', {
        body: {
          action: 'scorecards',
          tournamentId: tournament.sr_id,
          round: roundNumber,
          year: year,
        },
      });

      if (bulkScError) {
        console.error(`[RoundComplete] Bulk scorecards sync failed:`, bulkScError.message);
      } else {
        scorecardsRecords = 1; // Mark as synced (actual count handled by sportradar-sync)
        console.log(`[RoundComplete] Bulk scorecards sync complete — all players, round ${roundNumber}`);
      }
    } catch (err) {
      console.error(`[RoundComplete] Bulk scorecards error:`, err);
    }

    const totalDuration = Date.now() - startTime;

    // Log completion
    await supabase.from('sr_sync_log').insert({
      sync_type: 'round_complete',
      tournament_id: tournament.id,
      status: 'success',
      records_synced: holeStatsRecords + scorecardsRecords,
      error_message: `round_${roundNumber}_data`,
    });

    console.log(`[RoundComplete] ✓ ${tournament.name} R${roundNumber}: ${holeStatsRecords} hole stats + ${scorecardsRecords} scorecards in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        tournament: tournament.name,
        round: roundNumber,
        holeStats: holeStatsRecords,
        scorecards: scorecardsRecords,
        duration: totalDuration,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[RoundComplete] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
