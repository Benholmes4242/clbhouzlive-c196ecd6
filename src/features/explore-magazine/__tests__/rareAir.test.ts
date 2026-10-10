import { describe, expect, it } from 'vitest';
import { compareRates, rarityShare, RARE_AIR_TILE_HEIGHT, rareAirPlaceholderHeight } from '../rareAir';
import { playDateShortDated } from '@/components/explore-tab-new/courseled/discoverWhen';
import type { FeatYearRow } from '../useFeatsWindow';

const row = (p: Partial<FeatYearRow>): FeatYearRow => ({
  feat_kind: 'eagle', events: 0, rounds_with: 0, members: 0, denominator: 0, denominator_unit: 'holes',
  total_rounds: 0, total_holes: 0, total_members: 0, rounds_estimated: 0, viewer_events: 0, viewer_rounds_with: 0,
  latest_user_id: null, latest_display_name: null, latest_photo_url: null, latest_score_id: null,
  latest_course_id: null, latest_course_name: null, latest_play_date: null, ...p,
});

describe('rare air', () => {
  it('bar: no fill at zero events, floored at 0.08, full at 5000 rounds per occurrence', () => {
    expect(rarityShare(row({ events: 0 }))).toBe(0);
    expect(rarityShare(row({ events: 100, total_holes: 1800 }))).toBe(0.08);
    expect(rarityShare(row({ events: 1, total_holes: 5000 * 18 }))).toBeCloseTo(1);
  });
  it('comparison: below 10 window events is too few', () => {
    expect(compareRates(row({ events: 3, denominator: 100 }), row({ events: 20, denominator: 1000 }))).toEqual({ kind: 'tooFew' });
  });
  it('comparison: twice the all-time rate is 100% commoner; half is 50% rarer; equal is omitted', () => {
    const all = row({ events: 100, denominator: 10000 });
    expect(compareRates(row({ events: 20, denominator: 1000 }), all)).toEqual({ kind: 'commoner', pct: 100 });
    expect(compareRates(row({ events: 10, denominator: 2000 }), all)).toEqual({ kind: 'rarer', pct: 50 });
    expect(compareRates(row({ events: 10, denominator: 1000 }), all)).toBeNull();
  });
  it('date carries the year only when not the current year', () => {
    const now = new Date(2026, 9, 10);
    expect(playDateShortDated('2024-06-12', 'en-GB', now)).toBe('12 Jun 2024');
    expect(playDateShortDated('2026-09-05', 'en-GB', now)).toBe('5 Sept');
  });
  it('tile 178, placeholder 324 signed out and 373 signed in', () => {
    expect(RARE_AIR_TILE_HEIGHT).toBe(178);
    expect(rareAirPlaceholderHeight(false)).toBe(324);
    expect(rareAirPlaceholderHeight(true)).toBe(373);
  });
});
