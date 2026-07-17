// supabase/functions/tourhub-slashgolf/index.ts
// Fetches comprehensive golf data from Slash Golf API (via RapidAPI)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsFor } from '../_shared/cors.ts';
const RAPIDAPI_HOST = "golf-leaderboard-data.p.rapidapi.com";
const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_GOLF_KEY") || "";

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

async function fetchFromSlashGolf(endpoint: string, params: Record<string, string> = {}): Promise<{ ok: boolean; data?: any; error?: string }> {
  if (!RAPIDAPI_KEY) {
    console.error("[slashgolf] RAPIDAPI_GOLF_KEY not configured");
    return { ok: false, error: "API key not configured" };
  }

  const url = new URL(`https://${RAPIDAPI_HOST}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  console.log(`[slashgolf] Fetching: ${url.toString()}`);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[slashgolf] API error ${response.status}: ${errorText}`);
      return { ok: false, error: `API returned ${response.status}` };
    }

    const data = await response.json();
    console.log(`[slashgolf] Success for ${endpoint}`);
    return { ok: true, data };
  } catch (err) {
    console.error(`[slashgolf] Fetch error:`, err);
    return { ok: false, error: String(err) };
  }
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "schedule";
    const orgId = url.searchParams.get("orgId") || "1"; // 1 = PGA Tour
    const year = url.searchParams.get("year") || new Date().getFullYear().toString();
    const tournId = url.searchParams.get("tournId") || "";
    const playerId = url.searchParams.get("playerId") || "";
    const roundId = url.searchParams.get("roundId") || "";
    const statId = url.searchParams.get("statId") || "";

    console.log(`[slashgolf] Request: action=${action}, orgId=${orgId}, year=${year}, tournId=${tournId}`);

    let result: { ok: boolean; data?: any; error?: string };
    let cacheSeconds = 300;

    switch (action) {
      // ==================== SCHEDULES ====================
      case "schedule":
      case "schedules":
        // Get full season schedule
        result = await fetchFromSlashGolf("/schedules", { orgId, year });
        cacheSeconds = 3600; // Cache for 1 hour
        break;

      // ==================== LEADERBOARD ====================
      case "leaderboard":
      case "leaderboards":
        if (!tournId) {
          return jsonResponse({ error: "tournId required for leaderboard" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/leaderboards", { 
          orgId, 
          tournId, 
          year,
          ...(roundId && { roundId })
        });
        cacheSeconds = 60; // Cache for 1 minute during live events
        break;

      // ==================== TOURNAMENT DETAILS ====================
      case "tournament":
      case "tournaments":
        if (!tournId) {
          return jsonResponse({ error: "tournId required for tournament details" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/tournaments", { orgId, tournId, year });
        cacheSeconds = 1800; // 30 minutes
        break;

      // ==================== SCORECARDS ====================
      case "scorecard":
      case "scorecards":
        if (!tournId || !playerId) {
          return jsonResponse({ error: "tournId and playerId required for scorecard" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/scorecards", { 
          orgId, 
          tournId, 
          year, 
          playerId,
          ...(roundId && { roundId })
        });
        cacheSeconds = 60;
        break;

      // ==================== FEDEX CUP POINTS ====================
      case "points":
        if (!tournId) {
          return jsonResponse({ error: "tournId required for points" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/points", { orgId, tournId, year });
        cacheSeconds = 3600;
        break;

      // ==================== EARNINGS ====================
      case "earnings":
        if (!tournId) {
          return jsonResponse({ error: "tournId required for earnings" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/earnings", { orgId, tournId, year });
        cacheSeconds = 3600;
        break;

      // ==================== WORLD RANKINGS ====================
      case "rankings":
      case "world-rankings":
        result = await fetchFromSlashGolf("/world-rankings", { year });
        cacheSeconds = 3600;
        break;

      // ==================== PLAYER STATS ====================
      case "player-stats":
      case "stats":
        if (!playerId) {
          return jsonResponse({ error: "playerId required for player stats" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/player-stats", { playerId, year });
        cacheSeconds = 3600;
        break;

      // ==================== TOUR STATS ====================
      case "tour-stats":
        if (!statId) {
          return jsonResponse({ error: "statId required for tour stats" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/stats", { orgId, year, statId });
        cacheSeconds = 3600;
        break;

      // ==================== PLAYER SEARCH ====================
      case "player-search":
      case "search-players":
        const playerName = url.searchParams.get("name") || "";
        if (!playerName) {
          return jsonResponse({ error: "name required for player search" }, 400, 5);
        }
        result = await fetchFromSlashGolf("/player-search", { playerName });
        cacheSeconds = 3600;
        break;

      // ==================== ALL DATA FOR A TOURNAMENT ====================
      case "tournament-full":
        // Fetch everything for a tournament in parallel
        if (!tournId) {
          return jsonResponse({ error: "tournId required for tournament-full" }, 400, 5);
        }
        
        const [leaderboardRes, tournamentRes, pointsRes, earningsRes] = await Promise.all([
          fetchFromSlashGolf("/leaderboards", { orgId, tournId, year }),
          fetchFromSlashGolf("/tournaments", { orgId, tournId, year }),
          fetchFromSlashGolf("/points", { orgId, tournId, year }),
          fetchFromSlashGolf("/earnings", { orgId, tournId, year }),
        ]);

        result = {
          ok: true,
          data: {
            leaderboard: leaderboardRes.data || null,
            tournament: tournamentRes.data || null,
            points: pointsRes.data || null,
            earnings: earningsRes.data || null,
            fetchedAt: new Date().toISOString(),
          }
        };
        cacheSeconds = 120;
        break;

      // ==================== SEASON OVERVIEW ====================
      case "season-overview":
        // Get schedule + rankings
        const [scheduleRes, rankingsRes] = await Promise.all([
          fetchFromSlashGolf("/schedules", { orgId, year }),
          fetchFromSlashGolf("/world-rankings", { year }),
        ]);

        result = {
          ok: true,
          data: {
            schedule: scheduleRes.data || null,
            rankings: rankingsRes.data || null,
            fetchedAt: new Date().toISOString(),
          }
        };
        cacheSeconds = 1800;
        break;

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400, 5);
    }

    if (!result.ok) {
      return jsonResponse(
        { 
          error: result.error || "Failed to fetch data", 
          action,
          params: { orgId, year, tournId, playerId }
        }, 
        502, 
        30
      );
    }

    return jsonResponse(
      {
        action,
        params: { orgId, year, tournId, playerId, roundId, statId },
        data: result.data,
        fetchedAt: new Date().toISOString(),
      },
      200,
      cacheSeconds
    );

  } catch (err) {
    console.error("[slashgolf] Unexpected error:", err);
    return jsonResponse({ error: "Unexpected error", details: String(err) }, 500, 5);
  }
});
