// supabase/functions/tourhub-scoreboard/index.ts
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

function first<T>(arr: T[] | undefined | null): T | null {
  return arr && arr.length ? arr[0] : null;
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const tour = (url.searchParams.get("tour") || "pga").trim();

    if (!ALLOWED_TOURS.has(tour)) {
      return jsonResponse({ error: "Invalid tour", tour }, 400, 5);
    }

    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/golf/${tour}/scoreboard`;

    console.log(`[tourhub-scoreboard] Fetching ${tour} from ESPN...`);

    const resp = await fetch(espnUrl, {
      headers: {
        "user-agent": "tourhub/1.0",
        "accept": "application/json",
      },
    });

    if (!resp.ok) {
      console.error(`[tourhub-scoreboard] ESPN fetch failed: ${resp.status}`);
      return jsonResponse(
        { error: "ESPN fetch failed", status: resp.status },
        502,
        10
      );
    }

    const data = await resp.json();

    // ESPN shape varies. These are the common fields:
    const events = Array.isArray(data?.events) ? data.events : [];
    const normalized = events.map((e: any) => {
      const competition = first(e?.competitions) ?? {};
      const status = pickStatus(competition);

      const venue = competition?.venue ?? {};
      const venueAddr = venue?.address ?? {};
      const loc = [venueAddr?.city, venueAddr?.state, venueAddr?.country].filter(Boolean).join(", ");

      const eventId = String(e?.id || competition?.id || "").trim();
      const name = String(e?.name || e?.shortName || "Event").trim();

      const startDate = competition?.startDate || e?.date || null;
      const endDate = competition?.endDate || null;

      const logo =
        e?.logo ||
        first(e?.logos)?.href ||
        first(data?.leagues)?.logos?.[0]?.href ||
        null;

      const links = Array.isArray(e?.links) ? e.links : [];
      const web = links.find((l: any) => l?.rel?.includes("summary"))?.href
        || links.find((l: any) => l?.href)?.href
        || null;

      return {
        tour,
        espnEventId: eventId,
        name,
        status,
        startDate,
        endDate,
        course: {
          name: venue?.fullName || venue?.name || null,
          location: loc || null,
        },
        logoUrl: logo,
        eventUrl: web,
      };
    }).filter((e: any) => e.espnEventId);

    console.log(`[tourhub-scoreboard] Returning ${normalized.length} events for ${tour}`);

    // Cache: if any events are live, shorter cache.
    const hasLive = normalized.some((e: any) => e.status === "live");
    const cacheSeconds = hasLive ? 45 : 300;

    return jsonResponse(
      {
        tour,
        generatedAt: new Date().toISOString(),
        events: normalized,
      },
      200,
      cacheSeconds
    );
  } catch (err) {
    console.error(`[tourhub-scoreboard] Error:`, err);
    return jsonResponse({ error: "Unexpected error", details: String(err) }, 500, 5);
  }
});
