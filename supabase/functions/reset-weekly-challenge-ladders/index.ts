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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - now.getDay() - 6); // Previous Monday
    lastWeekStart.setHours(0, 0, 0, 0);

    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 7);

    console.log('Resetting weekly ladders for:', { lastWeekStart, lastWeekEnd });

    // Get current season
    const { data: currentSeason } = await supabase
      .from('seasons')
      .select('*')
      .lte('starts_at', now.toISOString())
      .gte('ends_at', now.toISOString())
      .single();

    if (!currentSeason) {
      console.log('No active season found');
      return new Response(JSON.stringify({ message: 'No active season' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate ranks for last week
    const { data: ladderEntries } = await supabase
      .from('weekly_challenge_ladder')
      .select('*')
      .eq('season_id', currentSeason.id)
      .eq('week_start', lastWeekStart.toISOString())
      .order('points', { ascending: false });

    if (ladderEntries && ladderEntries.length > 0) {
      // Update ranks
      for (let i = 0; i < ladderEntries.length; i++) {
        const entry = ladderEntries[i];
        await supabase
          .from('weekly_challenge_ladder')
          .update({ rank: i + 1 })
          .eq('id', entry.id);

        // Award rewards to top 10
        if (i < 10) {
          const rewardAmount = i === 0 ? 500 : i < 3 ? 300 : i < 5 ? 200 : 100;
          
          await supabase.from('user_shop_currency_ledger').insert({
            user_id: entry.user_id,
            amount: rewardAmount,
            source: 'weekly_ladder_reward',
            description: `Week ${i + 1} ladder reward (Rank #${i + 1})`,
          });
        }
      }
    }

    // Initialize new week entries for all active users
    const newWeekStart = new Date(now);
    newWeekStart.setDate(now.getDate() - now.getDay() + 1); // This Monday
    newWeekStart.setHours(0, 0, 0, 0);

    const newWeekEnd = new Date(newWeekStart);
    newWeekEnd.setDate(newWeekStart.getDate() + 7);

    const { data: activeUsers } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1000);

    if (activeUsers) {
      const newEntries = activeUsers.map(user => ({
        user_id: user.id,
        season_id: currentSeason.id,
        week_start: newWeekStart.toISOString(),
        week_end: newWeekEnd.toISOString(),
        points: 0,
      }));

      await supabase.from('weekly_challenge_ladder').insert(newEntries);
    }

    console.log('Weekly ladder reset complete');

    return new Response(
      JSON.stringify({
        success: true,
        lastWeek: { start: lastWeekStart, end: lastWeekEnd },
        newWeek: { start: newWeekStart, end: newWeekEnd },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error resetting weekly ladders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
