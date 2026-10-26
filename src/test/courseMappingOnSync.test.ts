import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import { runCourseMappingRequest, requestCourseMapping, pickUnprocessed } from '../../supabase/functions/_shared/courseMappingTrigger';
import { parseCoursesBody, neverProcessed } from '../../supabase/functions/gam-course-mapping-orchestrator/coursesMode';

const client = (mappedIds: string[], error: unknown = null) => ({
  from: vi.fn(() => ({ select: () => ({ in: async () => ({ data: error ? null : mappedIds.map((whs_course_id) => ({ whs_course_id })), error }) }) })),
});
const ids = (n: number) => Array.from({ length: n }, (_, i) => `c${i}`);

describe('orchestrator courses mode', () => {
  it('processes only never-processed ids; any map row is skipped', () => {
    expect(neverProcessed(['a', 'b', 'c', 'd'], ['b', 'd'])).toEqual(['a', 'c']);
  });
  it('caps at 25 and rejects more than 25', () => {
    expect(parseCoursesBody({ whs_course_ids: ids(25) })).toEqual({ ok: true, ids: ids(25) });
    expect(parseCoursesBody({ whs_course_ids: ids(26) }).ok).toBe(false);
    expect(parseCoursesBody({ whs_course_ids: 'x' }).ok).toBe(false);
    expect(neverProcessed(ids(30), [])).toHaveLength(25);
  });
  it('returns lock_busy when locked, same lock, version bumped, gate kept', () => {
    const src = fs.readFileSync('supabase/functions/gam-course-mapping-orchestrator/index.ts', 'utf8');
    expect(src).toContain('return json({ skipped: true, reason: "lock_busy", mode }, 200);');
    expect(src.match(/try_acquire_orchestrator_lock/g)).toHaveLength(1);
    expect(src.indexOf('parseCoursesBody(body)')).toBeLessThan(src.indexOf('try_acquire_orchestrator_lock'));
    expect(src).toContain('requireInternalSecret(req, corsHeaders)');
    expect(src).not.toContain('2026-08-11-cors-and-error-queue-v2');
  });
});

describe('requestCourseMapping', () => {
  it('sends only unprocessed ids, most played first, capped at 25, with the internal secret', async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 200, text: async () => '' }));
    const counts = new Map(ids(30).map((id, i) => [id, i] as [string, number]));
    const r = await runCourseMappingRequest(client(['c29']), ids(30), counts, { fetch, baseUrl: 'https://x', secret: 's3' });
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, any];
    expect(url).toBe('https://x/functions/v1/gam-course-mapping-orchestrator');
    expect(init.headers['x-internal-secret']).toBe('s3');
    const body = JSON.parse(init.body);
    expect(body.mode).toBe('courses');
    expect(body.whs_course_ids).toHaveLength(25);
    expect(body.whs_course_ids[0]).toBe('c28');
    expect(body.whs_course_ids).not.toContain('c29');
    expect(r.sent).toEqual(body.whs_course_ids);
  });
  it('most played order with stable ties', () => {
    expect(pickUnprocessed(['a', 'b', 'c'], new Set(), new Map([['c', 4], ['a', 1], ['b', 1]]))).toEqual(['c', 'a', 'b']);
  });
  it('makes no call when every id has a map row', async () => {
    const fetch = vi.fn();
    await runCourseMappingRequest(client(['a', 'b']), ['a', 'b'], new Map(), { fetch: fetch as any });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('a 500, a thrown fetch or a lookup error never throws or blocks the caller', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const five = vi.fn(async () => ({ ok: false, status: 500, text: async () => '' }));
    await expect(runCourseMappingRequest(client([]), ['a'], new Map(), { fetch: five, baseUrl: 'x' })).resolves.toBeTruthy();
    const boom = vi.fn(async () => { throw new Error('net'); });
    await expect(runCourseMappingRequest(client([]), ['a'], new Map(), { fetch: boom as any, baseUrl: 'x' })).resolves.toBeTruthy();
    await expect(runCourseMappingRequest(client([], new Error('db')), ['a'])).resolves.toBeTruthy();
    // Fire-and-forget: returns synchronously even when the request never settles.
    const hang = vi.fn(() => new Promise<never>(() => {}));
    const t0 = Date.now();
    expect(requestCourseMapping(client([]), ['a'], new Map(), { fetch: hang as any, baseUrl: 'x' })).toBeUndefined();
    expect(Date.now() - t0).toBeLessThan(50);
    expect(() => requestCourseMapping(null as any, ['a'])).not.toThrow();
    err.mockRestore();
  });
});

describe('sync wiring', () => {
  it('upsertScores calls requestCourseMapping once, right after the course upsert, unawaited', () => {
    const src = fs.readFileSync('supabase/functions/_shared/eg-api.ts', 'utf8');
    const body = src.slice(src.indexOf('export async function upsertScores'));
    const fnBody = body.slice(0, body.indexOf('\nexport ', 10));
    expect(fnBody.match(/requestCourseMapping\(/g)).toHaveLength(1);
    expect(fnBody.indexOf('upsertCoursesFromScores(client, scores)')).toBeLessThan(fnBody.indexOf('requestCourseMapping('));
    expect(fnBody).not.toMatch(/await\s+requestCourseMapping/);
  });
  it.each(['connect-whs', 'sync-whs-due', 'sync-whs-one'])('%s reaches it through one upsertScores per sync', (fn) => {
    const src = fs.readFileSync(`supabase/functions/${fn}/index.ts`, 'utf8');
    expect(src.match(/await upsertScores\(/g)).toHaveLength(1);
    expect(src).not.toContain('requestCourseMapping');
  });
});
