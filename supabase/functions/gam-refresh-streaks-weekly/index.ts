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

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
  await supabase.from("gam_notification_outbox").insert({
    user_id: userId,
    notification_type: type,
    template_id: type,
    template_payload: payload,
    deduplication_key: `${type}:${userId}:${payload.streak_type}:${new Date().toISOString().slice(0, 10)}`,
    scheduled_for: new Date().toISOString(),
    urgency: type === "streak_freeze_applied" ? "medium" : "low",
    status: "pending",
  });
}
