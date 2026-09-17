import { describe, expect, it } from 'vitest';
import { getOverviewCountdown } from '@/features/tourhub/components/overview-v3/HybridHero';
import { detectTopTie, fmtScore } from '@/features/tourhub/components/overview-v3/HybridHero.utils';

const NOW = new Date('2026-09-17T12:00:00Z');

describe('Tour Overview Design A hero facts', () => {
  it('uses days and hours at least 24 hours out', () => {
    expect(getOverviewCountdown('2026-09-19T15:00:00Z', NOW)).toEqual([
      { value: 2, label: 'days' },
      { value: 3, label: 'hours' },
    ]);
  });

  it('uses hours and minutes below 24 hours', () => {
    expect(getOverviewCountdown('2026-09-17T15:42:00Z', NOW)).toEqual([
      { value: 3, label: 'hours' },
      { value: 42, label: 'minutes' },
    ]);
  });

  it('uses one minutes box below one hour', () => {
    expect(getOverviewCountdown('2026-09-17T12:38:00Z', NOW)).toEqual([
      { value: 38, label: 'minutes' },
    ]);
  });

  it('withholds an invalid countdown', () => {
    expect(getOverviewCountdown('', NOW)).toEqual([]);
  });

  it('formats true-minus scores and detects tied leaders', () => {
    expect(fmtScore(-18)).toBe('−18');
    expect(detectTopTie([{ score: -18 }, { score: -18 }, { score: -17 }])).toEqual({ count: 2, score: '−18' });
  });
});
