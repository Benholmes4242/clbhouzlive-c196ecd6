import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

import { corsFor } from '../_shared/cors.ts';
Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
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
      console.error('[list-join-requests] Auth error:', authError);
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

    console.log(`[list-join-requests] Fetching requests for game ${game_id} by user ${user.id}`);

    // Verify user is the host
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('host_user_id')
      .eq('id', game_id)
      .single();

    if (gameError || !game) {
      console.error('[list-join-requests] Game not found:', gameError);
      return new Response(
        JSON.stringify({ error: 'GAME_NOT_FOUND', message: 'Game not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (game.host_user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN', message: 'Only the host can view requests' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch pending requests with requester details.
    // Also join the active (non-deleted) whs_connections row so we can
    // resolve the display handicap server-side and never ship a stale
    // eg_handicap_index after a WHS disconnect.
    const { data: requests, error: requestsError } = await supabase
      .from('game_join_requests')
      .select(`
        id,
        game_id,
        created_at,
        status,
        requester:requester_user_id (
          id,
          display_name,
          username,
          profile_photo_url,
          home_club,
          eg_handicap_index,
          manual_handicap_index,
          whs_connections!left(id, deleted_at)
        )
      `)
      .eq('game_id', game_id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (requestsError) {
      console.error('[list-join-requests] Query error:', requestsError);
      return new Response(
        JSON.stringify({ error: 'QUERY_FAILED', message: 'Failed to fetch requests' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data to match expected format
    const transformedRequests = (requests || []).map((r: any) => {
      const reqUser = r.requester;
      const conns: Array<{ id: string; deleted_at: string | null }> = reqUser?.whs_connections ?? [];
      const hasActiveWhs = conns.some((c) => c && c.deleted_at == null);
      const resolvedHcp = hasActiveWhs
        ? (reqUser?.eg_handicap_index ?? null)
        : (reqUser?.manual_handicap_index ?? null);
      return {
        id: r.id,
        game_id: r.game_id,
        created_at: r.created_at,
        requester: {
          user_id: reqUser?.id,
          display_name: reqUser?.display_name,
          profile_photo_url: reqUser?.profile_photo_url,
          home_club: reqUser?.home_club,
          eg_handicap_index: resolvedHcp,
        },
      };
    });

    console.log(`[list-join-requests] Found ${transformedRequests.length} pending requests`);

    return new Response(
      JSON.stringify({ success: true, requests: transformedRequests }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[list-join-requests] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
