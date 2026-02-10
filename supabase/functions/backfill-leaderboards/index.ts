import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Backfill Leaderboards - One-time sync of historical leaderboards for closed tournaments
 * Call this manually to populate missing leaderboard data
 */

// Map database tour names to SportRadar API codes
const TOUR_NAME_TO_API: Record<string, string> = {
  'pga': 'pga',
  'PGA Tour': 'pga',
  'EURO': 'euro',
  'DP World Tour': 'euro',
  'euro': 'euro',
  'LPGA': 'lpga',
  'lpga': 'lpga',
  'LIV': 'liv',
  'LIV Golf': 'liv',
  'liv': 'liv',
  'PGAD': 'pgad',
  'Korn Ferry': 'pgad',
  'pgad': 'pgad',
  'CHAMP': 'champ',
  'Champions': 'champ',
  'champ': 'champ',
};

// SportRadar API configuration
const getAccessLevel = () => Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 'production';
const getTourBaseUrl = (tour: string) => `https://api.sportradar.com/golf/${getAccessLevel()}/${tour}/v3/en`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sportradarApiKey = Deno.env.get('SPORTRADAR_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!sportradarApiKey) {
      return new Response(
        JSON.stringify({ error: 'SPORTRADAR_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse optional filters from request body
    const body = await req.json().catch(() => ({}));
    const limit = body.limit || 10; // Process max N tournaments per call
    const tourFilter = body.tour; // Optional: only sync specific tour

    console.log(`[Backfill] Starting leaderboard backfill (limit: ${limit}${tourFilter ? `, tour: ${tourFilter}` : ''})...`);

    // Find closed tournaments that have no leaderboard data
    let query = supabase
      .from('sr_tournaments')
      .select(`
        id, sr_id, name, end_date, status,
        season:sr_seasons!inner(year, tour_name)
      `)
      .eq('status', 'closed')
      .order('end_date', { ascending: false });

    const { data: closedTournaments, error: queryError } = await query;

    if (queryError) {
      throw new Error(`Failed to query tournaments: ${queryError.message}`);
    }

    console.log(`[Backfill] Found ${closedTournaments?.length || 0} closed tournaments`);

    const results: { tournament: string; tour: string; status: string; records?: number; error?: string }[] = [];
    let processed = 0;

    for (const tournament of closedTournaments || []) {
      if (processed >= limit) break;

      const season = tournament.season as any;
      const tourName = season?.tour_name || 'pga';
      
      // Apply tour filter if specified
      if (tourFilter && !tourName.toLowerCase().includes(tourFilter.toLowerCase())) {
        continue;
      }

      // Check if leaderboard data already exists
      const { count } = await supabase
        .from('sr_leaderboards')
        .select('id', { count: 'exact', head: true })
        .eq('tournament_id', tournament.id);

      if (count && count > 0) {
        console.log(`[Backfill] Skipping ${tournament.name} - already has ${count} entries`);
        continue;
      }

      console.log(`[Backfill] Syncing: ${tournament.name} (${tourName})`);

      try {
        const tour = TOUR_NAME_TO_API[tourName] || 'pga';
        const year = season?.year || 2026;

        const records = await syncLeaderboard(
          supabase,
          sportradarApiKey,
          tour,
          year,
          tournament.sr_id,
          tournament.id
        );

        results.push({
          tournament: tournament.name,
          tour: tourName,
          status: 'success',
          records,
        });
        console.log(`[Backfill] ${tournament.name}: ${records} entries synced`);
        processed++;

        // Delay to avoid rate limiting (SportRadar has per-second limits)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          tournament: tournament.name,
          tour: tourName,
          status: 'error',
          error: error.message,
        });
        console.error(`[Backfill] Failed: ${tournament.name} - ${error.message}`);
        processed++;
      }
    }

    const totalRecords = results.reduce((sum, r) => sum + (r.records || 0), 0);
    const successCount = results.filter(r => r.status === 'success').length;

    console.log(`[Backfill] Complete: ${successCount}/${processed} tournaments, ${totalRecords} total entries`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalRecords} leaderboard entries from ${successCount} tournaments`,
        processed,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backfill] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Sync leaderboard for a tournament
 */
async function syncLeaderboard(
  supabase: any,
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentDbId: string
): Promise<number> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;

  console.log(`[Leaderboard] Calling: ${url}`);

  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const leaderboard = data.leaderboard || [];
  let records = 0;

  for (const entry of leaderboard) {
    const playerSrId = entry.player?.id;
    if (!playerSrId) continue;

    // Find or create player
    let { data: player } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', playerSrId)
      .maybeSingle();

    if (!player) {
      const { data: newPlayer } = await supabase.from('sr_players').insert({
        sr_id: playerSrId,
        first_name: entry.player?.first_name,
        last_name: entry.player?.last_name,
        full_name: `${entry.player?.first_name || ''} ${entry.player?.last_name || ''}`.trim(),
        country: entry.player?.country,
      }).select().single();
      player = newPlayer;
    }

    if (player) {
      const { error } = await supabase.from('sr_leaderboards').upsert({
        tournament_id: tournamentDbId,
        player_id: player.id,
        position: entry.position,
        position_tied: entry.tied || false,
        score: entry.score,
        strokes: entry.strokes,
        thru: entry.thru,
        round_1: entry.rounds?.[0]?.strokes,
        round_2: entry.rounds?.[1]?.strokes,
        round_3: entry.rounds?.[2]?.strokes,
        round_4: entry.rounds?.[3]?.strokes,
        money: entry.money,
        points: entry.points,
        status: entry.status,
        raw_data: entry,
      }, { onConflict: 'tournament_id,player_id' });

      if (!error) records++;
    }
  }

  return records;
}