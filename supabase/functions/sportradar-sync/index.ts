import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { resolveTimezone } from '../_shared/countryTimezoneMap.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL Builders - Match Sportradar docs exactly
// Uses SPORTRADAR_ACCESS_LEVEL env var (trial or production) instead of hardcoding
const getAccessLevel = () => Deno.env.get('SPORTRADAR_ACCESS_LEVEL') || 'production';

// Base for tour-scoped endpoints: /golf/{access_level}/{tour}/v3/{lang}
const getTourBaseUrl = (tour: string = 'pga') => `https://api.sportradar.com/golf/${getAccessLevel()}/${tour}/v3/en`;

// Base for global endpoints (no tour): /golf/{access_level}/v3/{lang}
const getGlobalBaseUrl = () => `https://api.sportradar.com/golf/${getAccessLevel()}/v3/en`;

// Normalise incoming tourId values to Sportradar URL slugs
// Handles both internal codes (eur, champions-tour) and already-correct slugs (euro, champ)
const normaliseTourSlug = (tour: string): string => {
  const map: Record<string, string> = {
    'eur': 'euro',
    'champions-tour': 'champ',
    'euro': 'euro',
    'champ': 'champ',
    'pga': 'pga',
    'lpga': 'lpga',
    'pgad': 'pgad',
    'liv': 'liv',
  };
  return map[tour.toLowerCase()] ?? tour.toLowerCase();
};

// Comprehensive tour name → Sportradar API slug mapping
// Returns null for tours where Sportradar doesn't provide hole statistics
function getTourSlug(tourName: string): string | null {
  const normalized = (tourName || '').toUpperCase();
  const map: Record<string, string | null> = {
    'PGA': 'pga',
    'LPGA': 'lpga',
    'EURO': 'euro',
    'DP': 'euro',
    'CHAMP': 'champ',
    'PGAD': 'pgad',
    'LIV': null,    // Sportradar does not provide hole stats for LIV
    'OLY': null,    // Olympics — no hole stats endpoint
    'USGA': null,   // USGA — no standard hole stats endpoint
  };
  return map[normalized] ?? (normalized.includes('LIV') ? null : 'pga');
}

