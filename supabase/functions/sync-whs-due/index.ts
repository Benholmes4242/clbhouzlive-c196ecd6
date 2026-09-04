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
  syncProfileHandicapIndex,
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
  initial_sync_complete: boolean | null;
}

interface SyncResult {
  connectionId: string;
  ok: boolean;
  status: string;
  scoresUpserted?: number;
  scoresRejected?: number;
  friendsUpserted?: number;
  handicapChanged?: boolean;
  holesEnriched?: number;
  newRoundsImported?: number;
  analyticsPushEnqueued?: boolean;
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
    // Unconditional profile write — see syncProfileHandicapIndex.
    await syncProfileHandicapIndex(admin, conn.id, handicapIndex);
  }

  // Snapshot existing upstream_score_ids BEFORE upsert so we can detect
  // genuinely-new rounds (insert-only) after. upsertScores() may re-write
  // existing rows and its returned count cannot be trusted for newness —
  // this diff is the source of truth. See Phase D brief.
  let beforeIds = new Set<string>();
  try {
    const { data: beforeRows } = await admin
      .from("whs_scores")
      .select("upstream_score_id")
      .eq("connection_id", conn.id);
    beforeIds = new Set((beforeRows ?? []).map((r: any) => String(r.upstream_score_id)));
  } catch (err) {
    console.warn(`[sync] pre-upsert snapshot failed for ${conn.id} (non-fatal):`, err);
  }

  const scoreUpsert = scores
    ? await upsertScores(admin, conn.id, scores.Scores)
    : { written: 0, rejected: 0, failures: [] as Array<{ whsScoreUid: string | null }> };
  const scoresUpserted = scoreUpsert.written;
  const friendsUpserted = friends ? await upsertFriends(admin, conn.id, friends.Friends) : 0;

  // Partial detection. A run is only "ok" when every upstream call succeeded AND
  // every score row stored. Previously any of these failed silently and the
  // connection still recorded "ok" — which is why two members went months with
  // no working score sync.
  const partialReasons: string[] = [];
  if (scores == null) partialReasons.push("list-scores failed");
  if (friends == null) partialReasons.push("list-friends failed");
  if (scoreUpsert.rejected > 0) {
    partialReasons.push(
      `${scoreUpsert.rejected} score row(s) rejected, first uid=${scoreUpsert.failures[0]?.whsScoreUid ?? "unknown"}`,
    );
  }

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
      // Re-evaluate rounds that were already evaluated before holes arrived.
      // Same race as backfill-whs-holes: evaluator can win before hole rows
      // exist and store null course_par forever. Non-fatal.
      const enrichedIds = holeResults
        .filter((r) => r.fetched && r.holesUpserted > 0)
        .map((r) => r.scoreId);
      if (enrichedIds.length > 0) {
        try {
          await admin
            .from("gam_evaluation_queue")
            .upsert(
              enrichedIds.map((id) => ({
                user_id: user.id,
                whs_score_id: id,
                evaluator_version: 1,
                status: "queued",
                attempts: 0,
                error: null,
                processed_at: null,
                enqueued_at: new Date().toISOString(),
              })),
              { onConflict: "user_id,whs_score_id,evaluator_version" },
            );
        } catch (e) {
          console.error("[sync-whs-due] re-evaluation enqueue failed (non-fatal):", e);
        }
      }
    }

  } catch (err) {
    console.warn(`[sync] hole enrichment partial-failed for ${conn.id} (non-fatal):`, err);
  }

  // Post-upsert newness diff. Insert-only rows are those whose
  // upstream_score_id is present now but was absent before.
  let newRoundsImported = 0;
  let analyticsPushEnqueued = false;
  try {
    const { data: afterRows } = await admin
      .from("whs_scores")
      .select("upstream_score_id, course_id, play_date")
      .eq("connection_id", conn.id)
      .order("play_date", { ascending: false });
    const newRows = (afterRows ?? []).filter(
      (r: any) => !beforeIds.has(String(r.upstream_score_id)),
    );
    newRoundsImported = newRows.length;
    // Skip the push entirely on the first-ever sync for this connection —
    // the user is already looking at their new analytics.
    if (newRows.length > 0 && conn.initial_sync_complete === true) {
      analyticsPushEnqueued = await maybeEnqueueAnalyticsPush(admin, conn, newRows);
    }
  } catch (err) {
    console.error(`[sync] analytics-push detection failed for ${conn.id} (non-fatal):`, err);
  }

  // Mark success or partial.
  //
  // A partial does NOT increment consecutive_failures (the connection is healthy;
  // the data is not — incrementing would eventually disable a working connection)
  // and does NOT hold back next_sync_after (a partial must still schedule the next
  // run, otherwise one bad row stops the connection entirely).
  const isPartial = partialReasons.length > 0;
  const partialError = isPartial ? partialReasons.join("; ").slice(0, 500) : null;

  await admin
    .from("whs_connections")
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: isPartial ? "partial" : "ok",
      last_sync_error: partialError,
      consecutive_failures: 0,
      next_sync_after: computeNextSyncAfter("ok", 0),
      initial_sync_complete: true,
    })
    .eq("id", conn.id);

  if (isPartial) {
    console.warn(`[sync] partial for ${conn.id}: ${partialError}`);
  }

  result.ok = true;
  result.status = isPartial ? "partial" : "ok";
  if (partialError) result.error = partialError;
  result.scoresUpserted = scoresUpserted;
  result.scoresRejected = scoreUpsert.rejected;
  result.friendsUpserted = friendsUpserted;
  result.handicapChanged = handicapChanged;
  result.holesEnriched = holesEnriched;
  result.newRoundsImported = newRoundsImported;
  result.analyticsPushEnqueued = analyticsPushEnqueued;
  return result;
}

