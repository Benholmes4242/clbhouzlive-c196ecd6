// gam-evaluator — Engine that drains gam_evaluation_queue and applies all state changes.
// Triggers: cron (every 30s, drains up to 50), or POST { whs_score_id } / POST { user_id, replay:true }.
// Idempotent via gam_lock_for_eval + evaluator_version_last.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVALUATOR_VERSION = parseInt(Deno.env.get("GAM_EVALUATOR_VERSION") ?? "1", 10);
const BATCH_SIZE = 50;
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
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
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

    // Cron drain
    const rows = await fetchQueueBatch(BATCH_SIZE);
    const results: any[] = [];
    for (const row of rows) {
      try {
        const r = await processSingle(row.whs_score_id);
        results.push({ id: row.whs_score_id, ...r });
      } catch (err) {
        await markFailed(row, err);
        results.push({ id: row.whs_score_id, error: (err as Error).message });
      }
    }
    return json({ ok: true, drained: rows.length, results });
  } catch (e) {
    console.error("[evaluator] fatal", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Queue
// ─────────────────────────────────────────────────────────────────────────────
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

  // Compute
  const stats = computeRoundStats(scoreRow, holes, {
    user_id: userId,
    course_id: clbhouzCourseId,
    course_name: clbhouzCourseName,
    course_par: clbhouzCoursePar,
  });

  // Persist gam_round_stats
  const { error: upErr } = await supabase
    .from("gam_round_stats")
    .upsert(stats, { onConflict: "whs_score_id" });
  if (upErr) throw upErr;

  // Idempotency guard for counter-style state changes
  const alreadyAtVersion = (scoreRow.evaluator_version_last ?? 0) >= EVALUATOR_VERSION;

  let earned: string[] = [];
  if (!alreadyAtVersion) {
    await applyMilestones(userId, stats);
    await recomputeTop100Milestones(userId);
    earned = await applyBadges(userId, stats, whsScoreId);
    await applyStreaks(userId, stats);
    await applyCourseLegends(stats);
    await applyRivalryResults(userId, stats, whsScoreId);
  } else {
    // Refresh course legends — idempotent recompute, safe to re-run
    await applyCourseLegends(stats);
  }

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
    delta_index: null,
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
// Distinct rated-course counts per Top 100 list, written to gam_user_milestones.
// Set-based (idempotent across replay). Called per evaluation so a user who
// rates a course between rounds gets credit on the next score post too.
// ─────────────────────────────────────────────────────────────────────────────
async function recomputeTop100Milestones(userId: string) {
  const distinctByList = new Map<string, Set<string>>();

  // (a) RATED Top 100 courses
  const { data: ratedRows, error: ratedErr } = await supabase
    .from("course_top100_memberships")
    .select(`
      course_id,
      top100_lists!inner ( slug, is_active ),
      course_ratings!inner ( user_id, rating )
    `)
    .eq("top100_lists.is_active", true)
    .eq("course_ratings.user_id", userId)
    .not("course_ratings.rating", "is", null);

  if (ratedErr) {
    console.error("[recomputeTop100Milestones] rated query error", ratedErr);
  }
  for (const row of ratedRows ?? []) {
    const slug = (row as any).top100_lists?.slug;
    if (!slug || !TOP_100_METRIC_BY_SLUG[slug]) continue;
    if (!distinctByList.has(slug)) distinctByList.set(slug, new Set());
    distinctByList.get(slug)!.add((row as any).course_id);
  }

  // (b) WHS-PLAYED Top 100 courses — bridged via whs_courses + whs_course_aliases by name.
  // whs_scores.course_id is a whs_courses id, NOT a golf_courses id; the two only bridge
  // through whs_course_aliases (matched by lower(trim(name))). PostgREST can't express
  // that join, so we use a small SQL helper RPC.
  const { data: playedGolfCourseRows, error: playedErr } = await supabase.rpc(
    "user_whs_played_golf_course_ids",
    { p_user_id: userId },
  );
  if (playedErr) {
    console.error("[recomputeTop100Milestones] whs-played query error", playedErr);
  }
  const playedGolfCourseIds = (playedGolfCourseRows ?? [])
    .map((r: any) => r.course_id)
    .filter(Boolean);

  if (playedGolfCourseIds.length > 0) {
    const { data: memRows, error: memErr } = await supabase
      .from("course_top100_memberships")
      .select(`
        course_id,
        top100_lists!inner ( slug, is_active )
      `)
      .eq("top100_lists.is_active", true)
      .in("course_id", playedGolfCourseIds);

    if (memErr) {
      console.error("[recomputeTop100Milestones] membership query error", memErr);
    }
    for (const row of memRows ?? []) {
      const slug = (row as any).top100_lists?.slug;
      if (!slug || !TOP_100_METRIC_BY_SLUG[slug]) continue;
      if (!distinctByList.has(slug)) distinctByList.set(slug, new Set());
      distinctByList.get(slug)!.add((row as any).course_id);
    }
  }

  const nowIso = new Date().toISOString();
  for (const slug of Object.values(TOP_100_SLUG_BY_METRIC)) {
    const metric = TOP_100_METRIC_BY_SLUG[slug];
    const count = distinctByList.get(slug)?.size ?? 0;

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
    case "clean_card": return stats.clean_card;
    case "spring_2026_active": return stats.is_counter;
    case "beat_par": return stats.beat_par;
    default: return false;
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
      if (!badge.counter_metric) continue;
      const lifetime = await getMilestone(userId, badge.counter_metric);
      const tiers = badge.counter_tiers;
      const existing = currentById.get(badge.id);

      if (Array.isArray(tiers) && tiers.length > 0) {
        const tier = computeTier(lifetime, tiers);
        if (tier > 0 && (!existing || (existing.counter_tier ?? 0) < tier)) {
          await upsertBadgeTiered(userId, badge.id, lifetime, tier, whsScoreId);
          earned.push(badge.id);
        } else if (existing) {
          await supabase
            .from("gam_user_badges")
            .update({ counter_value: lifetime, updated_at: new Date().toISOString() })
            .eq("user_id", userId).eq("badge_id", badge.id);
        }
      } else {
        // Plain counter without tiers
        if (lifetime > 0 && !existing) {
          const did = await upsertBadgeEarned(userId, badge.id, whsScoreId);
          if (did) earned.push(badge.id);
        } else if (existing) {
          await supabase
            .from("gam_user_badges")
            .update({ counter_value: lifetime, updated_at: new Date().toISOString() })
            .eq("user_id", userId).eq("badge_id", badge.id);
        }
      }
    }
    // streaks handled in applyStreaks
  }
  return earned;
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
  await enqueueNotification(userId, "badge_earned", { badge_id: badgeId, whs_score_id: whsScoreId });
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
    await enqueueNotification(userId, "badge_earned", { badge_id: badgeId, tier, whs_score_id: whsScoreId });
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
  const dIdx = stats.delta_index;
  await updateRoundStreak(userId, stats, "no_up", dIdx != null && dIdx <= 0);
  await updateRoundStreak(userId, stats, "cutting", dIdx != null && dIdx < 0);
  await updateRoundStreak(userId, stats, "counter", !!stats.is_counter);
  await updateRoundStreak(userId, stats, "sub_80", !!stats.sub_80);
  await updateRoundStreak(userId, stats, "sub_par", !!stats.beat_par);
  await updateRoundStreak(userId, stats, "birdie_round", stats.birdies > 0);
  await updateRoundPlayedStreak(userId, stats);
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
type LegendCfg = { category: string; windowDays: number | null; sortDir: "asc" | "desc"; metric: string; aggregate: "value" | "sum" | "count" };

// 8 stats × 2 windows (90D + All Time) = 16 legend categories.
// Naming convention: <stat>_90d for the rolling window, <stat>_all_time for permanent records.
// NOTE: legacy names `best_score_diff`, `lowest_gross` were renamed for consistency.
// Run `gam_reset_user` (via gam-backdate-replay) to wipe old rows and rebuild with the new names.
const LEGEND_CATS: LegendCfg[] = [
  // ── Lowest gross score ──
  { category: "lowest_gross_90d",         windowDays: 90,   sortDir: "asc",  metric: "gross_score",       aggregate: "value" },
  { category: "lowest_gross_all_time",    windowDays: null, sortDir: "asc",  metric: "gross_score",       aggregate: "value" },
  // ── Best score differential ──
  { category: "best_score_diff_90d",      windowDays: 90,   sortDir: "asc",  metric: "score_diff",        aggregate: "value" },
  { category: "best_score_diff_all_time", windowDays: null, sortDir: "asc",  metric: "score_diff",        aggregate: "value" },
  // ── Most birdies ──
  { category: "most_birdies_90d",         windowDays: 90,   sortDir: "desc", metric: "birdies",           aggregate: "sum" },
  { category: "most_birdies_all_time",    windowDays: null, sortDir: "desc", metric: "birdies",           aggregate: "sum" },
  // ── Best Stableford ──
  { category: "best_stableford_90d",      windowDays: 90,   sortDir: "desc", metric: "stableford_points", aggregate: "value" },
  { category: "best_stableford_all_time", windowDays: null, sortDir: "desc", metric: "stableford_points", aggregate: "value" },
  // ── Most eagles ──
  { category: "most_eagles_90d",          windowDays: 90,   sortDir: "desc", metric: "eagles",            aggregate: "sum" },
  { category: "most_eagles_all_time",     windowDays: null, sortDir: "desc", metric: "eagles",            aggregate: "sum" },
  // ── Most albatrosses ──
  { category: "most_albatrosses_90d",     windowDays: 90,   sortDir: "desc", metric: "albatrosses",       aggregate: "sum" },
  { category: "most_albatrosses_all_time",windowDays: null, sortDir: "desc", metric: "albatrosses",       aggregate: "sum" },
  // ── Most hole-in-ones ──
  { category: "most_aces_90d",            windowDays: 90,   sortDir: "desc", metric: "holes_in_one",      aggregate: "sum" },
  { category: "most_aces_all_time",       windowDays: null, sortDir: "desc", metric: "holes_in_one",      aggregate: "sum" },
  // ── Most rounds played ──
  // NOTE: 'rounds' is NOT a column on gam_round_stats — recomputeLegend
  // special-cases cfg.metric === 'rounds' to contribute 1 per qualifying row.
  // Do NOT add 'rounds' to the SELECT list below; the column doesn't exist.
  { category: "most_rounds_90d",          windowDays: 90,   sortDir: "desc", metric: "rounds",            aggregate: "sum" },
  { category: "most_rounds_all_time",     windowDays: null, sortDir: "desc", metric: "rounds",            aggregate: "sum" },
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
}

async function recomputeLegend(courseId: string, cfg: LegendCfg) {
  // Current top 10
  const { data: prev } = await supabase
    .from("gam_course_legends")
    .select("user_id, value")
    .eq("course_id", courseId).eq("category", cfg.category).eq("is_current", true)
    .order("rank", { ascending: true });
  const prevTopUser = prev?.[0]?.user_id ?? null;

  // Build new top 10 client-side
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

  // Aggregate
  const byUser = new Map<string, { value: number; attained_at: string }>();
  for (const r of rounds) {
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
    .sort((a, b) => cfg.sortDir === "asc" ? a.value - b.value : b.value - a.value)
    .slice(0, 10);

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
  if (newTopUser && newTopUser !== prevTopUser) {
    if (prevTopUser) {
      await enqueueNotification(prevTopUser, "legend_lost", {
        course_id: courseId, category: cfg.category, taken_by: newTopUser,
      });
    }
    await enqueueNotification(newTopUser, "legend_earned", { course_id: courseId, category: cfg.category });

    // Update legend_at_course tiered badge by count of #1s
    const { count } = await supabase
      .from("gam_course_legends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", newTopUser).eq("rank", 1).eq("is_current", true);
    const { data: badge } = await supabase
      .from("gam_badge_catalogue")
      .select("counter_tiers")
      .eq("id", "legend_at_course").maybeSingle();
    if (badge?.counter_tiers) {
      const tier = computeTier(count ?? 0, badge.counter_tiers);
      if (tier > 0) await upsertBadgeTiered(newTopUser, "legend_at_course", count ?? 0, tier, null);
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

    await enqueueNotification(userId, "rival_played", {
      rival_user_id: rival.user_id, course_id: stats.course_id, play_date: stats.play_date,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// enqueue_notification
// ─────────────────────────────────────────────────────────────────────────────
const URGENCY: Record<string, string> = {
  badge_earned: "low",
  legend_lost: "high",
  legend_earned: "medium",
  streak_at_risk: "high",
  streak_broken: "low",
  streak_freeze_applied: "medium",
  rival_played: "medium",
};

function dedupKey(type: string, userId: string, payload: any): string {
  switch (type) {
    case "badge_earned": return `badge_earned:${userId}:${payload.badge_id}`;
    case "legend_lost": return `legend_lost:${userId}:${payload.course_id}:${payload.category}`;
    case "legend_earned": return `legend_earned:${userId}:${payload.course_id}:${payload.category}`;
    case "streak_at_risk": return `streak_risk:${userId}:${payload.streak_type}`;
    case "streak_broken": return `streak_broken:${userId}:${payload.streak_type}:${new Date().toISOString().slice(0, 10)}`;
    case "rival_played": return `rival:${userId}:${payload.rival_user_id}:${payload.course_id}:${payload.play_date}`;
    case "streak_freeze_applied": return `streak_freeze:${userId}:${payload.streak_type}:${new Date().toISOString().slice(0, 10)}`;
    default: return `${type}:${userId}`;
  }
}

async function enqueueNotification(userId: string, type: string, payload: any) {
  try {
    await supabase.from("gam_notification_outbox").insert({
      user_id: userId,
      notification_type: type,
      template_id: type,
      template_payload: payload,
      trigger_whs_score_id: payload?.whs_score_id ?? null,
      deduplication_key: dedupKey(type, userId, payload),
      scheduled_for: new Date().toISOString(),
      urgency: URGENCY[type] ?? "low",
      status: "pending",
    });
  } catch (e) {
    console.warn("[enqueueNotification]", type, (e as Error).message);
  }
}
