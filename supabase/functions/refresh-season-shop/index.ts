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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { seasonId } = await req.json();

    if (!seasonId) {
      return new Response(
        JSON.stringify({ error: 'Season ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Refreshing shop for season ${seasonId}`);

    // Sample cosmetic items for the new season
    const shopItems = [
      // Profile Rings
      {
        season_id: seasonId,
        name: 'Golden Aura Ring',
        description: 'Premium golden ring effect for your profile',
        category: 'profile_ring',
        rarity: 'legendary',
        cost: 500,
        is_premium_only: true,
        sort_order: 1,
      },
      {
        season_id: seasonId,
        name: 'Silver Glow Ring',
        description: 'Elegant silver ring effect',
        category: 'profile_ring',
        rarity: 'epic',
        cost: 300,
        is_premium_only: false,
        sort_order: 2,
      },
      {
        season_id: seasonId,
        name: 'Bronze Shimmer Ring',
        description: 'Subtle bronze ring effect',
        category: 'profile_ring',
        rarity: 'rare',
        cost: 150,
        is_premium_only: false,
        sort_order: 3,
      },
      
      // Post Frames
      {
        season_id: seasonId,
        name: 'Championship Frame',
        description: 'Prestigious frame for your posts',
        category: 'post_frame',
        rarity: 'legendary',
        cost: 400,
        is_premium_only: true,
        sort_order: 1,
      },
      {
        season_id: seasonId,
        name: 'Elite Frame',
        description: 'Stylish frame for top players',
        category: 'post_frame',
        rarity: 'epic',
        cost: 250,
        is_premium_only: false,
        sort_order: 2,
      },
      
      // Reaction Packs
      {
        season_id: seasonId,
        name: 'Pro Reactions',
        description: 'Exclusive professional reaction emojis',
        category: 'reaction_pack',
        rarity: 'legendary',
        cost: 350,
        is_premium_only: true,
        sort_order: 1,
      },
      {
        season_id: seasonId,
        name: 'Golf Vibes Pack',
        description: 'Fun golf-themed reactions',
        category: 'reaction_pack',
        rarity: 'rare',
        cost: 200,
        is_premium_only: false,
        sort_order: 2,
      },
      
      // Titles
      {
        season_id: seasonId,
        name: 'Golf Legend',
        description: 'Display yourself as a Golf Legend',
        category: 'title',
        rarity: 'legendary',
        cost: 450,
        is_premium_only: true,
        sort_order: 1,
      },
      {
        season_id: seasonId,
        name: 'Course Master',
        description: 'Show your course mastery',
        category: 'title',
        rarity: 'epic',
        cost: 300,
        is_premium_only: false,
        sort_order: 2,
      },
      {
        season_id: seasonId,
        name: 'Fairway Explorer',
        description: 'For the adventurous golfer',
        category: 'title',
        rarity: 'rare',
        cost: 150,
        is_premium_only: false,
        sort_order: 3,
      },
      
      // Themes
      {
        season_id: seasonId,
        name: 'Royal Theme',
        description: 'Luxurious royal color scheme',
        category: 'theme',
        rarity: 'legendary',
        cost: 600,
        is_premium_only: true,
        sort_order: 1,
      },
      {
        season_id: seasonId,
        name: 'Ocean Breeze Theme',
        description: 'Calming ocean colors',
        category: 'theme',
        rarity: 'epic',
        cost: 350,
        is_premium_only: false,
        sort_order: 2,
      },
    ];

    // Insert new shop items
    const { data: insertedItems, error: insertError } = await supabaseClient
      .from('season_shop_items')
      .insert(shopItems)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log(`Successfully added ${insertedItems?.length || 0} items to season ${seasonId} shop`);

    return new Response(
      JSON.stringify({
        success: true,
        itemsAdded: insertedItems?.length || 0,
        items: insertedItems,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error refreshing season shop:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
