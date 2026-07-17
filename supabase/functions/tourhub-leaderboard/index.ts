// supabase/functions/tourhub-leaderboard/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsFor } from '../_shared/cors.ts';
const ALLOWED_TOURS = new Set(["pga", "lpga", "eur", "champions-tour"]);

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

    // Today field varies by tour - try multiple paths
    const today = safeStr(c?.todaysScore?.displayValue) 
      || safeStr(c?.todayScore?.displayValue)
      || safeStr(c?.today?.displayValue)
      || safeStr(c?.statistics?.find?.((s: any) => s?.name === "today")?.displayValue)
      || null;

    return {
      athleteId: safeStr(athlete?.id),
      name: safeStr(athlete?.displayName) || safeStr(athlete?.shortName),
      country: safeStr(athlete?.flag?.alt) || safeStr(athlete?.country?.abbr),
      headshotUrl: safeStr(athlete?.headshot?.href),
      pos: safeStr(c?.position?.displayName) || safeStr(c?.position?.pos),
      score: safeStr(c?.score?.displayValue) || safeStr(c?.score?.value),
      today,
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
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Support both GET query params and POST body
    let tour = url.searchParams.get("tour") || "";
    let eventId = url.searchParams.get("event") || "";
    
    // If params not in URL, try POST body
    if ((!tour || !eventId) && req.method === "POST") {
      try {
        const body = await req.json();
        if (!tour && body.tour) tour = String(body.tour);
        if (!eventId && body.event) eventId = String(body.event);
      } catch {
        // Ignore JSON parse errors
      }
    }
    
    // Normalize
    tour = (tour || "pga").trim();
    eventId = eventId.trim();

    console.log(`[tourhub-leaderboard] Request: tour=${tour}, eventId=${eventId}, method=${req.method}`);

    if (!ALLOWED_TOURS.has(tour)) {
      return jsonResponse({ error: "Invalid tour", tour }, 400, 5);
    }
    if (!eventId) {
      return jsonResponse({ error: "Missing event param" }, 400, 5);
    }

    // Step 1: Validate event exists via scoreboard
    const scoreboardUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/scoreboard`;
    console.log(`[tourhub-leaderboard] Validating event ${eventId} exists via scoreboard...`);
    
    const scoreboardResult = await tryFetch(scoreboardUrl);
    let eventExists = false;
    let eventName: string | null = null;
    let eventStatus: "upcoming" | "live" | "complete" = "upcoming";

    if (scoreboardResult.ok && scoreboardResult.data) {
      const sbEvents = Array.isArray(scoreboardResult.data?.events) ? scoreboardResult.data.events : [];
      const sbMatch = sbEvents.find((e: any) => String(e?.id) === eventId);
      if (sbMatch) {
        eventExists = true;
        eventName = safeStr(sbMatch?.name) || safeStr(sbMatch?.shortName);
        const comp = sbMatch?.competitions?.[0] ?? {};
        eventStatus = pickStatus(comp);
        console.log(`[tourhub-leaderboard] Event ${eventId} found in scoreboard: ${eventName}`);
      }
    }

    // If event doesn't exist in scoreboard, return 404
    if (!eventExists) {
      console.warn(`[tourhub-leaderboard] Event ${eventId} not found in scoreboard - invalid event ID`);
      return jsonResponse(
        {
          error: "Event not found",
          tour,
          eventId,
          message: "Invalid event ID - event does not exist.",
        },
        404,
        60
      );
    }

    // Step 2: Try to get leaderboard data
    let matchEvent: any = null;
    let fetchSource = "";

    // Strategy 1: Try event-specific leaderboard endpoint
    const eventSpecificUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/leaderboard?event=${eventId}`;
    console.log(`[tourhub-leaderboard] Strategy 1: Trying event-specific leaderboard...`);
    
    const eventSpecificResult = await tryFetch(eventSpecificUrl);
    if (eventSpecificResult.ok && eventSpecificResult.data) {
      const events = Array.isArray(eventSpecificResult.data?.events) ? eventSpecificResult.data.events : [];
      matchEvent = events.find((e: any) => String(e?.id) === eventId) || events[0] || null;
      if (matchEvent) {
        fetchSource = "event-specific";
        console.log(`[tourhub-leaderboard] Strategy 1 succeeded`);
      }
    }

    // Strategy 2: Fall back to generic leaderboard
    if (!matchEvent) {
      const genericUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/leaderboard`;
      console.log(`[tourhub-leaderboard] Strategy 2: Trying generic leaderboard...`);
      
      const genericResult = await tryFetch(genericUrl);
      if (genericResult.ok && genericResult.data) {
        const events = Array.isArray(genericResult.data?.events) ? genericResult.data.events : [];
        matchEvent = events.find((e: any) => String(e?.id) === eventId) || null;
        if (matchEvent) {
          fetchSource = "generic-feed";
          console.log(`[tourhub-leaderboard] Strategy 2 succeeded`);
        }
      }
    }

    // Strategy 3: Event exists but no leaderboard data available yet → 200 with empty leaders
    if (!matchEvent) {
      console.log(`[tourhub-leaderboard] Event ${eventId} exists but no leaderboard data yet - returning 200 with empty leaders`);
      return jsonResponse(
        {
          tour,
          espnEventId: eventId,
          generatedAt: new Date().toISOString(),
          status: eventStatus,
          name: eventName,
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
        name: safeStr(matchEvent?.name) || safeStr(matchEvent?.shortName) || eventName,
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
