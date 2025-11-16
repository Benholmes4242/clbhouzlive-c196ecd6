import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cors } from '../_shared/cors.ts';

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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('User error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { seasonId } = await req.json();

    if (!seasonId) {
      return new Response(
        JSON.stringify({ error: 'Season ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing premium pass upgrade for user ${user.id}, season ${seasonId}`);

    // 1. Upsert premium pass tier
    const { error: tierError } = await supabaseClient
      .from('season_pass_tiers')
      .upsert({
        user_id: user.id,
        season_id: seasonId,
        tier: 'premium',
        purchased_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,season_id'
      });

    if (tierError) {
      console.error('Tier error:', tierError);
      throw tierError;
    }

    // 2. Get all premium-only items for this season
    const { data: premiumItems, error: itemsError } = await supabaseClient
      .from('season_shop_items')
      .select('id')
      .eq('season_id', seasonId)
      .eq('is_premium_only', true)
      .eq('is_active', true);

    if (itemsError) {
      console.error('Items error:', itemsError);
      throw itemsError;
    }

    // 3. Unlock all premium items
    if (premiumItems && premiumItems.length > 0) {
      const unlocks = premiumItems.map(item => ({
        user_id: user.id,
        item_id: item.id,
        unlocked_at: new Date().toISOString(),
      }));

      const { error: unlockError } = await supabaseClient
        .from('user_cosmetic_unlocks')
        .upsert(unlocks, {
          onConflict: 'user_id,item_id',
          ignoreDuplicates: true
        });

      if (unlockError) {
        console.error('Unlock error:', unlockError);
        throw unlockError;
      }
    }

    // 4. Grant bonus currency (500 coins)
    const { error: currencyError } = await supabaseClient
      .from('user_season_currency')
      .upsert({
        user_id: user.id,
        balance: 500,
        lifetime_earned: 500,
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (currencyError) {
      console.error('Currency error:', currencyError);
      throw currencyError;
    }

    // 5. Send notification
    const { error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'season_pass_upgrade',
        title: 'Premium Pass Activated!',
        message: 'You now have access to premium rewards, exclusive cosmetics, and 500 bonus coins!',
        data: { season_id: seasonId },
      });

    if (notificationError) {
      console.error('Notification error:', notificationError);
      // Don't throw - notification is non-critical
    }

    console.log(`Successfully upgraded user ${user.id} to premium for season ${seasonId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Premium pass activated',
        unlockedItems: premiumItems?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing season pass:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
