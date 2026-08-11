// gam-course-mapping-orchestrator
//
// Phase 2 of the course-mapping pipeline. Runs on a 6-hour cron (and ad-hoc
// manual invocations). For each unmapped WHS course in this batch:
//
//   Tiers 1-3 (exact_name, normalised_name, trigram_high) via
//     backfill-whs-course-mapping single-mode.
//   Tier 4 (Echo LLM consensus) via gam-course-mapping-echo when tiers 1-3
//     return no_match_found.
//
// Guarantees:
//   - pg_try_advisory_lock (via RPC) at run start; released in finally.
//   - Per-course re-check of `whs_to_golf_course_map.golf_course_id IS NULL`
//     before each tier invocation (avoids racing with admin manual mappings).
//   - Batch size 25 per run.
//   - Tier-4 calls forward GAM_INTERNAL_SECRET via x-internal-secret header.
//   - Telemetry to console: run start, per-course tier hits, run end counts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { requireInternalSecret } from "../_shared/internalAuth.ts";

import { corsFor } from '../_shared/cors.ts';
const FUNCTION_VERSION = "2026-08-11-cors-and-error-queue-v2";
const LOCK_NAME = "gam-course-mapping-orchestrator";
const BATCH_SIZE = 25;
const TIER_1_3_METHODS = new Set([
  "exact_name",
  "normalised_name",
  "trigram_high",
]);

type TierResult = {
  whs_course_id: string;
  tier: "tier_1_3" | "tier_4_echo" | "skipped_already_mapped" | "error";
  match_method?: string;
  golf_course_id?: string | null;
  error?: string;
};

let corsHeaders: Record<string, string> = corsFor(null);

