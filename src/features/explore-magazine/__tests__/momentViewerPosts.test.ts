import { describe, it, expect } from 'vitest';
import { momentViewerPosts } from '../momentViewerPosts';
import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';

const post = (id: string) => ({ id }) as unknown as Moment['post'];
const moment = (key: string, postId: string | null) =>
  ({ key, post: postId ? post(postId) : undefined }) as unknown as Moment;

describe('momentViewerPosts', () => {
  it('three moments from three posts, second tapped', () => {
    const list = [moment('a', 'A'), moment('b', 'B'), moment('c', 'C')];
    const r = momentViewerPosts(list, list[1]);
    expect(r.posts).toHaveLength(3);
    expect(r.index).toBe(1);
  });

  it('keeps only the first occurrence of a shared post', () => {
    const A1 = moment('a1', 'A');
    const A2 = moment('a2', 'A');
    const list = [A1, A2, moment('b1', 'B'), moment('c1', 'C')];
    const r = momentViewerPosts(list, list[3]);
    expect(r.posts.map((p) => p.id)).toEqual(['A', 'B', 'C']);
    expect(r.index).toBe(2);
    expect(momentViewerPosts(list, A2).index).toBe(0);
  });

  it('skips a moment with no post', () => {
    const list = [moment('a', 'A'), moment('x', null), moment('b', 'B')];
    const r = momentViewerPosts(list, list[2]);
    expect(r.posts.map((p) => p.id)).toEqual(['A', 'B']);
    expect(r.index).toBe(1);
  });

  it('a tapped moment not in the list gives index 0', () => {
    const list = [moment('a', 'A'), moment('b', 'B')];
    expect(momentViewerPosts(list, moment('z', 'Z')).index).toBe(0);
  });
});
