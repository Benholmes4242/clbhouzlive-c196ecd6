// supabase/functions/tourhub-leaderboard/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_TOURS = new Set(["pga", "lpga", "eur", "champions-tour"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200, cacheSeconds = 60) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, s-maxage=${cacheSeconds}, max-age=${cacheSeconds}`,
    },
  });
}

function safeStr(v: any): string | null {
  const s = String(v ?? "").trim();
  return s ? s : null;
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

function parseLeaders(competitors: any[]): any[] {
  return competitors.map((c: any) => {
    const athlete = c?.athlete ?? {};
    const linescores = Array.isArray(c?.linescores) ? c.linescores : [];

    return {
      athleteId: safeStr(athlete?.id),
      name: safeStr(athlete?.displayName) || safeStr(athlete?.shortName),
      country: safeStr(athlete?.flag?.alt) || safeStr(athlete?.country?.abbr),
      headshotUrl: safeStr(athlete?.headshot?.href),
      pos: safeStr(c?.position?.displayName) || safeStr(c?.position?.pos),
      score: safeStr(c?.score?.displayValue) || safeStr(c?.score?.value),
      today: safeStr(c?.todaysScore?.displayValue) || null,
      thru: safeStr(c?.status?.period) || safeStr(c?.status?.displayValue) || safeStr(c?.status?.detail),
      rounds: linescores.map((ls: any) => safeStr(ls?.value || ls?.displayValue)).filter(Boolean),
    };
  });
}

async function tryFetch(url: string): Promise<{ ok: boolean; data?: any; status?: number }> {
  try {
    const resp = await fetch(url, {
      headers: {
        "user-agent": "tourhub/1.0",
        "accept": "application/json",
      },
    });
    if (!resp.ok) {
      return { ok: false, status: resp.status };
    }
    const data = await resp.json();
    return { ok: true, data };
  } catch (err) {
    console.error(`[tourhub-leaderboard] Fetch error for ${url}:`, err);
    return { ok: false };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tour = (url.searchParams.get("tour") || "pga").trim();
    const eventId = (url.searchParams.get("event") || "").trim();

    if (!ALLOWED_TOURS.has(tour)) {
      return jsonResponse({ error: "Invalid tour", tour }, 400, 5);
    }
    if (!eventId) {
      return jsonResponse({ error: "Missing event param" }, 400, 5);
    }

    let matchEvent: any = null;
    let fetchSource = "";

    // Strategy 1: Try event-specific leaderboard endpoint
    const eventSpecificUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/leaderboard?event=${eventId}`;
    console.log(`[tourhub-leaderboard] Strategy 1: Trying event-specific URL for ${tour}/${eventId}...`);
    
    const eventSpecificResult = await tryFetch(eventSpecificUrl);
    if (eventSpecificResult.ok && eventSpecificResult.data) {
      const events = Array.isArray(eventSpecificResult.data?.events) ? eventSpecificResult.data.events : [];
      matchEvent = events.find((e: any) => String(e?.id) === eventId) || events[0] || null;
      if (matchEvent) {
        fetchSource = "event-specific";
        console.log(`[tourhub-leaderboard] Strategy 1 succeeded`);
      }
    }

    // Strategy 2: Fall back to generic leaderboard and find the event
    if (!matchEvent) {
      const genericUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/leaderboard`;
      console.log(`[tourhub-leaderboard] Strategy 2: Trying generic leaderboard for ${tour}...`);
      
      const genericResult = await tryFetch(genericUrl);
      if (genericResult.ok && genericResult.data) {
        const events = Array.isArray(genericResult.data?.events) ? genericResult.data.events : [];
        matchEvent = events.find((e: any) => String(e?.id) === eventId) || null;
        if (matchEvent) {
          fetchSource = "generic-feed";
          console.log(`[tourhub-leaderboard] Strategy 2 succeeded`);
        } else {
          console.log(`[tourhub-leaderboard] Event ${eventId} not found in generic feed (${events.length} events available)`);
        }
      } else {
        console.log(`[tourhub-leaderboard] Generic leaderboard fetch failed or returned no data`);
      }
    }

    // Strategy 3: No leaderboard data available - return 200 with empty leaders
    if (!matchEvent) {
      console.log(`[tourhub-leaderboard] No leaderboard data available for ${tour}/${eventId} - returning empty response`);
      return jsonResponse(
        {
          tour,
          espnEventId: eventId,
          generatedAt: new Date().toISOString(),
          status: "upcoming",
          name: null,
          leaders: [],
          message: "Leaderboard not available yet.",
        },
        200,
        120 // Cache for 2 minutes when no data
      );
    }

    // Parse the matched event
    const competition = (matchEvent?.competitions?.[0]) ?? {};
    const status = pickStatus(competition);
    const competitors = Array.isArray(competition?.competitors)
      ? competition.competitors
      : [];

    const leaders = parseLeaders(competitors);

    console.log(`[tourhub-leaderboard] Returning ${leaders.length} competitors for ${tour}/${eventId} (source: ${fetchSource})`);

    // Cache: live shorter
    const cacheSeconds = status === "live" ? 30 : 300;

    return jsonResponse(
      {
        tour,
        espnEventId: eventId,
        generatedAt: new Date().toISOString(),
        status,
        name: safeStr(matchEvent?.name) || safeStr(matchEvent?.shortName),
        leaders,
      },
      200,
      cacheSeconds
    );
  } catch (err) {
    console.error(`[tourhub-leaderboard] Error:`, err);
    return jsonResponse({ error: "Unexpected error", details: String(err) }, 500, 5);
  }
});