Deno.serve(async (req) => {
  corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const gate = requireInternalSecret(req, corsHeaders);
  if (gate) return gate;


  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // ---- Optional one-time / repeatable backfill mode -----------------------
  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  if (body?.mode === "backfill_unmatched") {
    const seeded = await backfillUnmatched(supabase);
    console.log(JSON.stringify({
      event: "unmatched_backfill_complete",
      version: FUNCTION_VERSION,
      seeded,
    }));
    return json({ mode: "backfill_unmatched", seeded, version: FUNCTION_VERSION });
  }

  const runStartedAt = new Date().toISOString();
  console.log(JSON.stringify({
    event: "orchestrator_run_start",
    version: FUNCTION_VERSION,
    run_started_at: runStartedAt,
    batch_size: BATCH_SIZE,
  }));



  // ---- Advisory lock ------------------------------------------------------
  const { data: lockAcquired, error: lockErr } = await supabase.rpc(
    "try_acquire_orchestrator_lock",
    { lock_name: LOCK_NAME },
  );
  if (lockErr) {
    console.error("lock_rpc_error", lockErr);
    return json({ error: "lock_rpc_error", detail: lockErr.message }, 500);
  }
  if (!lockAcquired) {
    console.log(JSON.stringify({
      event: "orchestrator_run_skipped",
      reason: "lock_busy",
    }));
    return json({ skipped: true, reason: "lock_busy" }, 200);
  }

  try {
    // ---- Pick batch -------------------------------------------------------
    // Unmapped = whs_courses with no map row, OR map row with golf_course_id IS NULL.
    // We pull candidates by combining both shapes. To keep it simple, fetch
    // whs_course ids that have no mapped golf_course_id yet.
    const { data: mapRows, error: mapErr } = await supabase
      .from("whs_to_golf_course_map")
      .select("whs_course_id, golf_course_id")
      .limit(50000);
    if (mapErr) throw mapErr;
    const mappedSet = new Set<string>();
    const unmappedFromMap: string[] = [];
    for (const r of mapRows ?? []) {
      if (r.golf_course_id) mappedSet.add(r.whs_course_id);
      else unmappedFromMap.push(r.whs_course_id);
    }

    const { data: allCourses, error: coursesErr } = await supabase
      .from("whs_courses")
      .select("id")
      .limit(50000);
    if (coursesErr) throw coursesErr;

    const missingMapRow = (allCourses ?? [])
      .map((c: any) => c.id as string)
      .filter((id) => !mappedSet.has(id) && !unmappedFromMap.includes(id));

    const candidates = [...missingMapRow, ...unmappedFromMap].slice(
      0,
      BATCH_SIZE,
    );

    console.log(JSON.stringify({
      event: "orchestrator_batch_selected",
      total_unmapped: missingMapRow.length + unmappedFromMap.length,
      batch_count: candidates.length,
    }));

    if (candidates.length === 0) {
      console.log(JSON.stringify({ event: "orchestrator_run_end_empty" }));
      return json({
        processed: 0,
        message: "No unmapped WHS courses",
        run_started_at: runStartedAt,
      });
    }

    // ---- Per-course processing -------------------------------------------
    const internalSecret = Deno.env.get("GAM_INTERNAL_SECRET") ?? "";
    const projectRef = supabaseUrl.replace(/^https?:\/\//, "").split(".")[0];
    const functionsBase = `${supabaseUrl}/functions/v1`;

    const results: TierResult[] = [];
    const counts: Record<string, number> = {
      tier_1_3_applied: 0,
      tier_4_auto_applied: 0,
      tier_4_admin_review: 0,
      tier_4_no_match: 0,
      skipped_already_mapped: 0,
      errored: 0,
    };

    for (const whsCourseId of candidates) {
      try {
        // Re-check: still unmapped?
        if (await isAlreadyMapped(supabase, whsCourseId)) {
          counts.skipped_already_mapped++;
          results.push({
            whs_course_id: whsCourseId,
            tier: "skipped_already_mapped",
          });
          console.log(JSON.stringify({
            event: "course_skipped",
            whs_course_id: whsCourseId,
            reason: "already_mapped",
          }));
          continue;
        }

        // ---- Tiers 1-3 via backfill single mode ---------------------------
        const tier13 = await invokeFn(
          functionsBase,
          "backfill-whs-course-mapping",
          serviceKey,
          { mode: "single", whs_course_id: whsCourseId },
        );

        const method13 = tier13?.match_method as string | undefined;
        if (method13 && TIER_1_3_METHODS.has(method13)) {
          counts.tier_1_3_applied++;
          results.push({
            whs_course_id: whsCourseId,
            tier: "tier_1_3",
            match_method: method13,
            golf_course_id: tier13.golf_course_id ?? null,
          });
          console.log(JSON.stringify({
            event: "course_mapped",
            whs_course_id: whsCourseId,
            tier: "tier_1_3",
            match_method: method13,
          }));
          continue;
        }

        // Re-check before Echo (backfill may have raced with admin)
        if (await isAlreadyMapped(supabase, whsCourseId)) {
          counts.skipped_already_mapped++;
          results.push({
            whs_course_id: whsCourseId,
            tier: "skipped_already_mapped",
          });
          continue;
        }

        // ---- Tier 4: Echo --------------------------------------------------
        const echoHeaders: Record<string, string> = {
          "content-type": "application/json",
          authorization: `Bearer ${serviceKey}`,
        };
        if (internalSecret) echoHeaders["x-internal-secret"] = internalSecret;

        const echoRes = await fetch(
          `${functionsBase}/gam-course-mapping-echo`,
          {
            method: "POST",
            headers: echoHeaders,
            body: JSON.stringify({ whs_course_id: whsCourseId }),
          },
        );
        const echoBody = await echoRes.json().catch(() => ({}));

        if (!echoRes.ok) {
          counts.errored++;
          results.push({
            whs_course_id: whsCourseId,
            tier: "error",
            error: `echo_http_${echoRes.status}`,
          });
          console.error(JSON.stringify({
            event: "course_error",
            whs_course_id: whsCourseId,
            stage: "echo",
            status: echoRes.status,
            body: echoBody,
          }));
          continue;
        }

        const echoMethod = (echoBody?.match_method ?? "unknown") as string;
        if (echoMethod === "echo_consensus") counts.tier_4_auto_applied++;
        else if (echoMethod === "echo_review") counts.tier_4_admin_review++;
        else counts.tier_4_no_match++;

        results.push({
          whs_course_id: whsCourseId,
          tier: "tier_4_echo",
          match_method: echoMethod,
          golf_course_id: echoBody?.golf_course_id ?? null,
        });
        console.log(JSON.stringify({
          event: "course_mapped",
          whs_course_id: whsCourseId,
          tier: "tier_4_echo",
          match_method: echoMethod,
        }));

        // ---- Ladder gave up: surface for a human --------------------------
        if (echoMethod !== "echo_consensus") {
          if (!(await isAlreadyMapped(supabase, whsCourseId))) {
            const suggestedId = (echoBody?.consensus?.golf_course_id ?? null) as
              | string
              | null;
            let suggestion: string | null = null;
            if (suggestedId) {
              const { data: sc } = await supabase
                .from("golf_courses")
                .select("name")
                .eq("id", suggestedId)
                .maybeSingle();
              suggestion = (sc?.name as string | undefined) ?? null;
            }
            await recordUnmatched(supabase, whsCourseId, echoMethod, suggestion);
          }
        }

      } catch (e) {
        counts.errored++;
        const msg = e instanceof Error ? e.message : String(e);
        results.push({
          whs_course_id: whsCourseId,
          tier: "error",
          error: msg,
        });
        console.error(JSON.stringify({
          event: "course_error",
          whs_course_id: whsCourseId,
          error: msg,
        }));
        // A course that fails to PROCESS must still reach a human, and must be
        // distinguishable in the Inbox from one the ladder cleanly gave up on.
        // "processing_error" is the ladder crashing; the tier_* values are the
        // ladder finishing without a match.
        try {
          if (!(await isAlreadyMapped(supabase, whsCourseId))) {
            await recordUnmatched(
              supabase,
              whsCourseId,
              "processing_error",
              null,
            );
          }
        } catch (inner) {
          console.error(
            "unmatched_record_after_error_failed",
            whsCourseId,
            inner instanceof Error ? inner.message : String(inner),
          );
        }
      }
    }

    const runEndedAt = new Date().toISOString();
    console.log(JSON.stringify({
      event: "orchestrator_run_end",
      run_started_at: runStartedAt,
      run_ended_at: runEndedAt,
      processed: candidates.length,
      counts,
    }));

    // Suppress unused var warning on projectRef
    void projectRef;

    // A scheduled job that fails silently is worse than one that fails loudly:
    // when every processed course errored, report a non-2xx.
    const nonErrorOutcomes = Object.entries(counts)
      .filter(([k]) => k !== "errored")
      .reduce((sum, [, v]) => sum + v, 0);
    const allErrored = counts.errored > 0 && nonErrorOutcomes === 0;

    return json({
      processed: candidates.length,
      counts,
      results,
      run_started_at: runStartedAt,
      run_ended_at: runEndedAt,
      version: FUNCTION_VERSION,
      ...(allErrored ? { error: "all_courses_errored" } : {}),
    }, allErrored ? 500 : 200);

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("orchestrator_fatal", msg);
    return json({ error: "orchestrator_fatal", detail: msg }, 500);
  } finally {
    const { error: unlockErr } = await supabase.rpc(
      "release_orchestrator_lock",
      { lock_name: LOCK_NAME },
    );
    if (unlockErr) console.error("unlock_rpc_error", unlockErr);
  }
});

// ---- Unmatched-course queue ------------------------------------------------

type UsageCounts = { round_count: number; member_count: number };

// round_count / member_count for a WHS course, from whs_scores joined to
// whs_connections (distinct users for the member count).
async function courseUsage(
  supabase: any,
  whsCourseId: string,
): Promise<UsageCounts> {
  const { data, error } = await supabase
    .from("whs_scores")
    .select("connection_id, whs_connections!inner(user_id)")
    .eq("course_id", whsCourseId)
    .limit(5000);
  if (error) {
    console.error("usage_error", whsCourseId, error.message);
    return { round_count: 0, member_count: 0 };
  }
  const rows = (data ?? []) as any[];
  const users = new Set<string>();
  for (const r of rows) {
    const uid = r?.whs_connections?.user_id ?? null;
    if (uid) users.add(uid);
  }
  return { round_count: rows.length, member_count: users.size };
}

async function recordUnmatched(
  supabase: any,
  whsCourseId: string,
  lastTierTried: string,
  echoSuggestion: string | null,
): Promise<void> {
  const { data: course } = await supabase
    .from("whs_courses")
    .select("name")
    .eq("id", whsCourseId)
    .maybeSingle();

  const usage = await courseUsage(supabase, whsCourseId);

  const { error } = await supabase
    .from("whs_unmatched_courses")
    .upsert(
      {
        whs_course_id: whsCourseId,
        whs_course_name: (course?.name as string | undefined) ?? null,
        round_count: usage.round_count,
        member_count: usage.member_count,
        last_tier_tried: lastTierTried,
        echo_suggestion: echoSuggestion,
        last_attempt_at: new Date().toISOString(),
      },
      { onConflict: "whs_course_id" },
    );
  if (error) {
    console.error("unmatched_upsert_error", whsCourseId, error.message);
    return;
  }
  console.log(JSON.stringify({
    event: "unmatched_course_recorded",
    whs_course_id: whsCourseId,
    last_tier_tried: lastTierTried,
    round_count: usage.round_count,
    member_count: usage.member_count,
  }));
}

// PostgREST caps a single response at 1000 rows; page through explicitly.
async function pageAll(
  supabase: any,
  table: string,
  select: string,
  refine?: (q: any) => any,
): Promise<any[]> {
  const PAGE = 1000;
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(select).range(from, from + PAGE - 1);
    if (refine) q = refine(q);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as any[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

// One-time (idempotent) seed: every WHS course with rounds but no resolved
// mapping gets an open queue row.
async function backfillUnmatched(supabase: any): Promise<number> {
  const mapRows = await pageAll(
    supabase,
    "whs_to_golf_course_map",
    "whs_course_id, golf_course_id",
  );
  // A row with a NULL golf_course_id is a RECORD OF FAILURE, not a mapping.
  // isAlreadyMapped() must apply the same test - see the comment there.
  const mapped = new Set<string>();
  for (const r of mapRows) {
    if (r.golf_course_id) mapped.add(r.whs_course_id as string);
  }

  const scoreRows = await pageAll(
    supabase,
    "whs_scores",
    "course_id, whs_connections!inner(user_id)",
    (q: any) => q.not("course_id", "is", null),
  );

  const usage = new Map<string, { rounds: number; users: Set<string> }>();
  for (const r of scoreRows as any[]) {
    const cid = r.course_id as string;
    if (!cid || mapped.has(cid)) continue;
    let entry = usage.get(cid);
    if (!entry) { entry = { rounds: 0, users: new Set<string>() }; usage.set(cid, entry); }
    entry.rounds++;
    const uid = r?.whs_connections?.user_id ?? null;
    if (uid) entry.users.add(uid);
  }

  const ids = [...usage.keys()];
  if (ids.length === 0) return 0;

  const names = new Map<string, string | null>();
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data: courses } = await supabase
      .from("whs_courses")
      .select("id, name")
      .in("id", chunk);
    for (const c of (courses ?? []) as any[]) names.set(c.id, c.name ?? null);
  }

  const now = new Date().toISOString();
  const payload = ids.map((id) => ({
    whs_course_id: id,
    whs_course_name: names.get(id) ?? null,
    round_count: usage.get(id)!.rounds,
    member_count: usage.get(id)!.users.size,
    last_tier_tried: "backfill",
    echo_suggestion: null,
    last_attempt_at: now,
  }));

  const { error } = await supabase
    .from("whs_unmatched_courses")
    .upsert(payload, { onConflict: "whs_course_id" });
  if (error) throw error;
  return payload.length;
}
// A whs_to_golf_course_map row with a NULL golf_course_id is a RECORD OF
// FAILURE (match_method 'no_match_found'), not a mapping. This function and
// backfillUnmatched() above MUST agree on that: if either treats the mere
// existence of a row as "mapped", the orchestrator reads back its own failure
// row and silently suppresses the unmatched-course queue write.
async function isAlreadyMapped(
  supabase: any,
  whsCourseId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("whs_to_golf_course_map")
    .select("golf_course_id")
    .eq("whs_course_id", whsCourseId)
    .maybeSingle();
  if (error) {
    console.error("recheck_error", whsCourseId, error.message);
    return false;
  }
  // Non-null target required - see comment above.
  return Boolean(data?.golf_course_id);
}

async function invokeFn(
  base: string,
  name: string,
  serviceKey: string,
  body: unknown,
): Promise<any> {
  const res = await fetch(`${base}/${name}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: any = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch { parsed = { raw: text }; }
  if (!res.ok) {
    throw new Error(`${name} HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return parsed;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
