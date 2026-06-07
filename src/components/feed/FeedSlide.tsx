import React, { memo, useEffect } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { SnapVideoPlayer } from './SnapVideoPlayer';
import { FeedImageCarousel } from './FeedImageCarousel';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { CarouselDots } from '@/components/media/CarouselDots';
import type { FeedPost } from '@/components/media-system/types/media';

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
  /** When true, suppress the inline top-right elongated dots — fullscreen surfaces render their own segmented dots via FullscreenCarouselOverlay. */
  isFullscreen?: boolean;
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
  isFullscreen = false,
}: FeedSlideProps) {
  const { user } = useSupabaseSession();
  const storeActiveIndex = useClubhouseStore(s => s.activeIndex);
  const activeIndex = activeIndexOverride ?? storeActiveIndex;
  const isActive = activeIndex === index;
  const isSuggestedFeed = activeTab === 'foryou';
  const media = post.mediaItems;
  const carouselSlide = useClubhouseStore(s => s.carouselPositions.get(index) ?? 0);
  const isEditorial =
    post.postType === 'pga_card' ||
    post.postType === 'tournament_result' ||
    post.postType === 'course_of_week_card';
  const showInlineDots = !isFullscreen && !isEditorial && (media?.length ?? 0) > 1;

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
  // Phase 3: PGA / Course-of-Week editorial card branches were removed; those
  // cards now render as standalone Home modules (HomePGAModule, HomeCourseOfWeekModule).
  const renderContent = () => {

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
          isFullscreen={isFullscreen}
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
          isFullscreen={isFullscreen}
        />
      );
    }

    // Single image — apply pinch zoom
    if (media?.[0]?.type === 'image') {
      const first = media[0];
      const aspect = (first.height ?? 1) > 0 && (first.width ?? 0) > 0
        ? (first.height as number) / (first.width as number)
        : 1.0;
      const objectFit: 'cover' | 'contain' = isFullscreen
        ? 'contain'
        : (isSuggestedFeed ? 'cover' : (aspect >= 1.5 ? 'cover' : 'contain'));
      const imgSrc = first.imageUrl || first.thumbnailUrl || '';
      return (
        <div className="absolute inset-0 overflow-hidden">
          {/* Backdrop — blurred image in fullscreen, solid matte otherwise. */}
          {isFullscreen ? (
            <div aria-hidden="true" className="absolute inset-0" style={{
              backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)',
            }} />
          ) : (
            <div className="absolute inset-0" style={{ background: '#0A0E14' }} aria-hidden="true" />
          )}
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
      {/* Editorial card sentinel for IntersectionObserver — chrome dismissal */}
      {(post.postType === 'pga_card' ||
        post.postType === 'tournament_result' ||
        post.postType === 'course_of_week_card') && (
        <div data-pga-sentinel="true" className="absolute inset-0 pointer-events-none" />
      )}
      {renderContent()}

      {/* Inline carousel dots — top-right, always visible, multi-media non-editorial only */}
      {showInlineDots && (
        <div
          className="absolute pointer-events-none"
          style={{ top: 8, right: 8, zIndex: 25, minWidth: 60 }}
        >
          <CarouselDots
            count={media!.length}
            active={carouselSlide}
            variant="elongated"
          />
        </div>
      )}
    </div>
  );
});

export default FeedSlide;
