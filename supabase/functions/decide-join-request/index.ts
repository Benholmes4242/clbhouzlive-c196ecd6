import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[decide-join-request] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { request_id, action } = await req.json();

    if (!request_id || !action || !['approve', 'decline'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST', message: 'request_id and action (approve|decline) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[decide-join-request] User ${user.id} ${action}ing request ${request_id}`);

    // Fetch the join request
    const { data: joinRequest, error: requestError } = await supabase
      .from('game_join_requests')
      .select('*, games(*)')
      .eq('id', request_id)
      .single();

    if (requestError || !joinRequest) {
      console.error('[decide-join-request] Request not found:', requestError);
      return new Response(
        JSON.stringify({ error: 'REQUEST_NOT_FOUND', message: 'Join request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the host
    if (joinRequest.games.host_user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN', message: 'Only the host can decide on requests' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify request is still pending
    if (joinRequest.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'ALREADY_DECIDED', message: 'Request has already been decided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify game is still active
    if (joinRequest.games.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game is no longer active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      // Check capacity
      const { data: participants } = await supabase
        .from('game_participants')
        .select('id')
        .eq('game_id', joinRequest.game_id);

      const confirmedCount = participants?.length || 0;

      if (confirmedCount >= joinRequest.games.slots_total) {
        // Update request to expired/full
        await supabase
          .from('game_join_requests')
          .update({
            status: 'declined',
            decided_at: new Date().toISOString(),
            decided_by: user.id,
          })
          .eq('id', request_id);

        return new Response(
          JSON.stringify({ error: 'GAME_FULL', message: 'Game is full' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add participant
      const { error: participantError } = await supabase
        .from('game_participants')
        .insert({
          game_id: joinRequest.game_id,
          user_id: joinRequest.requester_user_id,
          role: 'player',
          state: 'confirmed',
          joined_at: new Date().toISOString(),
          added_by_user_id: user.id,
        });

      if (participantError) {
        console.error('[decide-join-request] Participant insert error:', participantError);
        return new Response(
          JSON.stringify({ error: 'INSERT_FAILED', message: 'Failed to add participant' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update slots_open
      const newSlotsOpen = Math.max(0, joinRequest.games.slots_open - 1);
      await supabase
        .from('games')
        .update({ slots_open: newSlotsOpen })
        .eq('id', joinRequest.game_id);
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('game_join_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'declined',
        decided_at: new Date().toISOString(),
        decided_by: user.id,
      })
      .eq('id', request_id);

    if (updateError) {
      console.error('[decide-join-request] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'UPDATE_FAILED', message: 'Failed to update request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[decide-join-request] Request ${action}d successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        status: action === 'approve' ? 'approved' : 'declined',
        slots_open: action === 'approve' ? joinRequest.games.slots_open - 1 : joinRequest.games.slots_open,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[decide-join-request] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
