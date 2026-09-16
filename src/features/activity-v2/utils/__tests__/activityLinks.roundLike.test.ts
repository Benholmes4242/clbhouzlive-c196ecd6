/**
 * ROUND LIKE NOTIFICATIONS OPEN THE ROUND, in BOTH entity shapes written by
 * docs/sql/round_like_notifications.sql:
 *   - a round WITH a post: entity_type 'post', entity_id = post id
 *   - a round WITHOUT a post: entity_type 'round', entity_id = whs_score_id
 * Both always carry post_type 'round', whs_score_id and is_round, which is what
 * the resolver routes on, so neither shape takes a /post/ step.
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

const roundData = { post_type: 'round', whs_score_id: 's1', is_round: true };

describe('round like notifications', () => {
  it('post-backed shape opens the round', () => {
    expect(
      getActivityLink(row({ entity_type: 'post', entity_id: 'p1', data: { ...roundData, post_id: 'p1' } })),
    ).toBe('/round/s1');
  });

  it('post-less shape opens the round', () => {
    expect(
      getActivityLink(row({ entity_type: 'round', entity_id: 's1', data: roundData })),
    ).toBe('/round/s1');
  });

  it('neither shape passes through /post/', () => {
    for (const entity of ['post', 'round'] as const) {
      expect(getActivityLink(row({ entity_type: entity, data: roundData }))).not.toContain('/post/');
    }
  });

  it('an aggregated multi-liker row routes the same', () => {
    expect(
      getActivityLink(
        row({ data: { ...roundData, like_count: 3 } as unknown as Record<string, string> }),
      ),
    ).toBe('/round/s1');
  });

  it('a like on a normal post is unchanged', () => {
    expect(getActivityLink(row({ data: { post_id: 'p1' } }))).toBe('/post/p1');
  });

  it('the legacy round reaction row still opens the scorecard', () => {
    expect(
      getActivityLink(
        row({ notif_type: 'reaction', entity_type: 'round', entity_id: 's1', data: { target_type: 'round', score_id: 's1' } }),
      ),
    ).toBe('/handicap?score=s1');
  });
});
