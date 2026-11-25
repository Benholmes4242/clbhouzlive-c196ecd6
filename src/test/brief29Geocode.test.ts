import { describe, expect, it, vi } from 'vitest';
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
