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
  insertHandicapSnapshotIfChanged,
  EgApiError,
  type EgScore,
  type EgFriend,
} from "../_shared/eg-api.ts";

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
  let scoresImported = 0;
  try {
    const { Scores } = await egListScores(egToken, passportId, 1, 300);
    scoresImported = await upsertScores(client, connectionId, Scores);
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

  // 4. Mark initial sync complete + record timestamp
  await client
    .from("whs_connections")
    .update({
      initial_sync_complete: true,
      last_synced_at: new Date().toISOString(),
      last_sync_status: "ok",
      consecutive_failures: 0,
    })
    .eq("id", connectionId);

  return { scoresImported, friendsImported };
}

async function upsertScores(
  client: SupabaseClient,
  connectionId: string,
  scores: EgScore[],
): Promise<number> {
  // _overseas_fix_applied — 2026-05-17
  // EG returns TotalHoles=0 for summary-only rounds (club-entered totals where
  // individual hole scores aren't captured). This is most common for overseas
  // rounds where players hand their scorecards to their home club to record.
  // These rounds are real and count for handicap; they just lack hole-by-hole
  // detail. We default TotalHoles=0 to 9 (if IsNineHole) or 18 (full round)
  // and preserve the score. hole_by_hole_fetched flag elsewhere handles the
  // "no hole detail available" state correctly.
  const validScores: EgScore[] = scores.map((s) => {
    const raw = s.TotalHoles;
    if (raw == null || raw === 0) {
      const inferred = s.IsNineHole ? 9 : 18;
      return { ...s, TotalHoles: inferred };
    }
    return s;
  });

  if (validScores.length === 0) return 0;

  // Upsert courses first so we can reference them
  const courseRows = await upsertCoursesFromScores(client, validScores);

  const rows = validScores.map((s) => ({
    connection_id: connectionId,
    upstream_score_id: s.ScoreId,
    whs_score_uid: s.WHSScoreUID,
    course_id: courseRows.get(s.Course?.CourseId ?? -1) ?? null,
    play_date: s.PlayDate.split("T")[0], // ISO date portion only
    capture_date: s.CaptureDate,
    total_holes: s.TotalHoles ?? 18,
    is_nine_hole: s.IsNineHole ?? false,
    actual_gross: s.ActualGross,
    adjusted_gross: s.AdjustedGross,
    stableford_points: s.StablefordPoints,
    course_rating: s.CourseRating ?? s.Marker?.CourseRating ?? null,
    slope_rating: s.SlopeRating ?? s.Marker?.SlopeRating ?? null,
    pcc: s.Pcc,
    marker_name: s.Marker?.Name ?? null,
    course_handicap: s.CourseHandicap,
    handicap_differential: s.HandicapDifferential,
    handicap_index_at_time: s.HandicapIndex,
    is_counter: s.IsCounter ?? false,
    is_considered: s.IsConsidered ?? false,
    is_competition_score: s.IsCompetitionScore ?? false,
    is_penalty_score: s.IsPenaltyScore ?? false,
    is_eligible_for_handicapping: s.IsEligibleForHandicapping ?? true,
    all_holes_attempted: s.AllHolesAttempted ?? true,
    permalink_url: s.PermalinkURL,
    raw_payload: s,
  }));

  const { error } = await client
    .from("whs_scores")
    .upsert(rows, { onConflict: "connection_id,whs_score_uid", ignoreDuplicates: false });
  if (error) {
    console.error("[connect-whs] upsert scores failed:", error);
    return 0;
  }
  return rows.length;
}

