// gam-refresh-streaks-weekly — Sunday 23:00 UTC.
// For each user with an active round_played streak, apply Streak Freeze (if credits)
// or break the streak. Refills freeze credits on the 1st of each month (cap 3).

import { createClient } from "npm:@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Two modes on the same handler:
  //   ?mode=at-risk  — Friday warning pass over the IN-FLIGHT week.
  //   default        — Sunday end-of-week apply-freeze / break pass.
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  if (mode === 'at-risk') {
    try {
      const result = await runAtRiskCheck();
      return json({ ok: true, ...result }, 200, corsHeaders);
    } catch (e) {
      console.error("[refresh-streaks-weekly:at-risk]", e);
      return json({ error: (e as Error).message }, 500, corsHeaders);
    }
  }
  try {
    // Week that just ended: ISO week starting on Monday containing (now - 1 day)
    const yesterday = new Date(Date.now() - 86400_000);
    const weekStart = isoWeekStart(yesterday);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

    const { data: active } = await supabase
      .from("gam_streaks")
      .select("*")
      .eq("streak_type", "round_played")
      .eq("is_active", true);

    let froze = 0, broken = 0, kept = 0;
    for (const s of active ?? []) {
      const { data: had } = await supabase
        .from("gam_round_stats")
        .select("whs_score_id")
        .eq("user_id", s.user_id)
        .eq("is_counter", true)
        .gte("play_date", weekStart.toISOString().slice(0, 10))
        .lt("play_date", weekEnd.toISOString().slice(0, 10))
        .limit(1);
      if (had && had.length > 0) { kept++; continue; }

      if ((s.freeze_credits ?? 0) > 0) {
        await supabase.from("gam_streaks").update({
          freeze_credits: (s.freeze_credits ?? 0) - 1,
          last_freeze_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("user_id", s.user_id).eq("streak_type", "round_played");
        await enqueue(s.user_id, "streak_freeze_applied", {
          streak_type: "round_played",
          count: s.current_count ?? 0,
        });
        froze++;
      } else {
        await supabase.from("gam_streaks").update({
          current_count: 0,
          is_active: false,
          best_ended_at: (s.current_count ?? 0) >= (s.best_count ?? 0) ? new Date().toISOString() : s.best_ended_at,
          updated_at: new Date().toISOString(),
        }).eq("user_id", s.user_id).eq("streak_type", "round_played");
        await enqueue(s.user_id, "streak_broken", {
          streak_type: "round_played",
          count: s.current_count ?? 0,
        });
        broken++;
      }
    }

    // Refill freeze credits on the 1st of the month
    const today = new Date();
    let refilled = 0;
    if (today.getUTCDate() === 1) {
      const { data: all } = await supabase
        .from("gam_streaks")
        .select("user_id, freeze_credits")
        .eq("streak_type", "round_played");
      for (const row of all ?? []) {
        const next = Math.min((row.freeze_credits ?? 0) + 1, 3);
        if (next !== row.freeze_credits) {
          await supabase.from("gam_streaks").update({
            freeze_credits: next,
            freeze_refill_at: nextMonthFirst().toISOString().slice(0, 10),
            updated_at: new Date().toISOString(),
          }).eq("user_id", row.user_id).eq("streak_type", "round_played");
          refilled++;
        }
      }
    }

    const summary = { kept, froze, broken, refilled };
    console.log(JSON.stringify({ evt: "gam_streaks_weekly", ...summary }));
    return json({ ok: true, ...summary });
  } catch (e) {
    console.error("[refresh-streaks-weekly]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    headers: { ...headers, "Content-Type": "application/json" },
    status,
  });
}

function isoWeekStart(d: Date): Date {
  const day = d.getUTCDay() || 7;
  const out = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  out.setUTCDate(out.getUTCDate() - (day - 1));
  return out;
}

function nextMonthFirst(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

async function enqueue(userId: string, type: string, payload: any) {
  // Upsert with ignoreDuplicates: the outbox dedup trigger already skips
  // repeats inside 24h, and a returned row is the exact "this event is new"
  // signal used to gate the Activity mirror below. One outbox row therefore
  // produces at most one notifications row, including across a retry.
  const { data: inserted, error } = await supabase
    .from("gam_notification_outbox")
    .upsert(
      {
        user_id: userId,
        notification_type: type,
        template_id: type,
        template_payload: payload,
        deduplication_key: `${type}:${userId}:${payload.streak_type}:${new Date().toISOString().slice(0, 10)}`,
        scheduled_for: new Date().toISOString(),
        urgency: type === "streak_freeze_applied" ? "medium" : "low",
        status: "pending",
      },
      { onConflict: "deduplication_key", ignoreDuplicates: true },
    )
    .select("id");
  if (error) {
    console.warn("[enqueue]", type, error.message);
    return;
  }
  if (Array.isArray(inserted) && inserted.length > 0) {
    await writeActivityRow(userId, type, payload);
  }
}

// ---------------------------------------------------------------------------
// Activity ledger mirror.
//
// gam_notification_outbox is a pure DELIVERY QUEUE, and the dispatcher applies
// push-only suppressions (quiet hours, type cap, dedup bundling, no-device) on
// the way out. The inbox must be COMPLETE, so the notifications row is written
// here at enqueue time - independent of any push decision. This is the same
// mirror gam-evaluator performs; copy MUST stay identical to activityCopy() in
// supabase/functions/gam-evaluator/index.ts, and the types below MUST stay in
// v_game_types (public.get_activity_feed) and GAME_NOTIF_TYPES
// (src/features/activity-v2/components/ledgerKinds.tsx).
// ---------------------------------------------------------------------------
function activityCopy(
  type: string,
  p: any,
): { title: string; message: string } | null {
  switch (type) {
    case "streak_freeze_applied":
      return {
        title: "Streak saved",
        message: `A freeze kept your ${p?.streak_type ?? "playing"} streak alive.`,
      };
    case "streak_broken":
      return {
        title: "Streak broken",
        message: `Your ${p?.streak_type ?? "playing"} streak ended at ${p?.count ?? 0}.`,
      };
    case "streak_at_risk":
      return {
        title: "Streak at risk",
        message: `Your ${p?.streak_type ?? "playing"} streak is about to break.`,
      };
    default:
      return null;
  }
}

async function writeActivityRow(userId: string, type: string, payload: any) {
  const copy = activityCopy(type, payload);
  if (!copy) return;
  try {
    // entity_type stays NULL: the feed's liveness CASE only resolves post /
    // comment / course_rating, and a wrong entity_type is silently filtered out.
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      recipient_actor_type: "personal",
      recipient_actor_id: userId,
      type,
      title: copy.title,
      message: copy.message,
      data: payload ?? {},
      entity_type: null,
      entity_id: null,
      actor_id: null,
    });
    if (error) console.warn("[writeActivityRow]", type, error.message);
  } catch (e) {
    console.warn("[writeActivityRow]", type, (e as Error).message);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// At-risk check — Friday warning pass over the CURRENT (in-flight) ISO week.
// For each active round_played streak with current_count >= 2 that has NOT yet
// logged a qualifying round this week, enqueue one streak_at_risk push. The
// dedupe key includes the current weekStart so a user gets at most one at-risk
// push per streak per week (repeat runs same week collapse; next week's Friday
// starts fresh).
//
// Users with freeze credits are STILL warned — a warned user who plays keeps
// the credit for a future week; a warned user who does nothing quietly burns a
// credit on Sunday. Warning is the better outcome either way.
// ─────────────────────────────────────────────────────────────────────────────
async function runAtRiskCheck() {
  const now = new Date();
  // Current ISO week (Mon 00:00 UTC .. next Mon 00:00 UTC).
  const weekStart = isoWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
  const weekStartISO = weekStart.toISOString().slice(0, 10);

  const { data: active } = await supabase
    .from("gam_streaks")
    .select("user_id, streak_type, current_count")
    .eq("streak_type", "round_played")
    .eq("is_active", true)
    .gte("current_count", 2);

  let warned = 0, safe = 0;
  for (const s of active ?? []) {
    const { data: had } = await supabase
      .from("gam_round_stats")
      .select("whs_score_id")
      .eq("user_id", s.user_id)
      .eq("is_counter", true)
      .gte("play_date", weekStartISO)
      .lt("play_date", weekEnd.toISOString().slice(0, 10))
      .limit(1);
    if (had && had.length > 0) { safe++; continue; }

    // Upsert with ignoreDuplicates so re-runs same week collapse. Key includes
    // weekStart to allow a fresh warning the following week.
    const dedupKey = `streak_risk:${s.user_id}:${s.streak_type}:${weekStartISO}`;
    const { error } = await supabase
      .from("gam_notification_outbox")
      .upsert(
        {
          user_id: s.user_id,
          notification_type: "streak_at_risk",
          template_id: "streak_at_risk",
          template_payload: {
            streak_type: s.streak_type,
            count: s.current_count ?? 0,
          },
          deduplication_key: dedupKey,
          scheduled_for: new Date().toISOString(),
          urgency: "high",
          status: "pending",
        },
        { onConflict: "deduplication_key", ignoreDuplicates: true },
      );
    if (error) {
      console.warn("[at-risk] upsert failed", s.user_id, error.message);
      continue;
    }
    warned++;
  }

  const summary = { active: (active ?? []).length, warned, safe, weekStart: weekStartISO };
  console.log(JSON.stringify({ evt: "gam_streaks_at_risk", ...summary }));
  return summary;
}
