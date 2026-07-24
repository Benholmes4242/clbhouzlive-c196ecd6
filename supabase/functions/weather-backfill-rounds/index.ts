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

  const { data: candidates, error: candErr } = await supabase.rpc(
    'exec_sql_readonly_json',
    { p_sql: CANDIDATE_SQL },
  ).then((r) => r).catch(() => ({ data: null, error: null }));

  // The above rpc may not exist in this project; use direct query builder
  // as the real path. Kept as a safety no-op if a helper is added later.
  let rows: Candidate[] = Array.isArray(candidates) ? (candidates as Candidate[]) : [];
  if (!rows.length) {
    // Direct: use PostgREST for the JOIN via a view-like nested select.
    // whs_scores -> whs_to_golf_course_map(whs_course_id) -> golf_courses.
    const { data, error } = await supabase
      .from('whs_scores')
      .select(`
        id,
        play_date,
        course_id,
        whs_to_golf_course_map:whs_to_golf_course_map!inner (
          golf_course_id,
          golf_courses:golf_courses!inner ( id, latitude, longitude )
        )
      `)
      .not('play_date', 'is', null)
      .order('play_date', { ascending: false })
      .limit(BATCH_LIMIT * 3); // over-fetch, filter unmapped and existing below

    if (error) {
      console.error('[weather-backfill-rounds] candidate query failed', error);
      return new Response(
        JSON.stringify({ error: 'candidate_query_failed', detail: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const raw = (data ?? []) as any[];
    // whs_to_golf_course_map keys on whs_course_id, which equals whs_scores.course_id.
    // PostgREST returned nested only if that FK is defined; if it's returned as an
    // array (many-side), take the first entry.
    const shaped: Candidate[] = [];
    for (const r of raw) {
      const map = Array.isArray(r.whs_to_golf_course_map)
        ? r.whs_to_golf_course_map[0]
        : r.whs_to_golf_course_map;
      const gc = map?.golf_courses;
      const gcRow = Array.isArray(gc) ? gc[0] : gc;
      if (!gcRow?.latitude || !gcRow?.longitude) continue;
      shaped.push({
        whs_score_id: r.id,
        play_date: r.play_date,
        golf_course_id: gcRow.id,
        latitude: Number(gcRow.latitude),
        longitude: Number(gcRow.longitude),
      });
    }

    // Filter out whs_scores that already have a round_weather row.
    if (shaped.length) {
      const ids = shaped.map((s) => s.whs_score_id);
      const { data: existing } = await supabase
        .from('round_weather')
        .select('whs_score_id')
        .in('whs_score_id', ids);
      const have = new Set((existing ?? []).map((e: any) => e.whs_score_id));
      rows = shaped.filter((s) => !have.has(s.whs_score_id)).slice(0, BATCH_LIMIT);
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
