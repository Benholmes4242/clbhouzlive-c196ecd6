import { describe, it, expect, vi } from 'vitest';
import { shouldStartNext } from '../../supabase/functions/geocode-played-clubs/rules';
import { createHandler } from '../../supabase/functions/geocode-played-clubs/handler';

describe('shouldStartNext', () => {
  it('true at 0 ms / 0 processed', () => expect(shouldStartNext(0, 0)).toBe(true));
  it('false past 100,000 ms', () => expect(shouldStartNext(100_001, 0)).toBe(false));
  it('false at 40 processed', () => expect(shouldStartNext(0, 40)).toBe(false));
});

describe('handler', () => {
  it('returns 202 before the batch completes', async () => {
    const waitUntil = vi.fn();
    const h = createHandler({ cors: {}, authorize: async () => null, runBatch: () => new Promise<void>(() => {}), waitUntil });
    const res = await h(new Request('http://x', { method: 'POST' }));
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ started: true });
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });
  it('returns 403 for no credentials and never starts the batch', async () => {
    const runBatch = vi.fn(async () => {});
    const h = createHandler({ cors: {}, authorize: async () => new Response('{}', { status: 403 }), runBatch, waitUntil: vi.fn() });
    const res = await h(new Request('http://x', { method: 'POST' }));
    expect(res.status).toBe(403);
    expect(runBatch).not.toHaveBeenCalled();
  });
});
