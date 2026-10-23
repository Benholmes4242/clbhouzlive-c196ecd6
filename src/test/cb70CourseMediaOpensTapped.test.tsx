/**
 * CB70 — Course → Media: tapping a tile opens THAT tile's media.
 *
 * Course media is one entry per media item, so tiles of a multi-photo post
 * share a post id. The opener must land on the tapped entry, not the post's
 * first photo, and swiping must walk tiles in grid order.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

vi.mock('@/video/useRailLane', () => ({ useRailLane: () => ({ hostRef: { current: null }, ready: false }) }));
vi.mock('@/video/usePreroutePrefetch', () => ({
  usePreroutePrefetch: () => ({ onPrerouteArm: undefined, onPreroute: undefined, onPrerouteCancel: undefined }),
}));

import { FeedCard, type FeedCardRow } from '@/components/feed-cards/FeedCard';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

const photo = (postId: string, mediaId: string) => ({
  id: postId,
  mediaItems: [{ id: mediaId, type: 'image', url: `https://x/${mediaId}.jpg`, thumbnailUrl: `https://x/${mediaId}.jpg` }],
}) as any;

// Grid order: post A photo 1, post A photo 2 (Hole 4 / range), post B photo.
const flat = [photo('A', 'a1'), photo('A', 'a2'), photo('B', 'b1')];
const row = (p: any): FeedCardRow => ({
  post_id: p.id, derived_format: 'photo', post_content: '', like_count: 0, width: 1, height: 1,
  poster_url: p.mediaItems[0].thumbnailUrl,
} as any);

function renderGrid() {
  return render(
    <div>
      {flat.map((p, i) => (
        <FeedCard key={p.mediaItems[0].id} row={row(p)} feedPost={p} posts={flat} flatIndex={i}
          isAutoplayActive={false} openedFrom="course-media" bareTile hideCourseAttribution hideFormatBadge readOnlyFullscreen hideLikeCount />
      ))}
    </div>,
  );
}

function tap(el: Element) {
  fireEvent.pointerDown(el, { pointerId: 1, clientX: 5, clientY: 5, button: 0, isPrimary: true });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: 5, clientY: 5, button: 0, isPrimary: true });
}

const openedMediaId = () => {
  const s = useFullscreenFeedStore.getState();
  return s.posts[s.startIndex]?.mediaItems[0]?.id;
};

describe('CB70 course media opens the tapped photo', () => {
  beforeEach(() => {
    useFullscreenFeedStore.setState({ isOpen: false, posts: [], startIndex: 0, restoreStack: [] } as any);
  });
  afterEach(() => { cleanup(); useFullscreenFeedStore.setState({ isOpen: false, posts: [], restoreStack: [] } as any); });

  it('tapping the second photo of a post opens the second photo, not the first', () => {
    const { container } = renderGrid();
    const tiles = container.querySelectorAll('[data-watch-tile-index]');
    tap(tiles[1]);
    const s = useFullscreenFeedStore.getState();
    expect(s.isOpen).toBe(true);
    expect(s.startIndex).toBe(1);
    expect(openedMediaId()).toBe('a2');
    expect(s.mediaId).toBe('a2');
  });

  it('swiping on from the opened photo reaches the next tile in grid order', () => {
    const { container } = renderGrid();
    tap(container.querySelectorAll('[data-watch-tile-index]')[0]);
    const s = useFullscreenFeedStore.getState();
    expect(s.posts.map((p) => p.mediaItems[0].id)).toEqual(['a1', 'a2', 'b1']);
    expect(s.posts[s.startIndex + 1].mediaItems[0].id).toBe('a2');
  });

  it('store.open keeps the id match for lists without duplicate ids', () => {
    const list = [photo('A', 'a1'), photo('B', 'b1'), photo('C', 'c1')];
    useFullscreenFeedStore.getState().open(list, 2);
    expect(useFullscreenFeedStore.getState().startIndex).toBe(2);
  });

  it('store.open with a copied list and mediaId resolves the exact media entry', () => {
    const copy = flat.map((p) => ({ ...p }));
    useFullscreenFeedStore.getState().open(copy, 1, { mediaId: 'a2' } as any);
    expect(openedMediaId()).toBe('a2');
  });

  it('appendPosts adds later photos of a post already on screen, once', () => {
    useFullscreenFeedStore.getState().open(flat, 0);
    useFullscreenFeedStore.getState().appendPosts([photo('A', 'a2'), photo('A', 'a3')]);
    expect(useFullscreenFeedStore.getState().posts.map((p) => p.mediaItems[0].id)).toEqual(['a1', 'a2', 'b1', 'a3']);
  });
});
