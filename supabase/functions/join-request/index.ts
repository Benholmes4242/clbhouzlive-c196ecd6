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

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
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

    // 1) Auth
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

    // 2) Load game & basic checks
    const { data: game, error: gameError } = await supabaseClient
      .from('games')
      .select('id, host_user_id, visibility, status, expires_at, slots_open')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      console.error('[join-request] Game not found:', gameError);
      return new Response(
        JSON.stringify({ error: 'Game not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (game.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Game not active' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new Date(game.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Game expired' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (user.id === game.host_user_id) {
      return new Response(
        JSON.stringify({ error: 'Host cannot request' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3) Check not already a participant
    const { data: alreadyIn } = await supabaseClient
      .from('game_participants')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (alreadyIn) {
      console.log('[join-request] User already participant');
      return new Response(
        JSON.stringify({ ok: true, status: 'already_participant' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4) Upsert pending request (unique pending constraint enforces idempotency)
    const { data: reqRow, error: insertError } = await supabaseClient
      .from('join_requests')
      .insert({ game_id: gameId, requester_id: user.id })
      .select('id, state')
      .single();

    if (insertError) {
      // Unique violation means there's already a pending request
      console.log('[join-request] Pending request already exists');
      return new Response(
        JSON.stringify({ ok: true, status: 'pending_exists' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[join-request] Request created:', reqRow.id);
    return new Response(
      JSON.stringify({ ok: true, requestId: reqRow.id }),
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
