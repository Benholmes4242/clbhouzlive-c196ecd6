import React, { memo, useEffect, useRef, useState } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { FeedImageCarousel } from './FeedImageCarousel';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { CarouselDots } from '@/components/media/CarouselDots';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { useVideoLane } from '@/video/useVideoLane';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { isPerfEnabled } from '@/perf/navTiming';
import { vperfStart, vperfArmLane, vperfNextId, vperfMotionMark } from '@/perf/vperf';

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

    // Multi-media carousel — feed surface (non-fullscreen). Fullscreen
    // routes multi-media through <FullscreenMediaPager/> below.
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

    // Stage-7 PR-3: in-fullscreen horizontal media sub-pager for multi-media
    // posts. Only the active page mounts the SHOWING lane; inactive pages
    // render posters. First horizontal swipe on a borrow slide triggers the
    // one-shot demote via the store → overlay effect runs returnBorrow.
    if (isFullscreen && media && media.length > 1) {
      return (
        <FullscreenMediaPager
          post={post}
          media={media}
          openIdx={openIdx}
          isSlideActive={isActive}
          isSuggestedFeed={isSuggestedFeed}
          onFirstFrameReady={onFirstFrameReady}
          onZoomChange={onZoomChange}
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
  /** Stage-7 PR-3: media-level ownership key `${postId}:${mediaIdx}`. When
   *  provided (multi-media pager pages), used as the engine caller/owner key
   *  and lastPos lookup so each media resumes independently. Single-media
   *  callers omit it — the lane binds under bare postId (legacy behaviour). */
  ownerKey?: string;
  /** Stage-7 PR-3: pager pages other than the opening media pass false so
   *  they never take the borrow branch (only the opening media page owns the
   *  borrowed element). Defaults true for single-media callers. */
  allowBorrow?: boolean;
}> = ({ postId, hlsUrl, posterSrc, isActive, onFirstFrameReady, ownerKey, allowBorrow = true }) => {
  const isMuted = useClubhouseStore((s) => s.isMuted);
  const storedStart = useFullscreenFeedStore((s) => s.startPosition);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const origin = useFullscreenFeedStore((s) => s.origin);
  const isBorrowSlide = !!(allowBorrow && borrow && isActive && borrow.postId === postId);
  const resumeKey = ownerKey ?? postId;

  // Only apply store.startPosition on the initially-tapped slide; other
  // slides in the fullscreen deck start from 0. Borrow slide skips seeks
  // entirely — the borrowed element carries its own currentTime.
  const startPosition = React.useMemo(() => {
    if (!isActive || isBorrowSlide) return -1;
    const t = VideoEngine.getLastPos(resumeKey);
    const chosen = t > 0 ? t : storedStart > 0 ? storedStart : -1;
    return chosen;
  }, [isActive, isBorrowSlide, resumeKey, storedStart]);

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
    postId: resumeKey,
  });

  React.useEffect(() => {
    if (isBorrowSlide) return;
    VideoEngine.setObjectFit('fullscreen', 'contain');
  }, [isBorrowSlide]);

  // [DECIDE] slot.bind — one line when the non-borrow fullscreen lane
  // binds. Lets us compare what the lane believed at bind-time vs what the
  // ladder chose in openWithOrigin.
  const didLogBindRef = React.useRef(false);
  React.useEffect(() => {
    if (isBorrowSlide) { didLogBindRef.current = false; return; }
    if (!isActive) { didLogBindRef.current = false; return; }
    if (didLogBindRef.current) return;
    if (!isPerfEnabled()) return;
    didLogBindRef.current = true;
    let laneSnapPostId: string | null = null;
    let laneSnapCt: number | null = null;
    try {
      const s = VideoEngine.snapshot('fullscreen');
      laneSnapPostId = s.postId;
      laneSnapCt = +s.currentTime.toFixed(3);
    } catch {}
    // eslint-disable-next-line no-console
    console.info('[DECIDE]', 'slot.bind', {
      laneId: 'fullscreen',
      ownerKey: resumeKey,
      startPosition: +Number(startPosition).toFixed(3),
      laneSnapPostId,
      laneSnapCt,
    });
  }, [isActive, isBorrowSlide, resumeKey, startPosition]);

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
      onFirstFrameReady?.();
    }
  }, [isActive, isBorrowSlide, lane.snapshot.firstFrame, onFirstFrameReady]);

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
 *   Phase 2 (200ms): onTransitionEnd starts a longer black-underlay crossfade;
 *     at the fade MIDPOINT (~100ms in) we flip object-fit to 'contain' so
 *     the aspect change reads as part of the fade rather than a discrete pop.
 *     Skipped entirely when the video aspect matches the viewport aspect
 *     (within 2%) — nothing to letterbox, nothing to fade.
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
  // Underlay fade & fit-swap are decoupled so the aspect change lands at the
  // fade midpoint (invisible under 50% black) rather than at the leading edge
  // where it reads as a pop.
  const [underlayVisible, setUnderlayVisible] = React.useState(false);
  const [fitContain, setFitContain] = React.useState(false);
  const skipFitSwapRef = React.useRef<boolean>(false);
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
      const raf2 = requestAnimationFrame(() => {
        // [VPERF] motion trace: phase-1 expand begins on this commit.
        try { vperfMotionMark('expandStart'); } catch {}
        setExpanded(true);
      });
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
    if (underlayVisible) return;
    // [VPERF] motion trace: phase-1 (expand) done, phase-2 (fit swap) begins.
    try { vperfMotionMark('expandEnd'); vperfMotionMark('fitSwapStart'); } catch {}

    // Aspect-match skip: if the video is already viewport-shaped (within 2%)
    // there is nothing to letterbox and no fade is needed. Leave object-fit
    // on 'cover' and skip both the underlay fade and the contain swap.
    const videoAspect = VideoEngine.getLaneAspect(borrow.laneId);
    const viewportAspect = window.innerWidth / window.innerHeight;
    if (videoAspect && Math.abs(videoAspect - viewportAspect) / viewportAspect < 0.02) {
      skipFitSwapRef.current = true;
      try { VideoEngine.nudgeLevelCap(borrow.laneId); } catch {}
      try { vperfMotionMark('fitSwapEnd'); } catch {}
      return;
    }

    // Start the underlay crossfade (200ms). Fit swap lands at the midpoint
    // (~100ms in) so the aspect change is invisible under ~50% black.
    setUnderlayVisible(true);
    const midpointT = setTimeout(() => {
      setFitContain(true);
      try { VideoEngine.setObjectFit(borrow.laneId, 'contain'); } catch {}
      // Cold rail lanes were configured with capLevelToPlayerSize against the
      // tile's small rect. Now that the wrapper fills the viewport, nudge
      // hls.js to re-evaluate the cap so it upshifts to a viewport-appropriate
      // level (session summary levelSwitches counter climbs after this).
      try { VideoEngine.nudgeLevelCap(borrow.laneId); } catch {}
    }, 100);
    // Fade completes ~200ms after underlay reveal begins.
    const endT = setTimeout(() => { try { vperfMotionMark('fitSwapEnd'); } catch {} }, 210);
    (window as any).__borrow_fit_timers = [midpointT, endT];
  }, [underlayVisible, borrow.laneId]);

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
          data-vperf="flip-underlay"
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
        data-vperf="flip-wrapper"
        style={style}
        onTransitionEnd={handleTransitionEnd}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stage-7 PR-3: FullscreenMediaPager
