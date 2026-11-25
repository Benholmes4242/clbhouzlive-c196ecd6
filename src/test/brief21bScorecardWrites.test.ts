import { describe, it, expect, vi } from 'vitest';
import { syncScorecardsWith } from '../../supabase/functions/sportradar-sync/scorecards';

function fakeDb() {
  const store = new Map<string, any>();
  const upserts: any[][] = [];
  const db = {
    from(table: string) {
      const q: any = {
        select: () => q, eq: () => q, insert: () => q, update: () => q,
        maybeSingle: async () => ({ data: table === 'sr_tournaments' ? { id: 't1' } : { id: 'p1' } }),
        upsert: async (rows: any[]) => { upserts.push(rows); for (const r of rows) store.set(`${r.round_number}:${r.hole_number}`, r); return { error: null }; },
        then: (res: any) => Promise.resolve({ error: null }).then(res),
      };
      return q;
    },
  };
  return { db, store, upserts };
}
const holes = (played: number) => Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4, strokes: i < played ? 4 : 0 }));
const deps = (h: any[]) => ({ fetchJson: vi.fn(async () => ({ players: [{ player: { id: 'sr:p1' }, scores: h }] })), baseUrl: () => 'https://x' });

describe('Brief 21B B — scorecard writes', () => {
  it('holes 10–18 with strokes 0 are stored as null, par kept', async () => {
    const { db, store } = fakeDb();
    await syncScorecardsWith(db, deps(holes(9)), 'pga', 2026, 'sr:t', 'rounds', 3);
    expect(store.get('3:9')).toMatchObject({ strokes: 4, score_to_par: 0 });
    for (let n = 10; n <= 18; n++) expect(store.get(`3:${n}`)).toMatchObject({ strokes: null, score_to_par: null, par: 4 });
  });
  it('one upsert call per player per round, and records count rows', async () => {
    const { db, upserts } = fakeDb();
    const r = await syncScorecardsWith(db, deps(holes(18)), 'pga', 2026, 'sr:t', 'rounds', 3);
    expect(upserts).toHaveLength(1);
    expect(upserts[0]).toHaveLength(18);
    expect(r.records).toBe(18);
  });
  it('the final pull of the same round overwrites the nulls with real strokes', async () => {
    const { db, store } = fakeDb();
    await syncScorecardsWith(db, deps(holes(9)), 'pga', 2026, 'sr:t', 'rounds', 3);
    await syncScorecardsWith(db, deps(holes(18)), 'pga', 2026, 'sr:t', 'rounds', 3);
    for (let n = 1; n <= 18; n++) expect(store.get(`3:${n}`)).toMatchObject({ strokes: 4, score_to_par: 0 });
  });
});
