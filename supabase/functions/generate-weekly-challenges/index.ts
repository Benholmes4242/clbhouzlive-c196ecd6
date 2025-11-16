import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChallengeTemplate {
  title: string;
  description: string;
  category: 'exploration' | 'skill' | 'social';
  metric: string;
  target: number;
  xpReward: number;
  shopCurrencyReward: number;
}

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
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    console.log('Generating weekly challenges for:', { weekStart, weekEnd });

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

    // Global challenge templates
    const globalTemplates: ChallengeTemplate[] = [
      {
        title: 'Weekend Warrior',
        description: 'Play 3 courses this week',
        category: 'exploration',
        metric: 'courses_played_week',
        target: 3,
        xpReward: 150,
        shopCurrencyReward: 50,
      },
      {
        title: 'Social Butterfly',
        description: 'Post 5 moments this week',
        category: 'social',
        metric: 'moments_posted_week',
        target: 5,
        xpReward: 120,
        shopCurrencyReward: 40,
      },
      {
        title: 'Course Critic',
        description: 'Submit 2 course reviews',
        category: 'social',
        metric: 'reviews_posted_week',
        target: 2,
        xpReward: 180,
        shopCurrencyReward: 60,
      },
    ];

    const createdChallenges = [];

    // Create global challenges
    for (const template of globalTemplates) {
      const { data: challenge } = await supabase
        .from('challenges')
        .insert({
          title: template.title,
          description: template.description,
          type: 'weekly',
          category: template.category,
          xp_reward: template.xpReward,
          shop_currency_reward: template.shopCurrencyReward,
          start_at: weekStart.toISOString(),
          end_at: weekEnd.toISOString(),
          auto_generated: true,
          is_active: true,
        })
        .select()
        .single();

      if (challenge) {
        // Create requirement
        await supabase.from('challenge_requirements').insert({
          challenge_id: challenge.id,
          metric: template.metric,
          target: template.target,
        });

        createdChallenges.push(challenge);
      }
    }

    // Regional challenges (simplified - create one per major region)
    const regionalTemplates = [
      {
        title: 'Explore Your Region',
        description: 'Play 2 new courses in your area',
        metric: 'new_courses_played_week',
        target: 2,
        xpReward: 200,
        shopCurrencyReward: 75,
      },
    ];

    for (const template of regionalTemplates) {
      const { data: challenge } = await supabase
        .from('challenges')
        .insert({
          title: template.title,
          description: template.description,
          type: 'regional',
          category: 'exploration',
          xp_reward: template.xpReward,
          shop_currency_reward: template.shopCurrencyReward,
          start_at: weekStart.toISOString(),
          end_at: weekEnd.toISOString(),
          auto_generated: true,
          is_active: true,
        })
        .select()
        .single();

      if (challenge) {
        await supabase.from('challenge_requirements').insert({
          challenge_id: challenge.id,
          metric: template.metric,
          target: template.target,
        });

        createdChallenges.push(challenge);
      }
    }

    console.log('Created challenges:', createdChallenges.length);

    return new Response(
      JSON.stringify({
        success: true,
        challengesCreated: createdChallenges.length,
        weekStart,
        weekEnd,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating challenges:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
