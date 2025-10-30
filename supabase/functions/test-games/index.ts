import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Utilities **/
const decodeSub = (jwt: string): string => {
  const payload = JSON.parse(atob(jwt.split(".")[1]));
  return payload.sub;
};

const log = (label: string, obj: any) => {
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(obj, null, 2));
  return { label, data: obj };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logs: any[] = [];
  const addLog = (label: string, obj: any) => {
    const logEntry = log(label, obj);
    logs.push(logEntry);
    return logEntry;
  };

  try {
    // Get JWTs from request body or use defaults
    const body = await req.json().catch(() => ({}));
    const HOST_JWT = body.hostJwt || Deno.env.get('HOST_JWT');
    const TAGGED_JWT = body.taggedJwt || Deno.env.get('TAGGED_JWT');
    const REQUESTER_JWT = body.requesterJwt || Deno.env.get('REQUESTER_JWT');
    const CLEANUP = body.cleanup ?? (Deno.env.get('CLEANUP') === 'true');

    if (!HOST_JWT || !TAGGED_JWT || !REQUESTER_JWT) {
      throw new Error('Missing required JWTs. Provide hostJwt, taggedJwt, and requesterJwt in request body.');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
      throw new Error(`Missing environment variables: URL=${!!SUPABASE_URL}, ANON=${!!ANON_KEY}, SERVICE=${!!SERVICE_ROLE}`);
    }

    const uid = {
      host: decodeSub(HOST_JWT),
      tagged: decodeSub(TAGGED_JWT),
      requester: decodeSub(REQUESTER_JWT),
    };

    addLog('Users', uid);

    // Service role client for admin operations (bypasses RLS)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Per-user clients (respects RLS)
    const clientFor = (jwt: string) =>
      createClient(SUPABASE_URL, ANON_KEY, {
        global: { 
          headers: { 
            Authorization: `Bearer ${jwt}`,
            apikey: ANON_KEY
          } 
        },
        auth: { autoRefreshToken: false, persistSession: false }
      });

    const host = clientFor(HOST_JWT);
    const tagged = clientFor(TAGGED_JWT);
    const requester = clientFor(REQUESTER_JWT);

    // 1) Host creates a public, active game starting in 2h, expiring tonight
    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const endOfDay = new Date();
    endOfDay.setHours(23, 0, 0, 0);

    const gameInsert = await host
      .from('games')
      .insert({
        host_user_id: uid.host,
        course_name: 'Sunningdale Old',
        start_time: start.toISOString(),
        expires_at: endOfDay.toISOString(),
        status: 'active',
        visibility: 'public',
        slots_total: 4,
        slots_open: 3,
        lat: 51.387,
        lng: -0.635,
      })
      .select('id, slots_total, slots_open')
      .single();

    if (gameInsert.error) throw gameInsert.error;
    const gameId = gameInsert.data.id;
    addLog('Game created', gameInsert.data);

    // 2) Host tags the "tagged" user with a reserved invite
    const tagInsert = await host
      .from('game_participants')
      .insert({
        game_id: gameId,
        user_id: uid.tagged,
        role: 'player',
        state: 'invited',
        reserves_slot: true,
        joined_at: null,
      })
      .select()
      .single();

    addLog('Tagged player (reserved invite)', tagInsert.data || 'already tagged');

    // 3) Create join request (using admin to bypass RLS for testing)
    const jrInsert = await admin
      .from('game_join_requests')
      .insert({
        game_id: gameId,
        requester_user_id: uid.requester,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    if (jrInsert.error) throw jrInsert.error;
    addLog('Join request created', jrInsert.data);
    const joinRequestId = jrInsert.data.id;

    // 4) Host accepts the request via RPC
    const acceptReq = await host.rpc('game_request_decide', {
      p_request_id: joinRequestId,
      p_decision: 'accept',
    });
    if (acceptReq.error) throw acceptReq.error;
    addLog('RPC: game_request_decide -> accept', acceptReq.data);

    // 5) Tagged user accepts their reserved seat via RPC
    const tagAccept = await tagged.rpc('game_tag_accept', { p_game_id: gameId });
    if (tagAccept.error) throw tagAccept.error;
    addLog('RPC: game_tag_accept', tagAccept.data);

    // 6) Snapshot seats + participants
    const gameSnap = await host
      .from('games')
      .select('id, course_name, slots_total, slots_open')
      .eq('id', gameId)
      .single();
    if (gameSnap.error) throw gameSnap.error;

    const parts = await host
      .from('game_participants')
      .select('user_id, role, state, reserves_slot, joined_at')
      .eq('game_id', gameId)
      .order('role', { ascending: true });
    if (parts.error) throw parts.error;

    addLog('Seats snapshot', {
      filled: gameSnap.data.slots_total - gameSnap.data.slots_open,
      total: gameSnap.data.slots_total,
      open: gameSnap.data.slots_open,
    });
    addLog('Participants', parts.data);

    // 7) Fetch recent system messages
    const thread = await host
      .from('game_threads')
      .select('id')
      .eq('game_id', gameId)
      .single();
    if (thread.error) throw thread.error;

    const msgs = await host
      .from('game_thread_messages')
      .select('created_at, text, is_system, sender_id')
      .eq('thread_id', thread.data.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (msgs.error) throw msgs.error;

    addLog('Latest messages', msgs.data);

    // 8) Tagged declines (frees their reserved seat)
    const tagDecline = await tagged.rpc('game_tag_decline', { p_game_id: gameId });
    if (tagDecline.error) throw tagDecline.error;
    addLog('RPC: game_tag_decline', tagDecline.data);

    // 9) Host re-tags same player
    const retag = await host
      .from('game_participants')
      .upsert(
        {
          game_id: gameId,
          user_id: uid.tagged,
          role: 'player',
          state: 'invited',
          reserves_slot: true,
        },
        { onConflict: 'game_id,user_id' }
      )
      .select()
      .single();
    if (retag.error) throw retag.error;
    addLog('Re-tagged player', retag.data);

    // 10) Host releases tagged seat
    const hostRelease = await host.rpc('game_tag_release', {
      p_game_id: gameId,
      p_user_id: uid.tagged,
    });
    if (hostRelease.error) throw hostRelease.error;
    addLog('RPC: game_tag_release', hostRelease.data);

    // 11) Verify seats again
    const snap2 = await host
      .from('games')
      .select('slots_total, slots_open')
      .eq('id', gameId)
      .single();
    if (snap2.error) throw snap2.error;
    addLog('Seats snapshot after decline/release', {
      filled: snap2.data.slots_total - snap2.data.slots_open,
      total: snap2.data.slots_total,
      open: snap2.data.slots_open,
    });

    // 12) Race condition test
    addLog('Race condition test', 'Starting...');
    const tinyGame = await host
      .from('games')
      .insert({
        host_user_id: uid.host,
        course_name: 'Race Course',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        expires_at: new Date(Date.now() + 7200000).toISOString(),
        status: 'active',
        visibility: 'public',
        slots_total: 2,
        slots_open: 1,
        lat: 0,
        lng: 0,
      })
      .select('id, slots_open')
      .single();
    if (tinyGame.error) throw tinyGame.error;
    const tinyId = tinyGame.data.id;
    addLog('Tiny game created (1 open seat)', tinyGame.data);

    // Two pending requests (using admin to bypass RLS for testing)
    const mkReq = async (whoJwt: string) => {
      const r = await admin
        .from('game_join_requests')
        .insert({
          game_id: tinyId,
          requester_user_id: decodeSub(whoJwt),
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (r.error) throw r.error;
      return r.data.id;
    };
    const [reqA, reqB] = await Promise.all([mkReq(TAGGED_JWT), mkReq(REQUESTER_JWT)]);
    addLog('Two simultaneous pending requests', { reqA, reqB });

    // Race: host accepts both at once
    const [a, b] = await Promise.allSettled([
      host.rpc('game_request_decide', { p_request_id: reqA, p_decision: 'accept' }),
      host.rpc('game_request_decide', { p_request_id: reqB, p_decision: 'accept' }),
    ]);
    addLog('Race results A', a);
    addLog('Race results B', b);

    // Seat should be 0; exactly one accept should have succeeded
    const tinySnap = await host
      .from('games')
      .select('slots_total, slots_open')
      .eq('id', tinyId)
      .single();
    if (tinySnap.error) throw tinySnap.error;
    addLog('Tiny game seats after race (expect 0 open)', tinySnap.data);

    // 13) Cleanup
    if (CLEANUP) {
      addLog('Cleanup', 'Starting...');

      // Clean tiny game
      const tinyThreads = await host.from('game_threads').select('id').eq('game_id', tinyId);
      const tinyThreadIds = tinyThreads.data?.map((t) => t.id) || [];
      if (tinyThreadIds.length > 0) {
        await host.from('game_thread_messages').delete().in('thread_id', tinyThreadIds);
        await host.from('game_thread_participants').delete().in('thread_id', tinyThreadIds);
      }
      await host.from('game_threads').delete().eq('game_id', tinyId);
      await host.from('game_participants').delete().eq('game_id', tinyId);
      await host.from('game_join_requests').delete().eq('game_id', tinyId);
      await host.from('games').delete().eq('id', tinyId);

      // Clean main game
      await host.from('game_thread_messages').delete().eq('thread_id', thread.data.id);
      await host.from('game_thread_participants').delete().eq('thread_id', thread.data.id);
      await host.from('game_threads').delete().eq('game_id', gameId);
      await host.from('game_participants').delete().eq('game_id', gameId);
      await host.from('game_join_requests').delete().eq('game_id', gameId);
      await host.from('games').delete().eq('id', gameId);

      addLog('Cleanup', 'Complete');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '✅ Test flow completed successfully.',
        logs,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Test flow failed:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
