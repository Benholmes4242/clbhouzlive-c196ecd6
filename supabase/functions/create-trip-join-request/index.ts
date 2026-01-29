/**
 * create-trip-join-request - Creates a join request for a trip
 * 
 * Mirrors create-join-request for games:
 * - Uses trip_participants table with rsvp_status = 'requested'
 * - Blocks re-requests after rejection
 * - Supports optional message field
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
      console.error('[create-trip-join-request] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trip_id, message } = await req.json();

    if (!trip_id) {
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST', message: 'trip_id is required' }),
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

    console.log(`[create-trip-join-request] User ${user.id} requesting to join trip ${trip_id}`);

    // Fetch trip details
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, created_by, status, start_date, max_participants')
      .eq('id', trip_id)
      .single();

    if (tripError || !trip) {
      console.error('[create-trip-join-request] Trip not found:', tripError);
      return new Response(
        JSON.stringify({ error: 'TRIP_NOT_FOUND', message: 'Trip not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validation checks
    if (trip.created_by === user.id) {
      return new Response(
        JSON.stringify({ error: 'IS_ORGANIZER', message: 'Cannot request to join your own trip' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trip.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'TRIP_NOT_AVAILABLE', message: 'Trip is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(trip.start_date) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'TRIP_NOT_AVAILABLE', message: 'Trip has already started' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check existing participant row
    const { data: existingParticipant } = await supabase
      .from('trip_participants')
      .select('id, rsvp_status')
      .eq('trip_id', trip_id)
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
      
      // Block re-requests after rejection
      if (status === 'rejected') {
        return new Response(
          JSON.stringify({ error: 'TRIP_NOT_AVAILABLE', message: 'Trip is no longer available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Check capacity
    if (trip.max_participants !== null) {
      const { count } = await supabase
        .from('trip_participants')
        .select('*', { count: 'exact', head: true })
        .eq('trip_id', trip_id)
        .in('rsvp_status', ['going', 'invited']);

      if (count !== null && count >= trip.max_participants) {
        return new Response(
          JSON.stringify({ error: 'TRIP_NOT_AVAILABLE', message: 'Trip is full' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create participant row with rsvp_status = 'requested'
    const { data: participant, error: insertError } = await supabase
      .from('trip_participants')
      .insert({
        trip_id,
        user_id: user.id,
        role: 'participant',
        rsvp_status: 'requested',
        rsvp_updated_at: new Date().toISOString(),
        request_message: sanitizedMessage,
        request_message_updated_at: sanitizedMessage ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[create-trip-join-request] Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'INSERT_FAILED', message: 'Failed to create request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-trip-join-request] Request created successfully:`, participant.id);

    // Notify trip organizer
    const { data: requesterProfile } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const requesterName = requesterProfile?.display_name || 'Someone';
    
    // Build notification message with optional message preview
    let notificationMessage = `${requesterName} wants to join your trip.`;
    if (sanitizedMessage) {
      const preview = sanitizedMessage.slice(0, 80);
      notificationMessage = `${requesterName} wants to join: "${preview}${sanitizedMessage.length > 80 ? '…' : ''}"`;
    }

    await supabase.from('notifications').insert({
      user_id: trip.created_by,
      recipient_actor_type: 'personal',
      recipient_actor_id: trip.created_by,
      actor_id: user.id,
      type: 'trip_join_requested',
      title: 'New join request',
      message: notificationMessage,
      data: {
        trip_id,
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
    console.error('[create-trip-join-request] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
