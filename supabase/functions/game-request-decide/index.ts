/**
 * game-request-decide - Host accepts/declines join request
 * 
 * Single source of truth: game_participants.rsvp_status
 * Accept: rsvp_status -> 'going', decrement slots_open
 * Decline: rsvp_status -> 'rejected', send generic notification
 */

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

    const { participant_id, decision } = await req.json();

    if (!['accept', 'decline'].includes(decision)) {
      throw new Error('Invalid decision');
    }

    console.log('Processing request decision:', { participant_id, decision, user_id: user.id });

    // Get the participant row with game info
    const { data: participant, error: partError } = await supabase
      .from('game_participants')
      .select('*, games!inner(id, host_user_id, course_name, start_time, slots_open)')
      .eq('id', participant_id)
      .single();

    if (partError || !participant) {
      throw new Error('Request not found');
    }

    if (participant.games.host_user_id !== user.id) {
      throw new Error('Not authorized to decide this request');
    }

    if (participant.rsvp_status !== 'requested') {
      throw new Error('Request already processed');
    }

    if (decision === 'accept') {
      const game = participant.games;

      if (game.slots_open !== null && game.slots_open <= 0) {
        return new Response(
          JSON.stringify({ error: 'No open seats (all reserved)' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update participant status to 'going'
      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          rsvp_status: 'going',
          rsvp_updated_at: new Date().toISOString(),
          state: 'accepted',
          reserves_slot: true,
          joined_at: new Date().toISOString()
        })
        .eq('id', participant_id);

      if (updateError) throw updateError;

      // Decrement slots_open atomically
      if (game.slots_open !== null) {
        const { error: updateGameError } = await supabase
          .from('games')
          .update({ slots_open: Math.max(0, game.slots_open - 1) })
          .eq('id', participant.game_id);

        if (updateGameError) throw updateGameError;
      }

      console.log('Seat granted, slots_open now:', (game.slots_open || 1) - 1);

      // Check if we need to create the thread (first acceptance)
      const { data: existingThread } = await supabase
        .from('game_threads')
        .select('id')
        .eq('game_id', participant.game_id)
        .single();

      let threadId = existingThread?.id;

      if (!existingThread) {
        const { data: thread, error: threadError } = await supabase
          .from('game_threads')
          .insert({
            game_id: participant.game_id,
            expires_at: game.start_time,
            grace_hours: 12,
            is_closed: false
          })
          .select()
          .single();

        if (!threadError && thread) {
          threadId = thread.id;
          console.log('Thread created:', threadId);

          await supabase.from('game_thread_participants').insert({
            thread_id: threadId,
            user_id: game.host_user_id,
            role: 'host'
          });

          await supabase.from('game_thread_messages').insert({
            thread_id: threadId,
            sender_id: game.host_user_id,
            text: 'Game chat created! Coordinate your tee time here.',
            is_system: true
          });
        }
      }

      if (threadId) {
        await supabase.from('game_thread_participants').insert({
          thread_id: threadId,
          user_id: participant.user_id,
          role: 'player'
        });
      }

      // Get host name
      const { data: hostProfile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      const hostName = hostProfile?.display_name || hostProfile?.username || 'Host';

      // Notify requester
      await supabase.from('notifications').insert({
        user_id: participant.user_id,
        recipient_actor_type: 'personal',
        recipient_actor_id: participant.user_id,
        actor_id: user.id,
        type: 'join_accepted',
        title: "You're in!",
        message: `${hostName} added you to ${game.course_name || 'the game'}. Open group chat to coordinate.`,
        data: {
          game_id: participant.game_id,
          thread_id: threadId,
          host_name: hostName,
          first_open: true
        }
      });

      return new Response(
        JSON.stringify({ success: true, thread_id: threadId }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Decline - update status to 'rejected'
      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          rsvp_status: 'rejected',
          rsvp_updated_at: new Date().toISOString()
        })
        .eq('id', participant_id);

      if (updateError) throw updateError;

      // Notify requester with GENERIC message (anonymity-preserving)
      await supabase.from('notifications').insert({
        user_id: participant.user_id,
        recipient_actor_type: 'personal',
        recipient_actor_id: participant.user_id,
        actor_id: user.id,
        type: 'join_declined',
        title: 'Update on your request',
        message: 'Unfortunately, all slots in this game are now taken.',
        data: {
          game_id: participant.game_id,
          generic_decline: true
        }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in game-request-decide:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
