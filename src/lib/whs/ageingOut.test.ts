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
    // Without the 2.0: 10..17 = 108/8 = 13.5
    expect(a.settleAt).toBe(13.5);
    expect(a.expiring.id).toBe('r19');
    expect(a.inRounds).toBe(1);
    expect(a.isBest).toBe(true);
    expect(a.replacement).toBe(17);
    // 10..16 + c must stay at or below 11.6 at one decimal: c = 2 → gross 72
    expect(a.holdGross).toBe(72);
    expect(a.repeat).toEqual({ gross: 73, times: 2 });
  });

  it('renders nothing below twenty rounds', () => {
    expect(deriveAgeingOut(twenty(2).slice(0, 19), 11.6, course)).toBeNull();
  });

  it('renders nothing when the expiring round is not counting', () => {
    expect(deriveAgeingOut(twenty(40, false), 13.5, course)).toBeNull();
  });

  it('renders nothing when the rise is 0.05 or less', () => {
    // Oldest 17 ties the replacement: settle equals today
    expect(deriveAgeingOut(twenty(17), 13.5, course)).toBeNull();
  });
});
