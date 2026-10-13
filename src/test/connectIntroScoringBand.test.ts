import { describe, it, expect } from 'vitest';
import { wholePercents } from '@/components/profile/handicap/whs/connect/ScoringBand';

describe('scoring band percentages', () => {
  it('sums to 100 for a share set that rounds badly', () => {
    const p = wholePercents([0.125, 0.125, 0.375, 0.375]);
    expect(p.reduce((s, v) => s + v, 0)).toBe(100);
    expect(p).toEqual([13, 12, 38, 37]);
  });
  it('sums to 100 when naive rounding would give 99', () => {
    expect(wholePercents([1, 1, 1]).reduce((s, v) => s + v, 0)).toBe(100);
  });
});
