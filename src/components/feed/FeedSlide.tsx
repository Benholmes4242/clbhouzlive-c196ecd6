import React, { memo, useEffect } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import { FeedImageCarousel } from './FeedImageCarousel';
import { PGACard } from '@/components/clubhouse/cinematic/PGACard';
import { HistoryCard } from '@/components/clubhouse/cinematic/HistoryCard';
import { CourseOfWeekCard } from '@/components/clubhouse/cinematic/CourseOfWeekCard';
import { WeeklyDebateCard } from '@/components/clubhouse/cinematic/WeeklyDebateCard';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import type { FeedPost, PGACardFeedPost, HistoryCardFeedPost, CourseOfWeekCardFeedPost, DebateCardFeedPost, ReviewOfWeekCardFeedPost } from '@/components/media-system/types/media';
import { ReviewOfWeekCard } from '@/components/clubhouse/cinematic/ReviewOfWeekCard';

interface FeedSlideProps {
  post: FeedPost;
  index: number;
  setRef: (el: HTMLDivElement | null) => void;
  activeTab: string;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
  onLike?: (post: FeedPost) => void;
  onComment?: () => void;
  onShare?: (post: FeedPost) => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
  onZoomChange?: (isZoomed: boolean) => void;
  activeIndexOverride?: number;
}

export const FeedSlide = memo(function FeedSlide({
  post,
  index,
  setRef,
  activeTab,
  onFirstFrameReady,
  onLike,
  onComment,
  onShare,
  getLikeState,
  getCommentCount,
  onZoomChange,
  activeIndexOverride,
}: FeedSlideProps) {
  const { user } = useSupabaseSession();
  const storeActiveIndex = useClubhouseStore(s => s.activeIndex);
  const activeIndex = activeIndexOverride ?? storeActiveIndex;
  const isActive = activeIndex === index;
  const isSuggestedFeed = activeTab === 'foryou';
  const media = post.mediaItems;

  // Pinch zoom for single images
  const { ref: zoomRef, imgRef, style: zoomStyle, scale: zoomScale, reset: resetZoom } = usePinchZoomPointer();

  // Notify parent of zoom state changes
  useEffect(() => {
    onZoomChange?.(zoomScale > 1);
  }, [zoomScale, onZoomChange]);

  // Reset zoom when slide becomes inactive
  useEffect(() => {
    if (!isActive) resetZoom();
  }, [isActive, resetZoom]);

  // ── Content routing ──
  const renderContent = () => {
    // PGA tournament card
    if (post.postType === 'pga_card') {
      return (
        <PGACard
          post={post as unknown as PGACardFeedPost}
          onComment={() => onComment?.()}
          onLike={() => onLike?.(post)}
          getLikeState={getLikeState}
          getCommentCount={getCommentCount}
        />
      );
    }

    // History editorial card
    if (post.postType === 'history_card') {
      return (
        <HistoryCard
          post={post as unknown as HistoryCardFeedPost}
          onComment={() => onComment?.()}
          onLike={() => onLike?.(post)}
          getLikeState={getLikeState}
          getCommentCount={getCommentCount}
          currentUserId={user?.id}
        />
      );
    }

    // Course of the week editorial card
    if (post.postType === 'course_of_week_card') {
      return (
        <CourseOfWeekCard
          post={post as unknown as CourseOfWeekCardFeedPost}
          onComment={() => onComment?.()}
          onLike={() => onLike?.(post)}
          getLikeState={getLikeState}
          getCommentCount={getCommentCount}
          currentUserId={user?.id}
        />
      );
    }

    // Weekly debate editorial card
    if (post.postType === 'debate_card') {
      return (
        <WeeklyDebateCard
          post={post as unknown as DebateCardFeedPost}
          onComment={() => onComment?.()}
        />
      );
    }

    // Review of the Week card
    if (post.postType === 'review_of_week_card') {
      return (
        <ReviewOfWeekCard
          post={post as unknown as ReviewOfWeekCardFeedPost}
          onComment={() => onComment?.()}
          onLike={() => onLike?.(post)}
          onShare={() => onShare?.(post)}
          currentUserId={user?.id}
        />
      );
    }

    // Multi-media (any mix of video + image) → FeedImageCarousel
    if (media && media.length > 1) {
      return (
        <FeedImageCarousel
          mediaItems={media}
          feedIndex={index}
          isSuggestedFeed={isSuggestedFeed}
          isActive={isActive}
          onDoubleTapLike={() => onLike?.(post)}
          onZoomChange={onZoomChange}
        />
      );
    }

    // Single video
    if (media?.[0]?.type === 'video') {
      const first = media[0];
      return (
        <SnapVideoPlayer
          hlsUrl={first.hlsUrl || ''}
          mp4Url={first.mp4Url}
          thumbnailUrl={first.thumbnailUrl}
          width={first.width}
          height={first.height}
          duration={first.duration}
          isActive={isActive}
          activeIndex={activeIndex}
          feedIndex={index}
          isSuggestedFeed={isSuggestedFeed}
          onDoubleTapLike={() => onLike?.(post)}
          onFirstFrameReady={onFirstFrameReady}
        />
      );
    }

    // Single image — apply pinch zoom
    if (media?.[0]?.type === 'image') {
      const first = media[0];
      const isLandscape = (first.width ?? 0) > (first.height ?? 1);
      const objectFit = 'contain';
      const imgSrc = first.imageUrl || first.thumbnailUrl || '';
      return (
        <div className="absolute inset-0 overflow-hidden">
          {/* Blurred background for letterboxing */}
          <img
            src={imgSrc}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'blur(40px)', transform: 'scale(1.15)', opacity: 0.6 }}
            draggable={false}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/55" />
          {/* Main image with pinch zoom */}
          <div
            ref={zoomRef}
            style={{ ...zoomStyle, position: 'absolute', inset: 0, zIndex: 1 }}
          >
            <img
              ref={imgRef}
              src={imgSrc}
              alt=""
              className="w-full h-full"
              style={{ objectFit }}
              loading="eager"
              draggable={false}
            />
          </div>
        </div>
      );
    }

    // Text-only fallback
    return (
      <div className="absolute inset-0 flex items-center justify-center px-8">
        <p className="text-white text-lg text-center leading-relaxed">
          {post.caption || ''}
        </p>
      </div>
    );
  };

  return (
    <div
      ref={setRef}
      data-index={index}
      className="relative w-full overflow-hidden flex-shrink-0"
      aria-hidden={!isActive}
      {...(!isActive ? { inert: '' } : {})}
      style={{
        height: '100dvh',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always',
        background: '#000',
        willChange: 'transform',
      }}
    >
      {/* PGA card sentinel for IntersectionObserver */}
      {(post.postType === 'pga_card' ||
        post.postType === 'history_card' ||
        post.postType === 'course_of_week_card' ||
        post.postType === 'debate_card' ||
        post.postType === 'review_of_week_card') && (
        <div data-pga-sentinel="true" className="absolute inset-0 pointer-events-none" />
      )}
      {renderContent()}
    </div>
  );
});

export default FeedSlide;
