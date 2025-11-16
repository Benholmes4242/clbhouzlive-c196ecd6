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
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    console.log('Calculating streaks for:', yesterday);

    // Get all users with streaks
    const { data: allStreaks } = await supabase
      .from('streaks')
      .select('*');

    let updated = 0;
    let maintained = 0;
    let broken = 0;

    for (const streak of allStreaks || []) {
      // Check if user had qualifying activity yesterday
      const { data: activities } = await supabase
        .from('user_courses')
        .select('id')
        .eq('user_id', streak.user_id)
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .limit(1);

      const hadActivity = activities && activities.length > 0;

      if (hadActivity) {
        // Increment streak
        const newDailyStreak = streak.daily_streak + 1;
        
        await supabase
          .from('streaks')
          .update({
            daily_streak: newDailyStreak,
            last_daily_action: yesterday.toISOString(),
          })
          .eq('user_id', streak.user_id);

        // Award streak rewards
        if (newDailyStreak % 7 === 0) {
          // Weekly milestone
          const reward = Math.floor(newDailyStreak / 7) * 50;
          await supabase.from('user_shop_currency_ledger').insert({
            user_id: streak.user_id,
            amount: reward,
            source: 'streak_reward',
            description: `${newDailyStreak}-day streak milestone`,
          });
        }

        maintained++;
      } else {
        // Check if streak should break
        const lastAction = streak.last_daily_action ? new Date(streak.last_daily_action) : null;
        if (lastAction) {
          const daysSince = Math.floor((yesterday.getTime() - lastAction.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSince > 1) {
            // Streak broken
            await supabase
              .from('streaks')
              .update({
                daily_streak: 0,
              })
              .eq('user_id', streak.user_id);
            
            broken++;
          }
        }
      }

      updated++;
    }

    console.log('Streak calculation complete:', { updated, maintained, broken });

    return new Response(
      JSON.stringify({
        success: true,
        updated,
        maintained,
        broken,
        date: yesterday,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
