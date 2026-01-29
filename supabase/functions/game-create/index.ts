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
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user ID:', user.id);

    const {
      course_id,
      course_name,
      start_time,
      slots_total = 4,
      tagged_user_ids = [],
      guest_participants = [],
      note,
      visibility = 'public',
      lat,
      lng,
      // New fields
      holes = 18,
      game_type = 'casual',
    } = await req.json();

    console.log('Creating game for user:', user.id, { 
      course_name, 
      start_time, 
      slots_total, 
      tagged_count: tagged_user_ids.length, 
      guest_count: guest_participants.length,
      holes,
      game_type 
    });

    // Validate tagged players + guests don't exceed available seats
    const totalTagged = tagged_user_ids.length + guest_participants.length;
    if (totalTagged > slots_total - 1) {
      return new Response(
        JSON.stringify({ error: 'Too many tagged players and guests for available seats' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate slots_open: total - host - tagged players - guests
    // Note: trigger will auto-recalculate this, but set initial value
    const slots_open = slots_total - 1 - totalTagged;

    // Set expires_at to start_time + 2 hours (game duration estimate)
    const start = new Date(start_time);
    const expires_at = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    // Create the game
    const insertPayload: Record<string, unknown> = {
      host_user_id: user.id,
      course_id,
      course_name,
      start_time,
      expires_at: expires_at.toISOString(),
      slots_total,
      slots_open,
      note,
      lat,
      lng,
      status: 'active',
      visibility: visibility || 'public',
    };

    // Add holes and game_type if the columns exist (graceful handling)
    // These fields are optional in the schema
    if (holes) insertPayload.holes = holes;
    if (game_type) insertPayload.game_type = game_type;
    
    console.log('Inserting game with payload:', { ...insertPayload, host_user_id: user.id });
    
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert(insertPayload)
      .select()
      .single();

    if (gameError) {
      console.error('Error creating game:', gameError);
      throw gameError;
    }

    console.log('Game created:', game.id);

    // Insert host as accepted participant
    const { error: hostError } = await supabase
      .from('game_participants')
      .insert({
        game_id: game.id,
        user_id: user.id,
        role: 'host',
        state: 'accepted',
        reserves_slot: true,
        joined_at: new Date().toISOString()
      });

    if (hostError) {
      console.error('Error adding host participant:', hostError);
      throw hostError;
    }

    // Insert tagged players as invited participants
    if (tagged_user_ids.length > 0) {
      const taggedParticipants = tagged_user_ids.map((userId: string) => ({
        game_id: game.id,
        user_id: userId,
        role: 'player',
        state: 'invited',
        reserves_slot: true
      }));

      const { error: taggedError } = await supabase
        .from('game_participants')
        .insert(taggedParticipants);

      if (taggedError) {
        console.error('Error adding tagged participants:', taggedError);
        throw taggedError;
      }

      console.log('Tagged participants added:', tagged_user_ids.length);

      // Get host profile for notifications
      const { data: hostProfile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      const hostName = hostProfile?.display_name || hostProfile?.username || 'Someone';

      // Send in-app notifications AND queue push notifications
      for (const taggedUserId of tagged_user_ids) {
        // In-app notification with actor columns
        const notificationResult = await supabase.from('notifications').insert({
          user_id: taggedUserId,
          recipient_actor_type: 'personal',
          recipient_actor_id: taggedUserId,
          actor_id: user.id,
          type: 'game_invite',
          title: 'Seat reserved for you',
          message: `${hostName} saved you a spot for ${course_name || 'a game'}, ${new Date(start_time).toLocaleDateString()}. Accept to confirm.`,
          data: {
            game_id: game.id,
            host_id: user.id,
            host_name: hostName,
            course_name: course_name || null,
            start_time
          }
        }).select('id').single();

        if (notificationResult.error) {
          console.error('Error creating notification:', notificationResult.error);
        } else {
          console.log('Notification created for user:', taggedUserId);
        }

        // Queue push notification - get user's device tokens
        const { data: devices } = await supabase
          .from('user_push_devices')
          .select('provider_id')
          .eq('user_id', taggedUserId);

        if (devices && devices.length > 0) {
          for (const device of devices) {
            await supabase.from('push_notification_queue').insert({
              user_id: taggedUserId,
              recipient_actor_type: 'personal',
              recipient_actor_id: taggedUserId,
              device_id: device.provider_id,
              title: 'Game Invitation 🏌️',
              body: `${hostName} wants you to join a round at ${course_name || 'a golf course'}`,
              data: {
                type: 'game_invite',
                game_id: game.id,
                host_id: user.id,
              }
            });
          }
          console.log('Push notifications queued for user:', taggedUserId, 'devices:', devices.length);
        }
      }
    }

    // Insert guest participants
    if (guest_participants.length > 0) {
      const guestParticipants = guest_participants.map((guest: { guest_name?: string; name?: string }) => ({
        game_id: game.id,
        user_id: null, // Explicitly set to null for guests
        guest_name: guest.guest_name || guest.name, // Support both formats
        added_by_user_id: user.id,
        role: 'player',
        state: 'accepted', // Guests are auto-accepted
        reserves_slot: true
      }));

      const { error: guestError } = await supabase
        .from('game_participants')
        .insert(guestParticipants);

      if (guestError) {
        console.error('Error adding guest participants:', guestError);
        throw guestError;
      }

      console.log('Guest participants added:', guest_participants.length);
    }

    // Fetch participants for response
    const { data: participants } = await supabase
      .from('game_participants')
      .select('*, user_profiles:user_id(id, display_name, username, profile_photo_url, handicap:eg_handicap_index, show_handicap)')
      .eq('game_id', game.id);

    return new Response(
      JSON.stringify({ game, participants, game_id: game.id }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in game-create:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
