// supabase/functions/backfill-whs-holes/index.ts
//
// One-shot backfill: for the calling user's connection, iterate over all
// whs_scores where hole_by_hole_fetched = false, fetch hole detail from EG,
// upsert into whs_score_holes, mark fetched = true.
//
// Authenticated: requires Clbhouz JWT. Runs synchronously and returns a summary.
// Designed to be called manually after adoption (one-time per user) or via an
// admin tool. Not on a schedule.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  egAuth,
  EgApiError,
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

const MAX_BATCH_SIZE = 50;
const MAX_CHAIN_LENGTH = 20; // 20 * 50 = 1000 rounds maximum per chain

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return Response.json({ ok: false, error: "POST only" }, { status: 405, headers: CORS_HEADERS });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return Response.json({ ok: false, error: "not_authenticated" }, { status: 401, headers: CORS_HEADERS });
  }

  // Self-chain depth tracking — guards against runaway chains
  let chainPosition = 0;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.chain_position === "number") {
      chainPosition = body.chain_position;
    }
  } catch {
    // ignore — no body is fine
  }

  const admin = adminClient();

  const { data: conn, error: connErr } = await admin
    .from("whs_connections")
    .select("id, passport_id, membership_number, vault_secret_id")
    .eq("user_id", user.id)
    .eq("provider", "england_golf")
    .maybeSingle();

  if (connErr || !conn) {
    return Response.json({ ok: false, error: "no_connection" }, { status: 404, headers: CORS_HEADERS });
  }

  const { data: pendingScores, error: scoresErr } = await admin
    .from("whs_scores")
    .select("id, upstream_score_id")
    .eq("connection_id", conn.id)
    .eq("hole_by_hole_fetched", false)
    .order("play_date", { ascending: false })
    .limit(MAX_BATCH_SIZE);

  if (scoresErr) {
    console.error("[backfill] fetch pending failed:", scoresErr);
    return Response.json({ ok: false, error: "fetch_failed" }, { status: 500, headers: CORS_HEADERS });
  }

  if (!pendingScores || pendingScores.length === 0) {
    return Response.json({
      ok: true,
      pending: 0,
      processed: 0,
      enriched: 0,
      message: "All scores already enriched",
    });
  }

  let token: string;
  try {
    const password = await decryptVaultSecret(admin, conn.vault_secret_id);
    const auth = await egAuth(conn.membership_number, password);
    token = auth.token;
  } catch (err) {
    if (err instanceof EgApiError && err.kind === "auth_failed") {
      return Response.json({
        ok: false,
        error: "credentials_invalid",
        message: "Stored England Golf credentials no longer work — please reconnect",
      }, { status: 401, headers: CORS_HEADERS });
    }
    console.error("[backfill] auth failed:", err);
    return Response.json({ ok: false, error: "eg_unavailable" }, { status: 503, headers: CORS_HEADERS });
  }

  const results = await enrichScoresWithHoles(admin, token, pendingScores, 200);

  const enriched = results.filter((r) => r.fetched && r.holesUpserted > 0).length;
  const checked = results.filter((r) => r.fetched).length;
  const totalHoles = results.reduce((sum, r) => sum + r.holesUpserted, 0);

  // RE-EVALUATE WHAT WE JUST ENRICHED. The evaluator runs when a round is
  // created and races this backfill: whenever it wins, the round was evaluated
  // with no hole rows and its course_par (and every hole-derived figure) was
  // stored null with nothing to re-run it. Writing hole rows is exactly the
  // event that makes a re-evaluation worthwhile, so queue it here. The
  // evaluator's own version guard keeps the replay side-effect free — badges,
  // streaks and notifications do not fire twice; only gam_round_stats is
  // rewritten. Non-fatal: a queue failure must not fail the backfill.
  const enrichedIds = results.filter((r) => r.fetched && r.holesUpserted > 0).map((r) => r.scoreId);
  let requeued = 0;
  if (enrichedIds.length > 0) {
    try {
      const { data: queued, error: qErr } = await admin
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
        )
        .select("whs_score_id");
      if (qErr) throw qErr;
      requeued = queued?.length ?? 0;
    } catch (e) {
      console.error("[backfill] re-evaluation enqueue failed (non-fatal):", e);
    }
  }


  const { count: remaining } = await admin
    .from("whs_scores")
    .select("id", { count: "exact", head: true })
    .eq("connection_id", conn.id)
    .eq("hole_by_hole_fetched", false);

  const hasMore = (remaining ?? 0) > 0;
  const willChain = hasMore && chainPosition + 1 < MAX_CHAIN_LENGTH;

  // Fire-and-forget self-chain: continues processing in a fresh invocation.
  // We pass the caller's Authorization header through so the next link
  // re-authenticates as the same user. The cron job is the safety net if
  // this chain link fails to spawn (e.g. transient network blip).
  if (willChain) {
    const authHeader = req.headers.get("Authorization");
    const apiKey = req.headers.get("apikey");
    if (authHeader && apiKey) {
      const projectUrl = Deno.env.get("SUPABASE_URL")!;
      try {
        fetch(`${projectUrl}/functions/v1/backfill-whs-holes`, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "apikey": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chain_position: chainPosition + 1 }),
        }).catch((e) => {
          console.error("[backfill] self-chain spawn failed (non-fatal):", e);
        });
      } catch (e) {
        console.error("[backfill] self-chain setup error (non-fatal):", e);
      }
    } else {
      console.warn("[backfill] cannot self-chain without auth header — cron will pick up stragglers");
    }
  }

  return Response.json({
    ok: true,
    processed: pendingScores.length,
    checked,
    enriched,
    holes_upserted: totalHoles,
    requeued_for_evaluation: requeued,

    remaining: remaining ?? 0,
    has_more: hasMore,
    chain_position: chainPosition,
    chain_spawned: willChain,
    message: hasMore
      ? `Processed ${pendingScores.length}; ${remaining} still pending — chain continuing in background`
      : `Done — ${enriched} of ${pendingScores.length} scores had hole data`,
  }, { headers: CORS_HEADERS });
});
