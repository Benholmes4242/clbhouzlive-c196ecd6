import { describe, expect, it } from 'vitest';
import { activeTop100CourseIds, featuredScore, NO_SIGNALS, type RingGroup } from '@/components/courses/browse/playedRings';

const g = { courseId: 'c1' } as unknown as RingGroup;
const seenAll = null;
const base = (ids: Set<string>) => featuredScore(g, { ...NO_SIGNALS, top100Ids: ids }, seenAll) - featuredScore(g, NO_SIGNALS, seenAll);

describe('V6 §3 Featured Top 100 — every active list, counted once', () => {
  it('a course on two active lists scores +10 once', () => {
    const ids = activeTop100CourseIds([
      { course_id: 'c1', top100_lists: { slug: 'global', is_active: true } },
      { course_id: 'c1', top100_lists: { slug: 'gb-i', is_active: true } },
    ]);
    expect(base(ids)).toBe(10);
  });
  it('a course only on an inactive list gets nothing for Top 100', () => {
    const ids = activeTop100CourseIds([{ course_id: 'c1', top100_lists: { slug: 'europe', is_active: false } }]);
    expect(ids.has('c1')).toBe(false);
    expect(base(ids)).toBe(0);
  });
});
