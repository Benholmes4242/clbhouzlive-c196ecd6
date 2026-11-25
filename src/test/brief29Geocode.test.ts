import { describe, expect, it, vi } from 'vitest';
import { geoapifyUrl } from '../../supabase/functions/_shared/geocodeGolfClub';
import { pickNearbyTown, pickSecondPass, reverseLookup, secondPassGolf } from '../../supabase/functions/_shared/geocodeGolfSecondPass';
import { runBatch } from '../../supabase/functions/geocode-played-clubs/batch';
import { runProbe } from '../../supabase/functions/geocode-played-clubs/probe';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const deps = (fetchFn: typeof fetch) => ({ fetchFn, apiKey: 'k', cache: new Map(), pace: async () => {} });

describe('Brief 29 A region anchors', () => {
  it('uses an untyped five-result request and skips a city for the first county', async () => {
    const seen: string[] = [];
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      seen.push(url);
      if (url.includes('/v1/geocode/search')) return json({ results: [
        { place_id: 'CITY', result_type: 'city' },
        { place_id: 'COUNTY', result_type: 'county' },
      ] });
      return json({ features: [{ properties: { name: 'Nizels Golf Club', lat: 51.2, lon: 0.2 } }] });
    }) as unknown as typeof fetch;
    const result = await secondPassGolf({ name: 'Nizels', region: 'Kent', sub_country: 'England' }, deps(fetchFn));
    expect(result.kind).toBe('match');
    const anchor = new URL(seen[0]);
    expect(anchor.searchParams.get('text')).toBe('Kent, England');
    expect(anchor.searchParams.has('type')).toBe(false);
    expect(anchor.searchParams.get('limit')).toBe('5');
    expect(new URL(seen[1]).searchParams.get('filter')).toBe('place:COUNTY');
  });

  it('has no region anchor when only a city is returned', async () => {
    const fetchFn = vi.fn(async () => json({ results: [{ place_id: 'CITY', result_type: 'city' }] })) as unknown as typeof fetch;
    const result = await secondPassGolf({ name: 'Nizels', region: 'Kent', sub_country: 'England' }, deps(fetchFn));
    expect(result.kind).toBe('noMatch');
    expect(fetchFn).toHaveBeenCalledTimes(3);
  });
});

describe('Brief 29 F probe diagnostics', () => {
  it('shows the chosen county, picker rule, nearby request and nearby choice', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      const params = new URL(url).searchParams;
      if (url.includes('/v2/places') && params.get('categories') === 'sport.golf_course') {
        return json({ features: [{ properties: { name: 'Yas Links', lat: 51.7, lon: -0.4, categories: ['sport.golf_course'] } }] });
      }
      if (url.includes('/v2/places')) {
        return json({ features: [{ properties: { name: 'Watford', lat: 51.7 + 1.5 / 111.195, lon: -0.4, categories: ['populated_place.town'] } }] });
      }
      if (url.includes('/reverse')) return json({ results: [{ city: params.get('type') === 'city' ? 'Watford District' : null, country: 'United Kingdom' }] });
      if (params.get('text') === 'Kent, England') return json({ results: [
        { place_id: 'CITY', result_type: 'city', formatted: 'Kent city' },
        { place_id: 'COUNTY', result_type: 'county', formatted: 'Kent, England' },
      ] });
      return json({ results: [] });
    }) as unknown as typeof fetch;
    const result = await runProbe([id], {
      loadClubs: async () => [{ id, name: 'Yas Links Abu Dhabi', country: 'GB', region: 'Kent', sub_country: 'England', latitude: null, longitude: null, geocode_attempted_at: null, town: null }],
      fetchFn, apiKey: 'SECRETKEY', sleep: async () => {},
    });
    const probed = result.clubs[0];
    expect(probed.second_pass.anchors[0].chosen).toMatchObject({ place_id: 'COUNTY', result_type: 'county' });
    expect(probed.second_pass.places[0].picker_rule).toBe(2);
    expect(probed.second_pass.picker_rule).toBe(2);
    expect(probed.reverse.nearby).toMatchObject({ choice: { name: 'Watford' } });
    expect(new URL(probed.reverse.nearby.url).searchParams.get('filter')).toBe('circle:-0.4,51.7,5000');
  });
});

