import { describe, it, expect } from 'vitest';
import { getActivityLink } from '../activityLinks';
import type { ActivityFeedRowV2 } from '../../hooks/useActivityFeedV2';

/** R3.3 — a like on a review lands on the review, not on /post/:id. */
function row(partial: Partial<ActivityFeedRowV2>): ActivityFeedRowV2 {
  return {
    notif_id: 'n1',
    notif_type: 'like',
    created_at: '2026-09-19T10:00:00Z',
    is_read: false,
    message: null,
    title: null,
    entity_id: 'post-1',
    entity_type: 'post',
    data: null,
    actor_user_id: 'u1',
    actor_username: null,
    actor_display_name: null,
    actor_avatar_url: null,
    actor_kind: 'personal',
    actor_route_id: 'u1',
    liker_avatar_urls: null,
    target_course_name: null,
    target_course_image: null,
    target_poster_url: null,
    target_review_rating: null,
    ...partial,
  };
}

const CID = '11111111-1111-1111-1111-111111111111';
const RID = '22222222-2222-2222-2222-222222222222';

describe('activityLinks — like on a review', () => {
  it('routes a business like on a review post to the review permalink', () => {
    expect(
      getActivityLink(
        row({ data: { post_id: 'post-1', target_type: 'review', review_id: RID, course_id: CID } }),
      ),
    ).toBe(`/courses/${CID}?tab=reviews&review=${RID}`);
  });

  it('accepts target_id when review_id is absent', () => {
    expect(
      getActivityLink(
        row({ data: { post_id: 'post-1', target_type: 'review', target_id: RID, course_id: CID } }),
      ),
    ).toBe(`/courses/${CID}?tab=reviews&review=${RID}`);
  });

  it('falls back to the Reviews tab when the review id is missing', () => {
    expect(
      getActivityLink(row({ data: { post_id: 'post-1', target_type: 'review', course_id: CID } })),
    ).toBe(`/courses/${CID}?tab=reviews`);
  });

  it('falls back to /post/:id without a course id', () => {
    expect(
      getActivityLink(row({ data: { post_id: 'post-1', target_type: 'review', review_id: RID } })),
    ).toBe('/post/post-1');
  });

  it('leaves pre-R3.3 like rows on /post/:id', () => {
    expect(getActivityLink(row({ data: { post_id: 'post-1' } }))).toBe('/post/post-1');
  });

  it('still resolves a personal reaction on a review the same way', () => {
    expect(
      getActivityLink(
        row({
          notif_type: 'reaction',
          entity_type: 'review',
          data: { target_type: 'review', target_id: RID, course_id: CID },
        }),
      ),
    ).toBe(`/courses/${CID}?tab=reviews&review=${RID}`);
  });
});
