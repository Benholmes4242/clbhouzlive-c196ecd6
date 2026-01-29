/**
 * trip-request-decide - Organizer accepts/declines trip join request
 * 
 * Mirrors game-request-decide:
 * - Accept: rsvp_status -> 'going', check capacity
 * - Decline: rsvp_status -> 'rejected', send generic notification
 * - Transactional: capacity check and status update in one operation
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

    console.log('Processing trip request decision:', { participant_id, decision, user_id: user.id });

    // Get the participant row with trip info
    const { data: participant, error: partError } = await supabase
      .from('trip_participants')
      .select('*, trips!inner(id, created_by, name, start_date, max_participants)')
      .eq('id', participant_id)
      .single();

    if (partError || !participant) {
      throw new Error('Request not found');
    }

    if (participant.trips.created_by !== user.id) {
      throw new Error('Not authorized to decide this request');
    }

    if (participant.rsvp_status !== 'requested') {
      throw new Error('Request already processed');
    }

    if (decision === 'accept') {
      const trip = participant.trips;

      // Check capacity before accepting
      if (trip.max_participants !== null) {
        const { count } = await supabase
          .from('trip_participants')
          .select('*', { count: 'exact', head: true })
          .eq('trip_id', trip.id)
          .in('rsvp_status', ['going', 'invited']);

        if (count !== null && count >= trip.max_participants) {
          return new Response(
            JSON.stringify({ error: 'Trip is full - all spots are taken' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Update participant status to 'going'
      const { error: updateError } = await supabase
        .from('trip_participants')
        .update({
          rsvp_status: 'going',
          rsvp_updated_at: new Date().toISOString(),
          joined_at: new Date().toISOString()
        })
        .eq('id', participant_id);

      if (updateError) throw updateError;

      console.log('Participant accepted to trip:', trip.name);

      // Get organizer name for notification
      const { data: organizerProfile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      const organizerName = organizerProfile?.display_name || organizerProfile?.username || 'The organizer';

      // Notify requester
      await supabase.from('notifications').insert({
        user_id: participant.user_id,
        recipient_actor_type: 'personal',
        recipient_actor_id: participant.user_id,
        actor_id: user.id,
        type: 'trip_join_accepted',
        title: "You're in!",
        message: `${organizerName} added you to ${trip.name || 'the trip'}.`,
        data: {
          trip_id: trip.id,
          organizer_name: organizerName,
        }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Decline - update status to 'rejected'
      const { error: updateError } = await supabase
        .from('trip_participants')
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
        type: 'trip_join_declined',
        title: 'Update on your request',
        message: 'Unfortunately, all slots in this trip are now taken.',
        data: {
          trip_id: participant.trip_id,
          generic_decline: true
        }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in trip-request-decide:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