/**
 * Enqueue at most ONE course_analytics_updated notification per sync run.
 * Chooses the course of the most recent new round by play_date. Respects
 * a 24h rolling per-user cap read from the notifications ledger. Skips
 * silently if the course cannot be resolved to a golf_courses row — an
 * un-tappable push is worse than none. Returns true iff a row was inserted.
 *
 * Wrapped by the caller in try/catch: any failure here MUST NOT roll back
 * the sync run.
 */
async function maybeEnqueueAnalyticsPush(
  admin: SupabaseClient,
  conn: ConnectionRow,
  newRows: Array<{ upstream_score_id: unknown; course_id: string | null; play_date: string | null }>,
): Promise<boolean> {
  // Pick the most recent new round with a resolved course_id. newRows is
  // already ordered by play_date desc.
  const latest = newRows.find((r) => !!r.course_id);
  if (!latest || !latest.course_id) {
    console.warn(
      `[analytics-push] skip: no mapped course_id among ${newRows.length} new rows conn=${conn.id}`,
    );
    return false;
  }

  // 24h cap via the notifications ledger — cheap, indexed by user_id.
  const dayAgo = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: recent } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", conn.user_id)
    .eq("type", "course_analytics_updated")
    .gte("created_at", dayAgo)
    .limit(1)
    .maybeSingle();
  if (recent) return false;

  const { data: course } = await admin
    .from("golf_courses")
    .select("name")
    .eq("id", latest.course_id)
    .maybeSingle();
  const courseName = (course as any)?.name?.toString().trim();
  if (!courseName) {
    console.warn(
      `[analytics-push] skip: unresolved course name conn=${conn.id} course=${latest.course_id}`,
    );
    return false;
  }

  const route = `/courses/${latest.course_id}?tab=holes`;
  const { error } = await admin.from("notifications").insert({
    user_id: conn.user_id,
    type: "course_analytics_updated",
    recipient_actor_type: "personal",
    recipient_actor_id: conn.user_id,
    actor_id: null,
    entity_type: "course",
    entity_id: latest.course_id,
    title: `${courseName} analytics updated`,
    message: "See where the shots go.",
    data: {
      course_id: latest.course_id,
      course_name: courseName,
      link: route,
      route,
    },
  });
  if (error) {
    console.error(`[analytics-push] insert failed conn=${conn.id}:`, error.message);
    return false;
  }
  return true;
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
//
// STRUCTURAL RULES — do not weaken any of these. Between 18 and 20 Aug 2026 a
// single hung EG call on the oldest connection consumed the entire invocation:
// the worker was killed by the platform before it logged or wrote anything, and
// because the queue was ordered by last_synced_at the same row led the queue on
// every subsequent run. Eighteen of nineteen connections froze for two days
// while every row still read last_sync_status = 'ok'.
//
// 1. Bounded EG calls (20s, enforced in _shared/eg-api.ts).
// 2. Per-connection try/catch — one failure never ends the sweep.
// 3. Claim (last_attempted_at) written BEFORE the attempt, not after success.
// 4. Queue ordered by last_attempted_at — a failing row goes to the back.
// 5. Overall budget — exit cleanly with a summary before the platform kill.
// 6. Honest status on every attempt, including 'failed' and 'timeout'.
// 7. Summary logged as the FIRST and LAST statement of every invocation.

