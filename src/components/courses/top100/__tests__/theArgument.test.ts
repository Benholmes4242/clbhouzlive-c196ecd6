import { describe, expect, it } from 'vitest';
import { argumentGroups } from '../theArgument';

const c = (id: string, publishedRank: number, rating: number, ratingCount = 5) =>
  ({ id, name: id, imageUrl: null, publishedRank, rating, ratingCount });

describe('The argument — argumentGroups', () => {
  it('exposes both ranks within the qualifying set without changing divergence', () => {
    const { higher, lower } = argumentGroups([c('a', 10, 6), c('b', 40, 7), c('c', 90, 8)]);
    const a = lower.find((row) => row.id === 'a');
    const cc = higher.find((row) => row.id === 'c');
    expect(a).toMatchObject({ publishedRank: 10, listRank: 1, memberRank: 3, divergence: -2 });
    expect(cc).toMatchObject({ publishedRank: 90, listRank: 3, memberRank: 1, divergence: 2 });
  });
  it('splits risers and fallers into their own groups', () => {
    const { higher, lower } = argumentGroups([c('a', 1, 9), c('b', 2, 5), c('c', 3, 6)]);
    // Members: a(9) c(6) b(5) → a rises 0... recompute: list a1 b2 c3, members a1 c2 b3
    expect(higher.map((r) => r.id)).toEqual(['c']);
    expect(lower.map((r) => r.id)).toEqual(['b']);
  });
  it('caps each group at three, largest divergence first, published rank breaks ties', () => {
    // List order 1..8; members rate in exact reverse → divergences ±7, ±5, ±3, ±1.
    const inputs = [
      c('a', 1, 1), c('b', 2, 2), c('c', 3, 3), c('d', 4, 4),
      c('e', 5, 5), c('f', 6, 6), c('g', 7, 7), c('h', 8, 8),
    ];
    const { higher, lower } = argumentGroups(inputs);
    expect(higher.map((r) => r.id)).toEqual(['h', 'g', 'f']);
    expect(higher.map((r) => r.divergence)).toEqual([7, 5, 3]);
    expect(lower.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(lower.map((r) => r.divergence)).toEqual([-7, -5, -3]);
  });
  it('equal divergences order by published rank', () => {
    // Members: x and y both rated 8 → tie broken by published rank (x first).
    const { higher } = argumentGroups([c('x', 5, 8), c('y', 6, 8), c('z', 7, 1)]);
    expect(higher.map((r) => r.id)).toEqual(['x', 'y']);
    expect(higher[0].divergence).toBe(2);
  });
  it('excludes courses whose divergence is zero', () => {
    const { higher, lower } = argumentGroups([c('a', 1, 9), c('b', 2, 8), c('c', 3, 7)]);
    expect(higher).toEqual([]);
    expect(lower).toEqual([]);
  });
  it('a course with fewer than three ratings never appears', () => {
    const { higher, lower } = argumentGroups([c('a', 1, 6), c('b', 2, 7), c('c', 3, 8), c('d', 4, 9.9, 2)]);
    expect([...higher, ...lower].map((r) => r.id)).not.toContain('d');
  });
  it('returns two empty groups when fewer than three courses qualify', () => {
    expect(argumentGroups([c('a', 1, 6), c('b', 2, 9), c('c', 3, 9.9, 1)])).toEqual({ higher: [], lower: [] });
  });
});
