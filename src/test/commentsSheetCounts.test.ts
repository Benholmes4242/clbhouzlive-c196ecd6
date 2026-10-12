import { describe, it, expect } from 'vitest';
import { visibleCommentCount, hiddenCommentCount } from '@/features/comments-v2/lib/threadCounts';
import { standingFor, firstAppearanceStandings, type Standing } from '@/features/comments-v2/lib/standing';
import type { CommentV2 } from '@/features/comments-v2/hooks/useCommentsV2';

const c = (id: string, user: string, replies: CommentV2[] = []) =>
  ({ id, user_id: user, actor_id: user, actor_type: 'personal', replies } as unknown as CommentV2);

describe('comments sheet count is what it renders (G.1/G.2)', () => {
  it('nothing hidden: two top-level plus one reply reads 3, no footnote', () => {
    const threads = [c('a', 'ben'), c('b', 'julian', [c('r', 'ben')])];
    const v = visibleCommentCount(threads);
    expect(v).toBe(3);
    expect(hiddenCommentCount(3, v, true)).toBe(0);
  });
  it('all hidden: count 0 and one hidden', () => {
    expect(visibleCommentCount([])).toBe(0);
    expect(hiddenCommentCount(1, 0, true)).toBe(1);
  });
  it('some hidden: 2 shown, 1 hidden', () => {
    const v = visibleCommentCount([c('a', 'tom'), c('b', 'simon')]);
    expect(v).toBe(2);
    expect(hiddenCommentCount(3, v, true)).toBe(1);
  });
  it('unloaded pages are never called hidden', () => {
    expect(hiddenCommentCount(45, 20, false)).toBe(0);
  });
});

describe('commenter standing (G.4)', () => {
  it('record beats top ten beats rounds', () => {
    expect(standingFor({ rank: 1, value: 64 }, 9, true)).toEqual({ kind: 'record', value: 64 });
    expect(standingFor({ rank: 4, value: 70 }, 9, true)).toEqual({ kind: 'top_ten' });
    expect(standingFor(undefined, 112, true)).toEqual({ kind: 'played', n: 112 });
    expect(standingFor(undefined, 1, true)).toEqual({ kind: 'first' });
    expect(standingFor(undefined, undefined, true)).toBeNull();
  });
  it('rounds tiers stay silent until attempts is verified', () => {
    expect(standingFor(undefined, 112, false)).toBeNull();
  });
  it('a reply repeats nothing: only the first appearance carries the line', () => {
    const threads = [c('a', 'ben'), c('b', 'julian', [c('r', 'ben')])];
    const byUser = new Map<string, Standing>([['ben', { kind: 'played', n: 112 }], ['julian', { kind: 'record', value: 64 }]]);
    const out = firstAppearanceStandings(threads, byUser);
    expect(out.get('a')).toEqual({ kind: 'played', n: 112 });
    expect(out.get('b')).toEqual({ kind: 'record', value: 64 });
    expect(out.has('r')).toBe(false);
  });
});
