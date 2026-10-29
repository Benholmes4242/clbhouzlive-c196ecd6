/* BRIEF — PICKS FIELD CHECK: pre-tournament tee-sheet branch keyed on player_id. */
import { afterEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({ field: [] as string[] }));
vi.mock('@/integrations/supabase/client', () => {
  const chain = (table: string) => {
    const result = () => {
      if (table === 'sr_leaderboards') return { data: [], error: null };
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
  afterEach(() => vi.restoreAllMocks());
  it('marks a pick missing from a 20+ tee sheet as withdrawn and promotes an alternate', async () => {
    db.field = fieldOf(20, ['a', 'b', 'alt1']);
    const out: any = await validatePicksAgainstField('t', preds());
    expect(out.topContenders.map((p: any) => p.playerId)).toEqual(['a', 'b', 'alt1']);
    expect(out.topContenders[2].promoted).toBe(true);
    expect(out.withdrawnPicks.map((p: any) => p.playerId)).toEqual(['c']);
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
