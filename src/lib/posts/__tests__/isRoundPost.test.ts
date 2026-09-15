import { describe, it, expect } from 'vitest';
import { isRoundPost, ROUND_POST_TYPE } from '../isRoundPost';

describe('isRoundPost', () => {
  it('is post_type = round and nothing else', () => {
    expect(isRoundPost({ post_type: 'round' })).toBe(true);
    expect(isRoundPost({ postType: 'round' })).toBe(true);
    expect(isRoundPost({ post_type: 'regular' })).toBe(false);
    expect(isRoundPost({ post_type: null })).toBe(false);
    expect(isRoundPost(null)).toBe(false);
    expect(isRoundPost(undefined)).toBe(false);
  });

  it('does not infer a round from an attached score id', () => {
    // The deployed post_is_round() tests whs_score_id; the client predicate is
    // post_type, so a normal post that happens to carry a score id is content.
    expect(isRoundPost({ post_type: 'regular', whs_score_id: 'abc' } as never)).toBe(false);
  });

  it('exports the type string used by query filters', () => {
    expect(ROUND_POST_TYPE).toBe('round');
  });
});
