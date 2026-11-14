/** Claims are service-written only after a fresh WAGR lookup and verified
 * member JWT. The database live-player unique index arbitrates races. */
import { z } from 'npm:zod@3';
import { corsFor } from '../_shared/cors.ts';
import { fetchWagrProfile, parseWagrInput } from '../_shared/wagr.ts';
import { configuration, makeClient, type WagrClientFactory } from '../_shared/wagrAuth.ts';
let corsHeaders: Record<string, string> = corsFor(null);
const schema = z.object({ action: z.enum(['lookup', 'request']), input: z.string().min(1).max(2048) }).strict();
export async function handler(req: Request, factory: WagrClientFactory = makeClient, profile = fetchWagrProfile): Promise<Response> {
  corsHeaders = corsFor(req.headers.get('Origin'));
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return reply(null);
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const config = configuration();
  if (!config) return reply({ error: 'Configuration unavailable' }, 503);
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({ error: 'Unauthorized' }, 401);
  const scoped = factory(config.url, config.anonKey, token);
  const claims = await scoped.auth.getClaims(token);
  const userId = claims.data?.claims?.sub;
  if (claims.error || typeof userId !== 'string' || claims.data?.claims?.is_anonymous === true) return reply({ error: 'Unauthorized' }, 401);
  try {
    let input: unknown;
    try { input = await req.json(); } catch { return reply({ error: 'Invalid request' }, 400); }
    const body = schema.safeParse(input);
    if (!body.success) return reply({ error: 'Invalid request', details: body.error.flatten() }, 400);
    const parsed = parseWagrInput(body.data.input);
    if (!parsed) return reply({ error: 'not_a_wagr_link', code: 'not_a_wagr_link' }, 400);
    const found = await profile(parsed.slug);
    if (found.playerId !== parsed.playerId) throw new Error('WAGR profile ID mismatch');
    const lookup = { ...parsed, name: found.name, country: found.countryName, rank: found.position, isPro: found.isPro };
    if (body.data.action === 'lookup') return reply(lookup);
    const refuse = (code: string) => reply({ error: code, code }, 409);
    if (found.isPro) return refuse('wagr_profile_is_pro');
    const db = factory(config.url, config.serviceKey);
    const caller = await db.from('user_profiles').select('pro_verified_at').eq('id', userId).single();
    if (caller.error) throw caller.error;
    if (caller.data.pro_verified_at !== null) return refuse('caller_is_pro');
    const existing = await db.from('amateur_rank_links').select('status').eq('user_id', userId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data && ['pending', 'verified'].includes(existing.data.status)) return refuse('already_linked');
    if (existing.data?.status === 'rejected') {
      const removed = await db.from('amateur_rank_links').delete().eq('user_id', userId).eq('status', 'rejected');
      if (removed.error) throw removed.error;
    }
    const inserted = await db.from('amateur_rank_links').insert({ user_id: userId, wagr_player_id: parsed.playerId, wagr_slug: parsed.slug, wagr_name: found.name, wagr_country: found.countryName, status: 'pending' }).select().single();
    if (inserted.error) {
      if (inserted.error.code === '23505' && `${inserted.error.message} ${inserted.error.details}`.includes('amateur_rank_links_player_live')) return refuse('claimed_by_another');
      if (inserted.error.code === '23505') return refuse('already_linked');
      throw inserted.error;
    }
    return reply(inserted.data);
  } catch (error) { return reply({ error: error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'WAGR lookup failed' }, 502); }
}
if (import.meta.main) Deno.serve(req => handler(req));