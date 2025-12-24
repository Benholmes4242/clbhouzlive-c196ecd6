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

    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/leaderboard`;

    console.log(`[tourhub-leaderboard] Fetching ${tour} leaderboard for event ${eventId}...`);

    const resp = await fetch(espnUrl, {
      headers: {
        "user-agent": "tourhub/1.0",
        "accept": "application/json",
      },
    });

    if (!resp.ok) {
      console.error(`[tourhub-leaderboard] ESPN fetch failed: ${resp.status}`);
      return jsonResponse(
        { error: "ESPN fetch failed", status: resp.status },
        502,
        10
      );
    }

    const data = await resp.json();

    const events = Array.isArray(data?.events) ? data.events : [];
    const matchEvent = events.find((e: any) => String(e?.id) === eventId) || null;
    
    if (!matchEvent) {
      console.warn(`[tourhub-leaderboard] Event ${eventId} not found in feed`);
      return jsonResponse(
        {
          error: "Event not found in leaderboard feed",
          tour,
          eventId,
          availableEventIds: events.slice(0, 10).map((e: any) => e?.id),
        },
        404,
        10
      );
    }

    const competition = (matchEvent?.competitions?.[0]) ?? {};
    const status = pickStatus(competition);
    const competitors = Array.isArray(competition?.competitors)
      ? competition.competitors
      : [];

    const leaders = competitors.map((c: any) => {
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

    console.log(`[tourhub-leaderboard] Returning ${leaders.length} competitors for event ${eventId}`);

    // Cache: live shorter.
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
