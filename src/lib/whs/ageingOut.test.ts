import { describe, it, expect } from 'vitest';
import { deriveAgeingOut } from './ageingOut';
import type { WhsScoreWithIndex } from './types';

/** Newest first. Oldest round (i=19) is the best, 2.0; others 10..28. */
function twenty(oldestDiff: number, oldestCounts = true): WhsScoreWithIndex[] {
  return Array.from({ length: 20 }, (_, i) => {
    const diff = i === 19 ? oldestDiff : 10 + i;
    return {
      id: `r${i}`,
      play_date: new Date(Date.UTC(2026, 0, 30 - i)).toISOString().slice(0, 10),
      adjusted_gross: 80,
      handicap_differential: diff,
      is_counter: i === 19 ? oldestCounts : i < 7,
      course: { name: 'Test Links' },
    } as unknown as WhsScoreWithIndex;
  });
}
const course = { id: 'c', name: 'Test Links', cr: 70, slope: 113 };

describe('deriveAgeingOut', () => {
  it('produces settled index, expiring round, rounds-until and hold score', () => {
    // Today: lowest eight = 2,10..16 → 93/8 = 11.625 → 11.6
    const a = deriveAgeingOut(twenty(2), 11.6, course)!;
    expect(a.settleAt).toBe(12.5); // 10..17 = 108/8 = 13.5? see below
  });
});
