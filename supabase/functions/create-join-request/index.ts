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
      console.error('[create-join-request] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { game_id } = await req.json();

    if (!game_id) {
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST', message: 'game_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[create-join-request] User ${user.id} requesting to join game ${game_id}`);

    // Fetch game details
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*, game_participants(*)')
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

    if (game.status !== 'active') {
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

    // Check if user is already a participant
    const isParticipant = game.game_participants?.some(
      (p: any) => p.user_id === user.id
    );

    if (isParticipant) {
      return new Response(
        JSON.stringify({ error: 'ALREADY_JOINED', message: 'Already a participant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check slots
    const confirmedParticipants = game.game_participants?.filter(
      (p: any) => p.state === 'confirmed' || p.state === 'invited'
    ).length || 0;

    if (confirmedParticipants >= game.slots_total) {
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game is full' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing request (pending OR declined/rejected)
    const { data: existingRequest } = await supabase
      .from('game_join_requests')
      .select('id, status')
      .eq('game_id', game_id)
      .eq('requester_user_id', user.id)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return new Response(
          JSON.stringify({ error: 'ALREADY_REQUESTED', message: 'Request already pending' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Block re-requests after decline - game disappears from discover
      if (existingRequest.status === 'declined') {
        return new Response(
          JSON.stringify({ error: 'GAME_NOT_AVAILABLE', message: 'Game is no longer available' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create the join request
    const { data: joinRequest, error: insertError } = await supabase
      .from('game_join_requests')
      .insert({
        game_id,
        requester_user_id: user.id,
        status: 'pending',
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

    console.log(`[create-join-request] Request created successfully:`, joinRequest.id);

    return new Response(
      JSON.stringify({ success: true, status: 'pending', request_id: joinRequest.id }),
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
