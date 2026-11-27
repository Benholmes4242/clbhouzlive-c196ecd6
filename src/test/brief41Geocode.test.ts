import { describe, expect, it, vi, type Mock } from 'vitest';
import type { GeocodeResult } from '../../supabase/functions/_shared/geocodeGolfClub';
import { runBatch, type BatchDeps } from '../../supabase/functions/geocode-played-clubs/batch';
import { createHandler } from '../../supabase/functions/geocode-played-clubs/handler';
import { runProbeStuck } from '../../supabase/functions/geocode-played-clubs/probe';
import { cleanedClubName, type ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const club = (name: string, over: Partial<ClubRow> = {}): ClubRow => ({ id: '11111111-1111-4111-8111-111111111111', name, country: 'AE',
  sub_country: 'UAE', region: null, latitude: null, longitude: null, town: 'Dubai', geocode_attempted_at: null, ...over });
const match = { kind: 'match' as const, lat: 25.02, lng: 55.2, county: null, state: null, city: 'Dubai' };

type Geo = Mock<(club: ClubRow, accept?: unknown) => Promise<GeocodeResult>>;
function deps(c: ClubRow, over: Partial<BatchDeps> = {}) {
  const geocode: Geo = vi.fn(async () => ({ kind: 'noMatch' as const }));
  const secondPass: Geo = vi.fn(async () => ({ kind: 'noMatch' as const }));
  const writeCoords = vi.fn(async () => ({ error: null, courses: 0 }));
  const log = vi.fn<(line: string) => void>();
  const d: BatchDeps = { loadWorkList: async () => [c], geocode, secondPass, writeCoords, stamp: async () => ({ error: null }),
    sleep: async () => {}, now: () => 0, log, ...over };
  return Object.assign(d, { geocode, secondPass, writeCoords, log });
}

describe('Brief 41 name cleaning', () => {
  it('removes bracketed parts and trailing dash suffixes, and leaves plain names alone', () => {
    expect(cleanedClubName('Le Golf National (Albatros)')).toBe('Le Golf National');
    expect(cleanedClubName('Jumeirah Golf Estates - Earth Course')).toBe('Jumeirah Golf Estates');
    expect(cleanedClubName('Celtic Manor (Montgomerie) Golf club')).toBe('Celtic Manor Golf club');
    expect(cleanedClubName('Wentworth Club')).toBeNull();
  });
});

describe('Brief 41 cleaned-name fallback', () => {
  it('runs once, only after both passes find nothing, with the same acceptance function', async () => {
    const d = deps(club('Jumeirah Golf Estates - Earth Course'));
    d.geocode.mockResolvedValueOnce({ kind: 'noMatch' }).mockResolvedValueOnce(match);
    await runBatch(d);
    expect(d.secondPass).toHaveBeenCalledTimes(1);
    expect(d.geocode).toHaveBeenCalledTimes(2);
    expect((d.geocode.mock.calls[1] as unknown[])[0]).toMatchObject({ name: 'Jumeirah Golf Estates' });
    expect((d.geocode.mock.calls[1] as unknown[])[1]).toBe((d.geocode.mock.calls[0] as unknown[])[1]);
    expect(d.log.mock.calls.some(([l]) => /cleanedNameMatched .*name="Jumeirah Golf Estates"/.test(l))).toBe(true);
  });

  it('does not retry after a first- or second-pass match, or when cleaning changes nothing', async () => {
    const a = deps(club('Le Golf National (Albatros)'));
    a.geocode.mockResolvedValueOnce(match);
    await runBatch(a);
    expect(a.geocode).toHaveBeenCalledTimes(1);
    const b = deps(club('Le Golf National (Albatros)'));
    b.secondPass.mockResolvedValueOnce(match);
    await runBatch(b);
    expect(b.geocode).toHaveBeenCalledTimes(1);
    const c = deps(club('Wentworth Club'));
    await runBatch(c);
    expect(c.geocode).toHaveBeenCalledTimes(1);
  });

  it('a cleaned-name match writes coordinates only for a club without latitude', async () => {
    const empty = deps(club('Royal Bled (King\'s)'));
    empty.geocode.mockResolvedValueOnce({ kind: 'noMatch' }).mockResolvedValueOnce(match);
    await runBatch(empty);
    expect(empty.writeCoords).toHaveBeenCalledWith(club('x').id, { latitude: 25.02, longitude: 55.2 });
    const pinned = deps(club('Royal Bled (King\'s)', { latitude: 46.3, longitude: 14.1 }), { reverseTown: undefined });
    pinned.geocode.mockResolvedValueOnce({ kind: 'noMatch' }).mockResolvedValueOnce(match);
    await runBatch(pinned);
    expect(pinned.writeCoords).not.toHaveBeenCalled();
  });
});

describe('Brief 41 probe_stuck', () => {
  const base = { cors: {}, runBatch: vi.fn(async () => {}), waitUntil: vi.fn() };
  const post = (body: unknown) => new Request('https://x', { method: 'POST', body: JSON.stringify(body) });

  it('rejects a limit over ten', async () => {
    const probeStuck = vi.fn(async () => ({}));
    const h = createHandler({ ...base, authorize: async () => null, probeStuck });
    expect((await h(post({ action: 'probe_stuck', offset: 0, limit: 11 }))).status).toBe(400);
    expect(probeStuck).not.toHaveBeenCalled();
    expect((await h(post({ action: 'probe_stuck', offset: 10, limit: 10 }))).status).toBe(200);
    expect(probeStuck).toHaveBeenCalledWith(10, 10);
  });

  it('needs admin', async () => {
    const probeStuck = vi.fn(async () => ({}));
    const h = createHandler({ ...base, authorize: async () => new Response('no', { status: 403 }), probeStuck });
    expect((await h(post({ action: 'probe_stuck', offset: 0, limit: 5 }))).status).toBe(403);
    expect(probeStuck).not.toHaveBeenCalled();
    expect(base.runBatch).not.toHaveBeenCalled();
  });

  it('reads only through the club reader and never writes', async () => {
    const clubs = [club('Wentworth Club', { id: '22222222-2222-4222-8222-222222222222', sub_country: 'England', country: 'GB' }), club('Trump Turnberry')];
    const loadStuck = vi.fn(async () => clubs);
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({ results: [], features: [] }))) as unknown as typeof fetch;
    const out = await runProbeStuck(1, 1, { loadStuck, fetchFn, apiKey: 'k', sleep: async () => {} });
    expect(loadStuck).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ probe: true, total: 2, offset: 1, limit: 1 });
    expect(out.clubs.map((c) => c.name)).toEqual(['Trump Turnberry']);
    for (const [, init] of (fetchFn as unknown as { mock: { calls: [unknown, RequestInit | undefined][] } }).mock.calls) {
      expect(init?.method ?? 'GET').toBe('GET');
    }
  });
});
