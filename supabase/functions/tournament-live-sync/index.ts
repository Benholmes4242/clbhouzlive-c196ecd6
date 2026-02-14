/**
 * tournament-live-sync - Round-robin single-tournament sync
 * 
 * Called by pg_cron every minute. Syncs ONE live tournament per invocation,
 * picking the stalest (oldest last_live_sync). Leaderboard-only — secondary
 * data (tee times, hole stats, scorecards) handled by daily-schedule-sync
 * and tournament-round-complete.
 * 
 * Per-tournament timezone gating: Each tournament's IANA timezone (stored in
 * sr_tournaments.timezone) determines the playing hours window (5 AM – 9 PM local).
 * The tournament's start_date/end_date replace the old Mon–Wed day-of-week check.
 * Housekeeping (stale-close, status resolver) runs every invocation regardless.
 * 
 * With N live tournaments, each gets synced every ~N minutes.
 * Supabase Realtime broadcasts DB changes instantly to all connected clients.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { isWithinPlayingHoursForTimezone, isTournamentDay } from '../_shared/countryTimezoneMap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const getAccessLevel = () => Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 'production';
const getTourBaseUrl = (tour: string = 'pga') =>
  `https://api.sportradar.com/golf/${getAccessLevel()}/${tour}/v3/en`;

interface PendingLiveTournament {
  id: string;
  sr_id: string;
  name: string;
  season_id: string;
}

interface StatusResolverResult {
  tournamentId: string;
  tournamentName: string;
  resolved: boolean;
  reason: string;
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

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('sr_sync_log')
      .insert({ sync_type: 'live_auto_sync', tour_id: 'all', status: 'pending' })
      .select()
      .single();
    const syncLogId = syncLog?.id;

    // ── Housekeeping (lightweight, every invocation — no API calls) ───
    const today = new Date().toISOString().split('T')[0];

    // 1. Auto-close stale tournaments whose end_date has passed
    const { data: staleTournaments } = await supabase
      .from('sr_tournaments')
      .update({ status: 'closed' })
      .eq('status', 'inprogress')
      .lt('end_date', today)
      .select('id, name');

    if (staleTournaments?.length) {
      console.log(`[LiveSync] Auto-closed ${staleTournaments.length} stale tournament(s):`,
        staleTournaments.map((t: any) => t.name).join(', '));
    }

    // 2. Status resolver — uses 1 API call per pending tournament
    //    (runs regardless of gating — uses its own lightweight check)
    const statusResolverResults = await resolveToLiveStatus(supabase, sportradarApiKey, today);
    const resolved = statusResolverResults.filter(r => r.resolved).length;
    if (resolved > 0) {
      console.log(`[LiveSync] Status resolver: ${resolved} tournament(s) transitioned to inprogress`);
    }

    // ── Round-robin: pick the ONE stalest live tournament ─────────────
    const { data: liveTournaments, error: queryError } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, status, start_date, end_date, season_id, last_live_sync, timezone')
      .eq('status', 'inprogress')
      .order('last_live_sync', { ascending: true, nullsFirst: true })
      .limit(1);

    if (queryError) {
      throw new Error(`Failed to query live tournaments: ${queryError.message}`);
    }

    // No inprogress tournaments: return early (zero API calls)
    if (!liveTournaments || liveTournaments.length === 0) {
      const msg = 'No live tournaments found';
      console.log(`[LiveSync] ${msg}`);
      if (syncLogId) {
        await supabase.from('sr_sync_log').update({
          status: 'success', records_synced: 0, completed_at: new Date().toISOString(),
          error_message: msg
        }).eq('id', syncLogId);
      }
      return new Response(
        JSON.stringify({ success: true, message: msg, duration: Date.now() - startTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tournament = liveTournaments[0];
    const tournamentTz = tournament.timezone || 'America/New_York';

    // ── Per-tournament time-of-day gate ───────────────────────────────
    const timeCheck = isWithinPlayingHoursForTimezone(tournamentTz);
    const dateCheck = isTournamentDay(tournament.start_date, tournament.end_date, tournamentTz);

    if (!timeCheck.allowed) {
      console.log(`[LiveSync] Skipping ${tournament.name} — ${timeCheck.reason}`);
      if (syncLogId) {
        await supabase.from('sr_sync_log').update({
          status: 'success', records_synced: 0, completed_at: new Date().toISOString(),
          error_message: `Gated: ${timeCheck.reason}`
        }).eq('id', syncLogId);
      }
      return new Response(
        JSON.stringify({
          success: true, message: timeCheck.reason,
          tournament: tournament.name, timezone: tournamentTz,
          gated: true, duration: Date.now() - startTime,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Date check is informational — trust inprogress status over date range
    // (handles rain delays, Monday finishes)
    if (!dateCheck.isActive) {
      console.log(`[LiveSync] Note: ${dateCheck.reason} — but status is inprogress, syncing anyway`);
    }

    console.log(`[LiveSync] Round-robin selected: ${tournament.name} (tz: ${tournamentTz}, last sync: ${tournament.last_live_sync || 'never'})`);

    // Get season info
    const { data: seasonData } = await supabase
      .from('sr_seasons')
      .select('id, year, tour_name')
      .eq('id', tournament.season_id)
      .maybeSingle();

    const year = seasonData?.year || new Date().getFullYear();
    const tour = mapTourName(seasonData?.tour_name || 'pga');

    // ── Sync leaderboard ─────────────────────────────────────────────
    let leaderboardRecords = 0;
    let sportradarStatus: string | undefined;

    try {
      const result = await syncLeaderboard(supabase, sportradarApiKey, tour, year, tournament.sr_id, tournament.id);
      leaderboardRecords = result.records;
      sportradarStatus = result.sportradarStatus;
    } catch (error) {
      console.error(`[LiveSync] Leaderboard error for ${tournament.name}:`, error.message);
    }

    // ── Round-completion detection ───────────────────────────────────
    let roundCompleteTriggered = false;
    if (leaderboardRecords > 0) {
      try {
        roundCompleteTriggered = await checkAndTriggerRoundComplete(supabase, tournament.id, tournament.name);
      } catch (err) {
        console.error(`[LiveSync] Round-complete check error:`, err.message);
      }
    }

    // ── Lifecycle: check if Sportradar reports tournament as closed ───
    let transitionedToClosed = false;
    const closedStatuses = ['closed', 'complete', 'completed', 'official'];

    if (sportradarStatus && closedStatuses.includes(sportradarStatus.toLowerCase())) {
      console.log(`[LiveSync] Sportradar reports ${tournament.name} as '${sportradarStatus}' — transitioning to closed`);

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

      const updatePayload: any = { status: 'closed', last_live_sync: new Date().toISOString() };
      if (winnerId) updatePayload.winner_id = winnerId;

      const { error: closeError } = await supabase
        .from('sr_tournaments')
        .update(updatePayload)
        .eq('id', tournament.id);

      if (!closeError) {
        transitionedToClosed = true;
        console.log(`[LiveSync] ✓ Transitioned ${tournament.name} to closed${winnerId ? ` (winner: ${winnerId})` : ''}`);
      }
    } else {
      // Update last_live_sync timestamp
      await supabase
        .from('sr_tournaments')
        .update({ last_live_sync: new Date().toISOString() })
        .eq('id', tournament.id);
    }

    const totalDuration = Date.now() - startTime;

    if (syncLogId) {
      await supabase.from('sr_sync_log').update({
        status: 'success', records_synced: leaderboardRecords, completed_at: new Date().toISOString(),
      }).eq('id', syncLogId);
    }

    console.log(`[LiveSync] ✓ ${tournament.name}: ${leaderboardRecords} records in ${totalDuration}ms${roundCompleteTriggered ? ' [round-complete triggered]' : ''}`);

    return new Response(
      JSON.stringify({
        success: true,
        tournament: tournament.name,
        timezone: tournamentTz,
        playingHours: timeCheck.reason,
        records: leaderboardRecords,
        duration: totalDuration,
        transitionedToClosed,
        roundCompleteTriggered,
        staleClosed: staleTournaments?.length || 0,
        statusResolved: resolved,
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

// ── Helpers ───────────────────────────────────────────────────────────

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

// ── Status Resolver ──────────────────────────────────────────────────

async function resolveToLiveStatus(
  supabase: any, apiKey: string, today: string
): Promise<StatusResolverResult[]> {
  const results: StatusResolverResult[] = [];

  const { data: pendingLive, error } = await supabase
    .from('sr_tournaments')
    .select('id, sr_id, name, season_id')
    .in('status', ['created', 'scheduled'])
    .lte('start_date', today)
    .gte('end_date', today);

  if (error || !pendingLive?.length) return results;

  const seasonIds = [...new Set(pendingLive.map((t: PendingLiveTournament) => t.season_id).filter(Boolean))];
  const { data: seasons } = await supabase.from('sr_seasons').select('id, year, tour_name').in('id', seasonIds);
  const seasonMap = new Map(seasons?.map((s: any) => [s.id, s]) || []);

  for (const tournament of pendingLive as PendingLiveTournament[]) {
    const season = seasonMap.get(tournament.season_id);
    const year = season?.year || new Date().getFullYear();
    const tour = mapTourName(season?.tour_name || 'pga');

    try {
      const hasLiveData = await checkForLiveLeaderboard(apiKey, tour, year, tournament.sr_id, tournament.name);

      if (hasLiveData) {
        const { error: updateError } = await supabase
          .from('sr_tournaments')
          .update({ status: 'inprogress', last_live_sync: new Date().toISOString() })
          .eq('id', tournament.id);

        results.push({
          tournamentId: tournament.id, tournamentName: tournament.name,
          resolved: !updateError,
          reason: updateError ? `Update failed: ${updateError.message}` : 'Transitioned to inprogress'
        });
      } else {
        results.push({
          tournamentId: tournament.id, tournamentName: tournament.name,
          resolved: false, reason: 'No leaderboard data from Sportradar'
        });
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    } catch (err) {
      results.push({
        tournamentId: tournament.id, tournamentName: tournament.name,
        resolved: false, reason: `API error: ${err.message}`
      });
    }
  }
  return results;
}

async function checkForLiveLeaderboard(
  apiKey: string, tour: string, year: number, tournamentSrId: string, tournamentName?: string
): Promise<boolean> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  const label = tournamentName || tournamentSrId.slice(0, 8);

  try {
    const response = await fetch(url, {
      headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
    });
    if (!response.ok) return false;

    const data = await response.json();
    const leaderboard = data.leaderboard || [];
    if (leaderboard.length === 0) return false;

    let withPosition = 0, withScore = 0, withStrokes = 0;
    for (const entry of leaderboard) {
      if (entry.position !== undefined) withPosition++;
      if (entry.score !== undefined) withScore++;
      if (entry.strokes !== undefined) withStrokes++;
    }

    const hasActualData = withPosition > 0 || withScore > 0 || withStrokes > 0;
    console.log(`[StatusResolver] ${label}: ${leaderboard.length} entries, pos=${withPosition} score=${withScore} strokes=${withStrokes} → ${hasActualData ? 'LIVE' : 'not yet'}`);
    return hasActualData;
  } catch (error) {
    console.error(`[StatusResolver] ${label}: ${error.message}`);
    return false;
  }
}

// ── Sportradar fetch helper ──────────────────────────────────────────

async function fetchSportradar(url: string, apiKey: string, description: string) {
  console.log(`[LiveSync] Fetching URL: ${url}`);
  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LiveSync] API error for ${description}: HTTP ${response.status}, body: ${errorText.substring(0, 300)}`);
    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
  }
  const data = await response.json();
  const bodyStr = JSON.stringify(data);
  console.log(`[LiveSync] API response: ${response.status}, body length: ${bodyStr.length}, keys: ${Object.keys(data).join(',')}`);
  return data;
}

// ── Leaderboard sync ─────────────────────────────────────────────────

interface LeaderboardSyncResult {
  records: number;
  sportradarStatus?: string;
}

async function syncLeaderboard(
  supabase: any, apiKey: string, tour: string, year: number,
  tournamentSrId: string, tournamentDbId: string
): Promise<LeaderboardSyncResult> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  console.log(`[LiveSync] syncLeaderboard → tour=${tour}, year=${year}, sr_id=${tournamentSrId}`);
  const data = await fetchSportradar(url, apiKey, 'Leaderboard');

  const sportradarStatus = data.status || data.tournament?.status;
  const leaderboard = data.leaderboard || [];
  console.log(`[LiveSync] Leaderboard entries: ${leaderboard.length}, sportradar status: ${sportradarStatus}, tournament.name: ${data.tournament?.name || 'N/A'}`);

  if (leaderboard.length === 0) {
    console.warn(`[LiveSync] ⚠ EMPTY leaderboard! Data keys: ${Object.keys(data).join(',')}, tournament keys: ${Object.keys(data.tournament || {}).join(',')}`);
    if (data.tournament) {
      console.log(`[LiveSync] Tournament from API: id=${data.tournament.id}, name=${data.tournament.name}, status=${data.tournament.status}`);
    }
  }

  if (leaderboard[0]) {
    console.log(`[LiveSync] Sample entry: ${JSON.stringify(leaderboard[0]).substring(0, 300)}`);
  }

  let records = 0;

  for (const entry of leaderboard) {
    // Support both nested (entry.player.id) and flat (entry.id) Sportradar formats
    const playerSrId = entry.player?.id || entry.id;
    if (!playerSrId) continue;

    const firstName = entry.player?.first_name || entry.first_name;
    const lastName = entry.player?.last_name || entry.last_name;
    const country = entry.player?.country || entry.country;

    let { data: player } = await supabase
      .from('sr_players').select('id').eq('sr_id', playerSrId).maybeSingle();

    if (!player) {
      const { data: newPlayer } = await supabase.from('sr_players').insert({
        sr_id: playerSrId,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName || ''} ${lastName || ''}`.trim(),
        country: country,
      }).select().single();
      player = newPlayer;
    }

    if (player) {
      const rounds = entry.rounds || [];
      const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
      const derivedThru = latestRound?.thru ?? entry.thru ?? null;
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

      if (error) {
        console.error(`[LiveSync] Upsert error for player ${playerSrId}:`, error.message);
      } else {
        records++;
      }
    }
  }

  return { records, sportradarStatus };
}

// ── Round-completion detection ───────────────────────────────────────

async function checkAndTriggerRoundComplete(
  supabase: any, tournamentId: string, tournamentName: string
): Promise<boolean> {
  const { data: entries } = await supabase
    .from('sr_leaderboards')
    .select('thru, status')
    .eq('tournament_id', tournamentId)
    .not('status', 'in', '("cut","wd","dq","dns")');

  if (!entries || entries.length === 0) return false;

  const finished = entries.filter((e: any) => {
    const thru = String(e.thru || '').toLowerCase();
    return thru === '18' || thru === 'f' || thru === 'f*';
  });

  const ratio = finished.length / entries.length;
  if (ratio < 0.8) return false;

  const { data: roundCheck } = await supabase
    .from('sr_leaderboards')
    .select('round_1, round_2, round_3, round_4')
    .eq('tournament_id', tournamentId)
    .not('status', 'in', '("cut","wd","dq","dns")')
    .limit(5);

  let currentRound = 1;
  if (roundCheck?.length) {
    const sample = roundCheck[0];
    if (sample.round_4 != null) currentRound = 4;
    else if (sample.round_3 != null) currentRound = 3;
    else if (sample.round_2 != null) currentRound = 2;
  }

  const { data: existing } = await supabase
    .from('sr_sync_log')
    .select('id')
    .eq('sync_type', 'round_complete')
    .eq('tournament_id', tournamentId)
    .like('error_message', `%round_${currentRound}%`)
    .limit(1);

  if (existing?.length) return false;

  console.log(`[LiveSync] Round ${currentRound} complete for ${tournamentName} (${finished.length}/${entries.length} finished) — triggering round-complete`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const response = await fetch(`${supabaseUrl}/functions/v1/tournament-round-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ tournamentId, roundNumber: currentRound }),
    });

    await supabase.from('sr_sync_log').insert({
      sync_type: 'round_complete',
      tournament_id: tournamentId,
      status: response.ok ? 'success' : 'error',
      error_message: `round_${currentRound}`,
      records_synced: 0,
    });

    return response.ok;
  } catch (err) {
    console.error(`[LiveSync] Failed to invoke tournament-round-complete:`, err.message);
    return false;
  }
}