const OVERALL_BUDGET_MS = 90_000;  // platform limit ~150s; leave 60s headroom
const POISON_THRESHOLD = 5;        // consecutive_failures at or above this is skipped

Deno.serve(async (req) => {
  const startedAt = Date.now();
  const runId = crypto.randomUUID().slice(0, 8);
  console.log(`[sync-due ${runId}] START at ${new Date(startedAt).toISOString()}`);

  const summary = {
    runId,
    attempted: 0,
    succeeded: 0,
    partial: 0,
    failed: 0,
    timedOut: 0,
    skippedPoisoned: 0,
    skippedBudget: 0,
    durationMs: 0,
    budgetReached: false,
  };
  const logSummary = (extra?: string) => {
    summary.durationMs = Date.now() - startedAt;
    console.log(`[sync-due ${runId}] END ${JSON.stringify(summary)}${extra ? ` ${extra}` : ""}`);
  };

  try {
    // Auth: require CRON_SECRET in either header or query param
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret) {
      logSummary("abort=CRON_SECRET_missing");
      return Response.json({ ok: false, error: "CRON_SECRET not configured" }, { status: 500 });
    }
    const url = new URL(req.url);
    const provided = req.headers.get("x-cron-secret") ?? url.searchParams.get("secret");
    if (provided !== cronSecret) {
      logSummary("abort=unauthorized");
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const force = url.searchParams.get("force") === "true";
    const drain = url.searchParams.get("drain") === "true";
    const includePoisoned = url.searchParams.get("includePoisoned") === "true";
    const admin = adminClient();

    // Find due connections.
    //
    // Gate retries by consecutive_failures and next_sync_after only — DO NOT
    // exclude auth_failed connections. The most common cause of auth_failed is
    // our shared EG_PREAUTH_TOKEN expiring, which simultaneously 401s every
    // connection; excluding them by status would prevent auto-recovery on the
    // next cron after the token is refreshed.
    //
    // ORDER BY last_attempted_at, NOT last_synced_at: a row that cannot be
    // synced must move to the back of the queue rather than blocking it.
    const nowIso = new Date().toISOString();
    let query = admin
      .from("whs_connections")
      .select("id, user_id, passport_id, membership_number, vault_secret_id, consecutive_failures, initial_sync_complete")
      .is("deleted_at", null)
      .lt("consecutive_failures", MAX_CONSECUTIVE_FAILURES)
      .order("last_attempted_at", { ascending: true, nullsFirst: true })
      .order("last_synced_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);

    if (!force) {
      query = query.or(`next_sync_after.is.null,next_sync_after.lte.${nowIso}`);
    }
    if (!includePoisoned) {
      query = query.lt("consecutive_failures", POISON_THRESHOLD);
    }

    const { data: connections, error: fetchErr } = await query;
    if (fetchErr) {
      console.error(`[sync-due ${runId}] fetch due failed:`, fetchErr);
      logSummary("abort=fetch_failed");
      return Response.json({ ok: false, error: fetchErr.message }, { status: 500 });
    }

    // Poisoned rows are surfaced for admin rather than silently omitted.
    let poisoned: string[] = [];
    if (!includePoisoned) {
      const { data: poisonRows } = await admin
        .from("whs_connections")
        .select("id")
        .is("deleted_at", null)
        .gte("consecutive_failures", POISON_THRESHOLD)
        .lt("consecutive_failures", MAX_CONSECUTIVE_FAILURES);
      poisoned = (poisonRows ?? []).map((r: any) => r.id as string);
      summary.skippedPoisoned = poisoned.length;
    }

    const queue = (connections ?? []) as ConnectionRow[];
    console.log(`[sync-due ${runId}] queue=${queue.length} poisoned=${summary.skippedPoisoned} force=${force} drain=${drain}`);

    // Process sequentially to avoid hammering EG with parallel auth calls.
    const results: SyncResult[] = [];
    for (const conn of queue) {
      const elapsed = Date.now() - startedAt;
      if (elapsed > OVERALL_BUDGET_MS) {
        summary.budgetReached = true;
        summary.skippedBudget = queue.length - results.length;
        console.warn(`[sync-due ${runId}] budget reached at ${elapsed}ms — ${summary.skippedBudget} connection(s) deferred to the next run`);
        break;
      }

      // CLAIM FIRST. If this invocation dies mid-connection, the row still
      // moves to the back of the queue on the next run.
      try {
        await admin
          .from("whs_connections")
          .update({ last_attempted_at: new Date().toISOString() })
          .eq("id", conn.id);
      } catch (err) {
        console.error(`[sync-due ${runId}] claim write failed for ${conn.id}:`, err);
      }

      summary.attempted++;

      // PER-CONNECTION ISOLATION. Nothing in here may end the sweep.
      try {
        const r = await syncOneConnection(admin, conn, drain);
        results.push(r);
        if (r.ok && r.status === "partial") summary.partial++;
        else if (r.ok) summary.succeeded++;
        else summary.failed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const timedOut = /timed out|AbortError/i.test(message);
        if (timedOut) summary.timedOut++; else summary.failed++;
        console.error(`[sync-due ${runId}] unhandled failure for ${conn.id} (${timedOut ? "timeout" : "failed"}):`, message);

        // HONEST STATUS. A stale 'ok' on an untouched row is what hid the
        // 18–20 Aug outage for two days.
        try {
          const failures = conn.consecutive_failures + 1;
          await admin
            .from("whs_connections")
            .update({
              last_sync_status: timedOut ? "timeout" : "failed",
              last_sync_error: message.slice(0, 500),
              consecutive_failures: failures,
              next_sync_after: computeNextSyncAfter("unknown_error", failures),
            })
            .eq("id", conn.id);
        } catch (writeErr) {
          console.error(`[sync-due ${runId}] status write failed for ${conn.id}:`, writeErr);
        }

        results.push({
          connectionId: conn.id,
          ok: false,
          status: timedOut ? "timeout" : "failed",
          error: message,
        });
      }
    }

    logSummary();
    return Response.json({
      ok: true,
      processed: results.length,
      succeeded: summary.succeeded,
      partial: summary.partial,
      failed: summary.failed + summary.timedOut,
      timedOut: summary.timedOut,
      skippedPoisoned: summary.skippedPoisoned,
      poisonedIds: poisoned,
      skippedBudget: summary.skippedBudget,
      budgetReached: summary.budgetReached,
      durationMs: summary.durationMs,
      runId,
      results,
    });
  } catch (err) {
    // A throw on the startup path is what would otherwise produce a silent run.
    const message = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    console.error(`[sync-due ${runId}] FATAL:`, message);
    logSummary("abort=fatal");
    return Response.json({ ok: false, runId, error: message }, { status: 500 });
  }
});

