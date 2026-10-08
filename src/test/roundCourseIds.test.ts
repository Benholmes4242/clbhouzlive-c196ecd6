import { describe, it, expect } from 'vitest';
import { roundCourseIdsFor } from '@/components/feed/roundCourseIds';

describe('roundCourseIdsFor', () => {
  it('collects course ids of posts with a score id, with no postType on the post (as real rows arrive)', () => {
    const posts = [
      { id: 'a', courseId: 'c1' },
      { id: 'b', courseId: 'c1' },
      { id: 'c', courseId: 'c2' },
      { id: 'd', courseId: null },
    ] as never;
    const sids = new Map([['a', 's1'], ['b', 's2'], ['d', 's3']]);
    expect(roundCourseIdsFor(posts, sids)).toEqual(['c1']);
  });
});
