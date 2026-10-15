import { describe, expect, it } from 'vitest';
import { argumentRows } from '../theArgument';

const c = (id: string, publishedRank: number, rating: number, ratingCount = 5) =>
  ({ id, name: id, imageUrl: null, publishedRank, rating, ratingCount });

describe('The argument', () => {
  it('exposes both ranks within the qualifying set without changing divergence', () => {
    const rows = argumentRows([c('a', 10, 6), c('b', 40, 7), c('c', 90, 8)]);
    expect(rows.find((row) => row.id === 'a')).toMatchObject({ publishedRank: 10, listRank: 1, memberRank: 3, divergence: -2 });
    expect(rows.find((row) => row.id === 'c')).toMatchObject({ publishedRank: 90, listRank: 3, memberRank: 1, divergence: 2 });
  });
  it('a course with fewer than three ratings never appears', () => {
    const rows = argumentRows([c('a', 1, 6), c('b', 2, 7), c('c', 3, 8), c('d', 4, 9.9, 2)]);
    expect(rows.map((r) => r.id)).not.toContain('d');
  });
  it('renders nothing when fewer than three courses qualify', () => {
    expect(argumentRows([c('a', 1, 6), c('b', 2, 9), c('c', 3, 9.9, 1)])).toEqual([]);
  });
  it('returns at most three rows, largest divergence first, signed up = we rank it higher', () => {
    const rows = argumentRows([c('a', 1, 5), c('b', 2, 6), c('c', 3, 7), c('d', 4, 8), c('e', 5, 9)]);
    expect(rows).toHaveLength(3);
    expect(rows[0].id).toBe('a');
    expect(rows[0].divergence).toBe(-4);
    expect(rows[1].divergence).toBe(4);
  });
});
