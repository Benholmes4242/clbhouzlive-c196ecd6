// supabase/functions/sync-whs-due/index.ts
//
// Phase 5 — runs on a schedule (default every 6 hours via pg_cron).
// Picks up whs_connections that are due for refresh, re-authenticates them,
// and updates their handicap + scores + friends.
//
// Triggered by pg_cron via HTTP. Optional manual trigger: pass ?force=true to
// ignore next_sync_after gating (useful for ops/debugging).
//
// This function is server-internal: deployed with --no-verify-jwt because cron
// can't supply a user JWT. Auth is via a shared secret (CRON_SECRET env var)
// to prevent random external invocation.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  egAuth,
  egGetUserDetails,
  egListScores,
  egListFriends,
  EgApiError,
  insertHandicapSnapshotIfChanged,
  upsertScores,
  upsertFriends,
  decryptVaultSecret,
  enrichScoresWithHoles,
} from "../_shared/eg-api.ts";

// Configuration
const BATCH_SIZE = 25;                    // max connections per cron run
const DEFAULT_SYNC_INTERVAL_HOURS = 6;    // refresh cadence
const MAX_CONSECUTIVE_FAILURES = 50;      // give up after this many in a row.
                                          // High because pre-auth token expiry
                                          // causes simultaneous failures on all
                                          // connections, and the 6h cron cadence
                                          // means we can accrue 4 failures/day.

interface ConnectionRow {
  id: string;
  user_id: string;
  passport_id: number;
  membership_number: string;
  vault_secret_id: string;
  consecutive_failures: number;
}

interface SyncResult {
  connectionId: string;
  ok: boolean;
  status: string;
  scoresUpserted?: number;
  friendsUpserted?: number;
  handicapChanged?: boolean;
  holesEnriched?: number;
  error?: string;
}

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/**
 * Compute the next sync time given current state.
 * - On success: now + 6h
 * - On any failure: exponential backoff, capped at 24h
 *
 * NOTE: All failure modes (including auth_failed) use the same backoff.
 * This is intentional: the most common cause of auth_failed is our shared
 * EG_PREAUTH_TOKEN being expired (a system issue, not a user-credential
 * issue) — when that happens, every connection 401s simultaneously, and
 * they all need to retry on the next cron run after we refresh the token.
 * A long exile would block automatic recovery.
 *
 * If a user's stored credentials are genuinely invalid (rare), they'll
 * plateau at 24h retries and the MAX_CONSECUTIVE_FAILURES gate will
 * eventually stop them.
 */
function computeNextSyncAfter(
  status: "ok" | "auth_failed" | "rate_limited" | "transient_error" | "unknown_error",
  consecutiveFailures: number,
): string {
  const now = Date.now();
  if (status === "ok") {
    return new Date(now + DEFAULT_SYNC_INTERVAL_HOURS * 3600_000).toISOString();
  }
  // All failure modes: exp backoff in minutes — 5, 10, 20, 40, 80, 160, 320 → cap at 1440 (24h)
  const minutes = Math.min(5 * Math.pow(2, consecutiveFailures), 24 * 60);
  return new Date(now + minutes * 60_000).toISOString();
}

/**
 * Sync a single connection. Used by both this fn and sync-whs-one.
 */
