// supabase/functions/_shared/eg-api.ts
//
// Shared library for talking to England Golf's WHS API
// (api.whsplatform.englandgolf.org, vendored by DotGolf).
//
// Imported by every Edge Function that needs to call EG: connect-whs, sync-whs-due,
// future score-detail-fetcher, etc.
//
// This module is pure. No state, no caching, no DB access. Callers handle:
//   - obtaining the user's password (via Vault decryption in the calling fn)
//   - rate limiting and retry strategy
//   - persistence of returned data
//
// Pre-auth token: see getPreAuthToken() — currently env var, will become a
// `mintPreAuthToken()` call once Phase 2.5 (HMAC extraction) lands.

// =============================================================================
// Configuration
// =============================================================================

const EG_BASE = "https://api.whsplatform.englandgolf.org";

// Headers that mimic the iOS app. Will revisit once Phase 2.5 lets us identify
// as Clbhouz with our own client ID.
const COMMON_HEADERS: Record<string, string> = {
  "Accept": "application/json",
  "Accept-Language": "en-GB,en;q=0.9",
  "X-DG-AppClientId": "7437B0E3-0313-41FE-9B3E-D4CE320EB298",
  "X-DG-AppPlatform": "iOS 26.3.1",
  "User-Agent": "MyGolf/2.0.8+28820619 (iOS 26.3.1, 7437B0E3-0313-41FE-9B3E-D4CE320EB298)",
};

function egPlayDateToLocal(playDate: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(playDate));
}

// =============================================================================
// Error types — callers branch on `kind` to decide retry/abort
// =============================================================================

export type EgErrorKind =
  | "auth_failed"           // user creds wrong, or pre-auth token rejected
  | "rate_limited"          // 429
  | "transient_error"       // 5xx, network failure, timeout
  | "not_found"             // 404
  | "bad_request"           // 400
  | "unknown_error";        // anything else

export class EgApiError extends Error {
  readonly kind: EgErrorKind;
  readonly status: number;
  readonly upstreamBody: string | null;
  constructor(kind: EgErrorKind, status: number, message: string, upstreamBody: string | null = null) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.upstreamBody = upstreamBody;
  }
}

function classifyResponse(status: number, body: string): EgErrorKind {
  if (status === 401) return "auth_failed";
  if (status === 429) return "rate_limited";
  if (status === 404) return "not_found";
  if (status >= 500) return "transient_error";
  if (status === 400) return "bad_request";
  return "unknown_error";
}

// =============================================================================
// Pre-auth token — abstracted so we can swap implementations
// =============================================================================

/**
 * Returns the pre-auth Bearer token required to call /auth/credentials-token.
 *
 * Today: read from EG_PREAUTH_TOKEN env var (set via `supabase secrets set`).
 *        Captured manually from the iOS app via mitmproxy, refreshed every ~10h.
 *
 * Phase 2.5 future: call mintPreAuthToken() which signs a fresh JWT using the
 *                  HMAC secret extracted from the iOS app binary.
 */
export function getPreAuthToken(): string {
  const tok = Deno.env.get("EG_PREAUTH_TOKEN");
  if (!tok) {
    throw new EgApiError(
      "auth_failed",
      0,
      "EG_PREAUTH_TOKEN env var not set — call supabase secrets set EG_PREAUTH_TOKEN=<token>",
    );
  }
  return tok;
}

// =============================================================================
// Internal: HTTP helpers
// =============================================================================

interface CallOpts {
  method: "GET" | "POST" | "PUT";
  path: string;
  body?: unknown;
  bearer: string;            // either the pre-auth token (login only) or the user JWT (everything else)
}

