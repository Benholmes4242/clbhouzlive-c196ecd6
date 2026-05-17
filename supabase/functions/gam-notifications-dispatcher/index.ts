// gam-notifications-dispatcher — drains gam_notification_outbox into push_notification_queue.
// Cron: every 1 minute. Applies quiet hours (21:00–07:00 local) and dedup bundling.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const BATCH = 500;
const MAX_TYPES_PER_CYCLE = 3;

type OutboxRow = {
  id: string;
  user_id: string;
  notification_type: string;
  template_id: string;
  template_payload: any;
  deduplication_key: string | null;
  urgency: string | null;
  scheduled_for: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const result = await runOnce();
    return json(result);
  } catch (e) {
    console.error("[dispatcher] fatal", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

async function runOnce() {
  const now = new Date();
  const { data: pending, error } = await supabase
    .from("gam_notification_outbox")
    .select("id,user_id,notification_type,template_id,template_payload,deduplication_key,urgency,scheduled_for")
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .order("urgency", { ascending: false })
    .order("scheduled_for", { ascending: true })
    .limit(BATCH);
  if (error) throw error;
  const rows = (pending ?? []) as OutboxRow[];

  let sent = 0, bundled = 0, deferred = 0;

  // Group by user
  const byUser = new Map<string, OutboxRow[]>();
  for (const r of rows) {
    const arr = byUser.get(r.user_id) ?? [];
    arr.push(r);
    byUser.set(r.user_id, arr);
  }

  // Pre-load badge catalogue for renders (cheap, small table)
  const { data: badgeCatalogue } = await supabase
    .from("gam_badge_catalogue").select("id,title,description");
  const badgeMap = new Map<string, any>((badgeCatalogue ?? []).map((b: any) => [b.id, b]));

  for (const [userId, userRows] of byUser) {
    // Dedup within user: newest wins per dedup_key
    const byDedup = new Map<string, OutboxRow>();
    const nodedup: OutboxRow[] = [];
    for (const r of userRows) {
      if (r.deduplication_key) {
        const ex = byDedup.get(r.deduplication_key);
        if (ex) {
          // Suppress older
          const older = new Date(r.scheduled_for) < new Date(ex.scheduled_for) ? r : ex;
          const newer = older === r ? ex : r;
          byDedup.set(r.deduplication_key, newer);
          await supabase
            .from("gam_notification_outbox")
            .update({ status: "bundled" })
            .eq("id", older.id);
          bundled++;
        } else {
          byDedup.set(r.deduplication_key, r);
        }
      } else nodedup.push(r);
    }
    const finalRows = [...byDedup.values(), ...nodedup];

    // Cap to MAX_TYPES_PER_CYCLE distinct types
    const seenTypes = new Set<string>();
    const chosen: OutboxRow[] = [];
    for (const r of finalRows) {
      if (seenTypes.size >= MAX_TYPES_PER_CYCLE && !seenTypes.has(r.notification_type)) continue;
      seenTypes.add(r.notification_type);
      chosen.push(r);
    }

    // Quiet hours
    const userTz = await getUserTimezone(userId);
    const inQuiet = inQuietHours(now, userTz);

    for (const r of chosen) {
      if (inQuiet && r.urgency !== "high") {
        const next = nextActiveWindow(now, userTz);
        await supabase
          .from("gam_notification_outbox")
          .update({ scheduled_for: next.toISOString() })
          .eq("id", r.id);
        deferred++;
        continue;
      }

      const rendered = renderPush(r, badgeMap);
      if (!rendered) {
        await supabase
          .from("gam_notification_outbox")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", r.id);
        continue;
      }

      const { error: pushErr } = await supabase.from("push_notification_queue").insert({
        user_id: userId,
        title: rendered.title,
        body: rendered.body,
        data: rendered.data,
      });
      if (pushErr) {
        console.warn("[dispatcher] push insert", pushErr.message);
        continue;
      }

      await supabase
        .from("gam_notification_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", r.id);
      sent++;
    }
  }

  const summary = { processed: rows.length, sent, bundled, deferred };
  console.log(JSON.stringify({ evt: "gam_dispatch", ...summary }));
  return summary;
}

async function getUserTimezone(userId: string): Promise<string> {
  const { data } = await supabase
    .from("user_profiles")
    .select("preferred_timezone")
    .eq("id", userId).maybeSingle();
  return (data as any)?.preferred_timezone ?? "Europe/London";
}

function localHour(now: Date, tz: string): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: tz });
    return parseInt(fmt.format(now), 10);
  } catch { return now.getUTCHours(); }
}

