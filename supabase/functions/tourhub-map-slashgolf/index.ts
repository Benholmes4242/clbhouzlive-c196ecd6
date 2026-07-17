import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsFor } from '../_shared/cors.ts';
// ============ Name Normalization ============

const SPONSOR_FLUFF = [
  'presented by', 'powered by', 'in association with',
  'sponsored by', 'hosted by', 'supported by',
];

const TOUR_PREFIXES = [
  'pga tour', 'dp world tour', 'european tour', 'lpga tour',
  'liv golf', 'korn ferry tour',
];

function normalizeName(name: string): string {
  if (!name) return '';
  
  let normalized = name.toLowerCase().trim();
  
  // Remove tour prefixes
  for (const prefix of TOUR_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim();
    }
  }
  
  // Remove sponsor fluff
  for (const fluff of SPONSOR_FLUFF) {
    const idx = normalized.indexOf(fluff);
    if (idx !== -1) {
      normalized = normalized.slice(0, idx).trim();
    }
  }
  
  // Remove "at [location]" suffix (e.g., "The Sentry at Kapalua" → "The Sentry")
  const atIdx = normalized.lastIndexOf(' at ');
  if (atIdx > 10) { // Only if "at" is far enough in
    normalized = normalized.slice(0, atIdx).trim();
  }
  
  // Replace & with and
  normalized = normalized.replace(/&/g, 'and');
  
  // Remove punctuation except spaces
  normalized = normalized.replace(/[^\w\s]/g, '');
  
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

// ============ Similarity Scoring ============

function getWords(s: string): Set<string> {
  return new Set(s.split(' ').filter(w => w.length > 1));
}

function jaccardSimilarity(a: string, b: string): number {
  const wordsA = getWords(a);
  const wordsB = getWords(b);
  
  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  
  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }
  
  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}

