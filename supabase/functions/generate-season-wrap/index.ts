import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WrapCard {
  type: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seasonId, userId } = await req.json();

    if (!seasonId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing seasonId or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Generating season wrap for:', { seasonId, userId });

    const cards: WrapCard[] = [];

    // Get season details
    const { data: season } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single();

    if (!season) {
      throw new Error('Season not found');
    }

    // 1. Total XP earned
    const { data: userSeasonXP } = await supabase
      .from('user_season_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .eq('season_id', seasonId)
      .single();

    if (userSeasonXP) {
      cards.push({
        type: 'xp',
        title: 'Total XP Earned',
        value: userSeasonXP.total_xp.toLocaleString(),
        subtitle: `In ${season.name}`,
        icon: '⚡',
      });
    }

    // 2. Courses played
    const { count: coursesCount } = await supabase
      .from('user_courses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('played', true)
      .gte('created_at', season.starts_at)
      .lte('created_at', season.ends_at);

    cards.push({
      type: 'courses',
      title: 'Courses Played',
      value: coursesCount || 0,
      subtitle: 'Unique courses visited',
      icon: '⛳',
    });

    // 3. Top 100 progress
    const { count: top100Count } = await supabase
      .from('user_courses')
      .select('c:golf_courses!inner(*)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('played', true)
      .not('golf_courses.global_rank', 'is', null)
      .gte('created_at', season.starts_at)
      .lte('created_at', season.ends_at);

    if (top100Count && top100Count > 0) {
      cards.push({
        type: 'top100',
        title: 'Top 100 Courses',
        value: top100Count,
        subtitle: 'Played this season',
        icon: '🏆',
      });
    }

    // 4. Posts created
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', season.starts_at)
      .lte('created_at', season.ends_at);

    cards.push({
      type: 'posts',
      title: 'Moments Shared',
      value: postsCount || 0,
      subtitle: 'Your golf journey',
      icon: '📸',
    });

    // 5. Final rank
    const { data: seasonResult } = await supabase
      .from('user_season_results')
      .select('final_rank')
      .eq('user_id', userId)
      .eq('season_id', seasonId)
      .single();

    if (seasonResult) {
      cards.push({
        type: 'rank',
        title: 'Final Season Rank',
        value: `#${seasonResult.final_rank}`,
        subtitle: 'Out of all players',
        icon: '🎖️',
      });
    }

    // 6. Countries visited
    const { data: countries } = await supabase
      .from('user_courses')
      .select('golf_courses!inner(country)')
      .eq('user_id', userId)
      .eq('played', true)
      .gte('created_at', season.starts_at)
      .lte('created_at', season.ends_at);

    if (countries) {
      const uniqueCountries = new Set(countries.map((c: any) => c.golf_courses?.country));
      cards.push({
        type: 'countries',
        title: 'Countries Explored',
        value: uniqueCountries.size,
        subtitle: 'Golf destinations',
        icon: '🌍',
      });
    }

    // Store wrap cards
    await supabase.from('season_wrap_cards').upsert({
      user_id: userId,
      season_id: seasonId,
      cards: JSON.stringify(cards),
      viewed: false,
    });

    console.log('Season wrap generated:', cards.length, 'cards');

    return new Response(
      JSON.stringify({
        success: true,
        cards,
        seasonName: season.name,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating season wrap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
