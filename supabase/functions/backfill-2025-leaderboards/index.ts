// One-time backfill: fetch leaderboards for all closed 2025 tournaments
// that currently have zero rows in sr_leaderboards. Idempotent.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const TOUR_SLUG_MAP: Record<string, string> = {
  pga: 'pga',
  euro: 'euro',
  dp: 'euro',
  'dp world': 'euro',
  champ: 'champ',
  champions: 'champ',
  pgad: 'pgad',
  korn: 'pgad',
  'korn ferry': 'pgad',
  liv: 'liv',
  lpga: 'lpga',
};

function mapTourSlug(tourName: string): string | null {
  const key = (tourName || '').trim().toLowerCase();
  if (TOUR_SLUG_MAP[key]) return TOUR_SLUG_MAP[key];
  const first = key.split(/\s+/)[0];
  return TOUR_SLUG_MAP[first] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let body: any = {};
    try { body = await req.json(); } catch { /* empty */ }
    const year: number = body.year ?? 2025;
    const tourFilter: string | null = body.tour ?? null;
    const limit: number = body.limit ?? 500;
    const delayMs: number = body.delayMs ?? 1300;
    const dryRun: boolean = !!body.dryRun;

    const { data: tournaments, error: tErr } = await supabase
      .from('sr_tournaments')
      .select('id, sr_id, name, status, start_date, sr_seasons!inner(year, tour_name)')
      .eq('status', 'closed')
      .eq('sr_seasons.year', year)
      .order('start_date', { ascending: true })
      .limit(2000);

    if (tErr) {
      return new Response(JSON.stringify({ error: tErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ids = (tournaments ?? []).map((t: any) => t.id);
    const { data: lbCounts } = await supabase
      .from('sr_leaderboards')
      .select('tournament_id')
      .in('tournament_id', ids);
    const counts = new Map<string, number>();
    for (const r of lbCounts ?? []) {
      counts.set((r as any).tournament_id, (counts.get((r as any).tournament_id) ?? 0) + 1);
    }

    const candidates = (tournaments ?? [])
      .filter((t: any) => (counts.get(t.id) ?? 0) === 0)
      .map((t: any) => ({
        id: t.id,
        sr_id: t.sr_id,
        name: t.name,
        tour_name: t.sr_seasons?.tour_name,
        slug: mapTourSlug(t.sr_seasons?.tour_name ?? ''),
      }))
      .filter((t: any) => {
        if (!t.slug || !t.sr_id) return false;
        if (tourFilter && t.slug !== tourFilter.toLowerCase()) return false;
        return true;
      })
      .slice(0, limit);

    if (dryRun) {
      return new Response(JSON.stringify({
        year, totalCandidates: candidates.length,
        sample: candidates.slice(0, 10),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: any[] = [];
    let ok = 0, fail = 0;

    for (const t of candidates) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/sportradar-sync`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'leaderboard',
            tour: t.slug,
            year,
            tournamentId: t.sr_id,
          }),
        });
        const json = await res.json().catch(() => ({}));
        const success = res.ok && (json?.success ?? json?.records !== undefined);
        if (success) ok++; else fail++;
        results.push({
          name: t.name, tour: t.slug, sr_id: t.sr_id,
          status: res.status, ok: success,
          records: json?.records ?? json?.recordsSynced ?? null,
          error: success ? null : (json?.error ?? json?.message ?? null),
        });
      } catch (e: any) {
        fail++;
        results.push({ name: t.name, tour: t.slug, sr_id: t.sr_id, ok: false, error: String(e?.message ?? e) });
      }
      await new Promise(r => setTimeout(r, delayMs));
    }

    return new Response(JSON.stringify({
      year, attempted: candidates.length, ok, fail, results,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[backfill-2025-leaderboards] fatal:', e);
    return new Response(JSON.stringify({
      error: String(e?.message ?? e),
      stack: String(e?.stack ?? '').split('\n').slice(0, 5).join('\n'),
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
