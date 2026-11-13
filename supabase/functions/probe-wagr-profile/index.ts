/** Disposable, read-only WAGR probe. Only service-role/admin callers qualify;
 * is_admin is the sole database RPC (authentication only). No persistence or
 * scheduling. Requests finish sequentially with a full second between them;
 * honest identification and raw block-page evidence preserve probe fidelity.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

export const bodySchema = z.object({ slug: z.string().regex(/^[a-z0-9-]+-(\d+)$/) }).strict();

const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

type Evidence = {
  url: string;
  status: number | null;
  elapsed_ms: number;
  headers: Record<string, string | null>;
  json?: unknown;
  raw_body?: string;
  error?: string;
  page_props_keys?: string[];
  player_profile_data?: unknown;
};

export async function probeProfile(
  slug: string,
  fetcher: typeof fetch = fetch,
  pause: (ms: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
) {
  const id = slug.match(/-(\d+)$/)?.[1];
  if (!id) throw new Error('Invalid profile slug');
  const base = 'https://worldgolfranking2021api.wagr.com/api/wagr/playerprofile';
  const requests = [
    { url: `https://www.wagr.com/playerprofile/${slug}`, html: true },
    { url: `${base}/getPlayerEvents?profileId=${id}&tab=Counting&pageSize=20&pageNumber=1`, html: false },
    { url: `${base}/getPlayerEvents?profileId=${id}&tab=Counting&pageSize=20&pageNumber=2`, html: false },
    { url: `${base}/getPlayerRankingGraphData?playerId=${id}&minYear=0&maxYear=9999`, html: false },
  ];
  const results: Evidence[] = [];
  for (const [index, request] of requests.entries()) {
    if (index > 0) await pause(1000);
    const start = performance.now();
    const evidence: Evidence = {
      url: request.url, status: null, elapsed_ms: 0,
      headers: { 'content-type': null, 'cache-control': null, server: null, 'server-timing': null },
    };
    try {
      const response = await fetcher(request.url, {
        headers: { 'User-Agent': 'clbhouz-rankings/1.0', Accept: request.html ? 'text/html' : 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      evidence.status = response.status;
      for (const key of Object.keys(evidence.headers)) evidence.headers[key] = response.headers.get(key);
      const raw = await response.text();
      let parsedJson = false;
      try {
        const json = JSON.parse(raw);
        parsedJson = true;
        if (!request.html) evidence.json = json;
      } catch { /* HTML and block pages are retained below. */ }
      if (!response.ok || !parsedJson) evidence.raw_body = raw.slice(0, 2000);
      if (request.html) {
        const script = raw.match(/<script\b(?=[^>]*\bid\s*=\s*["']__NEXT_DATA__["'])[^>]*>([\s\S]*?)<\/script\s*>/i);
        if (!script) evidence.error = '__NEXT_DATA__ script not found';
        else {
          try {
            const next = JSON.parse(script[1]);
            const pageProps = next?.props?.pageProps;
            evidence.page_props_keys = pageProps && typeof pageProps === 'object' ? Object.keys(pageProps) : [];
            evidence.player_profile_data = pageProps?.playerProfileComponent?.playerProfileComponentModel?.playerProfileData ?? null;
            if (evidence.player_profile_data === null) evidence.error = 'playerProfileData not found';
          } catch (error) {
            evidence.error = error instanceof Error ? error.message : 'Invalid __NEXT_DATA__ JSON';
          }
        }
      }
    } catch (error) {
      evidence.error = error instanceof Error ? error.message : 'Request failed';
    }
    evidence.elapsed_ms = Math.round(performance.now() - start);
    results.push(evidence);
  }
  return { slug, id, requests: results };
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  // Match sync-pro-world-rankings' service/JWT/admin branch, without its
  // internal schedule-secret branch: this probe has no scheduled callers.
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !serviceKey || !anonKey) return reply({ error: 'Sync configuration unavailable' }, 503);
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({ error: 'Unauthorized' }, 401);
  const scoped = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const service = token === serviceKey;
  const valid = service ? true : !(await scoped.auth.getUser(token)).error;
  if (!service) {
    if (!valid) return reply({ error: 'Admin access required' }, 403);
    const { data, error } = await scoped.rpc('is_admin');
    if (error || data !== true) return reply({ error: 'Admin access required' }, 403);
  }
  let input: unknown;
  try { input = await req.json(); } catch { return reply({ error: 'Invalid request' }, 400); }
  const body = bodySchema.safeParse(input);
  if (!body.success) return reply({ error: 'Invalid request', details: body.error.flatten() }, 400);
  return reply(await probeProfile(body.data.slug));
}

if (import.meta.main) Deno.serve(handler);