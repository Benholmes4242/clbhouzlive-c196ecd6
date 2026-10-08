import { describe, it, expect } from 'vitest';
import { roundCourseIdsFor } from '@/components/feed/roundCourseIds';

describe('roundCourseIdsFor', () => {
  it('collects a round post course id before any score id has resolved', () => {
    const posts = [
      { id: 'a', postType: 'round', courseId: 'c1' },
      { id: 'b', postType: 'round', courseId: 'c1' },
      { id: 'c', postType: 'photo', courseId: 'c2' },
      { id: 'd', postType: 'round', courseId: null },
    ] as never;
    expect(roundCourseIdsFor(posts)).toEqual(['c1']);
  });
});
