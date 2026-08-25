// gam-evaluator — Engine that drains gam_evaluation_queue and applies all state changes.
// Triggers: cron (every 30s, drains up to 50), or POST { whs_score_id } / POST { user_id, replay:true }.
// Idempotent via gam_lock_for_eval + evaluator_version_last.

import { createClient } from "npm:@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
export const FUNCTION_VERSION = '2026-07-25T00:00:00Z-v7-time-boxed-drain';
console.log('[gam-evaluator] boot', { FUNCTION_VERSION });
const EVALUATOR_VERSION = parseInt(Deno.env.get("GAM_EVALUATOR_VERSION") ?? "1", 10);
const BATCH_SIZE = 15;
const DRAIN_BUDGET_MS = 25000;
const MAX_ATTEMPTS = 5;


// ─────────────────────────────────────────────────────────────────────────────
// Top 100 list mapping
// ─────────────────────────────────────────────────────────────────────────────
// Catalogue counter_metric → top100_lists.slug. The catalogue uses descriptive
// identifiers; list slugs come from product data. This map bridges them
// without contaminating either side with the other's quirks.
const TOP_100_SLUG_BY_METRIC: Record<string, string> = {
  top_100_worldwide_distinct: 'global',
  top_100_usa_distinct:       'usa',
  top_100_gbni_distinct:      'gb-i',
  top_100_europe_distinct:    'europe',
};
const TOP_100_METRIC_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(TOP_100_SLUG_BY_METRIC).map(([metric, slug]) => [slug, metric])
);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

