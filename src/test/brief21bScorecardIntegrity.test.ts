import { describe, it, expect, vi, afterEach } from 'vitest';
import { runScorecardIntegrity } from '../../supabase/functions/sportradar-sync/scorecardIntegrity';
import { gateInternalAction } from '../../supabase/functions/sportradar-sync/internalActions';

const card = (player: string, round: number, toPar: number) => Array.from({ length: 18 }, (_, i) => ({ player_id: player, round_number: round, par: 4, strokes: 4 + (i === 0 ? toPar : 0) }));
function db(events: any[], boards: Record<string, any[]>, cards: Record<string, any[]>) {
  return { from(table: string) {
    let tid = ''; let from = 0; let to = 0;
    const q: any = { select: () => q, in: () => q, gte: () => q, lte: () => q, order: () => q, gt: () => q,
      eq: (_c: string, v: string) => { tid = v; return q; }, range: (f: number, t: number) => { from = f; to = t; return q; },
      then: (res: any) => Promise.resolve(table === 'sr_tournaments' ? { data: events }
        : { data: (table === 'sr_leaderboards' ? boards[tid] : cards[tid] ?? []).slice(from, to + 1) }).then(res) };
    return q; } };
}
const ev = (id: string) => ({ id, sr_id: `sr:${id}`, name: id, season: { tour_name: 'EURO', year: 2026 } });
const lb = (player: string) => ({ player_id: player, round_1: -2, round_2: 0, round_3: -2, round_4: 1 });
const goodCards = (player: string) => [1, 2, 3, 4].flatMap((r) => card(player, r, [-2, 0, -2, 1][r - 1]));

describe('Brief 21B C — nightly scorecard integrity', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('a tournament with one bad round re-pulls exactly that round', async () => {
    const cards = goodCards('p1').map((c) => (c.round_number === 3 && c.strokes === 2 ? { ...c, strokes: -26 + 4 } : c));
    const resync = vi.fn().mockResolvedValue(undefined);
    const r = await runScorecardIntegrity(db([ev('t1')], { t1: [lb('p1')] }, { t1: cards }), resync);
    expect(resync.mock.calls).toEqual([['euro', 2026, 'sr:t1', 3]]);
    expect(r).toEqual({ checked_tournaments: 1, bad_player_rounds_before: 1, rounds_resynced: 1, carried_over: 0 });
  });
  it('a clean tournament re-pulls nothing', async () => {
    const resync = vi.fn();
    const r = await runScorecardIntegrity(db([ev('t1')], { t1: [lb('p1')] }, { t1: goodCards('p1') }), resync);
    expect(resync).not.toHaveBeenCalled();
    expect(r.bad_player_rounds_before).toBe(0);
  });
  it('the budget cut-off carries rounds over', async () => {
    let t = 0; const clock = () => t;
    const resync = vi.fn(async () => { t += 120_000; });
    const r = await runScorecardIntegrity(db([ev('t1')], { t1: [lb('p1')] }, { t1: [] }), resync, new Date(), clock);
    expect(resync).toHaveBeenCalledTimes(1);
    expect(r).toMatchObject({ rounds_resynced: 1, carried_over: 3, bad_player_rounds_before: 4 });
  });
  it('the action refuses without the internal secret', () => {
    vi.stubGlobal('Deno', { env: { get: (k: string) => (k === 'INTERNAL_FN_SECRET' ? 's3cret' : undefined) } });
    const refusal = gateInternalAction(new Request('https://x', { method: 'POST' }), { action: 'scorecard_integrity' }, {});
    expect(refusal?.status).toBe(401);
    const ok = gateInternalAction(new Request('https://x', { method: 'POST', headers: { 'x-internal-secret': 's3cret' } }), { action: 'scorecard_integrity' }, {});
    expect(ok).toBeNull();
    vi.unstubAllGlobals();
  });
});
