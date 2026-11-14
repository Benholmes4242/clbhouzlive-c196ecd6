/** Match OWGR's internal/service/admin branches without importing another
 * function's directory. Internal header presence never falls through to JWT. */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { requireInternalSecret } from './internalAuth.ts';
export type WagrClientFactory = (url: string, key: string, token?: string) => SupabaseClient;
export const makeClient: WagrClientFactory = (url, key, token) => createClient(url, key, { auth: { persistSession: false }, ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}) });
export function configuration() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  return url && serviceKey && anonKey ? { url, serviceKey, anonKey } : null;
}
export async function syncAuth(req: Request, headers: Record<string, string>, factory: WagrClientFactory = makeClient): Promise<Response | null> {
  if (req.headers.has('x-internal-secret')) return requireInternalSecret(req, headers);
  const reply = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  const config = configuration();
  if (!config) return reply('Sync configuration unavailable', 503);
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply('Unauthorized', 401);
  if (token === config.serviceKey) return null;
  const scoped = factory(config.url, config.anonKey, token);
  if ((await scoped.auth.getUser(token)).error) return reply('Admin access required', 403);
  const admin = await scoped.rpc('is_admin');
  return !admin.error && admin.data === true ? null : reply('Admin access required', 403);
}