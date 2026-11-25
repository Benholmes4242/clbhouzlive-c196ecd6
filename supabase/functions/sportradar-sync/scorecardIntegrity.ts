/** Nightly scorecard integrity check (internal-secret action). Finds finished
 * events of the last 21 days whose stored cards disagree with the leaderboard
 * (missing card, fewer than 18 played holes, or to-par sum ≠ round score) and
 * re-pulls only those rounds, one at a time, within a 120-second budget.
 * Rounds not reached carry over to the next run; no schedule is created here. */
import { getTourSlug } from '../_shared/tourSlug.ts';
import { isRetiredTourName } from '../_shared/tourRetirement.ts';

export const INTEGRITY_BUDGET_MS = 120_000;
const PAGE = 1000;

async function pageAll(build: (from: number, to: number) => any): Promise<any[]> {
  const out: any[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return out;
  }
}

export function badRounds(leaderboard: any[], cards: any[]): Map<number, number> {
  const agg = new Map<string, { holes: number; toPar: number }>();
  for (const c of cards) {
    if (!(c.strokes > 0)) continue;
    const k = `${c.player_id}:${c.round_number}`;
    const a = agg.get(k) ?? { holes: 0, toPar: 0 };
    a.holes++; a.toPar += c.strokes - (c.par ?? 0);
    agg.set(k, a);
  }
  const bad = new Map<number, number>();
  for (const row of leaderboard) {
    for (const r of [1, 2, 3, 4]) {
      const score = row[`round_${r}`];
      if (score === null || score === undefined) continue;
      const a = agg.get(`${row.player_id}:${r}`);
      if (!a || a.holes < 18 || a.toPar !== score) bad.set(r, (bad.get(r) ?? 0) + 1);
    }
  }
  return bad;
}

export async function runScorecardIntegrity(
  supabase: any,
  resync: (tour: string, year: number, srId: string, round: number) => Promise<unknown>,
  now = new Date(),
  clock: () => number = Date.now,
  budgetMs = INTEGRITY_BUDGET_MS,
) {
  const started = clock();
  const since = new Date(now.getTime() - 21 * 86400000).toISOString().slice(0, 10);
  const { data, error } = await supabase.from('sr_tournaments')
    .select('id, sr_id, name, season:sr_seasons!inner(tour_name, year)')
    .in('status', ['closed', 'completed', 'complete'])
    .gte('start_date', since).lte('start_date', now.toISOString().slice(0, 10))
    .order('start_date', { ascending: true });
  if (error) throw error;
  const events = (data ?? []).filter((e: any) => !isRetiredTourName(e.season?.tour_name ?? ''));
  let bad_player_rounds_before = 0, rounds_resynced = 0, carried_over = 0;
  const queue: Array<{ tour: string; year: number; srId: string; round: number }> = [];
  for (const e of events) {
    const tour = getTourSlug(e.season?.tour_name || 'pga');
    const leaderboard = await pageAll((f, t) => supabase.from('sr_leaderboards')
      .select('id, player_id, round_1, round_2, round_3, round_4').eq('tournament_id', e.id).order('id').range(f, t));
    const cards = await pageAll((f, t) => supabase.from('sr_scorecards')
      .select('id, player_id, round_number, strokes, par').eq('tournament_id', e.id).gt('strokes', 0).order('id').range(f, t));
    const bad = badRounds(leaderboard, cards);
    for (const [round, n] of [...bad.entries()].sort((a, b) => a[0] - b[0])) {
      bad_player_rounds_before += n;
      if (tour) queue.push({ tour, year: e.season.year, srId: e.sr_id, round });
    }
  }
  for (const item of queue) {
    if (clock() - started >= budgetMs) { carried_over++; continue; }
    await resync(item.tour, item.year, item.srId, item.round);
    rounds_resynced++;
  }
  return { checked_tournaments: events.length, bad_player_rounds_before, rounds_resynced, carried_over };
}