//
// In-fullscreen horizontal media sub-pager for multi-media posts. Uses native
// CSS scroll-snap so vertical gestures pass through to <SnapFeed/> and pinch
// gestures on image pages continue to work via usePinchZoomPointer. Only the
// active page mounts <FullscreenVideoSlot/> — inactive pages render posters
// (one decoder per slide, matching the SHOWING-lane contract).
//
// Borrow demote: on the borrow slide, the FIRST horizontal swipe away from
// the opening media triggers demoteBorrow() → overlay effect runs
// returnBorrow('demote'). Only the openIdx page ever passes allowBorrow=true.
// ─────────────────────────────────────────────────────────────────────────────
const FullscreenMediaPager: React.FC<{
  post: FeedPost;
  media: MediaItem[];
  openIdx: number;
  isSlideActive: boolean;
  isSuggestedFeed: boolean;
  onFirstFrameReady?: () => void;
  onZoomChange?: (zoomed: boolean) => void;
}> = ({ post, media, openIdx, isSlideActive, isSuggestedFeed, onFirstFrameReady, onZoomChange }) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activePagerIdx, setActivePagerIdx] = useState(openIdx);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const demotedRef = useRef(false);

  // Jump to the opening media on mount (auto, no smooth animation — the FLIP
  // clone / borrow FLIP is the visual open animation).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Wait a tick so layout has resolved clientWidth.
    const raf = requestAnimationFrame(() => {
      el.scrollLeft = openIdx * el.clientWidth;
    });
    return () => cancelAnimationFrame(raf);
  }, [openIdx]);

  // Track the active page by scroll-snap position. Also detects the
  // first-swipe borrow demote and requests it via the store BEFORE the new
  // active page mounts its slot in the next render.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const w = el.clientWidth;
        if (w <= 0) return;
        const idx = Math.round(el.scrollLeft / w);
        if (idx === activePagerIdx) return;
        // Borrow demote — one-shot on first horizontal move.
        if (
          !demotedRef.current &&
          borrow &&
          borrow.postId === post.id &&
          idx !== openIdx
        ) {
          demotedRef.current = true;
          useFullscreenFeedStore.getState().demoteBorrow();
        }
        setActivePagerIdx(idx);
        // [VPERF] S5 swipe.pager — measure horizontal settle onto a video
        // page → next 'playing' event on the fullscreen lane. The borrow
        // (if any) was just demoted by this same swipe on the very first
        // move; all non-opening pages bind the fullscreen lane, so we arm
        // 'fullscreen' unconditionally. Image pages: no span.
        const nextItem = media[idx];
        if (nextItem && nextItem.type === 'video') {
          const spanId = vperfNextId(`swipe.pager:${post.id}:${idx}`);
          vperfStart(spanId, 'swipe.pager', {
            postId: post.id,
            mediaIndex: idx,
            pageKind: 'video',
          });
          vperfArmLane('fullscreen', { spanId, endOn: 'firstFrame', phase: 'firstFrame' });
          vperfArmLane('fullscreen', { spanId, endOn: 'playing' });
        }
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [activePagerIdx, borrow, post.id, openIdx]);

  return (
    <div className="absolute inset-0">
      <div
        ref={scrollerRef}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'row',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          // Let the browser axis-lock; vertical pans continue to reach
          // SnapFeed and pinch-zoom keeps working on image pages.
          touchAction: 'pan-x pan-y pinch-zoom',
        }}
      >
        {media.map((m, i) => {
          const ownerKey = `${post.id}:${i}`;
          const isActivePage = i === activePagerIdx;
          return (
            <div
              key={m.id || ownerKey}
              style={{
                position: 'relative',
                flex: '0 0 100%',
                width: '100%',
                height: '100%',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <FullscreenPagerPage
                post={post}
                media={m}
                pageIdx={i}
                openIdx={openIdx}
                ownerKey={ownerKey}
                isActivePage={isActivePage}
                isSlideActive={isSlideActive}
                isSuggestedFeed={isSuggestedFeed}
                onFirstFrameReady={isActivePage ? onFirstFrameReady : undefined}
                onZoomChange={isActivePage ? onZoomChange : undefined}
              />
            </div>
          );
        })}
      </div>
      {/* Dots — bottom-center, above the action rail. */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0,
          right: 0,
          bottom: 88,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 25,
        }}
      >
        <CarouselDots count={media.length} active={activePagerIdx} variant="elongated" />
      </div>
    </div>
  );
};

