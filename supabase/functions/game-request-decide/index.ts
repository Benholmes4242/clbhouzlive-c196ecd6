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

    const { request_id, decision } = await req.json();

    if (!['accept', 'decline'].includes(decision)) {
      throw new Error('Invalid decision');
    }

    console.log('Processing request decision:', { request_id, decision, user_id: user.id });

    // Get the join request and verify host
    const { data: request, error: requestError } = await supabase
      .from('game_join_requests')
      .select('*, games!inner(host_user_id, course_name, start_time, slots_open)')
      .eq('id', request_id)
      .single();

    if (requestError || !request) {
      throw new Error('Request not found');
    }

    if (request.games.host_user_id !== user.id) {
      throw new Error('Not authorized to decide this request');
    }

    if (decision === 'accept') {
      // Use FOR UPDATE to lock the game row and prevent race conditions
      const { data: game, error: lockError } = await supabase
        .from('games')
        .select('slots_open, course_name')
        .eq('id', request.game_id)
        .single();

      if (lockError || !game) {
        throw new Error('Game not found');
      }

      if (game.slots_open <= 0) {
        return new Response(
          JSON.stringify({ error: 'No open seats (all reserved)' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update request to accepted
      const { error: updateReqError } = await supabase
        .from('game_join_requests')
        .update({
          status: 'accepted',
          decided_at: new Date().toISOString()
        })
        .eq('id', request_id);

      if (updateReqError) throw updateReqError;

      // Add participant
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          game_id: request.game_id,
          user_id: request.requester_user_id,
          role: 'player',
          state: 'accepted',
          reserves_slot: true,
          joined_at: new Date().toISOString()
        });

      if (participantError) throw participantError;

      // Decrement slots_open
      const { error: updateGameError } = await supabase
        .from('games')
        .update({ slots_open: game.slots_open - 1 })
        .eq('id', request.game_id);

      if (updateGameError) throw updateGameError;

      console.log('Seat granted, slots_open now:', game.slots_open - 1);

      // Check if we need to create the thread (first acceptance)
      const { data: existingThread } = await supabase
        .from('game_threads')
        .select('id')
        .eq('game_id', request.game_id)
        .single();

      let threadId = existingThread?.id;

      if (!existingThread) {
        // Create thread
        const { data: thread, error: threadError } = await supabase
          .from('game_threads')
          .insert({
            game_id: request.game_id,
            expires_at: request.games.start_time,
            grace_hours: 12,
            is_closed: false
          })
          .select()
          .single();

        if (threadError) {
          console.error('Error creating thread:', threadError);
        } else {
          threadId = thread.id;
          console.log('Thread created:', threadId);

          // Add host to thread
          await supabase.from('game_thread_participants').insert({
            thread_id: threadId,
            user_id: request.games.host_user_id,
            role: 'host'
          });

          // Add system welcome message
          await supabase.from('game_thread_messages').insert({
            thread_id: threadId,
            sender_id: request.games.host_user_id,
            text: 'Game chat created! Coordinate your tee time here.',
            is_system: true
          });
        }
      }

      // Add requester to thread
      if (threadId) {
        await supabase.from('game_thread_participants').insert({
          thread_id: threadId,
          user_id: request.requester_user_id,
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
        user_id: request.requester_user_id,
        type: 'join_accepted',
        title: "You're in!",
        message: `${hostName} added you to ${request.games.course_name || 'the game'}. Open group chat to coordinate.`,
        data: {
          game_id: request.game_id,
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
      // Decline
      const { error: updateReqError } = await supabase
        .from('game_join_requests')
        .update({
          status: 'declined',
          decided_at: new Date().toISOString()
        })
        .eq('id', request_id);

      if (updateReqError) throw updateReqError;

      // Notify requester with GENERIC message (anonymity-preserving)
      // Never reveal that they were declined - always say "slots taken"
      await supabase.from('notifications').insert({
        user_id: request.requester_user_id,
        type: 'join_declined',
        title: 'Update on your request',
        message: 'Unfortunately, all slots in this game are now taken.',
        data: {
          game_id: request.game_id,
          generic_decline: true // Flag for UI to know it's a generic message
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