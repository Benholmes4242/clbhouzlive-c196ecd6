// supabase/functions/friend-content-recompute/index.ts
//
// Recomputes friend featured rounds + rivalries for users affected by a new
// whs_scores insert. Called by the trg_notify_friend_content_recompute trigger.
//
// Scope rule (locked decision): NARROW.
// We only recompute for users where the round-poster is currently in their
// friend_featured_round (via score_id->connection_id) OR friend_rivalry tables.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

interface RecomputePayload {
  score_id: string;
  connection_id: string;
  play_date: string;
  adjusted_gross: number;
  is_counter: boolean;
  course_id: string | null;
}

serve(async (req) => {
  const startedAt = Date.now();

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: RecomputePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { score_id, connection_id } = payload;
  if (!score_id || !connection_id) {
    return new Response(JSON.stringify({ error: 'missing_required_fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'missing_supabase_credentials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Step 1: Resolve the poster's user_id from connection_id
  const { data: connRow, error: connErr } = await admin
    .from('whs_connections')
    .select('user_id')
    .eq('id', connection_id)
    .maybeSingle();

  if (connErr) {
    console.error('Failed to fetch poster connection:', connErr);
    return new Response(JSON.stringify({ error: 'fetch_connection_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const posterUserId = connRow?.user_id ?? null;
  if (!posterUserId) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'no_poster_user_id' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Step 2: Find friend_row_ids where the poster appears in others' friend lists
  const { data: posterFriendRows } = await admin
    .from('whs_friend_matches')
    .select('friend_row_id')
    .eq('friend_user_id', posterUserId);

  const posterFriendRowIds = (posterFriendRows ?? [])
    .map((r: { friend_row_id: string | null }) => r.friend_row_id)
    .filter((id: string | null): id is string => !!id);

  // Step 3: Find affected users (NARROW scope)
  const affectedUserIds = new Set<string>();

  // 3a: Users featuring one of the poster's rounds in their hero
  const { data: featuredAffected } = await admin.rpc(
    'find_users_featuring_poster',
    { p_connection_id: connection_id },
  );
  (featuredAffected ?? []).forEach((row: { user_id: string }) =>
    affectedUserIds.add(row.user_id),
  );

  // 3b: Users with the poster in rivalry slots (by user_id)
  const { data: rivalryByUserHits } = await admin
    .from('friend_rivalry')
    .select('user_id')
    .eq('rival_user_id', posterUserId);
  (rivalryByUserHits ?? []).forEach((row: { user_id: string }) =>
    affectedUserIds.add(row.user_id),
  );

  // 3c: Users with the poster in rivalry slots (by friend_row_id, for non-Clbhouz friend match)
  if (posterFriendRowIds.length > 0) {
    const { data: rivalryByRowHits } = await admin
      .from('friend_rivalry')
      .select('user_id')
      .in('rival_friend_row_id', posterFriendRowIds);
    (rivalryByRowHits ?? []).forEach((row: { user_id: string }) =>
      affectedUserIds.add(row.user_id),
    );
  }

  // Step 4: Recompute hero + rivalries for each affected user
  const results: { user_id: string; ok: boolean; error?: string }[] = [];
  for (const userId of affectedUserIds) {
    try {
      const { error: heroErr } = await admin.rpc('compute_friend_featured_round', {
        p_user_id: userId,
      });
      const { error: rivalryErr } = await admin.rpc('compute_friend_rivalries', {
        p_user_id: userId,
      });

      if (heroErr || rivalryErr) {
        results.push({
          user_id: userId,
          ok: false,
          error: heroErr?.message || rivalryErr?.message,
        });
      } else {
        results.push({ user_id: userId, ok: true });
      }
    } catch (e) {
      results.push({
        user_id: userId,
        ok: false,
        error: e instanceof Error ? e.message : 'unknown',
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  return new Response(
    JSON.stringify({
      score_id,
      poster_user_id: posterUserId,
      affected_count: affectedUserIds.size,
      duration_ms: durationMs,
      results,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});