// ─────────────────────────────────────────────────────────────────────────────
// HTTP entry
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }

    // Ping — surfaces the deployed version without touching state.
    if (body?.action === 'ping' || req.method === 'GET') {
      return json({ version: FUNCTION_VERSION });
    }

    // Single-row mode
    if (body?.whs_score_id) {
      const res = await processSingle(body.whs_score_id);
      return json({ ok: true, result: res });
    }


    // User replay mode
    if (body?.user_id && body?.replay) {
      const { data, error } = await supabase.rpc("gam_reset_user", { p_user_id: body.user_id });
      if (error) throw error;
      return json({ ok: true, replay: true, data });
    }

    // Top-100-only mode: recompute regional milestones and award
    // the four regional badges. Fired after a course rating is
    // written; cheap and idempotent, safe to over-call.
    if (body?.user_id && body?.top100_only) {
      const res = await processTop100Only(body.user_id);
      return json({ ok: true, top100_only: true, result: res });
    }

    // Cron drain
    await reapStaleLocks();
    const rows = await fetchQueueBatch(BATCH_SIZE);
    console.log('[gam-evaluator] drain', { picked: rows.length, batchSize: BATCH_SIZE });
    const results: any[] = [];
    const startedAt = Date.now();
    let budgetReached = false;
    let remaining = 0;
    for (let i = 0; i < rows.length; i++) {
      if (Date.now() - startedAt > DRAIN_BUDGET_MS) {
        remaining = rows.length - i;
        budgetReached = true;
        console.log('[gam-evaluator] drain budget reached', {
          processed: results.length,
          remaining,
        });
        break;
      }
      const row = rows[i];
      try {
        const r = await processSingle(row.whs_score_id);
        results.push({ id: row.whs_score_id, ...r });
      } catch (err) {
        await markFailed(row, err);
        results.push({ id: row.whs_score_id, error: (err as Error).message });
      }
    }
    const succeeded = results.filter((r) => !r.error).length;
    const failed = results.filter((r) => r.error).length;
    console.log('[gam-evaluator] drain complete', {
      picked: rows.length,
      succeeded,
      failed,
      budgetReached,
      remaining,
    });
    return json({ ok: true, drained: results.length, results, budgetReached, remaining });
  } catch (e) {
    console.error("[evaluator] fatal", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  // Note: CORS is applied at the edge via `corsFor()` in the handler; this
  // helper intentionally emits a permissive baseline so pings/replies don't
  // crash when the module-scoped `corsHeaders` symbol isn't in scope.
  return new Response(JSON.stringify(body), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    status,
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// Queue
// ─────────────────────────────────────────────────────────────────────────────
async function reapStaleLocks() {
  try {
    const { data: reaped } = await supabase
      .from('gam_evaluation_queue')
      .update({ status: 'queued' })
      .eq('status', 'processing')
      .lt('enqueued_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .select('id');

    if (reaped?.length) {
      console.log('[gam-evaluator] reaped stale locks', { count: reaped.length });
    }
  } catch (err) {
    console.error('[gam-evaluator] reaper error', err);
  }
}

async function fetchQueueBatch(limit: number) {
  const { data, error } = await supabase
    .from("gam_evaluation_queue")
    .select("whs_score_id, attempts, status, evaluator_version")
    .in("status", ["queued", "failed"])
    .lt("attempts", MAX_ATTEMPTS)
    .eq("evaluator_version", EVALUATOR_VERSION)
    .order("enqueued_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

async function markFailed(row: any, err: unknown) {
  const newAttempts = (row.attempts ?? 0) + 1;
  const status = newAttempts >= MAX_ATTEMPTS ? "suppressed" : "failed";
  await supabase
    .from("gam_evaluation_queue")
    .update({
      status,
      error: String((err as Error)?.message ?? err).slice(0, 500),
      attempts: newAttempts,
      processed_at: new Date().toISOString(),
    })
    .eq("whs_score_id", row.whs_score_id)
    .eq("evaluator_version", EVALUATOR_VERSION);
}

// ─────────────────────────────────────────────────────────────────────────────
// process_single
// ─────────────────────────────────────────────────────────────────────────────
async function processSingle(whsScoreId: string) {
  const t0 = Date.now();

  // Acquire advisory lock
  const { data: lockRes, error: lockErr } = await supabase.rpc("gam_lock_for_eval", { p_whs_score_id: whsScoreId });
  if (lockErr) throw lockErr;
  if (lockRes !== true && lockRes !== null && (Array.isArray(lockRes) ? !lockRes[0] : !lockRes)) {
    return { skipped: "locked_by_other" };
  }

  // Mark processing
  await supabase
    .from("gam_evaluation_queue")
    .update({ status: "processing", attempts: (await getAttempts(whsScoreId)) + 1 })
    .eq("whs_score_id", whsScoreId)
    .eq("evaluator_version", EVALUATOR_VERSION);

  // Load source row
  const { data: scoreRow, error: scoreErr } = await supabase
    .from("whs_scores")
    .select(`*, whs_connections!inner(user_id)`)
    .eq("id", whsScoreId)
    .maybeSingle();
  if (scoreErr) throw scoreErr;
  if (!scoreRow) {
    await markDone(whsScoreId);
    return { skipped: "orphan" };
  }

  const userId: string | null = scoreRow.whs_connections?.user_id ?? null;
  if (!userId) {
    await markDone(whsScoreId);
    return { skipped: "no_user" };
  }

  // Course mapping
  let clbhouzCourseId: string | null = null;
  let clbhouzCourseName: string | null = null;
  let clbhouzCoursePar: number | null = null;
  if (scoreRow.course_id) {
    const { data: mapRow } = await supabase
      .from("whs_to_golf_course_map")
      .select("golf_course_id, golf_courses:golf_course_id(id,name)")
      .eq("whs_course_id", scoreRow.course_id)
      .maybeSingle();
    if (mapRow?.golf_courses) {
      clbhouzCourseId = (mapRow.golf_courses as any).id;
      clbhouzCourseName = (mapRow.golf_courses as any).name;
      // golf_courses has no `par` column; computeRoundStats falls back to summing hole pars.
      clbhouzCoursePar = null;
    }
  }

  // Holes
  let holes: any[] = [];
  if (scoreRow.hole_by_hole_fetched) {
    const { data: hRows } = await supabase
      .from("whs_score_holes")
      .select("*")
      .eq("score_id", whsScoreId)
      .order("hole_no", { ascending: true });
    holes = hRows ?? [];
  }

  // delta_index — read the member's score ladder so this round's movement can
  // be computed. Non-fatal, exactly as the courseName lookup is: a ladder read
  // failure leaves delta_index null and the evaluation continues.
  let ladder: ScoreLadderRow[] = [];
  let ladderIdx = -1;
  let deltaIndexForThis: number | null = null;
  try {
    ladder = await loadMemberScoreLadder(userId);
    ladderIdx = ladder.findIndex((r) => r.id === whsScoreId);
    if (ladderIdx >= 0) deltaIndexForThis = deltaAtLadderIndex(ladder, ladderIdx);
  } catch (e) {
    console.warn("[delta_index] ladder", (e as Error).message);
  }

  // Compute
  const stats = computeRoundStats(scoreRow, holes, {
    user_id: userId,
    course_id: clbhouzCourseId,
    course_name: clbhouzCourseName,
    course_par: clbhouzCoursePar,
    delta_index: deltaIndexForThis,
  });

  // Persist gam_round_stats
  const { error: upErr } = await supabase
    .from("gam_round_stats")
    .upsert(stats, { onConflict: "whs_score_id" });
  if (upErr) throw upErr;

  // PREVIOUS-ROUND BACKFILL. The round being evaluated usually has no next
  // score yet, so its own movement is unknowable on this pass. But the round
  // BEFORE it now has a next score — this one — so its movement is knowable.
  // ONE column on an existing row: no requeue, no recompute, no badges,
  // streaks or notifications. Non-fatal.
  if (ladderIdx > 0) {
    try {
      const prev = ladder[ladderIdx - 1];
      const prevDelta = deltaAtLadderIndex(ladder, ladderIdx - 1);

      // WAS-IT-NULL GUARD. Read the stored value immediately before writing it.
      // A non-null value means the index streaks were already applied for that
      // round (or it is one of Ben's backfilled rows, which must never replay).
      const { data: prevRow, error: prevReadErr } = await supabase
        .from("gam_round_stats")
        .select("whs_score_id, delta_index")
        .eq("whs_score_id", prev.id)
        .maybeSingle();
      if (prevReadErr) throw prevReadErr;
      const wasNull = !!prevRow && prevRow.delta_index == null;

      const { error: prevErr } = await supabase
        .from("gam_round_stats")
        .update({ delta_index: prevDelta })
        .eq("whs_score_id", prev.id);
      if (prevErr) throw prevErr;

      // DEFERRED INDEX STREAKS. The two index-dependent streak conditions can
      // only be judged once the following round exists, which is now. Runs
      // BEFORE this round's applyStreaks so the sequence stays chronological.
      if (wasNull) {
        await applyIndexStreaks(userId, { whs_score_id: prev.id, delta_index: prevDelta });
      }
    } catch (e) {
      console.warn("[delta_index] prev_backfill", (e as Error).message);
    }
  }



  // Idempotency guard for counter-style state changes
  const alreadyAtVersion = (scoreRow.evaluator_version_last ?? 0) >= EVALUATOR_VERSION;

  // Transient per-round stats used by binary badge matchers but not persisted
  // to gam_round_stats (no column). max_birdie_streak mirrors longest_birdie_run.
  (stats as any).max_birdie_streak = stats.longest_birdie_run ?? 0;

  let earned: string[] = [];
  if (!alreadyAtVersion) {
    await applyMilestones(userId, stats);
    await recomputeTop100Milestones(userId);
    await recomputeTravelMilestones(userId);
    (stats as any).seasons_played = await recomputeSeasonsPlayed(userId);
    earned = await applyBadges(userId, stats, whsScoreId);
    await applyStatusTransitions(userId, stats, whsScoreId);
    await applyStreaks(userId, stats);
    await applyRivalryResults(userId, stats, whsScoreId);

    // Seasonal medal award. Own try/catch: never breaks round processing.
    // MUST MATCH the frontend threshold in src/lib/gam/seasonClock.ts
    // (SEASON_ROUNDS_REQUIRED = 5).
    try {
      const seasonAwardedId = await evaluateSeasonMedal(userId, stats, whsScoreId);
      if (seasonAwardedId) earned.push(seasonAwardedId);
    } catch (e) {
      console.warn("[season_medal]", (e as Error).message);
    }

    // Ascent -- wall level up / near-miss detection. Wrapped in its own
    // try/catch: badge processing above must complete regardless of
    // level RPC/insert failures.
    if (earned.length > 0) {
      try {
        await evaluateLevelTransition(userId, whsScoreId);
      } catch (e) {
        console.warn("[level_eval]", (e as Error).message);
      }
    }

    // Rate-a-course prompt — self-contained, guarded, non-fatal.
    // Fires only on a score's FIRST evaluation (alreadyAtVersion === false)
    // so gender-change re-enqueued scores do not re-prompt. It fires only when
    // a real playable gross exists (mirrors the notify_friend_content_recompute
    // stub-row guard) and when the round is mapped to a named clbhouz course.
    // See maybeEmitRateCoursePrompt for the full four-guard sequence and
    // daylight-hour gate.
    const grossForPrompt = scoreRow.adjusted_gross ?? scoreRow.actual_gross ?? null;
    if (grossForPrompt != null && clbhouzCourseId && clbhouzCourseName) {
      try {
        await maybeEmitRateCoursePrompt(userId, clbhouzCourseId, clbhouzCourseName);
      } catch (e) {
        console.warn("[rate_course_prompt]", (e as Error).message);
      }
    }
  }

  // applyCourseLegends runs on EVERY evaluation, including re-enqueued
  // already-evaluated scores. It is delete-and-replace from gam_round_stats,
  // fully idempotent; its legend_earned/legend_lost notifications fire only
  // when the top holder CHANGES, so re-running with unchanged data emits
  // nothing. This enables gender-change re-evaluation (a DB trigger now
  // re-enqueues a member's latest score per course when their profile gender
  // changes, so the women's course record updates promptly in both directions).
  await applyCourseLegends(stats);


  // Mark whs_scores evaluated
  await supabase
    .from("whs_scores")
    .update({ evaluator_version_last: EVALUATOR_VERSION })
    .eq("id", whsScoreId);

  // Mark queue done
  await markDone(whsScoreId);

  const ms = Date.now() - t0;
  console.log(
    JSON.stringify({
      evt: "gam_eval_done",
      whs_score_id: whsScoreId,
      user_id: userId,
      ms,
      birdies: stats.birdies,
      eagles: stats.eagles,
      hio: stats.holes_in_one,
      badges_earned: earned.length,
    })
  );

  return { ok: true, ms, badges_earned: earned };
}

async function getAttempts(whsScoreId: string): Promise<number> {
  const { data } = await supabase
    .from("gam_evaluation_queue")
    .select("attempts")
    .eq("whs_score_id", whsScoreId)
    .eq("evaluator_version", EVALUATOR_VERSION)
    .maybeSingle();
  return data?.attempts ?? 0;
}

async function markDone(whsScoreId: string) {
  await supabase
    .from("gam_evaluation_queue")
    .update({ status: "done", processed_at: new Date().toISOString() })
    .eq("whs_score_id", whsScoreId)
    .eq("evaluator_version", EVALUATOR_VERSION);
}

// ─────────────────────────────────────────────────────────────────────────────
// delta_index — the handicap movement a round produced
// ─────────────────────────────────────────────────────────────────────────────
// handicap_index_at_time is the index the member PLAYED OFF, so a round's
// consequence appears on the NEXT score. delta_index for a round is therefore
// (index carried by the next score) − (index carried by this score).
//
// MUST stay in sync with public.gam_delta_index_guard in the database. Two
// copies exist because the backfill is SQL and the live write is TypeScript.
const DELTA_INDEX_MAX_MOVE = 2.0;

// Pre-WHS records carry CONGU exact handicaps, and the Nov 2020 transition
// produced single-revision jumps of up to 7.5 — re-ratings, not golf. Anything
// beyond the ceiling is stored as null rather than read as a round result.
function guardDeltaIndex(move: number | null): number | null {
  if (move == null || !Number.isFinite(move)) return null;
  if (Math.abs(move) > DELTA_INDEX_MAX_MOVE) return null;
  // Match pg round(numeric, 1): half away from zero, one decimal.
  const sign = move < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(move) * 10 + 1e-9)) / 10;
}

type ScoreLadderRow = { id: string; play_date: string | null; handicap_index_at_time: number | null };

// The member's scores in the same order the SQL backfill used: play_date, then
// score id. NOT created_at — scores arrive out of order.
async function loadMemberScoreLadder(userId: string): Promise<ScoreLadderRow[]> {
  const { data: conns, error: cErr } = await supabase
    .from("whs_connections")
    .select("id")
    .eq("user_id", userId);
  if (cErr) throw cErr;
  const connIds = (conns ?? []).map((c: any) => c.id);
  if (connIds.length === 0) return [];
  const { data, error } = await supabase
    .from("whs_scores")
    .select("id, play_date, handicap_index_at_time")
    .in("connection_id", connIds)
    .order("play_date", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ScoreLadderRow[];
}

// Movement produced by ladder[i]. A no-move round returns 0.0 — the subtraction
// is only skipped when an index is missing or no next score exists.
function deltaAtLadderIndex(ladder: ScoreLadderRow[], i: number): number | null {
  const cur = ladder[i];
  const next = ladder[i + 1];
  if (!cur || !next) return null;
  if (cur.handicap_index_at_time == null || next.handicap_index_at_time == null) return null;
  return guardDeltaIndex(Number(next.handicap_index_at_time) - Number(cur.handicap_index_at_time));
}



// ─────────────────────────────────────────────────────────────────────────────
// compute_round_stats
// ─────────────────────────────────────────────────────────────────────────────
function computeRoundStats(score: any, holes: any[], meta: any) {
  // WHS leaves actual_gross null on most rounds; the playable gross lives
  // in adjusted_gross. Prefer adjusted_gross, fall back to actual_gross.
  const grossScore = score.adjusted_gross ?? score.actual_gross ?? null;
  // golf_courses has no `par` column; fall back to summing hole pars when
  // the round has hole-by-hole data, otherwise leave null.
  let par: number | null = meta.course_par ?? null;
  if (par == null && holes.length > 0) {
    const holePars = holes
      .filter((h: any) => h.played !== false && h.par != null)
      .map((h: any) => Number(h.par));
    if (holePars.length >= 9) {
      par = holePars.reduce((a, b) => a + b, 0);
    }
  }

  const is18 = score.total_holes === 18;

  const stats: any = {
    whs_score_id: score.id,
    user_id: meta.user_id,
    play_date: score.play_date,
    course_id: meta.course_id,
    course_name: meta.course_name,
    course_par: par,
    course_rating: score.course_rating,
    slope_rating: score.slope_rating,
    gross_score: grossScore,
    nett_score: null,
    // Pending-handicap rounds (handicap_index_at_time IS NULL) play off a temporary
    // max course handicap of 54, producing inflated stableford values (~60-70 pts) that
    // aren't comparable to post-pending rounds. Null them out so they don't pollute
    // course legends, personal bests, or rivalry stableford outcomes. All other
    // metrics on pending rounds remain accurate and are preserved unchanged.
    stableford_points: score.handicap_index_at_time === null ? null : score.stableford_points,
    score_diff: score.handicap_differential,
    hcp_at_time: score.handicap_index_at_time,
    holes_played: score.total_holes,
    pcc: score.pcc ?? 0,
    is_competition: score.is_competition_score ?? false,
    tee_marker: null,
    birdies: 0,
    eagles: 0,
    albatrosses: 0,
    holes_in_one: 0,
    pars: 0,
    bogeys: 0,
    double_bogeys: 0,
    triple_plus: 0,
    longest_par_or_better_run: 0,
    longest_birdie_run: 0,
    beat_par: is18 && grossScore != null && par != null ? grossScore < par : false,
    sub_70: is18 && grossScore != null ? grossScore < 70 : false,
    sub_80: is18 && grossScore != null ? grossScore < 80 : false,
    sub_90: is18 && grossScore != null ? grossScore < 90 : false,
    sub_100: is18 && grossScore != null ? grossScore < 100 : false,
    clean_card: false,
    is_counter: score.is_counter ?? false,
    // Movement the round produced, computed by the caller from the member's
    // score ladder (see deltaAtLadderIndex). NULL only when genuinely
    // unknowable — no next score yet, a null index on either side, or the
    // guard rejecting an administrative recalculation. A round that moved
    // nothing stores 0.0, which is a fact about the round, not missing data.
    delta_index: meta.delta_index ?? null,
    evaluator_version: EVALUATOR_VERSION,
  };

  if (holes.length > 0) {
    let parOrBetterRun = 0, parOrBetterBest = 0;
    let birdieRun = 0, birdieBest = 0;
    let scoredHoles = 0;
    let playedHoles = 0;
    for (const h of holes) {
      if (!h.played) { parOrBetterRun = 0; birdieRun = 0; continue; }
      playedHoles++;
      const hs = h.adjusted_gross ?? h.actual_gross;
      if (hs == null || h.par == null) continue;
      scoredHoles++;
      const d = hs - h.par;
      if (d === -3) stats.albatrosses++;
      else if (d === -2) stats.eagles++;
      else if (d === -1) stats.birdies++;
      else if (d === 0) stats.pars++;
      else if (d === 1) stats.bogeys++;
      else if (d === 2) stats.double_bogeys++;
      else if (d >= 3) stats.triple_plus++;
      if (hs === 1) stats.holes_in_one++;

      if (d <= 0) { parOrBetterRun++; parOrBetterBest = Math.max(parOrBetterBest, parOrBetterRun); }
      else parOrBetterRun = 0;
      if (d === -1) { birdieRun++; birdieBest = Math.max(birdieBest, birdieRun); }
      else birdieRun = 0;
    }
    stats.longest_par_or_better_run = parOrBetterBest;
    stats.longest_birdie_run = birdieBest;
    stats.clean_card =
      scoredHoles === playedHoles &&
      playedHoles >= 18 &&
      stats.bogeys === 0 &&
      stats.double_bogeys === 0 &&
      stats.triple_plus === 0;
  }
  return stats;
}

// ─────────────────────────────────────────────────────────────────────────────
// apply_milestones
// ─────────────────────────────────────────────────────────────────────────────
async function applyMilestones(userId: string, _stats: any) {
  // _stats is no longer consulted — we recompute from gam_round_stats directly.
  // This eliminates drift from double-processing, corrections, and deletions.

  const { data: rounds, error } = await supabase
    .from("gam_round_stats")
    .select("birdies, eagles, albatrosses, holes_in_one, sub_80, sub_70, beat_par, play_date")
    .eq("user_id", userId);

  if (error) {
    console.error("[applyMilestones] failed to read gam_round_stats:", error);
    return;
  }

  let birdies = 0, eagles = 0, albatrosses = 0, holes_in_one = 0;
  let sub_80 = 0, sub_70 = 0, sub_par = 0;
  let firstAt: string | null = null;
  let lastAt: string | null = null;

  for (const r of rounds ?? []) {
    birdies      += r.birdies ?? 0;
    eagles       += r.eagles ?? 0;
    albatrosses  += r.albatrosses ?? 0;
    holes_in_one += r.holes_in_one ?? 0;
    if (r.sub_80)  sub_80++;
    if (r.sub_70)  sub_70++;
    if (r.beat_par) sub_par++;
    if (r.play_date) {
      if (firstAt === null || r.play_date < firstAt) firstAt = r.play_date;
      if (lastAt === null || r.play_date > lastAt)  lastAt  = r.play_date;
    }
  }

  const totalRounds = rounds?.length ?? 0;
  const nowIso = new Date().toISOString();
  const metrics: Array<{ metric: string; count: number }> = [
    { metric: "birdies",      count: birdies },
    { metric: "eagles",       count: eagles },
    { metric: "albatrosses",  count: albatrosses },
    { metric: "holes_in_one", count: holes_in_one },
    { metric: "sub_80",       count: sub_80 },
    { metric: "sub_70",       count: sub_70 },
    { metric: "sub_par",      count: sub_par },
    { metric: "rounds",       count: totalRounds },
  ];

  for (const m of metrics) {
    if (m.count === 0) {
      await supabase
        .from("gam_user_milestones")
        .update({ count: 0, last_at: lastAt, updated_at: nowIso })
        .eq("user_id", userId)
        .eq("metric", m.metric);
      continue;
    }

    await supabase.from("gam_user_milestones").upsert(
      {
        user_id: userId,
        metric: m.metric,
        count: m.count,
        first_at: firstAt,
        last_at: lastAt,
        updated_at: nowIso,
      },
      { onConflict: "user_id,metric" }
    );
  }
}

async function getMilestone(userId: string, metric: string): Promise<number> {
  const { data } = await supabase
    .from("gam_user_milestones")
    .select("count")
    .eq("user_id", userId)
    .eq("metric", metric)
    .maybeSingle();
  return data?.count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// recomputeTop100Milestones
// Distinct Top 100 course counts per active list (rated OR WHS-played), written
// to gam_user_milestones. The union is computed in SQL by
// user_top100_distinct_counts because PostgREST cannot express the required
// joins (course_top100_memberships has no FK to course_ratings, and whs_scores
// only bridges to golf_courses through the WHS map).
// Set-based (idempotent across replay). Fails loudly: if the counts query
// errors we leave the previous milestones untouched rather than writing a
// half-computed number.
// ─────────────────────────────────────────────────────────────────────────────
async function recomputeTop100Milestones(userId: string) {
  const { data: countRows, error: countErr } = await supabase.rpc(
    "user_top100_distinct_counts",
    { p_user_id: userId },
  );

  if (countErr) {
    console.error(
      "[recomputeTop100Milestones] counts query error - milestones left untouched",
      countErr,
    );
    return;
  }
  if (!countRows) {
    console.error(
      "[recomputeTop100Milestones] counts query returned no data - milestones left untouched",
    );
    return;
  }

  const countBySlug = new Map<string, number>();
  for (const row of countRows as any[]) {
    if (!row?.slug) continue;
    countBySlug.set(String(row.slug), Number(row.course_count ?? 0));
  }

  const nowIso = new Date().toISOString();
  for (const slug of Object.values(TOP_100_SLUG_BY_METRIC)) {
    const metric = TOP_100_METRIC_BY_SLUG[slug];
    const count = countBySlug.get(slug) ?? 0;


    const { data: existing } = await supabase
      .from("gam_user_milestones")
      .select("count")
      .eq("user_id", userId)
      .eq("metric", metric)
      .maybeSingle();

    if (existing && existing.count === count) continue;

    await supabase.from("gam_user_milestones").upsert(
      {
        user_id: userId,
        metric,
        count,
        first_at: existing ? undefined : (count > 0 ? nowIso : null),
        last_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "user_id,metric" }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// recomputeTravelMilestones
// Distinct country + continent counts across the user's rated/played courses.
// Feeds globetrotter (distinct_countries) and continental (distinct_continents)
// tiered badges via the shared counter/tiered evaluator.
// ─────────────────────────────────────────────────────────────────────────────
async function recomputeTravelMilestones(userId: string) {
  const courseIds = new Set<string>();

  // (a) RATED courses
  const { data: ratedRows, error: ratedErr } = await supabase
    .from("course_ratings")
    .select("course_id")
    .eq("user_id", userId)
    .not("rating", "is", null);
  if (ratedErr) {
    console.error("[recomputeTravelMilestones] rated query error", ratedErr);
  }
  for (const r of ratedRows ?? []) {
    if ((r as any).course_id) courseIds.add((r as any).course_id);
  }

  // (b) WHS-PLAYED courses (bridged via whs_courses + whs_course_aliases)
  const { data: playedRows, error: playedErr } = await supabase.rpc(
    "user_whs_played_golf_course_ids",
    { p_user_id: userId },
  );
  if (playedErr) {
    console.error("[recomputeTravelMilestones] whs-played query error", playedErr);
  }
  for (const r of playedRows ?? []) {
    if ((r as any).course_id) courseIds.add((r as any).course_id);
  }

  const countries = new Set<string>();
  const continents = new Set<string>();

  if (courseIds.size > 0) {
    const ids = Array.from(courseIds);
    const { data: courseRows, error: courseErr } = await supabase
      .from("golf_courses")
      .select("id, country, continent")
      .in("id", ids);
    if (courseErr) {
      console.error("[recomputeTravelMilestones] course lookup error", courseErr);
    }
    for (const c of courseRows ?? []) {
      if ((c as any).country) countries.add((c as any).country);
      if ((c as any).continent) continents.add((c as any).continent);
    }
  }

  const nowIso = new Date().toISOString();
  for (const [metric, count] of [
    ["distinct_countries", countries.size],
    ["distinct_continents", continents.size],
  ] as Array<[string, number]>) {
    const { data: existing } = await supabase
      .from("gam_user_milestones")
      .select("count")
      .eq("user_id", userId)
      .eq("metric", metric)
      .maybeSingle();
    if (existing && existing.count === count) continue;
    await supabase.from("gam_user_milestones").upsert(
      {
        user_id: userId,
        metric,
        count,
        first_at: existing ? undefined : (count > 0 ? nowIso : null),
        last_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "user_id,metric" }
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// recomputeSeasonsPlayed
// Distinct meteorological seasons across all play_dates in the user's
// whs_scores. Returns the count so the caller can stash it on stats for the
// four_seasons binary-badge matcher.
// spring Mar-May, summer Jun-Aug, autumn Sep-Nov, winter Dec-Feb.
// ─────────────────────────────────────────────────────────────────────────────
async function recomputeSeasonsPlayed(userId: string): Promise<number> {
  const { data: rows, error } = await supabase
    .from("whs_scores")
    .select("play_date, whs_connections!inner(user_id)")
    .eq("whs_connections.user_id", userId)
    .not("play_date", "is", null);
  if (error) {
    console.error("[recomputeSeasonsPlayed] query error", error);
    return 0;
  }
  const seasons = new Set<string>();
  for (const r of rows ?? []) {
    const pd = (r as any).play_date as string | null;
    if (!pd) continue;
    const month = Number(pd.slice(5, 7));
    if (!month) continue;
    if (month >= 3 && month <= 5) seasons.add("spring");
    else if (month >= 6 && month <= 8) seasons.add("summer");
    else if (month >= 9 && month <= 11) seasons.add("autumn");
    else seasons.add("winter");
  }
  const count = seasons.size;
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("gam_user_milestones")
    .select("count")
    .eq("user_id", userId)
    .eq("metric", "seasons_played")
    .maybeSingle();
  if (!existing || existing.count !== count) {
    await supabase.from("gam_user_milestones").upsert(
      {
        user_id: userId,
        metric: "seasons_played",
        count,
        first_at: existing ? undefined : (count > 0 ? nowIso : null),
        last_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: "user_id,metric" }
    );
  }
  return count;
}



// ─────────────────────────────────────────────────────────────────────────────
// apply_badges
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Returns the number of tiers the user has reached given their lifetime value
 * and the catalogue's tier thresholds.
 *
 * Semantics: 0 = no tier reached, 1 = first tier reached, ..., N = all tiers reached.
 *
 * Example: tiers [1, 10, 20, 50, 75, 100], value 22 → returns 3
 * (the user has crossed 3 thresholds: 1, 10, 20).
 */
function computeTier(value: number, tiers: any): number {
  if (!Array.isArray(tiers)) return 0;
  let reached = 0;
  for (let i = 0; i < tiers.length; i++) if (value >= Number(tiers[i])) reached = i + 1;
  return reached;
}

function compare(value: number, op: string, target: number): boolean {
  switch (op) {
    case ">": return value > target;
    case ">=": return value >= target;
    case "<": return value < target;
    case "<=": return value <= target;
    case "=": case "==": return value === target;
    default: return false;
  }
}

function matchesBinary(badge: any, stats: any): boolean {
  if (badge.threshold_field && badge.threshold_op && badge.threshold_value != null) {
    // Gross-score badges (break_70/80/90/100) only fire on full 18-hole rounds.
    // Without this guard, a 9-hole 34 would trip all four break_X badges.
    if (badge.threshold_field === 'gross_score' && stats.holes_played !== 18) {
      return false;
    }
    const v = stats[badge.threshold_field];
    if (v == null) return false;
    return compare(Number(v), badge.threshold_op, Number(badge.threshold_value));
  }
  switch (badge.id) {
    case "first_birdie": return stats.birdies > 0;
    case "first_eagle": return stats.eagles > 0;
    case "first_albatross": return stats.albatrosses > 0;
    case "five_birdie_round": return stats.birdies >= 5;
    case "two_eagles": return stats.eagles >= 2;
    case "birdie_train": return (stats.max_birdie_streak ?? 0) >= 3;
    case "four_seasons": return (stats.seasons_played ?? 0) >= 4;
    case "clean_card": return stats.clean_card;
    case "spring_2026_active": return stats.is_counter;
    case "beat_par": return stats.beat_par;
    case "first_index": return stats.hcp_at_time != null;
    default: return false;
  }
}



// ─────────────────────────────────────────────────────────────────────────────
// status_transitions (single_figures, scratch)
// Mirrors frontend statusBadges.ts. Lower index is better.
//   single_figures: hold 9.9, risk 9.5
//   scratch:        hold 0.0, risk 0.5
//   held: index <= risk | at_risk: risk < index <= hold | lost: index > hold
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_BANDS: Record<string, { hold: number; risk: number }> = {
  single_figures: { hold: 9.9, risk: 9.5 },
  scratch:        { hold: 0.0, risk: 0.5 },
};

function statusZone(badgeId: string, index: number | null): 'held' | 'at_risk' | 'lost' | null {
  const band = STATUS_BANDS[badgeId];
  if (!band || index == null) return null;
  if (index <= band.risk) return 'held';
  if (index <= band.hold) return 'at_risk';
  return 'lost';
}

async function applyStatusTransitions(userId: string, stats: any, whsScoreId: string) {
  const newIndex: number | null = stats.hcp_at_time;
  if (newIndex == null) return;

  // Source prevIndex from the user's most recent whs_score BEFORE this one,
  // by (play_date desc, created_at desc), excluding whsScoreId. This is the
  // last index the evaluator would have observed. Fallback: if no prior score,
  // there is no transition to fire (skip).
  const { data: priorRow } = await supabase
    .from("whs_scores")
    .select("handicap_index_at_time, play_date, created_at, whs_connections!inner(user_id)")
    .eq("whs_connections.user_id", userId)
    .neq("id", whsScoreId)
    .not("handicap_index_at_time", "is", null)
    .order("play_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevIndex: number | null = priorRow?.handicap_index_at_time ?? null;
  if (prevIndex == null) return;

  for (const badgeId of Object.keys(STATUS_BANDS)) {
    // Gate on milestone-earned: only fire transitions when the user actually
    // holds the binary badge row. Never-earned badges have no status to lose
    // or reclaim.
    const { data: earnedRow } = await supabase
      .from("gam_user_badges")
      .select("badge_id")
      .eq("user_id", userId).eq("badge_id", badgeId).maybeSingle();
    if (!earnedRow) continue;

    const prevZone = statusZone(badgeId, prevIndex);
    const newZone = statusZone(badgeId, newIndex);
    const band = STATUS_BANDS[badgeId];

    if (prevZone === 'held' && newZone === 'at_risk') {
      await enqueueNotification(userId, 'status_at_risk', {
        badge_id: badgeId,
        index: newIndex,
        cutoff: band.hold,
        whs_score_id: whsScoreId,
      });
    } else if (prevZone === 'lost' && newZone === 'held') {
      await enqueueNotification(userId, 'status_reclaimed', {
        badge_id: badgeId,
        index: newIndex,
        whs_score_id: whsScoreId,
      });
    }
  }
}

async function applyBadges(userId: string, stats: any, whsScoreId: string): Promise<string[]> {
  const today = stats.play_date as string;
  const { data: catalogue } = await supabase
    .from("gam_badge_catalogue")
    .select("*")
    .eq("is_active", true);
  const { data: current } = await supabase
    .from("gam_user_badges")
    .select("badge_id, counter_value, counter_tier")
    .eq("user_id", userId);
  const currentById = new Map<string, any>((current ?? []).map((b: any) => [b.badge_id, b]));
  const earned: string[] = [];

  for (const badge of catalogue ?? []) {
    if (badge.season_start && (today < badge.season_start || today > (badge.season_end ?? today))) continue;

    if (badge.kind === "binary") {
      if (matchesBinary(badge, stats)) {
        const did = await upsertBadgeEarned(userId, badge.id, whsScoreId);
        if (did) earned.push(badge.id);
      }
      continue;
    }

    if (badge.kind === "counter" || badge.kind === "tiered") {
      const result = await evaluateCounterBadge(userId, badge, whsScoreId, currentById.get(badge.id));
      if (result) earned.push(result);
    }
    // streaks handled in applyStreaks
  }
  return earned;
}

/**
 * Shared counter/tiered badge evaluator. Reads the current lifetime metric
 * from gam_user_milestones and upserts the badge if a new tier is reached
 * (tiered) or the badge is first earned (plain counter). Returns the
 * badge_id if newly earned / tier-bumped, otherwise null.
 *
 * Called from BOTH applyBadges (per-round main loop) and processTop100Only
 * (post-rating regional refresh). whsScoreId is null in the rating path.
 */
async function evaluateCounterBadge(
  userId: string,
  badge: any,
  whsScoreId: string | null,
  existingIn?: any,
): Promise<string | null> {
  if (!badge.counter_metric) return null;
  const lifetime = await getMilestone(userId, badge.counter_metric);
  const tiers = badge.counter_tiers;

  let existing = existingIn;
  if (existing === undefined) {
    const { data } = await supabase
      .from("gam_user_badges")
      .select("badge_id, counter_value, counter_tier")
      .eq("user_id", userId).eq("badge_id", badge.id).maybeSingle();
    existing = data ?? null;
  }

  if (Array.isArray(tiers) && tiers.length > 0) {
    const tier = computeTier(lifetime, tiers);
    if (tier > 0 && (!existing || (existing.counter_tier ?? 0) < tier)) {
      await upsertBadgeTiered(userId, badge.id, lifetime, tier, whsScoreId);
      return badge.id;
    } else if (existing) {
      await supabase
        .from("gam_user_badges")
        .update({ counter_value: lifetime, updated_at: new Date().toISOString() })
        .eq("user_id", userId).eq("badge_id", badge.id);
    }
    return null;
  }

  // Plain counter without tiers
  if (lifetime > 0 && !existing) {
    const did = await upsertBadgeEarned(userId, badge.id, whsScoreId);
    return did ? badge.id : null;
  } else if (existing) {
    await supabase
      .from("gam_user_badges")
      .update({ counter_value: lifetime, updated_at: new Date().toISOString() })
      .eq("user_id", userId).eq("badge_id", badge.id);
  }
  return null;
}

/**
 * Top-100-only path: recompute the four regional distinct-course
 * milestones, then run each of the four regional badges through the
 * shared counter/tiered evaluator. Idempotent; whsScoreId is null.
 */
async function processTop100Only(userId: string): Promise<{ earned: string[] }> {
  await recomputeTop100Milestones(userId);
  await recomputeTravelMilestones(userId);

  const { data: badges, error } = await supabase
    .from("gam_badge_catalogue")
    .select("*")
    .in("id", ["top_100_worldwide", "top_100_usa", "top_100_gbni", "top_100_europe", "globetrotter", "continental"])
    .eq("is_active", true);
  if (error) {
    console.error("[processTop100Only] catalogue query error", error);
    return { earned: [] };
  }

  const earned: string[] = [];
  for (const badge of badges ?? []) {
    const result = await evaluateCounterBadge(userId, badge, null);
    if (result) earned.push(result);
  }
  return { earned };
}

// Resolve the badge title at emit time so the Activity row is self-contained
// (mirrors how taker_name / course_name are resolved for legend_lost).
// Degrades to null; the renderer and backfill both fall back to generic copy.
async function fetchBadgeTitle(badgeId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("gam_badge_catalogue")
      .select("title")
      .eq("id", badgeId)
      .maybeSingle();
    return (data?.title as string | null) ?? null;
  } catch {
    return null;
  }
}

async function upsertBadgeEarned(userId: string, badgeId: string, whsScoreId: string | null): Promise<boolean> {

  const { data: existing } = await supabase
    .from("gam_user_badges")
    .select("badge_id")
    .eq("user_id", userId).eq("badge_id", badgeId).maybeSingle();
  if (existing) return false;
  const { error } = await supabase.from("gam_user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
    trigger_whs_score_id: whsScoreId,
    earned_at: new Date().toISOString(),
    seen_by_user: false,
  });
  if (error) { console.warn("[badge insert]", error.message); return false; }
  await enqueueNotification(userId, "badge_earned", {
    badge_id: badgeId,
    badge_title: await fetchBadgeTitle(badgeId),
    whs_score_id: whsScoreId,
  });

  return true;
}

async function upsertBadgeTiered(userId: string, badgeId: string, counterValue: number, tier: number, whsScoreId: string | null) {
  const { data: existing } = await supabase
    .from("gam_user_badges")
    .select("counter_tier, seen_by_user")
    .eq("user_id", userId).eq("badge_id", badgeId).maybeSingle();
  const isNewTier = !existing || (existing.counter_tier ?? 0) < tier;
  await supabase.from("gam_user_badges").upsert(
    {
      user_id: userId,
      badge_id: badgeId,
      trigger_whs_score_id: whsScoreId,
      counter_value: counterValue,
      counter_tier: tier,
      earned_at: existing ? undefined : new Date().toISOString(),
      seen_by_user: isNewTier ? false : (existing?.seen_by_user ?? false),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,badge_id" }
  );
  if (isNewTier) {
    await enqueueNotification(userId, "badge_earned", {
      badge_id: badgeId,
      badge_title: await fetchBadgeTitle(badgeId),
      tier,
      whs_score_id: whsScoreId,
    });

  }
}

// Authoritative recompute of a single user's current rank-1 legend count.
// Writes to gam_user_milestones (metric='legend_titles') — this is the value
// the trophy card reads via get_user_achievements_for_viewer's COALESCE on
// counter_metric — and keeps the gam_user_badges row's tier in sync. Called
// on BOTH the gain and loss sides of every rank-1 change so counts never drift.
async function recomputeLegendTitles(userId: string) {
  const { count: rawCount } = await supabase
    .from("gam_course_legends")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId).eq("rank", 1).eq("is_current", true);
  const count = rawCount ?? 0;
  const nowIso = new Date().toISOString();

  // Milestone is the source of truth for the card.
  await supabase.from("gam_user_milestones").upsert(
    {
      user_id: userId,
      metric: "legend_titles",
      count,
      last_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: "user_id,metric" }
  );

  // Keep the badge row's tier in sync — never gate on tier > 0, always reflect
  // current state.
  const { data: badge } = await supabase
    .from("gam_badge_catalogue")
    .select("counter_tiers")
    .eq("id", "legend_at_course").maybeSingle();
  const tiers = badge?.counter_tiers ?? null;
  const tier = tiers ? computeTier(count, tiers) : 0;

  if (count > 0) {
    // upsertBadgeTiered handles the row + tier progression + notification.
    await upsertBadgeTiered(userId, "legend_at_course", count, tier, null);
  } else {
    // count === 0: user holds no rank-1 legends. Remove any stale badge row
    // so the trophy card falls back to the locked state cleanly.
    await supabase
      .from("gam_user_badges")
      .delete()
      .eq("user_id", userId).eq("badge_id", "legend_at_course");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// apply_streaks
// ─────────────────────────────────────────────────────────────────────────────
const STREAK_BADGE_MAP: Record<string, string> = {
  round_played: "round_streak_tier",
  no_up: "no_up_streak",
  cutting: "cutting_streak",
  counter: "counter_streak",
  sub_80: "sub_80_streak",
  sub_par: "sub_par_streak",
  birdie_round: "birdie_round_streak",
};

async function applyStreaks(userId: string, stats: any) {
  await updateRoundStreak(userId, stats, "counter", !!stats.is_counter);
  await updateRoundStreak(userId, stats, "sub_80", !!stats.sub_80);
  await updateRoundStreak(userId, stats, "sub_par", !!stats.beat_par);
  await updateRoundStreak(userId, stats, "birdie_round", stats.birdies > 0);
  await updateRoundPlayedStreak(userId, stats);
}

// The two INDEX-DEPENDENT streaks. Their input — delta_index — is only knowable
// once the member's NEXT score exists, so they are applied against the PREVIOUS
// round during the following round's evaluation. Same helper, same conditions,
// same dedup: only the moment it runs differs. A null delta_index (guard
// rejected an over-2.0 move) breaks both streaks, which is correct.
async function applyIndexStreaks(userId: string, prevStats: any) {
  const dIdx = prevStats.delta_index;
  await updateRoundStreak(userId, prevStats, "no_up", dIdx != null && dIdx <= 0);
  await updateRoundStreak(userId, prevStats, "cutting", dIdx != null && dIdx < 0);
}


async function ensureStreakRow(userId: string, streakType: string, unit: string, freezeCredits = 0) {
  const { data } = await supabase
    .from("gam_streaks")
    .select("*")
    .eq("user_id", userId).eq("streak_type", streakType).maybeSingle();
  if (data) return data;
  await supabase.from("gam_streaks").insert({
    user_id: userId,
    streak_type: streakType,
    unit,
    current_count: 0,
    best_count: 0,
    is_active: false,
    freeze_credits: freezeCredits,
  });
  return { user_id: userId, streak_type: streakType, current_count: 0, best_count: 0, is_active: false, freeze_credits: freezeCredits, current_started_at: null };
}

async function updateRoundStreak(userId: string, stats: any, streakType: string, condMet: boolean) {
  const current = await ensureStreakRow(userId, streakType, "round");
  if (condMet) {
    const newCount = (current.current_count ?? 0) + 1;
    const newBest = Math.max(newCount, current.best_count ?? 0);
    await supabase.from("gam_streaks").update({
      current_count: newCount,
      best_count: newBest,
      is_active: true,
      current_started_at: current.current_started_at ?? new Date().toISOString(),
      last_updated_round_id: stats.whs_score_id,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("streak_type", streakType);
    await checkStreakBadges(userId, streakType, newCount);
  } else if (current.is_active) {
    await supabase.from("gam_streaks").update({
      current_count: 0,
      is_active: false,
      best_ended_at: (current.current_count ?? 0) >= (current.best_count ?? 0) ? new Date().toISOString() : current.best_ended_at,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("streak_type", streakType);
    await enqueueNotification(userId, "streak_broken", { streak_type: streakType, count: current.current_count });
  }
}

function isoWeekStart(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

async function updateRoundPlayedStreak(userId: string, stats: any) {
  if (!stats.is_counter) return;
  const current = await ensureStreakRow(userId, "round_played", "week", 1);
  const weekAnchor = isoWeekStart(stats.play_date);

  // Already counted this week?
  const weekEnd = new Date(weekAnchor + "T00:00:00Z");
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const { data: thisWeek } = await supabase
    .from("gam_round_stats")
    .select("whs_score_id")
    .eq("user_id", userId)
    .gte("play_date", weekAnchor)
    .lt("play_date", weekEnd.toISOString().slice(0, 10))
    .neq("whs_score_id", stats.whs_score_id)
    .limit(1);
  if (thisWeek && thisWeek.length > 0) return;

  let newCount = 1;
  if (current.is_active) {
    const prev = new Date(weekAnchor + "T00:00:00Z");
    prev.setUTCDate(prev.getUTCDate() - 7);
    const prevStart = prev.toISOString().slice(0, 10);
    const { data: hadPrev } = await supabase
      .from("gam_round_stats")
      .select("whs_score_id")
      .eq("user_id", userId)
      .gte("play_date", prevStart)
      .lt("play_date", weekAnchor)
      .limit(1);
    if (hadPrev && hadPrev.length > 0) newCount = (current.current_count ?? 0) + 1;
  }
  await supabase.from("gam_streaks").update({
    current_count: newCount,
    best_count: Math.max(newCount, current.best_count ?? 0),
    is_active: true,
    current_started_at: current.current_started_at ?? weekAnchor,
    last_updated_round_id: stats.whs_score_id,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("streak_type", "round_played");
  await checkStreakBadges(userId, "round_played", newCount);
}

async function checkStreakBadges(userId: string, streakType: string, count: number) {
  const badgeId = STREAK_BADGE_MAP[streakType];
  if (!badgeId) return;
  const { data: badge } = await supabase
    .from("gam_badge_catalogue")
    .select("counter_tiers")
    .eq("id", badgeId).maybeSingle();
  if (!badge?.counter_tiers) return;
  const tier = computeTier(count, badge.counter_tiers);
  if (tier > 0) await upsertBadgeTiered(userId, badgeId, count, tier, null);
}

// ─────────────────────────────────────────────────────────────────────────────
// apply_course_legends
// ─────────────────────────────────────────────────────────────────────────────
type LegendCfg = {
  category: string;
  windowDays: number | null;
  sortDir: "asc" | "desc";
  metric: string;
  aggregate: "value" | "sum" | "count";
  // L4: when set, only include rounds whose user_profiles.gender matches.
  // 'prefer_not_to_say' and null are EXCLUDED from women's-scoped categories.
  genderScope?: 'female';
};

// 8 stats × 2 windows (90D + All Time) = 16 base legend categories,
// plus the women's-division gross record (2 categories) added in L4.
const LEGEND_CATS: LegendCfg[] = [
  { category: "lowest_gross_90d",         windowDays: 90,   sortDir: "asc",  metric: "gross_score",       aggregate: "value" },
  { category: "lowest_gross_all_time",    windowDays: null, sortDir: "asc",  metric: "gross_score",       aggregate: "value" },
  { category: "best_score_diff_90d",      windowDays: 90,   sortDir: "asc",  metric: "score_diff",        aggregate: "value" },
  { category: "best_score_diff_all_time", windowDays: null, sortDir: "asc",  metric: "score_diff",        aggregate: "value" },
  { category: "most_birdies_90d",         windowDays: 90,   sortDir: "desc", metric: "birdies",           aggregate: "sum" },
  { category: "most_birdies_all_time",    windowDays: null, sortDir: "desc", metric: "birdies",           aggregate: "sum" },
  { category: "best_stableford_90d",      windowDays: 90,   sortDir: "desc", metric: "stableford_points", aggregate: "value" },
  { category: "best_stableford_all_time", windowDays: null, sortDir: "desc", metric: "stableford_points", aggregate: "value" },
  { category: "most_eagles_90d",          windowDays: 90,   sortDir: "desc", metric: "eagles",            aggregate: "sum" },
  { category: "most_eagles_all_time",     windowDays: null, sortDir: "desc", metric: "eagles",            aggregate: "sum" },
  { category: "most_albatrosses_90d",     windowDays: 90,   sortDir: "desc", metric: "albatrosses",       aggregate: "sum" },
  { category: "most_albatrosses_all_time",windowDays: null, sortDir: "desc", metric: "albatrosses",       aggregate: "sum" },
  { category: "most_aces_90d",            windowDays: 90,   sortDir: "desc", metric: "holes_in_one",      aggregate: "sum" },
  { category: "most_aces_all_time",       windowDays: null, sortDir: "desc", metric: "holes_in_one",      aggregate: "sum" },
  { category: "most_rounds_90d",          windowDays: 90,   sortDir: "desc", metric: "rounds",            aggregate: "sum" },
  { category: "most_rounds_all_time",     windowDays: null, sortDir: "desc", metric: "rounds",            aggregate: "sum" },
  // L4: women's division — gross record only, 90d + all-time.
  { category: "lowest_gross_women_90d",      windowDays: 90,   sortDir: "asc", metric: "gross_score", aggregate: "value", genderScope: 'female' },
  { category: "lowest_gross_women_all_time", windowDays: null, sortDir: "asc", metric: "gross_score", aggregate: "value", genderScope: 'female' },
];

async function applyCourseLegends(stats: any) {
  if (!stats.course_id) {
    console.warn(
      "[gam-evaluator] applyCourseLegends skipped — stats.course_id is null",
      {
        whs_score_id: stats.whs_score_id,
        user_id: stats.user_id,
        play_date: stats.play_date,
      }
    );
    return;
  }
  for (const cfg of LEGEND_CATS) await recomputeLegend(stats.course_id, cfg);
  // G2 — crown_taken / crown_lost. Bounded, silent-fail; contract owned by
  // Ben's SQL that populates `discover_rail_cache.course_regular:{course_id}`.
  await maybeEmitCrownDelta(stats.course_id).catch((e) => {
    console.warn('[gam-evaluator] maybeEmitCrownDelta failed', (e as Error).message);
  });
}

/**
 * Reads `discover_rail_cache.course_regular:{courseId}` and, if the payload
 * exposes both a current `user_id` and a `previous_user_id` that differ,
 * emits `crown_taken` to the new holder and `crown_lost` to the previous
 * one. Payload contract per BRIEF_G2_CLIENT_AND_EDGE:
 *   { user_id, display_name, username, rounds_90d, held_since,
 *     previous_user_id? }
 * If the row is missing / has no previous_user_id / user_id equals
 * previous_user_id, this is a no-op. Course name is looked up from
 * `golf_courses` (never from PII sources). User-facing copy is composed by
 * the dispatcher — this function only routes identifiers.
 */
async function maybeEmitCrownDelta(courseId: string): Promise<void> {
  const railKey = `course_regular:${courseId}`;
  const { data: cacheRow } = await supabase
    .from('discover_rail_cache')
    .select('payload')
    .eq('rail_key', railKey)
    .maybeSingle();
  const p: any = cacheRow?.payload ?? null;
  if (!p) return;
  const current: string | null = p.user_id ?? null;
  const previous: string | null = p.previous_user_id ?? null;
  if (!current || !previous || current === previous) return;

  // Course name lookup — degrades gracefully to null so the dispatcher can
  // fall back to generic copy. Never read whs_friends (PII).
  let courseName: string | null = null;
  try {
    const { data: course } = await supabase
      .from('golf_courses')
      .select('name')
      .eq('id', courseId)
      .maybeSingle();
    courseName = course?.name?.trim() || null;
  } catch { /* non-fatal */ }

  // New holder profile (display name for the "took your crown" copy on the
  // loser's push). Same PII rules as legend_lost.
  let newHolderName: string | null = null;
  try {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, username')
      .eq('id', current)
      .maybeSingle();
    newHolderName = (profile?.display_name?.trim() || profile?.username?.trim() || null);
  } catch { /* non-fatal */ }

  await enqueueNotification(current, 'crown_taken', {
    course_id: courseId,
    course_name: courseName,
    previous_user_id: previous,
  });
  await enqueueNotification(previous, 'crown_lost', {
    course_id: courseId,
    course_name: courseName,
    new_holder_id: current,
    new_holder_name: newHolderName,
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// Rate-a-course prompt
//
// One-shot nudge that asks a player to rate a course after a WHS round lands
// for a course they've never rated. Emits a `notifications` row (the existing
// auto_queue_push_notification trigger fans it to push), and relies on two
// partial unique indexes for correctness:
//   idx_notifications_rate_course_prompt_unique — one prompt per (user,course) EVER
//   idx_notifications_rate_course_prompt_recent — cheap 7-day cap lookup
//
// Copy is score-agnostic (no performance reference), per the standing rule
// for analytics-derived notifications.
// ─────────────────────────────────────────────────────────────────────────────
function isDaylightHour(now: Date, tz: string): boolean {
  // Emit only when it's 08:00–20:59 local. The notifications INSERT trigger
  // pushes immediately, so we gate at the writer instead of the dispatcher
  // (which doesn't touch the notifications table).
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz });
    const h = parseInt(fmt.format(now), 10);
    return h >= 8 && h < 21;
  } catch {
    const h = now.getUTCHours();
    return h >= 8 && h < 21;
  }
}

async function maybeEmitRateCoursePrompt(
  userId: string,
  courseId: string,
  courseName: string,
): Promise<void> {
  // Guard 1 — Not already rated. Mirrors get_played_unrated_courses's is_mock=false
  // filter so this push agrees with the on-screen nudges (RateNudge et al.).
  const { data: existingRating } = await supabase
    .from("course_ratings")
    .select("id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("is_mock", false)
    .limit(1)
    .maybeSingle();
  if (existingRating) return;

  // Guard 2 — Mappable + named. Enforced by the caller (clbhouzCourseId +
  // clbhouzCourseName must both be non-null), but re-assert defensively.
  const trimmedName = (courseName ?? "").trim();
  if (!courseId || !trimmedName) return;

  // Guard 4 — Weekly cap. Any rate_course_prompt in the last 7 days blocks this
  // one. Stops a golf-trip week producing five prompts in three days. Guard 3
  // (per-course, ever) is enforced by the unique partial index at insert time.
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data: recent } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "rate_course_prompt")
    .gte("created_at", sevenDaysAgo)
    .limit(1)
    .maybeSingle();
  if (recent) return;

  // Daylight gate — the notifications INSERT trigger pushes immediately, so
  // if it's currently outside the user's local 08:00–20:59 window we skip and
  // rely on the next round (or next evaluator pass) to re-check. Ledger dedup
  // is preserved via the unique index if we later succeed.
  let tz = "Europe/London";
  try {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("preferred_timezone")
      .eq("id", userId)
      .maybeSingle();
    tz = (profile as any)?.preferred_timezone ?? "Europe/London";
  } catch { /* non-fatal */ }
  if (!isDaylightHour(new Date(), tz)) return;

  const route = `/rate-course-v2/${courseId}`;
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type: "rate_course_prompt",
    recipient_actor_type: "personal",
    recipient_actor_id: userId,
    actor_id: null,
    entity_type: "course",
    entity_id: courseId,
    title: `How was ${trimmedName}?`,
    message: "Rate your round and help other members.",
    data: {
      course_id: courseId,
      course_name: trimmedName,
      link: route,
      route,
    },
  });
  // Unique-index conflicts (23505) mean the per-course guard already fired —
  // silently succeed. Everything else is warned but non-fatal so the round
  // continues processing.
  if (error && (error as any).code !== "23505") {
    console.warn("[rate_course_prompt insert]", error.message);
  }
}





async function recomputeLegend(courseId: string, cfg: LegendCfg) {
  // Current stored board — the FULL field for this course/category, no cap.
  const { data: prev } = await supabase
    .from("gam_course_legends")
    .select("user_id, value")
    .eq("course_id", courseId).eq("category", cfg.category).eq("is_current", true)
    .order("rank", { ascending: true });
  const prevTopUser = prev?.[0]?.user_id ?? null;

  // Build the new FULL board client-side — every qualifying player, ranked from
  // 1, with no cap (BRIEF_CHAMPIONS_FULL_LEADERBOARD).
  const sinceDate = cfg.windowDays
    ? new Date(Date.now() - cfg.windowDays * 86400_000).toISOString().slice(0, 10)
    : null;
  let q = supabase
    .from("gam_round_stats")
    .select("user_id, play_date, birdies, gross_score, score_diff, stableford_points, eagles, holes_in_one, albatrosses")
    .eq("course_id", courseId)
    .eq("holes_played", 18); // Legends are 18-hole rounds only
  if (sinceDate) q = q.gte("play_date", sinceDate);
  const { data: rounds } = await q;
  if (!rounds) return;

  // L4: women's-scoped categories only include rounds whose user is female.
  // 'prefer_not_to_say' / null are EXCLUDED. One extra query total, chunked at
  // 200 ids defensively. All other logic below is shared with the base cats.
  let filteredRounds = rounds;
  if (cfg.genderScope === 'female' && rounds.length > 0) {
    const userIds = Array.from(new Set(rounds.map((r: any) => r.user_id)));
    const female = new Set<string>();
    for (let i = 0; i < userIds.length; i += 200) {
      const chunk = userIds.slice(i, i + 200);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, gender')
        .in('id', chunk);
      for (const p of profiles ?? []) {
        if ((p as any).gender === 'female') female.add((p as any).id);
      }
    }
    filteredRounds = rounds.filter((r: any) => female.has(r.user_id));
  }

  // Aggregate
  const byUser = new Map<string, { value: number; attained_at: string }>();
  for (const r of filteredRounds) {
    let val: number | null = null;
    if (cfg.metric === "rounds") val = 1; // synthetic metric — every qualifying row counts once
    else if (cfg.aggregate === "value") val = (r as any)[cfg.metric];
    else if (cfg.aggregate === "sum") val = (r as any)[cfg.metric] ?? 0;
    else if (cfg.aggregate === "count") val = 1;
    if (val == null) continue;
    const ex = byUser.get(r.user_id);
    if (cfg.aggregate === "value") {
      if (!ex || (cfg.sortDir === "asc" ? val < ex.value : val > ex.value)) {
        byUser.set(r.user_id, { value: val, attained_at: r.play_date });
      }
    } else {
      // sum / count
      const cur = ex?.value ?? 0;
      const newer = ex && ex.attained_at > r.play_date ? ex.attained_at : r.play_date;
      byUser.set(r.user_id, { value: cur + val, attained_at: newer });
    }
  }

  const arr = Array.from(byUser.entries())
    .map(([user_id, v]) => ({ user_id, value: v.value, attained_at: v.attained_at }))
    .filter((r) => (cfg.aggregate === "value" ? r.value != null : r.value > 0))
    .sort((a, b) => {
      const d = cfg.sortDir === "asc" ? a.value - b.value : b.value - a.value;
      if (d !== 0) return d;
      if (a.attained_at !== b.attained_at) return a.attained_at < b.attained_at ? -1 : 1;
      return a.user_id < b.user_id ? -1 : 1;
    });

  // Mark old as not current
  await supabase
    .from("gam_course_legends")
    .update({ is_current: false, updated_at: new Date().toISOString() })
    .eq("course_id", courseId).eq("category", cfg.category).eq("is_current", true);

  // Insert new top 10
  if (arr.length > 0) {
    const rows = arr.map((r, i) => ({
      user_id: r.user_id,
      course_id: courseId,
      category: cfg.category,
      rank: i + 1,
      value: r.value,
      attained_at: r.attained_at,
      is_current: true,
    }));
    const { error: insertErr } = await supabase
      .from("gam_course_legends")
      .insert(rows);
    if (insertErr) {
      console.error(
        "[gam-evaluator] gam_course_legends.insert failed",
        {
          courseId,
          category: cfg.category,
          rowCount: rows.length,
          error: insertErr,
        }
      );
      throw insertErr;
    }
  }

  const newTopUser = arr[0]?.user_id ?? null;
  if (newTopUser !== prevTopUser) {
    // Course name is needed by BOTH sides (legend_lost and legend_earned), so
    // it is resolved once here. golf_courses ONLY — never read
    // whs_friends/whs_friend_matches, those hold England Golf PII. Degrades to
    // null so the dispatcher can fall back to generic copy; a failed lookup
    // must never abort a crowning.
    let courseName: string | null = null;
    try {
      const { data: course } = await supabase
        .from('golf_courses')
        .select('name')
        .eq('id', courseId)
        .maybeSingle();
      courseName = course?.name?.trim() || null;
    } catch { /* non-fatal */ }

    if (prevTopUser) {
      if (newTopUser) {
        // Look up taker display name from user_profiles ONLY. Same PII rule as
        // above; degrades to null. Loser side only — meaningless to the gainer.
        let takerName: string | null = null;
        try {
          const { data: takerProfile } = await supabase
            .from('user_profiles')
            .select('display_name, username')
            .eq('id', newTopUser)
            .maybeSingle();
          takerName = (takerProfile?.display_name?.trim() || takerProfile?.username?.trim() || null);
        } catch { /* non-fatal */ }

        // NOTE: the DB trigger gam_legend_pulse_emit (on gam_course_legends
        // INSERT) already enqueued this exact legend_lost row a few lines up,
        // with the SAME deduplication_key. So this upsert always no-ops and
        // returns zero rows, which means writeActivityRow() never runs here —
        // the Activity mirror for legend_lost lives in that trigger. Keep the
        // two copies identical; do not "fix" the missing ledger row here.
        await enqueueNotification(prevTopUser, "legend_lost", {
          course_id: courseId,
          category: cfg.category,
          taken_by: newTopUser,
          taker_name: takerName,
          course_name: courseName,
        });
      }
      // Loser side: their rank-1 count went down — recompute authoritatively.
      await recomputeLegendTitles(prevTopUser);
    }
    if (newTopUser) {
      await enqueueNotification(newTopUser, "legend_earned", {
        course_id: courseId,
        category: cfg.category,
        course_name: courseName,
      });

      // Gainer side: single code path for the tiered badge + milestone.
      await recomputeLegendTitles(newTopUser);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// apply_rivalry_results
// ─────────────────────────────────────────────────────────────────────────────
function compareOutcome(mine: number | null, theirs: number | null, higherWins = true): "W" | "L" | "T" | null {
  if (mine == null || theirs == null) return null;
  if (mine === theirs) return "T";
  if (higherWins) return mine > theirs ? "W" : "L";
  return mine < theirs ? "W" : "L";
}

async function applyRivalryResults(userId: string, stats: any, whsScoreId: string) {
  if (!stats.course_id || !stats.play_date) return;
  const { data: shared } = await supabase
    .from("gam_round_stats")
    .select("user_id, whs_score_id, stableford_points, gross_score, whs_scores!inner(handicap_index_at_time)")
    .eq("course_id", stats.course_id).eq("play_date", stats.play_date)
    .neq("user_id", userId);
  if (!shared || shared.length === 0) return;

  for (const rival of shared) {
    const { data: rivalry } = await supabase
      .from("friend_rivalry")
      .select("user_id, rival_user_id, shared_round_results, shared_rounds_count")
      .eq("user_id", userId).eq("rival_user_id", rival.user_id).maybeSingle();
    if (!rivalry) continue;

    // Pending-handicap rounds inflate stableford via the 54-handicap temp ceiling.
    // Skip the stableford comparison when either side is pending; gross is unaffected.
    const currentPending = stats.hcp_at_time === null;
    const rivalPending = (rival as any).whs_scores?.handicap_index_at_time === null;
    const eitherPending = currentPending || rivalPending;

    const sb = eitherPending
      ? null
      : compareOutcome(stats.stableford_points, rival.stableford_points, true);
    const gr = compareOutcome(stats.gross_score, rival.gross_score, false);
    const entry = {
      play_date: stats.play_date,
      course_id: stats.course_id,
      course_name: stats.course_name,
      user_score_id: whsScoreId,
      rival_score_id: rival.whs_score_id,
      user_stableford: eitherPending ? null : stats.stableford_points,
      rival_stableford: eitherPending ? null : rival.stableford_points,
      stableford_outcome: sb,
      user_gross: stats.gross_score,
      rival_gross: rival.gross_score,
      gross_outcome: gr,
    };
    const existingArr: any[] = Array.isArray(rivalry.shared_round_results) ? rivalry.shared_round_results : [];
    // Dedupe by user_score_id
    if (existingArr.find((r) => r.user_score_id === whsScoreId)) continue;
    const newArr = [...existingArr, entry];
    const cutoff = new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
    const last90 = newArr.filter((r) => r.play_date >= cutoff).length;

    await supabase.from("friend_rivalry").update({
      shared_round_results: newArr,
      shared_rounds_count: (rivalry.shared_rounds_count ?? 0) + 1,
      shared_rounds_last_90d: last90,
      computed_at: new Date().toISOString(),
    }).eq("user_id", userId).eq("rival_user_id", rival.user_id);

    // Mirror to inverse rivalry
    const { data: inverse } = await supabase
      .from("friend_rivalry")
      .select("shared_round_results, shared_rounds_count")
      .eq("user_id", rival.user_id).eq("rival_user_id", userId).maybeSingle();
    if (inverse) {
      const invEntry = {
        ...entry,
        user_score_id: rival.whs_score_id,
        rival_score_id: whsScoreId,
        user_stableford: eitherPending ? null : rival.stableford_points,
        rival_stableford: eitherPending ? null : stats.stableford_points,
        stableford_outcome: sb === "W" ? "L" : sb === "L" ? "W" : sb,
        user_gross: rival.gross_score,
        rival_gross: stats.gross_score,
        gross_outcome: gr === "W" ? "L" : gr === "L" ? "W" : gr,
      };
      const invArr: any[] = Array.isArray(inverse.shared_round_results) ? inverse.shared_round_results : [];
      if (!invArr.find((r) => r.user_score_id === rival.whs_score_id)) {
        await supabase.from("friend_rivalry").update({
          shared_round_results: [...invArr, invEntry],
          shared_rounds_count: (inverse.shared_rounds_count ?? 0) + 1,
          computed_at: new Date().toISOString(),
        }).eq("user_id", rival.user_id).eq("rival_user_id", userId);
      }
    }

    // 5-0 sweep check
    if (sb === "W") {
      const last5 = newArr.slice(-5).map((r) => r.stableford_outcome);
      if (last5.length === 5 && last5.every((o) => o === "W")) {
        await upsertBadgeEarned(userId, "rival_sweep_5", null);
      }
    }

    // Look up rival display name from user_profiles ONLY (never
    // whs_friends/whs_friend_matches — England Golf PII). Degrade to null
    // so the dispatcher can render generic copy.
    let rivalName: string | null = null;
    try {
      const { data: rivalProfile } = await supabase
        .from('user_profiles')
        .select('display_name, username')
        .eq('id', rival.user_id)
        .maybeSingle();
      rivalName = (rivalProfile?.display_name?.trim() || rivalProfile?.username?.trim() || null);
    } catch { /* non-fatal */ }

    await enqueueNotification(userId, "rival_played", {
      rival_user_id: rival.user_id,
      rival_name: rivalName,
      course_id: stats.course_id,
      course_name: stats.course_name ?? null,
      play_date: stats.play_date,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// enqueue_notification
// ─────────────────────────────────────────────────────────────────────────────
// MUST stay in sync with legendCategoryLabel in src/lib/gam/visuals.ts AND
// public.gam_legend_category_label in the database. Three copies exist because
// push has no client and the trigger has no TypeScript.
const LEGEND_CATEGORY_LABEL: Record<string, string> = {
  lowest_gross_90d:             'Gross Record',
  lowest_gross_all_time:        'Gross Record',
  lowest_gross:                 'Gross Record',      // legacy, pre 90d/all_time split
  best_score_diff_90d:          'Score Legend',
  best_score_diff_all_time:     'Score Legend',
  best_score_diff:              'Score Legend',      // legacy, pre 90d/all_time split
  most_birdies_90d:             'Birdies',
  most_birdies_all_time:        'Birdies',
  best_stableford_90d:          'Stableford',
  best_stableford_all_time:     'Stableford',
  most_eagles_90d:              'Eagles',
  most_eagles_all_time:         'Eagles',
  most_aces_90d:                'Aces',
  most_aces_all_time:           'Aces',
  most_albatrosses_90d:         'Albatross',
  most_albatrosses_all_time:    'Albatross',
  most_rounds_90d:              'Rounds',
  most_rounds_all_time:         'Rounds',
  lowest_gross_women_90d:       "Women's course record",
  lowest_gross_women_all_time:  "Women's course record",
};

const URGENCY: Record<string, string> = {
  badge_earned: "low",
  legend_lost: "high",
  legend_earned: "medium",
  streak_at_risk: "medium",
  streak_broken: "low",
  streak_freeze_applied: "medium",
  rival_played: "medium",
  status_at_risk: "high",
  status_reclaimed: "medium",
  level_up: "medium",
  level_near: "low",
  crown_taken: "medium",   // gainer side — welcome, not urgent
  crown_lost: "high",      // loss event, same tier as legend_lost
};


function dedupKey(type: string, userId: string, payload: any): string {
  switch (type) {
    case "badge_earned": return `badge_earned:${userId}:${payload.badge_id}`;
    // Unified with public.gam_emit_legend_pulse_event() — the SQL trigger that
    // also emits legend_lost. Both sides use the venue-agnostic UTC date so the
    // two strings match exactly and either emitter suppresses the other.
    // Key: legend_lost:{userId}:{course_id}:{category}:{YYYY-MM-DD (UTC)}
    case "legend_lost": return `legend_lost:${userId}:${payload.course_id}:${payload.category}:${new Date().toISOString().slice(0, 10)}`;
    case "legend_earned": return `legend_earned:${userId}:${payload.course_id}:${payload.category}`;
    case "streak_at_risk": return `streak_risk:${userId}:${payload.streak_type}`;
    case "streak_broken": return `streak_broken:${userId}:${payload.streak_type}:${new Date().toISOString().slice(0, 10)}`;
    case "rival_played": return `rival:${userId}:${payload.rival_user_id}:${payload.course_id}:${payload.play_date}`;
    case "streak_freeze_applied": return `streak_freeze:${userId}:${payload.streak_type}:${new Date().toISOString().slice(0, 10)}`;
    case "status_at_risk": return `status_risk:${userId}:${payload.badge_id}`;
    case "status_reclaimed": return `status_reclaimed:${userId}:${payload.badge_id}:${new Date().toISOString().slice(0, 10)}`;
    case "level_up": return `level_up:${userId}:${payload.level}`;
    case "level_near": return `level_near:${userId}:${payload.level}`;
    case "crown_taken": return `crown_taken:${userId}:${payload.course_id}:${new Date().toISOString().slice(0, 10)}`;
    case "crown_lost": return `crown_lost:${userId}:${payload.course_id}:${new Date().toISOString().slice(0, 10)}`;

    default: return `${type}:${userId}`;
  }
}

async function enqueueNotification(userId: string, type: string, payload: any) {
  // Write-time dedup semantics.
  //
  // The prior pending-only existence check was unsafe: the dispatcher flips
  // rows out of `pending` within ~60s, so any subsequent evaluator pass that
  // re-detected the same event (see recomputeLegend note below) would re-insert
  // the same deduplication_key — producing thousands of duplicate rows and
  // repeated pushes to the same user.
  //
  // The correct dedup boundary is at the writer, keyed on deduplication_key.
  // The owner has installed a DB trigger that silently skips inserts whose
  // deduplication_key already exists within a 24h window, and will follow up
  // with a unique index. We match that intent here by using an upsert with
  // ignoreDuplicates so an eventual unique index resolves cleanly instead of
  // erroring, and any current trigger-skip is a no-op on our side.
  try {
    const { data: inserted, error } = await supabase
      .from("gam_notification_outbox")
      .upsert(
        {
          user_id: userId,
          notification_type: type,
          template_id: type,
          template_payload: payload,
          trigger_whs_score_id: payload?.whs_score_id ?? null,
          deduplication_key: dedupKey(type, userId, payload),
          scheduled_for: new Date().toISOString(),
          urgency: URGENCY[type] ?? "low",
          status: "pending",
        },
        { onConflict: "deduplication_key", ignoreDuplicates: true },
      )
      .select("id");
    if (error) {
      console.warn("[enqueueNotification]", type, error.message);
      return;
    }
    // A row comes back ONLY when the outbox insert actually landed. Both the
    // dedup trigger (silent skip) and ignoreDuplicates return zero rows, so
    // this is the exact "the push was really enqueued" signal — the Activity
    // row is written on the same condition, never on a suppressed push.
    if (Array.isArray(inserted) && inserted.length > 0) {
      await writeActivityRow(userId, type, payload);
    }
  } catch (e) {
    console.warn("[enqueueNotification]", type, (e as Error).message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity ledger mirror.
//
// gam_notification_outbox stays a pure DELIVERY QUEUE (status/scheduled_for/
// sent_at). The Activity page reads public.notifications via
// get_activity_feed, so a game notification also needs a row there or it is
// push-only and gone. These types are shown under the "Crowns" chip and are
// EXCLUDED from All/New/Mentions/Friends by get_activity_feed.
//
// MUST match v_game_types in public.get_activity_feed and GAME_NOTIF_TYPES in
// src/features/activity-v2/components/ledgerKinds.tsx.
// ─────────────────────────────────────────────────────────────────────────────
function activityCopy(
  type: string,
  p: any,
): { title: string; message: string; entity_type: string | null; entity_id: string | null } | null {
  const course = (p?.course_name as string | null) || "this course";
  const courseId = (p?.course_id as string | null) ?? null;
  switch (type) {
    case "level_up":
      return {
        title: "New tier reached",
        message: `You reached ${p?.label ?? "a new tier"}.`,
        entity_type: null,
        entity_id: null,
      };
    case "level_near":
      return {
        title: "Almost there",
        message: `You are ${p?.gap ?? "a few"} medals from ${p?.label ?? "the next tier"}.`,
        entity_type: null,
        entity_id: null,
      };
    case "legend_earned": {
      const label = LEGEND_CATEGORY_LABEL[p?.category as string];
      return {
        title: "Course legend",
        message: label
          ? `You are now the ${label} leader at ${course}.`
          : `You are now the legend at ${course}.`,
        entity_type: "course",
        entity_id: courseId,
      };
    }
    case "legend_lost": {
      const label = LEGEND_CATEGORY_LABEL[p?.category as string];
      const taker = (p?.taker_name as string | null) ?? "Someone";
      return {
        title: "Legend lost",
        message: label
          ? `${taker} beat your ${label} at ${course}.`
          : `${taker} took your legend title at ${course}.`,
        entity_type: "course",
        entity_id: courseId,
      };
    }

    case "crown_taken":
      return {
        title: "Crown taken",
        message: `You took the crown at ${course}.`,
        entity_type: "course",
        entity_id: courseId,
      };
    case "crown_lost":
      return {
        title: "Crown lost",
        message: `${p?.new_holder_name ?? "Someone"} took your crown at ${course}.`,
        entity_type: "course",
        entity_id: courseId,
      };
    case "streak_at_risk":
      return {
        title: "Streak at risk",
        message: `Your ${p?.streak_type ?? "playing"} streak is about to break.`,
        entity_type: null,
        entity_id: null,
      };
    case "streak_broken":
      return {
        title: "Streak broken",
        message: `Your ${p?.streak_type ?? "playing"} streak ended at ${p?.count ?? 0}.`,
        entity_type: null,
        entity_id: null,
      };
    case "streak_freeze_applied":
      return {
        title: "Streak saved",
        message: `A freeze kept your ${p?.streak_type ?? "playing"} streak alive.`,
        entity_type: null,
        entity_id: null,
      };
    case "status_at_risk":
      return {
        title: "Status at risk",
        message: "Your handicap status is slipping below the hold line.",
        entity_type: null,
        entity_id: null,
      };
    case "status_reclaimed":
      return {
        title: "Status reclaimed",
        message: "You are back inside your handicap status band.",
        entity_type: null,
        entity_id: null,
      };
    case "rival_played":
      return {
        title: "Rival on the course",
        message: `${p?.rival_name ?? "Your rival"} posted a round at ${course}.`,
        entity_type: "course",
        entity_id: courseId,
      };
    case "badge_earned": {
      // badge_title is enriched at emit time; the bold accent is rendered from
      // data.badge_title by LedgerRow, so the message stops before the title.
      const tier = p?.tier;
      return {
        title: "Badge earned",
        message: p?.badge_title
          ? (tier ? `You reached tier ${tier} of` : "You earned")
          : "You earned a new badge.",
        entity_type: null,
        entity_id: null,
      };
    }
    default:
      // Anything else keeps its existing surfaces untouched.
      return null;

  }
}

async function writeActivityRow(userId: string, type: string, payload: any) {
  const copy = activityCopy(type, payload);
  if (!copy) return;
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      recipient_actor_type: "personal",
      recipient_actor_id: userId,
      type,
      title: copy.title,
      message: copy.message,
      data: payload ?? {},
      entity_type: copy.entity_type,
      entity_id: copy.entity_id,
      actor_id: null,
    });
    if (error) console.warn("[writeActivityRow]", type, error.message);
  } catch (e) {
    console.warn("[writeActivityRow]", type, (e as Error).message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Ascent -- wall level up / near-miss detection.
//
// MUST match trophy-room levels.ts WALL_LEVELS. Any change to the client
// ladder needs the equivalent edit here and a fresh evaluator deploy.
// ─────────────────────────────────────────────────────────────────────────────
interface WallLevelDef { level: number; medalsRequired: number; label: string; }
const WALL_LEVELS_DEF: WallLevelDef[] = [
  { level: 1,  medalsRequired: 1,  label: "Bronze I"        },
  { level: 2,  medalsRequired: 4,  label: "Bronze II"       },
  { level: 3,  medalsRequired: 8,  label: "Silver I"        },
  { level: 4,  medalsRequired: 13, label: "Silver II"       },
  { level: 5,  medalsRequired: 19, label: "Emerald I"       },
  { level: 6,  medalsRequired: 26, label: "Emerald II"      },
  { level: 7,  medalsRequired: 33, label: "Diamond I"       },
  { level: 8,  medalsRequired: 40, label: "Diamond II"      },
  { level: 9,  medalsRequired: 47, label: "Obsidian I"      },
  { level: 10, medalsRequired: 55, label: "Clubhouse Legend"},
];

function levelForMedalsSrv(medals: number): WallLevelDef | null {
  let cur: WallLevelDef | null = null;
  for (const l of WALL_LEVELS_DEF) {
    if (medals >= l.medalsRequired) cur = l;
    else break;
  }
  return cur;
}

function nextLevelForMedalsSrv(medals: number): WallLevelDef | null {
  return WALL_LEVELS_DEF.find((l) => l.medalsRequired > medals) ?? null;
}

async function evaluateLevelTransition(userId: string, whsScoreId: string) {
  // 1. live medal count via RPC
  const { data: medalsData, error: medalsErr } = await supabase.rpc(
    "get_user_medal_count",
    { p_user_id: userId },
  );
  if (medalsErr) throw new Error(`get_user_medal_count: ${medalsErr.message}`);
  const medals = typeof medalsData === "number" ? medalsData : 0;

  const current = levelForMedalsSrv(medals);

  // 2. latest recorded level (any kind) for this user
  const { data: lastRow } = await supabase
    .from("gam_user_level_events")
    .select("level,kind")
    .eq("user_id", userId)
    .eq("kind", "up")
    .order("level", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastLevel = lastRow?.level ?? 0;

  // 3. level-up path
  if (current && current.level > lastLevel) {
    const { error: insErr } = await supabase.from("gam_user_level_events").insert({
      user_id: userId,
      kind: "up",
      level: current.level,
      label: current.label,
      medals,
    });
    if (insErr) {
      console.warn("[level_eval up insert]", insErr.message);
    } else {
      await enqueueNotification(userId, "level_up", {
        level: current.level,
        label: current.label,
        medals,
        whs_score_id: whsScoreId,
      });
    }
    return;
  }

  // 4. near-miss path: within 2 medals of the next threshold
  const next = nextLevelForMedalsSrv(medals);
  if (!next) return;
  const gap = next.medalsRequired - medals;
  if (gap > 2 || gap <= 0) return;

  // dedupe via unique (user_id, level) partial index where kind='near'
  const { error: nearErr } = await supabase.from("gam_user_level_events").insert({
    user_id: userId,
    kind: "near",
    level: next.level,
    label: next.label,
    medals,
  });
  if (nearErr) {
    // unique-violation is expected on repeat rounds at the same gap
    if (!/duplicate|unique/i.test(nearErr.message)) {
      console.warn("[level_eval near insert]", nearErr.message);
    }
    return;
  }
  await enqueueNotification(userId, "level_near", {
    level: next.level,
    label: next.label,
    medals,
    gap,
    whs_score_id: whsScoreId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// evaluateSeasonMedal
//
// Awards the season_{year}_q{quarter} binary badge when the user has played
// >= SEASON_ROUNDS_REQUIRED verified rounds within the current round's
// quarter. Idempotent: skips silently when the catalogue row is missing,
// inactive, or already earned.
//
// MUST MATCH the frontend threshold in src/lib/gam/seasonClock.ts.
// ─────────────────────────────────────────────────────────────────────────────
const SEASON_ROUNDS_REQUIRED = 5;

function quarterOfDate(playDate: string): { year: number; quarter: number; startIso: string; endIso: string } {
  const d = new Date(playDate + "T00:00:00Z");
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const q = Math.floor(m / 3) + 1;
  const startMonth = (q - 1) * 3;
  const start = new Date(Date.UTC(y, startMonth, 1));
  const end = new Date(Date.UTC(y, startMonth + 3, 1));
  return {
    year: y,
    quarter: q,
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
  };
}

async function evaluateSeasonMedal(
  userId: string,
  stats: any,
  whsScoreId: string,
): Promise<string | null> {
  const playDate: string | null = stats?.play_date ?? null;
  if (!playDate) return null;
  const { year, quarter, startIso, endIso } = quarterOfDate(playDate);
  const badgeId = `season_${year}_q${quarter}`;

  const { data: cat } = await supabase
    .from("gam_badge_catalogue")
    .select("id,is_active")
    .eq("id", badgeId)
    .maybeSingle();
  if (!cat || cat.is_active !== true) return null;

  const { data: existing } = await supabase
    .from("gam_user_badges")
    .select("badge_id")
    .eq("user_id", userId)
    .eq("badge_id", badgeId)
    .maybeSingle();
  if (existing) return null;

  const { count, error: countErr } = await supabase
    .from("gam_round_stats")
    .select("whs_score_id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("play_date", startIso)
    .lt("play_date", endIso);
  if (countErr) throw countErr;
  if ((count ?? 0) < SEASON_ROUNDS_REQUIRED) return null;

  const did = await upsertBadgeEarned(userId, badgeId, whsScoreId);
  return did ? badgeId : null;
}