// Tour slug mapping for tee times — includes LIV (which has tee time data)
function getTourSlugForTeeTimes(tourName: string): string | null {
  const normalized = (tourName || '').toUpperCase();
  const map: Record<string, string | null> = {
    'PGA': 'pga',
    'LPGA': 'lpga',
    'EURO': 'euro',
    'DP': 'euro',
    'CHAMP': 'champ',
    'PGAD': 'pgad',
    'LIV': 'liv',     // LIV DOES have tee times
    'OLY': null,
    'USGA': null,
  };
  return map[normalized] ?? (normalized.includes('LIV') ? 'liv' : 'pga');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    const { 
      action, 
      tourId, 
      year, 
      tournamentId, 
      playerId,
      seasonYear,
      roundType,
      roundNumber
    } = await req.json();

    const effectiveYear = year || seasonYear || 2026;
    const effectiveTour = normaliseTourSlug(tourId || 'pga');
    
    // Validate roundType - use 'rounds' for REST API path (not 'stroke')
    let effectiveRoundType = 'rounds';
    if (roundType === 'playoff') {
      effectiveRoundType = 'playoff';
    }
    
    console.log(`Sportradar sync: action=${action}, tour=${effectiveTour}, year=${effectiveYear}, tournamentId=${tournamentId}, accessLevel=${getAccessLevel()}`);

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('sr_sync_log')
      .insert({ 
        sync_type: action || 'schedule', 
        tour_id: effectiveTour, 
        status: 'pending',
        tournament_id: tournamentId || null
      })
      .select()
      .single();

    const syncLogId = syncLog?.id;

    try {
      let result: { records: number; message: string; debug?: any };

      switch (action) {
        case 'schedule':
          result = await syncSchedule(supabase, sportradarApiKey, effectiveTour, effectiveYear);
          break;
        case 'players':
          result = await syncPlayers(supabase, sportradarApiKey, effectiveTour, effectiveYear);
          break;
        case 'rankings':
          result = await syncWorldRankings(supabase, sportradarApiKey, effectiveYear);
          break;
        case 'leaderboard':
          result = await syncLeaderboard(supabase, sportradarApiKey, effectiveTour, effectiveYear, tournamentId);
          break;
        case 'summary':
          result = await syncTournamentSummary(supabase, sportradarApiKey, effectiveTour, effectiveYear, tournamentId);
          break;
        case 'scorecards':
          result = await syncScorecards(supabase, sportradarApiKey, effectiveTour, effectiveYear, tournamentId, effectiveRoundType, roundNumber);
          break;
        case 'tee_times':
          result = await syncTeeTimes(supabase, sportradarApiKey, effectiveTour, effectiveYear, tournamentId, effectiveRoundType, roundNumber);
          break;
        case 'hole_stats':
          result = await syncHoleStatistics(supabase, sportradarApiKey, effectiveTour, effectiveYear, tournamentId);
          break;
        case 'player_profile':
          result = await syncPlayerProfile(supabase, sportradarApiKey, playerId);
          break;
        case 'player_stats':
          result = await syncPlayerStatistics(supabase, sportradarApiKey, effectiveTour, effectiveYear);
          // Bridge: also update tour_season_rankings from the freshly-synced stats
          if (result.records > 0) {
            const bridgeResult = await syncTourSeasonRankings(supabase, effectiveTour, effectiveYear);
            console.log(`[Bridge] Updated ${bridgeResult.records} tour_season_rankings rows for ${effectiveTour}`);
          }
          break;
        case 'seasons':
          result = await syncSeasons(supabase, sportradarApiKey);
          break;
        case 'backfill_hole_stats':
          result = await backfillHoleStatistics(supabase, sportradarApiKey);
          break;
        case 'backfill_tee_times':
          result = await backfillTeeTimes(supabase, sportradarApiKey);
          break;
        default:
          result = await syncSchedule(supabase, sportradarApiKey, effectiveTour, effectiveYear);
      }

      // Update sync log with success
      if (syncLogId) {
        await supabase
          .from('sr_sync_log')
          .update({
            status: 'success',
            records_synced: result.records,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
      }

      return new Response(
        JSON.stringify({ success: true, message: result.message, records_synced: result.records, debug: result.debug }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Sync error:', error);
      if (syncLogId) {
        await supabase
          .from('sr_sync_log')
          .update({ status: 'error', error_message: error.message, completed_at: new Date().toISOString() })
          .eq('id', syncLogId);
      }
      throw error;
    }

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to fetch from Sportradar with detailed logging
async function fetchSportradar(url: string, apiKey: string, description: string) {
  console.log(`[${description}] Calling: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': apiKey,
      'Accept': 'application/json'
    }
  });
  const statusCode = response.status;
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[${description}] HTTP ${statusCode}: ${errorText.substring(0, 500)}`);
    throw new Error(`Sportradar API error: ${statusCode} - ${errorText.substring(0, 200)}`);
  }
  
  const data = await response.json();
  console.log(`[${description}] HTTP ${statusCode} - Success`);
  return data;
}

// ============================================================================
// SCHEDULE - Tour-scoped: /{year}/tournaments/schedule.json
// Captures all new fields: points, winning_share, event_type, scoring_system, etc.
// ============================================================================
async function syncSchedule(supabase: any, apiKey: string, tour: string, year: number) {
  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/schedule.json`;
  const data = await fetchSportradar(url, apiKey, 'Schedule');
  const seasons = data.seasons || [data];
  let totalRecords = 0;

  for (const season of seasons) {
    const seasonSrId = season.id || `${tour}-${year}`;
    const { data: existingSeason } = await supabase
      .from('sr_seasons')
      .select('id')
      .eq('sr_id', seasonSrId)
      .maybeSingle();

    let seasonDbId: string;
    if (existingSeason) {
      seasonDbId = existingSeason.id;
      await supabase.from('sr_seasons').update({
        tour_id: season.tour?.id || tour,
        tour_name: season.tour?.alias || tour,
        tour_full_name: season.tour?.name,
        year: season.year || year,
        name: season.name || `${year} Season`,
        status: season.status,
        start_date: season.start_date,
        end_date: season.end_date,
      }).eq('id', seasonDbId);
    } else {
      const { data: newSeason, error } = await supabase.from('sr_seasons').insert({
        sr_id: seasonSrId,
        tour_id: season.tour?.id || tour,
        tour_name: season.tour?.alias || tour,
        tour_full_name: season.tour?.name,
        year: season.year || year,
        name: season.name || `${year} Season`,
        status: season.status,
        start_date: season.start_date,
        end_date: season.end_date,
      }).select().single();
      if (error) continue;
      seasonDbId = newSeason.id;
    }

    const tournaments = season.tournaments || data.tournaments || [];
    for (const tournament of tournaments) {
      const venue = tournament.venue;
      const course = venue?.courses?.[0];
      const winner = tournament.winner;
      const defendingChamp = tournament.defending_champ;
      
      const { error } = await supabase.from('sr_tournaments').upsert({
        sr_id: tournament.id,
        season_id: seasonDbId,
        name: tournament.name,
        status: tournament.status,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        purse: tournament.purse ? parseFloat(tournament.purse) : null,
        currency: tournament.currency,
        points_type: tournament.points_type,
        // New fields
        points: tournament.points,
        winning_share: tournament.winning_share,
        parent_id: tournament.parent_id,
        event_type: tournament.event_type,
        scoring_system: tournament.scoring_system,
        network: tournament.network,
        coverage: tournament.coverage,
        course_timezone: tournament.course_timezone,
        cut_round: tournament.cut_round,
        cutline: tournament.cutline,
        projected_cutline: tournament.projected_cutline,
        // Venue fields
        venue_id: venue?.id,
        venue_name: venue?.name,
        venue_city: venue?.city,
        venue_state: venue?.state,
        venue_country: venue?.country,
        venue_zipcode: venue?.zipcode,
        venue_latitude: venue?.latitude,
        venue_longitude: venue?.longitude,
        // Course fields
        venue_course_name: course?.name,
        venue_par: course?.par,
        venue_yardage: course?.yardage,
        // Winner/Defender
        defending_champion: defendingChamp 
          ? `${defendingChamp.first_name || ''} ${defendingChamp.last_name || ''}`.trim()
          : null,
        winner_id: winner?.id,
        timezone: tournament.course_timezone || resolveTimezone(venue?.country, venue?.state),
        raw_data: tournament,
      }, { onConflict: 'sr_id' });
      if (!error) totalRecords++;

      // Sync course holes if available
      if (course?.holes) {
        const courseId = course.id || `${tournament.id}-${course.name}`;
        await supabase.from('sr_courses').upsert({
          sr_id: courseId,
          name: course.name,
          city: venue?.city,
          state: venue?.state,
          country: venue?.country,
          par: course.par,
          yardage: course.yardage,
          holes: course.holes?.length || 18,
          latitude: venue?.latitude,
          longitude: venue?.longitude,
          raw_data: course,
        }, { onConflict: 'sr_id' });

        const { data: courseDb } = await supabase
          .from('sr_courses')
          .select('id')
          .eq('sr_id', courseId)
          .maybeSingle();

        if (courseDb) {
          for (const hole of course.holes) {
            await supabase.from('sr_course_holes').upsert({
              course_id: courseDb.id,
              hole_number: hole.number,
              par: hole.par,
              yardage: hole.yardage,
              raw_data: hole,
            }, { onConflict: 'course_id,hole_number' });
          }
        }
      }
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} tournaments` };
}

// ============================================================================
// PLAYERS - Tour-scoped: /{year}/players/profiles.json
// Captures new fields: abbr_name, handedness, gender, is_amateur, is_member
// ============================================================================
async function syncPlayers(supabase: any, apiKey: string, tour: string, year: number) {
  // Map Sportradar API tour slugs to our internal tour_codes
  const tourCodeMap: Record<string, string> = {
    pga: 'pga', eur: 'EURO', lpga: 'LPGA', pgad: 'PGAD',
    liv: 'LIV', 'champions-tour': 'CHAMP',
  };
  const currentTourCode = tourCodeMap[tour.toLowerCase()] || tour;

  // Sportradar URL slugs may differ from the tourId we receive
  const tourUrlSlugMap: Record<string, string> = {
    pga: 'pga', eur: 'euro', lpga: 'lpga', pgad: 'pgad',
    liv: 'liv', 'champions-tour': 'champ',
  };
  const urlSlug = tourUrlSlugMap[tour.toLowerCase()] || tour.toLowerCase();

  const url = `${getTourBaseUrl(urlSlug)}/${year}/players/profiles.json`;

  let data: any;
  try {
    data = await fetchSportradar(url, apiKey, 'Players');
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('not found')) {
      console.warn(`[syncPlayers] No players endpoint for tour '${tour}' (${url}) — skipping`);
      return { records: 0, message: `Tour '${tour}' has no players endpoint — skipped` };
    }
    throw err;
  }

  const players = data?.players || [];
  let totalRecords = 0;

  for (const player of players) {
    // Fetch existing tour_codes so we can merge (not overwrite)
    const { data: existing } = await supabase
      .from('sr_players')
      .select('tour_codes')
      .eq('sr_id', player.id)
      .maybeSingle();

    const existingCodes: string[] = existing?.tour_codes || [];
    const mergedCodes = Array.from(new Set([...existingCodes, currentTourCode]));

    const { error } = await supabase.from('sr_players').upsert({
      sr_id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
      abbr_name: player.abbr_name,
      height: player.height,
      weight: player.weight,
      birth_date: player.birthday || player.birth_date,
      birth_place: player.birth_place,
      residence: player.residence,
      college: player.college,
      turned_pro: player.turned_pro,
      country: player.country,
      country_code: player.country_code,
      handedness: player.handedness,
      gender: player.gender,
      is_amateur: player.amateur || false,
      is_member: player.member || false,
      tour_codes: mergedCodes,
      raw_data: player,
    }, { onConflict: 'sr_id' });
    if (!error) totalRecords++;
  }

  return { records: totalRecords, message: `Synced ${totalRecords} ${currentTourCode} players, tour_codes merged` };
}

// ============================================================================
// SEASONS - Global (no tour): /golf/{access_level}/v3/{lang}/seasons.json
// ============================================================================
async function syncSeasons(supabase: any, apiKey: string) {
  const url = `${getGlobalBaseUrl()}/seasons.json`;
  const data = await fetchSportradar(url, apiKey, 'Seasons');
  
  // The API returns tours with seasons nested inside
  const tours = data.tours || [];
  let totalRecords = 0;

  for (const tour of tours) {
    const seasons = tour.seasons || [];
    for (const season of seasons) {
      const { error } = await supabase.from('sr_seasons').upsert({
        sr_id: season.id,
        tour_id: tour.id,
        tour_name: tour.alias,
        tour_full_name: tour.name,
        year: season.year,
        name: season.name || `${season.year} ${tour.name}`,
        status: season.status,
        start_date: season.start_date,
        end_date: season.end_date,
      }, { onConflict: 'sr_id' });
      if (!error) totalRecords++;
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} seasons`,
    debug: { url, toursFound: tours.length }
  };
}

// ============================================================================
// WORLD RANKINGS (OWGR) - Global: /players/wgr/{year}/rankings.json
// Per docs: GET https://api.sportradar.com/golf/production/v3/en/players/wgr/2025/rankings.json
// Captures new fields: prior_rank, tied, avg_points, ranking_id, ranking_status
// ============================================================================
async function syncWorldRankings(supabase: any, apiKey: string, year: number) {
  // Per API docs: /golf/{access_level}/v3/{lang}/players/wgr/{year}/rankings.json
  const url = `${getGlobalBaseUrl()}/players/wgr/${year}/rankings.json`;
  
  let data: any = null;
  try {
    data = await fetchSportradar(url, apiKey, 'World Rankings');
  } catch (e) {
    console.log(`World rankings endpoint failed: ${e.message}`);
    return { 
      records: 0, 
      message: `World rankings not available: ${e.message}`,
      debug: { url, error: e.message }
    };
  }
  
  // Extract ranking metadata and players
  const ranking = data.rankings?.[0] || data.ranking || {};
  const players = ranking.players || data.players || [];
  let totalRecords = 0;
  const rankingDate = new Date().toISOString().split('T')[0];

  console.log(`[World Rankings] Found ${players.length} players in response`);

  for (const playerData of players) {
    // Handle both nested player object and flat structure
    const player = playerData.player || playerData;
    const playerSrId = player.id;
    
    if (!playerSrId) continue;

    // Find or create player
    const { data: existingPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', playerSrId)
      .maybeSingle();

    let playerId: string | null = existingPlayer?.id;

    if (!playerId) {
      const { data: newPlayer } = await supabase.from('sr_players').insert({
        sr_id: playerSrId,
        first_name: player.first_name,
        last_name: player.last_name,
        full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        abbr_name: player.abbr_name,
        country: player.country,
        raw_data: player,
      }).select().single();
      playerId = newPlayer?.id;
    }

    if (playerId) {
      const { error } = await supabase.from('sr_world_rankings').upsert({
        player_id: playerId,
        rank: playerData.rank || player.rank,
        prior_rank: playerData.prior_rank || player.prior_rank,
        tied: playerData.tied || player.tied || false,
        points: playerData.statistics?.points ?? playerData.points ?? player.points ?? null,
        avg_points: playerData.statistics?.avg_points ?? playerData.avg_points ?? player.avg_points ?? null,
        points_lost: playerData.statistics?.points_lost ?? playerData.points_lost ?? player.points_lost ?? null,
        points_gained: playerData.statistics?.points_gained ?? playerData.points_gained ?? player.points_gained ?? null,
        events_played: playerData.statistics?.events_played ?? playerData.events_played ?? playerData.events ?? player.events_played ?? null,
        ranking_id: ranking.id,
        ranking_status: ranking.status,
        ranking_date: rankingDate,
        raw_data: playerData,
      }, { onConflict: 'player_id,ranking_date' });
      if (!error) totalRecords++;
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} rankings`,
    debug: { url, playersInResponse: players.length }
  };
}

// ============================================================================
// LEADERBOARD - Tour-scoped: /{year}/tournaments/{tournament_id}/leaderboard.json
// Captures new fields: starting_score, wins, losses
// ============================================================================
async function syncLeaderboard(supabase: any, apiKey: string, tour: string, year: number, tournamentSrId: string) {
  if (!tournamentSrId) {
    return { records: 0, message: 'Tournament ID required', debug: { error: 'missing_tournament_id' } };
  }

  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/leaderboard.json`;
  
  let data: any;
  try {
    data = await fetchSportradar(url, apiKey, 'Leaderboard');
  } catch (e) {
    return { 
      records: 0, 
      message: `Leaderboard not available: ${e.message}`,
      debug: { url, error: e.message }
    };
  }

  const leaderboard = data.leaderboard || [];
  let totalRecords = 0;

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) {
    return { records: 0, message: 'Tournament not found in database', debug: { tournamentSrId } };
  }

  // Update tournament cut info if available
  if (data.cutline !== undefined || data.projected_cutline !== undefined) {
    await supabase.from('sr_tournaments').update({
      cutline: data.cutline,
      projected_cutline: data.projected_cutline,
      cut_round: data.cut_round,
    }).eq('sr_id', tournamentSrId);
  }

  for (const entry of leaderboard) {
    const player = entry.player || entry;
    const playerSrId = player.id || entry.id;
    
    if (!playerSrId) continue;

    let playerId: string | null = null;
    const { data: existingPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', playerSrId)
      .maybeSingle();

    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else {
      const { data: newPlayer } = await supabase.from('sr_players').insert({
        sr_id: playerSrId,
        first_name: player.first_name,
        last_name: player.last_name,
        full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
        abbr_name: player.abbr_name,
        country: player.country,
        raw_data: player,
      }).select().single();
      playerId = newPlayer?.id;
    }

    if (playerId) {
      const rounds = entry.rounds || [];
      // Derive thru from the latest round's thru field (Sportradar puts thru per-round, not at entry level)
      const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
      const derivedThru = latestRound?.thru ?? entry.thru ?? null;
      // Status is at entry level for WD/cut, default to 'active' if playing
      const derivedStatus = entry.status || (entry.position != null ? 'active' : null);

      const { error } = await supabase.from('sr_leaderboards').upsert({
        tournament_id: tournament.id,
        player_id: playerId,
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
        // New fields
        starting_score: entry.starting_score,
        wins: entry.wins,
        losses: entry.losses,
        raw_data: entry,
      }, { onConflict: 'tournament_id,player_id' });
      if (!error) totalRecords++;
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} leaderboard entries`,
    debug: { url }
  };
}

// ============================================================================
// SUMMARY - Tour-scoped: /{year}/tournaments/{tournament_id}/summary.json
// Captures weather, broadcast, and field data
// ============================================================================
async function syncTournamentSummary(supabase: any, apiKey: string, tour: string, year: number, tournamentSrId: string) {
  if (!tournamentSrId) {
    return { records: 0, message: 'Tournament ID required', debug: { error: 'missing_tournament_id' } };
  }

  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/summary.json`;
  
  let data: any;
  try {
    data = await fetchSportradar(url, apiKey, 'Summary');
  } catch (e) {
    return { 
      records: 0, 
      message: `Summary not available: ${e.message}`,
      debug: { url, error: e.message }
    };
  }

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) {
    return { records: 0, message: 'Tournament not found in database', debug: { tournamentSrId } };
  }

  // Extract weather and broadcast from first round
  const firstRound = data.rounds?.[0] || {};
  const weather = firstRound.weather || {};
  const broadcast = firstRound.broadcast || {};

  const { error } = await supabase.from('sr_tournament_summaries').upsert({
    tournament_id: tournament.id,
    field_size: data.field?.length || data.participants?.length,
    cut_score: data.cut_score || data.cutline,
    weather_conditions: weather.condition,
    temperature: weather.temp,
    wind_speed: weather.wind?.speed,
    wind_direction: weather.wind?.direction,
    broadcast_network: broadcast.network,
    broadcast_cable: broadcast.cable,
    broadcast_internet: broadcast.internet,
    course_conditions: data.course_conditions,
    raw_data: data,
  }, { onConflict: 'tournament_id' });

  // Also sync course info if available
  if (data.venue?.courses) {
    for (const course of data.venue.courses) {
      const courseId = course.id || `${tournamentSrId}-${course.name}`;
      await supabase.from('sr_courses').upsert({
        sr_id: courseId,
        name: course.name,
        city: data.venue.city,
        state: data.venue.state,
        country: data.venue.country,
        country_code: data.venue.country_code,
        latitude: course.latitude || data.venue.latitude,
        longitude: course.longitude || data.venue.longitude,
        par: course.par,
        yardage: course.yardage,
        holes: course.holes?.length || 18,
        raw_data: course,
      }, { onConflict: 'sr_id' });

      if (course.holes) {
        const { data: courseDb } = await supabase
          .from('sr_courses')
          .select('id')
          .eq('sr_id', courseId)
          .maybeSingle();

        if (courseDb) {
          for (const hole of course.holes) {
            await supabase.from('sr_course_holes').upsert({
              course_id: courseDb.id,
              hole_number: hole.number,
              par: hole.par,
              yardage: hole.yardage,
              description: hole.description,
              raw_data: hole,
            }, { onConflict: 'course_id,hole_number' });
          }
        }
      }
    }
  }

  return { 
    records: error ? 0 : 1, 
    message: `Synced tournament summary`,
    debug: { url }
  };
}

// ============================================================================
// SCORECARDS - Tour-scoped: /{year}/tournaments/{id}/rounds/{round_number}/scores.json
// Per docs uses "rounds" not "stroke" in URL path
// ============================================================================
async function syncScorecards(
  supabase: any, 
  apiKey: string, 
  tour: string,
  year: number,
  tournamentSrId: string, 
  roundType: string = 'rounds',
  roundNumber?: number
) {
  if (!tournamentSrId) {
    return { records: 0, message: 'Tournament ID required', debug: { error: 'missing_tournament_id' } };
  }

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) {
    return { records: 0, message: 'Tournament not found in database', debug: { tournamentSrId } };
  }

  let totalRecords = 0;
  const roundsToFetch = roundNumber ? [roundNumber] : [1, 2, 3, 4];
  const debugInfo: any[] = [];

  for (const round of roundsToFetch) {
    // Per docs: /{year}/tournaments/{id}/rounds/{round_number}/scores.json
    const roundPadded = String(round).padStart(2, '0');
    const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/${roundType}/${roundPadded}/scores.json`;
    
    try {
      const data = await fetchSportradar(url, apiKey, `Scorecards R${round}`);
      debugInfo.push({ round, url, status: 'success' });

      const players = data.players || data.round?.players || [];
      for (const playerEntry of players) {
        const player = playerEntry.player || playerEntry;
        const playerSrId = player.id;
        
        if (!playerSrId) continue;

        let playerId: string | null = null;
        const { data: existingPlayer } = await supabase
          .from('sr_players')
          .select('id')
          .eq('sr_id', playerSrId)
          .maybeSingle();

        if (existingPlayer) {
          playerId = existingPlayer.id;
        } else {
          const { data: newPlayer } = await supabase.from('sr_players').insert({
            sr_id: playerSrId,
            first_name: player.first_name,
            last_name: player.last_name,
            full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            raw_data: player,
          }).select().single();
          playerId = newPlayer?.id;
        }

        // Store hole-by-hole scores
        const holes = playerEntry.scores || playerEntry.holes || [];
        if (playerId && holes.length > 0) {
          for (const hole of holes) {
            const { error } = await supabase.from('sr_scorecards').upsert({
              tournament_id: tournament.id,
              player_id: playerId,
              round_number: round,
              hole_number: hole.number,
              strokes: hole.strokes,
              par: hole.par,
              score_to_par: (hole.strokes || 0) - (hole.par || 0),
              raw_data: hole,
            }, { onConflict: 'tournament_id,player_id,round_number,hole_number' });
            if (!error) totalRecords++;
          }
        }

        // Also store round-level aggregates if available
        // Sportradar v3 may nest stats at top level OR under .statistics
        const stats = playerEntry.statistics || {};
        const hasRoundData = (
          playerEntry.score !== undefined || playerEntry.strokes !== undefined ||
          playerEntry.birdies !== undefined || stats.birdies !== undefined
        );
        if (playerId && hasRoundData) {
          const roundUpdate: Record<string, any> = {
            round_score:   playerEntry.score       ?? stats.score       ?? null,
            round_strokes: playerEntry.strokes     ?? stats.strokes     ?? null,
            thru:          playerEntry.thru         ?? stats.thru        ?? null,
            birdies:       playerEntry.birdies      ?? stats.birdies     ?? null,
            bogeys:        playerEntry.bogeys       ?? stats.bogeys      ?? null,
            eagles:        playerEntry.eagles        ?? stats.eagles      ?? null,
            pars:          playerEntry.pars          ?? stats.pars        ?? null,
            double_bogeys: playerEntry.double_bogeys ?? stats.double_bogeys ?? null,
            holes_in_one:  playerEntry.holes_in_one  ?? stats.holes_in_one  ?? null,
            other_scores:  playerEntry.other_scores  ?? stats.other_scores  ?? null,
            starting_hole: playerEntry.starting_hole ?? stats.starting_hole ?? null,
          };
          console.log(`[Scorecards] Round ${round} stats for ${player.first_name} ${player.last_name}: birdies=${roundUpdate.birdies}, eagles=${roundUpdate.eagles}, score=${roundUpdate.round_score}`);
          await supabase.from('sr_scorecards')
            .update(roundUpdate)
            .eq('tournament_id', tournament.id)
            .eq('player_id', playerId)
            .eq('round_number', round)
            .eq('hole_number', 1);
        }
      }
    } catch (e) {
      debugInfo.push({ round, url, status: 'error', error: e.message });
      console.log(`Round ${round} scorecards not available: ${e.message}`);
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} scorecard entries`,
    debug: { rounds: debugInfo }
  };
}

// ============================================================================
// TEE TIMES - Tour-scoped: /{year}/tournaments/{id}/rounds/{round_number}/teetimes.json
// Captures new fields: pairing_id, back_nine
// ============================================================================
async function syncTeeTimes(
  supabase: any, 
  apiKey: string, 
  tour: string,
  year: number,
  tournamentSrId: string,
  roundType: string = 'rounds',
  roundNumber?: number
) {
  if (!tournamentSrId) {
    return { records: 0, message: 'Tournament ID required', debug: { error: 'missing_tournament_id' } };
  }

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) {
    return { records: 0, message: 'Tournament not found in database', debug: { tournamentSrId } };
  }

  let totalRecords = 0;
  const roundsToFetch = roundNumber ? [roundNumber] : [1, 2, 3, 4];
  const debugInfo: any[] = [];

  for (const round of roundsToFetch) {
    const roundPadded = String(round).padStart(2, '0');
    const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/${roundType}/${roundPadded}/teetimes.json`;
    
    try {
      const data = await fetchSportradar(url, apiKey, `TeeTimes R${round}`);
      
      // Debug: Log response structure
      const topKeys = Object.keys(data);
      console.log(`[TeeTimes R${round}] Response keys: ${topKeys.join(', ')}`);
      if (data.round) console.log(`[TeeTimes R${round}] data.round keys: ${Object.keys(data.round).join(', ')}`);
      if (data.round?.courses) console.log(`[TeeTimes R${round}] data.round.courses has ${data.round.courses.length} courses`);
      
      // Try multiple extraction paths based on API structure
      // Based on logs: data.round.courses[].pairings[] is the correct path
      let pairings: any[] = [];
      
      // Primary path: data.round.courses[0].pairings (American Express has multiple courses)
      if (data.round?.courses && Array.isArray(data.round.courses)) {
        // Collect pairings from ALL courses (multi-course tournaments)
        for (const course of data.round.courses) {
          if (course.pairings && Array.isArray(course.pairings)) {
            pairings = pairings.concat(course.pairings);
          }
        }
        console.log(`[TeeTimes R${round}] Found ${pairings.length} pairings across ${data.round.courses.length} courses`);
      } else if (data.round?.pairings && Array.isArray(data.round.pairings)) {
        pairings = data.round.pairings;
        console.log(`[TeeTimes R${round}] Found ${pairings.length} pairings in data.round.pairings`);
      } else if (data.course?.pairings && Array.isArray(data.course.pairings)) {
        pairings = data.course.pairings;
        console.log(`[TeeTimes R${round}] Found ${pairings.length} pairings in data.course.pairings`);
      } else if (data.courses && Array.isArray(data.courses)) {
        for (const course of data.courses) {
          if (course.pairings && Array.isArray(course.pairings)) {
            pairings = pairings.concat(course.pairings);
          }
        }
        console.log(`[TeeTimes R${round}] Found ${pairings.length} pairings in data.courses`);
      } else if (data.pairings && Array.isArray(data.pairings)) {
        pairings = data.pairings;
        console.log(`[TeeTimes R${round}] Found ${pairings.length} pairings in data.pairings`);
      } else {
        console.log(`[TeeTimes R${round}] Could not find pairings. Sample data: ${JSON.stringify(data).substring(0, 500)}`);
      }
      
      debugInfo.push({ round, url, status: 'success', pairingsFound: pairings.length, topKeys });

      for (const pairing of pairings) {
        const { data: teeTime, error: teeError } = await supabase.from('sr_tee_times').upsert({
          tournament_id: tournament.id,
          round_number: round,
          tee_time: pairing.tee_time,
          tee_number: pairing.tee_number || pairing.hole || 1,
          pairing_id: pairing.id,
          back_nine: pairing.back_nine || pairing.starting_hole === 10 || false,
          raw_data: pairing,
        }, { onConflict: 'tournament_id,round_number,pairing_id' }).select().single();

        if (!teeError && teeTime && pairing.players) {
          for (let i = 0; i < pairing.players.length; i++) {
            const playerEntry = pairing.players[i];
            const player = playerEntry.player || playerEntry;
            const playerSrId = player.id;
            
            if (!playerSrId) continue;

            const { data: existingPlayer } = await supabase
              .from('sr_players')
              .select('id')
              .eq('sr_id', playerSrId)
              .maybeSingle();

            let playerId = existingPlayer?.id;
            if (!playerId) {
              const { data: newPlayer } = await supabase.from('sr_players').insert({
                sr_id: playerSrId,
                first_name: player.first_name,
                last_name: player.last_name,
                full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
                raw_data: player,
              }).select().single();
              playerId = newPlayer?.id;
            }

            if (playerId) {
              await supabase.from('sr_tee_time_players').upsert({
                tee_time_id: teeTime.id,
                player_id: playerId,
                position: i + 1,
              }, { onConflict: 'tee_time_id,player_id' });
            }
          }
          totalRecords++;
        }
      }
    } catch (e) {
      debugInfo.push({ round, url, status: 'error', error: e.message });
      console.log(`Round ${round} tee times not available: ${e.message}`);
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} tee time groups`,
    debug: { rounds: debugInfo }
  };
}

// ============================================================================
// HOLE STATISTICS - Tour-scoped: /{year}/tournaments/{id}/hole-statistics.json
// Captures new field: avg_diff
// ============================================================================
async function syncHoleStatistics(supabase: any, apiKey: string, tour: string, year: number, tournamentSrId: string, tournamentName?: string) {
  if (!tournamentSrId) {
    return { records: 0, message: 'Tournament ID required', debug: { error: 'missing_tournament_id' } };
  }

  // Check if this tour supports hole statistics
  const tourSlug = getTourSlug(tour);
  if (!tourSlug) {
    console.log(`[Hole Statistics] Skipping ${tournamentName || tournamentSrId} — hole stats not available for ${tour} tour`);
    return { records: 0, message: `Hole stats not available for ${tour} tour`, debug: { tour, skipped: true } };
  }

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) {
    return { records: 0, message: 'Tournament not found in database', debug: { tournamentSrId } };
  }

  const url = `${getTourBaseUrl(tourSlug)}/${year}/tournaments/${tournamentSrId}/hole-statistics.json`;
  
  let data: any;
  try {
    data = await fetchSportradar(url, apiKey, 'Hole Statistics');
  } catch (e) {
    return { 
      records: 0, 
      message: `Hole statistics not available: ${e.message}`,
      debug: { url, error: e.message }
    };
  }

  // Debug: Log response structure
  const topKeys = Object.keys(data);
  console.log(`[Hole Statistics] Response keys: ${topKeys.join(', ')}`);
  if (data.rounds) console.log(`[Hole Statistics] data.rounds has ${data.rounds.length} rounds`);
  if (data.rounds?.[0]) console.log(`[Hole Statistics] data.rounds[0] keys: ${Object.keys(data.rounds[0]).join(', ')}`);
  if (data.rounds?.[0]?.courses) console.log(`[Hole Statistics] data.rounds[0].courses has ${data.rounds[0].courses.length} courses`);

  let totalRecords = 0;
  
  // Try multiple extraction paths for rounds/holes
  // Based on similar structure: data.rounds[].courses[].holes[] is the likely path
  let rounds: any[] = [];
  
  if (data.rounds && Array.isArray(data.rounds) && data.rounds.length > 0) {
    // Check if holes are nested under courses within each round
    const firstRound = data.rounds[0];
    if (firstRound.courses && Array.isArray(firstRound.courses)) {
      // Structure: rounds[].courses[].holes[]
      for (const round of data.rounds) {
        if (round.courses && Array.isArray(round.courses)) {
          for (const course of round.courses) {
            if (course.holes && Array.isArray(course.holes)) {
              rounds.push({ 
                holes: course.holes, 
                number: round.number, 
                courseName: course.name,
                courseId: course.id
              });
            }
          }
        }
      }
      console.log(`[Hole Statistics] Found holes in data.rounds[].courses[].holes (${rounds.length} round-course combos)`);
    } else if (firstRound.holes && Array.isArray(firstRound.holes)) {
      // Structure: rounds[].holes[]
      rounds = data.rounds;
      console.log(`[Hole Statistics] Found ${rounds.length} rounds with direct holes`);
    } else {
      // Just pass through rounds, may have holes nested differently
      rounds = data.rounds;
      console.log(`[Hole Statistics] Found ${rounds.length} rounds, structure unclear`);
    }
  } else if (data.round?.courses && Array.isArray(data.round.courses)) {
    for (const course of data.round.courses) {
      if (course.holes && Array.isArray(course.holes)) {
        rounds.push({ holes: course.holes, number: data.round.number, courseName: course.name });
      }
    }
    console.log(`[Hole Statistics] Found holes in data.round.courses (${rounds.length} courses)`);
  } else if (data.round?.holes && Array.isArray(data.round.holes)) {
    rounds = [{ holes: data.round.holes, number: data.round.number }];
    console.log(`[Hole Statistics] Found ${data.round.holes.length} holes in data.round.holes`);
  } else if (data.course?.holes && Array.isArray(data.course.holes)) {
    rounds = [{ holes: data.course.holes, number: null }];
    console.log(`[Hole Statistics] Found ${data.course.holes.length} holes in data.course.holes`);
  } else if (data.courses && Array.isArray(data.courses)) {
    for (const course of data.courses) {
      if (course.holes && Array.isArray(course.holes)) {
        rounds.push({ holes: course.holes, number: null, courseName: course.name });
      }
    }
    console.log(`[Hole Statistics] Found holes in data.courses (${rounds.length} courses)`);
  } else if (data.holes && Array.isArray(data.holes)) {
    rounds = [{ holes: data.holes, number: null }];
    console.log(`[Hole Statistics] Found ${data.holes.length} holes in data.holes`);
  } else {
    console.log(`[Hole Statistics] Could not find holes. Sample: ${JSON.stringify(data).substring(0, 500)}`);
  }

  // Debug: log first hole sample to identify field structure
  if (rounds.length > 0 && rounds[0].holes?.length > 0) {
    const sampleHole = rounds[0].holes[0];
    console.log('=== SPORTRADAR HOLE STATS RAW ===');
    console.log(`Tour: ${tourSlug}, Keys: ${Object.keys(sampleHole).join(', ')}`);
    console.log('First hole sample:', JSON.stringify(sampleHole, null, 2));
    console.log('=== END RAW ===');
  }

  for (const round of rounds) {
    const roundNum = round.number || null;
    const holes = round.holes || [];

    for (const hole of holes) {
      // Try multiple field paths: hole.statistics.X, hole.X, fallback to 0/null
      const stats = hole.statistics || {};
      const { error } = await supabase.from('sr_hole_statistics').upsert({
        tournament_id: tournament.id,
        round_number: roundNum,
        hole_number: hole.number,
        par: hole.par,
        yardage: hole.yardage,
        scoring_average: stats.scoring_avg ?? stats.scoring_average ?? hole.strokes_avg ?? hole.scoring_average ?? hole.scoring_avg ?? null,
        avg_diff: stats.avg_diff ?? stats.relative_to_par ?? hole.avg_diff ?? hole.diff ?? null,
        eagles: stats.eagles ?? hole.eagles ?? 0,
        birdies: stats.birdies ?? hole.birdies ?? 0,
        pars: stats.pars ?? hole.pars ?? 0,
        bogeys: stats.bogeys ?? hole.bogeys ?? 0,
        double_bogeys: stats.double_bogeys ?? hole.double_bogeys ?? 0,
        other: stats.other ?? hole.other ?? hole.other_scores ?? 0,
        rank: stats.rank ?? hole.rank ?? null,
        raw_data: hole,
      }, { onConflict: 'tournament_id,round_number,hole_number' });
      if (!error) totalRecords++;
      else console.error(`[Hole Statistics] Upsert error for hole ${hole.number} round ${roundNum}:`, error.message);
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} hole statistics`,
    debug: { url, topKeys, roundsFound: rounds.length }
  };
}

