/* BRIEF — PICKS FIELD CHECK: pre-tournament tee-sheet branch keyed on player_id. */
import { afterEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ field: [] as string[], board: [] as Array<{ player_id: string; status: string | null }> }));
vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    const result = () => {
      if (table === 'sr_leaderboards') return { data: db.board, error: null };
      if (table === 'sr_tee_times') return { data: [{ id: 'tt1' }], error: null };
      return { data: db.field.map((id) => ({ player_id: id, sr_players: { sr_id: `sr-${id}` } })), error: null };
    };
    const q: any = { select: () => q, eq: () => q, in: () => q, then: (r: (v: unknown) => unknown) => Promise.resolve(result()).then(r) };
    return q;
  };
  return { supabase: { from: (t: string) => chain(t) } };
});

import { validatePicksAgainstField } from '@/features/tourhub/hooks/useAIPredictions';

const fieldOf = (n: number, extra: string[] = []) => [...Array.from({ length: n }, (_, i) => `f${i}`), ...extra];
const preds = () => ({
  topContenders: [{ playerId: 'a', rank: 1 }, { playerId: 'b', rank: 2 }, { playerId: 'c', rank: 3 }],
  darkHorses: [{ playerId: 'alt1' }],
  courseAnalysis: null,
  confidence: 1,
});

describe('validatePicksAgainstField — tee-sheet branch', () => {
  afterEach(() => { vi.restoreAllMocks(); db.board = []; });
  it('marks a pick missing from a 20+ tee sheet as withdrawn and promotes an alternate', async () => {
    db.field = fieldOf(20, ['a', 'b', 'alt1']);
    const out: any = await validatePicksAgainstField('t', preds());
    expect(out.topContenders.map((p: any) => p.playerId)).toEqual(['a', 'b', 'alt1']);
    expect(out.topContenders[2].promoted).toBe(true);
    expect(out.withdrawnPicks.map((p: any) => p.playerId)).toEqual(['c']);
    expect(out.withdrawnPicks[0].withdrawnStatus).toBe('WD');
  });
  it('with none of the contenders found returns the predictions unchanged and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    db.field = fieldOf(25);
    const p = preds();
    const out = await validatePicksAgainstField('t', p);
    expect(out).toBe(p);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

const boardOf = (n: number, rows: Array<{ player_id: string; status: string | null }>) =>
  [...Array.from({ length: n }, (_, i) => ({ player_id: `f${i}`, status: 'active' })), ...rows];

describe('validatePicksAgainstField — leaderboard branch', () => {
  afterEach(() => { vi.restoreAllMocks(); db.board = []; });
  it('locked: a WD pick stays in place with withdrawnStatus WD, nothing promoted, order unchanged', async () => {
    db.board = boardOf(20, [{ player_id: 'a', status: 'active' }, { player_id: 'b', status: 'wd' }, { player_id: 'c', status: 'active' }, { player_id: 'alt1', status: 'active' }]);
    const out: any = await validatePicksAgainstField('t', preds(), false);
    expect(out.topContenders.map((p: any) => p.playerId)).toEqual(['a', 'b', 'c']);
    expect(out.topContenders[1].withdrawnStatus).toBe('WD');
    expect(out.topContenders.some((p: any) => p.promoted)).toBe(false);
    expect(out.withdrawnPicks.map((p: any) => p.playerId)).toEqual(['b']);
  });
  it('locked: a DQ pick is marked DQ in place', async () => {
    db.board = boardOf(20, [{ player_id: 'a', status: 'DQ' }, { player_id: 'b', status: null }, { player_id: 'c', status: 'active' }]);
    const out: any = await validatePicksAgainstField('t', preds(), false);
    expect(out.topContenders[0]).toMatchObject({ playerId: 'a', withdrawnStatus: 'DQ' });
  });
  it('open with leaderboard rows: a WD pick is replaced by an alternate', async () => {
    db.board = boardOf(20, [{ player_id: 'a', status: 'active' }, { player_id: 'b', status: 'WD' }, { player_id: 'c', status: 'active' }, { player_id: 'alt1', status: 'active' }]);
    const out: any = await validatePicksAgainstField('t', preds(), true);
    expect(out.topContenders.map((p: any) => p.playerId)).toEqual(['a', 'c', 'alt1']);
    expect(out.topContenders[2].promoted).toBe(true);
    expect(out.withdrawnPicks[0]).toMatchObject({ playerId: 'b', withdrawnStatus: 'WD' });
  });
  it('matches statuses on player_id', async () => {
    db.board = [{ player_id: 'c', status: 'WD' }];
    const out: any = await validatePicksAgainstField('t', preds(), false);
    expect(out.topContenders[2].withdrawnStatus).toBe('WD');
  });
  it('no contender among 20+ rows returns the predictions unchanged with one warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    db.board = boardOf(25, []);
    const p = preds();
    expect(await validatePicksAgainstField('t', p, false)).toBe(p);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
