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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};


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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const runStartedAt = new Date().toISOString();
  console.log(JSON.stringify({
    event: "orchestrator_run_start",
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

    return json({
      processed: candidates.length,
      counts,
      results,
      run_started_at: runStartedAt,
      run_ended_at: runEndedAt,
    });
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
