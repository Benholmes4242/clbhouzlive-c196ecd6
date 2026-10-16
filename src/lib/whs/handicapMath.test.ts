import { describe, it, expect } from 'vitest';
import { projectNextRound } from './handicapMath';
import type { WhsScoreWithIndex } from './types';

const round = (day: number, diff: number) =>
  ({
    id: `r${day}`,
    play_date: `2026-01-${String(day).padStart(2, '0')}`,
    handicap_differential: diff,
  }) as unknown as WhsScoreWithIndex;

describe('projectNextRound settled index', () => {
  it('a window of exactly eight rounds has no settled index', () => {
    const eight = [1, 2, 3, 4, 5, 6, 7, 8].map((d, i) => round(i + 1, d));
    const p = projectNextRound(eight, 4.5);
    expect(p.settleAt).toBeNull();
    expect(p.settleAtRaw).toBeNull();
    expect(p.isAtRisk).toBe(false);
  });

  it('a full twenty settles at the mean of the lowest eight of the remaining nineteen', () => {
    // Oldest (1 Jan) is 0.5 and drops off. Remaining nineteen are, by date,
    // 19, 3, 17, 1, 15, 5, 13, 7, 11, 9, 2, 18, 4, 16, 6, 14, 8, 12, 10.
    // Lowest eight: 1, 2, 3, 4, 5, 6, 7, 8 -> sum 36 -> 36 / 8 = 4.5.
    const byDate = [0.5, 19, 3, 17, 1, 15, 5, 13, 7, 11, 9, 2, 18, 4, 16, 6, 14, 8, 12, 10];
    const twenty = byDate.map((d, i) => round(i + 1, d));
    // Current best eight are 0.5, 1..7 -> 28.5 / 8 = 3.5625.
    const p = projectNextRound(twenty, 3.6);
    expect(p.settleAtRaw).toBe(4.5);
    expect(p.settleAt).toBe(4.5);
    expect(p.counterDropping).toBe(true);
    expect(p.isAtRisk).toBe(true);
  });
});
