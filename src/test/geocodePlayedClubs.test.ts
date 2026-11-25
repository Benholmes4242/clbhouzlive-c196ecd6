import { describe, it, expect } from 'vitest';
import { pickPhotonGolf } from '../../supabase/functions/_shared/geocodeGolfClub';
import { buildWorkList, isDue, updateFor, type ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const feat = (osm_value: string, props: Record<string, string>, coords = [-0.63, 51.38]) =>
  ({ geometry: { coordinates: coords }, properties: { osm_key: osm_value === 'golf_course' ? 'leisure' : 'place', osm_value, ...props } });

describe('pickPhotonGolf', () => {
  it('a golf course matching sub_country by state wins', () => {
    expect(pickPhotonGolf([feat('golf_course', { state: 'Surrey' })], { sub_country: ' surrey ' })).toEqual({ lat: 51.38, lng: -0.63 });
  });
  it('a golf course matching by country wins', () => {
    expect(pickPhotonGolf([feat('golf_course', { country: 'Scotland' }, [-2.8, 56.3])], { sub_country: 'Scotland' })).toEqual({ lat: 56.3, lng: -2.8 });
  });
  it('a golf course in another state/country is no match', () => {
    expect(pickPhotonGolf([feat('golf_course', { state: 'Kent', country: 'England' })], { sub_country: 'Surrey' })).toBeNull();
  });
  it('a non-golf feature is ignored; an empty list is no match', () => {
    expect(pickPhotonGolf([feat('town', { state: 'Surrey' })], { sub_country: 'Surrey' })).toBeNull();
    expect(pickPhotonGolf([], { sub_country: 'Surrey' })).toBeNull();
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
