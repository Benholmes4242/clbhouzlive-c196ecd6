/**
 * tournament-live-sync - Centralised live tournament data sync
 * 
 * Called by pg_cron. Syncs ALL live tournaments per invocation (typically 1-3).
 * This is the ONLY thing calling Sportradar — decoupled from user count.
 * Supabase Realtime broadcasts DB changes to all connected clients.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SportRadar API configuration
const getAccessLevel = () => Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 'production';
const getTourBaseUrl = (tour: string = 'pga') => 
  `https://api.sportradar.com/golf/${getAccessLevel()}/${tour}/v3/en`;

// Sync ALL live tournaments per invocation (typically 1-3, safe for CPU budget)
const MAX_TOURNAMENTS_PER_SYNC = 10;

interface LiveTournament {
  id: string;
  sr_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  season_id: string;
  last_live_sync: string | null;
}

interface PendingLiveTournament {
  id: string;
  sr_id: string;
  name: string;
  season_id: string;
}

interface SyncResult {
  tournamentId: string;
  tournamentName: string;
  leaderboard: { success: boolean; records: number; error?: string };
  teeTimes: { success: boolean; records: number; error?: string };
  holeStats: { success: boolean; records: number; error?: string };
  scorecards: { success: boolean; records: number; error?: string };
  duration: number;
  transitionedToClosed?: boolean;
}

interface LeaderboardSyncResult {
  records: number;
  sportradarStatus?: string;  // 'inprogress', 'closed', 'complete', etc.
}

interface StatusResolverResult {
  tournamentId: string;
  tournamentName: string;
  resolved: boolean;
  reason: string;
}

// Sync ALL live tournaments with leaderboard data only (the real-time critical data).
// Secondary data (tee times, hole stats, scorecards) is handled by daily-schedule-sync.
// This keeps CPU budget low enough to complete within edge function limits.

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

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('sr_sync_log')
      .insert({ 
        sync_type: 'live_auto_sync', 
        tour_id: 'all', 
        status: 'pending'
      })
      .select()
      .single();

    const syncLogId = syncLog?.id;

    console.log(`[LiveSync] Starting automated live tournament sync (${SYNC_ITERATIONS} iterations, ${SYNC_INTERVAL_MS / 1000}s apart)...`);

    // === ITERATION 1 ONLY: housekeeping (stale close + status resolver) ===
    const today = new Date().toISOString().split('T')[0];
    const { data: staleTournaments, error: staleError } = await supabase
      .from('sr_tournaments')
      .update({ status: 'closed' })
      .eq('status', 'inprogress')
      .lt('end_date', today)
      .select('id, name');

    if (!staleError && staleTournaments?.length) {
      console.log(`[LiveSync] Auto-closed ${staleTournaments.length} stale tournament(s):`, 
        staleTournaments.map(t => t.name).join(', '));
    }

    const statusResolverResults = await resolveToLiveStatus(supabase, sportradarApiKey, today);
    console.log(`[LiveSync] Status resolver completed: ${statusResolverResults.filter(r => r.resolved).length} tournament(s) transitioned to inprogress`);

    // Helper to sync a single tournament (defined once, used in every iteration)
    // leaderboardOnly=true on iterations 2+ to save CPU time
    const syncSingleTournament = async (tournament: LiveTournament, seasonMap: Map<string, any>, leaderboardOnly = false): Promise<SyncResult> => {
      const tournamentStart = Date.now();
      const season = seasonMap.get(tournament.season_id);
      const year = season?.year || new Date().getFullYear();
      const tour = mapTourName(season?.tour_name || 'pga');

      const result: SyncResult = {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        leaderboard: { success: false, records: 0 },
        teeTimes: { success: false, records: 0 },
        holeStats: { success: false, records: 0 },
        scorecards: { success: false, records: 0 },
        duration: 0,
        transitionedToClosed: false,
      };

      let sportradarStatus: string | undefined;

      // 1. Sync Leaderboard (always — this is the real-time critical data)
      try {
        const leaderboardResult = await syncLeaderboard(
          supabase, sportradarApiKey, tour, year, tournament.sr_id, tournament.id
        );
        result.leaderboard = { success: true, records: leaderboardResult.records };
        sportradarStatus = leaderboardResult.sportradarStatus;
      } catch (error) {
        result.leaderboard = { success: false, records: 0, error: error.message };
        console.error(`[LiveSync] Leaderboard error for ${tournament.name}:`, error.message);
      }

      // Only sync secondary data (tee times, hole stats, scorecards) on iteration 1
      // This keeps CPU budget manageable for the looping pattern
      if (!leaderboardOnly) {
        const roundsToSync = [1, 2];
        
        const [holeStatsResult, teeTimesResults] = await Promise.allSettled([
          syncHoleStatistics(supabase, sportradarApiKey, tour, year, tournament.sr_id, tournament.id)
            .catch(e => { console.error(`[LiveSync] Hole stats error for ${tournament.name}:`, e.message); return 0; }),
          Promise.all(roundsToSync.map(roundNumber => 
            syncTeeTimes(supabase, sportradarApiKey, tour, year, tournament.sr_id, tournament.id, roundNumber)
              .catch(() => 0)
          ))
        ]);

        if (holeStatsResult.status === 'fulfilled') {
          result.holeStats = { success: true, records: holeStatsResult.value as number };
        }
        if (teeTimesResults.status === 'fulfilled') {
          const teeTimeRecords = (teeTimesResults.value as number[]).reduce((a, b) => a + b, 0);
          result.teeTimes = { success: true, records: teeTimeRecords };
        }

        try {
          const scorecardResults = await Promise.all(
            roundsToSync.map(roundNumber => 
              syncScorecards(supabase, sportradarApiKey, tour, year, tournament.sr_id, tournament.id, roundNumber)
                .catch(() => 0)
            )
          );
          const scorecardRecords = scorecardResults.reduce((a, b) => a + b, 0);
          result.scorecards = { success: true, records: scorecardRecords };
        } catch (error) {
          result.scorecards = { success: false, records: 0, error: error.message };
        }
      }

      result.duration = Date.now() - tournamentStart;

      // Check if Sportradar reports this tournament as complete/closed
      const closedStatuses = ['closed', 'complete', 'completed', 'official'];
      if (sportradarStatus && closedStatuses.includes(sportradarStatus.toLowerCase())) {
        console.log(`[LiveSync] Sportradar reports ${tournament.name} as '${sportradarStatus}' - transitioning to closed`);
        
        let winnerId: string | null = null;
        const { data: winnerEntry } = await supabase
          .from('sr_leaderboards')
          .select('player_id, sr_players!inner(sr_id)')
          .eq('tournament_id', tournament.id)
          .eq('position', 1)
          .gt('strokes', 0)
          .order('strokes', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (winnerEntry?.sr_players?.sr_id) {
          winnerId = winnerEntry.sr_players.sr_id;
        }

        const updatePayload: any = { 
          status: 'closed',
          last_live_sync: new Date().toISOString()
        };
        if (winnerId) updatePayload.winner_id = winnerId;

        const { error: closeError } = await supabase
          .from('sr_tournaments')
          .update(updatePayload)
          .eq('id', tournament.id);
        
        if (!closeError) {
          result.transitionedToClosed = true;
          console.log(`[LiveSync] ✓ Transitioned ${tournament.name} to closed${winnerId ? ` (winner: ${winnerId})` : ''}`);
        }
      } else {
        await supabase
          .from('sr_tournaments')
          .update({ last_live_sync: new Date().toISOString() })
          .eq('id', tournament.id);
      }

      return result;
    };

    // ================================================================
    // SINGLE PASS: Leaderboard-only sync for ALL live tournaments
    // Secondary data (tee times, hole stats, scorecards) handled by daily-schedule-sync
    // ================================================================
    const { data: allLiveTournaments, error: queryError } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, status, start_date, end_date, season_id, last_live_sync')
      .eq('status', 'inprogress')
      .order('last_live_sync', { ascending: true, nullsFirst: true });

    if (queryError) {
      throw new Error(`Failed to query live tournaments: ${queryError.message}`);
    }

    if (!allLiveTournaments || allLiveTournaments.length === 0) {
      console.log('[LiveSync] No live tournaments found');
      if (syncLogId) {
        await supabase.from('sr_sync_log').update({
          status: 'success', records_synced: 0, completed_at: new Date().toISOString(),
          error_message: 'No live tournaments to sync'
        }).eq('id', syncLogId);
      }
      return new Response(
        JSON.stringify({ success: true, message: 'No live tournaments', tournaments: 0, duration: Date.now() - startTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tournaments = allLiveTournaments.slice(0, MAX_TOURNAMENTS_PER_SYNC);

    // Build season map
    const sIds = [...new Set(tournaments.map(t => t.season_id).filter(Boolean))];
    const { data: sData } = await supabase.from('sr_seasons').select('id, year, tour_name').in('id', sIds);
    const sMap = new Map(sData?.map(s => [s.id, s]) || []);

    const results: SyncResult[] = [];
    let totalRecords = 0;

    // Leaderboard-only for all tournaments (fast, CPU-friendly)
    for (const tournament of tournaments) {
      const result = await syncSingleTournament(tournament, sMap, true); // leaderboardOnly=true
      results.push(result);
      totalRecords += result.leaderboard.records;
    }

    const totalDuration = Date.now() - startTime;

    if (syncLogId) {
      await supabase.from('sr_sync_log').update({
        status: 'success', records_synced: totalRecords, completed_at: new Date().toISOString(),
      }).eq('id', syncLogId);
    }

    console.log(`[tournament-live-sync] Synced ${tournaments.length} tournaments (leaderboard-only), ${totalRecords} records in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${tournaments.length} live tournament(s) — leaderboard only`,
        tournamentsSynced: tournaments.length,
        totalRecords,
        duration: totalDuration,
        staleClosed: staleTournaments?.length || 0,
        statusResolved: statusResolverResults.filter(r => r.resolved).length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[LiveSync] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Map tour names to SportRadar API tour codes (Sportradar v3)
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

// ============================================================
// STATUS RESOLVER: Check Sportradar for live data and transition status
// ============================================================
async function resolveToLiveStatus(
  supabase: any,
  apiKey: string,
  today: string
): Promise<StatusResolverResult[]> {
  const results: StatusResolverResult[] = [];

  // Find tournaments that SHOULD potentially be live based on dates
  // status is 'created' or 'scheduled', start_date <= today, end_date >= today
  const { data: pendingLive, error: pendingError } = await supabase
    .from('sr_tournaments')
    .select('id, sr_id, name, season_id')
    .in('status', ['created', 'scheduled'])
    .lte('start_date', today)
    .gte('end_date', today);

  if (pendingError) {
    console.error('[StatusResolver] Error querying pending tournaments:', pendingError.message);
    return results;
  }

  if (!pendingLive || pendingLive.length === 0) {
    console.log('[StatusResolver] No pending tournaments need status resolution');
    return results;
  }

  console.log(`[StatusResolver] Found ${pendingLive.length} tournament(s) to check for live data`);

  // Get season info for all pending tournaments
  const seasonIds = [...new Set(pendingLive.map((t: PendingLiveTournament) => t.season_id).filter(Boolean))];
  const { data: seasons } = await supabase
    .from('sr_seasons')
    .select('id, year, tour_name')
    .in('id', seasonIds);

  const seasonMap = new Map(seasons?.map((s: any) => [s.id, s]) || []);

  // Check each pending tournament for live data (with rate limiting)
  for (const tournament of pendingLive as PendingLiveTournament[]) {
    const season = seasonMap.get(tournament.season_id);
    const year = season?.year || new Date().getFullYear();
    const tour = mapTourName(season?.tour_name || 'pga');

    console.log(`[StatusResolver] Checking: ${tournament.name} (${tour}/${year})`);

    try {
      // Try to fetch leaderboard data from Sportradar (with enhanced logging)
      const hasLiveData = await checkForLiveLeaderboard(apiKey, tour, year, tournament.sr_id, tournament.name);

      if (hasLiveData) {
        // Transition to inprogress
        const { error: updateError } = await supabase
          .from('sr_tournaments')
          .update({ 
            status: 'inprogress',
            last_live_sync: new Date().toISOString()
          })
          .eq('id', tournament.id);

        if (updateError) {
          console.error(`[StatusResolver] Failed to update ${tournament.name}:`, updateError.message);
          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            resolved: false,
            reason: `Update failed: ${updateError.message}`
          });
        } else {
          console.log(`[StatusResolver] ✓ Transitioned ${tournament.name} to inprogress`);
          results.push({
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            resolved: true,
            reason: 'Live leaderboard data found - transitioned to inprogress'
          });
        }
      } else {
        // Detailed diagnostics already logged by checkForLiveLeaderboard
        results.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          resolved: false,
          reason: 'No leaderboard data available from Sportradar'
        });
      }

      // Rate limiting: small delay between API calls to avoid hitting limits
      await new Promise(resolve => setTimeout(resolve, 250));

    } catch (error) {
      console.error(`[StatusResolver] Error checking ${tournament.name}:`, error.message);
      results.push({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        resolved: false,
        reason: `API error: ${error.message}`
      });
    }
  }

  return results;
}

// Check if Sportradar has leaderboard data for a tournament
// Returns { hasData: boolean, diagnostics: string } for enhanced logging
interface LeaderboardCheckResult {
  hasData: boolean;
  diagnostics: string;
}

async function checkForLiveLeaderboard(
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentName?: string
): Promise<boolean> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  const label = tournamentName || tournamentSrId.slice(0, 8);
  
  // Log the full URL for debugging tour-specific URL construction issues
  console.log(`[StatusResolver] ${label}: Checking URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Log non-200 responses with status code and URL
      console.log(`[StatusResolver] ${label}: API returned ${response.status} — endpoint not available yet (${url})`);
      return false;
    }

    const data = await response.json();
    const leaderboard = data.leaderboard || [];

    // Empty leaderboard array
    if (leaderboard.length === 0) {
      console.log(`[StatusResolver] ${label}: API returned 200, empty leaderboard array — not transitioning`);
      return false;
    }

    // Count entries with position/score/strokes
    let withPosition = 0;
    let withScore = 0;
    let withStrokes = 0;
    
    for (const entry of leaderboard) {
      if (entry.position !== undefined) withPosition++;
      if (entry.score !== undefined) withScore++;
      if (entry.strokes !== undefined) withStrokes++;
    }

    const hasActualData = withPosition > 0 || withScore > 0 || withStrokes > 0;

    if (hasActualData) {
      console.log(`[StatusResolver] ${label}: API returned 200, ${leaderboard.length} entries, ${withPosition} with position, ${withScore} with score, ${withStrokes} with strokes — TRANSITIONING to inprogress`);
    } else {
      // Log sample of what fields ARE present in first entry
      const sampleEntry = leaderboard[0];
      const sampleFields = sampleEntry ? Object.keys(sampleEntry).slice(0, 8).join(', ') : 'none';
      console.log(`[StatusResolver] ${label}: API returned 200, ${leaderboard.length} entries, 0 with position, 0 with score, 0 with strokes — not transitioning. Sample fields: [${sampleFields}]`);
    }

    return hasActualData;
  } catch (error) {
    console.error(`[StatusResolver] ${label}: Error fetching leaderboard (${url}) — ${error.message}`);
    return false;
  }
}

// Fetch helper
async function fetchSportradar(url: string, apiKey: string, description: string) {
  console.log(`[${description}] Calling: ${url}`);
  
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
  
  return await response.json();
}

// Sync leaderboard data and return Sportradar status for lifecycle management
async function syncLeaderboard(
  supabase: any,
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentDbId: string
): Promise<LeaderboardSyncResult> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  const data = await fetchSportradar(url, apiKey, 'Leaderboard');
  
  // Extract Sportradar's tournament status for lifecycle management
  // Sportradar uses 'status' at the tournament level: 'inprogress', 'closed', 'complete', etc.
  const sportradarStatus = data.status || data.tournament?.status;
  
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
      // Derive thru from the latest round's thru field (Sportradar puts thru per-round, not at entry level)
      const rounds = entry.rounds || [];
      const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
      const derivedThru = latestRound?.thru ?? entry.thru ?? null;
      // Status is at entry level for WD/cut, default to 'active' if playing
      const derivedStatus = entry.status || (entry.position != null ? 'active' : null);

      const { error } = await supabase.from('sr_leaderboards').upsert({
        tournament_id: tournamentDbId,
        player_id: player.id,
        position: entry.position,
        position_tied: entry.tied || false,
        score: entry.score,
        strokes: entry.strokes,
        thru: derivedThru,
        round_1: rounds[0]?.strokes,
        round_2: rounds[1]?.strokes,
        round_3: rounds[2]?.strokes,
        round_4: rounds[3]?.strokes,
        money: entry.money,
        points: entry.points,
        status: derivedStatus,
        raw_data: entry,
      }, { onConflict: 'tournament_id,player_id' });
      
      if (!error) records++;
    }
  }

  return { records, sportradarStatus };
}

// Sync hole statistics
async function syncHoleStatistics(
  supabase: any,
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentDbId: string
): Promise<number> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/hole-statistics.json`;
  const data = await fetchSportradar(url, apiKey, 'HoleStats');
  
  let records = 0;
  const rounds = data.rounds || [];

  for (const round of rounds) {
    const courses = round.courses || [];
    for (const course of courses) {
      const holes = course.holes || [];
      for (const hole of holes) {
        const { error } = await supabase.from('sr_hole_statistics').upsert({
          tournament_id: tournamentDbId,
          round_number: round.number,
          course_name: course.name,
          hole_number: hole.number,
          par: hole.par,
          yardage: hole.yardage,
          avg_strokes: hole.statistics?.avg,
          eagles: hole.statistics?.eagles,
          birdies: hole.statistics?.birdies,
          pars: hole.statistics?.pars,
          bogeys: hole.statistics?.bogeys,
          double_bogeys: hole.statistics?.double_bogeys,
          other: hole.statistics?.other,
          raw_data: hole,
        }, { onConflict: 'tournament_id,round_number,hole_number' });
        
        if (!error) records++;
      }
    }
  }

  return records;
}

// Sync tee times
async function syncTeeTimes(
  supabase: any,
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentDbId: string,
  roundNumber: number
): Promise<number> {
  const roundStr = String(roundNumber).padStart(2, '0');
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/rounds/${roundStr}/teetimes.json`;
  const data = await fetchSportradar(url, apiKey, `TeeTimes R${roundNumber}`);
  
  let records = 0;
  const courses = data.round?.courses || [];

  for (const course of courses) {
    const pairings = course.pairings || [];
    for (const pairing of pairings) {
      // Insert tee time group
      const { data: teeTime, error: teeTimeError } = await supabase
        .from('sr_tee_times')
        .upsert({
          tournament_id: tournamentDbId,
          round_number: roundNumber,
          tee_time: pairing.tee_time,
          course_name: course.name,
          starting_hole: pairing.starting_hole,
          raw_data: pairing,
        }, { onConflict: 'tournament_id,round_number,tee_time' })
        .select()
        .single();

      if (!teeTimeError && teeTime) {
        records++;
        
        // Insert players in pairing
        const players = pairing.players || [];
        for (const player of players) {
          const playerSrId = player.id;
          if (!playerSrId) continue;

          let { data: dbPlayer } = await supabase
            .from('sr_players')
            .select('id')
            .eq('sr_id', playerSrId)
            .maybeSingle();

          if (dbPlayer) {
            await supabase.from('sr_tee_time_players').upsert({
              tee_time_id: teeTime.id,
              player_id: dbPlayer.id,
            }, { onConflict: 'tee_time_id,player_id' });
          }
        }
      }
    }
  }

  return records;
}

// Sync scorecards
async function syncScorecards(
  supabase: any,
  apiKey: string,
  tour: string,
  year: number,
  tournamentSrId: string,
  tournamentDbId: string,
  roundNumber: number
): Promise<number> {
  const roundStr = String(roundNumber).padStart(2, '0');
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/rounds/${roundStr}/scores.json`;
  
  let data;
  try {
    data = await fetchSportradar(url, apiKey, `Scorecards R${roundNumber}`);
  } catch (e) {
    // Scores endpoint may not be available
    return 0;
  }
  
  let records = 0;
  const players = data.round?.players || data.players || [];

  for (const playerData of players) {
    const playerSrId = playerData.id || playerData.player?.id;
    if (!playerSrId) continue;

    let { data: dbPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', playerSrId)
      .maybeSingle();

    if (dbPlayer) {
      const scores = playerData.scores || playerData.holes || [];
      for (const score of scores) {
        const { error } = await supabase.from('sr_scorecards').upsert({
          tournament_id: tournamentDbId,
          player_id: dbPlayer.id,
          round_number: roundNumber,
          hole_number: score.number || score.hole,
          strokes: score.strokes,
          to_par: score.to_par,
          raw_data: score,
        }, { onConflict: 'tournament_id,player_id,round_number,hole_number' });
        
        if (!error) records++;
      }
    }
  }

  return records;
}
