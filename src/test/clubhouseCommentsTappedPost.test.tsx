import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));

import { useClubhouseComments } from '@/components/clubhouse/hooks/useClubhouseComments';
import type { FeedPost } from '@/components/media-system/types/media';

afterEach(cleanup);

const post = (id: string, extra: Record<string, unknown> = {}) => ({ id, commentCount: 0, ...extra }) as unknown as FeedPost;

describe('useClubhouseComments keeps the tapped post', () => {
  it('openComments(postB) sets commentsPost to postB; close keeps it until cleared', () => {
    const B = post('B');
    const { result } = renderHook(() => useClubhouseComments());
    act(() => result.current.openComments(B, 'sheet'));
    expect(result.current.commentsOpen).toBe(true);
    expect(result.current.commentsPost?.id).toBe('B');
    act(() => result.current.closeComments());
    expect(result.current.commentsOpen).toBe(false);
    expect(result.current.commentsPost?.id).toBe('B');
    act(() => result.current.resetComments());
    expect(result.current.commentsPost?.id).toBe('B');
    act(() => result.current.clearCommentsPost());
    expect(result.current.commentsPost).toBeNull();
  });
});

/* Same precedence as the inline derivation in Clubhouse.tsx's comments block. */
function commentTargetFor(p: FeedPost, scores: Map<string, string>) {
  const scoreId = scores.get(p.id) ?? null;
  const reviewId = (p as { review?: { reviewId?: string } }).review?.reviewId ?? null;
  return { targetType: scoreId ? 'round' : reviewId ? 'review' : 'post', targetId: scoreId ?? reviewId ?? p.id };
}

/* Mirrors Clubhouse.tsx's wiring: the real hook, the same target precedence, an
   activeIndex pointing elsewhere, and a stand-in sheet that prints its target. */
function Harness({ posts, scores, initialActive }: { posts: FeedPost[]; scores: Map<string, string>; initialActive: number }) {
  const [activeIndex, setActiveIndex] = useState(initialActive);
  const { commentsOpen, commentsPost, openComments } = useClubhouseComments();
  const activePost = posts[activeIndex];
  return (
    <div>
      <span data-active={activePost.id} />
      {posts.map((p, i) => (
        <button key={p.id} type="button" data-comment-icon={p.id} onClick={() => openComments(p, 'sheet')}>c{i}</button>
      ))}
      <button type="button" data-scroll onClick={() => setActiveIndex((i) => (i + 1) % posts.length)}>scroll</button>
      {commentsPost && commentsOpen && (() => {
        const { targetType, targetId } = commentTargetFor(commentsPost, scores);
        return <div data-sheet data-target-type={targetType} data-target-id={targetId} />;
      })()}
    </div>
  );
}

const cases: Array<[string, FeedPost, Map<string, string>, string, string]> = [
  ['round', post('A'), new Map([['A', 'scoreA'], ['B', 'scoreB']]), 'round', 'scoreA'],
  ['review', post('A', { review: { reviewId: 'revA' } }), new Map(), 'review', 'revA'],
  ['plain', post('A'), new Map(), 'post', 'A'],
];

describe('Clubhouse comments target the tapped post', () => {
  it.each(cases)('tapping A (%s) while B is active targets A', (_n, A, scores, type, id) => {
    const B = post('B', { review: { reviewId: 'revB' } });
    const v = render(<Harness posts={[A, B]} scores={scores} initialActive={1} />);
    expect(v.container.querySelector('[data-active]')!.getAttribute('data-active')).toBe('B');
    fireEvent.click(v.container.querySelector('[data-comment-icon="A"]')!);
    const sheet = v.container.querySelector('[data-sheet]')!;
    expect(sheet.getAttribute('data-target-type')).toBe(type);
    expect(sheet.getAttribute('data-target-id')).toBe(id);
  });

  it('changing activeIndex while open does not change the target', () => {
    const A = post('A');
    const B = post('B');
    const scores = new Map([['A', 'scoreA'], ['B', 'scoreB']]);
    const v = render(<Harness posts={[A, B]} scores={scores} initialActive={0} />);
    fireEvent.click(v.container.querySelector('[data-comment-icon="A"]')!);
    fireEvent.click(v.container.querySelector('[data-scroll]')!);
    expect(v.container.querySelector('[data-active]')!.getAttribute('data-active')).toBe('B');
    const sheet = v.container.querySelector('[data-sheet]')!;
    expect(sheet.getAttribute('data-target-type')).toBe('round');
    expect(sheet.getAttribute('data-target-id')).toBe('scoreA');
  });
});
