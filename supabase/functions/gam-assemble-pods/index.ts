// gam-assemble-pods — Buckets EG-synced users by handicap and assigns them to pods of up to 30.
// Invoke: POST { season } (e.g. "2026-spring"). Service-role only.

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

const POD_CAPACITY = 30;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* ignore */ }
    const season: string | null = body?.season ?? null;

    let q = supabase.from("gam_leagues").select("*").eq("is_active", true);
    if (season) q = q.eq("season", season);
    const { data: leagues, error } = await q;
    if (error) throw error;
    if (!leagues || leagues.length === 0) return json({ error: "no_active_leagues" }, 404);

    const summary: any[] = [];
    for (const league of leagues) {
      // Eligible users
      let uq = supabase
        .from("user_profiles")
        .select("id, eg_handicap_index")
        .eq("eg_app_connected", true)
        .not("eg_handicap_index", "is", null)
        .lte("eg_handicap_index", league.hcp_max);
      if (league.hcp_min != null) uq = uq.gte("eg_handicap_index", league.hcp_min);
      const { data: eligible, error: eErr } = await uq;
      if (eErr) throw eErr;
      const shuffled = shuffle(eligible ?? []);
      const podCount = Math.max(1, Math.ceil(shuffled.length / POD_CAPACITY));

      for (let i = 0; i < podCount; i++) {
        // Upsert pod
        const { data: existingPod } = await supabase
          .from("gam_league_pods")
          .select("id")
          .eq("league_id", league.id).eq("pod_number", i + 1).maybeSingle();
        let podId = existingPod?.id;
        if (!podId) {
          const { data: newPod, error: pErr } = await supabase
            .from("gam_league_pods")
            .insert({ league_id: league.id, pod_number: i + 1, capacity: POD_CAPACITY })
            .select("id").single();
          if (pErr) throw pErr;
          podId = newPod.id;
        }

        const members = shuffled.slice(i * POD_CAPACITY, (i + 1) * POD_CAPACITY);
        for (const m of members) {
          await supabase.from("gam_league_members").upsert(
            {
              user_id: m.id,
              league_id: league.id,
              pod_id: podId,
              hcp_at_join: m.eg_handicap_index,
              current_points: 0,
              rounds_counted: 0,
            },
            { onConflict: "user_id,league_id" }
          );
        }
      }
      summary.push({ bracket: league.bracket, league_id: league.id, members: shuffled.length, pods: podCount });
      console.log(`[assemble-pods] ${league.bracket}: ${podCount} pods, ${shuffled.length} members`);
    }

    return json({ ok: true, summary });
  } catch (e) {
    console.error("[assemble-pods]", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}
