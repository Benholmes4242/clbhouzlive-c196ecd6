import { describe, it, expect, vi } from 'vitest';
import { pickSecondPass, secondPassGolf, reverseTown, type AnchorCache } from '../../supabase/functions/_shared/geocodeGolfSecondPass';
import { runBatch, type BatchDeps } from '../../supabase/functions/geocode-played-clubs/batch';
import type { ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const feat = (name: string, lat: number, lon: number, extra: Record<string, unknown> = {}) =>
  ({ properties: { name, lat, lon, county: 'Cambridgeshire', state: 'England', city: 'Royston', ...extra } });
const routed = (places: unknown[], seen: string[] = []) => vi.fn(async (url: string | URL | Request) => {
  const u = String(url); seen.push(u);
  if (u.includes('/v1/geocode/search')) return json({ results: [{ place_id: 'ANCHOR' }] });
  return json({ features: places });
}) as unknown as typeof fetch;
const deps = (fetchFn: typeof fetch, cache: AnchorCache = new Map()) => ({ fetchFn, apiKey: 'k', cache, pace: async () => {} });
const club = (o: Partial<ClubRow> = {}): ClubRow => ({ id: 'c1', name: 'X', country: 'GB', region: null, sub_country: 'England',
  latitude: null, longitude: null, geocode_attempted_at: null, town: null, ...o });

describe('Brief 22 second pass', () => {
  it('Barkway Park matches a sport.golf feature with no "golf" in its name', async () => {
    const seen: string[] = [];
    const r = await secondPassGolf({ name: 'Barkway Park', region: 'Cambridgeshire', sub_country: 'England' }, deps(routed([feat('Barkway Park', 52.0, 0.0)], seen)));
    expect(r).toMatchObject({ kind: 'match', lat: 52, lng: 0 });
    expect(seen[1]).toContain('categories=sport.golf');
    expect(seen[1]).toContain('filter=place%3AANCHOR');
  });
  it('Cordillera Ranch in Texas anchors on the Texas state boundary', async () => {
    const seen: string[] = [];
    const r = await secondPassGolf({ name: 'Cordillera Ranch', region: null, sub_country: 'Texas' }, deps(routed([feat('The Clubs of Cordillera Ranch', 29.8, -98.6, { state: 'Texas' })], seen)));
    expect(r.kind).toBe('match');
    expect(seen[0]).toContain('text=Texas');
    expect(seen[0]).toContain('type=state');
  });
  it('Cainhoe Wood (Castle) matches Cainhoe Wood Golf Centre', () => {
    expect(pickSecondPass([{ name: 'Cainhoe Wood Golf Centre', lat: 52.0, lon: -0.4 }], 'Cainhoe Wood (Castle)')?.lat).toBe(52);
  });
  it('two qualifying candidates 15km apart are noMatch', () => {
    expect(pickSecondPass([{ name: 'Bowood Golf', lat: 51.43, lon: -2.03 }, { name: 'Bowood Park', lat: 51.56, lon: -2.03 }], 'Bowood')).toBeNull();
  });
  it('two features of one course 600m apart match', () => {
    expect(pickSecondPass([{ name: 'Bowood North', lat: 51.43, lon: -2.03 }, { name: 'Bowood South', lat: 51.4354, lon: -2.03 }], 'Bowood')?.lat).toBe(51.43);
  });
  it('a candidate whose county resolves to another stored region is rejected', async () => {
    const r = await secondPassGolf({ name: 'Barkway Park', region: 'Hertfordshire', sub_country: 'England' },
      deps(routed([feat('Barkway Park', 52, 0)])), async (m) => m.county === 'Hertfordshire');
    expect(r.kind).toBe('noMatch');
  });
  it('reverse lookup returns a town only', async () => {
    const f = vi.fn(async () => json({ results: [{ city: 'Aldenham', county: 'Hertfordshire', state: 'England', lat: 1, lon: 2 }] })) as unknown as typeof fetch;
    expect(await reverseTown(51.67, -0.35, { fetchFn: f, apiKey: 'k' })).toEqual({ kind: 'town', town: 'Aldenham' });
  });
});

const batch = (o: Partial<BatchDeps>, work: ClubRow[]) => {
  const d = { loadWorkList: async () => work, geocode: vi.fn(async () => ({ kind: 'noMatch' as const })),
    writeCoords: vi.fn(async () => ({ error: null })), stamp: vi.fn(async () => ({ error: null })),
    writeTown: vi.fn(async () => ({ error: null })), sleep: async () => {}, now: () => 0, log: () => {}, ...o };
  return { d, run: () => runBatch(d as BatchDeps) };
};

describe('Brief 22 batch wiring', () => {
  it('the second pass never runs after a first-pass match', async () => {
    const secondPass = vi.fn();
    const { run } = batch({ geocode: vi.fn(async () => ({ kind: 'match' as const, lat: 1, lng: 2, county: null, state: null, city: null })), secondPass }, [club()]);
    await run();
    expect(secondPass).not.toHaveBeenCalled();
  });
  it('a club with coordinates and no town gets its town from reverse, coordinates untouched', async () => {
    const geocode = vi.fn();
    const { d, run } = batch({ geocode, reverseTown: vi.fn(async () => ({ kind: 'town' as const, town: 'Aldenham' })) }, [club({ latitude: 51.6, longitude: -0.3 })]);
    await run();
    expect(d.writeTown).toHaveBeenCalledWith('c1', 'Aldenham');
    expect(d.writeCoords).not.toHaveBeenCalled();
    expect(geocode).not.toHaveBeenCalled();
  });
  it('a 429 from Places ends the run as blocked and stamps nothing', async () => {
    const f = vi.fn(async (u: string | URL | Request) => String(u).includes('/v2/places') ? new Response('', { status: 429 }) : json({ results: [{ place_id: 'A' }] })) as unknown as typeof fetch;
    const cache: AnchorCache = new Map();
    const { d, run } = batch({ secondPass: (c) => secondPassGolf(c, deps(f, cache)) }, [club({ name: 'Brocket Hall' }), club({ id: 'c2', name: 'Aldenham' })]);
    const s = await run();
    expect(s.stopReason).toBe('blocked');
    expect(d.stamp).not.toHaveBeenCalled();
  });
});
