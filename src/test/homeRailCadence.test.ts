import { describe, it, expect } from 'vitest';
import { homeRailAfter, HOME_RAIL_CADENCE } from '@/components/feed/homeRailCadence';

describe('homeRailAfter', () => {
  it('first rail lands after card 6, then every 6', () => {
    expect(HOME_RAIL_CADENCE).toEqual({ first: 6, every: 6 });
    const slots = Array.from({ length: 40 }, (_, i) => i).filter((i) => homeRailAfter(i));
    expect(slots).toEqual([5, 11, 17, 23, 29, 35]);
  });
  it('orders featured, club week, standing, then alternates', () => {
    expect([5, 11, 17, 23, 29, 35].map(homeRailAfter)).toEqual([
      'featuredRound', 'clubWeek', 'standing', 'clubWeek', 'standing', 'clubWeek',
    ]);
  });
  it('round of the week appears once', () => {
    const kinds = Array.from({ length: 200 }, (_, i) => homeRailAfter(i));
    expect(kinds.filter((k) => k === 'featuredRound')).toHaveLength(1);
  });
  it('is a pure function of the card index (stable across pages)', () => {
    expect(homeRailAfter(5)).toBe(homeRailAfter(5));
    expect(homeRailAfter(4)).toBeNull();
  });
});