function inQuietHours(now: Date, tz: string): boolean {
  const h = localHour(now, tz);
  return h >= 21 || h < 7;
}

function nextActiveWindow(now: Date, tz: string): Date {
  const h = localHour(now, tz);
  const next = new Date(now);
  // shift to next 07:00 local. Approximation via UTC offset diff.
  const offsetMin = (() => {
    try {
      const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" });
      const parts = fmt.formatToParts(now);
      const off = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
      const m = /([+-])(\d{1,2})(?::?(\d{2}))?/.exec(off);
      if (!m) return 0;
      return (m[1] === "+" ? 1 : -1) * (parseInt(m[2], 10) * 60 + parseInt(m[3] ?? "0", 10));
    } catch { return 0; }
  })();
  if (h < 7) {
    next.setUTCHours(7 - Math.floor(offsetMin / 60), -(offsetMin % 60), 0, 0);
  } else {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(7 - Math.floor(offsetMin / 60), -(offsetMin % 60), 0, 0);
  }
  return next;
}

function renderPush(r: OutboxRow, badgeMap: Map<string, any>) {
  const p = r.template_payload ?? {};
  switch (r.notification_type) {
    case "badge_earned": {
      const b = badgeMap.get(p.badge_id);
      return {
        title: b ? `🏆 Badge unlocked: ${b.title}` : "🏆 New badge unlocked",
        body: b?.description ?? "Open the app to see what you've earned.",
        data: { route: "/handicap?sheet=achievements", badge_id: p.badge_id },
      };
    }
    case "legend_lost":
      return {
        title: `⚠️ Someone took your spot at the course`,
        body: `Your ${p.category} legend was beaten.`,
        data: { route: `/courses/${p.course_id}?tab=legends`, course_id: p.course_id },
      };
    case "legend_earned":
      return {
        title: `🏆 You're now a Course Legend`,
        body: `Top of the ${p.category} board.`,
        data: { route: `/courses/${p.course_id}?tab=legends`, course_id: p.course_id },
      };
    case "league_climbed":
      return {
        title: `⚔️ You climbed to #${p.to} in your pod`,
        body: `Up from #${p.from}.`,
        data: { route: "/handicap?sheet=league", pod_id: p.pod_id },
      };
    case "league_dropped":
      return {
        title: `🔻 You dropped to #${p.to} in your pod`,
        body: `Down from #${p.from}.`,
        data: { route: "/handicap?sheet=league", pod_id: p.pod_id },
      };
    case "streak_at_risk":
      return {
        title: `🔥 Your ${p.streak_type} streak is at risk`,
        body: "Play one round to keep it alive.",
        data: { route: "/handicap?sheet=streaks", streak_type: p.streak_type },
      };
    case "streak_broken":
      return {
        title: `Streak broken at ${p.count}`,
        body: `Start a new ${p.streak_type} streak today.`,
        data: { route: "/handicap?sheet=streaks", streak_type: p.streak_type },
      };
    case "streak_freeze_applied":
      return {
        title: `❄️ Streak Freeze used`,
        body: `Your ${p.streak_type} streak (${p.count}) is preserved.`,
        data: { route: "/handicap?sheet=streaks", streak_type: p.streak_type },
      };
    case "rival_played":
      return {
        title: `🎯 A rival just posted a round`,
        body: "See how you compare.",
        data: { route: `/handicap/rivalry/${p.rival_user_id}` },
      };
    case "season_promoted":
      return {
        title: `🎉 You've been promoted`,
        body: `Bracket ${p.bracket}, final rank #${p.rank}.`,
        data: { route: "/handicap?sheet=league" },
      };
    case "season_relegated":
      return {
        title: `📉 You've been relegated`,
        body: `Bracket ${p.bracket}, final rank #${p.rank}.`,
        data: { route: "/handicap?sheet=league" },
      };
    case "season_completed":
      return {
        title: `🏁 Season complete`,
        body: `Final rank #${p.rank} with ${p.points} pts.`,
        data: { route: "/handicap?sheet=league" },
      };
    default:
      return null;
  }
}
