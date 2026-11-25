import { describe, it, expect, vi } from 'vitest';
import { geocodeGolfClub } from '../../supabase/functions/_shared/geocodeGolfClub';
import { runBatch } from '../../supabase/functions/geocode-played-clubs/batch';
import { geocodeClub } from '../../supabase/functions/geocode-club/handler';
import type { ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const place = { name: 'Walton Heath', sub_country: 'Surrey' };
const respond = (status: number) => (async () => new Response('x', { status })) as unknown as typeof fetch;

describe('geocodeGolfClub', () => {
  it('403 is blocked', async () => expect(await geocodeGolfClub(place, respond(403))).toEqual({ kind: 'blocked', status: 403 }));
  it('429 is blocked', async () => expect(await geocodeGolfClub(place, respond(429))).toEqual({ kind: 'blocked', status: 429 }));
  it('500 is httpError', async () => expect(await geocodeGolfClub(place, respond(500))).toEqual({ kind: 'httpError', status: 500 }));
  it('a timeout is httpError', async () => {
    const hang = ((_u: string, init: RequestInit) => new Promise((_r, rej) =>
      init.signal!.addEventListener('abort', () => rej(init.signal!.reason)))) as unknown as typeof fetch;
    expect((await geocodeGolfClub(place, hang, 10)).kind).toBe('httpError');
  });
});

const club = (id: string): ClubRow => ({ id, name: id, country: 'England', region: null, sub_country: 'Surrey', latitude: null, longitude: null, geocode_attempted_at: null });

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
});

describe('geocode-club', () => {
  it('a match returns {latitude, longitude, cached:false}', async () => {
    const writeCoords = vi.fn(async () => ({}));
    const r = await geocodeClub('c1', {
      loadClub: async () => ({ id: 'c1', name: 'Walton Heath', sub_country: 'Surrey', latitude: null, longitude: null }),
      geocode: async () => ({ kind: 'match', lat: 51.3, lng: -0.25 }),
      writeCoords,
    });
    expect(r).toEqual({ status: 200, body: { latitude: 51.3, longitude: -0.25, cached: false } });
    expect(writeCoords).toHaveBeenCalledWith('c1', { latitude: 51.3, longitude: -0.25 });
  });
});
