import { describe, it, expect } from 'vitest';
import { pickRotating } from '../rotation';

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pool = Array.from({ length: 10 }, (_, i) => `r${i}`);
const id = (s: string) => s;

describe('pickRotating', () => {
  it('returns count items', () => {
    expect(pickRotating(pool, id, [], 4, seeded(5))).toHaveLength(4);
  });
  it('excludes previous ids when enough others exist', () => {
    const prev = ['r0', 'r1', 'r2', 'r3'];
    pickRotating(pool, id, prev, 4, seeded(9)).forEach((x) => expect(prev).not.toContain(x));
  });
  it('preserves pool order', () => {
    const out = pickRotating(pool, id, [], 5, seeded(11));
    expect(out).toEqual([...out].sort((a, b) => pool.indexOf(a) - pool.indexOf(b)));
  });
  it('a pool smaller than count returns the whole pool', () => {
    expect(pickRotating(['a', 'b'], id, [], 4, seeded(1))).toEqual(['a', 'b']);
  });
});
