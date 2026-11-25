import { describe, it, expect } from 'vitest';
import { pickGolfResult } from '../../supabase/functions/_shared/pickGolfResult';
import { buildWorkList, isDue, updateFor, type ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const town = { lat: '51.0', lon: '-1.0', class: 'place', type: 'town', display_name: 'Sunningdale, Berkshire, England' };
const golf = { lat: '51.38', lon: '-0.63', class: 'leisure', type: 'golf_course', display_name: 'Sunningdale Golf Club, Surrey' };

describe('pickGolfResult', () => {
  it('a golf_course result wins over an earlier town result', () => {
    expect(pickGolfResult([town, golf], { sub_country: 'Berkshire' })).toEqual({ latitude: 51.38, longitude: -0.63 });
  });
  it('accepts a non-golf result only when display_name contains the sub_country', () => {
    expect(pickGolfResult([town], { sub_country: 'berkshire' })).toEqual({ latitude: 51, longitude: -1 });
  });
  it('otherwise no match', () => {
    expect(pickGolfResult([town], { sub_country: 'Kent' })).toBeNull();
  });
  it('an empty array is no match', () => {
    expect(pickGolfResult([], { sub_country: 'Kent' })).toBeNull();
  });
});

const now = new Date('2026-11-25T00:00:00Z');
const club = (id: string, daysAgo: number | null): ClubRow => ({
  id, name: id, country: 'England', region: null, sub_country: 'Kent', latitude: null, longitude: null,
  geocode_attempted_at: daysAgo === null ? null : new Date(now.getTime() - daysAgo * 86_400_000).toISOString(),
});

describe('work list and writes', () => {
  it('excludes a club attempted within 30 days', () => {
    expect(isDue(club('a', 10), now)).toBe(false);
  });
  it('includes a club attempted 31 days ago', () => {
    expect(buildWorkList([club('b', 31)], new Map(), now).map((c) => c.id)).toEqual(['b']);
  });
  it('never puts existing coordinates in the update', () => {
    expect(isDue({ ...club('c', null), latitude: 1, longitude: 2 }, now)).toBe(false);
    expect(updateFor({ kind: 'noMatch' }, now.toISOString())?.coords).toBeNull();
  });
  it('an HTTP error leaves geocode_attempted_at unset', () => {
    expect(updateFor({ kind: 'httpError' }, now.toISOString())).toBeNull();
  });
});
