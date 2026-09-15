import { describe, it, expect } from 'vitest';
import { getActivityLink } from '../activityLinks';

type Row = Parameters<typeof getActivityLink>[0];

const row = (over: Partial<Row>): Row =>
  ({
    id: 'n1',
    notif_type: 'like',
    entity_type: 'post',
    entity_id: 'p1',
    actor_user_id: 'u1',
    data: {},
    ...over,
  } as Row);

describe('activity links — reactions on a round post', () => {
  it('a like on a round opens the round', () => {
    expect(
      getActivityLink(row({ notif_type: 'like', data: { post_type: 'round', whs_score_id: 's1' } })),
    ).toBe('/round/s1');
  });

  it('a comment on a round opens the round with its comments', () => {
    expect(
      getActivityLink(row({ notif_type: 'comment', data: { post_type: 'round', whs_score_id: 's1' } })),
    ).toBe('/round/s1?openComments=1');
  });

  it('a mention on a round opens the round', () => {
    expect(
      getActivityLink(row({ notif_type: 'mention', data: { post_type: 'round', whs_score_id: 's1' } })),
    ).toBe('/round/s1');
  });

  it('is_round without a score id is not enough — falls through to the post', () => {
    const link = getActivityLink(row({ notif_type: 'like', data: { is_round: true } as never }));
    expect(link).not.toContain('/round/');
  });

  it('a like on a normal post is unchanged', () => {
    expect(getActivityLink(row({ notif_type: 'like', data: { post_id: 'p1' } }))).toContain('/post/');
  });
});
