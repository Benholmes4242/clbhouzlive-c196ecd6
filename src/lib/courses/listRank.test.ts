import { describe, it, expect } from 'vitest';
import { allListRanks, formatListRank } from './listRank';

const list = (slug: string, short_label: string | null, sort_order: number, name = 'Full Name', is_active = true) =>
  ({ slug, short_label, name, is_active, sort_order });

describe('allListRanks', () => {
  it('keeps every placement, worldwide first: Worldwide #3 · GB&I #1', () => {
    const m = allListRanks(['a'], [
      { course_id: 'a', rank: 1, top100_lists: list('gb-i', 'GB&I', 1) },
      { course_id: 'a', rank: 3, top100_lists: list('global', 'Worldwide', 5) },
    ]);
    expect(formatListRank(m.get('a'))).toBe('Worldwide #3 · GB&I #1');
  });
  it('orders non-global lists by sort_order', () => {
    const m = allListRanks(['a'], [
      { course_id: 'a', rank: 9, top100_lists: list('usa', 'USA', 4) },
      { course_id: 'a', rank: 7, top100_lists: list('europe', 'Europe', 3) },
    ]);
    expect(formatListRank(m.get('a'))).toBe('Europe #7 · USA #9');
  });
  it('falls back to name when short_label is null', () => {
    const m = allListRanks(['a'], [{ course_id: 'a', rank: 3, top100_lists: list('usa', null, 4, 'USA Top 100') }]);
    expect(formatListRank(m.get('a'))).toBe('USA Top 100 #3');
  });
  it('a course on no list formats to null', () => {
    expect(formatListRank(allListRanks(['a'], []).get('a'))).toBeNull();
  });
  it('ignores inactive lists', () => {
    const m = allListRanks(['a'], [{ course_id: 'a', rank: 1, top100_lists: list('old', 'Old', 1, 'Old', false) }]);
    expect(formatListRank(m.get('a'))).toBeNull();
  });
});