// ============================================================================
// BACKFILL HOLE STATISTICS — Iterate all closed tournaments missing hole data
// ============================================================================
async function backfillHoleStatistics(supabase: any, apiKey: string) {
  // ── Step 1: Clean up zero-data rows from unsupported tours ──
  const unsupportedTourNames = ['LIV', 'OLY', 'USGA'];
  const { data: unsupportedSeasons } = await supabase
    .from('sr_seasons')
    .select('id')
    .in('tour_name', unsupportedTourNames);

  if (unsupportedSeasons?.length) {
    const seasonIds = unsupportedSeasons.map((s: any) => s.id);
    const { data: unsupportedTournaments } = await supabase
      .from('sr_tournaments')
      .select('id, name')
      .in('season_id', seasonIds);

    for (const t of (unsupportedTournaments || [])) {
      const { count: zeroRows } = await supabase
        .from('sr_hole_statistics')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id)
        .or('scoring_average.is.null,scoring_average.eq.0');

      if (zeroRows && zeroRows > 0) {
        await supabase
          .from('sr_hole_statistics')
          .delete()
          .eq('tournament_id', t.id)
          .or('scoring_average.is.null,scoring_average.eq.0');
        console.log(`[Backfill] Cleaned ${zeroRows} zero-data rows for ${t.name} (unsupported tour)`);
      }
    }
  }

  // ── Step 2: Get all closed tournaments ──
  const { data: tournaments, error: qErr } = await supabase
    .from('sr_tournaments')
    .select('id, sr_id, name, season_id')
    .eq('status', 'closed')
    .order('end_date', { ascending: false });

  if (qErr || !tournaments?.length) {
    return { records: 0, message: 'No closed tournaments found', debug: { error: qErr?.message } };
  }

  let totalRecords = 0;
  let processed = 0;
  let skipped = 0;
  const total = tournaments.length;
  const results: { name: string; records: number; skipped?: boolean; reason?: string }[] = [];

  for (const tournament of tournaments) {
    processed++;

    // Get season info for API URL and tour slug
    const { data: season } = await supabase
      .from('sr_seasons')
      .select('year, tour_name')
      .eq('id', tournament.season_id)
      .maybeSingle();

    const year = season?.year || new Date().getFullYear();
    const tourName = season?.tour_name || 'pga';
    
    // Use centralized tour slug mapping
    const tourSlug = getTourSlug(tourName);
    if (!tourSlug) {
      results.push({ name: tournament.name, records: 0, skipped: true, reason: `unsupported tour: ${tourName}` });
      skipped++;
      continue;
    }

    // Check if fully populated (all rows have data)
    const { count: rowsWithData } = await supabase
      .from('sr_hole_statistics')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id)
      .gt('scoring_average', 0);

    const { count: totalRows } = await supabase
      .from('sr_hole_statistics')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id);

    // Skip only if we have rows AND all of them have real data
    if (rowsWithData && rowsWithData > 0 && rowsWithData === totalRows) {
      results.push({ name: tournament.name, records: 0, skipped: true, reason: `fully populated (${rowsWithData} rows)` });
      skipped++;
      continue;
    }

    console.log(`[Backfill] (${processed}/${total}) Syncing ${tournament.name} — ${rowsWithData || 0}/${totalRows || 0} rows have data`);

    try {
      const result = await syncHoleStatistics(supabase, apiKey, tourSlug, year, tournament.sr_id, tournament.name);
      totalRecords += result.records;
      results.push({ name: tournament.name, records: result.records });
    } catch (e) {
      console.error(`[Backfill] Error for ${tournament.name}: ${e.message}`);
      results.push({ name: tournament.name, records: 0, reason: e.message });
    }

    // Rate limit: 1.5 seconds between tournaments
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`[Backfill] Complete: ${totalRecords} records, ${skipped} skipped, ${processed} processed`);
  return { 
    records: totalRecords, 
    message: `Backfilled hole stats: ${totalRecords} records across ${processed} tournaments (${skipped} skipped)`,
    debug: { results }
  };
}

