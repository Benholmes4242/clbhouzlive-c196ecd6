/**
 * trip-create - Edge function for creating trips with notifications
 * 
 * Mirrors game-create:
 * - Creates trip atomically
 * - Adds organizer as participant
 * - Creates games for each itinerary stop
 * - Invites attendees with notifications
 * - Supports guest attendees
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ItineraryStop {
  course_id: string;
  course_name: string;
  day_index: number;
  play_date_time?: string;
  notes?: string;
}

interface GuestAttendee {
  name: string;
}

interface TripCreateRequest {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  visibility: 'invite' | 'friends' | 'club';
  itinerary: ItineraryStop[];
  invited_user_ids: string[];
  guests: GuestAttendee[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use anon key + JWT so auth.uid() works in RLS policies
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[trip-create] Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('[trip-create] Authenticated user ID:', user.id);

    const body: TripCreateRequest = await req.json();
    const {
      name,
      description,
      start_date,
      end_date,
      visibility = 'invite',
      itinerary = [],
      invited_user_ids = [],
      guests = [],
    } = body;

    // Validate required fields
    if (!name || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, start_date, end_date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (itinerary.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Trip must have at least one course in itinerary' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    if (endDate < startDate) {
      return new Response(
        JSON.stringify({ error: 'End date must be after start date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[trip-create] Creating trip:', { 
      name, 
      start_date, 
      end_date,
      visibility,
      itinerary_count: itinerary.length,
      invited_count: invited_user_ids.length,
      guest_count: guests.length
    });

    // 1. Create the trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        created_by: user.id,
        name,
        description: description || null,
        start_date,
        end_date,
        visibility,
        status: 'active',
      })
      .select('id, name')
      .single();

    if (tripError) {
      console.error('[trip-create] Failed to create trip:', tripError);
      throw new Error(`Failed to create trip: ${tripError.message}`);
    }

    console.log('[trip-create] Trip created:', trip.id);

    // 2. Add organizer as participant
    const { error: organizerError } = await supabase
      .from('trip_participants')
      .insert({
        trip_id: trip.id,
        user_id: user.id,
        role: 'organizer',
        rsvp_status: 'going',
        rsvp_updated_at: new Date().toISOString(),
      });

    if (organizerError) {
      console.error('[trip-create] Failed to add organizer:', organizerError);
      // Non-fatal, continue
    }

    // 3. Create games for each itinerary stop
    const gameErrors: { course_id: string; error: string }[] = [];
    const createdGameIds: string[] = [];

    for (const stop of itinerary) {
      const stopDate = new Date(start_date);
      stopDate.setDate(stopDate.getDate() + stop.day_index);
      stopDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      const gameExpiresAt = new Date(stopDate.getTime() + 24 * 60 * 60 * 1000);

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          host_user_id: user.id,
          course_id: stop.course_id,
          trip_id: trip.id,
          visibility,
          start_time: stop.play_date_time || stopDate.toISOString(),
          expires_at: gameExpiresAt.toISOString(),
          status: 'scheduled',
          note: stop.notes || null,
        })
        .select('id')
        .single();

      if (gameError) {
        console.error('[trip-create] Failed to create game for stop:', stop.course_name, gameError);
        gameErrors.push({ course_id: stop.course_id, error: gameError.message });
      } else if (game) {
        createdGameIds.push(game.id);
        console.log('[trip-create] Game created:', game.id, 'for', stop.course_name);
      }
    }

    // If any games failed, soft-cancel the trip
    if (gameErrors.length > 0) {
      console.error('[trip-create] Some games failed, soft-cancelling trip:', trip.id);
      await supabase
        .from('trips')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', trip.id)
        .eq('created_by', user.id);

      return new Response(
        JSON.stringify({ 
          error: `Failed to create ${gameErrors.length} round(s)`,
          details: gameErrors 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get organizer's profile for notifications
    const { data: organizerProfile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    const organizerName = organizerProfile?.display_name || organizerProfile?.username || 'Someone';
    const firstCourseName = itinerary[0]?.course_name || 'Golf Course';

    // 5. Invite attendees and send notifications
    const inviteResults: { user_id: string; success: boolean; error?: string }[] = [];

    for (const inviteeId of invited_user_ids) {
      // Skip if trying to invite self
      if (inviteeId === user.id) continue;

      // Insert participant row
      const { error: participantError } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: trip.id,
          user_id: inviteeId,
          role: 'member',
          rsvp_status: 'invited',
          invited_by: user.id,
          created_at: new Date().toISOString(),
        });

      if (participantError) {
        console.error('[trip-create] Failed to invite user:', inviteeId, participantError);
        inviteResults.push({ user_id: inviteeId, success: false, error: participantError.message });
        continue;
      }

      // Send in-app notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: inviteeId,
          type: 'trip_invite',
          title: 'Trip Invitation ✈️',
          message: `${organizerName} invited you to ${trip.name}`,
          data: {
            trip_id: trip.id,
            trip_name: trip.name,
            organizer_id: user.id,
            organizer_name: organizerName,
            first_course: firstCourseName,
            start_date,
            end_date,
          },
          link: `/hub?trip=${trip.id}`,
        });

      if (notifError) {
        console.error('[trip-create] Failed to send notification to:', inviteeId, notifError);
      }

      // Queue push notification
      try {
        await supabase.from('push_queue').insert({
          user_id: inviteeId,
          title: 'Golf Trip Invitation ✈️',
          body: `${organizerName} wants you to join a trip to ${firstCourseName}`,
          data: {
            type: 'trip_invite',
            trip_id: trip.id,
          },
        });
      } catch (pushError) {
        console.error('[trip-create] Failed to queue push notification:', pushError);
        // Non-fatal
      }

      inviteResults.push({ user_id: inviteeId, success: true });
      console.log('[trip-create] Invited user:', inviteeId);
    }

    // 6. Handle guest attendees (no notifications needed)
    for (const guest of guests) {
      const { error: guestError } = await supabase
        .from('trip_participants')
        .insert({
          trip_id: trip.id,
          user_id: null,
          role: 'guest',
          rsvp_status: 'going',
          guest_name: guest.name,
          invited_by: user.id,
          created_at: new Date().toISOString(),
        });

      if (guestError) {
        console.error('[trip-create] Failed to add guest:', guest.name, guestError);
        // Non-fatal
      } else {
        console.log('[trip-create] Added guest:', guest.name);
      }
    }

    console.log('[trip-create] Trip creation complete:', trip.id);

    return new Response(
      JSON.stringify({
        success: true,
        trip_id: trip.id,
        trip_name: trip.name,
        games_created: createdGameIds.length,
        invites_sent: inviteResults.filter(r => r.success).length,
        guests_added: guests.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[trip-create] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
