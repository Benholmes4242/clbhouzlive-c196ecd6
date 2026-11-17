import { describe, expect, it } from 'vitest';
import { countsAsActivity } from '@/components/courses/browse/playedRings';
import { groupActivity } from '@/components/courses/browse/WhoPlayingSection';
import type { PlayedPostRow, PlayedReviewRow } from '@/components/courses/browse/usePlayedRounds';

describe('FIX_V6_REVIEW_POSTS — a review and its auto-post are one activity', () => {
  it('a review with photos and its auto-post count as ONE activity for the course', () => {
    const review = { id: 'rv1', course_id: 'c1', user_id: 'u1', rating: 8, review: 'Great', created_at: '2026-11-10T10:00:00Z' } as unknown as PlayedReviewRow;
    const autoPost = { id: 'p1', user_id: 'u1', actor_type: 'user', created_at: '2026-11-10T10:00:05Z', course_id: 'c1', tagged_course_ids: null, post_type: 'review', source_review_id: 'rv1', media_count: 3 } as PlayedPostRow;
    const linkedOnly = { ...autoPost, id: 'p2', post_type: 'regular' } as PlayedPostRow;
    expect(countsAsActivity(autoPost)).toBe(false);
    expect(countsAsActivity(linkedOnly)).toBe(false);
    const [g] = groupActivity([], [autoPost, linkedOnly].filter(countsAsActivity), [review]);
    expect(g.activity).toBe(1);
    expect(g.keys).toEqual(['review:rv1']);
  });
});
