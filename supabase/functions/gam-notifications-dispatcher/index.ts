// gam-notifications-dispatcher — drains gam_notification_outbox into push_notification_queue.
// Cron: every 1 minute. Applies quiet hours (21:00–07:00 local) and dedup bundling.

import { createClient } from "npm:@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
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
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const result = await runOnce();
    return json(result, 200, corsHeaders);
  } catch (e) {
    console.error("[dispatcher] fatal", e);
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});

function json(body: any, status = 200, corsHeaders: Record<string, string> = {}) {
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

  // Device filter — do not enqueue for users without a subscribed device.
  // Bulk lookup, then any row for an unsubscribed user is marked sent so it
  // never retries and the queue insert is skipped. Stops the daily
  // "All included players are not subscribed" error rows at their source.
  const allUserIds = [...new Set(rows.map((r) => r.user_id))];
  const subscribed = new Set<string>();
  if (allUserIds.length > 0) {
    const { data: devices } = await supabase
      .from("user_push_devices")
      .select("user_id")
      .in("user_id", allUserIds)
      .eq("enabled", true);
    for (const d of devices ?? []) subscribed.add((d as any).user_id);
  }

  const unsubscribedRowIds = rows.filter((r) => !subscribed.has(r.user_id)).map((r) => r.id);
  if (unsubscribedRowIds.length > 0) {
    await supabase
      .from("gam_notification_outbox")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .in("id", unsubscribedRowIds);
  }

  const deliverableRows = rows.filter((r) => subscribed.has(r.user_id));

  // Group by user
  const byUser = new Map<string, OutboxRow[]>();
  for (const r of deliverableRows) {
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

      // Stamp `type` into the queue row's data so the push sender's
      // muted_types filter applies to gamification notifications too.
      const { error: pushErr } = await supabase.from("push_notification_queue").insert({
        user_id: userId,
        title: rendered.title,
        body: rendered.body,
        data: { ...rendered.data, type: r.notification_type },
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

const LEGEND_LABELS: Record<string, string> = {
  best_score_diff_90d: "Best Score (90-day)",
  best_score_diff_all_time: "Best Score (all-time)",
  lowest_gross_90d: "Lowest Gross (90-day)",
  lowest_gross_all_time: "Lowest Gross (all-time)",
  most_birdies_90d: "Most Birdies (90-day)",
  most_birdies_all_time: "Most Birdies (all-time)",
  best_stableford_90d: "Best Stableford (90-day)",
  best_stableford_all_time: "Best Stableford (all-time)",
  most_eagles_90d: "Most Eagles (90-day)",
  most_eagles_all_time: "Most Eagles (all-time)",
  most_aces_90d: "Most Aces (90-day)",
  most_aces_all_time: "Most Aces (all-time)",
  most_albatrosses_90d: "Most Albatrosses (90-day)",
  most_albatrosses_all_time: "Most Albatrosses (all-time)",
  most_rounds_90d: "Most Rounds (90-day)",
  most_rounds_all_time: "Most Rounds (all-time)",
};
const legendLabel = (c?: string) => (c && LEGEND_LABELS[c]) || "course record";

const STREAK_LABELS: Record<string, string> = {
  round_played: "playing",
  counter: "round",
};
// Returns "" for unknown so copy can degrade gracefully to "Your streak".
const streakLabel = (s?: string) => (s && STREAK_LABELS[s]) || "";

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
        title: p.course_name
          ? `⚠️ Someone took your spot at ${p.course_name}`
          : `⚠️ Someone took your course record`,
        body: `Your ${legendLabel(p.category)} record was beaten.`,
        data: { route: `/courses/${p.course_id}?tab=legends`, course_id: p.course_id },
      };
    case "legend_earned":
      return {
        title: `🏆 You're now a Course Legend`,
        body: p.course_name
          ? `Top of the ${legendLabel(p.category)} board at ${p.course_name}.`
          : `Top of the ${legendLabel(p.category)} board.`,
        data: { route: `/courses/${p.course_id}?tab=legends`, course_id: p.course_id },
      };
    case "streak_at_risk": {
      const s = streakLabel(p.streak_type);
      return {
        title: s ? `🔥 Your ${s} streak is at risk` : `🔥 Your streak is at risk`,
        body: "Play one round to keep it alive.",
        data: { route: "/handicap?sheet=streaks", streak_type: p.streak_type },
      };
    }
    case "streak_broken": {
      const s = streakLabel(p.streak_type);
      return {
        title: `Streak broken at ${p.count}`,
        body: s ? `Start a new ${s} streak today.` : `Start a new streak today.`,
        data: { route: "/handicap?sheet=streaks", streak_type: p.streak_type },
      };
    }
    case "streak_freeze_applied": {
      const s = streakLabel(p.streak_type);
      return {
        title: `❄️ Streak Freeze used`,
        body: s
          ? `Your ${s} streak (${p.count}) is preserved.`
          : `Your streak (${p.count}) is preserved.`,
        data: { route: "/handicap?sheet=streaks", streak_type: p.streak_type },
      };
    }
    case "rival_played":
      return {
        title: `🎯 A rival just posted a round`,
        body: "See how you compare.",
        data: { route: `/handicap/rivalry/${p.rival_user_id}` },
      };
    case "status_at_risk": {
      const b = badgeMap.get(p.badge_id);
      const name = b?.title ?? "Your status";
      return {
        title: `⚠️ ${name} at risk`,
        body: `You're at ${p.index}, cut-off ${p.cutoff}. Time to play.`,
        data: { route: "/handicap?sheet=achievements", badge_id: p.badge_id },
      };
    }
    case "status_reclaimed": {
      const b = badgeMap.get(p.badge_id);
      const name = b?.title ?? "Status";
      return {
        title: `🎉 ${name} reclaimed`,
        body: `Back to ${p.index}. Welcome back.`,
        data: { route: "/handicap?sheet=achievements", badge_id: p.badge_id },
      };
    }
    case "level_up":
      return {
        title: "Level up",
        body: `You reached ${p.label}. ${p.medals} medals and climbing.`,
        data: { route: "/handicap", level: p.level, label: p.label },
      };
    case "level_near": {
      const gap = typeof p.gap === "number" ? p.gap : 1;
      return {
        title: "Almost there",
        body: `${gap} medal${gap === 1 ? "" : "s"} from ${p.label}.`,
        data: { route: "/handicap", level: p.level, label: p.label },
      };
    }
    default:
      return null;
  }
}
