// gam-roll-leagues — runs daily. Snapshots ended leagues to gam_league_history,
// marks top 7 promoted / bottom (rank > 25) relegated, deactivates league, enqueues notifications.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

    const { data: ending, error } = await supabase
      .from("gam_leagues")
      .select("*")
      .eq("season_end", yesterday)
      .eq("is_active", true);
    if (error) throw error;
    if (!ending || ending.length === 0) return json({ ok: true, processed: 0 });

    let total = 0;
    for (const league of ending) {
      // Pull members with ranks
      const { data: members } = await supabase
        .from("gam_league_members")
        .select("user_id, league_id, pod_id, current_rank, current_points, rounds_counted")
        .eq("league_id", league.id);
      if (!members) continue;

      for (const m of members) {
        const rank = m.current_rank ?? 999;
        await supabase.from("gam_league_history").upsert(
          {
            user_id: m.user_id,
            league_id: m.league_id,
            pod_id: m.pod_id,
            final_rank: rank,
            final_points: m.current_points ?? 0,
            rounds_counted: m.rounds_counted ?? 0,
            promoted: rank <= 7,
            relegated: rank > 25,
          },
          { onConflict: "user_id,league_id" }
        );

        const notifType =
          rank <= 7 ? "season_promoted" : rank > 25 ? "season_relegated" : "season_completed";
        await supabase.from("gam_notification_outbox").insert({
          user_id: m.user_id,
          notification_type: notifType,
          template_id: notifType,
          template_payload: { bracket: league.bracket, rank, points: m.current_points ?? 0 },
          deduplication_key: `season:${m.user_id}:${league.id}`,
          scheduled_for: new Date().toISOString(),
          urgency: notifType === "season_promoted" ? "high" : "medium",
          status: "pending",
        });
        total++;
      }

      await supabase.from("gam_leagues").update({ is_active: false }).eq("id", league.id);
    }

    console.log(`[roll-leagues] processed ${ending.length} leagues, ${total} members`);
    return json({ ok: true, processed_leagues: ending.length, members: total });
  } catch (e) {
    console.error("[roll-leagues]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
