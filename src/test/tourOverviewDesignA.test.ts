import { describe, expect, it } from 'vitest';
import { formatOverviewDateRange, getOverviewCountdown } from '@/features/tourhub/components/overview-v3/HybridHero';
import { detectTopTie, fmtScore } from '@/features/tourhub/components/overview-v3/HybridHero.utils';
import { shouldShowOverviewBoard } from '@/features/tourhub/components/overview-v3/HybridHeroBands/HeroBoardBand';
import { isAlsoThisWeek, statusFor } from '@/features/tourhub/overview/sections/AlsoThisWeek';
import type { HeroSlide } from '@/features/tourhub/hooks/useHeroCarouselData';

const NOW = new Date('2026-09-17T12:00:00Z');

describe('Tour Overview Design A hero facts', () => {
  it('uses days and hours under 48 hours out', () => {
    expect(getOverviewCountdown('2026-09-19T11:00:00Z', NOW)).toEqual([
      { value: 1, label: 'days' },
      { value: 23, label: 'hours' },
    ]);
  });

  it('uses one days box at least 48 hours out', () => {
    expect(getOverviewCountdown('2026-09-19T15:00:00Z', NOW)).toEqual([
      { value: 2, label: 'days' },
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

  it('formats compact same-month and cross-month date ranges', () => {
    expect(formatOverviewDateRange('2026-09-17', '2026-09-20')).toBe('17–20 Sep');
    expect(formatOverviewDateRange('2026-09-28', '2026-10-01')).toBe('28 Sep – 1 Oct');
  });

  it('formats true-minus scores and detects tied leaders', () => {
    expect(fmtScore(-18)).toBe('−18');
    expect(detectTopTie([{ score: -18 }, { score: -18 }, { score: -17 }])).toEqual({ count: 2, score: '−18' });
  });

  it('does not invent a tie when the rest of the field merely shares the leader score', () => {
    const rows = [{ position: 1, score: 0 }, { position: 132, score: 0 }];
    expect(rows.filter((row) => row.position === 1)).toHaveLength(1);
  });
});

function slide(type: HeroSlide['type'], startDate: string): HeroSlide {
  return { type, tournament: { id: 't', startDate, currentRound: null } } as HeroSlide;
}

describe('Tour Overview correctness gates', () => {
  it('withholds level-par field-order rows until a position or score is posted', () => {
    expect(shouldShowOverviewBoard([{ position: null, score: 0 }, { position: null, score: 0 }])).toBe(false);
    expect(shouldShowOverviewBoard([{ position: 1, score: 0 }])).toBe(true);
    expect(shouldShowOverviewBoard([{ position: null, score: -1 }])).toBe(true);
  });

  it('keeps Also This Week inside the coming Sunday', () => {
    expect(isAlsoThisWeek(slide('upcoming', '2026-09-20T20:00:00Z'), NOW)).toBe(true);
    expect(isAlsoThisWeek(slide('upcoming', '2026-09-21T00:00:00Z'), NOW)).toBe(false);
    expect(isAlsoThisWeek(slide('live', '2026-09-10T00:00:00Z'), NOW)).toBe(true);
  });

  it('shows weekday alone beyond 24 hours and adds time inside 24 hours', () => {
    expect(statusFor(slide('upcoming', '2026-09-19T15:00:00Z'), NOW)).toBe('Starts Saturday');
    expect(statusFor(slide('upcoming', '2026-09-17T15:42:00Z'), NOW)).toContain('15:42');
  });
});
