import { describe, expect, it, vi } from 'vitest';
import { geoapifyTown, type GeoapifyResult } from '../../supabase/functions/_shared/geocodeGolfClub';
import { chooseTown, reverseLookup } from '../../supabase/functions/_shared/geocodeGolfSecondPass';
import { runBatch } from '../../supabase/functions/geocode-played-clubs/batch';
import { runProbe } from '../../supabase/functions/geocode-played-clubs/probe';
import type { ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const lat = 51.2, lon = 0.2;
const settlement = (name: string, distance: number, category: string): GeoapifyResult =>
  ({ name, lat: lat + distance / 111.195, lon, categories: [`populated_place.${category}`] });
const json = (body: unknown) => new Response(JSON.stringify(body));
const club: ClubRow = { id: '11111111-1111-4111-8111-111111111111', name: 'Nizels', country: 'GB',
  sub_country: 'England', region: 'Kent', latitude: null, longitude: null, town: null, geocode_attempted_at: null };
const match = { kind: 'match' as const, lat, lng: lon, county: 'Kent', state: 'England', city: 'Tonbridge and Malling' };
const fetcher = (places: GeoapifyResult[], address: GeoapifyResult = {}) => vi.fn(async (input: string | URL | Request) => {
  const url = new URL(String(input));
  if (url.pathname.endsWith('/places')) return json({ features: places.map((properties) => ({ properties })) });
  return json({ results: [address] });
}) as unknown as typeof fetch;

describe('Brief 30 town priority', () => {
  it('Nizels chooses Hildenborough at 2km over the council-like address city', async () => {
    const fetchFn = fetcher([settlement('Hildenborough', 2, 'village')]);
    const r = await reverseLookup(lat, lon, { apiKey: 'k', fetchFn }, 'Tonbridge and Malling');
    expect(r).toMatchObject({ town: 'Hildenborough', townStep: 1 });
    if (r.kind !== 'town') throw new Error(r.kind);
    expect(r.distanceKm).toBeCloseTo(2, 2);
    const params = new URL(String(vi.mocked(fetchFn).mock.calls[0][0])).searchParams;
    expect(params.get('filter')).toBe('circle:0.2,51.2,5000');
    expect(params.get('bias')).toBe('proximity:0.2,51.2');
    expect(params.get('limit')).toBe('20');
    expect(params.get('categories')).toBe('populated_place.city,populated_place.town,populated_place.village,populated_place.suburb,populated_place.hamlet');
  });
  it('Ballybunion beats a closer suburb and address parish on the reverse path', async () => {
    const r = await reverseLookup(lat, lon, { apiKey: 'k', fetchFn: fetcher([
      settlement('Ballybunion', 1.5, 'town'), settlement('Closer Suburb', 0.2, 'suburb'),
    ], { city: 'Listowel Municipal District', country: 'Ireland' }) });
    expect(r).toMatchObject({ town: 'Ballybunion', townStep: 1 });
  });
  it('no settlement within 5km and address Northeast gives no town', async () => {
    const r = await reverseLookup(lat, lon, { apiKey: 'k', fetchFn: fetcher([
      settlement('Outside Town', 5.1, 'town'),
    ], { suburb: 'Northeast' }) });
    expect(r).toMatchObject({ town: null, townStep: null, distanceKm: null });
  });
  it('London keeps address Richmond ahead of a nearby suburb when there is no primary settlement', async () => {
    const r = await reverseLookup(lat, lon, { apiKey: 'k', fetchFn: fetcher([
      settlement('Closer Suburb', 0.1, 'suburb'),
    ], { suburb: 'Richmond', city: 'Greater London' }) });
    expect(r).toMatchObject({ town: 'Richmond', townStep: 2, distanceKm: null, nearby: null });
  });
  it('falls back to the nearest hamlet only after both primary settlements and address fail', () => {
    const r = chooseTown([settlement('Far Hamlet', 3, 'hamlet'), settlement('Near Hamlet', 0.5, 'hamlet')], lat, lon, null);
    expect(r).toMatchObject({ town: 'Near Hamlet', townStep: 3 });
    expect(r.distanceKm).toBeCloseTo(0.5, 2);
  });
  it('distance in code chooses the nearest primary rather than response order', () => {
    expect(chooseTown([settlement('Far Town', 4, 'town'), settlement('Near Village', 1, 'village')], lat, lon, 'Address').town).toBe('Near Village');
  });
  it('rejects all ten compass or district labels in mixed case but preserves real compound names', () => {
    for (const label of ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest', 'central', 'downtown']) {
      expect(geoapifyTown({ suburb: ` ${label.toUpperCase()} ` })).toBeNull();
      expect(chooseTown([settlement(label, 1, 'town')], lat, lon, label).town).toBeNull();
    }
    expect(geoapifyTown({ town: 'North Berwick' })).toBe('North Berwick');
  });
});

describe('Brief 30 batch and read-only probe', () => {
  const run = (work: ClubRow[], reverseTown: ReturnType<typeof vi.fn>, writeTown: ReturnType<typeof vi.fn>) => runBatch({
    loadWorkList: async () => work, geocode: async () => match, reverseTown, writeTown,
    writeCoords: async () => ({ error: null }), stamp: async () => ({ error: null }), now: () => 0, sleep: async () => {}, log: () => {},
  });
  it('match path checks nearby settlements even when the match supplies an address city', async () => {
    const reverseTown = vi.fn(async (point: ClubRow, address?: string | null) => reverseLookup(point.latitude ?? lat, point.longitude ?? lon,
      { apiKey: 'k', fetchFn: fetcher([settlement('Hildenborough', 2, 'village')]) }, address));
    const writeTown = vi.fn(async () => ({ error: null }));
    await run([club], reverseTown, writeTown);
    expect(reverseTown).toHaveBeenCalledWith(expect.objectContaining({ latitude: lat, longitude: lon }), 'Tonbridge and Malling');
    expect(writeTown).toHaveBeenCalledWith(club.id, 'Hildenborough');
  });
  it('never changes or resolves an existing town', async () => {
    const reverseTown = vi.fn(), writeTown = vi.fn();
    await run([{ ...club, town: 'Existing Town' }], reverseTown, writeTown);
    expect(reverseTown).not.toHaveBeenCalled();
    expect(writeTown).not.toHaveBeenCalled();
  });
  it('fills an empty-string town', async () => {
    const writeTown = vi.fn(async () => ({ error: null }));
    await run([{ ...club, town: '' }], vi.fn(async () => ({ kind: 'town' as const, town: 'Hildenborough' })), writeTown);
    expect(writeTown).toHaveBeenCalledWith(club.id, 'Hildenborough');
  });
  it('probe exposes selected step and distance for an address-bearing match without writes', async () => {
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      if (url.searchParams.get('categories')?.startsWith('populated_place')) return json({ features: [{ properties: settlement('Hildenborough', 2, 'village') }] });
      if (url.pathname.endsWith('/places')) return json({ features: [] });
      return json({ results: [{ name: 'Nizels Golf Club', lat, lon, county: 'Kent', state: 'England', city: 'Tonbridge and Malling', place_id: 'K', result_type: 'county' }] });
    }) as unknown as typeof fetch;
    const r = await runProbe([club.id], { loadClubs: async () => [club], fetchFn, apiKey: 'SECRETKEY', sleep: async () => {} });
    expect(r.clubs[0].reverse).toMatchObject({ would_choose: 'Hildenborough', town_step: 1 });
    expect(r.clubs[0].reverse?.distance_km).toBeCloseTo(2, 2);
    expect(JSON.stringify(r)).not.toContain('SECRETKEY');
  });
});