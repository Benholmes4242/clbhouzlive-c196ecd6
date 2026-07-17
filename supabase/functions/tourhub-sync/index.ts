// supabase/functions/tourhub-sync/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
const ALLOWED_TOURS = ["pga", "lpga", "eur", "champions-tour"];

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

async function fetchScoreboard(tour: string) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/scoreboard`;
  const resp = await fetch(url, { headers: { "user-agent": "tourhub/1.0", "accept": "application/json" } });
  if (!resp.ok) throw new Error(`Scoreboard fetch failed for ${tour}: ${resp.status}`);
  return await resp.json();
}

async function fetchLeaderboard(tour: string): Promise<any | null> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/leaderboard`;
  const resp = await fetch(url, { headers: { "user-agent": "tourhub/1.0", "accept": "application/json" } });
  if (!resp.ok) {
    console.warn(`[tourhub-sync] Leaderboard fetch returned ${resp.status} for ${tour} (may be off-season)`);
    return null;
  }
  return await resp.json();
}

function pickStatus(raw: any): "upcoming" | "live" | "complete" {
  const state =
    raw?.status?.type?.state ||
    raw?.status?.type?.name ||
    raw?.status?.type?.id ||
    "";
  const s = String(state).toLowerCase();
  if (s.includes("in") || s.includes("live")) return "live";
  if (s.includes("post") || s.includes("final") || s.includes("complete")) return "complete";
  return "upcoming";
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional: ?tour=pga to sync single tour
    const url = new URL(req.url);
    const singleTour = url.searchParams.get("tour")?.trim();
    const tours = singleTour ? [singleTour] : ALLOWED_TOURS;

    console.log(`[tourhub-sync] Starting sync for tours: ${tours.join(", ")}`);

    const results: any[] = [];

    for (const tour of tours) {
      if (!ALLOWED_TOURS.includes(tour)) {
        results.push({ tour, ok: false, error: "Invalid tour" });
        continue;
      }

      try {
        // 1) Scoreboard -> upsert events
        console.log(`[tourhub-sync] Fetching scoreboard for ${tour}...`);
        const sbData = await fetchScoreboard(tour);
        const events = Array.isArray(sbData?.events) ? sbData.events : [];

        const upserts = events.map((e: any) => {
          const comp = e?.competitions?.[0] ?? {};
          const status = pickStatus(comp);
          const venue = comp?.venue ?? {};
          const addr = venue?.address ?? {};
          const loc = [addr?.city, addr?.state, addr?.country].filter(Boolean).join(", ");

          return {
            tour,
            espn_event_id: String(e?.id || comp?.id || "").trim(),
            name: String(e?.name || e?.shortName || "Event").trim(),
            status,
            start_date: comp?.startDate ? new Date(comp.startDate).toISOString().slice(0, 10) : null,
            end_date: comp?.endDate ? new Date(comp.endDate).toISOString().slice(0, 10) : null,
            course_name: venue?.fullName || venue?.name || null,
            location: loc || null,
            logo_url: e?.logo || e?.logos?.[0]?.href || null,
            event_url: e?.links?.[0]?.href || null,
            last_fetched_at: new Date().toISOString(),
          };
        }).filter((x: any) => x.espn_event_id);

        if (upserts.length) {
          console.log(`[tourhub-sync] Upserting ${upserts.length} events for ${tour}...`);
          const { error } = await sb
            .from("tourhub_events")
            .upsert(upserts, { onConflict: "tour,espn_event_id" });

          if (error) throw new Error(`Upsert events failed: ${error.message}`);
        }

        // 2) Leaderboard -> snapshot (store only "current-ish" events to keep size sane)
        console.log(`[tourhub-sync] Fetching leaderboard for ${tour}...`);
        const lbData = await fetchLeaderboard(tour);
        
        let snapshotsInserted = 0;
        
        if (lbData) {
          const lbEvents = Array.isArray(lbData?.events) ? lbData.events : [];

          // Snapshot only live + most recent complete + next upcoming
          const ranked = lbEvents.map((e: any) => {
            const comp = e?.competitions?.[0] ?? {};
            const status = pickStatus(comp);
            return { e, status };
          });

          const live = ranked.filter(x => x.status === "live");
          const complete = ranked.filter(x => x.status === "complete");
          const upcoming = ranked.filter(x => x.status === "upcoming");

          const take = [
            ...live.slice(0, 3),
            ...complete.slice(0, 1),
            ...upcoming.slice(0, 1),
          ];

          for (const item of take) {
            const e = item.e;
            const comp = e?.competitions?.[0] ?? {};
            const competitors = Array.isArray(comp?.competitors) ? comp.competitors : [];

            const leaders = competitors.map((c: any) => {
              const athlete = c?.athlete ?? {};
              const linescores = Array.isArray(c?.linescores) ? c.linescores : [];
              return {
                athleteId: String(athlete?.id || "").trim() || null,
                name: athlete?.displayName || athlete?.shortName || null,
                pos: c?.position?.displayName || c?.position?.pos || null,
                score: c?.score?.displayValue || c?.score?.value || null,
                headshotUrl: athlete?.headshot?.href || null,
                rounds: linescores.map((ls: any) => ls?.value || ls?.displayValue).filter(Boolean),
              };
            });

            const payload = {
              tour,
              espnEventId: String(e?.id || "").trim(),
              name: e?.name || e?.shortName || null,
              status: item.status,
              leaders,
              generatedAt: new Date().toISOString(),
            };

            const { error } = await sb.from("tourhub_leaderboard_snapshots").insert({
              tour,
              espn_event_id: payload.espnEventId,
              status: item.status,
              payload,
              fetched_at: new Date().toISOString(),
            });

            if (error) {
              console.error(`[tourhub-sync] Insert snapshot failed for ${tour}/${payload.espnEventId}: ${error.message}`);
            } else {
              snapshotsInserted++;
            }
          }
        } else {
          console.log(`[tourhub-sync] No leaderboard data available for ${tour} (off-season or no active events)`);
        }

        console.log(`[tourhub-sync] ${tour}: ${upserts.length} events upserted, ${snapshotsInserted} snapshots inserted`);
        results.push({ tour, ok: true, eventsUpserted: upserts.length, snapshotsInserted });
      } catch (tourErr) {
        console.error(`[tourhub-sync] Error processing ${tour}:`, tourErr);
        results.push({ tour, ok: false, error: String(tourErr) });
      }
    }

    console.log(`[tourhub-sync] Sync complete:`, results);
    return jsonResponse({ ok: true, results });
  } catch (err) {
    console.error(`[tourhub-sync] Fatal error:`, err);
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});
