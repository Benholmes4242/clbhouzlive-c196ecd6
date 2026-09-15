/**
 * BRIEF_ROUND_SHEET §1.3 — A SEED IS A WHOLE ROUND OR IT IS NOTHING.
 *
 * A part-scored seed would draw a card the member never played, so the sheet
 * falls back to today's skeleton instead of guessing.
 */
import { describe, expect, it } from 'vitest';
import { seedIsWhole } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';

const holes = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ holeNo: i + 1, par: 4, strokes: 4 }));

const seed = (h: { holeNo: number; par: number | null; strokes: number | null }[]) => ({
  scoreId: 's', holes: h, gross: null, toPar: null, courseName: 'Sundridge Park',
});

describe('seedIsWhole', () => {
  it('admits a full eighteen and a full nine', () => {
    expect(seedIsWhole(seed(holes(18)))).toBe(true);
    expect(seedIsWhole(seed(holes(9)))).toBe(true);
  });

  it('rejects a part round, a missing stroke and a missing par', () => {
    expect(seedIsWhole(seed(holes(14)))).toBe(false);
    expect(seedIsWhole(seed([...holes(17), { holeNo: 18, par: 4, strokes: null }]))).toBe(false);
    expect(seedIsWhole(seed([...holes(17), { holeNo: 18, par: null, strokes: 5 }]))).toBe(false);
  });

  it('rejects nothing at all', () => {
    expect(seedIsWhole(null)).toBe(false);
    expect(seedIsWhole(undefined)).toBe(false);
  });
});
