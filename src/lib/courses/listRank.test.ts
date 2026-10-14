import { describe, it, expect } from 'vitest';
import { strongestListRanks } from './listRank';

const list = (short_label: string | null, name = 'Full Name', is_active = true) => ({ short_label, name, is_active });

describe('strongestListRanks', () => {
  it('takes the lowest rank across lists: GB&I #42 beats Global #94', () => {
    const m = strongestListRanks(['a'], [
      { course_id: 'a', rank: 94, top100_lists: list('Global') },
      { course_id: 'a', rank: 42, top100_lists: list('GB&I') },
    ]);
    expect(m.get('a')).toEqual({ label: 'GB&I', rank: 42 });
  });
  it('falls back to name when short_label is null', () => {
    const m = strongestListRanks(['a'], [{ course_id: 'a', rank: 3, top100_lists: list(null, 'USA Top 100') }]);
    expect(m.get('a')).toEqual({ label: 'USA Top 100', rank: 3 });
  });
  it('a course on no list is null', () => {
    expect(strongestListRanks(['a'], []).get('a')).toBeNull();
  });
  it('ignores inactive lists', () => {
    const m = strongestListRanks(['a'], [{ course_id: 'a', rank: 1, top100_lists: list('Old', 'Old', false) }]);
    expect(m.get('a')).toBeNull();
  });
});
