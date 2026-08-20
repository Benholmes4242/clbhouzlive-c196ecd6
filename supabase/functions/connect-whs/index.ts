// supabase/functions/connect-whs/index.ts
//
// Phase 4 — connects a logged-in Clbhouz user to their England Golf account.
//
// Flow:
//   1. Verify the calling user is logged in to Clbhouz (JWT check)
//   2. Take their membership_number + password from the request body
//   3. Authenticate against EG to validate the credentials
//   4. Encrypt the password into Supabase Vault
//   5. Insert a whs_connections row
//   6. Run the initial sync (handicap snapshot + recent scores + friends)
//   7. Return summary so the UI can immediately render the user's handicap
//
// On failure at any step, returns a clean error object the UI can render.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  egAuth,
  egGetUserDetails,
  egListScores,
  egListFriends,
  upsertScores,
  insertHandicapSnapshotIfChanged,
  syncProfileHandicapIndex,
  EgApiError,
  type EgFriend,
} from "../_shared/eg-api.ts";

// =============================================================================
// Structured logging — mirrors sync-whs-due. Every run prints an ATTEMPT line at
// entry and exactly one OUTCOME line as its final statement, so a run that logs
// nothing at all is itself a diagnosis (the function never entered the handler).
// Credentials NEVER appear in a log line: only the user id, the EG status and a
// classified reason.
// =============================================================================

type Level = "info" | "warn" | "error";

