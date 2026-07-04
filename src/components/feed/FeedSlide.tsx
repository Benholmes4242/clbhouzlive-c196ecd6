import React, { memo, useEffect } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { FeedImageCarousel } from './FeedImageCarousel';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { CarouselDots } from '@/components/media/CarouselDots';
import type { FeedPost } from '@/components/media-system/types/media';
import { useVideoLane } from '@/video/useVideoLane';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { fsv } from '@/perf/fsvTelemetry';

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
          onZoomChange={onZoomChange}
          isFullscreen={isFullscreen}
        />
      );
    }

    // Single video — engine-backed in fullscreen, poster-only otherwise.
    if (media?.[0]?.type === 'video') {
      const first = media[0];
      const posterSrc = first.thumbnailUrl || '';
      if (isFullscreen) {
        return (
          <FullscreenVideoSlot
            postId={post.id}
            hlsUrl={(first as any).hlsUrl || null}
            posterSrc={posterSrc}
            isActive={isActive}
            onFirstFrameReady={onFirstFrameReady}
          />
        );
      }
      return (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: '#0A0E14' }} aria-hidden="true" />
          {posterSrc && (
            <img
              src={posterSrc}
              alt=""
              aria-hidden
              className="w-full h-full"
              style={{ position: 'absolute', inset: 0, objectFit: 'cover', zIndex: 1 }}
              loading="lazy"
              draggable={false}
              onLoad={() => onFirstFrameReady?.()}
            />
          )}
        </div>
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

/**
 * FullscreenVideoSlot — binds the engine's `fullscreen` lane when the
 * fullscreen slide becomes active. Reads `startPosition` from the store
 * (set by openWithOrigin). On unmount, records fullscreen currentTime into
 * engine.lastPos so the feed-active lane resumes at the same position.
 */
const FullscreenVideoSlot: React.FC<{
  postId: string;
  hlsUrl: string | null;
  posterSrc: string;
  isActive: boolean;
  onFirstFrameReady?: () => void;
}> = ({ postId, hlsUrl, posterSrc, isActive, onFirstFrameReady }) => {
  const isMuted = useClubhouseStore((s) => s.isMuted);
  const storedStart = useFullscreenFeedStore((s) => s.startPosition);
  // Only apply store.startPosition on the initially-tapped slide; other
  // slides in the fullscreen deck start from 0.
  const startPosition = React.useMemo(() => {
    if (!isActive) return -1;
    const t = VideoEngine.getLastPos(postId);
    const chosen = t > 0 ? t : storedStart > 0 ? storedStart : -1;
    fsv('slot.mount', {
      phase: 'startPos.compute',
      postId,
      isActive,
      hasHls: !!hlsUrl,
      storedStart,
      lastPos: t,
      chosen,
    });
    return chosen;
  }, [isActive, postId, storedStart, hlsUrl]);

  const lane = useVideoLane('fullscreen', {
    hlsUrl: isActive ? hlsUrl : null,
    posterUrl: posterSrc || null,
    startPosition,
    active: isActive,
    muted: isMuted,
    postId,
  });

  React.useEffect(() => {
    VideoEngine.setObjectFit('fullscreen', 'contain');
  }, []);

  React.useEffect(() => {
    fsv('slot.active', { postId, isActive });
  }, [postId, isActive]);

  React.useEffect(() => {
    return () => {
      fsv('slot.unmount', { postId });
    };
  }, [postId]);

  // Fire onFirstFrameReady ONLY when the engine has painted the real frame
  // at (or past) startPosition — this is what the FLIP overlay listens for
  // to crossfade the poster clone out over the already-playing video.
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (!isActive) { firedRef.current = false; return; }
    if (firedRef.current) return;
    if (lane.snapshot.firstFrame === true) {
      firedRef.current = true;
      fsv('slot.snapFF', {
        postId,
        ct: +lane.snapshot.currentTime.toFixed(3),
        startPosition: +startPosition.toFixed(3),
      });
      onFirstFrameReady?.();
    }
  }, [isActive, lane.snapshot.firstFrame, lane.snapshot.currentTime, onFirstFrameReady, postId, startPosition]);



  return (
    <div className="absolute inset-0 overflow-hidden">
      {posterSrc && (
        <div aria-hidden="true" className="absolute inset-0" style={{
          backgroundImage: `url(${posterSrc})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)',
        }} />
      )}
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          aria-hidden
          className="w-full h-full"
          style={{
            position: 'absolute', inset: 0, objectFit: 'contain', zIndex: 1,
            opacity: lane.snapshot.firstFrame ? 0 : 1,
            transition: 'opacity 120ms linear',
          }}
          loading="eager"
          draggable={false}
        />
      )}
      <div
        ref={lane.hostRef}
        style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          opacity: lane.snapshot.firstFrame ? 1 : 0,
          transition: 'opacity 120ms linear',
        }}
      />
    </div>
  );
};
