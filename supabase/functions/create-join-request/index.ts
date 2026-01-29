/**
 * create-join-request - Creates a join request using game_participants.rsvp_status
 * 
 * Single source of truth: game_participants table with rsvp_status = 'requested'
 * Blocks re-requests after rejection (rsvp_status = 'rejected')
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[create-join-request] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { game_id, message } = await req.json();

    if (!game_id) {
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST', message: 'game_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize message: trim, max 240 chars, empty becomes null
    let sanitizedMessage: string | null = null;
    if (message && typeof message === 'string') {
      const trimmed = message.trim();
      if (trimmed.length > 0) {
        sanitizedMessage = trimmed.slice(0, 240);
      }
    }

    console.log(`[create-join-request] User ${user.id} requesting to join game ${game_id}`);

    // Fetch game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, host_user_id, status, start_time, slots_total, slots_open')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      console.error('[create-join-request] Game not found:', gameError);
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_FOUND', message: 'Game not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation checks
    if (game.host_user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'IS_HOST', message: 'Cannot request to join your own game' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['active', 'scheduled'].includes(game.status)) {
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(game.start_time) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game has already started' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check existing participant row (single source of truth)
    const { data: existingParticipant } = await supabase
      .from('game_participants')
      .select('id, rsvp_status')
      .eq('game_id', game_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingParticipant) {
      const status = existingParticipant.rsvp_status;
      
      if (status === 'going' || status === 'invited') {
        return new Response(
          JSON.stringify({ error: 'ALREADY_JOINED', message: 'Already a participant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (status === 'requested') {
        return new Response(
          JSON.stringify({ error: 'ALREADY_REQUESTED', message: 'Request already pending' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Block re-requests after rejection - game disappears from discover
      if (status === 'rejected') {
        return new Response(
          JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game is no longer available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check slots
    if (game.slots_open !== null && game.slots_open <= 0) {
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game is full' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create participant row with rsvp_status = 'requested'
    const { data: participant, error: insertError } = await supabase
      .from('game_participants')
      .insert({
        game_id,
        user_id: user.id,
        role: 'player',
        rsvp_status: 'requested',
        rsvp_updated_at: new Date().toISOString(),
        request_message: sanitizedMessage,
        request_message_updated_at: sanitizedMessage ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[create-join-request] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'INSERT_FAILED', message: 'Failed to create request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-join-request] Request created successfully:`, participant.id);

    // Notify host
    const { data: requesterProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const requesterName = requesterProfile?.display_name || 'Someone';
    
    // Build notification message with optional message preview
    let notificationMessage = `${requesterName} wants to join your game.`;
    if (sanitizedMessage) {
      const preview = sanitizedMessage.slice(0, 80);
      notificationMessage = `${requesterName} wants to join: "${preview}${sanitizedMessage.length > 80 ? '…' : ''}"`;
    }

    await supabase.from('notifications').insert({
      user_id: game.host_user_id,
      recipient_actor_type: 'personal',
      recipient_actor_id: game.host_user_id,
      actor_id: user.id,
      type: 'game_join_requested',
      title: 'New join request',
      message: notificationMessage,
      data: {
        game_id,
        requester_id: user.id,
        participant_id: participant.id,
        has_message: !!sanitizedMessage,
      }
    });

    return new Response(
      JSON.stringify({ success: true, status: 'requested', participant_id: participant.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[create-join-request] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
