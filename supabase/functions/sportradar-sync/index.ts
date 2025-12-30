import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Base URL - correct format: /golf/trial/{tour}/v3/en
const getBaseUrl = (tour: string = 'pga') => `https://api.sportradar.com/golf/trial/${tour}/v3/en`;

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
    const { action, tourId, year, tournamentId, playerId } = await req.json();

    const effectiveYear = year || 2025;
    console.log(`Sportradar sync: action=${action}, tourId=${tourId}, year=${effectiveYear}`);

    // Create sync log entry
    const { data: syncLog } = await supabase
      .from('sr_sync_log')
      .insert({ sync_type: action || 'schedule', tour_id: tourId, status: 'pending' })
      .select()
      .single();

    const syncLogId = syncLog?.id;

    try {
      let result: { records: number; message: string };

      switch (action) {
        case 'schedule':
          result = await syncSchedule(supabase, sportradarApiKey, effectiveYear);
          break;
        case 'players':
          result = await syncPlayers(supabase, sportradarApiKey, effectiveYear);
          break;
        case 'rankings':
          result = await syncWorldRankings(supabase, sportradarApiKey, effectiveYear);
          break;
        case 'leaderboard':
          result = await syncLeaderboard(supabase, sportradarApiKey, tournamentId);
          break;
        case 'summary':
          result = await syncTournamentSummary(supabase, sportradarApiKey, tournamentId);
          break;
        case 'scorecards':
          result = await syncScorecards(supabase, sportradarApiKey, tournamentId);
          break;
        case 'tee_times':
          result = await syncTeeTimes(supabase, sportradarApiKey, tournamentId);
          break;
        case 'hole_stats':
          result = await syncHoleStatistics(supabase, sportradarApiKey, tournamentId);
          break;
        case 'player_profile':
          result = await syncPlayerProfile(supabase, sportradarApiKey, playerId);
          break;
        case 'player_stats':
          result = await syncPlayerStatistics(supabase, sportradarApiKey, effectiveYear);
          break;
        case 'seasons':
          result = await syncSeasons(supabase, sportradarApiKey, effectiveYear);
          break;
        default:
          result = await syncSchedule(supabase, sportradarApiKey, effectiveYear);
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
        JSON.stringify({ success: true, message: result.message, records_synced: result.records }),
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

// Helper to fetch from Sportradar with rate limiting
async function fetchSportradar(url: string, apiKey: string) {
  const response = await fetch(`${url}?api_key=${apiKey}`);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Sportradar API error: ${response.status} - ${errorText}`);
    throw new Error(`Sportradar API error: ${response.status}`);
  }
  return response.json();
}

// Sync tournament schedule
async function syncSchedule(supabase: any, apiKey: string, year: number) {
  const url = `${getBaseUrl()}/${year}/tournaments/schedule.json`;
  console.log(`Fetching schedule from: ${url}`);
  const data = await fetchSportradar(url, apiKey);
  const seasons = data.seasons || [data];
  let totalRecords = 0;

  for (const season of seasons) {
    const seasonSrId = season.id || `pga-${year}`;
    const { data: existingSeason } = await supabase
      .from('sr_seasons')
      .select('id')
      .eq('sr_id', seasonSrId)
      .maybeSingle();

    let seasonDbId: string;
    if (existingSeason) {
      seasonDbId = existingSeason.id;
      await supabase.from('sr_seasons').update({
        tour_id: season.tour?.id || 'pga',
        tour_name: season.tour?.name || 'PGA Tour',
        year: season.year || year,
        name: season.name || `${year} Season`,
      }).eq('id', seasonDbId);
    } else {
      const { data: newSeason, error } = await supabase.from('sr_seasons').insert({
        sr_id: seasonSrId,
        tour_id: season.tour?.id || 'pga',
        tour_name: season.tour?.name || 'PGA Tour',
        year: season.year || year,
        name: season.name || `${year} Season`,
      }).select().single();
      if (error) continue;
      seasonDbId = newSeason.id;
    }

    const tournaments = season.tournaments || data.tournaments || [];
    for (const tournament of tournaments) {
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
        venue_name: tournament.venue?.name,
        venue_city: tournament.venue?.city,
        venue_state: tournament.venue?.state,
        venue_country: tournament.venue?.country,
        venue_course_name: tournament.venue?.courses?.[0]?.name,
        venue_par: tournament.venue?.courses?.[0]?.par,
        venue_yardage: tournament.venue?.courses?.[0]?.yardage,
        defending_champion: tournament.defending_champion 
          ? `${tournament.defending_champion.first_name || ''} ${tournament.defending_champion.last_name || ''}`.trim()
          : null,
        raw_data: tournament,
      }, { onConflict: 'sr_id' });
      if (!error) totalRecords++;
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} tournaments` };
}

// Sync players list
async function syncPlayers(supabase: any, apiKey: string, year: number) {
  const url = `${getBaseUrl()}/${year}/players/profiles.json`;
  console.log(`Fetching players from: ${url}`);
  const data = await fetchSportradar(url, apiKey);
  const players = data.players || [];
  let totalRecords = 0;

  for (const player of players) {
    const { error } = await supabase.from('sr_players').upsert({
      sr_id: player.id,
      first_name: player.first_name,
      last_name: player.last_name,
      full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
      height: player.height,
      weight: player.weight,
      birth_date: player.birthday || player.birth_date,
      birth_place: player.birth_place,
      residence: player.residence,
      college: player.college,
      turned_pro: player.turned_pro,
      country: player.country,
      country_code: player.country_code,
      raw_data: player,
    }, { onConflict: 'sr_id' });
    if (!error) totalRecords++;
  }

  return { records: totalRecords, message: `Synced ${totalRecords} players` };
}

// Sync world rankings
async function syncWorldRankings(supabase: any, apiKey: string, year: number) {
  // World Golf Rankings uses a different endpoint structure - not year-based
  // Try the standard rankings endpoint first
  const possibleUrls = [
    `https://api.sportradar.com/golf/trial/v3/en/players/wgr.json`,
    `${getBaseUrl()}/players/wgr.json`,
    `https://api.sportradar.com/golf/trial/pga/v3/en/players/rankings.json`,
  ];
  
  let data: any = null;
  let successUrl = '';
  
  for (const url of possibleUrls) {
    try {
      console.log(`Trying world rankings from: ${url}`);
      data = await fetchSportradar(url, apiKey);
      successUrl = url;
      console.log(`Successfully fetched rankings from: ${url}`);
      break;
    } catch (e) {
      console.log(`URL failed: ${url} - ${e.message}`);
    }
  }
  
  if (!data) {
    // If all URLs fail, return gracefully with a message
    console.log('World rankings endpoint not available - this may be a trial API limitation');
    return { 
      records: 0, 
      message: 'World rankings not available. This endpoint may not be included in the trial API. Consider upgrading to a production API key.' 
    };
  }
  
  const rankings = data.rankings || data.players || [];
  let totalRecords = 0;
  const rankingDate = new Date().toISOString().split('T')[0];

  for (const ranking of rankings) {
    // First ensure player exists
    const { data: existingPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', ranking.id || ranking.player_id)
      .maybeSingle();

    let playerId: string | null = existingPlayer?.id;

    if (!playerId && ranking.id) {
      const { data: newPlayer } = await supabase.from('sr_players').insert({
        sr_id: ranking.id,
        first_name: ranking.first_name,
        last_name: ranking.last_name,
        full_name: `${ranking.first_name || ''} ${ranking.last_name || ''}`.trim(),
        country: ranking.country,
        country_code: ranking.country_code,
        raw_data: ranking,
      }).select().single();
      playerId = newPlayer?.id;
    }

    if (playerId) {
      const { error } = await supabase.from('sr_world_rankings').upsert({
        player_id: playerId,
        rank: ranking.rank || ranking.position,
        points: ranking.points,
        points_lost: ranking.points_lost,
        points_gained: ranking.points_gained,
        events_played: ranking.events,
        ranking_date: rankingDate,
        raw_data: ranking,
      }, { onConflict: 'player_id,ranking_date' });
      if (!error) totalRecords++;
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} rankings from ${successUrl || 'API'}` };
}

// Sync tournament leaderboard
async function syncLeaderboard(supabase: any, apiKey: string, tournamentSrId: string) {
  if (!tournamentSrId) throw new Error('Tournament ID required');

  const url = `${getBaseUrl()}/tournaments/${tournamentSrId}/leaderboard.json`;
  console.log(`Fetching leaderboard from: ${url}`);
  const data = await fetchSportradar(url, apiKey);
  const leaderboard = data.leaderboard || [];
  let totalRecords = 0;

  // Get tournament DB ID
  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) throw new Error('Tournament not found in database');

  for (const entry of leaderboard) {
    // Ensure player exists
    let playerId: string | null = null;
    const { data: existingPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', entry.id || entry.player_id)
      .maybeSingle();

    if (existingPlayer) {
      playerId = existingPlayer.id;
    } else if (entry.id || entry.player_id) {
      const { data: newPlayer } = await supabase.from('sr_players').insert({
        sr_id: entry.id || entry.player_id,
        first_name: entry.first_name,
        last_name: entry.last_name,
        full_name: `${entry.first_name || ''} ${entry.last_name || ''}`.trim(),
        country: entry.country,
        raw_data: entry,
      }).select().single();
      playerId = newPlayer?.id;
    }

    if (playerId) {
      const { error } = await supabase.from('sr_leaderboards').upsert({
        tournament_id: tournament.id,
        player_id: playerId,
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
      if (!error) totalRecords++;
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} leaderboard entries` };
}

// Sync tournament summary
async function syncTournamentSummary(supabase: any, apiKey: string, tournamentSrId: string) {
  if (!tournamentSrId) throw new Error('Tournament ID required');

  const url = `${getBaseUrl()}/tournaments/${tournamentSrId}/summary.json`;
  console.log(`Fetching tournament summary from: ${url}`);
  const data = await fetchSportradar(url, apiKey);

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) throw new Error('Tournament not found in database');

  const { error } = await supabase.from('sr_tournament_summaries').upsert({
    tournament_id: tournament.id,
    field_size: data.field?.length || data.participants?.length,
    cut_score: data.cut_score,
    weather_conditions: data.weather?.condition,
    course_conditions: data.course_conditions,
    raw_data: data,
  }, { onConflict: 'tournament_id' });

  // Also sync course info if available
  if (data.venue?.courses) {
    for (const course of data.venue.courses) {
      await supabase.from('sr_courses').upsert({
        sr_id: course.id || `${tournamentSrId}-${course.name}`,
        name: course.name,
        city: data.venue.city,
        state: data.venue.state,
        country: data.venue.country,
        country_code: data.venue.country_code,
        latitude: course.latitude,
        longitude: course.longitude,
        par: course.par,
        yardage: course.yardage,
        holes: course.holes?.length || 18,
        raw_data: course,
      }, { onConflict: 'sr_id' });

      // Sync hole info if available
      if (course.holes) {
        const { data: courseDb } = await supabase
          .from('sr_courses')
          .select('id')
          .eq('sr_id', course.id || `${tournamentSrId}-${course.name}`)
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

  return { records: error ? 0 : 1, message: `Synced tournament summary` };
}

// Sync scorecards
async function syncScorecards(supabase: any, apiKey: string, tournamentSrId: string) {
  if (!tournamentSrId) throw new Error('Tournament ID required');

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) throw new Error('Tournament not found in database');

  let totalRecords = 0;

  // Fetch scorecards for each round (1-4)
  for (let round = 1; round <= 4; round++) {
    try {
      const url = `${getBaseUrl()}/tournaments/${tournamentSrId}/rounds/${round}/scorecards.json`;
      console.log(`Fetching scorecards from: ${url}`);
      const data = await fetchSportradar(url, apiKey);

      const players = data.players || data.round?.players || [];
      for (const player of players) {
        let playerId: string | null = null;
        const { data: existingPlayer } = await supabase
          .from('sr_players')
          .select('id')
          .eq('sr_id', player.id)
          .maybeSingle();

        if (existingPlayer) {
          playerId = existingPlayer.id;
        } else if (player.id) {
          const { data: newPlayer } = await supabase.from('sr_players').insert({
            sr_id: player.id,
            first_name: player.first_name,
            last_name: player.last_name,
            full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
            raw_data: player,
          }).select().single();
          playerId = newPlayer?.id;
        }

        if (playerId && player.holes) {
          for (const hole of player.holes) {
            const { error } = await supabase.from('sr_scorecards').upsert({
              tournament_id: tournament.id,
              player_id: playerId,
              round_number: round,
              hole_number: hole.number,
              strokes: hole.strokes,
              par: hole.par,
              score_to_par: hole.strokes - hole.par,
              raw_data: hole,
            }, { onConflict: 'tournament_id,player_id,round_number,hole_number' });
            if (!error) totalRecords++;
          }
        }
      }
    } catch (e) {
      console.log(`Round ${round} scorecards not available: ${e.message}`);
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} scorecard entries` };
}

// Sync tee times
async function syncTeeTimes(supabase: any, apiKey: string, tournamentSrId: string) {
  if (!tournamentSrId) throw new Error('Tournament ID required');

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) throw new Error('Tournament not found in database');

  let totalRecords = 0;

  for (let round = 1; round <= 4; round++) {
    try {
      const url = `${getBaseUrl()}/tournaments/${tournamentSrId}/rounds/${round}/teetimes.json`;
      console.log(`Fetching tee times from: ${url}`);
      const data = await fetchSportradar(url, apiKey);

      const groups = data.round?.tee_times || data.tee_times || [];
      for (const group of groups) {
        const { data: teeTime, error: teeError } = await supabase.from('sr_tee_times').upsert({
          tournament_id: tournament.id,
          round_number: round,
          tee_time: group.tee_time,
          tee_number: group.tee_number || 1,
          raw_data: group,
        }, { onConflict: 'tournament_id,round_number,tee_time,tee_number' }).select().single();

        if (!teeError && teeTime && group.players) {
          for (let i = 0; i < group.players.length; i++) {
            const player = group.players[i];
            const { data: existingPlayer } = await supabase
              .from('sr_players')
              .select('id')
              .eq('sr_id', player.id)
              .maybeSingle();

            let playerId = existingPlayer?.id;
            if (!playerId && player.id) {
              const { data: newPlayer } = await supabase.from('sr_players').insert({
                sr_id: player.id,
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
      console.log(`Round ${round} tee times not available: ${e.message}`);
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} tee time groups` };
}

// Sync hole statistics
async function syncHoleStatistics(supabase: any, apiKey: string, tournamentSrId: string) {
  if (!tournamentSrId) throw new Error('Tournament ID required');

  const { data: tournament } = await supabase
    .from('sr_tournaments')
    .select('id')
    .eq('sr_id', tournamentSrId)
    .maybeSingle();

  if (!tournament) throw new Error('Tournament not found in database');

  let totalRecords = 0;

  try {
  const url = `${getBaseUrl()}/tournaments/${tournamentSrId}/hole_statistics.json`;
  console.log(`Fetching hole statistics from: ${url}`);
  const data = await fetchSportradar(url, apiKey);

    const rounds = data.rounds || [{ holes: data.holes }];
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
          scoring_average: hole.scoring_average,
          eagles: hole.eagles,
          birdies: hole.birdies,
          pars: hole.pars,
          bogeys: hole.bogeys,
          double_bogeys: hole.double_bogeys,
          other: hole.other,
          rank: hole.rank,
          raw_data: hole,
        }, { onConflict: 'tournament_id,round_number,hole_number' });
        if (!error) totalRecords++;
      }
    }
  } catch (e) {
    console.log(`Hole statistics not available: ${e.message}`);
  }

  return { records: totalRecords, message: `Synced ${totalRecords} hole statistics` };
}

