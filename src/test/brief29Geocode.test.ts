import { describe, expect, it, vi } from 'vitest';
import { geoapifyUrl } from '../../supabase/functions/_shared/geocodeGolfClub';
import { pickSecondPass, secondPassGolf } from '../../supabase/functions/_shared/geocodeGolfSecondPass';

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
