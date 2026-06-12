/**
 * CardFeed — Phases 1 & 2 + Phase 3 (virtualization)
 *
 * Vertical scrolling list of `FeedCard`s for the inline Clubhouse Suggested
 * / Friends feeds.
 *
 * Phase 3 (perf): switched from a naive `posts.map(...)` to `react-virtuoso`
 * so DOM footprint stays bounded as users scroll. iOS WebViews cap the
 * number of `<video>` elements and compositor layers; the previous
 * unbounded render was exhausting both, causing black/white screens on
 * tab switches back to Clubhouse. See `feed-virtualization-authority`.
 *
 * Phase 2 additions preserved:
 *  - Single shared IntersectionObserver tracks the most-in-view card and
 *    passes `isActive` down so only one inline video plays at a time.
 *  - `mountVideo` is true only for the active card + its immediate
 *    neighbours; other cards render the poster image to stay under the
 *    WebView's `<video>` budget.
 *  - Persisted multi-media carousel position via `clubhouseStore`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { FeedCard } from './FeedCard';

const CANVAS = '#0A0E14';

/** How many neighbours on each side of the active card may mount a <video>. */
const VIDEO_NEIGHBOUR_RADIUS = 1;

export interface CardFeedProps {
  posts: FeedPost[];
  onLike: (post: FeedPost) => void;
  onComment: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  onProfile: (post: FeedPost) => void;
  onReviewTap?: (post: FeedPost) => void;
  onCourse?: (post: FeedPost) => void;
  getLikeState: (post: FeedPost) => { liked: boolean; count: number } | null | undefined;
  getCommentCount: (post: FeedPost) => number;
  onNearEnd?: () => void;
  hasNextPage?: boolean;
  topPadding?: number | string;
  bottomPadding?: number;
  onFollow?: (post: FeedPost) => void;
  currentUserId?: string;
}

export const CardFeed: React.FC<CardFeedProps> = ({
  posts,
  onLike,
  onComment,
  onShare,
  onProfile,
  onReviewTap,
  onCourse,
  getLikeState,
  getCommentCount,
  onNearEnd,
  hasNextPage,
  topPadding = 96,
  bottomPadding = 96,
  onFollow,
  currentUserId,
}) => {
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  // ── Active-card tracking (drives single-video autoplay) ──
  // Virtuoso reports the items currently in the viewport via `rangeChanged`.
  // We then pick the middle index as the "active" card. This replaces the
  // shared IntersectionObserver that lived here previously.
  const [activeIdx, setActiveIdx] = useState(0);
  const handleRangeChanged = useCallback(
    ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
      const mid = Math.floor((startIndex + endIndex) / 2);
      setActiveIdx((prev) => (prev === mid ? prev : mid));
    },
    [],
  );

  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const openFullscreen = useFullscreenFeedStore((s) => s.open);

  // Sync the active card to the global store so other consumers (top-bar
  // carousel chip, fullscreen handoff, etc.) stay in step.
  useEffect(() => {
    setActiveIndex(activeIdx);
  }, [activeIdx, setActiveIndex]);

  const handleOpenMedia = useCallback(
    (post: FeedPost, mediaIndex: number) => {
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx < 0) return;
      setActiveIndex(idx);
      if (mediaIndex > 0) setCarouselPosition(idx, mediaIndex);
      openFullscreen(posts, idx);
    },
    [posts, setActiveIndex, setCarouselPosition, openFullscreen],
  );

  // Stable per-post carousel-change callback so FeedCard memo holds.
  const carouselChangeCacheRef = useRef(new Map<string, (post: FeedPost, slide: number) => void>());
  const getCarouselChangeHandler = useCallback(
    (postId: string) => {
      const cache = carouselChangeCacheRef.current;
      let fn = cache.get(postId);
      if (!fn) {
        fn = (post: FeedPost, slide: number) => {
          // Recompute index at call time — `posts` may have grown.
          const idx = posts.findIndex((p) => p.id === post.id);
          if (idx >= 0) setCarouselPosition(idx, slide);
        };
        cache.set(postId, fn);
      }
      return fn;
    },
    [posts, setCarouselPosition],
  );

  // Garbage-collect carousel-change cache when posts shrink/change.
  useEffect(() => {
    const live = new Set(posts.map((p) => p.id));
    const cache = carouselChangeCacheRef.current;
    cache.forEach((_, id) => { if (!live.has(id)) cache.delete(id); });
  }, [posts]);

  const itemContent = useCallback(
    (index: number, post: FeedPost) => {
      const likeState = getLikeState(post);
      const initialSlide = carouselPositions.get(index) ?? 0;
      const isActive = index === activeIdx;
      const mountVideo = Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS;
      return (
        <div style={{ paddingBottom: 12 }}>
          <FeedCard
            post={post}
            liked={!!likeState?.liked}
            likeCount={likeState?.count ?? post.likeCount ?? 0}
            commentCount={getCommentCount(post)}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onProfile={onProfile}
            onReviewTap={onReviewTap}
            onCourse={onCourse}
            onOpenMedia={handleOpenMedia}
            isActive={isActive}
            mountVideo={mountVideo}
            initialMediaIndex={initialSlide}
            onCarouselIndexChange={getCarouselChangeHandler(post.id)}
            onFollow={onFollow}
            currentUserId={currentUserId}
          />
        </div>
      );
    },
    [
      activeIdx,
      carouselPositions,
      getCarouselChangeHandler,
      getCommentCount,
      getLikeState,
      handleOpenMedia,
      onComment,
      onCourse,
      onLike,
      onProfile,
      onReviewTap,
      onShare,
      onFollow,
      currentUserId,
    ],
  );

  const components = useMemo(
    () => ({
      Header: () => <div style={{ height: 0, paddingTop: topPadding }} />,
      Footer: () => <div style={{ height: bottomPadding }} />,
    }),
    [topPadding, bottomPadding],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && onNearEnd) onNearEnd();
  }, [hasNextPage, onNearEnd]);

  return (
    <div
      style={{
        background: CANVAS,
        height: '100dvh',
        width: '100%',
      }}
      data-card-feed
    >
      <Virtuoso
        ref={virtuosoRef}
        data={posts}
        itemContent={itemContent}
        computeItemKey={(_, post) => post.id}
        rangeChanged={handleRangeChanged}
        endReached={handleEndReached}
        increaseViewportBy={{ top: 400, bottom: 800 }}
        overscan={{ main: 400, reverse: 400 }}
        components={components}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};

CardFeed.displayName = 'CardFeed';