function dateScore(espnDate: Date, sgDate: Date): number {
  const diffDays = Math.abs((espnDate.getTime() - sgDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 1.0;
  if (diffDays <= 1) return 0.9;
  if (diffDays <= 2) return 0.8;
  if (diffDays <= 3) return 0.7;
  if (diffDays <= 4) return 0.6;
  return 0.0;
}

function calculateConfidence(espnEvent: any, sgEvent: any): number {
  const normEspn = normalizeName(espnEvent.name);
  const normSg = normalizeName(sgEvent.name);
  
  const nameSim = jaccardSimilarity(normEspn, normSg);
  const dateSim = dateScore(new Date(espnEvent.start_date), new Date(sgEvent.startDate));
  
  // Weight: 55% name, 45% date
  return 0.55 * nameSim + 0.45 * dateSim;
}

// ============ Tour Mapping ============

// Map our internal tour codes to SlashGolf orgId
function getTourOrgId(tour: string): string {
  const mapping: Record<string, string> = {
    'pga': '1',      // PGA Tour
    'dpworld': '2',  // DP World Tour (European Tour)
    'lpga': '3',     // LPGA
  };
  return mapping[tour.toLowerCase()] || '1';
}

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const url = new URL(req.url);
  
  const tour = url.searchParams.get('tour') || 'pga';
  const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
  const year = parseInt(yearParam, 10);
  const dryRun = url.searchParams.get('dryRun') === 'true';
  const write = url.searchParams.get('write') === 'true';
  
  console.log(`[tourhub-map-slashgolf] Starting mapping: tour=${tour}, year=${year}, dryRun=${dryRun}, write=${write}`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ============ Step A: Fetch ESPN events from DB ============
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year + 1}-01-01`;
    
    console.log(`[tourhub-map-slashgolf] Fetching ESPN events from tourhub_events...`);
    
    const { data: espnEvents, error: espnError } = await supabase
      .from('tourhub_events')
      .select('tour, espn_event_id, name, start_date, end_date, status')
      .eq('tour', tour)
      .gte('start_date', yearStart)
      .lt('start_date', yearEnd)
      .order('start_date', { ascending: true });

    if (espnError) {
      console.error('[tourhub-map-slashgolf] Error fetching ESPN events:', espnError);
      throw espnError;
    }

    console.log(`[tourhub-map-slashgolf] Found ${espnEvents?.length || 0} ESPN events`);

    if (!espnEvents || espnEvents.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        tour,
        year,
        message: 'No ESPN events found for this tour/year',
        autoMapped: 0,
        reviewNeeded: 0,
        unmatched: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ============ Step B: Fetch SlashGolf schedule ============
    console.log(`[tourhub-map-slashgolf] Fetching SlashGolf schedule...`);
    
    const { data: sgResponse, error: sgError } = await supabase.functions.invoke('tourhub-slashgolf', {
      body: { action: 'schedule', year, orgId: getTourOrgId(tour) }
    });

    if (sgError) {
      console.error('[tourhub-map-slashgolf] Error fetching SlashGolf schedule:', sgError);
      throw sgError;
    }

    const sgEvents = sgResponse?.schedule || [];
    console.log(`[tourhub-map-slashgolf] Found ${sgEvents.length} SlashGolf events`);

    if (sgEvents.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        tour,
        year,
        message: 'No SlashGolf events found for this tour/year',
        autoMapped: 0,
        reviewNeeded: 0,
        unmatched: espnEvents.length,
        espnEvents: espnEvents.map(e => ({ id: e.espn_event_id, name: e.name })),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ============ Step C & D: Match events ============
    const autoMapped: any[] = [];
    const reviewNeeded: any[] = [];
    const unmatched: any[] = [];
    
    const AUTO_THRESHOLD = 0.78;
    const REVIEW_THRESHOLD = 0.65;

    for (const espnEvent of espnEvents) {
      const espnDate = new Date(espnEvent.start_date);
      
      // Filter SlashGolf events within ±7 days
      const candidates = sgEvents
        .filter((sg: any) => {
          const sgDate = new Date(sg.startDate);
          const diffDays = Math.abs((espnDate.getTime() - sgDate.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        })
        .map((sg: any) => ({
          ...sg,
          confidence: calculateConfidence(espnEvent, sg),
          normalizedEspn: normalizeName(espnEvent.name),
          normalizedSg: normalizeName(sg.name),
        }))
        .sort((a: any, b: any) => b.confidence - a.confidence);

      if (candidates.length === 0) {
        unmatched.push({
          espn_event_id: espnEvent.espn_event_id,
          espn_name: espnEvent.name,
          espn_start: espnEvent.start_date,
          reason: 'no_candidates_in_date_range',
        });
        continue;
      }

      const best = candidates[0];

      if (best.confidence >= AUTO_THRESHOLD) {
        autoMapped.push({
          tour,
          year,
          espn_event_id: espnEvent.espn_event_id,
          slashgolf_tourn_id: best.tournId,
          espn_name: espnEvent.name,
          slashgolf_name: best.name,
          confidence: Math.round(best.confidence * 100) / 100,
          matched_by: 'auto',
        });
      } else if (best.confidence >= REVIEW_THRESHOLD) {
        reviewNeeded.push({
          espn_event_id: espnEvent.espn_event_id,
          espn_name: espnEvent.name,
          espn_start: espnEvent.start_date,
          normalizedEspn: best.normalizedEspn,
          candidates: candidates.slice(0, 3).map((c: any) => ({
            slashgolf_tourn_id: c.tournId,
            name: c.name,
            normalizedSg: c.normalizedSg,
            startDate: c.startDate,
            confidence: Math.round(c.confidence * 100) / 100,
          })),
        });
      } else {
        unmatched.push({
          espn_event_id: espnEvent.espn_event_id,
          espn_name: espnEvent.name,
          espn_start: espnEvent.start_date,
          reason: 'low_confidence',
          bestCandidate: {
            name: best.name,
            confidence: Math.round(best.confidence * 100) / 100,
          },
        });
      }
    }

    console.log(`[tourhub-map-slashgolf] Results: autoMapped=${autoMapped.length}, reviewNeeded=${reviewNeeded.length}, unmatched=${unmatched.length}`);

    // ============ Step E: Write mappings (if requested) ============
    let writeResult = null;
    if (write && !dryRun && autoMapped.length > 0) {
      console.log(`[tourhub-map-slashgolf] Writing ${autoMapped.length} mappings to DB...`);
      
      const { data: upsertData, error: upsertError } = await supabase
        .from('tourhub_event_mappings')
        .upsert(autoMapped.map(m => ({
          tour: m.tour,
          year: m.year,
          espn_event_id: m.espn_event_id,
          slashgolf_tourn_id: m.slashgolf_tourn_id,
          espn_name: m.espn_name,
          slashgolf_name: m.slashgolf_name,
          confidence: m.confidence,
          matched_by: m.matched_by,
          matched_at: new Date().toISOString(),
        })), {
          onConflict: 'tour,year,espn_event_id',
          ignoreDuplicates: false,
        });

      if (upsertError) {
        console.error('[tourhub-map-slashgolf] Error upserting mappings:', upsertError);
        writeResult = { error: upsertError.message };
      } else {
        writeResult = { success: true, count: autoMapped.length };
        console.log(`[tourhub-map-slashgolf] Successfully wrote ${autoMapped.length} mappings`);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[tourhub-map-slashgolf] Completed in ${elapsed}ms`);

    return new Response(JSON.stringify({
      success: true,
      tour,
      year,
      dryRun,
      autoMapped: autoMapped.length,
      reviewNeeded: reviewNeeded.length,
      unmatched: unmatched.length,
      writeResult,
      elapsed: `${elapsed}ms`,
      mappings: dryRun ? autoMapped : undefined,
      review: reviewNeeded,
      unmatchedEvents: unmatched,
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('[tourhub-map-slashgolf] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
