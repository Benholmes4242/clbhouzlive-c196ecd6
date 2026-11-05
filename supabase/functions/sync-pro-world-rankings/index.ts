/** Monday-only history and independent counting events. No schedule is created.
 * Current rank is filed on this run's UTC Monday; prior on the previous Monday
 * only if absent. Event dates come exclusively from public event details.
 * OWGR supplies gross scores without par: round/to-par writes remain blocked,
 * never fabricated. Dated imports retain member identities and own rounds.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { mondayDates, parseRank, parseEvents, parseEventDetails } from './owgrParse.ts';
import { authorized, syncEach, type Pro, type SyncSource } from './runSync.ts';
import { eventImportTarget, importedRounds, shouldImportEvents } from './eventImportRules.ts';

const bodySchema = z.object({ user_id: z.string().uuid().optional() }).strict();
Deno.serve(async req => {
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !anonKey) return reply({ error: 'Sync configuration unavailable' }, 503);
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({ error: 'Unauthorized' }, 401);
  const scoped = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const service = token === serviceKey;
  const valid = service ? true : !(await scoped.auth.getUser(token)).error;
  if (!await authorized(service, valid, async () => {
    const { data, error } = await scoped.rpc('is_admin');
    return !error && data === true;
  })) return reply({ error: 'Admin access required' }, 403);
  let input: unknown;
  try { const text = await req.text(); input = text.trim() ? JSON.parse(text) : {}; } catch { return reply({ error: 'Invalid request' }, 400); }
  const body = bodySchema.safeParse(input);
  if (!body.success) return reply({ error: 'Invalid request', details: body.error.flatten() }, 400);
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const now = new Date();
  const dates = mondayDates(now);
  const warnings: { user_id: string; event_id: string; reason: string; pro_event_ids?: string[] }[] = [];
  let lastRequest = 0;
  const publicJson = async (path: string): Promise<unknown> => {
    const wait = 1000 - (Date.now() - lastRequest);
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    lastRequest = Date.now();
    const response = await fetch(`https://apiweb.owgr.com/api/owgr/${path}`, {
      headers: { 'User-Agent': 'clbhouz-rankings/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`OWGR unavailable (${response.status})`);
    return response.json();
  };
  const eventCache = new Map<string, Promise<unknown>>();
  const getEvent = (id: string) => {
    const cached = eventCache.get(id);
    if (cached) return cached;
    const request = publicJson(`events/getEvent?eventId=${encodeURIComponent(id)}`);
    eventCache.set(id, request);
    return request;
  };
  try {
    const sources: SyncSource[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = db.from('pro_world_rank_sources').select('user_id,owgr_url,owgr_slug').order('user_id').range(offset, offset + 999);
      if (body.data.user_id) query = query.eq('user_id', body.data.user_id);
      const { data, error } = await query;
      if (error) throw error;
      sources.push(...data ?? []);
      if (!data || data.length < 1000) break;
    }
    const profiles: Pro[] = [];
    for (let i = 0; i < sources.length; i += 100) {
      const { data, error } = await db.from('user_profiles').select('id,pro_kind,pro_verified_at,pro_player_id').in('id', sources.slice(i, i + 100).map(s => s.user_id));
      if (error) throw error;
      profiles.push(...data ?? []);
    }
    const summary = await syncEach(sources, profiles, async (source, pro) => {
      const match = source.owgr_slug.match(/-(\d+)$/);
      const playerId = match ? Number(match[1]) : NaN;
      if (!Number.isSafeInteger(playerId) || playerId <= 0) throw new Error('Invalid OWGR link');
      const rank = parseRank(await publicJson(`playerprofile/getPlayerProfileSummary?playerId=${playerId}`), playerId);
      // Parse the rank completely before any history writes.
      const { error: rankError } = await db.from('pro_world_rank_history').upsert({ user_id: source.user_id, ranking_date: dates.current, rank: rank.rank, points: rank.points, source: 'owgr' }, { onConflict: 'user_id,ranking_date' });
      if (rankError) throw rankError;
      if (rank.priorRank) {
        const { error } = await db.from('pro_world_rank_history').upsert({ user_id: source.user_id, ranking_date: dates.previous, rank: rank.priorRank, points: null, source: 'owgr' }, { onConflict: 'user_id,ranking_date', ignoreDuplicates: true });
        if (error) throw error;
      }
      if (shouldImportEvents(pro.pro_player_id)) {
        const events = parseEvents(await publicJson(`playerprofile/getPlayerProfileEventsTable?playerId=${playerId}&year=-1&countingEventsNumber=52`));
        const stored = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await db.from('pro_events').select('id,source,start_date,owgr_event_id,event_name').eq('user_id', source.user_id).order('id').range(offset, offset + 999);
          if (error) throw error;
          stored.push(...data ?? []);
          if (!data || data.length < 1000) break;
        }
        for (const event of events) {
          try {
            const details = parseEventDetails(await getEvent(event.owgr_event_id), event.owgr_event_id, playerId);
            Object.assign(event, { start_date: details.start_date, end_date: details.end_date, country: details.country, venue: details.venue, to_par: details.to_par, rounds: details.rounds });
            if (details.grossRounds.length) warnings.push({ user_id: source.user_id, event_id: event.owgr_event_id, reason: 'Gross round scores supplied without par; no to-par round writes' });
          } catch (e) {
            warnings.push({ user_id: source.user_id, event_id: event.owgr_event_id, reason: e instanceof Error ? e.message : 'Event details unavailable' });
          }
          if (!event.start_date) {
            const similar = stored.filter(row => row.source === 'pro' && row.event_name.trim().toLowerCase() === event.event_name.trim().toLowerCase());
            if (similar.length) warnings.push({ user_id: source.user_id, event_id: event.owgr_event_id, reason: 'Possible member event duplicate; no real date, not merged', pro_event_ids: similar.map(r => r.id) });
          }
          const target = eventImportTarget(event, stored);
          const { rounds, ...fields } = event;
          const payload = { ...fields, source: 'owgr', user_id: source.user_id, updated_at: now.toISOString() };
          const result = target
            ? await db.from('pro_events').update(payload).eq('id', target.id).eq('user_id', source.user_id).select('id').single()
            : await db.from('pro_events').insert(payload).select('id').single();
          if (result.error) throw result.error;
          const eventId = result.data.id;
          if (!target) stored.push({ id: eventId, source: 'owgr', start_date: event.start_date, owgr_event_id: event.owgr_event_id, event_name: event.event_name });
          if (rounds.length) {
            const existing = await db.from('pro_event_rounds').select('round_no,source').eq('event_id', eventId);
            if (existing.error) throw existing.error;
            const imported = importedRounds(event, existing.data ?? []);
            for (const round of imported) {
              const own = existing.data?.find(row => row.round_no === round.round_no);
              const write = own
                ? await db.from('pro_event_rounds').update(round).eq('event_id', eventId).eq('round_no', round.round_no).eq('source', 'owgr')
                : await db.from('pro_event_rounds').upsert({ ...round, event_id: eventId }, { onConflict: 'event_id,round_no', ignoreDuplicates: true });
              if (write.error) throw write.error;
            }
          }
        }
      }
      const { error } = await db.from('pro_world_rank_sources').update({ last_checked_at: now.toISOString(), last_error: null }).eq('user_id', source.user_id);
      if (error) throw error;
    }, async (source, error) => {
      const result = await db.from('pro_world_rank_sources').update({ last_checked_at: now.toISOString(), last_error: error }).eq('user_id', source.user_id);
      if (result.error) throw result.error;
    });
    return reply({ ...summary, warnings });
  } catch (e) { return reply({ error: e instanceof Error ? e.message : 'Sync failed' }, 500); }
});