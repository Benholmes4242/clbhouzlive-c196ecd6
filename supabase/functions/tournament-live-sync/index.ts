/**
 * tournament-live-sync — Sync ALL in-hours live tournaments per invocation
 *
 * Called by pg_cron every minute. Fetches every inprogress tournament,
 * filters to those within playing hours (5 AM – 9 PM local), and syncs
 * ALL of them in parallel. Gated tournaments get their last_live_sync
 * stamped so the round-robin debt is cleared.
 *
 * With N live tournaments, every in-hours one is synced every minute.
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

interface TournamentSyncResult {
  name: string;
  records: number;
  gated: boolean;
  gateReason?: string;
  transitionedToClosed: boolean;
  roundCompleteTriggered: boolean;
  error?: string;
  durationMs: number;
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
    const statusResolverResults = await resolveToLiveStatus(supabase, sportradarApiKey, today);
    const resolved = statusResolverResults.filter(r => r.resolved).length;
    if (resolved > 0) {
      console.log(`[LiveSync] Status resolver: ${resolved} tournament(s) transitioned to inprogress`);
    }

    // 3. Pre-tournament tee times sync — for tournaments starting within 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const todayStr = today;
    const futureStr = threeDaysFromNow.toISOString().split('T')[0];
    
    const { data: upcomingTournaments } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, season_id, start_date')
      .in('status', ['created', 'scheduled'])
      .lte('start_date', futureStr)
      .gte('start_date', todayStr);

    if (upcomingTournaments?.length) {
      console.log(`[LiveSync] ${upcomingTournaments.length} upcoming tournament(s) within 3 days — syncing tee times`);
      for (const upcoming of upcomingTournaments) {
        const { data: uSeason } = await supabase.from('sr_seasons').select('year, tour_name').eq('id', upcoming.season_id).maybeSingle();
        const uYear = uSeason?.year || new Date().getFullYear();
        const uTourSlug = getTourSlugForTeeTimes(uSeason?.tour_name || 'pga');
        if (!uTourSlug) continue;
        
        try {
          const syncUrl = `${supabaseUrl}/functions/v1/sportradar-sync`;
          await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'tee_times',
              tournamentId: upcoming.sr_id,
              tourId: uTourSlug,
              year: uYear,
            }),
          });
          console.log(`[LiveSync] Pre-tournament tee times synced for ${upcoming.name}`);
        } catch (e) {
          console.warn(`[LiveSync] Pre-tournament tee times failed for ${upcoming.name}: ${e.message}`);
        }
      }

      // ── Auto-regeneration: refresh stale predictions for imminent tournaments ──
      for (const upcoming of upcomingTournaments) {
        try {
          const startDate = new Date(upcoming.start_date);
          const now = new Date();
          const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

          // Only auto-regenerate if tournament starts within 24 hours
          if (hoursUntilStart > 24 || hoursUntilStart < 0) continue;

          // Check if predictions exist and how old they are
          const { data: existingPrediction } = await supabase
            .from('ai_predictions')
            .select('id, generated_at')
            .eq('tournament_id', upcoming.id)
            .maybeSingle();

          if (!existingPrediction) {
            console.log(`[LiveSync] No predictions for ${upcoming.name} (starts in ${Math.round(hoursUntilStart)}h) — triggering generation`);
          } else {
            const generatedAt = new Date(existingPrediction.generated_at);
            const ageHours = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);

            if (ageHours < 48) {
              continue; // Predictions are fresh enough
            }
            console.log(`[LiveSync] Predictions for ${upcoming.name} are ${Math.round(ageHours)}h old (starts in ${Math.round(hoursUntilStart)}h) — triggering regeneration`);
          }

          // Trigger regeneration
          const genUrl = `${supabaseUrl}/functions/v1/generate-predictions`;
          await fetch(genUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              tournamentId: upcoming.id,
              forceRegenerate: true,
            }),
          });
          console.log(`[LiveSync] Auto-regeneration triggered for ${upcoming.name}`);
        } catch (e) {
          console.warn(`[LiveSync] Auto-regeneration failed for ${upcoming.name}: ${e.message}`);
        }
      }
    }

    const { data: liveTournaments, error: queryError } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, status, start_date, end_date, season_id, last_live_sync, timezone')
      .eq('status', 'inprogress')
      .order('last_live_sync', { ascending: true, nullsFirst: true });

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

    console.log(`[LiveSync] Found ${liveTournaments.length} inprogress tournament(s)`);

    // ── Sync all tournaments (gated ones get stamped, not skipped) ────
    const syncResults = await Promise.all(
      liveTournaments.map(tournament => syncTournament(supabase, sportradarApiKey, tournament))
    );

    const totalRecords = syncResults.reduce((sum, r) => sum + r.records, 0);
    const inHoursCount = syncResults.filter(r => !r.gated).length;
    const gatedCount = syncResults.filter(r => r.gated).length;
    const totalDuration = Date.now() - startTime;

    if (syncLogId) {
      await supabase.from('sr_sync_log').update({
        status: 'success', records_synced: totalRecords, completed_at: new Date().toISOString(),
      }).eq('id', syncLogId);
    }

    console.log(`[LiveSync] ✓ Complete: ${inHoursCount} synced, ${gatedCount} gated, ${totalRecords} records in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        tournaments: syncResults.map(r => ({
          name: r.name,
          records: r.records,
          gated: r.gated,
          gateReason: r.gateReason,
          transitionedToClosed: r.transitionedToClosed,
          roundCompleteTriggered: r.roundCompleteTriggered,
          error: r.error,
          durationMs: r.durationMs,
        })),
        summary: { inHoursCount, gatedCount, totalRecords, totalDuration },
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

// ── Per-tournament sync (FIX 1 + FIX 2) ──────────────────────────────
// FIX 1: Gated tournaments stamp last_live_sync so round-robin advances.
// FIX 2: Called for ALL tournaments per invocation, not just the stalest.

async function syncTournament(
  supabase: any,
  sportradarApiKey: string,
  tournament: any
): Promise<TournamentSyncResult> {
  const tStart = Date.now();
  const tournamentTz = tournament.timezone || 'America/New_York';
  const timeCheck = isWithinPlayingHoursForTimezone(tournamentTz);
  const dateCheck = isTournamentDay(tournament.start_date, tournament.end_date, tournamentTz);

  // ── FIX 1: Stamp gated tournaments so round-robin advances ───────
  if (!timeCheck.allowed) {
    console.log(`[LiveSync] Gated: ${tournament.name} — ${timeCheck.reason}`);
    await supabase
      .from('sr_tournaments')
      .update({ last_live_sync: new Date().toISOString() })
      .eq('id', tournament.id);
    return {
      name: tournament.name,
      records: 0,
      gated: true,
      gateReason: timeCheck.reason,
      transitionedToClosed: false,
      roundCompleteTriggered: false,
      durationMs: Date.now() - tStart,
    };
  }

  // Date check is informational only — trust inprogress status over date range
  if (!dateCheck.isActive) {
    console.log(`[LiveSync] Note: ${dateCheck.reason} — but status is inprogress, syncing anyway`);
  }

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
  let currentRound: number | undefined;
  let syncError: string | undefined;

  try {
    const result = await syncLeaderboard(supabase, sportradarApiKey, tour, year, tournament.sr_id, tournament.id);
    leaderboardRecords = result.records;
    sportradarStatus = result.sportradarStatus;
    currentRound = result.currentRound;
  } catch (error) {
    syncError = error.message;
    console.error(`[LiveSync] Leaderboard error for ${tournament.name}:`, error.message);
  }

  // ── Round-completion detection ────────────────────────────────────
  let roundCompleteTriggered = false;
  if (leaderboardRecords > 0) {
    try {
      roundCompleteTriggered = await checkAndTriggerRoundComplete(supabase, tournament.id, tournament.name);
    } catch (err) {
      console.error(`[LiveSync] Round-complete check error:`, err.message);
    }
  }

  // ── Periodic hole stats safety net (every 10th minute) ───────────
  const tourSlug = getTourSlug(seasonData?.tour_name || 'pga');
  const currentMinute = new Date().getMinutes();
  const shouldSyncHoleStats = (currentMinute % 10 === 0);

  if (shouldSyncHoleStats && tourSlug) {
    try {
      console.log(`[LiveSync] Running periodic hole stats sync for ${tournament.name}`);
      const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;
      await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'hole_stats',
          tournamentId: tournament.sr_id,
          tourId: tourSlug,
          year: year,
        }),
      });
      console.log(`[LiveSync] Hole stats refreshed for ${tournament.name}`);
    } catch (e) {
      console.warn(`[LiveSync] Hole stats sync failed for ${tournament.name}: ${e.message}`);
    }
  } else if (shouldSyncHoleStats && !tourSlug) {
    console.log(`[LiveSync] Skipping hole stats for ${tournament.name} — unsupported tour`);
  }

  // ── Periodic tee times sync (every 10th minute, offset by 5) ─────
  const teeTimesTourSlug = getTourSlugForTeeTimes(seasonData?.tour_name || 'pga');
  const shouldSyncTeeTimes = (currentMinute % 10 === 5);

  if (shouldSyncTeeTimes && teeTimesTourSlug) {
    try {
      console.log(`[LiveSync] Syncing tee times for ${tournament.name}`);
      const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;
      await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'tee_times',
          tournamentId: tournament.sr_id,
          tourId: teeTimesTourSlug,
          year: year,
        }),
      });
      console.log(`[LiveSync] Tee times refreshed for ${tournament.name}`);
    } catch (e) {
      console.warn(`[LiveSync] Tee times sync failed for ${tournament.name}: ${e.message}`);
    }
  }

  // ── Periodic scorecards sync (every 5th minute, offset by 1) ──────
  // PGA, DP World, Champions, LPGA, and Korn Ferry tours get hole-by-hole scorecards
  const scorecardTours = ['pga', 'euro', 'champ', 'lpga', 'pgad', 'liv'];
  const shouldSyncScorecards = (currentMinute % 5 === 1) && scorecardTours.includes(tour.toLowerCase());

  if (shouldSyncScorecards) {
    try {
      // Derive active round from leaderboard data: check round columns 4→1
      let activeRound = 1;
      const { data: roundCheck } = await supabase
        .from('sr_leaderboards')
        .select('round_1, round_2, round_3, round_4')
        .eq('tournament_id', tournament.id)
        .not('strokes', 'is', null)
        .limit(5);

      if (roundCheck?.length) {
        for (let r = 4; r >= 1; r--) {
          const key = `round_${r}`;
          if (roundCheck.some((entry: any) => entry[key] !== null && entry[key] !== undefined)) {
            activeRound = r;
            break;
          }
        }
      }

      console.log(`[LiveSync] Triggering scorecards sync for ${tournament.name}, round ${activeRound}`);

      const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;
      await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'scorecards',
          tournamentId: tournament.sr_id,
          round: activeRound,
          year: year,
        }),
      });

      console.log(`[LiveSync] Scorecards sync complete for ${tournament.name}, round ${activeRound}`);
    } catch (e) {
      console.warn(`[LiveSync] Scorecards sync failed for ${tournament.name}: ${e.message}`);
    }
  } else if (currentMinute % 5 === 1 && !scorecardTours.includes(tour)) {
    console.log(`[LiveSync] Skipping scorecards for ${tournament.name} — ${tour} tour not prioritised`);
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
    if (currentRound !== undefined) updatePayload.current_round = currentRound;

    const { error: closeError } = await supabase
      .from('sr_tournaments')
      .update(updatePayload)
      .eq('id', tournament.id);

    if (!closeError) {
      transitionedToClosed = true;
      console.log(`[LiveSync] ✓ Transitioned ${tournament.name} to closed${winnerId ? ` (winner: ${winnerId})` : ''}`);

      // ── Final hole stats sync on tournament close ──────────────
      if (tourSlug) {
        try {
          console.log(`[LiveSync] Running final hole stats sync for ${tournament.name}`);
          const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;
          await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'hole_stats',
              tournamentId: tournament.sr_id,
              tourId: tourSlug,
              year: year,
            }),
          });
          console.log(`[LiveSync] Final hole stats completed for ${tournament.name}`);
        } catch (e) {
          console.warn(`[LiveSync] Final hole stats failed for ${tournament.name}: ${e.message}`);
        }
      }

      // ── Final tee times sync on tournament close ──────────────
      const closeTeeTimesSlug = getTourSlugForTeeTimes(seasonData?.tour_name || 'pga');
      if (closeTeeTimesSlug) {
        try {
          console.log(`[LiveSync] Running final tee times sync for ${tournament.name}`);
          const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;
          await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'tee_times',
              tournamentId: tournament.sr_id,
              tourId: closeTeeTimesSlug,
              year: year,
            }),
          });
          console.log(`[LiveSync] Final tee times completed for ${tournament.name}`);
        } catch (e) {
          console.warn(`[LiveSync] Final tee times failed for ${tournament.name}: ${e.message}`);
        }
      }

      // ── Final all-rounds scorecard sync on tournament close ──────
      if (tourSlug) {
        console.log(`[LiveSync] Running final all-rounds scorecard sync for ${tournament.name}`);
        for (const round of [1, 2, 3, 4]) {
          try {
            console.log(`[LiveSync] Syncing scorecard round ${round} for ${tournament.name}`);
            const syncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/sportradar-sync`;
            await fetch(syncUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'scorecards',
                tournamentId: tournament.sr_id,
                tourId: tourSlug,
                year: year,
                roundNumber: round,
              }),
            });
            console.log(`[LiveSync] Scorecard round ${round} completed for ${tournament.name}`);
          } catch (e) {
            console.warn(`[LiveSync] Scorecard round ${round} failed for ${tournament.name}: ${e.message}`);
          }
          // Small delay between rounds to avoid Sportradar rate limiting
          if (round < 4) await new Promise(r => setTimeout(r, 500));
        }
        console.log(`[LiveSync] Final all-rounds scorecard sync finished for ${tournament.name}`);
      }
    }
  } else {
    // Update last_live_sync timestamp and current_round
    const updatePayload: any = { last_live_sync: new Date().toISOString() };
    if (currentRound !== undefined) {
      updatePayload.current_round = currentRound;
    }
    await supabase
      .from('sr_tournaments')
      .update(updatePayload)
      .eq('id', tournament.id);
  }

  const durationMs = Date.now() - tStart;
  console.log(`[LiveSync] ✓ ${tournament.name}: ${leaderboardRecords} records in ${durationMs}ms${roundCompleteTriggered ? ' [round-complete triggered]' : ''}`);

  return {
    name: tournament.name,
    records: leaderboardRecords,
    gated: false,
    transitionedToClosed,
    roundCompleteTriggered,
    error: syncError,
    durationMs,
  };
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

// Tour slug mapping for hole statistics — returns null for unsupported tours
function getTourSlug(tourName: string): string | null {
  const normalized = (tourName || '').toUpperCase();
  const map: Record<string, string | null> = {
    'PGA': 'pga',
    'LPGA': 'lpga',
    'EURO': 'eur',
    'DP': 'eur',
    'CHAMP': 'champions-tour',
    'PGAD': 'pgad',
    'LIV': null,
    'OLY': null,
    'USGA': null,
  };
  return map[normalized] ?? (normalized.includes('LIV') ? null : 'pga');
}

// Tour slug mapping for tee times — includes LIV (which has tee time data)
function getTourSlugForTeeTimes(tourName: string): string | null {
  const normalized = (tourName || '').toUpperCase();
  const map: Record<string, string | null> = {
    'PGA': 'pga',
    'LPGA': 'lpga',
    'EURO': 'eur',
    'DP': 'eur',
    'CHAMP': 'champions-tour',
    'PGAD': 'pgad',
    'LIV': 'liv',
    'OLY': null,
    'USGA': null,
  };
  return map[normalized] ?? (normalized.includes('LIV') ? 'liv' : 'pga');
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
  const response = await fetch(url, {
    headers: { 'x-api-key': apiKey, 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LiveSync] API error for ${description}: HTTP ${response.status}`);
    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
  }
  return response.json();
}

// ── Leaderboard sync ─────────────────────────────────────────────────

interface LeaderboardSyncResult {
  records: number;
  sportradarStatus?: string;
  currentRound?: number;
}

async function syncLeaderboard(
  supabase: any, apiKey: string, tour: string, year: number,
  tournamentSrId: string, tournamentDbId: string
): Promise<LeaderboardSyncResult> {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  const data = await fetchSportradar(url, apiKey, 'Leaderboard');

  const sportradarStatus = data.status || data.tournament?.status;
  const leaderboard = data.leaderboard || [];

  // Extract current round from Sportradar response
  // Sportradar's leaderboard endpoint returns `round` as zero-indexed (0=R1, 1=R2, etc.)
  const rawRound =
    typeof data.round === 'number' ? data.round :
    typeof data.current_round === 'number' ? data.current_round :
    undefined;
  const currentRound: number | undefined = rawRound !== undefined ? rawRound + 1 : undefined;

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
      const roundsRaw = Array.isArray(entry.rounds) ? entry.rounds : [];
      const rounds = roundsRaw.map((r: any) => ({
        thru: typeof r?.thru === 'number' ? r.thru : parseInt(String(r?.thru ?? ''), 10) || 0,
        strokes: typeof r?.strokes === 'number' ? r.strokes : parseInt(String(r?.strokes ?? ''), 10) || 0,
      }));

      const activeRound = rounds.length > 0
        ? [...rounds].reverse().find((r: any) => r.thru > 0 && r.strokes > 0) || null
        : null;
      const fallbackThru = typeof entry.thru === 'number' ? entry.thru : parseInt(String(entry.thru ?? ''), 10) || 0;
      const derivedThru = activeRound?.thru ?? (fallbackThru > 0 ? fallbackThru : null);
      const derivedStatus = entry.status || (entry.position != null ? 'active' : null);

      if ((entry.player?.last_name || entry.last_name) === 'Smotherman') {
        console.log('[LiveSync Debug] Smotherman rounds:', JSON.stringify(roundsRaw));
        console.log('[LiveSync Debug] Smotherman activeRound:', JSON.stringify(activeRound));
        console.log('[LiveSync Debug] Smotherman derivedThru:', derivedThru);
      }

      const { error } = await supabase.from('sr_leaderboards').upsert({
        tournament_id: tournamentDbId,
        player_id: player.id,
        position: entry.position,
        position_tied: entry.tied || false,
        score: entry.score,
        strokes: entry.strokes,
        thru: derivedThru,
        // Set thru_updated_at when we have a valid thru value
        thru_updated_at: derivedThru !== null && derivedThru > 0 ? new Date().toISOString() : null,
        // Only store round strokes when the round is complete (thru >= 18) and strokes > 0
        round_1: rounds.length > 0 && rounds[0]?.thru >= 18 && rounds[0]?.strokes > 0 ? rounds[0]?.strokes : null,
        round_2: rounds.length > 1 && rounds[1]?.thru >= 18 && rounds[1]?.strokes > 0 ? rounds[1]?.strokes : null,
        round_3: rounds.length > 2 && rounds[2]?.thru >= 18 && rounds[2]?.strokes > 0 ? rounds[2]?.strokes : null,
        round_4: rounds.length > 3 && rounds[3]?.thru >= 18 && rounds[3]?.strokes > 0 ? rounds[3]?.strokes : null,
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

  return { records, sportradarStatus, currentRound };
}
