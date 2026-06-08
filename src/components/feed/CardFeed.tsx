/**
 * CardFeed — Phases 1 & 2
 *
 * Vertical scrolling list of `FeedCard`s for the inline Clubhouse Suggested
 * / Friends feeds. Replaces the immersive 100dvh `SnapFeed` with an
 * adaptive card list that respects each media's true aspect ratio.
 *
 * Phase 2 additions:
 *  - Tracks the most-in-view card via a single shared IntersectionObserver
 *    and passes `isActive` down so only one inline video plays at a time.
 *  - Persists multi-media carousel position into
 *    `clubhouseStore.carouselPositions` keyed by post index so a card
 *    reopened (or opened fullscreen) lands on the slide the user had.
 *
 * SnapFeed / FeedSlide remain untouched — the immersive fullscreen hosts
 * (`FullscreenFeedOverlay`, `CourseMediaViewer`, etc.) keep their
 * 100dvh fill-crop behaviour.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { FeedCard } from './FeedCard';

const CANVAS = '#0A0E14';

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
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const visibilityRef = useRef(new Map<string, number>());
  const [activeId, setActiveId] = useState<string | null>(null);

  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const openFullscreen = useFullscreenFeedStore((s) => s.open);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!onNearEnd || !hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onNearEnd();
      },
      { rootMargin: '600px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onNearEnd, hasNextPage, posts.length]);

  // Most-in-view tracker → drives single-video autoplay rule.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.feedCardId;
          if (!id) continue;
          visibilityRef.current.set(id, e.intersectionRatio);
        }
        let bestId: string | null = null;
        let bestRatio = 0.4; // require at least 40% visible
        visibilityRef.current.forEach((r, id) => {
          if (r > bestRatio) {
            bestRatio = r;
            bestId = id;
          }
        });
        setActiveId((prev) => (prev === bestId ? prev : bestId));
      },
      {
        threshold: [0, 0.25, 0.4, 0.6, 0.8, 1],
      },
    );

    cardRefs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [posts.length]);

  const registerCard = useCallback((id: string) => (el: HTMLElement | null) => {
    const map = cardRefs.current;
    const prev = map.get(id);
    if (prev && prev !== el) {
      visibilityRef.current.delete(id);
    }
    if (el) {
      map.set(id, el);
    } else {
      map.delete(id);
      visibilityRef.current.delete(id);
    }
  }, []);

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

  const handleCarouselIndexChange = useCallback(
    (post: FeedPost, slide: number) => {
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx < 0) return;
      setCarouselPosition(idx, slide);
    },
    [posts, setCarouselPosition],
  );

  return (
    <div
      ref={containerRef}
      style={{
        background: CANVAS,
        minHeight: '100dvh',
        width: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
        willChange: 'transform',
      }}
      data-card-feed
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map((post, idx) => {
          const likeState = getLikeState(post);
          const initialSlide = carouselPositions.get(idx) ?? 0;
          return (
            <div
              key={post.id}
              ref={registerCard(post.id)}
              data-feed-card-id={post.id}
            >
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
                isActive={activeId === post.id}
                initialMediaIndex={initialSlide}
                onCarouselIndexChange={handleCarouselIndexChange}
              />
            </div>
          );
        })}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

CardFeed.displayName = 'CardFeed';
