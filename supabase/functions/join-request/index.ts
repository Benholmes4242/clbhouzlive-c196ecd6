import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JoinRequestBody {
  gameId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('[join-request] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gameId }: JoinRequestBody = await req.json();
    console.log('[join-request] Request from user:', user.id, 'for game:', gameId);

    if (!gameId) {
      return new Response(
        JSON.stringify({ error: 'gameId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check if game exists and is active
    const { data: game, error: gameError } = await supabaseClient
      .from('games')
      .select('id, host_user_id, visibility, status, expires_at, slots_open, slots_total')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      console.error('[join-request] Game not found:', gameError);
      return new Response(
        JSON.stringify({ error: 'Game not found or not visible' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if game is active and not expired
    if (game.status !== 'active' || new Date(game.expires_at) <= new Date()) {
      console.log('[join-request] Game is inactive or expired');
      return new Response(
        JSON.stringify({ error: 'Game is no longer active' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check if user is already the host
    if (game.host_user_id === user.id) {
      console.log('[join-request] User is the host');
      return new Response(
        JSON.stringify({ error: 'You are the host of this game' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check if user is already a participant
    const { data: existingParticipant } = await supabaseClient
      .from('game_participants')
      .select('id, state')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingParticipant) {
      console.log('[join-request] User is already a participant:', existingParticipant.state);
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'Already a participant',
          state: existingParticipant.state 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Check if user already has a pending request
    const { data: existingRequest } = await supabaseClient
      .from('game_join_requests')
      .select('id, status')
      .eq('game_id', gameId)
      .eq('requester_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      console.log('[join-request] User already has a pending request');
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'Request already pending',
          requestId: existingRequest.id 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. For friends-only games, verify follow relationship
    if (game.visibility === 'friends') {
      const { data: followData } = await supabaseClient
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', game.host_user_id)
        .maybeSingle();

      if (!followData) {
        console.log('[join-request] User does not follow host for friends-only game');
        return new Response(
          JSON.stringify({ error: 'You must follow this player to join their friends-only game' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 7. For club games, verify same home_club
    if (game.visibility === 'club') {
      const { data: requesterProfile } = await supabaseClient
        .from('user_profiles')
        .select('home_club')
        .eq('id', user.id)
        .single();

      const { data: hostProfile } = await supabaseClient
        .from('user_profiles')
        .select('home_club')
        .eq('id', game.host_user_id)
        .single();

      if (!requesterProfile?.home_club || !hostProfile?.home_club || 
          requesterProfile.home_club !== hostProfile.home_club) {
        console.log('[join-request] User does not share home club with host');
        return new Response(
          JSON.stringify({ error: 'You must share the same home club to join this game' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 8. Create join request
    const { data: newRequest, error: insertError } = await supabaseClient
      .from('game_join_requests')
      .insert({
        game_id: gameId,
        requester_user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[join-request] Failed to create request:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create join request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[join-request] Request created successfully:', newRequest.id);

    // TODO: Send notification to host (future enhancement)

    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Join request sent successfully',
        requestId: newRequest.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[join-request] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
