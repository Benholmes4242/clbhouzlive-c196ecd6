import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveJoinBody {
  requestId: string;
  approve: boolean;
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
      console.error('[approve-join] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { requestId, approve }: ApproveJoinBody = await req.json();
    console.log('[approve-join] Host:', user.id, 'processing request:', requestId, 'approve:', approve);

    if (!requestId || typeof approve !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Missing payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2) Load request + game (host validates ownership via RLS)
    const { data: jr, error: jrErr } = await supabaseClient
      .from('join_requests')
      .select(`
        id,
        state,
        game_id,
        requester_id,
        games:game_id (
          id,
          host_user_id,
          slots_open,
          status,
          expires_at
        )
      `)
      .eq('id', requestId)
      .single();

    if (jrErr || !jr) {
      console.error('[approve-join] Request not found:', jrErr);
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (jr.state !== 'pending') {
      console.log('[approve-join] Request already processed:', jr.state);
      return new Response(
        JSON.stringify({ error: 'Already processed' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // @ts-ignore - Supabase types
    const game = Array.isArray(jr.games) ? jr.games[0] : jr.games;
    
    if (!game || game.host_user_id !== user.id) {
      console.error('[approve-join] Forbidden - not the host');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (game.status !== 'active' || new Date(game.expires_at) <= new Date()) {
      console.log('[approve-join] Game unavailable');
      return new Response(
        JSON.stringify({ error: 'Game unavailable' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3) Reject path
    if (!approve) {
      const { error: updErr } = await supabaseClient
        .from('join_requests')
        .update({ state: 'rejected' })
        .eq('id', jr.id);

      if (updErr) {
        console.error('[approve-join] Update error:', updErr);
        return new Response(
          JSON.stringify({ error: 'Update error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[approve-join] Request rejected');
      return new Response(
        JSON.stringify({ ok: true, state: 'rejected' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4) Approve path: seats check + add participant + decrement slots
    if (game.slots_open <= 0) {
      console.log('[approve-join] No seats left');
      return new Response(
        JSON.stringify({ error: 'No seats left' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // add participant (idempotent guard)
    const { data: existing } = await supabaseClient
      .from('game_participants')
      .select('id')
      .eq('game_id', game.id)
      .eq('user_id', jr.requester_id)
      .maybeSingle();

    if (!existing) {
      const { error: insErr } = await supabaseClient
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: jr.requester_id,
          role: 'player',
          state: 'accepted',
          reserves_slot: true,
        });

      if (insErr) {
        console.error('[approve-join] Insert participant error:', insErr);
        return new Response(
          JSON.stringify({ error: 'Insert participant error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('[approve-join] Participant added');
    }

    // decrement slots_open if still > 0
    const { error: slotErr } = await supabaseClient.rpc('decrement_slots_if_available', {
      p_game_id: game.id,
    });

    if (slotErr) {
      console.error('[approve-join] Slot update error:', slotErr);
      return new Response(
        JSON.stringify({ error: 'Slot update error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // mark request approved
    const { error: upd2 } = await supabaseClient
      .from('join_requests')
      .update({ state: 'approved' })
      .eq('id', jr.id);

    if (upd2) {
      console.error('[approve-join] Update error:', upd2);
      return new Response(
        JSON.stringify({ error: 'Update error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[approve-join] Request approved successfully');
    return new Response(
      JSON.stringify({ ok: true, state: 'approved' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[approve-join] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