// Sync player profile
async function syncPlayerProfile(supabase: any, apiKey: string, playerSrId: string) {
  if (!playerSrId) throw new Error('Player ID required');

  const url = `${getBaseUrl()}/players/${playerSrId}/profile.json`;
  console.log(`Fetching player profile from: ${url}`);
  const data = await fetchSportradar(url, apiKey);
  const player = data.player || data;

  // Update or insert player
  const { data: dbPlayer } = await supabase.from('sr_players').upsert({
    sr_id: playerSrId,
    first_name: player.first_name,
    last_name: player.last_name,
    full_name: `${player.first_name || ''} ${player.last_name || ''}`.trim(),
    height: player.height,
    weight: player.weight,
    birth_date: player.birthday || player.birth_date,
    birth_place: player.birth_place,
    residence: player.residence,
    college: player.college,
    turned_pro: player.turned_pro,
    country: player.country,
    country_code: player.country_code,
    raw_data: player,
  }, { onConflict: 'sr_id' }).select().single();

  if (dbPlayer) {
    // Update profile
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

  return { records: 1, message: `Synced player profile` };
}

// Sync player statistics for a season
async function syncPlayerStatistics(supabase: any, apiKey: string, year: number) {
  const url = `${getBaseUrl()}/${year}/players/statistics.json`;
  console.log(`Fetching player statistics from: ${url}`);
  const data = await fetchSportradar(url, apiKey);
  const players = data.players || [];
  let totalRecords = 0;

  // Get season ID
  const { data: season } = await supabase
    .from('sr_seasons')
    .select('id')
    .eq('year', year)
    .maybeSingle();

  if (!season) {
    return { records: 0, message: 'Season not found - sync schedule first' };
  }

  for (const player of players) {
    const { data: dbPlayer } = await supabase
      .from('sr_players')
      .select('id')
      .eq('sr_id', player.id)
      .maybeSingle();

    if (dbPlayer) {
      const stats = player.statistics || {};
      const { error } = await supabase.from('sr_player_statistics').upsert({
        player_id: dbPlayer.id,
        season_id: season.id,
        fedex_points: stats.fedex_points,
        fedex_rank: stats.fedex_rank,
        events_played: stats.events_played,
        cuts_made: stats.cuts_made,
        wins: stats.wins,
        top_10s: stats.top_10s,
        top_25s: stats.top_25s,
        scoring_average: stats.scoring_average,
        driving_distance: stats.driving_distance,
        driving_accuracy: stats.driving_accuracy,
        greens_in_reg: stats.greens_in_regulation,
        putting_average: stats.putting_average,
        sand_saves: stats.sand_saves,
        raw_data: player,
      }, { onConflict: 'player_id,season_id' });
      if (!error) totalRecords++;
    }
  }

  return { records: totalRecords, message: `Synced ${totalRecords} player statistics` };
}

// Sync all seasons
async function syncSeasons(supabase: any, apiKey: string, year: number) {
  const url = `${getBaseUrl()}/seasons.json`;
  console.log(`Fetching seasons from: ${url}`);
  const data = await fetchSportradar(url, apiKey);
  const seasons = data.seasons || [];
  let totalRecords = 0;

  for (const season of seasons) {
    const { error } = await supabase.from('sr_seasons').upsert({
      sr_id: season.id,
      tour_id: season.tour?.id || 'pga',
      tour_name: season.tour?.name || 'PGA Tour',
      year: season.year,
      name: season.name,
    }, { onConflict: 'sr_id' });
    if (!error) totalRecords++;
  }

  return { records: totalRecords, message: `Synced ${totalRecords} seasons` };
}
