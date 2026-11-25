// Nightly backfill: locate golf_clubs of played courses via Photon (OpenStreetMap).
// Auth: x-internal-secret (cron) or an is_admin caller (manual run).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { requireInternalSecret } from '../_shared/internalAuth.ts';
import { geocodeGolfClub } from '../_shared/geocodeGolfClub.ts';
import { runBatch } from './batch.ts';
import { buildWorkList, type ClubRow } from './rules.ts';
import { createHandler } from './handler.ts';

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
      .select('id, name, country, region, sub_country, latitude, longitude, geocode_attempted_at')
      .in('id', clubIds.slice(i, i + 200))
      .or('latitude.is.null,longitude.is.null');
    if (error) throw error;
    clubs.push(...((data ?? []) as ClubRow[]));
  }
  const counts = new Map([...membersByClub].map(([k, v]) => [k, v.size]));
  return buildWorkList(clubs, counts, now);
}

function runWithDb(db: SupabaseClient) {
  return runBatch({
    loadWorkList: () => loadWorkList(db, new Date()),
    geocode: (club) => geocodeGolfClub(club),
    // Conditional on null latitude/longitude: existing coordinates are never overwritten.
    writeCoords: async (id, coords) => ({ error: (await db.from('golf_clubs').update(coords).eq('id', id).is('latitude', null).is('longitude', null)).error }),
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
  runBatch: () => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return Promise.reject(new Error('Server misconfigured'));
    return runWithDb(createClient(url, key, { auth: { persistSession: false } })).then(() => undefined);
  },
}));
