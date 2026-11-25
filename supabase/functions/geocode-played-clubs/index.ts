// Nightly backfill: locate golf_clubs of played courses via Nominatim.
// Auth: x-internal-secret (cron) or an is_admin caller (manual run).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { requireInternalSecret } from '../_shared/internalAuth.ts';
import { pickGolfResult, type NominatimPlace } from '../_shared/pickGolfResult.ts';
import { buildQuery, buildWorkList, shouldStartNext, updateFor, type AttemptOutcome, type ClubRow } from './rules.ts';
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

type Lookup = AttemptOutcome | 'rateLimited';
async function geocode(club: ClubRow): Promise<{ outcome: Lookup; detail?: string }> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', buildQuery(club));
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('addressdetails', '1');
  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Clbhouz/1.0 (https://clbhouz.com)' },
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status === 429) { await res.body?.cancel(); return { outcome: 'rateLimited' }; }
    if (!res.ok) { await res.body?.cancel(); return { outcome: { kind: 'httpError' }, detail: `status=${res.status}` }; }
    const hit = pickGolfResult((await res.json()) as NominatimPlace[], club);
    return { outcome: hit ? { kind: 'match', ...hit } : { kind: 'noMatch' } };
  } catch (err) {
    const e = err as Error;
    return { outcome: { kind: 'httpError' }, detail: `${e?.name ?? 'Error'}: ${e?.message ?? String(err)}` };
  }
}

async function runBatch(db: SupabaseClient): Promise<void> {
  const start = Date.now();
  const work = await loadWorkList(db, new Date());
  const workListMs = Date.now() - start;
  let processed = 0, located = 0, noMatch = 0, errors = 0;
  let stopReason: 'done' | 'cap' | 'budget' | 'rateLimited' | 'emptyWorkList' = work.length === 0 ? 'emptyWorkList' : 'done';
  let firstErrorLogged = false;
  const stamped = new Set<string>();
  for (const club of work) {
    if (!shouldStartNext(Date.now() - start, processed)) {
      stopReason = processed >= 40 ? 'cap' : 'budget';
      break;
    }
    if (processed > 0) await sleep(1100);
    const { outcome, detail } = await geocode(club);
    processed++;
    if (outcome === 'rateLimited') { errors++; stopReason = 'rateLimited'; break; }
    const update = updateFor(outcome, new Date().toISOString());
    if (!update) {
      errors++;
      if (!firstErrorLogged) { firstErrorLogged = true; console.log(`geocode-played-clubs firstHttpError club=${club.id} ${detail}`); }
      continue;
    }
    if (update.coords) {
      // Conditional on null latitude/longitude: existing coordinates are never overwritten.
      const { error } = await db.from('golf_clubs').update(update.coords).eq('id', club.id).is('latitude', null).is('longitude', null);
      if (error) { errors++; continue; }
      located++;
    } else noMatch++;
    const { error } = await db.from('golf_clubs').update(update.stamp).eq('id', club.id);
    if (error) errors++; else stamped.add(club.id);
  }
  const remaining = work.filter((c) => !stamped.has(c.id)).length;
  console.log(`geocode-played-clubs processed=${processed} located=${located} noMatch=${noMatch} errors=${errors} remaining=${remaining} workListMs=${workListMs} elapsedMs=${Date.now() - start} stopReason=${stopReason}`);
}

Deno.serve(createHandler({
  cors: corsHeaders,
  authorize,
  waitUntil: (p) => EdgeRuntime.waitUntil(p),
  runBatch: () => {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return Promise.reject(new Error('Server misconfigured'));
    return runBatch(createClient(url, key, { auth: { persistSession: false } }));
  },
}));
