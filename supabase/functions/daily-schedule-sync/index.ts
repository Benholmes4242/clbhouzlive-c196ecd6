import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Daily Schedule Sync - Syncs tournament schedules and final leaderboards for ALL major tours
 * Runs at 6 AM UTC daily via pg_cron
 * 
 * NEW: Also syncs final leaderboards for recently closed tournaments that don't have data
 */

// Tours to sync - includes all supported professional golf tours
const TOURS_TO_SYNC = [
  'pga',    // PGA Tour
  'euro',   // DP World Tour (Sportradar v3 uses 'euro')
  'lpga',   // LPGA Tour
  'liv',    // LIV Golf
  'pgad',   // Korn Ferry Tour (Sportradar v3 uses 'pgad')
  'champ',  // Champions Tour (Sportradar v3 uses 'champ')
];

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

// Years to sync
const YEARS_TO_SYNC = [2025, 2026];

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

    const results: { tour: string; year: number; status: string; records?: number; error?: string }[] = [];
    const leaderboardResults: { tournament: string; status: string; records?: number; error?: string }[] = [];

    console.log(`[Daily Schedule Sync] Starting sync for ${TOURS_TO_SYNC.length} tours x ${YEARS_TO_SYNC.length} years`);

    // PART 0a: Auto-close any inprogress tournaments past their end_date
    const today = new Date().toISOString().split('T')[0];
    const { data: staleTournaments, error: staleError } = await supabase
      .from('sr_tournaments')
      .update({ status: 'closed' })
      .eq('status', 'inprogress')
      .lt('end_date', today)
      .select('id, name');

    if (!staleError && staleTournaments?.length) {
      console.log(`[Daily Schedule Sync] Auto-closed ${staleTournaments.length} stale inprogress tournament(s):`, 
        staleTournaments.map((t: any) => t.name).join(', '));
    } else if (staleError) {
      console.error(`[Daily Schedule Sync] Error auto-closing stale tournaments:`, staleError);
    }

    // PART 0b: Auto-close orphaned tournaments stuck in created/scheduled past end_date + 1 day buffer
    // These are tournaments that never transitioned to inprogress (e.g., live sync failed or Sportradar didn't return data)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: orphanedTournaments, error: orphanError } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, season_id')
      .in('status', ['created', 'scheduled'])
      .lt('end_date', yesterdayStr);

    if (orphanError) {
      console.error(`[Daily Schedule Sync] Error querying orphaned tournaments:`, orphanError);
    } else if (orphanedTournaments?.length) {
      console.log(`[Daily Schedule Sync] Found ${orphanedTournaments.length} orphaned tournament(s) past end_date — closing them`);
      
      for (const orphan of orphanedTournaments) {
        // Close the orphaned tournament
        const { error: closeError } = await supabase
          .from('sr_tournaments')
          .update({ status: 'closed' })
          .eq('id', orphan.id);

        if (closeError) {
          console.error(`[Daily Schedule Sync] Failed to close orphan ${orphan.name}:`, closeError.message);
        } else {
          console.log(`[Daily Schedule Sync] Closed orphaned tournament: ${orphan.name}`);
        }
      }
    }

    // PART 1: Sync schedules for each tour and year combination
    for (const tour of TOURS_TO_SYNC) {
      for (const year of YEARS_TO_SYNC) {
        try {
          console.log(`[Daily Schedule Sync] Syncing ${tour} ${year}...`);
          
          // Call the sportradar-sync function internally
          const response = await fetch(`${supabaseUrl}/functions/v1/sportradar-sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              action: 'schedule',
              tourId: tour,
              year: year,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              tour,
              year,
              status: 'success',
              records: data.records_synced || 0,
            });
            console.log(`[Daily Schedule Sync] ${tour} ${year}: ${data.records_synced} tournaments synced`);
          } else {
            const errorText = await response.text();
            results.push({
              tour,
              year,
              status: 'error',
              error: errorText.substring(0, 200),
            });
            console.error(`[Daily Schedule Sync] ${tour} ${year} failed: ${errorText}`);
          }
        } catch (error) {
          results.push({
            tour,
            year,
            status: 'error',
            error: error.message,
          });
          console.error(`[Daily Schedule Sync] ${tour} ${year} exception: ${error.message}`);
        }
      }
    }

    // PART 2: Sync final leaderboards for recently closed tournaments without data
    if (sportradarApiKey) {
      console.log(`[Daily Schedule Sync] Checking for closed tournaments needing leaderboard sync...`);
      
      // Find closed tournaments from last 30 days that have no leaderboard data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: closedTournaments, error: queryError } = await supabase
        .from('sr_tournaments')
        .select(`
          id, sr_id, name, end_date,
          season:sr_seasons!inner(year, tour_name)
        `)
        .eq('status', 'closed')
        .gte('end_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('end_date', { ascending: false });

      if (queryError) {
        console.error(`[Daily Schedule Sync] Error querying closed tournaments:`, queryError);
      } else if (closedTournaments?.length) {
        console.log(`[Daily Schedule Sync] Found ${closedTournaments.length} recently closed tournaments`);
        
        // Check each tournament for missing leaderboard data
        for (const tournament of closedTournaments) {
          // Check if leaderboard data exists
          const { count } = await supabase
            .from('sr_leaderboards')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);
          
          if (count === 0) {
            console.log(`[Daily Schedule Sync] Syncing final leaderboard for: ${tournament.name}`);
            
            try {
              const season = tournament.season as any;
              const tour = TOUR_NAME_TO_API[season?.tour_name] || 'pga';
              const year = season?.year || 2026;
              
              const records = await syncFinalLeaderboard(
                supabase,
                sportradarApiKey,
                tour,
                year,
                tournament.sr_id,
                tournament.id
              );
              
              leaderboardResults.push({
                tournament: tournament.name,
                status: 'success',
                records,
              });
              console.log(`[Daily Schedule Sync] ${tournament.name}: ${records} leaderboard entries synced`);
            } catch (error) {
              leaderboardResults.push({
                tournament: tournament.name,
                status: 'error',
                error: error.message,
              });
              console.error(`[Daily Schedule Sync] Failed to sync ${tournament.name}:`, error.message);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }

    // PART 3: Populate winner_id from leaderboard for closed tournaments missing it
    console.log(`[Daily Schedule Sync] Checking for closed tournaments with missing winner_id...`);
    
    const winnerLookbackDate = new Date();
    winnerLookbackDate.setDate(winnerLookbackDate.getDate() - 30);
    
    const { data: missingWinnerTournaments, error: winnerQueryError } = await supabase
      .from('sr_tournaments')
      .select('id, name')
      .eq('status', 'closed')
      .is('winner_id', null)
      .gte('end_date', winnerLookbackDate.toISOString().split('T')[0]);

    if (winnerQueryError) {
      console.error(`[Daily Schedule Sync] Error querying tournaments missing winner:`, winnerQueryError);
    } else if (missingWinnerTournaments?.length) {
      console.log(`[Daily Schedule Sync] Found ${missingWinnerTournaments.length} closed tournament(s) missing winner_id`);
      
      for (const tournament of missingWinnerTournaments) {
        // Find position 1 player with the lowest strokes (handles ties)
        const { data: winner } = await supabase
          .from('sr_leaderboards')
          .select('player_id, sr_players!inner(sr_id)')
          .eq('tournament_id', tournament.id)
          .eq('position', 1)
          .gt('strokes', 0)
          .order('strokes', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (winner?.sr_players?.sr_id) {
          const { error: updateError } = await supabase
            .from('sr_tournaments')
            .update({ winner_id: winner.sr_players.sr_id })
            .eq('id', tournament.id);

          if (!updateError) {
            console.log(`[Daily Schedule Sync] Set winner_id for ${tournament.name}: ${winner.sr_players.sr_id}`);
          } else {
            console.error(`[Daily Schedule Sync] Failed to set winner for ${tournament.name}:`, updateError.message);
          }
        } else {
          console.log(`[Daily Schedule Sync] No position-1 leaderboard entry for ${tournament.name} — skipping winner backfill`);
        }
      }
    } else {
      console.log(`[Daily Schedule Sync] All closed tournaments have winner_id populated`);
    }

    // Log the sync status to sr_cron_status
    const successCount = results.filter(r => r.status === 'success').length;
    const totalRecords = results.reduce((sum, r) => sum + (r.records || 0), 0);
    const leaderboardRecords = leaderboardResults.reduce((sum, r) => sum + (r.records || 0), 0);

    await supabase.from('sr_cron_status').insert({
      job_name: 'daily-schedule-sync',
      status: successCount === results.length ? 'success' : 'partial',
      message: `Synced ${totalRecords} tournaments, ${leaderboardRecords} final leaderboard entries across ${successCount}/${results.length} tour/year combinations`,
      metadata: { scheduleResults: results, leaderboardResults },
    });

    console.log(`[Daily Schedule Sync] Complete: ${totalRecords} tournaments, ${leaderboardRecords} leaderboard entries synced`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${totalRecords} tournaments and ${leaderboardRecords} leaderboard entries`,
        scheduleResults: results,
        leaderboardResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Daily Schedule Sync] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Sync final leaderboard for a closed tournament
 */
async function syncFinalLeaderboard(
  supabase: any,
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentDbId: string
): Promise<number> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  
  console.log(`[FinalLeaderboard] Calling: ${url}`);
  
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