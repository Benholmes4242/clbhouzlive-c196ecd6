/**
 * BRIEF_ROUND_PAR_COMPLETENESS_CLIENT — a par summed from an incomplete card is
 * not a par. One rule, shared with the evaluator.
 */
import { describe, expect, it } from 'vitest';
import { roundCoursePar } from '@/lib/whs/api';

const holes = (n: number, opts: { playedTo?: number; falseAt?: number } = {}) =>
  Array.from({ length: n }, (_, i) => ({
    par: 4,
    played: opts.falseAt === i + 1 ? false : (opts.playedTo == null || i + 1 <= opts.playedTo),
  }));

describe('roundCoursePar', () => {
  it('sums a complete eighteen', () => {
    expect(roundCoursePar(holes(18), 18)).toBe(72);
  });

  it('refuses a card walked in after ten of eighteen', () => {
    expect(roundCoursePar(holes(18, { playedTo: 10 }), 18)).toBeNull();
  });

  it('gives a nine-hole round its own par', () => {
    const nine = [4, 4, 4, 3, 5, 4, 4, 3, 4].map((par) => ({ par, played: true }));
    expect(roundCoursePar(nine, 9)).toBe(35);
  });

  it('refuses eighteen rows where one hole was not played', () => {
    expect(roundCoursePar(holes(18, { falseAt: 7 }), 18)).toBeNull();
  });

  it('treats a null played flag as incomplete, and needs a declared length', () => {
    expect(roundCoursePar([{ par: 4, played: null }], 1)).toBeNull();
    expect(roundCoursePar(holes(18), null)).toBeNull();
    expect(roundCoursePar(holes(18), 0)).toBeNull();
  });
});
