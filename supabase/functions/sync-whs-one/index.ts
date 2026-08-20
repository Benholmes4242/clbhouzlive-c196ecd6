// supabase/functions/sync-whs-one/index.ts
//
// Phase 5 companion — manual sync trigger for a single user.
// Auth via Clbhouz JWT. Resolves to the calling user's connection, runs same
// sync as the cron, returns the result.

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

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function getAuthenticatedUser(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const userJwt = auth.slice(7);
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: `Bearer ${userJwt}` } } },
  );
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "POST only" }, { status: 405 });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return Response.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const admin = adminClient();
  const { data: conn, error: fetchErr } = await admin
    .from("whs_connections")
    .select("id, user_id, passport_id, membership_number, vault_secret_id, consecutive_failures")
    .eq("user_id", user.id)
    .eq("provider", "england_golf")
    .maybeSingle();

  if (fetchErr || !conn) {
    return Response.json({ ok: false, error: "no_connection" }, { status: 404 });
  }

  // Inline sync (same shape as syncOneConnection in sync-whs-due)
  let password: string;
  try {
    password = await decryptVaultSecret(admin, conn.vault_secret_id);
  } catch (err) {
    return Response.json({ ok: false, error: "decrypt_failed" }, { status: 500 });
  }

  let token: string;
  try {
    const auth = await egAuth(conn.membership_number, password);
    token = auth.token;
  } catch (err) {
    if (err instanceof EgApiError && err.kind === "auth_failed") {
      await admin
        .from("whs_connections")
        .update({
          last_sync_status: "auth_failed",
          last_sync_error: "Stored credentials no longer valid — reconnect required",
          consecutive_failures: conn.consecutive_failures + 1,
        })
        .eq("id", conn.id);
      return Response.json({
        ok: false,
        error: "credentials_invalid",
        message: "Your stored England Golf password no longer works. Please disconnect and reconnect.",
      }, { status: 401 });
    }
    return Response.json({ ok: false, error: "eg_unavailable" }, { status: 503 });
  }

  try {
    const [userDetails, scoresPage, friendsPage] = await Promise.all([
      egGetUserDetails(token),
      egListScores(token, conn.passport_id, 1, 30),
      egListFriends(token, 1, 100),
    ]);

    const handicapChanged = await insertHandicapSnapshotIfChanged(
      admin,
      conn.id,
      userDetails.HandicapIndex,
    );
    // Unconditional: the sync is the ONLY writer of eg_handicap_index and must
    // write it on every successful sync, changed index or not.
    await syncProfileHandicapIndex(admin, conn.id, userDetails.HandicapIndex);
    const scoreUpsert = await upsertScores(admin, conn.id, scoresPage.Scores);
    const scoresUpserted = scoreUpsert.written;
    const friendsUpserted = await upsertFriends(admin, conn.id, friendsPage.Friends);

    // Enrich any newly-imported scores with hole detail (cheap — usually 0-2 scores)
    const { data: newScores } = await admin
      .from("whs_scores")
      .select("id, upstream_score_id")
      .eq("connection_id", conn.id)
      .eq("hole_by_hole_fetched", false)
      .order("play_date", { ascending: false })
      .limit(5);
    let holesEnriched = 0;
    if (newScores && newScores.length > 0) {
      try {
        const holeResults = await enrichScoresWithHoles(admin, token, newScores, 200);
        holesEnriched = holeResults.reduce((sum, r) => sum + r.holesUpserted, 0);
      } catch (err) {
        console.error("[sync-whs-one] hole enrichment failed (non-fatal):", err);
      }
    }

    await admin
      .from("whs_connections")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_sync_error: null,
        consecutive_failures: 0,
        next_sync_after: new Date(Date.now() + 6 * 3600_000).toISOString(),
      })
      .eq("id", conn.id);

    return Response.json({
      ok: true,
      handicap_index: userDetails.HandicapIndex,
      handicap_changed: handicapChanged,
      scores_upserted: scoresUpserted,
      friends_upserted: friendsUpserted,
      holes_enriched: holesEnriched,
    });
  } catch (err) {
    console.error("[sync-whs-one] sync failed:", err);
    return Response.json({ ok: false, error: "sync_failed" }, { status: 500 });
  }
});
