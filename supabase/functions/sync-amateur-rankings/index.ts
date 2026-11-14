/** Verified links only; source fetch/validation completes before replacing a
 * member's counting window/history. Errors are isolated per member, and no
 * source-pro transition deletes previous amateur data. No schedule created. */
import { z } from 'npm:zod@3';
import { corsFor } from '../_shared/cors.ts';
import { fetchWagrProfile, fetchWagrEvents, fetchWagrGraph, isoWeekThursday } from '../_shared/wagr.ts';
import { configuration, makeClient, syncAuth, type WagrClientFactory } from '../_shared/wagrAuth.ts';
export const FUNCTION_VERSION = 'wagr-server-2026-11-14-v1';
let corsHeaders: Record<string, string> = corsFor(null);
const schema = z.object({ user_id: z.string().uuid().optional() }).strict();
const sources = { fetchWagrProfile, fetchWagrEvents, fetchWagrGraph };
export async function handler(req: Request, factory: WagrClientFactory = makeClient, reads = sources): Promise<Response> {
  corsHeaders = corsFor(req.headers.get('Origin'));
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return reply(null);
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const authError = await syncAuth(req, corsHeaders, factory);
  if (authError) return authError;
  const config = configuration();
  if (!config) return reply({ error: 'Sync configuration unavailable' }, 503);
  try {
    let input: unknown;
    try { const text = await req.text(); input = text.trim() ? JSON.parse(text) : {}; } catch { return reply({ error: 'Invalid request' }, 400); }
    if (z.object({ mode: z.literal('ping') }).strict().safeParse(input).success) return reply({ FUNCTION_VERSION });
    const body = schema.safeParse(input);
    if (!body.success) return reply({ error: 'Invalid request', details: body.error.flatten() }, 400);
    if (req.headers.has('x-internal-secret') && body.data.user_id) return reply({ error: 'Internal secret permits all-amateurs runs only' }, 400);
    const db = factory(config.url, config.serviceKey);
    const links: { user_id: string; wagr_slug: string; wagr_player_id: number }[] = [];
    for (let offset = 0; ; offset += 1000) {
      let query = db.from('amateur_rank_links').select('user_id,wagr_slug,wagr_player_id').eq('status', 'verified').order('user_id').range(offset, offset + 999);
      if (body.data.user_id) query = query.eq('user_id', body.data.user_id);
      const result = await query;
      if (result.error) throw result.error;
      links.push(...result.data ?? []);
      if (!result.data || result.data.length < 1000) break;
    }
    const results: { user_id: string; ok: boolean; error?: string }[] = [];
    for (const link of links) {
      try {
        const profile = await reads.fetchWagrProfile(link.wagr_slug);
        if (profile.playerId !== link.wagr_player_id) throw new Error('WAGR profile ID mismatch');
        if (profile.isPro) throw new Error('turned_pro');
        const events = await reads.fetchWagrEvents(link.wagr_player_id);
        const graph = await reads.fetchWagrGraph(link.wagr_player_id);
        const now = new Date().toISOString();
        const eventRows = events.map(event => ({ user_id: link.user_id, wagr_event_id: event.eventId, week_year: event.weekYear, event_week: isoWeekThursday(event.weekYear).toISOString().slice(0, 10), country: event.country, event_name: event.eventName.trim(), finish: event.finishPosition, points: event.points, event_type: event.type, format: event.format, counting: true, updated_at: now }));
        const history = graph.map(row => ({ user_id: link.user_id, week: row.week, rank: row.rank, event_id: row.eventId, event_name: row.eventName, finish: row.finishPosition, points: row.points }));
        const stats = profile.playerStatisticsInfo;
        const summary = await db.from('amateur_rank_summary').upsert({ user_id: link.user_id, rank: profile.position, points_average: profile.pointsAverage, best_rank: stats.bestRanking, wins: stats.wins, top10s: stats.top10Finishes, counting_events: stats.countingEvents, divisor: profile.divisor, rank_week: graph.length ? Math.max(...graph.map(row => row.week)) : null, fetched_at: now }, { onConflict: 'user_id' });
        if (summary.error) throw summary.error;
        if (eventRows.length) {
          const saved = await db.from('amateur_events').upsert(eventRows, { onConflict: 'user_id,wagr_event_id' });
          if (saved.error) throw saved.error;
        }
        let prune = db.from('amateur_events').delete().eq('user_id', link.user_id);
        if (eventRows.length) prune = prune.not('wagr_event_id', 'in', `(${eventRows.map(row => row.wagr_event_id).join(',')})`);
        const pruned = await prune;
        if (pruned.error) throw pruned.error;
        const removed = await db.from('amateur_rank_history').delete().eq('user_id', link.user_id);
        if (removed.error) throw removed.error;
        for (let offset = 0; offset < history.length; offset += 500) {
          const saved = await db.from('amateur_rank_history').insert(history.slice(offset, offset + 500));
          if (saved.error) throw saved.error;
        }
        const updated = await db.from('amateur_rank_links').update({ last_synced_at: now, last_error: null }).eq('user_id', link.user_id).eq('status', 'verified');
        if (updated.error) throw updated.error;
        results.push({ user_id: link.user_id, ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Sync failed';
        const updated = await db.from('amateur_rank_links').update({ last_error: message }).eq('user_id', link.user_id).eq('status', 'verified');
        results.push({ user_id: link.user_id, ok: false, error: updated.error ? `${message}; could not save last_error: ${updated.error.message}` : message });
      }
    }
    const ok = results.filter(row => row.ok).length;
    return reply({ processed: results.length, ok, errored: results.length - ok, results }, results.length > 0 && ok === 0 ? 500 : 200);
  } catch (error) { return reply({ error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Sync failed' }, 500); }
}
if (import.meta.main) Deno.serve(req => handler(req));