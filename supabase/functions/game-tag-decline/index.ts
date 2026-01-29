import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

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

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(' ')[1]);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { game_id } = await req.json();

    console.log('User declining reserved seat:', { user_id: user.id, game_id });

    // Find the participant row
    const { data: participant, error: findError } = await supabase
      .from('game_participants')
      .select('*, games!inner(host_user_id, slots_open, course_name)')
      .eq('game_id', game_id)
      .eq('user_id', user.id)
      .eq('state', 'invited')
      .single();

    if (findError || !participant) {
      throw new Error('No pending invitation found');
    }

    // Update participant to declined
    const { error: updateError } = await supabase
      .from('game_participants')
      .update({
        state: 'declined',
        reserves_slot: false
      })
      .eq('id', participant.id);

    if (updateError) throw updateError;

    // Increment slots_open since seat was released
    const { error: gameError } = await supabase
      .from('games')
      .update({ slots_open: participant.games.slots_open + 1 })
      .eq('id', game_id);

    if (gameError) throw gameError;

    console.log('Seat released, slots_open now:', participant.games.slots_open + 1);

    // Get user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    const userName = userProfile?.display_name || userProfile?.username || 'Someone';

    // Notify host
    await supabase.from('notifications').insert({
      user_id: participant.games.host_user_id,
      recipient_actor_type: 'personal',
      recipient_actor_id: participant.games.host_user_id,
      actor_id: user.id,
      type: 'seat_declined',
      title: 'Seat declined',
      message: `${userName} declined their reserved seat for ${participant.games.course_name || 'your game'}.`,
      data: {
        game_id: game_id,
        user_name: userName
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in game-tag-decline:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});