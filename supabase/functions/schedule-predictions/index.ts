import { corsFor } from '../_shared/cors.ts';
/**
 * schedule-predictions — cron fan-out for tournament predictions.
 *
 * WHY THIS EXISTS
 *  generate-predictions was only ever invoked from the client (Tour Hub), so
 *  predictions existed for the weeks somebody happened to look and nowhere
 *  else. This job runs on a schedule (Wednesday 20:00 UTC) and posts ONCE PER
 *  TOURNAMENT ID for every tournament starting in the next two days.
 *
 * WHY EXPLICIT IDS
 *  generate-predictions has no batch form, and its default picker (used when
 *  no tournamentId is passed) only considers the PGA and Euro seasons — rely
 *  on it and LIV, LPGA, Champions and Korn Ferry never get predictions at all.
 *
 * WHY TWO DAYS
 *  Champions Tour events start on FRIDAY. A one-day window misses them.
 *
 * IDEMPOTENCY
 *  forceRegenerate is NEVER passed. generate-predictions returns the stored
 *  row when logic_version is current, so a second fire in the same week writes
 *  no duplicate predictions and costs nothing. ti_generation_locks is keyed per
 *  tournament, so parallel invocations for different tournaments never contend.
 *
 * EVERY INVOCATION IS WRITTEN DOWN
 *  generate-predictions refuses to write when the field pool is under 20
 *  players. A cron that hits that and says nothing rebuilds the exact gap this
 *  job exists to close, so each invocation writes a row to
 *  public.ti_generation_log with its outcome, the field size and the reason.
 *
 * BODY (all optional)
 *  { daysAhead?: number = 2, dryRun?: boolean = false, tournamentIds?: string[] }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

type Outcome =
  | 'generated'
  | 'already_current'
  | 'field_too_small'
  | 'no_confirmed_field'
  | 'locked'
  | 'error'
  | 'dry_run';

const CONCURRENCY = 3;

serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const runId = crypto.randomUUID();

  try {
    let body: any = {};
    try { body = await req.json(); } catch { /* cron may send no body */ }

    const daysAhead: number = Number.isFinite(body?.daysAhead) ? Number(body.daysAhead) : 2;
    const dryRun: boolean = body?.dryRun === true;
    const explicitIds: string[] | null = Array.isArray(body?.tournamentIds) && body.tournamentIds.length
      ? body.tournamentIds
      : null;

    // ── Window: today (UTC) through today + daysAhead, inclusive.
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const toDate = new Date(today.getTime());
    toDate.setUTCDate(toDate.getUTCDate() + daysAhead);
    const to = toDate.toISOString().slice(0, 10);

    let query = supabase
      .from('sr_tournaments')
      .select('id, name, start_date, end_date, status, season_id, sr_seasons(tour_id, tour_name)')
      .order('start_date', { ascending: true });

    query = explicitIds
      ? query.in('id', explicitIds)
      : query.gte('start_date', from).lte('start_date', to);

    const { data: tournaments, error: tErr } = await query;
    if (tErr) throw tErr;

    const list = (tournaments ?? []).filter((t: any) => t.status !== 'closed' && t.status !== 'cancelled');

    console.log(
      `[schedule-predictions] run=${runId} window=${from}..${to} tournaments=${list.length}`,
    );

    // ── Field size per tournament, recorded whatever the outcome.
    async function fieldCount(tournamentId: string): Promise<number> {
      const { data: teeTimes } = await supabase
        .from('sr_tee_times')
        .select('id')
        .eq('tournament_id', tournamentId);
      const ids = (teeTimes ?? []).map((r: any) => r.id);
      if (!ids.length) return 0;
      const players = new Set<string>();
      for (let i = 0; i < ids.length; i += 200) {
        const { data: rows } = await supabase
          .from('sr_tee_time_players')
          .select('player_id')
          .in('tee_time_id', ids.slice(i, i + 200));
        for (const r of rows ?? []) players.add(r.player_id);
      }
      return players.size;
    }

    async function logRow(entry: Record<string, unknown>) {
      const { error } = await supabase.from('ti_generation_log').insert({ run_id: runId, ...entry });
      if (error) console.error('[schedule-predictions] skip-log insert failed:', error.message, entry);
    }

    async function runOne(t: any) {
      const startedAt = Date.now();
      const base = {
        tournament_id: t.id,
        tournament_name: t.name,
        tour_id: t.sr_seasons?.tour_id ?? null,
        tour_name: t.sr_seasons?.tour_name ?? null,
        start_date: t.start_date,
      };
      const field = await fieldCount(t.id);

      if (dryRun) {
        await logRow({ ...base, generated: false, outcome: 'dry_run' as Outcome, field_count: field, detail: 'dry run — no invocation', duration_ms: Date.now() - startedAt });
        return { ...base, outcome: 'dry_run', field_count: field };
      }

      try {
        // ONE POST PER TOURNAMENT ID. No forceRegenerate — ever.
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-predictions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ tournamentId: t.id }),
        });

        const text = await res.text();
        let json: any = {};
        try { json = JSON.parse(text); } catch { /* keep raw text as detail */ }

        let outcome: Outcome;
        let detail = '';
        let generated = false;

        if (!res.ok || json?.success === false && json?.error) {
          outcome = 'error';
          detail = json?.error ?? `HTTP ${res.status}: ${text.slice(0, 300)}`;
        } else if (json?.skipped) {
          const reason = String(json?.reason ?? 'unknown');
          if (reason === 'insufficient field') {
            outcome = 'field_too_small';
            detail = `pool=${json?.poolSize ?? field} (< 20)`;
          } else if (reason === 'no confirmed field') {
            outcome = 'no_confirmed_field';
            detail = 'no tee times or leaderboard entries yet';
          } else if (reason === 'lock timeout') {
            outcome = 'locked';
            detail = 'another invocation held the per-tournament lock';
          } else {
            outcome = 'error';
            detail = `skipped: ${reason}`;
          }
        } else if (json?.cached === true) {
          outcome = 'already_current';
          detail = 'stored row current for this logic_version';
        } else if (json?.success === true) {
          outcome = 'generated';
          generated = true;
          detail = `consensus=${json?.consensusMethod ?? '?'} agreement=${json?.agreementScore ?? '?'}`;
        } else {
          outcome = 'error';
          detail = `unrecognised response: ${text.slice(0, 300)}`;
        }

        const poolSize = typeof json?.poolSize === 'number' ? json.poolSize : field;

        await logRow({
          ...base,
          generated,
          outcome,
          field_count: poolSize,
          detail,
          duration_ms: Date.now() - startedAt,
        });

        console.log(`[schedule-predictions] ${t.name}: ${outcome} (field=${poolSize})`);
        return { ...base, outcome, field_count: poolSize, detail };
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        await logRow({ ...base, generated: false, outcome: 'error' as Outcome, field_count: field, detail, duration_ms: Date.now() - startedAt });
        console.error(`[schedule-predictions] ${t.name}: error — ${detail}`);
        return { ...base, outcome: 'error', field_count: field, detail };
      }
    }

    // Bounded concurrency — the lock is per tournament, so parallel is safe.
    const results: any[] = [];
    for (let i = 0; i < list.length; i += CONCURRENCY) {
      const batch = list.slice(i, i + CONCURRENCY);
      results.push(...(await Promise.all(batch.map(runOne))));
    }

    const summary = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.outcome] = (acc[r.outcome] ?? 0) + 1;
      return acc;
    }, {});

    return new Response(
      JSON.stringify({ success: true, runId, window: { from, to }, dryRun, count: results.length, summary, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[schedule-predictions] fatal:', message);
    return new Response(
      JSON.stringify({ success: false, runId, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