async function syncOneConnection(
  admin: SupabaseClient,
  conn: ConnectionRow,
  drain = false,
): Promise<SyncResult> {
  const result: SyncResult = {
    connectionId: conn.id,
    ok: false,
    status: "unknown_error",
  };

  let password: string;
  try {
    password = await decryptVaultSecret(admin, conn.vault_secret_id);
  } catch (err) {
    console.error(`[sync] decrypt failed for ${conn.id}:`, err);
    result.status = "internal_error";
    result.error = err instanceof Error ? err.message : String(err);
    await markFailure(admin, conn, "unknown_error", result.error);
    return result;
  }

  let token: string;
  try {
    const auth = await egAuth(conn.membership_number, password);
    token = auth.token;
  } catch (err) {
    if (err instanceof EgApiError) {
      result.status = err.kind;
      result.error = err.message;
      await markFailure(admin, conn, err.kind, err.message);
      return result;
    }
    result.status = "unknown_error";
    result.error = err instanceof Error ? err.message : String(err);
    await markFailure(admin, conn, "unknown_error", result.error);
    return result;
  }

  // Fetch user details for handicap + scores + friends in parallel where possible
  let handicapIndex: number | null = null;
  let scores: Awaited<ReturnType<typeof egListScores>> | null = null;
  let friends: Awaited<ReturnType<typeof egListFriends>> | null = null;

  try {
    const [user, scoresPage, friendsPage] = await Promise.all([
      egGetUserDetails(token),
      egListScores(token, conn.passport_id, 1, 30).catch((e) => {
        console.error(`[sync] list-scores failed for ${conn.id}:`, e);
        return null;
      }),
      egListFriends(token, 1, 100).catch((e) => {
        console.error(`[sync] list-friends failed for ${conn.id}:`, e);
        return null;
      }),
    ]);
    handicapIndex = user.HandicapIndex;
    scores = scoresPage;
    friends = friendsPage;
  } catch (err) {
    if (err instanceof EgApiError) {
      result.status = err.kind;
      result.error = err.message;
      await markFailure(admin, conn, err.kind, err.message);
      return result;
    }
    result.status = "transient_error";
    result.error = err instanceof Error ? err.message : String(err);
    await markFailure(admin, conn, "transient_error", result.error);
    return result;
  }

  // Persist
  let handicapChanged = false;
  if (handicapIndex != null) {
    handicapChanged = await insertHandicapSnapshotIfChanged(admin, conn.id, handicapIndex);
  }

  const scoresUpserted = scores ? await upsertScores(admin, conn.id, scores.Scores) : 0;
  const friendsUpserted = friends ? await upsertFriends(admin, conn.id, friends.Friends) : 0;

  // Enrich newly-imported scores with hole-by-hole detail. This mirrors what
  // sync-whs-one does. Without it, the cron leaves friend round detail sheets
  // stuck showing "Hole data is still syncing" indefinitely.
  //
  // We query for the most recent N scores that haven't been enriched yet.
  // Wrapped in try/catch because hole enrichment is non-critical to sync
  // success — a partial enrichment failure shouldn't roll back score upserts.
  let holesEnriched = 0;
  try {
    const { data: newScores } = await admin
      .from("whs_scores")
      .select("id, upstream_score_id")
      .eq("connection_id", conn.id)
      .eq("hole_by_hole_fetched", false)
      .order("play_date", { ascending: false })
      .limit(drain ? 50 : 5);
    if (newScores && newScores.length > 0) {
      const holeResults = await enrichScoresWithHoles(admin, token, newScores, 200);
      holesEnriched = holeResults.reduce((sum, r) => sum + r.holesUpserted, 0);
    }
  } catch (err) {
    console.warn(`[sync] hole enrichment partial-failed for ${conn.id} (non-fatal):`, err);
  }

  // Mark success
  await admin
    .from("whs_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: "ok",
      last_sync_error: null,
      consecutive_failures: 0,
      next_sync_after: computeNextSyncAfter("ok", 0),
      initial_sync_complete: true,
    })
    .eq("id", conn.id);

  result.ok = true;
  result.status = "ok";
  result.scoresUpserted = scoresUpserted;
  result.friendsUpserted = friendsUpserted;
  result.handicapChanged = handicapChanged;
  result.holesEnriched = holesEnriched;
  return result;
}

async function markFailure(
  admin: SupabaseClient,
  conn: ConnectionRow,
  status: "auth_failed" | "rate_limited" | "transient_error" | "unknown_error",
  errorMessage: string,
): Promise<void> {
  const newFailureCount = conn.consecutive_failures + 1;
  await admin
    .from("whs_connections")
    .update({
      last_sync_status: status,
      last_sync_error: errorMessage.slice(0, 500),
      consecutive_failures: newFailureCount,
      next_sync_after: computeNextSyncAfter(status, newFailureCount),
    })
    .eq("id", conn.id);
}

// =============================================================================
// HTTP handler
// =============================================================================

Deno.serve(async (req) => {
  // Auth: require CRON_SECRET in either header or query param
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret) {
    return Response.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const url = new URL(req.url);
  const provided = req.headers.get("x-cron-secret") ?? url.searchParams.get("secret");
  if (provided !== cronSecret) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const force = url.searchParams.get("force") === "true";
  const drain = url.searchParams.get("drain") === "true";
  const admin = adminClient();

  // Find due connections.
  //
  // Gate retries by consecutive_failures and next_sync_after only — DO NOT
  // exclude auth_failed connections. The most common cause of auth_failed is
  // our shared EG_PREAUTH_TOKEN expiring, which simultaneously 401s every
  // connection; excluding them by status would prevent auto-recovery on the
  // next cron after the token is refreshed.
  const nowIso = new Date().toISOString();
  let query = admin
    .from("whs_connections")
    .select("id, user_id, passport_id, membership_number, vault_secret_id, consecutive_failures")
    .is("deleted_at", null)
    .lt("consecutive_failures", MAX_CONSECUTIVE_FAILURES)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);

  if (!force) {
    query = query.or(`next_sync_after.is.null,next_sync_after.lte.${nowIso}`);
  }

  const { data: connections, error: fetchErr } = await query;
  if (fetchErr) {
    console.error("[sync] fetch due failed:", fetchErr);
    return Response.json({ ok: false, error: fetchErr.message }, { status: 500 });
  }

  if (!connections || connections.length === 0) {
    return Response.json({ ok: true, processed: 0, results: [] });
  }

  // Process sequentially to avoid hammering EG with parallel auth calls.
  // 25 connections × ~3s each = ~75s, well under Edge Function 150s timeout.
  const results: SyncResult[] = [];
  for (const conn of connections as ConnectionRow[]) {
    const r = await syncOneConnection(admin, conn, drain);
    results.push(r);
  }

  const okCount = results.filter((r) => r.ok).length;
  return Response.json({
    ok: true,
    processed: results.length,
    succeeded: okCount,
    failed: results.length - okCount,
    results,
  });
});
