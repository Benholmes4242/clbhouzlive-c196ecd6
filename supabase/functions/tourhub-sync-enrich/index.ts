// supabase/functions/tourhub-sync-enrich/index.ts
// Daily job: backfill historical leaderboards from SlashGolf + fetch rankings
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Helper: call other edge functions
async function callFn(path: string, query: Record<string, string>) {
  const url = new URL(`${supabaseUrl}/functions/v1/${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  console.log(`[sync-enrich] Calling: ${url.toString()}`);
  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: { "content-type": "application/json" },
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[sync-enrich] Starting daily enrichment job");
  
  const results = {
    eventsProcessed: 0,
    snapshotsCreated: 0,
    enrichmentsCreated: 0,
    rankingsFetched: false,
    errors: [] as string[],
  };

  try {
    // 1) Find recently completed events (last 30 days) that might need enrichment
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: completedEvents, error: eventsError } = await sb
      .from("tourhub_events")
      .select("id, tour, espn_event_id, name, start_date, end_date, status")
      .eq("status", "complete")
      .gte("end_date", thirtyDaysAgo.toISOString())
      .order("end_date", { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error("[sync-enrich] Error fetching events:", eventsError);
      results.errors.push(`Events fetch error: ${eventsError.message}`);
    }

    console.log(`[sync-enrich] Found ${completedEvents?.length || 0} recently completed events`);

    // 2) Process each event
    for (const event of completedEvents || []) {
      results.eventsProcessed++;
      const year = new Date(event.start_date).getUTCFullYear();

      try {
        // Check if we have a SlashGolf mapping
        const { data: mapping } = await sb
          .from("tourhub_event_mappings")
          .select("slashgolf_tourn_id")
          .eq("tour", event.tour)
          .eq("year", year)
          .eq("espn_event_id", event.espn_event_id)
          .maybeSingle();

        if (!mapping?.slashgolf_tourn_id) {
          console.log(`[sync-enrich] No SlashGolf mapping for ${event.name}`);
          continue;
        }

        // Check if we already have a SlashGolf snapshot
        const { data: existingSnapshot } = await sb
          .from("tourhub_leaderboard_snapshots")
          .select("id")
          .eq("tour", event.tour)
          .eq("espn_event_id", event.espn_event_id)
          .eq("provider", "slashgolf")
          .maybeSingle();

        if (existingSnapshot) {
          console.log(`[sync-enrich] SlashGolf snapshot already exists for ${event.name}`);
          continue;
        }

        // Fetch full tournament data from SlashGolf
        console.log(`[sync-enrich] Fetching SlashGolf data for ${event.name}`);
        const sgFull = await callFn("tourhub-slashgolf", {
          action: "tournament-full",
          tournId: mapping.slashgolf_tourn_id,
          year: String(year),
        });

        if (!sgFull.ok || !sgFull.data?.data) {
          console.log(`[sync-enrich] SlashGolf fetch failed for ${event.name}`);
          continue;
        }

        const sgData = sgFull.data.data;

        // Store leaderboard snapshot
        if (sgData.leaderboard?.leaderboard && Array.isArray(sgData.leaderboard.leaderboard)) {
          const leaders = sgData.leaderboard.leaderboard.map((l: Record<string, unknown>) => ({
            athleteId: String(l.player_id || ""),
            name: String(l.first_name || "") + " " + String(l.last_name || ""),
            pos: String(l.position || "-"),
            score: String(l.total_to_par || l.total || "-"),
            today: l.today ? String(l.today) : null,
            thru: l.thru ? String(l.thru) : null,
            country: l.country ? String(l.country) : null,
          }));

          const { error: snapshotError } = await sb
            .from("tourhub_leaderboard_snapshots")
            .insert({
              tour: event.tour,
              espn_event_id: event.espn_event_id,
              fetched_at: new Date().toISOString(),
              round: null,
              status: "complete",
              payload: { leaders, name: event.name },
              provider: "slashgolf",
            });

          if (snapshotError) {
            console.error(`[sync-enrich] Snapshot insert error:`, snapshotError);
            results.errors.push(`Snapshot error for ${event.name}: ${snapshotError.message}`);
          } else {
            console.log(`[sync-enrich] Created SlashGolf snapshot for ${event.name}`);
            results.snapshotsCreated++;
          }
        }

        // Store enrichment data (earnings, points)
        const enrichmentData: Record<string, unknown> = {};
        if (sgData.earnings) enrichmentData.earnings = sgData.earnings;
        if (sgData.points) enrichmentData.points = sgData.points;
        if (sgData.tournament) enrichmentData.tournament = sgData.tournament;

        if (Object.keys(enrichmentData).length > 0) {
          const { error: enrichError } = await sb
            .from("tourhub_event_enrichment")
            .upsert({
              tour: event.tour,
              espn_event_id: event.espn_event_id,
              year,
              provider: "slashgolf",
              data: enrichmentData,
            }, {
              onConflict: "tour,year,espn_event_id,provider",
            });

          if (enrichError) {
            console.error(`[sync-enrich] Enrichment insert error:`, enrichError);
            results.errors.push(`Enrichment error for ${event.name}: ${enrichError.message}`);
          } else {
            console.log(`[sync-enrich] Created enrichment for ${event.name}`);
            results.enrichmentsCreated++;
          }
        }

      } catch (eventErr) {
        console.error(`[sync-enrich] Error processing ${event.name}:`, eventErr);
        results.errors.push(`Event ${event.name}: ${String(eventErr)}`);
      }
    }

    // 3) Fetch latest world rankings (store in enrichment table with special key)
    try {
      console.log("[sync-enrich] Fetching world rankings");
      const rankings = await callFn("tourhub-slashgolf", {
        action: "rankings",
        year: String(new Date().getUTCFullYear()),
      });

      if (rankings.ok && rankings.data?.data) {
        const { error: rankingsError } = await sb
          .from("tourhub_event_enrichment")
          .upsert({
            tour: "world",
            espn_event_id: "rankings",
            year: new Date().getUTCFullYear(),
            provider: "slashgolf",
            data: rankings.data.data,
          }, {
            onConflict: "tour,year,espn_event_id,provider",
          });

        if (rankingsError) {
          console.error("[sync-enrich] Rankings insert error:", rankingsError);
          results.errors.push(`Rankings error: ${rankingsError.message}`);
        } else {
          console.log("[sync-enrich] Updated world rankings");
          results.rankingsFetched = true;
        }
      }
    } catch (rankErr) {
      console.error("[sync-enrich] Rankings fetch error:", rankErr);
      results.errors.push(`Rankings: ${String(rankErr)}`);
    }

    console.log("[sync-enrich] Job complete:", results);
    return json({
      success: true,
      ...results,
    });

  } catch (err) {
    console.error("[sync-enrich] Fatal error:", err);
    return json({ error: "Unexpected error", details: String(err), ...results }, 500);
  }
});