async function upsertCoursesFromScores(
  client: SupabaseClient,
  scores: EgScore[],
): Promise<Map<number, string>> {
  // Collect unique courses
  const seen = new Map<number, EgScore>();
  for (const s of scores) {
    if (s.Course?.CourseId != null && !seen.has(s.Course.CourseId)) {
      seen.set(s.Course.CourseId, s);
    }
  }
  if (seen.size === 0) return new Map();

  const rows = Array.from(seen.values()).map((s) => ({
    provider: "england_golf" as const,
    upstream_course_id: s.Course!.CourseId!,
    name: s.Course!.Name ?? s.Course!.CourseName ?? "Unknown course",
    country_code: s.Course!.Country?.Code ?? null,
    country_name: s.Course!.Country?.Name ?? null,
    is_linked_to_multi_course_club: s.Course!.IsLinkedToMultiCourseClub ?? false,
    last_seen_course_rating: s.CourseRating ?? s.Marker?.CourseRating ?? null,
    last_seen_slope_rating: s.SlopeRating ?? s.Marker?.SlopeRating ?? null,
    last_seen_marker_name: s.Marker?.Name ?? null,
  }));

  const { data, error } = await client
    .from("whs_courses")
    .upsert(rows, { onConflict: "provider,upstream_course_id" })
    .select("id, upstream_course_id");

  if (error) {
    console.error("[connect-whs] upsert courses failed:", error);
    return new Map();
  }

  const idMap = new Map<number, string>();
  for (const row of data ?? []) {
    idMap.set(row.upstream_course_id as number, row.id as string);
  }
  return idMap;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return errResponse({ ok: false, error_code: "invalid_request", message: "POST only" }, 405);
  }

  // 1. Authenticate the Clbhouz user
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return errResponse({ ok: false, error_code: "not_authenticated", message: "Sign in to Clbhouz first" }, 401);
  }

  // 2. Parse request body
  let body: ConnectRequest;
  try {
    body = await req.json();
  } catch {
    return errResponse({ ok: false, error_code: "invalid_request", message: "Invalid JSON body" });
  }
  if (!body.membership_number || !body.password) {
    return errResponse({ ok: false, error_code: "invalid_request", message: "membership_number and password are required" });
  }

  const admin = adminClient();

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
    return errResponse({
      ok: false,
      error_code: "already_connected",
      message: "Already connected to England Golf — disconnect first to re-link",
    }, 409);
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
  } catch (err) {
    if (err instanceof EgApiError) {
      if (err.kind === "auth_failed") {
        return errResponse({
          ok: false,
          error_code: "eg_auth_failed",
          message: "England Golf rejected those credentials. Check your membership number and password.",
        }, 401);
      }
      if (err.kind === "transient_error" || err.kind === "rate_limited") {
        return errResponse({
          ok: false,
          error_code: "eg_unavailable",
          message: "England Golf is temporarily unreachable. Please try again in a few minutes.",
        }, 503);
      }
    }
    console.error("[connect-whs] unexpected EG auth error:", err);
    return errResponse({
      ok: false,
      error_code: "internal_error",
      message: "Something went wrong connecting to England Golf",
    }, 500);
  }

  // 5. Fetch user details (handicap index, name, club)
  let userDetails;
  try {
    userDetails = await egGetUserDetails(egToken);
  } catch (err) {
    console.error("[connect-whs] user-details fetch failed:", err);
    return errResponse({
      ok: false,
      error_code: "eg_unavailable",
      message: "Authenticated but couldn't fetch profile. Please try again.",
    }, 503);
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
    console.error("[connect-whs] vault store failed:", err);
    return errResponse({
      ok: false,
      error_code: "internal_error",
      message: "Couldn't securely store credentials. Please try again.",
    }, 500);
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
    console.error("[connect-whs] connection insert/revive failed:", insertErr);
    // Best-effort: try to remove the orphaned vault secret
    await admin.from("vault.secrets").delete().eq("id", vaultSecretId);
    return errResponse({
      ok: false,
      error_code: "internal_error",
      message: `Couldn't save the connection: ${insertErr?.message ?? "unknown"}`,
    }, 500);
  }

  // 8. Initial sync (handicap snapshot + scores + friends)
  let syncResult: SyncResult = { scoresImported: 0, friendsImported: 0 };
  try {
    syncResult = await runInitialSync(
      admin,
      connection.id,
      passportId,
      egToken,
      userDetails.HandicapIndex,
    );
  } catch (err) {
    console.error("[connect-whs] initial sync failed:", err);
    // Non-fatal — connection is saved, sync worker will retry
  }

  // 9. Return success
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
        console.error("[connect-whs] backfill chain spawn failed (non-fatal):", e);
      });
    }
  } catch (e) {
    console.error("[connect-whs] backfill chain setup error (non-fatal):", e);
  }

  return Response.json(success, { status: 200, headers: CORS_HEADERS });
});