describe('Brief 29 E nearest town', () => {
  it('finds Ballybunion after both reverse lookups have no usable town', async () => {
    const seen: string[] = [];
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      seen.push(url);
      if (url.includes('/v2/places')) return json({ features: [
        { properties: { name: 'Ballybunion', lat: 52.5 + 1.5 / 111.195, lon: -9.6, categories: ['populated_place.town'], county: 'County Kerry', country: 'Ireland' } },
        { properties: { name: 'Closer Suburb', lat: 52.5 + 0.2 / 111.195, lon: -9.6, categories: ['populated_place.suburb'], county: 'County Kerry', country: 'Ireland' } },
      ] });
      if (url.includes('type=city')) return json({ results: [{ city: 'Listowel Municipal District', county: 'County Kerry', country: 'Ireland' }] });
      return json({ results: [{ county: 'County Kerry', country: 'Ireland' }] });
    }) as unknown as typeof fetch;
    const result = await reverseLookup(52.5, -9.6, { fetchFn, apiKey: 'k', pace: async () => {} });
    expect(result).toMatchObject({ kind: 'town', town: 'Ballybunion', nearby: { name: 'Ballybunion' } });
    expect(seen).toHaveLength(3);
    const nearby = new URL(seen[2]);
    expect(nearby.searchParams.get('filter')).toBe('circle:-9.6,52.5,5000');
    expect(nearby.searchParams.get('bias')).toBe('proximity:-9.6,52.5');
    expect(nearby.searchParams.get('limit')).toBe('20');
  });

  it('uses the same exclusions and distance calculation for nearby places', () => {
    expect(pickNearbyTown([
      { name: 'Kerry District', lat: 52.5, lon: -9.6, categories: ['populated_place.town'] },
      { name: 'Ballybunion', lat: 52.5 + 1.5 / 111.195, lon: -9.6, categories: ['populated_place.village'] },
    ], 52.5, -9.6)?.name).toBe('Ballybunion');
  });

  it('runs the town lookup at a matched club’s coordinates when the match has no town', async () => {
    const reverseTown = vi.fn(async () => ({ kind: 'town' as const, town: 'Ballybunion' }));
    const writeTown = vi.fn(async () => ({ error: null }));
    await runBatch({
      loadWorkList: async () => [{ id: 'c1', name: 'Ballybunion', country: 'IE', region: 'Kerry', sub_country: 'Ireland', latitude: null, longitude: null, geocode_attempted_at: null, town: null }],
      geocode: async () => ({ kind: 'match', lat: 52.5, lng: -9.6, county: 'County Kerry', state: null, city: null }),
      reverseTown, writeTown,
      writeCoords: async () => ({ error: null }), stamp: async () => ({ error: null }),
      sleep: async () => {}, now: () => 0, log: () => {},
    });
    expect(reverseTown).toHaveBeenCalledWith(expect.objectContaining({ latitude: 52.5, longitude: -9.6 }));
    expect(writeTown).toHaveBeenCalledWith('c1', 'Ballybunion');
  });
});

describe('Brief 29 D sharper first pass', () => {
  it.each([
    ['England', 'GB', 'gb'],
    ['Scotland', 'GB', 'gb'],
    ['Wales', 'GB', 'gb'],
    ['Northern Ireland', 'GB', 'gb'],
    ['Ireland', 'IE', 'ie'],
  ])('includes the region and countrycode filter for %s', (subCountry, country, code) => {
    const params = new URL(geoapifyUrl({ name: 'Nizels', region: 'Kent', sub_country: subCountry, country }, 'k')).searchParams;
    expect(params.get('text')).toBe(`Nizels Golf Club, Kent, ${subCountry}`);
    expect(params.get('filter')).toBe(`countrycode:${code}`);
  });

  it('filters a USA club by us and leaves other nations unfiltered', () => {
    expect(new URL(geoapifyUrl({ name: 'TPC San Antonio', sub_country: 'Texas', country: 'USA' }, 'k')).searchParams.get('filter')).toBe('countrycode:us');
    expect(new URL(geoapifyUrl({ name: 'Golf de Chantilly', region: 'Oise', sub_country: 'France', country: 'France' }, 'k')).searchParams.has('filter')).toBe(false);
  });
});

describe('Brief 29 C names with a place added', () => {
  it('Yas Links Abu Dhabi falls back to Yas Links and reports rule two', async () => {
    const seen: string[] = [];
    const fetchFn = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      seen.push(url);
      if (url.includes('/v1/geocode/search')) return json({ results: [{ place_id: 'UAE', result_type: 'state' }] });
      return json({ features: [{ properties: { name: 'Yas Links', lat: 24.4, lon: 54.6 } }] });
    }) as unknown as typeof fetch;
    const result = await secondPassGolf({ name: 'Yas Links Abu Dhabi', region: null, sub_country: 'Abu Dhabi' }, deps(fetchFn));
    expect(result).toMatchObject({ kind: 'match', pickerRule: 2 });
    expect(new URL(seen[1]).searchParams.get('name')).toBe('yas');
  });

  it('Old Thorns rejects other Old places but accepts one containing thorns', () => {
    const oldPlaces = [
      { name: 'Old Course', lat: 51.1, lon: 0.1 },
      { name: 'Old Hall', lat: 51.2, lon: 0.2 },
    ];
    expect(pickSecondPass(oldPlaces, 'Old Thorns')).toBeNull();
    expect(pickSecondPass([...oldPlaces, { name: 'Old Thorns', lat: 51.3, lon: 0.3 }], 'Old Thorns')).toMatchObject({ lat: 51.3, pickerRule: 1 });
  });
});

describe('Brief 29 B resorts with several courses', () => {
  const pair = (distanceKm: number) => [
    { name: 'TPC San Antonio Oaks Course', lat: 29.6, lon: -98.6 },
    { name: 'TPC San Antonio Canyons Course', lat: 29.6 + distanceKm / 111.195, lon: -98.6 },
  ];

  it('matches two qualifying features three kilometres apart', () => {
    expect(pickSecondPass(pair(3), 'TPC San Antonio')?.lat).toBe(29.6);
  });

  it('rejects two qualifying features twenty kilometres apart', () => {
    expect(pickSecondPass(pair(20), 'TPC San Antonio')).toBeNull();
  });
});