function logLine(level: Level, runId: string, event: string, fields: Record<string, unknown>) {
  const payload = JSON.stringify({ fn: "connect-whs", run: runId, event, ...fields });
  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

/** Classify a thrown error into a stable reason + upstream status for logs. */
function classify(err: unknown): { kind: string; status: number | null; detail: string } {
  if (err instanceof EgApiError) {
    return { kind: err.kind, status: err.status ?? null, detail: err.message };
  }
  if (err instanceof Error) {
    const isAbort = err.name === "AbortError" || /timeout|timed out/i.test(err.message);
    return { kind: isAbort ? "timeout" : "unknown_error", status: null, detail: err.message };
  }
  return { kind: "unknown_error", status: null, detail: String(err) };
}

// =============================================================================
// Request / response shapes
// =============================================================================


// =============================================================================
// CORS
// =============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

interface ConnectRequest {
  membership_number: string;
  password: string;
}

interface ConnectSuccess {
  ok: true;
  connection_id: string;
  passport_id: number;
  name: string;
  handicap_index: number;
  home_club: string | null;
  scores_imported: number;
  friends_imported: number;
}

interface ConnectError {
  ok: false;
  error_code:
    | "not_authenticated"        // Clbhouz user not logged in
    | "invalid_request"           // missing/malformed body
    | "already_connected"         // user already has a whs_connections row
    | "eg_auth_failed"            // EG rejected the credentials
    | "eg_unavailable"            // EG returned 5xx / network error
    | "internal_error";           // something else broke
  message: string;
}

// =============================================================================
// Supabase client setup
// =============================================================================

function adminClient(): SupabaseClient {
  // service_role bypasses RLS — needed because users can't INSERT via RLS
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getAuthenticatedUser(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const userJwt = auth.slice(7);

  // Verify the JWT against Supabase Auth
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${userJwt}` } } },
  );

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}

// =============================================================================
// Vault helpers — store and reference encrypted secrets
// =============================================================================

async function storeVaultSecret(
  client: SupabaseClient,
  secret: string,
  description: string,
): Promise<string> {
  // vault.create_secret returns the new secret's UUID
  const { data, error } = await client.rpc("vault_create_secret", {
    new_secret: secret,
    new_name: null,
    new_description: description,
  });
  if (error) {
    // Fallback: use raw SQL if the RPC alias isn't installed
    const { data: rawData, error: rawErr } = await client
      .from("vault.secrets")
      .insert({ secret, description })
      .select("id")
      .single();
    if (rawErr) throw new Error(`Vault store failed: ${rawErr.message}`);
    return rawData.id as string;
  }
  return data as string;
}

// =============================================================================
// Initial sync — handicap snapshot + first page of scores + friends
// =============================================================================

interface SyncResult {
  scoresImported: number;
  friendsImported: number;
  scoresRejected: number;
  firstRejectedUid: string | null;
}

async function runInitialSync(
  client: SupabaseClient,
  connectionId: string,
  passportId: number,
  egToken: string,
  handicapIndex: number,
): Promise<SyncResult> {
  // 1. Initial handicap snapshot — guard against null/NaN handicap, otherwise
  //    the INSERT silently fails (NOT NULL constraint) and we lose the baseline.
  if (typeof handicapIndex === "number" && Number.isFinite(handicapIndex)) {
    try {
      await insertHandicapSnapshotIfChanged(client, connectionId, handicapIndex);
    } catch (err) {
      console.error("[connect-whs] initial snapshot insert failed (non-fatal):", err);
    }
  } else {
    console.warn(
      `[connect-whs] skipping initial snapshot: handicapIndex=${handicapIndex} (not a finite number)`,
    );
  }

  // 2. First page of scores (most recent 30)
  //    Uses the SHARED mapper in _shared/eg-api.ts — the only score mapper.
  //    That brings row-by-row degradation to the initial import too: one
  //    unstorable row can no longer lose the member's entire history.
  let scoresImported = 0;
  let scoresRejected = 0;
  let firstRejectedUid: string | null = null;
  try {
    const { Scores } = await egListScores(egToken, passportId, 1, 300);
    const upsert = await upsertScores(client, connectionId, Scores);
    scoresImported = upsert.written;
    scoresRejected = upsert.rejected;
    firstRejectedUid = upsert.failures[0]?.whsScoreUid ?? null;
  } catch (err) {
    console.error("[connect-whs] initial score sync failed:", err);
    // Non-fatal — connection is still useful without scores; sync will retry
  }

  // 3. Friends list
  let friendsImported = 0;
  try {
    const { Friends } = await egListFriends(egToken, 1, 100);
    friendsImported = await upsertFriends(client, connectionId, Friends);
  } catch (err) {
    console.error("[connect-whs] initial friends sync failed:", err);
    // Non-fatal
  }

  // 4. Mark initial sync complete + record timestamp.
  //    If the import rejected any rows we must NOT report a clean success —
  //    a first import that silently dropped rounds is the worst version of
  //    this bug. Mirror sync-whs-due: status "partial", count and first
  //    offending WHSScoreUID in last_sync_error. consecutive_failures stays
  //    at 0: the connection authenticated and synced fine.
  const isPartial = scoresRejected > 0;
  const partialError = isPartial
    ? `initial import rejected ${scoresRejected} score row(s); first uid=${firstRejectedUid ?? "unknown"}`.slice(0, 500)
    : null;

  await client
    .from("whs_connections")
    .update({
      initial_sync_complete: true,
      last_synced_at: new Date().toISOString(),
      last_sync_status: isPartial ? "partial" : "ok",
      last_sync_error: partialError,
      consecutive_failures: 0,
    })
    .eq("id", connectionId);

  if (isPartial) console.warn(`[connect-whs] partial initial import for ${connectionId}: ${partialError}`);

  return { scoresImported, friendsImported, scoresRejected, firstRejectedUid };
}

async function upsertFriends(
  client: SupabaseClient,
  connectionId: string,
  friends: EgFriend[],
): Promise<number> {
  if (friends.length === 0) return 0;

  const rows = friends.map((f) => ({
    connection_id: connectionId,
    friend_passport_id: f.PassportId,
    friend_name: f.Name,
    friend_gender: f.Gender,
    friend_home_club: f.HomeClub?.Name ?? null,
    friend_handicap_index: f.HandicapIndex,
    friend_thumbnail_url: f.ThumbnailUrl,
    friend_privacy_mode: f.PrivacyMode,
    last_round_played_at: f.LastScore?.PlayDate?.split("T")[0] ?? null,
    last_round_course_name: f.LastScore?.Course?.Name ?? null,
    last_round_adjusted_gross: f.LastScore?.AdjustedGross ?? null,
    last_seen_at: new Date().toISOString(),
  }));

  const { error } = await client
    .from("whs_friends")
    .upsert(rows, { onConflict: "connection_id,friend_passport_id" });
  if (error) {
    console.error("[connect-whs] upsert friends failed:", error);
    return 0;
  }
  return rows.length;
}

// =============================================================================
// Main handler
// =============================================================================

function errResponse(error: ConnectError, status = 400): Response {
  return Response.json(error, { status, headers: CORS_HEADERS });
}

/**
 * Record the attempt so support can read the failure reason WITHOUT log access —
 * edge logs retain roughly an hour, which is shorter than the time it takes a
 * member to report a problem.
 */
async function recordAttempt(
  admin: SupabaseClient,
  userId: string,
): Promise<string | null> {
  try {
    const { data, error } = await admin
      .from("whs_connect_attempts")
      .insert({ user_id: userId, provider: "england_golf", outcome: "started" })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  } catch (err) {
    console.error(JSON.stringify({ fn: "connect-whs", event: "attempt_insert_failed", detail: String(err) }));
    return null;
  }
}

async function finishAttempt(
  admin: SupabaseClient,
  attemptId: string | null,
  fields: {
    outcome: "success" | "failure";
    error_code?: string | null;
    failure_reason?: string | null;
    eg_status?: number | null;
    connection_id?: string | null;
    duration_ms: number;
  },
): Promise<void> {
  if (!attemptId) return;
  try {
    await admin
      .from("whs_connect_attempts")
      .update({
        outcome: fields.outcome,
        error_code: fields.error_code ?? null,
        failure_reason: fields.failure_reason ? String(fields.failure_reason).slice(0, 500) : null,
        eg_status: fields.eg_status ?? null,
        connection_id: fields.connection_id ?? null,
        duration_ms: fields.duration_ms,
        finished_at: new Date().toISOString(),
      })
      .eq("id", attemptId);
  } catch (err) {
    console.error(JSON.stringify({ fn: "connect-whs", event: "attempt_update_failed", detail: String(err) }));
  }
}

Deno.serve(async (req) => {
  const runId = crypto.randomUUID().slice(0, 8);
  const startedAt = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    logLine("warn", runId, "rejected", { reason: "method_not_allowed", method: req.method });
    return errResponse({ ok: false, error_code: "invalid_request", message: "POST only" }, 405);
  }

  // 1. Authenticate the Clbhouz user
  const user = await getAuthenticatedUser(req);
  if (!user) {
    logLine("error", runId, "outcome", { ok: false, error_code: "not_authenticated", ms: Date.now() - startedAt });
    return errResponse({ ok: false, error_code: "not_authenticated", message: "Sign in to Clbhouz first" }, 401);
  }

  // ATTEMPT line — user id only, never the membership number or password.
  logLine("info", runId, "attempt", { user_id: user.id, provider: "england_golf" });


  const admin = adminClient();
  const attemptId = await recordAttempt(admin, user.id);

  /**
   * The single failure exit. Logs the OUTCOME line at error level and writes the
   * reason onto the attempt row before returning the member-facing error.
   */
  const fail = async (
    errorCode: ConnectError["error_code"],
    message: string,
    status: number,
    reason: string,
    egStatus: number | null = null,
  ): Promise<Response> => {
    const ms = Date.now() - startedAt;
    logLine("error", runId, "outcome", {
      ok: false,
      user_id: user.id,
      error_code: errorCode,
      reason,
      eg_status: egStatus,
      ms,
    });
    await finishAttempt(admin, attemptId, {
      outcome: "failure",
      error_code: errorCode,
      failure_reason: reason,
      eg_status: egStatus,
      duration_ms: ms,
    });
    return errResponse({ ok: false, error_code: errorCode, message }, status);
  };

  try {
    // 2. Parse request body
    let body: ConnectRequest;
    try {
      body = await req.json();
    } catch {
      return await fail("invalid_request", "Invalid JSON body", 400, "malformed json body");
    }
    if (!body.membership_number || !body.password) {
      return await fail(
        "invalid_request",
        "membership_number and password are required",
        400,
        "missing membership_number or password",
      );
    }

    // 3. Check the user isn't already actively connected. We use a soft-delete
    //    pattern (deleted_at timestamp) so disconnected users keep their scores
    //    for leaderboard preservation. Only an ACTIVE (deleted_at IS NULL) row
    //    counts as "already connected". A soft-deleted row will be revived in
    //    step 7 below.
    const { data: existing } = await admin
      .from("whs_connections")
      .select("id, deleted_at")
      .eq("user_id", user.id)
      .eq("provider", "england_golf")
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) {
      return await fail(
        "already_connected",
        "Already connected to England Golf — disconnect first to re-link",
        409,
        `active connection ${existing.id} already exists`,
      );
    }

    // Also check for a soft-deleted row we'll revive later
    const { data: softDeleted } = await admin
      .from("whs_connections")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "england_golf")
      .not("deleted_at", "is", null)
      .maybeSingle();

    // 4. Authenticate with England Golf
    let egToken: string;
    let passportId: number;
    try {
      const auth = await egAuth(body.membership_number, body.password);
      egToken = auth.token;
      passportId = auth.decoded.passportId;
      logLine("info", runId, "eg_auth", { user_id: user.id, status: 200, kind: "ok" });
    } catch (err) {
      const c = classify(err);
      logLine("error", runId, "eg_auth", {
        user_id: user.id,
        status: c.status,
        kind: c.kind,
        detail: c.detail.slice(0, 300),
      });
      if (c.kind === "auth_failed") {
        return await fail(
          "eg_auth_failed",
          "England Golf rejected those credentials. Check your membership number and password.",
          401,
          `eg auth rejected: ${c.detail}`,
          c.status,
        );
      }
      if (c.kind === "transient_error" || c.kind === "rate_limited" || c.kind === "timeout") {
        return await fail(
          "eg_unavailable",
          "England Golf is temporarily unreachable. Please try again in a few minutes.",
          503,
          `eg ${c.kind}: ${c.detail}`,
          c.status,
        );
      }
      return await fail(
        "internal_error",
        "Something went wrong connecting to England Golf",
        500,
        `eg auth ${c.kind}: ${c.detail}`,
        c.status,
      );
    }

    // 5. Fetch user details (handicap index, name, club)
    let userDetails;
    try {
      userDetails = await egGetUserDetails(egToken);
      logLine("info", runId, "eg_user_details", {
        user_id: user.id,
        status: 200,
        has_handicap: Number.isFinite(userDetails.HandicapIndex),
      });
    } catch (err) {
      const c = classify(err);
      logLine("error", runId, "eg_user_details", {
        user_id: user.id,
        status: c.status,
        kind: c.kind,
        detail: c.detail.slice(0, 300),
      });
      return await fail(
        "eg_unavailable",
        "Authenticated but couldn't fetch profile. Please try again.",
        503,
        `eg user-details ${c.kind}: ${c.detail}`,
        c.status,
      );
    }

    // 6. Store the password in Vault
    let vaultSecretId: string;
    try {
      vaultSecretId = await storeVaultSecret(
        admin,
        body.password,
        `WHS credential for Clbhouz user ${user.id} / passport ${passportId}`,
      );
    } catch (err) {
      const c = classify(err);
      return await fail(
        "internal_error",
        "Couldn't securely store credentials. Please try again.",
        500,
        `vault store failed: ${c.detail}`,
      );
    }

    // 7. Insert or revive the connection row.
    //    - If a soft-deleted row exists (from a prior disconnect), revive it by
    //      clearing deleted_at and updating the credential fields. This keeps the
    //      same row id so historical whs_scores / whs_friends / whs_handicap_snapshots
    //      remain attached (no cascade-delete loss).
    //    - Otherwise insert a fresh row.
    let connection: { id: string } | null;
    let insertErr: { message: string } | null = null;

    if (softDeleted) {
      const { data, error } = await admin
        .from("whs_connections")
        .update({
          passport_id: passportId,
          membership_number: body.membership_number,
          vault_secret_id: vaultSecretId,
          deleted_at: null,
          last_sync_status: null,
          last_sync_error: null,
          consecutive_failures: 0,
          initial_sync_complete: false,
          next_sync_after: null,
        })
        .eq("id", softDeleted.id)
        .select("id")
        .single();
      connection = data;
      insertErr = error;
    } else {
      const { data, error } = await admin
        .from("whs_connections")
        .insert({
          user_id: user.id,
          provider: "england_golf",
          passport_id: passportId,
          membership_number: body.membership_number,
          vault_secret_id: vaultSecretId,
        })
        .select("id")
        .single();
      connection = data;
      insertErr = error;
    }

    if (insertErr || !connection) {
      // Best-effort: try to remove the orphaned vault secret
      await admin.from("vault.secrets").delete().eq("id", vaultSecretId);
      return await fail(
        "internal_error",
        `Couldn't save the connection: ${insertErr?.message ?? "unknown"}`,
        500,
        `connection ${softDeleted ? "revive" : "insert"} failed: ${insertErr?.message ?? "no row returned"}`,
      );
    }

    // 8. Initial sync (handicap snapshot + scores + friends)
    let syncResult: SyncResult = { scoresImported: 0, friendsImported: 0, scoresRejected: 0, firstRejectedUid: null };
    try {
      syncResult = await runInitialSync(
        admin,
        connection.id,
        passportId,
        egToken,
        userDetails.HandicapIndex,
      );
    } catch (err) {
      logLine("error", runId, "initial_sync_failed", {
        user_id: user.id,
        connection_id: connection.id,
        detail: classify(err).detail.slice(0, 300),
      });
      // Non-fatal — connection is saved, sync worker will retry
    }

    // 8b. Write the federation figure onto the profile. This is the ONLY writer
    //     of eg_handicap_index and it clears manual_handicap_index in the same
    //     statement, so a member who had a manual figure cannot trip the
    //     user_profiles_single_handicap_source check constraint.
    if (Number.isFinite(userDetails.HandicapIndex)) {
      try {
        await syncProfileHandicapIndex(admin, connection.id, userDetails.HandicapIndex);
      } catch (err) {
        logLine("warn", runId, "profile_handicap_write_failed", {
          user_id: user.id,
          connection_id: connection.id,
          detail: classify(err).detail.slice(0, 300),
        });
      }
    }

    // 9. Success payload
    const success: ConnectSuccess = {
      ok: true,
      connection_id: connection.id,
      passport_id: passportId,
      name: userDetails.Name,
      handicap_index: userDetails.HandicapIndex,
      home_club: userDetails.Clubs?.[0]?.Name ?? null,
      scores_imported: syncResult.scoresImported,
      friends_imported: syncResult.friendsImported,
    };

    // 10. Fire-and-forget: trigger backfill-whs-holes chain to populate hole
    //     data for the historical scores we just imported. Uses the calling
    //     user's JWT so backfill authenticates as them. Chain runs over the
    //     next 30-60s in the background; cron is the safety net.
    try {
      const projectUrl = Deno.env.get("SUPABASE_URL")!;
      const userAuthHeader = req.headers.get("Authorization");
      const apiKey = req.headers.get("apikey");
      if (userAuthHeader && apiKey) {
        fetch(`${projectUrl}/functions/v1/backfill-whs-holes`, {
          method: "POST",
          headers: {
            "Authorization": userAuthHeader,
            "apikey": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chain_position: 0 }),
        }).catch((e) => {
          logLine("warn", runId, "backfill_spawn_failed", { user_id: user.id, detail: String(e).slice(0, 200) });
        });
      }
    } catch (e) {
      logLine("warn", runId, "backfill_setup_failed", { user_id: user.id, detail: String(e).slice(0, 200) });
    }

    const ms = Date.now() - startedAt;
    await finishAttempt(admin, attemptId, {
      outcome: "success",
      connection_id: connection.id,
      duration_ms: ms,
    });
    // OUTCOME line — final statement of the run.
    logLine("info", runId, "outcome", {
      ok: true,
      user_id: user.id,
      connection_id: connection.id,
      scores_imported: syncResult.scoresImported,
      scores_rejected: syncResult.scoresRejected,
      friends_imported: syncResult.friendsImported,
      ms,
    });
    return Response.json(success, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    // Nothing may escape the handler unlogged — an unhandled throw was the exact
    // shape of the silent 18:35-18:40 failures.
    const c = classify(err);
    return await fail("internal_error", "Something went wrong connecting to England Golf", 500, `unhandled ${c.kind}: ${c.detail}`);
  }
});
