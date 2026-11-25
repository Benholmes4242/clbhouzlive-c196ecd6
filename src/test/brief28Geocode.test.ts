import { describe, it, expect, vi } from 'vitest';
import { geoapifyTown } from '../../supabase/functions/_shared/geocodeGolfClub';
import { reverseLookup, secondPassGolf } from '../../supabase/functions/_shared/geocodeGolfSecondPass';
import { runBatch, type BatchDeps } from '../../supabase/functions/geocode-played-clubs/batch';
import { createHandler } from '../../supabase/functions/geocode-played-clubs/handler';
import { runProbe } from '../../supabase/functions/geocode-played-clubs/probe';
import type { ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const club = (o: Partial<ClubRow> = {}): ClubRow => ({ id: 'c1', name: 'The Grove', country: 'GB', region: null, sub_country: 'England',
  latitude: null, longitude: null, geocode_attempted_at: null, town: null, ...o });
const ID = '11111111-1111-4111-8111-111111111111';
const batch = (o: Partial<BatchDeps>, work: ClubRow[]) => {
  const d = { loadWorkList: async () => work, geocode: vi.fn(async () => ({ kind: 'noMatch' as const })),
    writeCoords: vi.fn(async () => ({ error: null })), stamp: vi.fn(async () => ({ error: null })),
    writeTown: vi.fn(async () => ({ error: null })), sleep: async () => {}, now: () => 0, log: () => {}, ...o };
  return { d, run: () => runBatch(d as BatchDeps) };
};

describe('Brief 28 A probe', () => {
  const fetchFn = vi.fn(async (u: string | URL | Request) => {
    const s = String(u);
    if (s.includes('/v2/places')) return json({ features: [] });
    if (s.includes('/reverse')) return json({ results: [{ city: 'Watford', state: 'England' }] });
    return json({ results: [{ name: 'The Grove Golf Course', state: 'England', county: 'Hertfordshire', lat: 51.7, lon: -0.4, place_id: 'P' }] });
  }) as unknown as typeof fetch;
  it('probe answers 200 synchronously, never starts the batch, and writes nothing', async () => {
    const runBatchFn = vi.fn(async () => {}), waitUntil = vi.fn();
    const loadClubs = vi.fn(async () => [club({ id: ID, latitude: 51.7, longitude: -0.4 })]);
    const h = createHandler({ cors: {}, authorize: async () => null, runBatch: runBatchFn, waitUntil,
      probe: (ids) => runProbe(ids, { loadClubs, fetchFn, apiKey: 'SECRETKEY', sleep: async () => {} }) });
    const res = await h(new Request('http://x', { method: 'POST', body: JSON.stringify({ action: 'probe', club_ids: [ID] }) }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.probe).toBe(true);
    expect(body.clubs[0].first_pass.outcome.picked.lat).toBe(51.7);
    expect(runBatchFn).not.toHaveBeenCalled();
    expect(waitUntil).not.toHaveBeenCalled();
    for (const [, init] of (fetchFn as unknown as { mock: { calls: [unknown, RequestInit | undefined][] } }).mock.calls) expect(init?.method ?? 'GET').toBe('GET');
  });
  it('the api key never appears in the probe response', async () => {
    const r = await runProbe([ID], { loadClubs: async () => [club({ id: ID, latitude: 51.7, longitude: -0.4 })], fetchFn, apiKey: 'SECRETKEY', sleep: async () => {} });
    const text = JSON.stringify(r);
    expect(text).not.toContain('SECRETKEY');
    expect(text).toContain('apiKey=***');
  });
  it('more than ten ids is a 400', async () => {
    const h = createHandler({ cors: {}, authorize: async () => null, runBatch: async () => {}, waitUntil: () => {}, probe: async () => ({}) });
    const res = await h(new Request('http://x', { method: 'POST', body: JSON.stringify({ action: 'probe', club_ids: Array(11).fill(ID) }) }));
    expect(res.status).toBe(400);
    await res.text();
  });
});

describe('Brief 28 B towns', () => {
  it('a result with only town set gives that town', () => {
    expect(geoapifyTown({ town: 'Tralee', county: 'County Kerry' })).toBe('Tralee');
  });
  it('a result with only hamlet set gives that hamlet', () => {
    expect(geoapifyTown({ hamlet: 'Waterville', county: 'County Kerry' })).toBe('Waterville');
  });
  it('no town from the first reverse makes one type=city request', async () => {
    const seen: string[] = [];
    const f = vi.fn(async (u: string | URL | Request) => { seen.push(String(u));
      return json({ results: [String(u).includes('type=city') ? { city: 'Ballybunion', country: 'Ireland' } : { county: 'County Kerry', country: 'Ireland' }] }); }) as unknown as typeof fetch;
    const r = await reverseLookup(52.5, -9.6, { fetchFn: f, apiKey: 'k', pace: async () => {} });
    expect(r).toMatchObject({ kind: 'town', town: 'Ballybunion' });
    expect(seen).toHaveLength(2);
    expect(seen[1]).toContain('type=city');
  });
});

describe('Brief 28 C wrong pins', () => {
  const pin = { latitude: 53.7798, longitude: -7.3055 };
  it('an England club pinned in Ireland is cleared and not stamped', async () => {
    const clearPin = vi.fn(async () => ({ error: null }));
    const { d, run } = batch({ clearPin, reverseTown: async () => ({ kind: 'town' as const, town: 'Mullingar', place: { suburb: null, city: null, town: 'Mullingar', village: null, hamlet: null, locality: null, county: 'County Westmeath', state: null, country: 'Ireland' } }) }, [club(pin)]);
    const s = await run();
    expect(clearPin).toHaveBeenCalledWith('c1', pin);
    expect(s.wrongPinCleared).toBe(1);
    expect(d.stamp).not.toHaveBeenCalled();
    expect(d.writeTown).not.toHaveBeenCalled();
  });
  it('a pin in the matching nation is left alone', async () => {
    const clearPin = vi.fn(async () => ({ error: null }));
    const { d, run } = batch({ clearPin, reverseTown: async () => ({ kind: 'town' as const, town: 'Watford', place: { suburb: null, city: 'Watford', town: null, village: null, hamlet: null, locality: null, county: 'Hertfordshire', state: 'England', country: 'United Kingdom' } }) }, [club({ latitude: 51.7, longitude: -0.4 })]);
    const s = await run();
    expect(clearPin).not.toHaveBeenCalled();
    expect(s.wrongPinCleared).toBe(0);
    expect(d.writeTown).toHaveBeenCalledWith('c1', 'Watford');
  });
});

describe('Brief 28 D national fallback', () => {
  const routed = (features: unknown[]) => vi.fn(async (u: string | URL | Request) => {
    const s = String(u);
    if (s.includes('/v1/geocode/search')) return json({ results: s.includes('Kent') ? [] : [{ place_id: 'ENGLAND' }] });
    return json({ features });
  }) as unknown as typeof fetch;
  it('finds a club filed under the wrong county and corrects the region', async () => {
    const f = routed([{ properties: { name: 'Hanbury Manor Golf Club', lat: 51.85, lon: -0.03, county: 'Hertfordshire', state: 'England' } }]);
    const correctRegion = vi.fn(async () => ({ error: null }));
    const logs: string[] = [];
    const resolver = { geoResolve: async (raw: string) => raw, alias: async () => null };
    const { d, run } = batch({ secondPass: (c, acc) => secondPassGolf(c, { fetchFn: f, apiKey: 'k', cache: new Map(), pace: async () => {} }, acc),
      resolver, correctRegion, log: (l) => logs.push(l) }, [club({ name: 'Hanbury Manor', region: 'Kent' })]);
    const s = await run();
    expect(d.writeCoords).toHaveBeenCalledWith('c1', { latitude: 51.85, longitude: -0.03 });
    expect(correctRegion).toHaveBeenCalledWith('c1', 'Kent', 'Hertfordshire');
    expect(s.regionCorrected).toBe(1);
    expect(logs).toContain('regionCorrected club=c1 from=Kent to=Hertfordshire');
  });
  it('two far-apart matches nationwide give noMatch', async () => {
    const f = routed([{ properties: { name: 'Park Wood Golf', lat: 51.2, lon: 0.1 } }, { properties: { name: 'Park Wood Golf Club', lat: 53.4, lon: -1.5 } }]);
    const r = await secondPassGolf({ name: 'Park Wood', region: 'Kent', sub_country: 'England' }, { fetchFn: f, apiKey: 'k', cache: new Map(), pace: async () => {} });
    expect(r.kind).toBe('noMatch');
  });
  it('a comma sub_country searches with its last part', async () => {
    const seen: string[] = [];
    const f = vi.fn(async (u: string | URL | Request) => { seen.push(String(u)); return json({ results: [] }); }) as unknown as typeof fetch;
    await secondPassGolf({ name: 'Bristol and Clifton', region: null, sub_country: 'Bristol, England' }, { fetchFn: f, apiKey: 'k', cache: new Map(), pace: async () => {} });
    expect(new URL(seen[0]).searchParams.get('text')).toBe('England');
  });
});

describe('Brief 28 E courses follow the club', () => {
  it('counts course rows filled with the club coordinates', async () => {
    const { run } = batch({ geocode: vi.fn(async () => ({ kind: 'match' as const, lat: 1, lng: 2, county: null, state: null, city: null })),
      writeCoords: vi.fn(async () => ({ error: null, courses: 3 })) }, [club()]);
    expect((await run()).coursesFilled).toBe(3);
  });
});
