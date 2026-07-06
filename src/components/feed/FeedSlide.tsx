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
import { isPerfEnabled } from '@/perf/navTiming';

import { usePostViewTracker } from '@/hooks/usePostViewTracker';

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
  /** Positional fallback — SnapFeed passes 0 for non-opening slides. */
  mediaIndex?: number;
  /** Stable media item id (authoritative). SnapFeed passes it ONLY to the
   *  slide at startIndex; resolves via `mediaItems.findIndex(m => m.id === mediaId)`
   *  against the post's grouped mediaItems. Fixes "grouping reorders media"
   *  drift where positional indices from ungrouped callers land on the wrong
   *  media (image branch renders instead of video → no play). */
  mediaId?: string | null;
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
  mediaIndex = 0,
  mediaId = null,
}: FeedSlideProps) {
  const { user } = useSupabaseSession();
  const storeActiveIndex = useClubhouseStore(s => s.activeIndex);
  const activeIndex = activeIndexOverride ?? storeActiveIndex;
  const isActive = activeIndex === index;
  const isSuggestedFeed = activeTab === 'foryou';
  const media = post.mediaItems;
  // Opening-slide media selector — prefer stable `mediaId` (safe against
  // groupMultiMedia's re-sort/dedupe/filter), fall back to positional
  // `mediaIndex` for callers that don't pass an id. Non-opening slides get
  // `mediaId: null` + `mediaIndex: 0` → renders media[0] as today.
  const resolvedIdx = mediaId
    ? media?.findIndex(m => m.id === mediaId) ?? -1
    : -1;
  const openIdx = resolvedIdx >= 0
    ? resolvedIdx
    : Math.min(Math.max(mediaIndex, 0), Math.max((media?.length ?? 1) - 1, 0));
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

    // Multi-media carousel — feed surface ONLY. In fullscreen, the carousel
    // branch would render `FeedImageCarousel` whose per-slide `SnapVideoPlayer`
    // is a poster-only teardown stub that never plays — so a multi-media post
    // tapped on its first-media video (openIdx===0) previously mounted the
    // stub instead of `FullscreenVideoSlot`. Skipping the carousel in
    // fullscreen routes both the opening slide and any swiped-to slide
    // through the per-`m` branches below: chosen video (w/ hlsUrl) mounts
    // the fullscreen lane; chosen image renders the pinch-zoom image branch.
    // In-fullscreen swiping BETWEEN a multi-media post's own media items is
    // Stage 7 — deferred; the tapped media (or media[0] on swipe) is shown.
    if (!isFullscreen && media && media.length > 1 && openIdx === 0) {
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


    // Opening media (video/image DECISION and rendered content both use `m`).
    const m = media?.[openIdx] ?? media?.[0];

    // Video — engine-backed in fullscreen, poster-only otherwise.
    if (m?.type === 'video') {
      const posterSrc = m.thumbnailUrl || '';
      const mHlsUrl = (m as any).hlsUrl || null;
      if (isFullscreen && !mHlsUrl) {
        // Legacy uploads without a Cloudflare Stream id can't drive the
        // fullscreen lane — surface loudly so bad rows are visible in DBG
        // but still render the poster gracefully (falls through below).
        // eslint-disable-next-line no-console
        console.warn('[FSV] video media without hlsUrl', {
          postId: post.id,
          mediaId: m.id,
          openIdx,
        });
      }
      if (isFullscreen && mHlsUrl) {
        return (
          <FullscreenVideoSlot
            postId={post.id}
            hlsUrl={mHlsUrl}
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

    // Image — apply pinch zoom.
    if (m?.type === 'image') {
      const aspect = (m.height ?? 1) > 0 && (m.width ?? 0) > 0
        ? (m.height as number) / (m.width as number)
        : 1.0;
      const objectFit: 'cover' | 'contain' = isFullscreen
        ? 'contain'
        : (isSuggestedFeed ? 'cover' : (aspect >= 1.5 ? 'cover' : 'contain'));
      const imgSrc = m.imageUrl || m.thumbnailUrl || '';
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
      <PostViewSentinel postId={post.id} />

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
 * Sentinel that records a post_views row once the post has been >=50%
 * visible for ~1s. Once per post per session. Fire-and-forget.
 */
const PostViewSentinel: React.FC<{ postId: string }> = ({ postId }) => {
  const attach = usePostViewTracker(postId, true);
  return <div ref={attach} className="absolute inset-0 pointer-events-none" aria-hidden="true" />;
};


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
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const origin = useFullscreenFeedStore((s) => s.origin);
  const isBorrowSlide = !!(borrow && isActive && borrow.postId === postId);

  // Only apply store.startPosition on the initially-tapped slide; other
  // slides in the fullscreen deck start from 0. Borrow slide skips seeks
  // entirely — the borrowed element carries its own currentTime.
  const startPosition = React.useMemo(() => {
    if (!isActive || isBorrowSlide) return -1;
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
      isBorrowSlide,
    });
    return chosen;
  }, [isActive, postId, storedStart, hlsUrl, isBorrowSlide]);

  // In borrow mode: pass hlsUrl:null + active:false so useVideoLane never
  // touches the 'fullscreen' lane. The borrowed rail lane's element is
  // re-parented into <BorrowedFullscreenSlot/> instead.
  const laneHlsUrl = isBorrowSlide ? null : (isActive ? hlsUrl : null);
  const lane = useVideoLane('fullscreen', {
    hlsUrl: laneHlsUrl,
    posterUrl: posterSrc || null,
    startPosition,
    active: isActive && !isBorrowSlide,
    muted: isMuted,
    postId,
  });

  React.useEffect(() => {
    if (isBorrowSlide) return;
    VideoEngine.setObjectFit('fullscreen', 'contain');
  }, [isBorrowSlide]);

  React.useEffect(() => {
    fsv('slot.active', { postId, isActive, isBorrowSlide });
  }, [postId, isActive, isBorrowSlide]);

  React.useEffect(() => {
    return () => {
      fsv('slot.unmount', { postId });
    };
  }, [postId]);

  // Fire onFirstFrameReady ONLY when the engine has painted the real frame
  // at (or past) startPosition — for non-borrow slides. Borrow slide fires
  // it from <BorrowedFullscreenSlot/> on the next rAF post-mount.
  const firedRef = React.useRef(false);
  React.useEffect(() => {
    if (isBorrowSlide) return;
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
  }, [isActive, isBorrowSlide, lane.snapshot.firstFrame, lane.snapshot.currentTime, onFirstFrameReady, postId, startPosition]);

  // Borrow branch: re-parent the live rail-pool <video> into a wrapper here
  // and run the two-phase cover→contain FLIP.
  if (isBorrowSlide && borrow && origin) {
    return (
      <BorrowedFullscreenSlot
        borrow={borrow}
        originRect={origin.rect}
        posterSrc={posterSrc}
        onFirstFrameReady={onFirstFrameReady}
      />
    );
  }

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

/**
 * BorrowedFullscreenSlot — Stage-7 PR-1 borrow-open renderer.
 *
 * Mounts a wrapper <div> at the tile's origin rect (position:fixed), moves
 * the borrowed rail lane's live <video> into it via VideoEngine.mountLane
 * (atomic appendChild — element keeps playing, hls instance untouched), then
 * runs a two-phase FLIP:
 *   Phase 1 (300ms): wrapper animates origin rect → fullscreen rect while
 *     object-fit stays 'cover' (pure translate/scale, no distortion).
 *   Phase 2 (120ms): onTransitionEnd flip object-fit to 'contain' and fade
 *     a black underlay in so letterbox bars appear rather than snap.
 *
 * onFirstFrameReady fires on the next rAF after mount — the element was
 * already painting in the tile.
 *
 * The wrapper is FIXED (viewport-relative) for the whole viewer session.
 * Vertical swipe demotion (overlay → clearBorrow) unmounts this component
 * and the borrow ends before the user's swipe crosses to the next slide.
 */
const BorrowedFullscreenSlot: React.FC<{
  borrow: NonNullable<ReturnType<typeof useFullscreenFeedStore.getState>['borrow']>;
  originRect: { top: number; left: number; width: number; height: number };
  posterSrc: string;
  onFirstFrameReady?: () => void;
}> = ({ borrow, originRect, posterSrc, onFirstFrameReady }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [fitContain, setFitContain] = React.useState(false);
  const targetRectRef = React.useRef<{ top: number; left: number; width: number; height: number } | null>(null);

  // Mount the live element on first render.
  React.useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // Element is currently in the tile (or hidden host if tile evicted).
    // mountLane atomically moves it here; hls instance stays paired.
    VideoEngine.mountLane(borrow.laneId, el);
    // Assert play-intent post-mount (Stage-7 PR-1 fix): sets wantPlay and
    // recovers any owner-caller pause that raced between pin + markBorrowed.
    // Belt-and-braces with the engine's borrow guard.
    void VideoEngine.play(borrow.laneId, { callerPostId: borrow.ownerKey });
    // Ensure cover for Phase 1.
    VideoEngine.setObjectFit(borrow.laneId, 'cover');
    if (isPerfEnabled() || (typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__)) {
      // eslint-disable-next-line no-console
      console.info('[BORROW]', 'mount', { laneId: borrow.laneId, ownerKey: borrow.ownerKey, postId: borrow.postId });
    }

    // Measure the fullscreen target rect from the viewport.
    targetRectRef.current = {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    };

    // Fire firstFrame on next rAF — element was already painting.
    const raf1 = requestAnimationFrame(() => {
      onFirstFrameReady?.();
      // rAF #2 to ensure Phase 1 transition captures the initial rect commit.
      const raf2 = requestAnimationFrame(() => setExpanded(true));
      (window as any).__borrow_raf2 = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      const raf2 = (window as any).__borrow_raf2;
      if (raf2) cancelAnimationFrame(raf2);
    };
    // borrow is stable for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTransitionEnd = React.useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    // Only respond to the wrapper's own size/transform transitions.
    if (e.target !== wrapperRef.current) return;
    if (fitContain) return;
    setFitContain(true);
    try { VideoEngine.setObjectFit(borrow.laneId, 'contain'); } catch {}
  }, [fitContain, borrow.laneId]);

  const target = targetRectRef.current;
  const style: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    transform: expanded && target
      ? `translate(${target.left}px, ${target.top}px)`
      : `translate(${originRect.left}px, ${originRect.top}px)`,
    width: expanded && target ? target.width : originRect.width,
    height: expanded && target ? target.height : originRect.height,
    zIndex: 3,
    background: '#000',
    overflow: 'hidden',
    willChange: 'transform, width, height',
    transition: expanded
      ? 'transform 300ms cubic-bezier(0.32,0.72,0,1), width 300ms cubic-bezier(0.32,0.72,0,1), height 300ms cubic-bezier(0.32,0.72,0,1)'
      : 'none',
    pointerEvents: 'none',
  };

  return (
    <>
      {/* Poster underlay (blurred, matches non-borrow branch aesthetic). */}
      <div className="absolute inset-0 overflow-hidden">
        {posterSrc && (
          <div aria-hidden="true" className="absolute inset-0" style={{
            backgroundImage: `url(${posterSrc})`, backgroundSize: 'cover', backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)',
          }} />
        )}
        {/* Black letterbox underlay — fades in during Phase 2 fit-swap. */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, background: '#000',
            opacity: fitContain ? 1 : 0,
            transition: 'opacity 120ms linear',
          }}
        />
      </div>
      <div
        ref={wrapperRef}
        aria-hidden
        style={style}
        onTransitionEnd={handleTransitionEnd}
      />
    </>
  );
};