/**
 * One page inside the FullscreenMediaPager. Video pages mount
 * FullscreenVideoSlot only when active (SHOWING lane); inactive video pages
 * render the poster fallback. Image pages get their own pinch-zoom.
 */
const FullscreenPagerPage: React.FC<{
  post: FeedPost;
  media: MediaItem;
  pageIdx: number;
  openIdx: number;
  ownerKey: string;
  isActivePage: boolean;
  isSlideActive: boolean;
  isSuggestedFeed: boolean;
  onFirstFrameReady?: () => void;
  onZoomChange?: (zoomed: boolean) => void;
}> = ({ post, media: m, pageIdx, openIdx, ownerKey, isActivePage, isSlideActive, onFirstFrameReady, onZoomChange }) => {
  const { ref: zoomRef, imgRef, style: zoomStyle, scale: zoomScale, reset: resetZoom } =
    usePinchZoomPointer();

  // Reset zoom when this page leaves.
  useEffect(() => {
    if (!isActivePage) resetZoom();
  }, [isActivePage, resetZoom]);

  // Bubble zoom state up only for the active page.
  useEffect(() => {
    if (!isActivePage) return;
    onZoomChange?.(zoomScale > 1);
  }, [isActivePage, zoomScale, onZoomChange]);

  if (m?.type === 'video') {
    const posterSrc = m.thumbnailUrl || '';
    const mHlsUrl = (m as any).hlsUrl || null;
    // Active video page → mount SHOWING slot. Only the opening-media page
    // may take the borrow branch; every other page passes allowBorrow=false
    // so a re-mount post-demote never re-triggers the borrow FLIP.
    if (isActivePage && mHlsUrl) {
      return (
        <FullscreenVideoSlot
          postId={post.id}
          hlsUrl={mHlsUrl}
          posterSrc={posterSrc}
          isActive={isSlideActive}
          onFirstFrameReady={onFirstFrameReady}
          ownerKey={ownerKey}
          allowBorrow={pageIdx === openIdx}
        />
      );
    }
    // Inactive video page — poster fallback (mirrors the existing non-hls
    // branch above). No lane binding, no decoder.
    return (
      <div className="absolute inset-0 overflow-hidden">
        {posterSrc && (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${posterSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.5) saturate(1.2)',
              transform: 'scale(1.2)',
            }}
          />
        )}
        {posterSrc && (
          <img
            src={posterSrc}
            alt=""
            aria-hidden
            className="w-full h-full"
            style={{ position: 'absolute', inset: 0, objectFit: 'contain', zIndex: 1 }}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    );
  }

  if (m?.type === 'image') {
    const imgSrc = m.imageUrl || m.thumbnailUrl || '';
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imgSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.5) saturate(1.2)',
            transform: 'scale(1.2)',
          }}
        />
        <div
          ref={zoomRef}
          style={{ ...zoomStyle, position: 'absolute', inset: 0, zIndex: 1 }}
        >
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            className="w-full h-full"
            style={{ objectFit: 'contain' }}
            loading={isActivePage ? 'eager' : 'lazy'}
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return null;
};
