import { describe, it, expect } from 'vitest';
/* clubWeek and standing were removed from the Clubhouse feed. The cadence
   machinery (HOME_RAIL_CADENCE, homeRailOrdinalAfter) was kept deliberately
   rather than collapsed, so past the first slot a rail slot existing with no
   kind to fill it is the expected state, not a broken rhythm. */
import { homeRailAfter, homeRailKindFor, homeRailOrdinalAfter, HOME_RAIL_CADENCE } from '@/components/feed/homeRailCadence';

describe('homeRailAfter', () => {
  it('first rail lands after card 6, then every 6', () => {
    expect(HOME_RAIL_CADENCE).toEqual({ first: 6, every: 6 });
    expect([5, 11, 17, 23].map(homeRailOrdinalAfter)).toEqual([0, 1, 2, 3]);
    expect(homeRailOrdinalAfter(4)).toBeNull(); // not a slot
  });
  it("the week's pick is the only rail and appears only at the first slot", () => {
    expect(homeRailKindFor(0)).toBe('featuredRound');
    expect([1, 2, 3, 4].map(homeRailKindFor)).toEqual([null, null, null, null]); // slot, no kind
    expect(homeRailAfter(5)).toBe('featuredRound');
    expect([11, 17, 23, 29, 35].map(homeRailAfter)).toEqual([null, null, null, null, null]);
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

describe('homeRailOrdinalAfter (analytics pos)', () => {
  it('is the rail ordinal, not a card count', () => {
    expect([5, 11, 17].map(homeRailOrdinalAfter)).toEqual([0, 1, 2]);
  });
});
