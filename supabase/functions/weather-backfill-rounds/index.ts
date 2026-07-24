// Weather backfill for rounds - see BRIEF_ROUND_WEATHER_FETCHER.
// Runs daily; fills public.round_weather from Open-Meteo historical archive.
// ASCII only, incl. comments.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsFor } from '../_shared/cors.ts';
import { requireInternalSecret } from '../_shared/internalAuth.ts';

const FUNCTION_VERSION = '2026-07-24T00:00:00Z-v1-weather-backfill-rounds';

const BATCH_LIMIT = 200;
const POLITE_DELAY_MS = 100;
const OPEN_METEO_URL = 'https://archive-api.open-meteo.com/v1/archive';

console.log(`[weather-backfill-rounds] boot FUNCTION_VERSION=${FUNCTION_VERSION}`);

interface Candidate {
  whs_score_id: string;
  play_date: string; // YYYY-MM-DD
  golf_course_id: string;
  latitude: number;
  longitude: number;
}

interface DailyWx {
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  wind_speed_10m_max: (number | null)[];
  wind_gusts_10m_max: (number | null)[];
  weather_code: (number | null)[];
  time: string[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function roundCoord(n: number): number {
  // Bucket to ~1km resolution to dedupe near-identical requests.
  return Math.round(n * 100) / 100;
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const gate = requireInternalSecret(req, corsHeaders);
  if (gate) return gate;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Candidate selection: whs_scores with no round_weather row, whose
  // course maps to a golf_courses row with non-null lat/lng.
  // Newest play_date first so fresh rounds cover immediately.
  const CANDIDATE_SQL = `
    SELECT ws.id AS whs_score_id,
           ws.play_date::text AS play_date,
           gc.id AS golf_course_id,
           gc.latitude::float8 AS latitude,
           gc.longitude::float8 AS longitude
      FROM public.whs_scores ws
      JOIN public.whs_to_golf_course_map m ON m.whs_course_id = ws.course_id
      JOIN public.golf_courses gc ON gc.id = m.golf_course_id
     WHERE gc.latitude IS NOT NULL
       AND gc.longitude IS NOT NULL
       AND ws.play_date IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM public.round_weather rw WHERE rw.whs_score_id = ws.id
       )
     ORDER BY ws.play_date DESC
     LIMIT ${BATCH_LIMIT}
  `;

  // Step 1: fetch newest whs_scores (over-fetch, we filter next).
  const OVERFETCH = BATCH_LIMIT * 6;
  const { data: scores, error: scoresErr } = await supabase
    .from('whs_scores')
    .select('id, play_date, course_id')
    .not('play_date', 'is', null)
    .not('course_id', 'is', null)
    .order('play_date', { ascending: false })
    .limit(OVERFETCH);

  if (scoresErr) {
    console.error('[weather-backfill-rounds] scores query failed', scoresErr);
    return new Response(
      JSON.stringify({ error: 'candidate_query_failed', detail: scoresErr.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const scoreRows = (scores ?? []) as Array<{ id: string; play_date: string; course_id: string }>;
  let rows: Candidate[] = [];

  if (scoreRows.length) {
    // Step 2: filter out ones that already have a round_weather row.
    const scoreIds = scoreRows.map((s) => s.id);
    const { data: existing } = await supabase
      .from('round_weather')
      .select('whs_score_id')
      .in('whs_score_id', scoreIds);
    const have = new Set((existing ?? []).map((e: any) => e.whs_score_id));
    const remaining = scoreRows.filter((s) => !have.has(s.id));

    // Step 3: resolve whs_course_id -> golf_course_id.
    const whsCourseIds = Array.from(new Set(remaining.map((r) => r.course_id)));
    const mapById = new Map<string, string>();
    if (whsCourseIds.length) {
      const { data: maps } = await supabase
        .from('whs_to_golf_course_map')
        .select('whs_course_id, golf_course_id')
        .in('whs_course_id', whsCourseIds)
        .not('golf_course_id', 'is', null);
      for (const m of (maps ?? []) as any[]) {
        mapById.set(m.whs_course_id, m.golf_course_id);
      }
    }

    // Step 4: resolve golf_course_id -> lat/lng.
    const golfCourseIds = Array.from(new Set(Array.from(mapById.values())));
    const gcById = new Map<string, { latitude: number; longitude: number }>();
    if (golfCourseIds.length) {
      const { data: gcs } = await supabase
        .from('golf_courses')
        .select('id, latitude, longitude')
        .in('id', golfCourseIds)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);
      for (const g of (gcs ?? []) as any[]) {
        gcById.set(g.id, { latitude: Number(g.latitude), longitude: Number(g.longitude) });
      }
    }

    for (const s of remaining) {
      const gcId = mapById.get(s.course_id);
      if (!gcId) continue;
      const coords = gcById.get(gcId);
      if (!coords) continue;
      rows.push({
        whs_score_id: s.id,
        play_date: s.play_date,
        golf_course_id: gcId,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (rows.length >= BATCH_LIMIT) break;
    }
  }


  const candidateCount = rows.length;
  console.log(`[weather-backfill-rounds] candidates=${candidateCount}`);

  // Group by (roundedLat, roundedLng, play_date).
  const groups = new Map<string, { lat: number; lng: number; date: string; members: Candidate[] }>();
  for (const c of rows) {
    const lat = roundCoord(c.latitude);
    const lng = roundCoord(c.longitude);
    const key = `${lat}|${lng}|${c.play_date}`;
    let g = groups.get(key);
    if (!g) {
      g = { lat, lng, date: c.play_date, members: [] };
      groups.set(key, g);
    }
    g.members.push(c);
  }

  let fetched = 0;
  let inserted = 0;
  let failed = 0;

  for (const g of groups.values()) {
    const url = `${OPEN_METEO_URL}?latitude=${g.lat}&longitude=${g.lng}` +
      `&start_date=${g.date}&end_date=${g.date}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,` +
      `wind_speed_10m_max,wind_gusts_10m_max,weather_code` +
      `&wind_speed_unit=kmh&timezone=UTC`;

    let daily: DailyWx | null = null;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[weather-backfill-rounds] fetch ${res.status} for ${g.lat},${g.lng} ${g.date}`);
        failed += g.members.length;
        await sleep(POLITE_DELAY_MS);
        continue;
      }
      const body = await res.json();
      daily = body?.daily ?? null;
      fetched += 1;
    } catch (e) {
      console.warn(`[weather-backfill-rounds] fetch error ${g.lat},${g.lng} ${g.date}:`, (e as Error).message);
      failed += g.members.length;
      await sleep(POLITE_DELAY_MS);
      continue;
    }

    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      console.warn(`[weather-backfill-rounds] no daily data for ${g.lat},${g.lng} ${g.date}`);
      failed += g.members.length;
      await sleep(POLITE_DELAY_MS);
      continue;
    }

    const idx = 0; // single-day window
    const rowsToInsert = g.members.map((m) => ({
      whs_score_id: m.whs_score_id,
      golf_course_id: m.golf_course_id,
      play_date: m.play_date,
      latitude: m.latitude,
      longitude: m.longitude,
      temp_max_c: daily!.temperature_2m_max?.[idx] ?? null,
      temp_min_c: daily!.temperature_2m_min?.[idx] ?? null,
      precipitation_mm: daily!.precipitation_sum?.[idx] ?? null,
      wind_speed_max_kmh: daily!.wind_speed_10m_max?.[idx] ?? null,
      wind_gusts_max_kmh: daily!.wind_gusts_10m_max?.[idx] ?? null,
      weather_code: daily!.weather_code?.[idx] ?? null,
      fetched_at: new Date().toISOString(),
    }));

    // Idempotent: PK is whs_score_id, ignoreDuplicates == DO NOTHING.
    const { error: insErr, count } = await supabase
      .from('round_weather')
      .upsert(rowsToInsert, { onConflict: 'whs_score_id', ignoreDuplicates: true, count: 'exact' });

    if (insErr) {
      console.warn(`[weather-backfill-rounds] insert failed for ${g.lat},${g.lng} ${g.date}:`, insErr.message);
      failed += g.members.length;
    } else {
      inserted += count ?? rowsToInsert.length;
    }

    await sleep(POLITE_DELAY_MS);
  }

  const summary = {
    version: FUNCTION_VERSION,
    candidates: candidateCount,
    groups: groups.size,
    fetched,
    inserted,
    failed,
  };
  console.log('[weather-backfill-rounds] summary', JSON.stringify(summary));

  return new Response(JSON.stringify(summary), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