// ============================================================================
// PLAYER PROFILE - Global: /v3/en/players/{player_id}/profile.json
// Per docs, this is a global endpoint (no tour in path)
// ============================================================================
async function syncPlayerProfile(supabase: any, apiKey: string, playerSrId: string) {
  if (!playerSrId) {
    return { records: 0, message: 'Player ID required', debug: { error: 'missing_player_id' } };
  }

  // Per API docs: /golf/{access_level}/v3/{lang}/players/{player_id}/profile.json
  const url = `${getGlobalBaseUrl()}/players/${playerSrId}/profile.json`;
  const data = await fetchSportradar(url, apiKey, 'Player Profile');
  const player = data.player || data;

  const { data: dbPlayer } = await supabase.from('sr_players').upsert({
    sr_id: playerSrId,
    first_name: player.first_name,
    last_name: player.last_name,
    full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
    abbr_name: player.abbr_name,
    height: player.height,
    weight: player.weight,
    birth_date: player.birthday || player.birth_date,
    birth_place: player.birth_place,
    residence: player.residence,
    college: player.college,
    turned_pro: player.turned_pro,
    country: player.country,
    country_code: player.country_code,
    handedness: player.handedness,
    gender: player.gender,
    is_amateur: player.amateur || false,
    is_member: player.member || false,
    raw_data: player,
  }, { onConflict: 'sr_id' }).select().single();

  if (dbPlayer) {
    await supabase.from('sr_player_profiles').upsert({
      player_id: dbPlayer.id,
      bio: player.bio,
      career_earnings: player.statistics?.career?.earnings,
      career_wins: player.statistics?.career?.wins,
      pga_tour_wins: player.statistics?.career?.pga_tour_wins,
      majors_won: player.statistics?.career?.majors_won,
      best_world_ranking: player.statistics?.career?.best_world_ranking,
      raw_data: data,
    }, { onConflict: 'player_id' });
  }

  return { records: 1, message: `Synced player profile`, debug: { url } };
}

