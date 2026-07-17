// snapshot-friend-leaderboard
// ───────────────────────────────────────────────────────────────────
// Nightly job: for every user with a friend leaderboard, compute the
// current rank of every member of their circle and upsert into
// `whs_friend_leaderboard_snapshots` for today's date.
//
// Powers the Phase 3 rank delta chips (↑3, ↓1, NEW) and weekly banner.
//
// Idempotent: re-running on the same day overwrites that day's rows.
// Self row is excluded (friend_row_id is null on the self branch of
// get_friend_leaderboard and the snapshot table PK disallows nulls).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { requireInternalSecret } from '../_shared/internalAuth.ts';


const RETENTION_DAYS = 90;
const STALE_THRESHOLD_DAYS = 90; // mirrors buildLeaderboardCohorts.ts

interface FriendLeaderboardRow {
  is_self: boolean;
  friend_row_id: string | null;
  friend_handicap_index: number | null;
  last_round_played_at: string | null;
}

interface RankComputeResult {
  friend_row_id: string;
  rank: number;
  handicap_index: number | null;
  is_self: boolean;
  is_stale: boolean;
}

function isStaleDate(lastPlayed: string | null): boolean {
  if (!lastPlayed) return true;
  const days =
    (Date.now() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24);
  return days > STALE_THRESHOLD_DAYS;
}

/**
 * Mirrors `buildLeaderboardCohorts.ts` on the client.
 * Sort by handicap_index ASC (NULLs sink), split into active vs stale.
 * Self row (friend_row_id null) is filtered OUT before bucketing so it
 * never consumes a rank slot — everyone below shifts up by 1.
 */
function computeRanksForCircle(
  rows: FriendLeaderboardRow[],
): RankComputeResult[] {
  const sorted = [...rows].sort((a, b) => {
    const ah = a.friend_handicap_index ?? 99;
    const bh = b.friend_handicap_index ?? 99;
    return ah - bh;
  });

  const active: FriendLeaderboardRow[] = [];
  const stale: FriendLeaderboardRow[] = [];
  for (const r of sorted) {
    // Skip self before bucketing — self never enters the snapshot table
    // and shouldn't consume a rank slot. Everyone below self shifts up by 1.
    if (r.friend_row_id == null) continue;
    if (!isStaleDate(r.last_round_played_at)) active.push(r);
    else stale.push(r);
  }

  const out: RankComputeResult[] = [];

  active.forEach((r, idx) => {
    out.push({
      friend_row_id: r.friend_row_id!,
      rank: idx + 1,
      handicap_index: r.friend_handicap_index,
      is_self: false, // never self after the filter
      is_stale: false,
    });
  });

  stale.forEach((r, idx) => {
    out.push({
      friend_row_id: r.friend_row_id!,
      rank: active.length + idx + 1,
      handicap_index: r.friend_handicap_index,
      is_self: false,
      is_stale: true,
    });
  });

  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const gate = requireInternalSecret(req, corsHeaders);
  if (gate) return gate;


  const t0 = Date.now();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const today = new Date().toISOString().slice(0, 10);
  let usersProcessed = 0;
  let rowsUpserted = 0;
  const errors: { user_id: string; error: string }[] = [];
  let deletedCount = 0;

  try {
    // 1. Distinct owner_user_id from whs_friend_matches.
    const { data: userRows, error: userErr } = await supabase
      .from('whs_friend_matches')
      .select('owner_user_id')
      .not('owner_user_id', 'is', null);
    if (userErr) throw userErr;

    const userIds = Array.from(
      new Set((userRows ?? []).map((r: { owner_user_id: string }) => r.owner_user_id)),
    ) as string[];

    console.log(`[snapshot] today=${today} candidates=${userIds.length}`);

    // 2. Per-user: call get_friend_leaderboard, compute ranks, upsert.
    for (const userId of userIds) {
      try {
        const { data: rows, error: rpcErr } = await supabase.rpc(
          'get_friend_leaderboard',
          { p_user_id: userId },
        );
        if (rpcErr) throw rpcErr;
        if (!rows || rows.length === 0) continue;

        const computed = computeRanksForCircle(rows as FriendLeaderboardRow[]);
        if (computed.length === 0) continue;

        const { error: upsertErr } = await supabase
          .from('whs_friend_leaderboard_snapshots')
          .upsert(
            computed.map((c) => ({
              snapshot_date: today,
              user_id: userId,
              friend_row_id: c.friend_row_id,
              rank: c.rank,
              handicap_index: c.handicap_index,
              is_self: c.is_self,
              is_stale: c.is_stale,
            })),
            { onConflict: 'snapshot_date,user_id,friend_row_id' },
          );
        if (upsertErr) throw upsertErr;

        rowsUpserted += computed.length;
        usersProcessed++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[snapshot] user=${userId} failed: ${msg}`);
        errors.push({ user_id: userId, error: msg });
        // continue — one bad user shouldn't kill the run
      }
    }

    // 3. Retention sweep: delete > RETENTION_DAYS old.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const { error: deleteErr, count } = await supabase
      .from('whs_friend_leaderboard_snapshots')
      .delete({ count: 'exact' })
      .lt('snapshot_date', cutoffStr);
    if (deleteErr) {
      console.error(`[snapshot] retention sweep failed: ${deleteErr.message}`);
    } else {
      deletedCount = count ?? 0;
    }

    const dt = Date.now() - t0;
    console.log(
      `[snapshot] done in ${dt}ms: users=${usersProcessed}/${userIds.length} ` +
        `rows=${rowsUpserted} deleted=${deletedCount} errors=${errors.length}`,
    );

    return new Response(
      JSON.stringify({
        ok: true,
        snapshot_date: today,
        users_processed: usersProcessed,
        rows_upserted: rowsUpserted,
        rows_deleted_retention: deletedCount,
        errors,
        duration_ms: dt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[snapshot] fatal:', msg);
    return new Response(
      JSON.stringify({ ok: false, error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
