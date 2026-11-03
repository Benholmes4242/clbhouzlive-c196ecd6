/** Cron-only poster checks use the two server-owned RPCs; member picks remain server-protected. */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import jpeg from 'npm:jpeg-js@0.4.4';
import { z } from 'npm:zod@3.23.8';
import { candidateTimes, chooseFrame, lumaStats, picturePasses, posterUrl, STREAM_HOST, type FrameChoice } from './pick.ts';

const Body = z.object({ limit: z.number().int().min(1).max(50).default(20), dryRun: z.boolean().default(false) }).strict();
const Rows = z.array(z.object({ media_id: z.string().uuid(), stream_id: z.string().regex(/^[a-zA-Z0-9_-]+$/), duration_seconds: z.number().nullable(), created_at: z.string().datetime({ offset: true }) }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const provided = req.headers.get('x-cron-secret') ?? '';
  const accepted = [Deno.env.get('CRON_SECRET'), Deno.env.get('INTERNAL_FN_SECRET')].filter((v): v is string => !!v);
  if (!accepted.length || !accepted.includes(provided)) return json({ error: 'unauthorized' }, 401);
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  let body: unknown;
  try { const text = await req.text(); body = text ? JSON.parse(text) : {}; }
  catch { return json({ error: 'Invalid JSON' }, 400); }
  const parsed = Body.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten() }, 400);
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return json({ error: 'Service configuration unavailable' }, 500);
  const client = createClient(url, key, { auth: { persistSession: false } });
  const started = Date.now();
  const { data, error } = await client.rpc('posters_to_check', { p_limit: parsed.data.limit });
  if (error) return json({ error: error.message }, 500);
  const rows = Rows.safeParse(data ?? []);
  if (!rows.success) return json({ error: 'Invalid posters_to_check payload' }, 500);
  const report = { checked: 0, changed: 0, kept: 0, notReady: 0, results: [] as ({ media_id: string } & FrameChoice)[] };
  const save = async (id: string, poster: string | null) => {
    if (parsed.data.dryRun) return;
    const { error } = await client.rpc('save_checked_poster', { p_media_id: id, p_poster_url: poster });
    if (error) throw new Error(error.message);
  };
  for (const row of rows.data) {
    if (Date.now() - started >= 90_000) break;
    try {
      const frames: FrameChoice[] = [];
      const times = candidateTimes(row.duration_seconds);
      let unavailable = false;
      for (let i = 0; i < times.length; i++) {
        const time = times[i];
        const response = await fetch(`${STREAM_HOST}/${row.stream_id}/thumbnails/thumbnail.jpg?time=${time}s&height=90&fit=crop`, { signal: AbortSignal.timeout(10_000) });
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (response.status !== 200 || !response.headers.get('content-type')?.startsWith('image/')) {
          if (i === 0) { unavailable = true; break; }
          continue;
        }
        const decoded = jpeg.decode(bytes, { useTArray: true });
        const stats = lumaStats(decoded.data);
        const frame = { time, ...stats, passed: picturePasses(stats) };
        frames.push(frame);
        if (frame.passed) break;
      }
      if (unavailable) {
        report.notReady++;
        if (Date.now() - Date.parse(row.created_at) >= 24 * 3600_000) {
          await save(row.media_id, null); report.checked++; report.kept++;
        }
        continue;
      }
      const choice = chooseFrame(frames);
      await save(row.media_id, choice ? posterUrl(row.stream_id, choice.time) : null);
      report.checked++;
      if (choice) { report.changed++; report.results.push({ media_id: row.media_id, ...choice }); }
      else report.kept++;
    } catch (error) { console.error(JSON.stringify({ media_id: row.media_id, error: String(error) })); }
  }
  console.log(JSON.stringify(report));
  return json(report);
});