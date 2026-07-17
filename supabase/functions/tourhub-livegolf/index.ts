// supabase/functions/tourhub-livegolf/index.ts
// Fetches golf data from Live Golf API (livegolfapi.com)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

import { corsFor } from '../_shared/cors.ts';
const LIVEGOLF_BASE_URL = "https://use.livegolfapi.com/v1";
const API_KEY = Deno.env.get("GOLF_API_KEY") || "";

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

async function fetchFromLiveGolf(
  endpoint: string, 
  params: Record<string, string> = {}
): Promise<{ ok: boolean; data?: any; error?: string }> {
  if (!API_KEY) {
    console.error("[livegolf] GOLF_API_KEY not configured");
    return { ok: false, error: "API key not configured" };
  }

  const url = new URL(`${LIVEGOLF_BASE_URL}${endpoint}`);
  
  // Add API key as query param (Live Golf API supports both header and query)
  url.searchParams.set("api_key", API_KEY);
  
  // Add other params
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  console.log(`[livegolf] Fetching: ${endpoint} with params:`, params);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[livegolf] API error ${response.status}: ${errorText}`);
      return { ok: false, error: `API returned ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log(`[livegolf] Success for ${endpoint}, received ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
    return { ok: true, data };
  } catch (err) {
    console.error(`[livegolf] Fetch error:`, err);
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
    const action = url.searchParams.get("action") || "events";
    const eventId = url.searchParams.get("eventId") || "";
    const startDate = url.searchParams.get("start_date") || "";
    const endDate = url.searchParams.get("end_date") || "";
    const tour = url.searchParams.get("tour") || ""; // e.g., "pga-tour", "liv-golf", "dp-world-tour"

    console.log(`[livegolf] Request: action=${action}, eventId=${eventId}, tour=${tour}`);

    let result: { ok: boolean; data?: any; error?: string };
    let cacheSeconds = 300;

    switch (action) {
      // ==================== LIST EVENTS ====================
      case "events":
      case "list":
        // Get list of events with optional date range and tour filter
        const eventsParams: Record<string, string> = {};
        if (startDate) eventsParams.start_date = startDate;
        if (endDate) eventsParams.end_date = endDate;
        if (tour) eventsParams.tour = tour;
        
        result = await fetchFromLiveGolf("/events", eventsParams);
        cacheSeconds = 1800; // Cache for 30 minutes
        break;

      // ==================== SINGLE EVENT ====================
      case "event":
        if (!eventId) {
          return jsonResponse({ error: "eventId required for single event" }, 400, 5);
        }
        result = await fetchFromLiveGolf(`/events/${eventId}`);
        cacheSeconds = 300; // 5 minutes
        break;

      // ==================== UPCOMING EVENTS ====================
      case "upcoming":
        // Get upcoming events (next 3 weeks by default)
        const today = new Date();
        const threeWeeksLater = new Date(today);
        threeWeeksLater.setDate(today.getDate() + 21);
        
        result = await fetchFromLiveGolf("/events", {
          start_date: today.toISOString().split('T')[0],
          end_date: threeWeeksLater.toISOString().split('T')[0],
          ...(tour && { tour }),
        });
        cacheSeconds = 1800;
        break;

      // ==================== LIVE/IN-PROGRESS EVENTS ====================
      case "live":
        // Get events happening now
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        const oneWeekLater = new Date(now);
        oneWeekLater.setDate(now.getDate() + 7);
        
        const liveResult = await fetchFromLiveGolf("/events", {
          start_date: oneWeekAgo.toISOString().split('T')[0],
          end_date: oneWeekLater.toISOString().split('T')[0],
          ...(tour && { tour }),
        });
        
        if (liveResult.ok && Array.isArray(liveResult.data)) {
          // Filter to only events with status "In Progress" or similar
          const liveEvents = liveResult.data.filter((e: any) => 
            e.status?.toLowerCase().includes('progress') ||
            e.status?.toLowerCase().includes('live') ||
            e.status?.toLowerCase().includes('round')
          );
          result = { ok: true, data: liveEvents };
        } else {
          result = liveResult;
        }
        cacheSeconds = 60; // Cache for 1 minute during live events
        break;

      // ==================== RECENT/COMPLETED EVENTS ====================
      case "recent":
      case "completed":
        const recentEnd = new Date();
        const recentStart = new Date(recentEnd);
        recentStart.setDate(recentEnd.getDate() - 30); // Last 30 days
        
        const recentResult = await fetchFromLiveGolf("/events", {
          start_date: recentStart.toISOString().split('T')[0],
          end_date: recentEnd.toISOString().split('T')[0],
          ...(tour && { tour }),
        });
        
        if (recentResult.ok && Array.isArray(recentResult.data)) {
          // Filter to only completed events
          const completedEvents = recentResult.data.filter((e: any) => 
            e.status?.toLowerCase().includes('complete') ||
            e.status?.toLowerCase().includes('finished') ||
            e.status?.toLowerCase().includes('official')
          );
          result = { ok: true, data: completedEvents };
        } else {
          result = recentResult;
        }
        cacheSeconds = 3600; // 1 hour
        break;

      // ==================== ALL DATA (EVENTS BY TOUR) ====================
      case "by-tour":
        // Fetch events for multiple tours in parallel
        const tours = ["pga-tour", "liv-golf", "dp-world-tour"];
        const tourResults = await Promise.all(
          tours.map(async (t) => {
            const res = await fetchFromLiveGolf("/events", { tour: t });
            return { tour: t, events: res.ok ? res.data : [], error: res.error };
          })
        );
        
        result = {
          ok: true,
          data: tourResults.reduce((acc, r) => {
            acc[r.tour] = r.events;
            return acc;
          }, {} as Record<string, any[]>),
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
          params: { eventId, startDate, endDate, tour }
        }, 
        502, 
        30
      );
    }

    return jsonResponse(
      {
        action,
        params: { eventId, startDate, endDate, tour },
        data: result.data,
        count: Array.isArray(result.data) ? result.data.length : 1,
        fetchedAt: new Date().toISOString(),
      },
      200,
      cacheSeconds
    );

  } catch (err) {
    console.error("[livegolf] Unexpected error:", err);
    return jsonResponse({ error: "Unexpected error", details: String(err) }, 500, 5);
  }
});
