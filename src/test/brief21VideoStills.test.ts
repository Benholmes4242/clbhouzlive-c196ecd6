import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractPoster, __resetPosterQueue, POSTER_MAX_EDGE } from '@/features/post-v2/lib/videoPoster';

/** A video environment that decodes only one element at a time. */
const env = { active: 0, maxActive: 0, created: [] as string[], failing: new Set<string>(), failCount: new Map<string, number>(), draws: [] as string[] };
const realCreate = document.createElement.bind(document);
beforeEach(() => {
  __resetPosterQueue();
  Object.assign(env, { active: 0, maxActive: 0, created: [], failing: new Set(), failCount: new Map(), draws: [] });
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const el = realCreate(tag) as HTMLElement;
    if (tag === 'canvas') {
      const c = el as HTMLCanvasElement;
      c.getContext = (() => ({ drawImage: () => {} })) as never;
      c.toDataURL = () => `data:${c.width}x${c.height}`;
    }
    if (tag !== 'video') return el;
    const v = el as HTMLVideoElement;
    let src = ''; let t = 0; let ready = 0;
    Object.defineProperty(v, 'readyState', { get: () => ready });
    Object.defineProperty(v, 'videoWidth', { get: () => 1920 });
    Object.defineProperty(v, 'videoHeight', { get: () => 1080 });
    Object.defineProperty(v, 'duration', { get: () => 20 });
    Object.defineProperty(v, 'error', { get: () => null });
    Object.defineProperty(v, 'currentTime', { get: () => t, set: (x: number) => { t = x; setTimeout(() => { env.draws.push(`${src}@${x}`); v.dispatchEvent(new Event('seeked')); }, 0); } });
    v.play = () => Promise.resolve();
    v.pause = () => {};
    v.load = () => {};
    Object.defineProperty(v, 'src', { get: () => src, set: (s: string) => {
      src = s; env.created.push(s); env.active += 1; env.maxActive = Math.max(env.maxActive, env.active);
      const fails = env.failing.has(s);
      setTimeout(() => { if (fails) { env.failCount.set(s, (env.failCount.get(s) ?? 0) + 1); v.dispatchEvent(new Event('error')); return; } ready = env.active === 1 ? 4 : 0; v.dispatchEvent(new Event('loadedmetadata')); }, 0);
    } });
    const remove = v.remove.bind(v);
    v.remove = () => { if (src || env.created.length) env.active -= 1; remove(); };
    return v;
  }) as never);
});
afterEach(() => { vi.restoreAllMocks(); });

describe('Brief 21 H — composer stills never black', () => {
  it('one source resolves the thumb and four cover frames with one active element, capped at 480px', async () => {
    const out = await Promise.all([extractPoster('a', 'blob:a', 0.1), ...[2, 6, 10, 14].map((s) => extractPoster(`a:cover:${s}`, 'blob:a', s))]);
    expect(out.every(Boolean)).toBe(true);
    expect(out[0]).toBe(`data:${POSTER_MAX_EDGE}x270`);
    expect(env.created).toEqual(['blob:a']);
    expect(env.maxActive).toBe(1);
  });
  it('two sources resolve in order, one element at a time', async () => {
    const order: string[] = [];
    await Promise.all([
      extractPoster('a', 'blob:a').then(() => order.push('a')),
      extractPoster('b', 'blob:b').then(() => order.push('b')),
      extractPoster('a:cover:2', 'blob:a', 2).then(() => order.push('a2')),
    ]);
    expect(order).toEqual(['a', 'a2', 'b']);
    expect(env.created).toEqual(['blob:a', 'blob:b']);
    expect(env.maxActive).toBe(1);
  });
  it('a failing source retries once at the back of the queue, then resolves null', async () => {
    env.failing.add('blob:bad');
    const order: string[] = [];
    const [bad, good] = await Promise.all([
      extractPoster('bad', 'blob:bad').then((v) => { order.push('bad'); return v; }),
      extractPoster('good', 'blob:good').then((v) => { order.push('good'); return v; }),
    ]);
    expect(bad).toBeNull();
    expect(good).toBeTruthy();
    expect(env.failCount.get('blob:bad')).toBe(2);
    expect(order).toEqual(['good', 'bad']);
    expect(env.created).toEqual(['blob:bad', 'blob:good', 'blob:bad']);
  });
});
