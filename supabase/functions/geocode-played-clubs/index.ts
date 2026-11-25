// Nightly backfill: locate golf_clubs of played courses via Geoapify (OpenStreetMap): coordinates, canonical region and town.
// Auth: x-internal-secret (cron) or an is_admin caller (manual run).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { requireInternalSecret } from '../_shared/internalAuth.ts';
import { geocodeGolfClub } from '../_shared/geocodeGolfClub.ts';
import { reverseLookup, secondPassGolf, type AnchorCache } from '../_shared/geocodeGolfSecondPass.ts';
import { runBatch } from './batch.ts';
import { buildWorkList, type ClubRow } from './rules.ts';
import { createHandler } from './handler.ts';
import { runProbe } from './probe.ts';

declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function authorize(req: Request): Promise<Response | null> {
  if (req.headers.has('x-internal-secret')) return requireInternalSecret(req, corsHeaders);
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!url || !anon || !token) return json({ error: 'Forbidden' }, 403);
  const scoped = createClient(url, anon, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  if ((await scoped.auth.getUser(token)).error) return json({ error: 'Forbidden' }, 403);
  const admin = await scoped.rpc('is_admin');
  return !admin.error && admin.data === true ? null : json({ error: 'Forbidden' }, 403);
}

async function pageAll<T>(fetchPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

async function loadWorkList(db: SupabaseClient, now: Date): Promise<ClubRow[]> {
  const activity = await pageAll<{ course_id: string | null; user_id: string | null }>((f, t) =>
    db.from('user_course_activity').select('course_id, user_id').not('course_id', 'is', null).range(f, t));
  const courseIds = [...new Set(activity.map((a) => a.course_id!).filter(Boolean))];
  const courseClub = new Map<string, string>();
  for (let i = 0; i < courseIds.length; i += 200) {
    const { data, error } = await db.from('golf_courses').select('id, club_id').in('id', courseIds.slice(i, i + 200)).not('club_id', 'is', null);
    if (error) throw error;
    for (const c of data ?? []) courseClub.set(c.id, c.club_id);
  }
  const membersByClub = new Map<string, Set<string>>();
  for (const a of activity) {
    const club = a.course_id ? courseClub.get(a.course_id) : undefined;
    if (!club || !a.user_id) continue;
    if (!membersByClub.has(club)) membersByClub.set(club, new Set());
    membersByClub.get(club)!.add(a.user_id);
  }
  const clubIds = [...membersByClub.keys()];
  const clubs: ClubRow[] = [];
  for (let i = 0; i < clubIds.length; i += 200) {
    const { data, error } = await db.from('golf_clubs')
      .select('id, name, country, region, sub_country, latitude, longitude, geocode_attempted_at, town')
      .in('id', clubIds.slice(i, i + 200));
    if (error) throw error;
    clubs.push(...((data ?? []) as ClubRow[]));
  }
  const counts = new Map([...membersByClub].map(([k, v]) => [k, v.size]));
  const { data: regs, error: regErr } = await db.from('geo_regions').select('sub_country').eq('is_active', true);
  if (regErr) throw regErr;
  const regionSubs = new Set((regs ?? []).map((r: { sub_country: string }) => r.sub_country));
  return buildWorkList(clubs, counts, now, regionSubs);
}

function resolverFor(db: SupabaseClient) {
  return {
    geoResolve: async (raw: string, sub: string) => {
      const { data, error } = await db.rpc('geo_resolve', { p_raw: raw, p_sub: sub });
      return error ? null : (data as string | null);
    },
    alias: async (raw: string, sub: string) => {
      const { data, error } = await db.from('geo_region_aliases').select('canonical')
        .eq('sub_country', sub).eq('raw_region', raw).not('canonical', 'is', null).limit(1).maybeSingle();
      return error ? null : (data?.canonical ?? null);
    },
  };
}

function runWithDb(db: SupabaseClient) {
  const apiKey = Deno.env.get('GEOAPIFY_API_KEY');
  const anchors: AnchorCache = new Map();
  // Every second-pass request waits 1.1s after the previous request.
  return runBatch({
    loadWorkList: () => loadWorkList(db, new Date()),
    geocode: (club, acceptMatch) => geocodeGolfClub(club, undefined, undefined, undefined, acceptMatch),
    secondPass: (club, acceptMatch) => secondPassGolf(club, { apiKey, cache: anchors, pace: () => sleep(1100) }, acceptMatch),
    reverseTown: (club) => reverseLookup(club.latitude!, club.longitude!, { apiKey, pace: () => sleep(1100) }),
    // Conditional on null latitude/longitude: existing coordinates are never overwritten.
    // Courses follow the club: only course rows whose latitude is null.
    writeCoords: async (id, coords) => {
      const a = await db.from('golf_clubs').update(coords).eq('id', id).is('latitude', null).is('longitude', null);
      if (a.error) return { error: a.error };
      const c = await db.from('golf_courses').update(coords).eq('club_id', id).is('latitude', null).select('id');
      return { error: c.error, courses: c.data?.length ?? 0 };
    },
    clearPin: async (id, pin) => {
      const a = await db.from('golf_clubs').update({ latitude: null, longitude: null, town: null, geocode_attempted_at: null })
        .eq('id', id).eq('latitude', pin.latitude).eq('longitude', pin.longitude);
      if (a.error) return { error: a.error };
      return { error: (await db.from('golf_courses').update({ latitude: null, longitude: null })
        .eq('club_id', id).eq('latitude', pin.latitude).eq('longitude', pin.longitude)).error };
    },
    correctRegion: async (id, from, to) => {
      const a = await db.from('golf_clubs').update({ region: to }).eq('id', id);
      if (a.error || from == null) return { error: a.error };
      return { error: (await db.from('golf_courses').update({ region: to }).eq('club_id', id).eq('region', from)).error };
    },
    resolver: resolverFor(db),
    writeRegion: async (id, region) => {
      const a = await db.from('golf_clubs').update({ region }).eq('id', id).is('region', null);
      if (a.error) return { error: a.error };
      return { error: (await db.from('golf_courses').update({ region }).eq('club_id', id).is('region', null)).error };
    },
    writeTown: async (id, town) => ({ error: (await db.from('golf_clubs').update({ town }).eq('id', id).is('town', null)).error }),
    stamp: async (id, stamp) => ({ error: (await db.from('golf_clubs').update(stamp).eq('id', id)).error }),
    sleep,
    now: () => Date.now(),
    log: (line) => console.log(line),
  });
}

Deno.serve(createHandler({
  cors: corsHeaders,
  authorize,
  waitUntil: (p) => EdgeRuntime.waitUntil(p),
  probe: (ids) => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return Promise.reject(new Error('Server misconfigured'));
    const db = createClient(url, key, { auth: { persistSession: false } });
    // Reads only: the club reader and region resolver.
    return runProbe(ids, {
      apiKey: Deno.env.get('GEOAPIFY_API_KEY'), sleep, resolver: resolverFor(db),
      loadClubs: async (clubIds) => {
        const { data, error } = await db.from('golf_clubs')
          .select('id, name, country, region, sub_country, latitude, longitude, geocode_attempted_at, town').in('id', clubIds);
        if (error) throw error;
        return (data ?? []) as ClubRow[];
      },
    });
  },
  runBatch: () => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return Promise.reject(new Error('Server misconfigured'));
    return runWithDb(createClient(url, key, { auth: { persistSession: false } })).then(() => undefined);
  },
}));
