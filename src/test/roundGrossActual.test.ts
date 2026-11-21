import { describe, expect, it } from 'vitest';
import { actualRoundGross, holeStrokes } from '../../supabase/functions/gam-evaluator/roundGross';
import { holeMarkGrade } from '@/features/tourhub/leaderboard/BoardRound';

const completeCard = () => Array.from({ length: 18 }, (_, i) => ({
  hole_no: i + 1, played: true, actual_gross: i < 6 ? 3 : 4,
  adjusted_gross: i === 17 ? 3 : i < 6 ? 3 : 4,
}));

describe('actual scored gross', () => {
  it('(a) a complete 18-hole actual 66 / adjusted 65 card returns 66', () => {
    expect(actualRoundGross({ total_holes: 18, actual_gross: null, adjusted_gross: 65 }, completeCard())).toBe(66);
  });
  it('(b) a missing actual hole falls back to score actual, then adjusted', () => {
    const holes = completeCard().map((h, i) => ({ ...h, actual_gross: i === 17 ? null : h.actual_gross }));
    expect(actualRoundGross({ total_holes: 18, actual_gross: 66, adjusted_gross: 65 }, holes)).toBe(66);
    expect(actualRoundGross({ total_holes: 18, actual_gross: null, adjusted_gross: 65 }, holes)).toBe(65);
  });
  it('(c) actual 6 / adjusted 5 on par 4 is six strokes and a double, not bogey', () => {
    const strokes = holeStrokes({ actual_gross: 6, adjusted_gross: 5 });
    expect(strokes).toBe(6);
    expect((strokes ?? 0) - 4).toBe(2);
    expect(holeMarkGrade(strokes, 4)).toBe('double');
  });
  it('(d) a hole-in-one stays one actual stroke', () => {
    expect(holeStrokes({ actual_gross: 1, adjusted_gross: 3 })).toBe(1);
  });
});