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

import { settleAfterRounds, MAX_REPEATS } from './ageingOut';
import { projectNextRound } from './handicapMath';

describe('3A amendment', () => {
  it('C1: settleAfterRounds(1) equals projectNextRound settleAtRaw', () => {
    const w = twenty(2);
    const oldestFirst = [...w].reverse().map((r) => r.handicap_differential as number);
    expect(settleAfterRounds(oldestFirst, 1)).toBe(projectNextRound(w, 11.6).settleAtRaw);
    expect(settleAfterRounds(oldestFirst, 13)).toBeNull();
  });

  it('C5: 72 holds in one, 73 holds in two; repeat limit five', () => {
    const a = deriveAgeingOut(twenty(2), 11.6, course)!;
    expect(a.holdGross).toBe(72);
    expect(a.repeat).toEqual({ gross: 73, times: 2 });
    expect(MAX_REPEATS).toBe(5);
  });

  it('C8: counter three rounds deep moves N, settle and replacement together', () => {
    // Oldest two (i=19,18) are non-counters at 40/41; i=17 is a 2.0 counter.
    const rounds = twenty(40, false).map((r, i) => {
      if (i === 18) return { ...r, handicap_differential: 41, is_counter: false };
      if (i === 17) return { ...r, handicap_differential: 2, is_counter: true };
      return r;
    }) as WhsScoreWithIndex[];
    // Today: 2,10..16 = 93/8 → 11.6. After 3 leave: 10..17 → 13.5.
    const a = deriveAgeingOut(rounds, 11.6, course)!;
    expect(a.inRounds).toBe(3);
    expect(a.expiring.id).toBe('r17');
    expect(a.settleAt).toBe(13.5);
    expect(a.replacement).toBe(17);
  });
});

import { indexFromDifferentials } from './coursePlay';

describe('3B amendment', () => {
  const c8 = () =>
    twenty(40, false).map((r, i) => {
      if (i === 18) return { ...r, handicap_differential: 41, is_counter: false };
      if (i === 17) return { ...r, handicap_differential: 2, is_counter: true };
      return r;
    }) as WhsScoreWithIndex[];
  const after = (newDiffs: number[]) => {
    const oldestFirst = [...c8()].reverse().map((r) => r.handicap_differential as number);
    const idx = indexFromDifferentials([...oldestFirst.slice(newDiffs.length), ...newDiffs]);
    return Math.round(idx! * 10) / 10;
  };

  it('D3: rounds that fail to beat the expiring 2.0 but make the eight do NOT land at settle', () => {
    const a = deriveAgeingOut(c8(), 11.6, course)!;
    expect(after([12, 13, 14])).toBe(12.4);
    expect(after([12, 13, 14])).not.toBe(a.settleAt);
  });

  it('D3: rounds worse than the replacement differential land at settle', () => {
    const a = deriveAgeingOut(c8(), 11.6, course)!;
    expect(after([a.replacement + 1, a.replacement + 2, a.replacement + 3])).toBe(a.settleAt);
  });

  it('D4/D5: C8 figures with the hold line', () => {
    const a = deriveAgeingOut(c8(), 11.6, course)!;
    expect(a.inRounds).toBe(3);
    expect(a.expiring.handicap_differential).toBe(2);
    expect(a.replacement).toBe(17);
    expect(a.settleAt).toBe(13.5);
    expect(a.holdGross).toBe(72);
  });
});