async function call<T>(opts: CallOpts): Promise<T> {
  const headers: Record<string, string> = {
    ...COMMON_HEADERS,
    "Authorization": `Bearer ${opts.bearer}`,
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json; charset=utf-8";
  }

  let res: Response;
  try {
    res = await fetch(`${EG_BASE}${opts.path}`, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    // Network-level failure — DNS, TLS, timeout, etc.
    throw new EgApiError(
      "transient_error",
      0,
      `Network error calling ${opts.method} ${opts.path}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    const text = await res.text();
    throw new EgApiError(
      classifyResponse(res.status, text),
      res.status,
      `${opts.method} ${opts.path} returned ${res.status} ${res.statusText}`,
      text,
    );
  }

  // EG returns JSON for everything we care about
  return await res.json() as T;
}

// =============================================================================
// JWT helpers
// =============================================================================

export interface DecodedUserJwt {
  passportId: number;
  iss: string;
  iat: number;
  exp: number;
}

export function decodeUserJwt(token: string): DecodedUserJwt {
  const [, payload] = token.split(".");
  const padded = payload + "=".repeat((4 - payload.length % 4) % 4);
  const decoded = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded) as DecodedUserJwt;
}

// =============================================================================
// Endpoint: authenticate
// POST /api/v1/auth/credentials-token
// =============================================================================

export interface AuthTokenResponse {
  Token: string;
}

/**
 * Exchanges a user's membership number + password for a short-lived JWT.
 * The JWT cannot be reused after it's used — every sync re-authenticates.
 */
export async function egAuth(membershipNumber: string, password: string): Promise<{
  token: string;
  decoded: DecodedUserJwt;
}> {
  const data = await call<AuthTokenResponse>({
    method: "POST",
    path: "/api/v1/auth/credentials-token",
    body: { userName: membershipNumber, password },
    bearer: getPreAuthToken(),
  });

  if (!data.Token) {
    throw new EgApiError(
      "auth_failed",
      200,
      `Auth response missing Token field: ${JSON.stringify(data)}`,
    );
  }

  return {
    token: data.Token,
    decoded: decodeUserJwt(data.Token),
  };
}

// =============================================================================
// Endpoint: user details (current user's profile + handicap)
// GET /api/v1/user/user-details
// =============================================================================

export interface EgClub {
  ClubId: number;
  Name: string;
  IsHomeClub: boolean;
  MemberCode: string;
  IsCategoryNineHole?: boolean;
}

export interface EgUserDetails {
  Name: string;
  FirstName: string;
  LastName: string;
  Gender: string;
  Dob: string;
  Email: string;
  PhoneNumber: string;
  HandicapIndex: number;
  CentralMemberCode: string;
  Clubs: EgClub[];
  // ... many more fields, see raw response in recon report
}

export async function egGetUserDetails(token: string): Promise<EgUserDetails> {
  return await call<EgUserDetails>({
    method: "GET",
    path: "/api/v1/user/user-details",
    bearer: token,
  });
}

// =============================================================================
// Endpoint: list scores (paginated WHS history)
// POST /api/v1/mygolf/whs/list-scores
// =============================================================================

export interface EgCourseRef {
  CourseId: number | null;
  CourseName: string;
  Name: string;
  Country?: { CountryId: number; Name: string; Code: string } | null;
  IsLinkedToMultiCourseClub?: boolean;
}

export interface EgMarker {
  Name: string;
  CourseRating: number | null;
  SlopeRating: number | null;
}

export interface EgScore {
  ScoreId: number;
  WHSScoreUID: string | null;
  ActualGross: number | null;
  AdjustedGross: number | null;
  PlayDate: string;
  CaptureDate: string | null;
  Course: EgCourseRef;
  Marker: EgMarker;
  HandicapIndex: number | null;
  HandicapDifferential: number | null;
  CourseHandicap: number | null;
  CourseRating: number | null;
  SlopeRating: number | null;
  Pcc: number | null;
  StablefordPoints: number | null;
  IsCounter: boolean;
  IsConsidered: boolean;
  IsNineHole: boolean;
  IsCompetitionScore: boolean;
  IsPenaltyScore: boolean;
  IsEligibleForHandicapping: boolean;
  AllHolesAttempted: boolean;
  TotalHoles: number;
  PermalinkURL: string | null;
  // many more fields preserved in raw_payload at the DB layer
}

export interface EgListScoresResponse {
  TotalScoreCount: number;
  Scores: EgScore[];
}

export async function egListScores(
  token: string,
  passportId: number,
  page: number = 1,
  pageSize: number = 30,
): Promise<EgListScoresResponse> {
  return await call<EgListScoresResponse>({
    method: "POST",
    path: "/api/v1/mygolf/whs/list-scores",
    body: {
      FacilityTypeId: null,
      numberOfHoles: null,
      PageNumber: page,
      PageSize: pageSize,
      PassportId: passportId,
      CasualScoresOnly: false,
    },
    bearer: token,
  });
}

// =============================================================================
// Endpoint: counted-period scores (the 8 driving the current handicap)
// POST /api/v1/mygolf/whs/list-counted-period-scores/{passportId}
// =============================================================================

export interface EgCountedScoresResponse {
  Scores: EgScore[];
}

export async function egListCountedScores(
  token: string,
  passportId: number,
): Promise<EgCountedScoresResponse> {
  return await call<EgCountedScoresResponse>({
    method: "POST",
    path: `/api/v1/mygolf/whs/list-counted-period-scores/${passportId}`,
    body: {
      PassportId: passportId,
      FacilityTypeId: null,
      NumberOfHoles: null,
      CasualScoresOnly: false,
    },
    bearer: token,
  });
}

// =============================================================================
// Endpoint: scorecard hole-by-hole detail
// GET /api/v1/mygolf/score/{scoreId}
// =============================================================================

export interface EgHole {
  HoleNo: number;
  HoleAlias: string;
  ActualGross: number | null;
  AdjustedGross: number | null;
  Played: boolean;
  Distance: number | null;
  Par: number;
  Stroke: number | null;
  StrokesAllowed: number;
  HoleId: number;
}

export interface EgScorecardResponse {
  Score: EgScore & {
    Holes: EgHole[];
    EnteredHoleByHole: boolean;
  };
}

export async function egGetScorecard(
  token: string,
  scoreId: number,
): Promise<EgScorecardResponse> {
  return await call<EgScorecardResponse>({
    method: "GET",
    path: `/api/v1/mygolf/score/${scoreId}`,
    bearer: token,
  });
}

// =============================================================================
// Endpoint: friends list
// POST /api/v1/mygolf/list-friends
// =============================================================================

export interface EgFriend {
  RowNum: number;
  PassportId: number;
  PassportUID: string;
  Name: string;
  Gender: string;
  IsNineHole: boolean;
  PrivacyMode: string;
  HomeClub: { Name: string };
  HandicapIndex: number | null;
  HandicapIndexText: string | null;
  LastScore: EgScore | null;
  ThumbnailUrl: string | null;
}

export interface EgListFriendsResponse {
  TotalFriendCount: number;
  Friends: EgFriend[];
}

export async function egListFriends(
  token: string,
  page: number = 1,
  pageSize: number = 30,
  sortAscending: boolean = true,
  sortKey: string = "Name",
): Promise<EgListFriendsResponse> {
  return await call<EgListFriendsResponse>({
    method: "POST",
    path: "/api/v1/mygolf/list-friends",
    body: {
      PageNumber: page,
      PageSize: pageSize,
      SortAscending: sortAscending,
      SortKey: sortKey,
    },
    bearer: token,
  });
}

// =============================================================================
// Sync helpers (used by connect-whs and sync-whs-due)
// =============================================================================
//
// These functions take a Supabase admin client (service_role) and persist
// the data returned from the EG API into our schema. Same upsert keys we
// established in Phase 2:
//   - whs_courses keyed on (provider, upstream_course_id)
//   - whs_scores  keyed on (connection_id, whs_score_uid)
//   - whs_friends keyed on (connection_id, friend_passport_id)

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export interface SyncSummary {
  scoresUpserted: number;
  friendsUpserted: number;
  coursesUpserted: number;
  handicapSnapshotInserted: boolean;
}

/**
 * Insert a handicap snapshot if it differs from the most recent one for this connection.
 * Returns true if a row was inserted, false if the value matched the previous snapshot.
 */
export async function insertHandicapSnapshotIfChanged(
  client: SupabaseClient,
  connectionId: string,
  handicapIndex: number,
): Promise<boolean> {
  const { data: latest } = await client
    .from("whs_handicap_snapshots")
    .select("handicap_index")
    .eq("connection_id", connectionId)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && Number(latest.handicap_index) === handicapIndex) {
    return false;
  }

  const { error } = await client
    .from("whs_handicap_snapshots")
    .insert({ connection_id: connectionId, handicap_index: handicapIndex });

  if (error) {
    console.error("[eg-api] handicap snapshot insert failed:", error);
    return false;
  }
  return true;
}

/**
 * Upsert courses for the given scores. Returns a Map of upstream_course_id → DB UUID.
 */
export async function upsertCoursesFromScores(
  client: SupabaseClient,
  scores: EgScore[],
): Promise<Map<number, string>> {
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
    console.error("[eg-api] upsert courses failed:", error);
    return new Map();
  }

  const idMap = new Map<number, string>();
  for (const row of data ?? []) {
    idMap.set(row.upstream_course_id as number, row.id as string);
  }
  return idMap;
}

export interface ScoreUpsertRejection {
  whsScoreUid: string | null;
  playDate: string | null;
  constraint: string | null;
  message: string;
}

export interface ScoreUpsertResult {
  written: number;
  rejected: number;
  failures: ScoreUpsertRejection[];
}

/**
 * Upsert scores for a connection. Existing scores get updated, new scores get inserted.
 * Fast path is a single batch statement. If that statement fails, we retry row by
 * row so ONE unstorable score can never lose the other 29 — and every rejection is
 * reported back to the caller rather than swallowed.
 */
export async function upsertScores(
  client: SupabaseClient,
  connectionId: string,
  scores: EgScore[],
): Promise<ScoreUpsertResult> {
  const empty: ScoreUpsertResult = { written: 0, rejected: 0, failures: [] };
  if (scores.length === 0) return empty;

  const courseRows = await upsertCoursesFromScores(client, scores);

  const rows = scores
    .filter((s) => s.WHSScoreUID != null) // can't dedup without UID
    .map((s) => ({
      connection_id: connectionId,
      upstream_score_id: s.ScoreId,
      whs_score_uid: s.WHSScoreUID,
      course_id: courseRows.get(s.Course?.CourseId ?? -1) ?? null,
      play_date: egPlayDateToLocal(s.PlayDate),
      capture_date: s.CaptureDate,
      // England Golf returns some scores with TotalHoles 0 and Holes null. The
      // cause is not isolated — it is NOT simply "played abroad", since overseas
      // rounds from eight countries store correctly. `?? 18` did not catch the
      // zero, which reached a `total_holes > 0` check constraint and rejected the
      // WHOLE 30-score batch every six hours. Two members had no working score
      // sync from the day they connected. Resolve explicitly from IsNineHole, and
      // never from Holes.length.
      total_holes:
        s.TotalHoles && s.TotalHoles > 0 ? s.TotalHoles
          : (s.IsNineHole ? 9 : 18),
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

  if (rows.length === 0) return empty;

  const { error } = await client
    .from("whs_scores")
    .upsert(rows, { onConflict: "connection_id,whs_score_uid" });

  if (!error) {
    return { written: rows.length, rejected: 0, failures: [] };
  }

  // Batch failed — one or more rows are unstorable. Retry individually so the
  // good rounds still land, and log each bad row precisely.
  console.error(
    `[eg-api] batch upsert scores failed for ${connectionId} (${rows.length} rows), retrying row by row:`,
    error.message,
  );

  let written = 0;
  const failures: ScoreUpsertRejection[] = [];
  for (const row of rows) {
    const { error: rowErr } = await client
      .from("whs_scores")
      .upsert([row], { onConflict: "connection_id,whs_score_uid" });
    if (!rowErr) {
      written++;
      continue;
    }
    const constraintName =
      (rowErr as any).details?.match?.(/constraint "([^"]+)"/)?.[1] ??
      (rowErr.message ?? "").match(/constraint "([^"]+)"/)?.[1] ??
      (rowErr as any).code ??
      null;
    failures.push({
      whsScoreUid: (row.whs_score_uid as string | null) ?? null,
      playDate: (row.play_date as string | null) ?? null,
      constraint: constraintName,
      message: rowErr.message,
    });
    console.error(
      `[eg-api] score rejected conn=${connectionId} uid=${row.whs_score_uid} play_date=${row.play_date} constraint=${constraintName}: ${rowErr.message}`,
    );
  }

  return { written, rejected: failures.length, failures };
}

/**
 * Upsert friends. Updates last_seen_at on existing rows; inserts new ones.
 */
export async function upsertFriends(
  client: SupabaseClient,
  connectionId: string,
  friends: EgFriend[],
): Promise<number> {
  if (friends.length === 0) return 0;

  const now = new Date().toISOString();
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
    last_seen_at: now,
  }));

  const { error } = await client
    .from("whs_friends")
    .upsert(rows, { onConflict: "connection_id,friend_passport_id" });

  if (error) {
    console.error("[eg-api] upsert friends failed:", error);
    return 0;
  }
  return rows.length;
}

/**
 * Decrypt a Vault secret to recover the user's stored password.
 * Only callable with service_role privileges.
 */
export async function decryptVaultSecret(
  client: SupabaseClient,
  vaultSecretId: string,
): Promise<string> {
  const { data, error } = await client.rpc("vault_decrypt_secret", { secret_id: vaultSecretId });
  if (error) {
    throw new Error(`Failed to decrypt vault secret ${vaultSecretId}: ${error.message}`);
  }
  if (!data) {
    throw new Error(`Vault secret ${vaultSecretId} returned empty`);
  }
  return data as string;
}

export interface HoleEnrichmentResult {
  scoreId: string;          // our internal whs_scores.id (uuid)
  upstreamScoreId: number;  // EG ScoreId
  fetched: boolean;         // did we get a clean response from EG?
  holesUpserted: number;    // how many hole rows landed (0 if EG returned no holes)
}

/**
 * For a list of internal whs_scores rows, fetch each one's hole detail from EG
 * and upsert into whs_score_holes. Marks parent rows hole_by_hole_fetched = true.
 *
 * Sequential with a small delay between calls so we look like normal app traffic.
 * 200ms delay × 30 scores = ~6s for a typical backfill.
 */
export async function enrichScoresWithHoles(
  client: SupabaseClient,
  token: string,
  scores: Array<{ id: string; upstream_score_id: number | null }>,
  delayMs: number = 200,
): Promise<HoleEnrichmentResult[]> {
  const results: HoleEnrichmentResult[] = [];

  for (const s of scores) {
    if (s.upstream_score_id == null) {
      // Can't fetch without the upstream id; mark fetched anyway to avoid retries.
      await client
        .from("whs_scores")
        .update({ hole_by_hole_fetched: true })
        .eq("id", s.id);
      results.push({
        scoreId: s.id,
        upstreamScoreId: -1,
        fetched: false,
        holesUpserted: 0,
      });
      continue;
    }

    let scorecard: EgScorecardResponse | null = null;
    try {
      scorecard = await egGetScorecard(token, s.upstream_score_id);
    } catch (err) {
      const status = err instanceof EgApiError ? err.status : 0;
      const body = err instanceof EgApiError ? (err.upstreamBody ?? "") : "";
      // Some rounds (typically overseas, club-entered for handicap only) have no
      // scorecard on EG — it 500s with "Could not find a Club with ID 0". That's
      // permanent, not transient: mark fetched so we stop retrying every sync.
      const permanent =
        status === 404 ||
        status === 400 ||
        (status === 500 && body.includes("Could not find a Club"));

      if (permanent) {
        await client
          .from("whs_scores")
          .update({ hole_by_hole_fetched: true })
          .eq("id", s.id);
        console.warn(`[enrich] score ${s.upstream_score_id}: gross-only round, no scorecard on EG — marked done`);
      } else {
        console.error(`[enrich] scorecard fetch failed (transient) for score ${s.upstream_score_id}:`, err);
      }

      results.push({
        scoreId: s.id,
        upstreamScoreId: s.upstream_score_id,
        fetched: false,
        holesUpserted: 0,
      });
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    const holes = scorecard?.Score?.Holes ?? [];
    let holesUpserted = 0;

    if (holes.length > 0) {
      // Map to our schema. Drop any fields EG returns that we don't have columns for.
      const rows = holes.map((h) => ({
        score_id: s.id,
        hole_no: h.HoleNo,
        hole_alias: h.HoleAlias,
        par: h.Par,
        distance_yards: h.Distance ?? null,
        stroke_index: h.Stroke ?? null,
        strokes_allowed: h.StrokesAllowed ?? 0,
        actual_gross: h.ActualGross,
        adjusted_gross: h.AdjustedGross,
        played: h.Played ?? true,
      }));

      const { error: upsertErr } = await client
        .from("whs_score_holes")
        .upsert(rows, { onConflict: "score_id,hole_no" });

      if (upsertErr) {
        console.error(`[enrich] hole upsert failed for score ${s.id}:`, upsertErr);
      } else {
        holesUpserted = rows.length;
      }
    }

    // Mark the parent score regardless — even 0 holes means "we checked, EG had nothing".
    // This stops backfill from retrying scores that genuinely have no hole data.
    //
    // ARCHIVE THE WHOLE RESPONSE (BRIEF_EG_RAW_HOLES_V2 §2). raw_holes_payload
    // keeps the ENTIRE EgScorecardResponse — the Score envelope, Holes and
    // EnteredHoleByHole — not just the parsed holes above, because the hole
    // mapping deliberately drops every field we have no column for (HoleId
    // among them). Stored even when holes.length === 0: a response proving EG
    // had no hole data for that round is itself a fact worth keeping.
    //
    // hole_by_hole_fetched KEEPS ITS MEANING — holes were FETCHED. It is NOT
    // repurposed to mean the raw was stored: the two failure paths above still
    // set it with raw_holes_payload left NULL, and the partial index on
    // (hole_by_hole_fetched = true AND raw_holes_payload IS NULL) shows those as
    // a permanent, honest gap.
    await client
      .from("whs_scores")
      .update({ hole_by_hole_fetched: true, raw_holes_payload: scorecard })
      .eq("id", s.id);

    results.push({
      scoreId: s.id,
      upstreamScoreId: s.upstream_score_id,
      fetched: true,
      holesUpserted,
    });

    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  return results;
}
