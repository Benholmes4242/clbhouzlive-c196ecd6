import { describe, it, expect, vi } from 'vitest';
import { geocodeGolfClub } from '../../supabase/functions/_shared/geocodeGolfClub';
import { runBatch } from '../../supabase/functions/geocode-played-clubs/batch';
import { geocodeClub } from '../../supabase/functions/geocode-club/handler';
import type { ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const place = { name: 'Walton Heath', sub_country: 'Surrey' };
const respond = (status: number) => (async () => new Response('x', { status })) as unknown as typeof fetch;

describe('geocodeGolfClub', () => {
  it('401 is blocked', async () => expect(await geocodeGolfClub(place, respond(401), 8000, 'k')).toEqual({ kind: 'blocked', status: 401 }));
  it('403 is blocked', async () => expect(await geocodeGolfClub(place, respond(403), 8000, 'k')).toEqual({ kind: 'blocked', status: 403 }));
  it('429 is blocked', async () => expect(await geocodeGolfClub(place, respond(429), 8000, 'k')).toEqual({ kind: 'blocked', status: 429 }));
  it('500 is httpError', async () => expect(await geocodeGolfClub(place, respond(500), 8000, 'k')).toEqual({ kind: 'httpError', status: 500 }));
  it('a missing key is httpError', async () => expect(await geocodeGolfClub(place, respond(200), 8000, undefined)).toEqual({ kind: 'httpError', message: 'GEOAPIFY_API_KEY not set' }));
  it('a timeout is httpError', async () => {
    const hang = ((_u: string, init: RequestInit) => new Promise((_r, rej) =>
      init.signal!.addEventListener('abort', () => rej(init.signal!.reason)))) as unknown as typeof fetch;
    expect((await geocodeGolfClub(place, hang, 10, 'k')).kind).toBe('httpError');
  });
});

const club = (id: string): ClubRow => ({ id, name: id, country: 'England', region: null, sub_country: 'Surrey', latitude: null, longitude: null, geocode_attempted_at: null, town: null });

describe('geocode-played-clubs batch', () => {
  it('blocked stops the run and stamps nothing', async () => {
    const stamp = vi.fn(async () => ({ error: null }));
    const writeCoords = vi.fn(async () => ({ error: null }));
    const geocode = vi.fn(async () => ({ kind: 'blocked' as const, status: 403 }));
    const s = await runBatch({ loadWorkList: async () => [club('a'), club('b')], geocode, writeCoords, stamp, sleep: async () => {}, now: () => 0, log: () => {} });
    expect(s.stopReason).toBe('blocked');
    expect(geocode).toHaveBeenCalledTimes(1);
    expect(stamp).not.toHaveBeenCalled();
    expect(writeCoords).not.toHaveBeenCalled();
  });
  const regionBatch = async (counties: string[]) => {
    const writeCoords = vi.fn(async () => ({ error: null }));
    const stamp = vi.fn(async () => ({ error: null }));
    const logs: string[] = [];
    const fetchResults = (async () => new Response(JSON.stringify({ results: counties.map((county, i) => ({
      name: 'Brocket Hall Golf Club', state: 'England', county, city: 'Welwyn', lat: 51 + i, lon: -0.2,
    })) }))) as typeof fetch;
    const summary = await runBatch({
      loadWorkList: async () => [{ ...club('b'), name: 'Brocket Hall', region: 'Hertfordshire', sub_country: 'England' }],
      geocode: (c, accept) => geocodeGolfClub(c, fetchResults, 8000, 'k', accept),
      resolver: { geoResolve: async (raw) => raw === 'Liverpool' ? 'Merseyside' : raw === 'Hertfordshire' ? raw : null, alias: async () => null },
      writeCoords, stamp, sleep: async () => {}, now: () => 0, log: (line) => logs.push(line),
    });
    return { summary, writeCoords, stamp, logs };
  };
  it('Hertfordshire rejects a candidate resolving to Merseyside before any coordinate write', async () => {
    const { summary, writeCoords, stamp, logs } = await regionBatch(['Liverpool']);
    expect(summary.regionMismatch).toBe(1);
    expect(summary.noMatch).toBe(1);
    expect(writeCoords).not.toHaveBeenCalled();
    expect(stamp).toHaveBeenCalledTimes(1);
    expect(logs.at(-1)).toContain('regionMismatch=1');
  });
  it('a region mismatch tries the next candidate', async () => {
    const { summary, writeCoords } = await regionBatch(['Liverpool', 'Hertfordshire']);
    expect(summary.regionMismatch).toBe(1);
    expect(summary.located).toBe(1);
    expect(writeCoords).toHaveBeenCalledWith('b', { latitude: 52, longitude: -0.2 });
  });
  it('an unresolved candidate region is not rejected', async () => {
    const { summary, writeCoords } = await regionBatch(['Unknown']);
    expect(summary.regionMismatch).toBe(0);
    expect(writeCoords).toHaveBeenCalledWith('b', { latitude: 51, longitude: -0.2 });
  });
});

describe('geocode-club', () => {
  it('a match returns {latitude, longitude, cached:false}', async () => {
    const writeCoords = vi.fn(async () => ({}));
    const r = await geocodeClub('c1', {
      loadClub: async () => ({ id: 'c1', name: 'Walton Heath', sub_country: 'Surrey', latitude: null, longitude: null }),
      geocode: async () => ({ kind: 'match', lat: 51.3, lng: -0.25, county: null, state: 'England', city: null }),
      writeCoords,
    });
    expect(r).toEqual({ status: 200, body: { latitude: 51.3, longitude: -0.25, cached: false } });
    expect(writeCoords).toHaveBeenCalledWith('c1', { latitude: 51.3, longitude: -0.25 });
  });
});
