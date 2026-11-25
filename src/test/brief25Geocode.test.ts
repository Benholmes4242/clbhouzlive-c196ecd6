import { describe, it, expect, vi } from 'vitest';
import { geocodeGolfClub } from '../../supabase/functions/_shared/geocodeGolfClub';
import { runBatch } from '../../supabase/functions/geocode-played-clubs/batch';
import type { ClubRow } from '../../supabase/functions/geocode-played-clubs/rules';

const club = (id: string): ClubRow => ({ id, name: id, country: 'England', region: null, sub_country: 'Surrey', latitude: null, longitude: null, geocode_attempted_at: null, town: null });
const NOW = Date.parse('2026-11-25T12:00:00.000Z');

describe('Brief 25 geocoding errors', () => {
  it('a timeout stamps a date 23 days back', async () => {
    const stamp = vi.fn(async () => ({ error: null }));
    const geocode = vi.fn(async () => ({ kind: 'httpError' as const, message: 'TimeoutError: Timed out' }));
    await runBatch({ loadWorkList: async () => [club('a')], geocode, writeCoords: vi.fn(async () => ({ error: null })), stamp, sleep: async () => {}, now: () => NOW, log: () => {} });
    expect(stamp).toHaveBeenCalledWith('a', { geocode_attempted_at: new Date(NOW - 23 * 86_400_000).toISOString() });
  });
  it('a 429 stamps nothing and stops the run', async () => {
    const stamp = vi.fn(async () => ({ error: null }));
    const geocode = vi.fn(async () => ({ kind: 'blocked' as const, status: 429 }));
    const s = await runBatch({ loadWorkList: async () => [club('a'), club('b')], geocode, writeCoords: vi.fn(async () => ({ error: null })), stamp, sleep: async () => {}, now: () => NOW, log: () => {} });
    expect(s.stopReason).toBe('blocked');
    expect(geocode).toHaveBeenCalledTimes(1);
    expect(stamp).not.toHaveBeenCalled();
  });
  it('a non-OK body reaches the first error log with the api key removed', async () => {
    const fetchFn = (async () => new Response('{"error":"Bad Request","url":"x?apiKey=SECRET123&y=1"}', { status: 400 })) as unknown as typeof fetch;
    const r = await geocodeGolfClub({ name: 'Walton Heath', sub_country: 'Surrey' }, fetchFn, 8000, 'SECRET123');
    const logs: string[] = [];
    await runBatch({ loadWorkList: async () => [club('a')], geocode: async () => r, writeCoords: async () => ({ error: null }), stamp: async () => ({ error: null }), sleep: async () => {}, now: () => NOW, log: (l) => logs.push(l) });
    const line = logs.find((l) => l.includes('firstHttpError'))!;
    expect(line).toContain('status=400 body=');
    expect(line).not.toContain('SECRET123');
  });
});
