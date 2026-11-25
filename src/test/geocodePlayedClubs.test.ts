import { describe, it, expect } from 'vitest';
import { pickGeoapifyGolf, geoapifyUrl, geoapifyTown, type GeoapifyResult } from '../../supabase/functions/_shared/geocodeGolfClub';
import { buildWorkList, isDue, updateFor, resolveRegion, withinGuard, type ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const res = (name: string, state: string, lat = 51.56, lon = 0.25, extra: Partial<GeoapifyResult> = {}): GeoapifyResult =>
  ({ name, state, county: 'Greater London', city: 'Upminster', country: 'United Kingdom', result_type: 'amenity', lat, lon, ...extra });

describe('pickGeoapifyGolf', () => {
  it('the exact name wins', () => {
    const r = pickGeoapifyGolf([res('Upminster Golf and Bowling Club', 'England', 1, 1), res('Upminster Golf Club', 'England', 2, 2)], { name: 'Upminster Golf Club', sub_country: 'England' });
    expect(r).toEqual({ lat: 2, lng: 2, county: 'Greater London', state: 'England', city: 'Upminster' });
  });
  it('otherwise the first golf result in the matching state wins', () => {
    expect(pickGeoapifyGolf([res('Nuneaton Golf Club', 'England', 3, 4), res('Other Golf Club', 'England', 5, 6)], { name: 'Nuneaton GC', sub_country: ' england ' })?.lat).toBe(3);
  });
  it('a golf result in another state is excluded', () => {
    expect(pickGeoapifyGolf([res('Ratho Park Golf Club', 'Scotland', 55.9, -3.4, { country: 'United Kingdom', county: 'City of Edinburgh' })], { name: 'Ratho Park Golf Club', sub_country: 'England' })).toBeNull();
  });
  it('a non-golf result is excluded', () => {
    expect(pickGeoapifyGolf([res('Upminster Rugby Club', 'England')], { name: 'Upminster Golf Club', sub_country: 'England' })).toBeNull();
  });
  it('an empty list is no match', () => {
    expect(pickGeoapifyGolf([], { name: 'x', sub_country: 'England' })).toBeNull();
  });
  it('Brocket Hall rejects the three unrelated England results', () => {
    expect(pickGeoapifyGolf([
      res('Berrington Hall Golf Club', 'England', 53.5, -2.8, { city: 'Rainford', county: 'Liverpool' }),
      res('Lees Hall Golf Club', 'England', 53.3, -1.4, { city: 'Sheffield' }),
      res('Mottram Hall Golf Club', 'England', 53.3, -2.2, { county: 'Cheshire' }),
    ], { name: 'Brocket Hall', sub_country: 'England' })).toBeNull();
  });
  it('Ferndown matches and strips Town from the preferred suburb', () => {
    expect(pickGeoapifyGolf([res('Ferndown Golf Club', 'England', 50.8, -1.9,
      { city: 'Ferndown', suburb: 'Ferndown Town', county: 'Dorset' })],
    { name: 'Ferndown', sub_country: 'England' })?.city).toBe('Ferndown');
  });
  it('Gleneagles Scotland matches address_line1 after the Ohio results', () => {
    const r = pickGeoapifyGolf([
      res('Gleneagles Golf Club', 'Ohio', 41, -81, { country: 'United States' }),
      res('Gleneagles Golf Club', 'Ohio', 42, -82, { country: 'United States' }),
      { address_line1: 'Gleneagles Golf Resort', state: 'Scotland', county: 'Perth and Kinross', lat: 56.28, lon: -3.75 },
    ], { name: 'Gleneagles', sub_country: 'Scotland' });
    expect(r).toEqual({ lat: 56.28, lng: -3.75, state: 'Scotland', county: 'Perth and Kinross', city: null });
  });
  it('East Sussex National prefers Uckfield over Wealden and Little Horsted', () => {
    expect(pickGeoapifyGolf([res('East Sussex National Golf Club', 'England', 50.95, 0.09,
      { city: 'Wealden', suburb: 'Uckfield', village: 'Little Horsted', county: 'East Sussex' })],
    { name: 'East Sussex National', sub_country: 'England' })?.city).toBe('Uckfield');
  });
  it('Chelsfield Lakes uses Halstead rather than Greater London', () => {
    expect(pickGeoapifyGolf([res('Chelsfield Lakes Golf Centre', 'England', 51.35, 0.14,
      { city: 'Greater London', suburb: 'Halstead', county: 'Kent' })],
    { name: 'Chelsfield Lakes', sub_country: 'England' })?.city).toBe('Halstead');
  });
  it('a club with no distinctive token cannot match', () => {
    expect(pickGeoapifyGolf([res('The Golf Club', 'England')], { name: 'The Golf Club', sub_country: 'England' })).toBeNull();
  });
  it('distinctive tokens ignore accents, case and bracketed parts', () => {
    expect(pickGeoapifyGolf([res('Golf D HARDELOT', 'France', 50, 1)],
      { name: "Golf d'Hárdelot (Les Dunes)", sub_country: 'France' })?.lat).toBe(50);
  });
});

describe('Geoapify query and town rules', () => {
  it('Ferndown query appends Golf Club with limit ten', () => {
    const p = new URL(geoapifyUrl({ name: 'Ferndown', sub_country: 'England' }, 'k')).searchParams;
    expect(p.get('text')).toBe('Ferndown Golf Club, England');
    expect(p.get('limit')).toBe('10');
  });
  it('Hardelot query removes the bracketed course without another golf suffix', () => {
    expect(new URL(geoapifyUrl({ name: "Golf d'Hardelot (Les Dunes)", sub_country: 'France' }, 'k'))
      .searchParams.get('text')).toBe("Golf d'Hardelot, France");
  });
  it('Greater and London Borough values fall through to village', () => {
    expect(geoapifyTown({ suburb: 'Greater London', city: 'London Borough of Bromley', village: 'Halstead', county: 'Kent' })).toBe('Halstead');
  });
  it('county state and country values are not towns', () => {
    expect(geoapifyTown({ suburb: 'kent', city: 'ENGLAND', village: 'United Kingdom', county: 'Kent', state: 'England', country: 'United Kingdom' })).toBeNull();
  });
  it('city is preferred to village when suburb is absent', () => {
    expect(geoapifyTown({ city: 'Uckfield', village: 'Little Horsted' })).toBe('Uckfield');
  });
});

const now = new Date('2026-11-25T00:00:00Z');
const club = (id: string, daysAgo: number | null): ClubRow => ({
  id, name: id, country: 'England', region: null, sub_country: 'Kent', latitude: null, longitude: null, town: 'Sevenoaks',
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

const resolver = (rpc: Record<string, string>, alias: Record<string, string> = {}) => ({
  geoResolve: async (raw: string) => rpc[raw] ?? null,
  alias: async (raw: string) => alias[raw] ?? null,
});

describe('region rules', () => {
  const c = { region: null, sub_country: 'England' };
  it('county resolves → written', async () => {
    expect(await resolveRegion(c, { county: 'Kent', state: 'England' }, resolver({ Kent: 'Kent' }))).toBe('Kent');
  });
  it('county unresolved but state resolves → state written', async () => {
    expect(await resolveRegion(c, { county: 'Nowhere', state: 'Surrey' }, resolver({ Surrey: 'Surrey' }))).toBe('Surrey');
  });
  it('both unresolved → nothing written', async () => {
    expect(await resolveRegion(c, { county: 'A', state: 'B' }, resolver({}))).toBeNull();
  });
  it('an alias row supplies the canonical value', async () => {
    expect(await resolveRegion(c, { county: 'Greater London', state: null }, resolver({}, { 'Greater London': 'London' }))).toBe('London');
  });
  it('an existing region is never overwritten', async () => {
    expect(await resolveRegion({ region: 'Essex', sub_country: 'England' }, { county: 'Kent', state: null }, resolver({ Kent: 'Kent' }))).toBeNull();
  });
});

describe('work list fill rules', () => {
  const located = (id: string, over: Partial<ClubRow>): ClubRow => ({ ...club(id, null), latitude: 1, longitude: 1, ...over });
  const subs = new Set(['England']);
  it('a USA club missing only region is excluded', () => {
    expect(buildWorkList([located('us', { sub_country: 'Texas', country: 'USA' })], new Map(), now, subs)).toEqual([]);
  });
  it('a club missing only town is included', () => {
    expect(buildWorkList([located('t', { town: null, region: 'Kent' })], new Map(), now, subs).map((c) => c.id)).toEqual(['t']);
  });
  it('missing coordinates sort first', () => {
    const list = buildWorkList([located('t', { town: null }), club('nc', null)], new Map([['t', 9]]), now, subs);
    expect(list.map((c) => c.id)).toEqual(['nc', 't']);
  });
});

describe('distance guard', () => {
  const base = { latitude: 51.5, longitude: 0 };
  const north = (km: number) => ({ lat: 51.5 + km / 111.195, lng: 0 });
  it('4.9 km fills', () => expect(withinGuard(base, north(4.9))).toBe(true));
  it('5.1 km skips', () => expect(withinGuard(base, north(5.1))).toBe(false));
});
