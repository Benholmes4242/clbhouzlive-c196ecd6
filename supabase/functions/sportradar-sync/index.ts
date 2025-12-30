import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TournamentData {
  id: string;
  name: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  purse?: number;
  currency?: string;
  points_type?: string;
  venue?: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    courses?: Array<{
      name?: string;
      par?: number;
      yardage?: number;
    }>;
  };
  defending_champion?: {
    first_name?: string;
    last_name?: string;
  };
}

interface SeasonData {
  id: string;
  name: string;
  year: number;
  tour: {
    id: string;
    name: string;
  };
  tournaments?: TournamentData[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sportradarApiKey = Deno.env.get('SPORTRADAR_API_KEY');

    if (!sportradarApiKey) {
      console.error('SPORTRADAR_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'SPORTRADAR_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, tourId, year } = await req.json();

    console.log(`Sportradar sync: action=${action}, tourId=${tourId}, year=${year}`);

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('sr_sync_log')
      .insert({
        sync_type: action || 'schedule',
        tour_id: tourId,
        status: 'pending',
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Failed to create sync log:', syncLogError);
    }

    const syncLogId = syncLog?.id;

    try {
      // Default to PGA Tour if not specified
      const tour = tourId || 'pga';
      const seasonYear = year || new Date().getFullYear();

      // Fetch tournament schedule from Sportradar
      // API endpoint: /golf/{tour}/tournaments/schedule.json
      const scheduleUrl = `https://api.sportradar.com/golf/trial/pga/v3/en/2025/tournaments/schedule.json?api_key=${sportradarApiKey}`;
      
      console.log(`Fetching schedule from Sportradar for tour=${tour}, year=${seasonYear}`);
      
      const response = await fetch(scheduleUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Sportradar API error: ${response.status} - ${errorText}`);
        throw new Error(`Sportradar API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Sportradar response received:', JSON.stringify(data).substring(0, 500));

      // Extract season and tournament data
      const seasons = data.seasons || [data];
      let totalRecords = 0;

      for (const season of seasons) {
        // Upsert season
        const seasonSrId = season.id || `${tour}-${seasonYear}`;
        const { data: existingSeason, error: seasonSelectError } = await supabase
          .from('sr_seasons')
          .select('id')
          .eq('sr_id', seasonSrId)
          .maybeSingle();

        let seasonDbId: string;

        if (existingSeason) {
          seasonDbId = existingSeason.id;
          // Update existing season
          await supabase
            .from('sr_seasons')
            .update({
              tour_id: season.tour?.id || tour,
              tour_name: season.tour?.name || tour.toUpperCase(),
              year: season.year || seasonYear,
              name: season.name || `${seasonYear} Season`,
            })
            .eq('id', seasonDbId);
        } else {
          // Insert new season
          const { data: newSeason, error: seasonInsertError } = await supabase
            .from('sr_seasons')
            .insert({
              sr_id: seasonSrId,
              tour_id: season.tour?.id || tour,
              tour_name: season.tour?.name || tour.toUpperCase(),
              year: season.year || seasonYear,
              name: season.name || `${seasonYear} Season`,
            })
            .select()
            .single();

          if (seasonInsertError) {
            console.error('Failed to insert season:', seasonInsertError);
            continue;
          }
          seasonDbId = newSeason.id;
        }

        // Process tournaments
        const tournaments = season.tournaments || data.tournaments || [];
        console.log(`Processing ${tournaments.length} tournaments for season ${seasonSrId}`);

        for (const tournament of tournaments) {
          const tournamentData = {
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
          };

          // Upsert tournament
          const { error: upsertError } = await supabase
            .from('sr_tournaments')
            .upsert(tournamentData, { onConflict: 'sr_id' });

          if (upsertError) {
            console.error(`Failed to upsert tournament ${tournament.name}:`, upsertError);
          } else {
            totalRecords++;
          }
        }
      }

      // Update sync log with success
      if (syncLogId) {
        await supabase
          .from('sr_sync_log')
          .update({
            status: 'success',
            records_synced: totalRecords,
            completed_at: new Date().toISOString(),
          })
          .eq('id', syncLogId);
      }

      console.log(`Sync completed successfully. ${totalRecords} tournaments synced.`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Synced ${totalRecords} tournaments`,
          records_synced: totalRecords 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Sync error:', error);

      // Update sync log with error
      if (syncLogId) {
        await supabase
          .from('sr_sync_log')
          .update({
            status: 'error',
            error_message: error.message,
            completed_at: new Date().toISOString(),
          })
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
