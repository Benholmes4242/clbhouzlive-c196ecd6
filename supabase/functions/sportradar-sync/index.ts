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
    const effectiveTour = tourId || 'pga';
    
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
          break;
        case 'seasons':
          result = await syncSeasons(supabase, sportradarApiKey);
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
  const url = `${getTourBaseUrl(tour)}/${year}/players/profiles.json`;
  const data = await fetchSportradar(url, apiKey, 'Players');
  const players = data.players || [];
  let totalRecords = 0;

  for (const player of players) {
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
      raw_data: player,
    }, { onConflict: 'sr_id' });
    if (!error) totalRecords++;
  }

  return { records: totalRecords, message: `Synced ${totalRecords} players` };
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
        points: playerData.points || player.points,
        avg_points: playerData.avg_points || player.avg_points,
        points_lost: playerData.points_lost || player.points_lost,
        points_gained: playerData.points_gained || player.points_gained,
        events_played: playerData.events_played || playerData.events || player.events_played,
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
        if (playerId && (playerEntry.score !== undefined || playerEntry.strokes !== undefined)) {
          // Update the first hole record with round-level data
          await supabase.from('sr_scorecards')
            .update({
              round_score: playerEntry.score,
              round_strokes: playerEntry.strokes,
              thru: playerEntry.thru,
              birdies: playerEntry.birdies,
              bogeys: playerEntry.bogeys,
              eagles: playerEntry.eagles,
              pars: playerEntry.pars,
              double_bogeys: playerEntry.double_bogeys,
              holes_in_one: playerEntry.holes_in_one,
              other_scores: playerEntry.other_scores,
              starting_hole: playerEntry.starting_hole,
            })
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
        }, { onConflict: 'tournament_id,round_number,tee_time,tee_number' }).select().single();

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
async function syncHoleStatistics(supabase: any, apiKey: string, tour: string, year: number, tournamentSrId: string) {
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

  const url = `${getTourBaseUrl(tour)}/${year}/tournaments/${tournamentSrId}/hole-statistics.json`;
  
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

  for (const round of rounds) {
    const roundNum = round.number || null;
    const holes = round.holes || [];

    for (const hole of holes) {
      const { error } = await supabase.from('sr_hole_statistics').upsert({
        tournament_id: tournament.id,
        round_number: roundNum,
        hole_number: hole.number,
        par: hole.par,
        yardage: hole.yardage,
        scoring_average: hole.scoring_average || hole.strokes_avg || hole.average,
        avg_diff: hole.avg_diff || hole.diff,
        eagles: hole.eagles,
        birdies: hole.birdies,
        pars: hole.pars,
        bogeys: hole.bogeys,
        double_bogeys: hole.double_bogeys,
        other: hole.other || hole.other_scores,
        rank: hole.rank,
        raw_data: hole,
      }, { onConflict: 'tournament_id,round_number,hole_number' });
      if (!error) totalRecords++;
    }
  }

  return { 
    records: totalRecords, 
    message: `Synced ${totalRecords} hole statistics`,
    debug: { url, topKeys, roundsFound: rounds.length }
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
    eur: 'eur',
    euro: 'eur',
    'champions-tour': 'champions-tour',
    champ: 'champions-tour',
    liv: 'liv',
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
