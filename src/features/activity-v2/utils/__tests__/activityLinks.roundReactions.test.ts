/**
 * ROUND REACTIONS ROUTE TO THE ROUND, non-round reactions do not.
 *
 * These assert the client half of docs/sql/2026-09-15-round-reaction-notifications.sql:
 * once the like / comment / mention triggers write post_type + whs_score_id +
 * is_round (the same keys new_post writes), the resolver's round branch already
 * fires with NO further client change.
 */
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

/** Exactly what the rebuilt triggers append. */
const roundData = { post_id: 'p1', post_type: 'round', whs_score_id: 's1', is_round: true };

describe('reactions on a round post', () => {
  it.each(['like', 'like_post'])('%s opens the round', (t) => {
    expect(getActivityLink(row({ notif_type: t, data: roundData }))).toBe('/round/s1');
  });

  it.each(['comment', 'comment_post', 'comment_reply', 'comment_mention'])(
    '%s opens the round with its comments',
    (t) => {
      expect(getActivityLink(row({ notif_type: t, data: roundData }))).toBe(
        '/round/s1?openComments=1',
      );
    },
  );

  it.each(['mention', 'mention_post', 'tag'])('%s opens the round', (t) => {
    expect(
      getActivityLink(row({ notif_type: t, data: { ...roundData, source_type: 'post' } })),
    ).toBe('/round/s1');
  });

  it('new_post on a round is unchanged', () => {
    expect(getActivityLink(row({ notif_type: 'new_post', data: roundData }))).toBe('/round/s1');
  });

  it('no /post/ step on the way', () => {
    for (const t of ['like', 'comment', 'mention']) {
      expect(getActivityLink(row({ notif_type: t, data: roundData }))).not.toContain('/post/');
    }
  });
});

describe('reactions on a normal post are untouched', () => {
  it('a like opens the post', () => {
    expect(getActivityLink(row({ notif_type: 'like', data: { post_id: 'p1' } }))).toBe('/post/p1');
  });
  it('a comment opens the post comment', () => {
    expect(
      getActivityLink(row({ notif_type: 'comment', data: { post_id: 'p1', comment_id: 'c1' } })),
    ).toBe('/post/p1/comment/c1');
  });
  it('a mention in a post opens the post', () => {
    expect(
      getActivityLink(row({ notif_type: 'mention', data: { post_id: 'p1', source_type: 'post' } })),
    ).toBe('/post/p1');
  });
  it('a score id without is_round / post_type is not a round', () => {
    expect(
      getActivityLink(row({ notif_type: 'like', data: { post_id: 'p1', whs_score_id: 's1' } })),
    ).toBe('/post/p1');
  });
});
