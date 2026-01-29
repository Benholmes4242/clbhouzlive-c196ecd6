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

    console.log('User accepting reserved seat:', { user_id: user.id, game_id });

    // Find the participant row for this user
    const { data: participant, error: findError } = await supabase
      .from('game_participants')
      .select('*, games!inner(*)')
      .eq('game_id', game_id)
      .eq('user_id', user.id)
      .eq('state', 'invited')
      .single();

    if (findError || !participant) {
      throw new Error('No pending invitation found for this game');
    }

    // Update participant to accepted
    const { error: updateError } = await supabase
      .from('game_participants')
      .update({
        state: 'accepted',
        joined_at: new Date().toISOString()
      })
      .eq('id', participant.id);

    if (updateError) throw updateError;

    console.log('Participant accepted seat');

    // Check if thread exists, create if needed
    let { data: thread } = await supabase
      .from('game_threads')
      .select('id')
      .eq('game_id', game_id)
      .single();

    if (!thread) {
      const { data: newThread, error: threadError } = await supabase
        .from('game_threads')
        .insert({
          game_id: game_id,
          expires_at: participant.games.start_time,
          grace_hours: 12,
          is_closed: false
        })
        .select()
        .single();

      if (threadError) throw threadError;
      thread = newThread;

      // Add host to thread
      await supabase.from('game_thread_participants').insert({
        thread_id: thread.id,
        user_id: participant.games.host_user_id,
        role: 'host'
      });

      // System message
      await supabase.from('game_thread_messages').insert({
        thread_id: thread.id,
        sender_id: participant.games.host_user_id,
        text: 'Game chat created! Coordinate your tee time here.',
        is_system: true
      });
    }

    // Add user to thread participants
    await supabase.from('game_thread_participants').insert({
      thread_id: thread.id,
      user_id: user.id,
      role: 'player'
    });

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
      type: 'seat_accepted',
      title: 'Seat confirmed',
      message: `${userName} confirmed their reserved seat. Open chat to coordinate.`,
      data: {
        game_id: game_id,
        thread_id: thread.id,
        user_name: userName
      }
    });

    return new Response(
      JSON.stringify({ success: true, thread_id: thread.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in game-tag-accept:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});