import { describe, expect, it } from 'vitest';
import { communityOrder } from '../communityOrder';

type C = { id: string; rating: number | null; count: number; rank: number | null; name: string };
const c = (id: string, rating: number | null, count: number, rank: number | null, name = id): C => ({ id, rating, count, rank, name });
const run = (xs: C[]) =>
  communityOrder(xs, (x) => ({ rating: x.rating, ratingCount: x.count }), (x) => x.rank, (x) => x.name);
const ratedIds = (xs: C[]) => run(xs).rated.map((r) => r.course.id);

describe('communityOrder', () => {
  it('one rating qualifies', () => {
    expect(ratedIds([c('a', 7.0, 1, 5)])).toEqual(['a']);
  });
  it('null rating or zero count goes to unrated', () => {
    const out = run([c('a', null, 3, 1), c('b', 8, 0, 2)]);
    expect(out.rated).toEqual([]);
    expect(out.unrated.map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('higher rating first', () => {
    expect(ratedIds([c('a', 7, 1, 1), c('b', 9, 1, 2)])).toEqual(['b', 'a']);
  });
  it('equal rating, more ratings first', () => {
    expect(ratedIds([c('a', 8, 1, 1), c('b', 8, 4, 2)])).toEqual(['b', 'a']);
  });
  it('equal rating and count, better official rank first', () => {
    expect(ratedIds([c('a', 8, 2, 9), c('b', 8, 2, 3)])).toEqual(['b', 'a']);
  });
  it('equal all, name order', () => {
    expect(ratedIds([c('x', 8, 2, 3, 'Zeta'), c('y', 8, 2, 3, 'Alpha')])).toEqual(['y', 'x']);
  });
  it('positions are 1..n with no gaps', () => {
    expect(run([c('a', 6, 1, 1), c('b', 9, 1, 2), c('d', null, 0, 3), c('e', 7, 2, 4)]).rated.map((r) => r.position)).toEqual([1, 2, 3]);
  });
  it('unrated in official order, null ranks last', () => {
    expect(run([c('a', null, 0, null), c('b', null, 0, 40), c('d', null, 0, 2)]).unrated.map((x) => x.id)).toEqual(['d', 'b', 'a']);
  });
  it('empty input', () => {
    expect(run([])).toEqual({ rated: [], unrated: [] });
  });
});
