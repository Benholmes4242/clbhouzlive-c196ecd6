import { describe, it, expect } from 'vitest';
import { shareCourseName } from '@/lib/courses/shareCourseName';

/** BRIEF_TOP_TEN_SHARE_CARD_V2 §2 — every example from the brief, verbatim. */
describe('shareCourseName', () => {
  it('reads the variant from a final " - " and strips a trailing suffix', () => {
    expect(shareCourseName('Trump Turnberry Resort - Ailsa')).toEqual({ short: 'Trump Turnberry', variant: 'Ailsa' });
  });

  it('reads the variant from trailing brackets and strips " Golf Club"', () => {
    expect(shareCourseName('Royal County Down Golf Club (Championship)')).toEqual({ short: 'Royal County Down', variant: 'Championship' });
  });

  it('strips " Golf and Country Club" longest-first', () => {
    expect(shareCourseName('Monte Rei Golf and Country Club (North)')).toEqual({ short: 'Monte Rei', variant: 'North' });
  });

  it('keeps names whose suffix is not in the strip list', () => {
    expect(shareCourseName("Golf d'Hardelot (Les Dunes)")).toEqual({ short: "Golf d'Hardelot", variant: 'Les Dunes' });
  });

  it('strips " Golf Club" with no variant', () => {
    expect(shareCourseName('Parkstone Golf Club')).toEqual({ short: 'Parkstone', variant: null });
  });

  it("keeps an apostrophe name and strips only the suffix", () => {
    expect(shareCourseName("Royal St George's Golf Club")).toEqual({ short: "Royal St George's", variant: null });
  });

  it('never strips to empty: a name that is only a suffix word keeps itself', () => {
    expect(shareCourseName('Golf Club')).toEqual({ short: 'Golf Club', variant: null });
  });
});
