// supabase/functions/tourhub-resolver/index.ts
// Unified resolver: returns DB cached snapshot if available, otherwise calls ESPN/SlashGolf
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
function json(data: unknown, status = 200, cacheSeconds = 60) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${cacheSeconds}`,
    },
  });
}

function safeStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

type NormalizedLeader = {
  athleteId: string;
  name: string;
  country?: string | null;
  headshotUrl?: string | null;
  pos: string;
  score: string;
  today?: string | null;
  thru?: string | null;
  rounds?: string[];
};

type NormalizedResponse = {
  tour: string;
  espnEventId: string;
  year?: number | null;
  name: string | null;
  status: "upcoming" | "live" | "complete";
  generatedAt: string;
  leaders: NormalizedLeader[];
  message?: string;
  sourcesUsed: {
    cache?: "db";
    leaderboard?: "espn" | "slashgolf" | "none";
    rankings?: "slashgolf" | "none";
  };
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Helper: call other edge functions (same project)
async function callFn(path: string, query: Record<string, string>) {
  const url = new URL(`${supabaseUrl}/functions/v1/${path}`);
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  console.log(`[tourhub-resolver] Calling function: ${url.toString()}`);
  const resp = await fetch(url.toString(), {
    method: "GET",
    headers: { "content-type": "application/json" },
  });
  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

async function getEventFromDB(tour: string, espnEventId: string) {
  const { data, error } = await sb
    .from("tourhub_events")
    .select("id,tour,espn_event_id,name,status,start_date,end_date")
    .eq("tour", tour)
    .eq("espn_event_id", espnEventId)
    .maybeSingle();

  if (error) {
    console.error("[tourhub-resolver] Error fetching event from DB:", error);
    throw error;
  }
  return data;
}

async function getLatestSnapshotFromDB(tour: string, espnEventId: string) {
  const { data, error } = await sb
    .from("tourhub_leaderboard_latest")
    .select("espn_event_id,tour,status,payload,fetched_at")
    .eq("tour", tour)
    .eq("espn_event_id", espnEventId)
    .maybeSingle();

  if (error) {
    console.error("[tourhub-resolver] Error fetching snapshot from DB:", error);
    throw error;
  }
  
  // Extract leaders from payload
  if (data?.payload) {
    const payload = data.payload as Record<string, unknown>;
    return {
      ...data,
      name: payload.name as string | null,
      leaders: payload.leaders as unknown[] | null,
      generated_at: data.fetched_at,
    };
  }
  return data;
}

// Normalize leaders from various sources
function normalizeLeaders(leaders: unknown[]): NormalizedLeader[] {
  if (!Array.isArray(leaders)) return [];
  
  return leaders.map((l: Record<string, unknown>) => ({
    athleteId: safeStr(l.athleteId || l.athlete_id || l.playerId || ""),
    name: safeStr(l.name || l.playerName || l.player_name || "Unknown"),
    country: l.country ? safeStr(l.country) : null,
    headshotUrl: l.headshotUrl || l.headshot_url ? safeStr(l.headshotUrl || l.headshot_url) : null,
    pos: safeStr(l.pos || l.position || "-"),
    score: safeStr(l.score || "-"),
    today: l.today ? safeStr(l.today) : null,
    thru: l.thru ? safeStr(l.thru) : null,
    rounds: Array.isArray(l.rounds) ? l.rounds.map(safeStr) : undefined,
  }));
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let tour = (url.searchParams.get("tour") || "").trim();
    let eventId = (url.searchParams.get("event") || "").trim();

    // Also support POST/JSON body for supabase.functions.invoke
    // Body shape: { tour: "pga", event: "401..." }
    if (!eventId) {
      try {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
          tour = safeStr(body.tour || body.tourId || tour).trim();
          eventId = safeStr(body.event || body.espnEventId || body.espn_event_id || "").trim();
        }
      } catch (_err) {
        // ignore
      }
    }

    if (!tour) tour = "pga";

    console.log(`[tourhub-resolver] Request: tour=${tour}, event=${eventId}`);

    if (!eventId) {
      return json({ error: "Missing event param" }, 400, 5);
    }

    // 1) Get event from DB (source of truth for status/name)
    const ev = await getEventFromDB(tour, eventId);
    if (!ev) {
      console.log(`[tourhub-resolver] Event not found in DB: ${tour}/${eventId}`);
      const resp: NormalizedResponse = {
        tour,
        espnEventId: eventId,
        year: null,
        name: null,
        status: "upcoming",
        generatedAt: new Date().toISOString(),
        leaders: [],
        message: "Event not found in Tour Hub database.",
        sourcesUsed: { leaderboard: "none", rankings: "none" },
      };
      return json(resp, 404, 30);
    }

    const status: "upcoming" | "live" | "complete" =
      ev.status === "live" ? "live" : ev.status === "complete" ? "complete" : "upcoming";

    console.log(`[tourhub-resolver] Event found: ${ev.name}, status=${status}`);

    // 2) Try DB latest snapshot first (fast)
    const cached = await getLatestSnapshotFromDB(tour, eventId);
    if (cached?.leaders && Array.isArray(cached.leaders) && cached.leaders.length > 0) {
      console.log(`[tourhub-resolver] Using cached snapshot with ${cached.leaders.length} leaders`);
      const resp: NormalizedResponse = {
        tour,
        espnEventId: eventId,
        year: ev.start_date ? new Date(ev.start_date).getUTCFullYear() : null,
        name: safeStr(cached.name) || safeStr(ev.name) || null,
        status,
        generatedAt: new Date().toISOString(),
        leaders: normalizeLeaders(cached.leaders as unknown[]),
        sourcesUsed: { cache: "db", leaderboard: "espn", rankings: "none" },
      };
      // Short cache for live
      return json(resp, 200, status === "live" ? 15 : 60);
    }

    // 3) No cached leaders → route by status
    // Live: ESPN first, fallback to SlashGolf
    if (status === "live") {
      console.log(`[tourhub-resolver] Live event - calling ESPN`);
      const espn = await callFn("tourhub-leaderboard", { tour, event: eventId });
      if (espn.ok && Array.isArray(espn.data?.leaders)) {
        console.log(`[tourhub-resolver] ESPN returned ${espn.data.leaders.length} leaders`);
        const resp: NormalizedResponse = {
          tour,
          espnEventId: eventId,
          year: ev.start_date ? new Date(ev.start_date).getUTCFullYear() : null,
          name: safeStr(espn.data?.name) || safeStr(ev.name) || null,
          status: espn.data?.status || status,
          generatedAt: new Date().toISOString(),
          leaders: normalizeLeaders(espn.data.leaders),
          sourcesUsed: { leaderboard: "espn", rankings: "none" },
        };
        return json(resp, 200, 15);
      }

      // fallback SlashGolf if mapped
      const year = ev.start_date ? new Date(ev.start_date).getUTCFullYear() : new Date().getUTCFullYear();
      const { data: mapRow } = await sb
        .from("tourhub_event_mappings")
        .select("slashgolf_tourn_id")
        .eq("tour", tour)
        .eq("year", year)
        .eq("espn_event_id", eventId)
        .maybeSingle();

      if (mapRow?.slashgolf_tourn_id) {
        console.log(`[tourhub-resolver] Trying SlashGolf fallback: ${mapRow.slashgolf_tourn_id}`);
        const sg = await callFn("tourhub-slashgolf", {
          action: "leaderboard",
          tournId: mapRow.slashgolf_tourn_id,
          year: String(year),
        });

        const leaders = sg.data?.data?.leaderboard || sg.data?.leaders || [];
        if (sg.ok && Array.isArray(leaders) && leaders.length > 0) {
          console.log(`[tourhub-resolver] SlashGolf returned ${leaders.length} leaders`);
          const resp: NormalizedResponse = {
            tour,
            espnEventId: eventId,
            year,
            name: safeStr(ev.name) || null,
            status,
            generatedAt: new Date().toISOString(),
            leaders: normalizeLeaders(leaders),
            sourcesUsed: { leaderboard: "slashgolf", rankings: "none" },
          };
          return json(resp, 200, 15);
        }
      }

      // no data
      console.log(`[tourhub-resolver] No leaderboard data available for live event`);
      return json(
        {
          tour,
          espnEventId: eventId,
          year,
          name: safeStr(ev.name) || null,
          status,
          generatedAt: new Date().toISOString(),
          leaders: [],
          message: "Leaderboard not available yet.",
          sourcesUsed: { leaderboard: "none", rankings: "none" },
        } satisfies NormalizedResponse,
        200,
        30
      );
    }

    // Complete (historical): SlashGolf first (if mapped), else ESPN fallback
    if (status === "complete") {
      const year = ev.start_date ? new Date(ev.start_date).getUTCFullYear() : new Date().getUTCFullYear();

      const { data: mapRow } = await sb
        .from("tourhub_event_mappings")
        .select("slashgolf_tourn_id")
        .eq("tour", tour)
        .eq("year", year)
        .eq("espn_event_id", eventId)
        .maybeSingle();

      if (mapRow?.slashgolf_tourn_id) {
        console.log(`[tourhub-resolver] Complete event - trying SlashGolf: ${mapRow.slashgolf_tourn_id}`);
        const sg = await callFn("tourhub-slashgolf", {
          action: "leaderboard",
          tournId: mapRow.slashgolf_tourn_id,
          year: String(year),
        });

        const leaders = sg.data?.data?.leaderboard || sg.data?.leaders || [];
        if (sg.ok && Array.isArray(leaders) && leaders.length > 0) {
          console.log(`[tourhub-resolver] SlashGolf returned ${leaders.length} leaders for complete event`);
          return json(
            {
              tour,
              espnEventId: eventId,
              year,
              name: safeStr(ev.name) || null,
              status,
              generatedAt: new Date().toISOString(),
              leaders: normalizeLeaders(leaders),
              sourcesUsed: { leaderboard: "slashgolf", rankings: "none" },
            } satisfies NormalizedResponse,
            200,
            300
          );
        }
      }

      console.log(`[tourhub-resolver] Complete event - falling back to ESPN`);
      const espn = await callFn("tourhub-leaderboard", { tour, event: eventId });
      if (espn.ok && Array.isArray(espn.data?.leaders) && espn.data.leaders.length > 0) {
        console.log(`[tourhub-resolver] ESPN returned ${espn.data.leaders.length} leaders for complete event`);
        return json(
          {
            tour,
            espnEventId: eventId,
            year,
            name: safeStr(espn.data?.name) || safeStr(ev.name) || null,
            status: espn.data?.status || status,
            generatedAt: new Date().toISOString(),
            leaders: normalizeLeaders(espn.data.leaders),
            sourcesUsed: { leaderboard: "espn", rankings: "none" },
          } satisfies NormalizedResponse,
          200,
          300
        );
      }

      console.log(`[tourhub-resolver] No leaderboard data available for complete event`);
      return json(
        {
          tour,
          espnEventId: eventId,
          year,
          name: safeStr(ev.name) || null,
          status,
          generatedAt: new Date().toISOString(),
          leaders: [],
          message: "Historical results are syncing.",
          sourcesUsed: { leaderboard: "none", rankings: "none" },
        } satisfies NormalizedResponse,
        200,
        120
      );
    }

    // Upcoming
    console.log(`[tourhub-resolver] Upcoming event - no leaderboard yet`);
    return json(
      {
        tour,
        espnEventId: eventId,
        year: ev.start_date ? new Date(ev.start_date).getUTCFullYear() : null,
        name: safeStr(ev.name) || null,
        status,
        generatedAt: new Date().toISOString(),
        leaders: [],
        message: "Leaderboard will appear when play begins.",
        sourcesUsed: { leaderboard: "none", rankings: "none" },
      } satisfies NormalizedResponse,
      200,
      120
    );
  } catch (err) {
    console.error("[tourhub-resolver] error", err);
    return json({ error: "Unexpected error", details: String(err) }, 500, 5);
  }
});