// ============================================================================
// PLAYER STATISTICS - Tour-scoped: /{year}/players/statistics.json
// Note: Per docs, only available for PGA Tour
// Captures new fields
// ============================================================================
async function syncPlayerStatistics(supabase: any, apiKey: string, tour: string, year: number) {
  // Map incoming tourId param → Sportradar URL path slug
  const tourUrlMap: Record<string, string> = {
    pga: 'pga',
    lpga: 'lpga',
    eur: 'euro',
    euro: 'euro',
    'champions-tour': 'champ',
    champ: 'champ',
    liv: 'liv',
    pgad: 'pgad',
  };
  const tourUrlSlug = tourUrlMap[tour] || tour;
  const url = `${getTourBaseUrl(tourUrlSlug)}/${year}/players/statistics.json`;
  const data = await fetchSportradar(url, apiKey, 'Player Statistics');
  const players = data.players || [];
  let totalRecords = 0;

  // Filter by both year AND tour_name to avoid maybeSingle() returning null
  // when multiple tours exist for the same year
  // Keys = tourId param values; Values = tour_name in sr_seasons table
  const tourNameMap: Record<string, string> = {
    pga: 'pga',
    lpga: 'LPGA',
    eur: 'EURO',
    euro: 'EURO',
    'champions-tour': 'CHAMP',
    champ: 'CHAMP',
    liv: 'LIV',
    pgad: 'PGAD',
  };
  };
  const tourName = tourNameMap[tour] || tour;
  const { data: season } = await supabase
    .from('sr_seasons')
    .select('id')
    .eq('year', year)
    .eq('tour_name', tourName)
    .limit(1)
    .maybeSingle();

  if (!season) {
    return { records: 0, message: 'Season not found - sync schedule first', debug: { url } };
  }

  for (const playerEntry of players) {
    const player = playerEntry.player || playerEntry;
    const stats = playerEntry.statistics || player.statistics || {};
    
    const { data: dbPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', player.id)
      .maybeSingle();

    if (dbPlayer) {
      const { error } = await supabase.from('sr_player_statistics').upsert({
        player_id: dbPlayer.id,
        season_id: season.id,
        fedex_points: stats.fedex_points || stats.points,
        fedex_rank: stats.fedex_rank || stats.points_rank,
        events_played: stats.events_played,
        cuts_made: stats.cuts_made,
        cuts_missed: stats.cuts_missed,
        wins: stats.first_place || stats.wins,
        second_place: stats.second_place,
        third_place: stats.third_place,
        top_10s: stats.top_10 || stats.top_10s,
        top_25s: stats.top_25 || stats.top_25s,
        withdrawals: stats.withdrawals,
        scoring_average: stats.scoring_avg || stats.scoring_average,
        driving_distance: stats.drive_avg || stats.driving_distance,
        driving_accuracy: stats.drive_acc || stats.driving_accuracy,
        greens_in_reg: stats.gir_pct || stats.greens_in_regulation,
        putting_average: stats.putt_avg || stats.putting_average,
        sand_saves: stats.sand_saves_pct || stats.sand_saves,
        holes_per_eagle: stats.holes_per_eagle,
        holes_proximity_avg: stats.holes_proximity_avg,
        strokes_gained_putting: stats.strokes_gained,
        strokes_gained_tee_green: stats.strokes_gained_tee_green,
        total_driving: stats.total_driving,
        earnings: stats.earnings,
        earnings_rank: stats.earnings_rank,
        raw_data: playerEntry,
      }, { onConflict: 'player_id,season_id' });
      if (!error) totalRecords++;
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} player statistics`, debug: { url } };
}

// ============================================================================
// BRIDGE: sr_player_statistics → tour_season_rankings
// Reads freshly-synced stats and upserts into tour_season_rankings so the
// Players tab always shows current standings without separate scrapers.
// ============================================================================
async function syncTourSeasonRankings(supabase: any, tour: string, year: number) {
  // Map tour param to tour_code used in tour_season_rankings
  const tourCodeMap: Record<string, string> = {
    pga: 'pga', lpga: 'lpga', euro: 'euro', eur: 'euro',
    pgad: 'pgad', liv: 'liv', champ: 'champ',
  };
  const tourCode = tourCodeMap[tour] || tour;

  // Map tour param to tour_name in sr_seasons
  const tourNameMap: Record<string, string> = {
    pga: 'pga', lpga: 'LPGA', euro: 'EURO', eur: 'EURO',
    pgad: 'PGAD', liv: 'LIV', champ: 'CHAMP',
  };
  const tourName = tourNameMap[tour] || tour;

  const { data: season } = await supabase
    .from('sr_seasons')
    .select('id')
    .eq('year', year)
    .eq('tour_name', tourName)
    .limit(1)
    .maybeSingle();

  if (!season) {
    console.log(`[Bridge] No season found for ${tourName} ${year}`);
    return { records: 0 };
  }

  // Fetch all player stats with rankings for this season
  const { data: stats, error: statsError } = await supabase
    .from('sr_player_statistics')
    .select(`
      player_id,
      fedex_points,
      fedex_rank,
      earnings,
      wins,
      events_played,
      sr_players!inner(id, full_name, country)
    `)
    .eq('season_id', season.id)
    .not('fedex_rank', 'is', null)
    .order('fedex_rank', { ascending: true });

  if (statsError || !stats?.length) {
    console.log(`[Bridge] No ranked stats for ${tourCode} ${year}: ${statsError?.message || 'empty'}`);
    return { records: 0 };
  }

  console.log(`[Bridge] Found ${stats.length} ranked players for ${tourCode} ${year}`);

  const now = new Date().toISOString();
  const rows = stats.map((stat: any) => ({
    player_id: stat.player_id,
    player_name: stat.sr_players.full_name,
    tour_code: tourCode,
    season_year: year,
    position: stat.fedex_rank,
    points: stat.fedex_points,
    wins: stat.wins || 0,
    tournaments_played: stat.events_played,
    country: stat.sr_players.country,
    scraped_at: now,
  }));

  // Upsert in batches of 100
  let totalRecords = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);
    const { error } = await supabase
      .from('tour_season_rankings')
      .upsert(batch, { onConflict: 'tour_code,season_year,player_name' });
    if (!error) {
      totalRecords += batch.length;
    } else {
      console.error(`[Bridge] Upsert error batch ${i}: ${error.message}`);
    }
  }

  console.log(`[Bridge] Upserted ${totalRecords} tour_season_rankings rows for ${tourCode}`);
  return { records: totalRecords };
}


async function backfillTeeTimes(supabase: any, apiKey: string) {
  const { data: tournaments } = await supabase
    .from('sr_tournaments')
    .select('id, sr_id, name, season_id, status')
    .in('status', ['closed', 'inprogress'])
    .order('end_date', { ascending: false });

  if (!tournaments?.length) return { records: 0, message: 'No tournaments found' };

  let totalRecords = 0;
  let processed = 0;
  let skipped = 0;
  const debug: any[] = [];

  for (const tournament of tournaments) {
    processed++;

    // Get season info
    const { data: season } = await supabase
      .from('sr_seasons')
      .select('year, tour_name')
      .eq('id', tournament.season_id)
      .maybeSingle();

    const year = season?.year || new Date().getFullYear();
    const tourSlug = getTourSlugForTeeTimes(season?.tour_name || 'pga');
    
    if (!tourSlug) {
      skipped++;
      debug.push({ name: tournament.name, status: 'skipped', reason: 'unsupported tour' });
      continue;
    }

    // Check if already has tee time data
    const { count: existingRows } = await supabase
      .from('sr_tee_times')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id);

    if (existingRows && existingRows > 0) {
      skipped++;
      continue;
    }

    console.log(`[Backfill Tee Times] (${processed}/${tournaments.length}) Syncing ${tournament.name}`);

    try {
      const result = await syncTeeTimes(supabase, apiKey, tourSlug, year, tournament.sr_id, 'rounds');
      totalRecords += result?.records || 0;
      debug.push({ name: tournament.name, status: 'synced', records: result?.records || 0 });
    } catch (e) {
      console.error(`[Backfill Tee Times] Error for ${tournament.name}: ${e.message}`);
      debug.push({ name: tournament.name, status: 'error', error: e.message });
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return {
    records: totalRecords,
    message: `Backfilled tee times for ${processed} tournaments (${skipped} skipped)`,
    debug,
  };
}
