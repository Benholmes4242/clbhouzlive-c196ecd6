/**
 * CardFeed — Phase 1
 *
 * Vertical scrolling list of FeedCards for the inline Clubhouse Suggested /
 * Friends feeds. Replaces the inline `SnapFeed` (100dvh fill-crop) with an
 * adaptive card list that respects each media's true aspect ratio.
 *
 * Phase 1 scope: single-media adaptive frame, header + footer, tap-to-open
 * fullscreen overlay. Multi-media carousel + inline video lifecycle land in
 * Phase 2 (FeedCard already renders the first media item for now).
 *
 * SnapFeed / FeedSlide remain untouched and are still used by the immersive
 * fullscreen hosts (FullscreenFeedOverlay, CourseMediaViewer, etc.).
 */
import React, { useCallback, useEffect, useRef } from 'react';
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
  getLikeState: (post: FeedPost) => { liked: boolean; count: number } | null | undefined;
  getCommentCount: (post: FeedPost) => number;
  onNearEnd?: () => void;
  hasNextPage?: boolean;
  topPadding?: number;
  bottomPadding?: number;
}

export const CardFeed: React.FC<CardFeedProps> = ({
  posts,
  onLike,
  onComment,
  onShare,
  onProfile,
  onReviewTap,
  getLikeState,
  getCommentCount,
  onNearEnd,
  hasNextPage,
  topPadding = 96,
  bottomPadding = 96,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
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

  return (
    <div
      style={{
        background: CANVAS,
        minHeight: '100dvh',
        width: '100%',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
      }}
      data-card-feed
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map((post) => {
          const likeState = getLikeState(post);
          return (
            <FeedCard
              key={post.id}
              post={post}
              liked={!!likeState?.liked}
              likeCount={likeState?.count ?? post.likeCount ?? 0}
              commentCount={getCommentCount(post)}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              onProfile={onProfile}
              onReviewTap={onReviewTap}
              onOpenMedia={handleOpenMedia}
            />
          );
        })}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

CardFeed.displayName = 'CardFeed';
