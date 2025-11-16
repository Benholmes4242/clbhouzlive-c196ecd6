import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find ended seasons that haven't been processed
    const { data: endedSeasons, error: seasonsError } = await supabaseAdmin
      .from('seasons')
      .select('*')
      .lt('ends_at', new Date().toISOString())
      .eq('processing_flag', false);

    if (seasonsError) throw seasonsError;

    if (!endedSeasons || endedSeasons.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No seasons to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const season of endedSeasons) {
      console.log(`Processing season: ${season.name} (${season.id})`);

      // Get leaderboard for this season
      const { data: leaderboard, error: leaderboardError } = await supabaseAdmin
        .from('season_leaderboard_view')
        .select('*')
        .eq('season_id', season.id)
        .order('season_rank', { ascending: true });

      if (leaderboardError) {
        console.error(`Error fetching leaderboard for season ${season.id}:`, leaderboardError);
        continue;
      }

      // Get reward tiers for this season
      const { data: rewardTiers, error: rewardError } = await supabaseAdmin
        .from('season_rewards')
        .select('*')
        .eq('season_id', season.id)
        .order('min_rank', { ascending: true });

      if (rewardError) {
        console.error(`Error fetching rewards for season ${season.id}:`, rewardError);
        continue;
      }

      // Process each user on the leaderboard
      const seasonResults = [];
      for (const entry of leaderboard) {
        // Find matching reward tier
        const rewardTier = rewardTiers.find(
          (tier) => entry.season_rank >= tier.min_rank && entry.season_rank <= tier.max_rank
        );

        if (rewardTier) {
          seasonResults.push({
            user_id: entry.user_id,
            season_id: season.id,
            final_xp: entry.total_xp,
            final_rank: entry.season_rank,
            reward_tier: rewardTier.tier,
            badge_icon: rewardTier.badge_icon,
          });
        }
      }

      // Insert all results
      if (seasonResults.length > 0) {
        const { error: insertError } = await supabaseAdmin
          .from('user_season_results')
          .upsert(seasonResults, { onConflict: 'user_id,season_id' });

        if (insertError) {
          console.error(`Error inserting season results for ${season.id}:`, insertError);
          continue;
        }
      }

      // Mark season as processed
      const { error: updateError } = await supabaseAdmin
        .from('seasons')
        .update({ processing_flag: true })
        .eq('id', season.id);

      if (updateError) {
        console.error(`Error updating season ${season.id}:`, updateError);
        continue;
      }

      results.push({
        season_id: season.id,
        season_name: season.name,
        processed_users: seasonResults.length,
      });
    }

    return new Response(
      JSON.stringify({ 
        message: 'Seasons processed successfully',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing seasons:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
