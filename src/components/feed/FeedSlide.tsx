import React, { memo, useEffect, useRef, useState } from 'react';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { FeedImageCarousel } from './FeedImageCarousel';
import { usePinchZoomPointer } from '@/hooks/usePinchZoomPointer';
import { CarouselDots } from '@/components/media/CarouselDots';
import type { FeedPost, MediaItem } from '@/components/media-system/types/media';
import { useVideoLane } from '@/video/useVideoLane';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { originHostRegistry } from '@/video/originHostRegistry';
import { isPerfEnabled } from '@/perf/navTiming';
import { vperfStart, vperfArmLane, vperfNextId, vperfMotionMark, vperfCloseMotionMark } from '@/perf/vperf';
import { trace, traceLookup } from '@/perf/trace';
import * as audioDbg from '@/perf/audioDebug';
import { PrefetchController } from '@/video/PrefetchController';
import { resolveRestingRect, getCurrentViewport, type RestingRect } from '@/lib/media/resolveRestingRect';
import { FS_TRANSITION_MODE } from '@/lib/media/transitionMode';
import { TapForSoundPill } from '@/audio/MuteButton';
import { useSessionAudio } from '@/audio/sessionAudioStore';
import { VideoProcessingCard } from './VideoProcessingCard';


import { usePostViewTracker } from '@/hooks/usePostViewTracker';
import { MentionText } from '@/components/mentions/MentionText';

const normalizeOwnerKey = (key: string | null | undefined): string | null => {
  if (!key) return null;
  return key.includes(':') ? key : `${key}:0`;
};

const ownerKeysMatch = (laneKey: string | null | undefined, expectedKey: string): boolean => {
  return normalizeOwnerKey(laneKey) === normalizeOwnerKey(expectedKey);
};

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

  // [TRACE] slide.branch — at the TOP of the FeedSlide render, once per
  // branch transition per active slide. Fires for ALL branches (borrow-slot,
  // video-slot, image, pager, text). Instrumentation only.
  const slideBranchLastRef = React.useRef<string>('');
  const computeBranch = (): 'pager' | 'borrow-slot' | 'video-slot' | 'image' | 'text' => {
    if (isFullscreen && isActive && media && media.length > 1) return 'pager';
    const m = media?.[openIdx] ?? media?.[0];
    if (m?.type === 'video') {
      const mHlsUrl = (m as any).hlsUrl || null;
      if (isFullscreen && mHlsUrl && isActive) return 'video-slot';
      return 'video-slot';
    }
    if (m?.type === 'image') return 'image';
    return 'text';
  };
  if (isActive) {
    const branchTaken = computeBranch();
    const key = `${branchTaken}|pid=${post.id}|fs=${isFullscreen}|idx=${openIdx}`;
    if (key !== slideBranchLastRef.current) {
      slideBranchLastRef.current = key;
      try {
        trace('slide.branch', {
          postId: post.id,
          isFullscreen,
          openIdx,
          mediaLen: media?.length ?? 0,
          branchTaken,
        });
      } catch {}
    }
  }

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
    //
    // DOUBLE-MOUNT FIX: gate on `isActive` so ONLY the current fullscreen
    // slide instantiates the pager (and therefore the fullscreen lane).
    // Vertical neighbours (± virtualization window) fall through to the
    // poster-only branch below — they never bind 'fullscreen'.
    if (isFullscreen && isActive && media && media.length > 1) {
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
      // Shared-path hardening: any surface that mints its own MediaItem (and
      // reads the null `hls_url` column instead of building from stream_id)
      // used to land on the poster-only branch and never play. Derive the
      // manifest from the Stream uid here so EVERY consumer — feed, course
      // media grid, Discover moments — autoplays.
      const mHlsUrl =
        (m as any).hlsUrl ||
        (!(m as any).isProcessing && (m as any).streamId
          ? generateStreamHlsUrl((m as any).streamId)
          : null);
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
      // DOUBLE-MOUNT FIX: only the ACTIVE fullscreen slide mounts
      // FullscreenVideoSlot. Vertical neighbours (± virtualization window)
      // fall through to the poster fallback below and never bind the
      // singleton 'fullscreen' lane.
      if (isFullscreen && mHlsUrl && isActive) {
        return (
          <FullscreenVideoSlot
            postId={post.id}
            hlsUrl={mHlsUrl}
            posterSrc={posterSrc}
            isActive={isActive}
            onFirstFrameReady={onFirstFrameReady}
            ownerKey={`${post.id}:0`}
            mediaW={m.width ?? 0}
            mediaH={m.height ?? 0}
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
              loading="eager"
              decoding="async"
              draggable={false}
              onLoad={() => onFirstFrameReady?.()}
            />
          )}
          {(m as any).isProcessing && <VideoProcessingCard overlay />}
        </div>
      );
    }

    // Image — apply pinch zoom.
    if (m?.type === 'image') {
      const imgSrc = m.imageUrl || m.thumbnailUrl || '';
      // Fullscreen: single-authority rect from resolveRestingRect (images
      // always CONTAIN, safe-area centered). Matches the overlay clone's
      // expand target by construction — no post-paint resize.
      // Feed: legacy heuristic preserved verbatim (out of scope for this fix).
      if (isFullscreen) {
        return (
          <FullscreenImageSlot
            imgSrc={imgSrc}
            mediaW={m.width ?? 0}
            mediaH={m.height ?? 0}
            isActive={isActive}
            zoomRef={zoomRef}
            imgRef={imgRef}
            zoomStyle={zoomStyle}
          />
        );
      }
      const aspect = (m.height ?? 1) > 0 && (m.width ?? 0) > 0
        ? (m.height as number) / (m.width as number)
        : 1.0;
      const objectFit: 'cover' | 'contain' = isSuggestedFeed ? 'cover' : (aspect >= 1.5 ? 'cover' : 'contain');
      return (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0" style={{ background: '#0A0E14' }} aria-hidden="true" />
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
        <MentionText as="p" text={post.caption || ''} className="text-white text-lg text-center leading-relaxed" />
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
 * FullscreenImageSlot — image counterpart to the video settledRect pattern.
 * Computes the resting rect from a layout effect on mount, then re-resolves
 * on visualViewport resize + orientationchange while the slide is active.
 *
 * Necessary because getCurrentViewport() prefers visualViewport, and in
 * Median/WKWebView vv can read degenerate at overlay-mount tick (during body
 * scroll-lock), which — combined with a one-shot render-tick read — baked a
 * zero-sized rect that never re-measured: image slides rendered white.
 */
const FullscreenImageSlot: React.FC<{
  imgSrc: string;
  mediaW: number;
  mediaH: number;
  isActive: boolean;
  zoomRef: React.Ref<HTMLDivElement>;
  imgRef: React.Ref<HTMLImageElement>;
  zoomStyle: React.CSSProperties;
}> = ({ imgSrc, mediaW, mediaH, isActive, zoomRef, imgRef, zoomStyle }) => {
  const [fsRect, setFsRect] = React.useState<RestingRect>(() =>
    resolveRestingRect(mediaW, mediaH, getCurrentViewport(), 'image'),
  );
  React.useLayoutEffect(() => {
    const measure = () => {
      const next = resolveRestingRect(mediaW, mediaH, getCurrentViewport(), 'image');
      setFsRect((prev) =>
        prev.top === next.top && prev.left === next.left
          && prev.width === next.width && prev.height === next.height
          && prev.fit === next.fit
          ? prev
          : next,
      );
    };
    measure();
    if (!isActive) return;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      vv?.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [mediaW, mediaH, isActive]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0" style={{
        backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)',
      }} />
      <div aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
      <div
        ref={zoomRef}
        style={{
          ...zoomStyle,
          position: 'absolute',
          top: fsRect.top, left: fsRect.left,
          width: fsRect.width, height: fsRect.height,
          zIndex: 1,
        }}
      >
        <img
          ref={imgRef}
          src={imgSrc}
          alt=""
          className="w-full h-full"
          style={{ objectFit: fsRect.fit }}
          loading="eager"
          draggable={false}
        />
      </div>
    </div>
  );
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
  /** Intrinsic media dims — consumed by resolveRestingRect so the settled
   *  video rect matches the clone's expand target by construction. Missing
   *  dims fall back to full viewport (util's own default). */
  mediaW?: number;
  mediaH?: number;
}> = ({ postId, hlsUrl, posterSrc, isActive, onFirstFrameReady, ownerKey, allowBorrow = true, mediaW = 0, mediaH = 0 }) => {
  // Mute state now owned by VideoEngine via 'session' audioPolicy — no local read.
  const storedStart = useFullscreenFeedStore((s) => s.startPosition);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const origin = useFullscreenFeedStore((s) => s.origin);
  const isBorrowSlide = !!(allowBorrow && borrow && isActive && borrow.postId === postId);
  // Belt-and-braces: if a caller ever renders this slot without an ownerKey
  // and the postId is bare (no colon), inject `:0` so the engine lane, the
  // reveal-gate, and lastPos all key on the canonical `${postId}:0`. Never
  // collapses `:1/:2` (multi-media pager passes those explicitly).
  const resumeKey = ownerKey ?? (postId.includes(':') ? postId : `${postId}:0`);

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
    audioPolicy: 'session',
    postId: resumeKey,
  });

  // Autoplay-blocked → show "Tap for sound" pill. The engine's unmuted
  // rejection path muted THIS lane to keep playback going but did NOT
  // touch the session store. Tapping the pill re-asserts unmute with a
  // fresh gesture; unmuting via any other surface clears the pill too.
  const [showSoundPill, setShowSoundPill] = useState(false);
  useEffect(() => {
    setShowSoundPill(false);
  }, [resumeKey, isBorrowSlide]);
  useEffect(() => {
    const unsub = VideoEngine.onAutoplayBlocked((id) => {
      if (id === 'fullscreen') setShowSoundPill(true);
    });
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = useSessionAudio.subscribe((s) => {
      if (!s.isMuted) setShowSoundPill(false);
    });
    return unsub;
  }, []);

  // Resolve the settled rect from intrinsic media dims — MUST match the
  // clone's expand target (both consume resolveRestingRect). Prevents the
  // clone-retire → settled-paint size delta that produced the visible
  // "media resize after first paint" flash.
  //
  // iOS/WKWebView cold-open sliver fix: at the render tick, visualViewport
  // height may still be settling (dynamic toolbars, boot). A one-shot
  // useMemo baked a stale rect that never re-measured, leaving a top-pinned
  // sliver over white. Mirror BorrowedFullscreenSlot (~L905): compute the
  // rect from a layout effect on mount, then re-resolve on visualViewport
  // resize + orientationchange while the slide is active.
  //
  // FIT-WIDTH FIX: the post row's width/height default to 1080x1920 in
  // feedMapper when the DB has no dimensions, so a genuinely LANDSCAPE clip
  // was resolved as portrait → COVER → cropped to roughly a third of its
  // width in the viewer. The live element's intrinsic aspect is authoritative
  // once metadata lands, so we prefer it over the (possibly defaulted) props
  // and re-resolve. Landscape then takes the CONTAIN branch of
  // resolveRestingRect → fits width, blurred self-backdrop fills the bars.
  const [laneAspect, setLaneAspect] = React.useState<number | null>(null);
  const dims = React.useMemo(() => {
    if (laneAspect && laneAspect > 0) return { w: laneAspect * 1000, h: 1000 };
    return { w: mediaW, h: mediaH };
  }, [laneAspect, mediaW, mediaH]);
  const [settledRect, setSettledRect] = React.useState<RestingRect>(() =>
    resolveRestingRect(dims.w, dims.h, getCurrentViewport(), 'video'),
  );
  // Poll the engine for the lane's intrinsic aspect until metadata lands.
  React.useEffect(() => {
    if (isBorrowSlide || !isActive) return;
    let cancelled = false;
    const read = () => {
      if (cancelled) return true;
      const a = VideoEngine.getLaneAspect('fullscreen');
      if (a && a > 0) {
        setLaneAspect((prev) => (prev && Math.abs(prev - a) < 0.001 ? prev : a));
        return true;
      }
      return false;
    };
    if (read()) return;
    const timers = [60, 160, 320, 600, 1200, 2000].map((ms) =>
      setTimeout(read, ms),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isBorrowSlide, isActive, resumeKey]);
  React.useLayoutEffect(() => {
    if (isBorrowSlide) return;
    const measure = () => {
      const next = resolveRestingRect(dims.w, dims.h, getCurrentViewport(), 'video');
      setSettledRect((prev) =>
        prev.top === next.top && prev.left === next.left
          && prev.width === next.width && prev.height === next.height
          && prev.fit === next.fit
          ? prev
          : next,
      );
    };
    // Initial measure on mount — captures the post-layout viewport, not the
    // pre-layout one that useMemo saw.
    measure();
    if (!isActive) return;
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    vv?.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      vv?.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [dims.w, dims.h, isBorrowSlide, isActive]);



  React.useEffect(() => {
    if (isBorrowSlide) return;
    VideoEngine.setObjectFit('fullscreen', settledRect.fit);
  }, [isBorrowSlide, settledRect.fit]);

  // Viewer pause intent — if the user paused this media earlier in the same
  // fullscreen session, the slot must NOT auto-play on mount/remount. The
  // useVideoLane auto-play effect fires unconditionally; we counter it with a
  // matching viaViewer pause immediately after (and again once firstFrame
  // lands, in case the auto-play was still in-flight).
  const pausedIntent = useFullscreenFeedStore(
    (s) => s.pausedOwnerKeys.has(resumeKey),
  );
  React.useEffect(() => {
    if (isBorrowSlide || !isActive || !pausedIntent) return;
    let cancelled = false;
    const enforce = () => {
      if (cancelled) return;
      try {
        VideoEngine.pause('fullscreen', {
          callerPostId: resumeKey,
          viaViewer: true,
        });
      } catch { /* noop */ }
    };
    enforce();
    const t1 = setTimeout(enforce, 60);
    const t2 = setTimeout(enforce, 260);
    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isBorrowSlide, isActive, pausedIntent, resumeKey]);


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

  // ── AUDIO PUSHDOWN (cold) + AudioDebug cold.audio at slot bind.
  // Runs the pushdown unconditionally; HUD events are only logged when
  // audioDebug is on.
  const audioDbgColdRef = React.useRef(false);
  React.useEffect(() => {
    if (isBorrowSlide) { audioDbgColdRef.current = false; return; }
    if (!isActive) { audioDbgColdRef.current = false; return; }
    if (audioDbgColdRef.current) return;
    audioDbgColdRef.current = true;
    try {
      const elPre = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.('fullscreen') ?? null;
      // Reuse the engine's session-policy apply so the freshly-bound
      // fullscreen lane inherits current useSessionAudio state at open time.
      // No-op when session is muted (elements default muted); never unmutes
      // against session intent.
      const sessionMuted = useSessionAudio.getState().isMuted;
      const elMutedBefore = elPre?.muted ?? null;
      try { VideoEngine.applyLaneAudioPolicy('fullscreen'); } catch {}
      if (!audioDbg.audioDebugEnabled()) return;
      const elAfter = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.('fullscreen') ?? null;
      audioDbg.logAudio('audio.pushdown', {
        site: 'cold', laneId: 'fullscreen', sessionMuted,
        elMutedBefore, elMutedAfter: elAfter?.muted ?? null,
      });
      audioDbg.logAudio('cold.audio', {
        laneId: 'fullscreen', ownerKey: resumeKey,
        srcSet: !!elAfter?.currentSrc,
        muted: elAfter?.muted ?? null, volume: elAfter?.volume ?? null,
        paused: elAfter?.paused ?? null,
        currentTime: elAfter ? +elAfter.currentTime.toFixed(3) : null,
        startPosition: +Number(startPosition).toFixed(3),
      });
      audioDbg.setSummary({
        fsPos: elAfter ? +elAfter.currentTime.toFixed(2) : null,
      });
      // Snapshot play() promise outcome on the next tick.
      setTimeout(() => {
        try {
          const el2 = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.('fullscreen') ?? null;
          audioDbg.logAudio('cold.audio.postPlay', {
            laneId: 'fullscreen',
            muted: el2?.muted ?? null,
            paused: el2?.paused ?? null,
            currentTime: el2 ? +el2.currentTime.toFixed(3) : null,
          });
        } catch {}
      }, 120);
    } catch {}
  }, [isActive, isBorrowSlide, resumeKey, startPosition]);


  // [TRACE] slot.render — once per active mount of this slot for correlation.
  const didTraceRenderRef = React.useRef(false);
  React.useEffect(() => {
    if (!isActive) { didTraceRenderRef.current = false; return; }
    if (didTraceRenderRef.current) return;
    didTraceRenderRef.current = true;
    const openT = traceLookup({ ownerKey: resumeKey, postId });
    trace('slot.render', {
      openId: openT?.openId,
      propOwnerKey: ownerKey ?? null,
      propPostId: postId,
      resumeKey,
      isBorrowSlide,
      isActive,
      laneHlsUrl: !!laneHlsUrl,
    });
  }, [isActive, isBorrowSlide, resumeKey, postId, ownerKey, laneHlsUrl]);

  // [TRACE] slot.laneBind — fires once per active bind of a non-borrow slot.
  const didTraceBindRef = React.useRef(false);
  React.useEffect(() => {
    if (isBorrowSlide) { didTraceBindRef.current = false; return; }
    if (!isActive) { didTraceBindRef.current = false; return; }
    if (didTraceBindRef.current) return;
    didTraceBindRef.current = true;
    const openT = traceLookup({ ownerKey: resumeKey });
    let snapPostId: string | null = null;
    let firstFrame = false;
    let elId = 'NULL';
    try {
      const s = VideoEngine.snapshot('fullscreen');
      snapPostId = s.postId;
      firstFrame = s.firstFrame;
      const el = (document.querySelector('video[data-lane-id="fullscreen"]') as HTMLVideoElement | null);
      elId = (el?.dataset as any)?.vid ?? 'NULL';
    } catch {}
    trace('slot.laneBind', {
      openId: openT?.openId,
      laneId: 'fullscreen',
      requestedOwnerKey: resumeKey,
      useVideoLaneReturnedSnapshotPostId: snapPostId,
      snapshotFirstFrame: firstFrame,
      snapshotElId: elId,
    });
  }, [isActive, isBorrowSlide, resumeKey]);

  // Fire onFirstFrameReady ONLY when the engine has painted the real frame
  // at (or past) startPosition — for non-borrow slides. Borrow slide fires
  // it from <BorrowedFullscreenSlot/> on the next rAF post-mount.
  const firedRef = React.useRef(false);
  const targetReady = startPosition <= 0 || lane.snapshot.currentTime >= startPosition - 0.3;
  const laneOwnerMatches = ownerKeysMatch(lane.snapshot.postId, resumeKey);
  const showVideo = lane.snapshot.firstFrame && laneOwnerMatches && targetReady;

  React.useEffect(() => {
    if (isBorrowSlide) return;
    if (!isActive) { firedRef.current = false; return; }
    if (firedRef.current) return;
    if (showVideo) {
      firedRef.current = true;
      onFirstFrameReady?.();
    }
  }, [isActive, isBorrowSlide, showVideo, onFirstFrameReady]);

  // [TRACE] lane.firstFrameCb — fires when the slot's local snapshot
  // firstFrame flips true for the first time, matched against the RIGHT
  // owner key so we can prove which callback fired for which open.
  const firstFrameCbFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (!isActive || isBorrowSlide) { firstFrameCbFiredRef.current = false; return; }
    if (!lane.snapshot.firstFrame) return;
    if (firstFrameCbFiredRef.current) return;
    firstFrameCbFiredRef.current = true;
    const openT = traceLookup({ ownerKey: resumeKey });
    let elId = 'NULL';
    try {
      const el = document.querySelector('video[data-lane-id="fullscreen"]') as HTMLVideoElement | null;
      elId = (el?.dataset as any)?.vid ?? 'NULL';
    } catch {}
    trace('lane.firstFrameCb', {
      openId: openT?.openId,
      laneId: 'fullscreen',
      firedWithSnapshotPostId: lane.snapshot.postId,
      firedWithFirstFrame: lane.snapshot.firstFrame,
      matchedCurrentOwnerKey: laneOwnerMatches,
      elId,
    });
  }, [isActive, isBorrowSlide, lane.snapshot.firstFrame, lane.snapshot.postId, laneOwnerMatches, resumeKey]);

  // [TRACE] gate — sample the reveal-gate at 100 / 500 / 1000 / 3000 ms.
  // Emits gate.reveal the first time showVideo flips true, or gate.stuck at
  // 3s if it never did.
  const gateSnapshotRef = React.useRef({ showVideo, revealed: false });
  gateSnapshotRef.current.showVideo = showVideo;
  React.useEffect(() => {
    if (!isActive || isBorrowSlide) return;
    const openT = traceLookup({ ownerKey: resumeKey });
    const openId = openT?.openId;
    const started = performance.now();
    gateSnapshotRef.current.revealed = false;
    const readElId = (): string => {
      try {
        const el = document.querySelector('video[data-lane-id="fullscreen"]') as HTMLVideoElement | null;
        return (el?.dataset as any)?.vid ?? 'NULL';
      } catch { return 'NULL'; }
    };
    const sample = (label: string) => {
      let snapPostId: string | null = null;
      let ff = false;
      try {
        const s = VideoEngine.snapshot('fullscreen');
        snapPostId = s.postId;
        ff = s.firstFrame;
      } catch {}
      trace('gate', {
        openId,
        laneId: 'fullscreen',
        at: label,
        snapshotFirstFrame: ff,
        laneOwnerMatches: ownerKeysMatch(snapPostId, resumeKey),
        targetReady,
        showVideoResult: gateSnapshotRef.current.showVideo,
        snapshotPostId: snapPostId,
        expectedOwnerKey: resumeKey,
        snapshotElId: readElId(),
      });
    };
    const timers: number[] = [];
    timers.push(window.setTimeout(() => sample('100ms'), 100));
    timers.push(window.setTimeout(() => sample('500ms'), 500));
    timers.push(window.setTimeout(() => sample('1000ms'), 1000));
    timers.push(window.setTimeout(() => {
      sample('3000ms');
      if (!gateSnapshotRef.current.revealed) {
        let snapPostId: string | null = null;
        let ff = false;
        try {
          const s = VideoEngine.snapshot('fullscreen');
          snapPostId = s.postId;
          ff = s.firstFrame;
        } catch {}
        trace('gate.stuck', {
          openId,
          snapshotFirstFrame: ff,
          laneOwnerMatches: ownerKeysMatch(snapPostId, resumeKey),
          targetReady,
          snapshotElId: readElId(),
          expectedOwnerKey: resumeKey,
        });
      }
    }, 3000));
    // Fire reveal marker when showVideo first becomes true within this
    // active session via a rAF poll (cheap; only runs while stuck).
    let raf = 0;
    const poll = () => {
      if (gateSnapshotRef.current.revealed) return;
      if (gateSnapshotRef.current.showVideo) {
        gateSnapshotRef.current.revealed = true;
        trace('gate.reveal', {
          openId,
          ms: Math.round(performance.now() - started),
          elId: readElId(),
        });
        return;
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isBorrowSlide, resumeKey]);

  // [TRACE] slide.branch — every render tick during an open. Dedup on the
  // serialized signal so we get transitions (e.g. borrow-slot → video-slot)
  // without spamming steady state. Instrumentation only, no behaviour change.
  const tickRef = React.useRef(0);
  const lastBranchRef = React.useRef<string>('');
  tickRef.current += 1;
  const branchTaken: 'borrow-slot' | 'video-slot' =
    (isBorrowSlide && borrow && origin) ? 'borrow-slot' : 'video-slot';
  const branchKey = `${branchTaken}|iB=${isBorrowSlide}|bPid=${borrow?.postId ?? 'null'}|oA=${origin != null}|pid=${postId}`;
  if (isActive && (branchKey !== lastBranchRef.current)) {
    lastBranchRef.current = branchKey;
    try {
      const openT = traceLookup({ ownerKey: resumeKey, postId });
      trace('slide.branch', {
        openId: openT?.openId,
        tick: tickRef.current,
        isBorrowSlide,
        borrowPostId: borrow?.postId ?? null,
        postId,
        originAlive: origin != null,
        allowBorrow,
        branchTaken,
      });
    } catch {}
  }

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


  const mediaFrameStyle: React.CSSProperties = {
    position: 'absolute',
    top: settledRect.top,
    left: settledRect.left,
    width: settledRect.width,
    height: settledRect.height,
  };
  return (
    <div className="absolute inset-0 overflow-hidden">
      {posterSrc && (
        <div aria-hidden="true" className="absolute inset-0" style={{
          backgroundImage: `url(${posterSrc})`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)',
        }} />
      )}
      {/* Dim the surround (near-black); media sits above at zIndex ≥ 1. */}
      <div aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          aria-hidden
          style={{
            ...mediaFrameStyle, objectFit: settledRect.fit, zIndex: 1,
            // Poster fades OUT 1→0 on top of an already-opaque video host
            // (see below). Asymmetric crossfade — the host does NOT fade in
            // 0→1, so the composite never dips through ~0.75× brightness
            // (the "flash" the symmetric fade produced over black).
            opacity: showVideo ? 0 : 1,
            transition: 'opacity 120ms linear',
          }}
          loading="eager"
          draggable={false}
        />
      )}
      <div
        ref={lane.hostRef}
        style={{
          ...mediaFrameStyle, zIndex: 2, pointerEvents: 'none',
          // Snap to opaque (no transition) the moment the engine paints the
          // real first frame. Poster on top fades out over 120ms; composite
          // brightness stays at 100% throughout — no post-settle flash.
          opacity: showVideo ? 1 : 0,
        }}
      />

      {showSoundPill && !isBorrowSlide && (
        <div
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            zIndex: 20,
            pointerEvents: 'auto',
          }}
        >
          <TapForSoundPill
            onClick={() => {
              useSessionAudio.getState().unmute();
              setShowSoundPill(false);
            }}
          />
        </div>
      )}
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
  // Origin snapshot — used as the second link in the aspect fallback chain
  // when the engine hasn't published a lane aspect yet.
  const originSnap = useFullscreenFeedStore.getState().origin;
  const initialTargetRect = React.useMemo(() => {
    const vp = getCurrentViewport();
    const laneAspect = VideoEngine.getLaneAspect(borrow.laneId);
    let mw = 0;
    let mh = 0;
    if (laneAspect && laneAspect > 0) {
      mw = laneAspect * 1000;
      mh = 1000;
    } else if (
      originSnap &&
      (originSnap.originMediaW ?? 0) > 0 &&
      (originSnap.originMediaH ?? 0) > 0
    ) {
      mw = originSnap.originMediaW as number;
      mh = originSnap.originMediaH as number;
    } else {
      mw = vp.w;
      mh = Math.max(1, Math.round(vp.w * 0.5625));
    }
    return resolveRestingRect(mw, mh, vp, 'video');
    // borrow is stable for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(FS_TRANSITION_MODE === 'cut');
  // Underlay fade & fit-swap are decoupled so the aspect change lands at the
  // fade midpoint (invisible under 50% black) rather than at the leading edge
  // where it reads as a pop.
  const [underlayVisible, setUnderlayVisible] = React.useState(
    FS_TRANSITION_MODE === 'cut' && initialTargetRect.fit === 'contain',
  );
  const [fitContain, setFitContain] = React.useState(
    FS_TRANSITION_MODE === 'cut' && initialTargetRect.fit === 'contain',
  );
  const skipFitSwapRef = React.useRef<boolean>(false);
  const targetRectRef = React.useRef<RestingRect | null>(initialTargetRect);
  // Aspect-aware: precompute whether target rest is COVER (portrait video →
  // full viewport, no fit swap, no underlay) or CONTAIN (landscape video →
  // letterboxed inside safe area, underlay fades DURING expand).
  const restingFitRef = React.useRef<'cover' | 'contain'>(initialTargetRect.fit);
  // Guard so onFirstFrameReady is fired exactly once from transitionend
  // (fix 5: motion clock = readiness clock).
  const firedFirstFrameRef = React.useRef<boolean>(false);
  // ── Symmetric close: reverse-shrink to origin tile ──
  // Subscribes to the store-owned close-anim flag. When it flips to 'borrow'
  // we recompute the origin host's current rect (fresh — the tile is kept
  // mounted while the overlay is open) and drive the wrapper back to it.
  // On transitionend we call signalCloseAnimDone; the overlay's finalise
  // effect runs returnBorrow('close') + close() from there.
  const closeAnim = useFullscreenFeedStore((s) => s.closeAnim);
  const signalCloseAnimDone = useFullscreenFeedStore((s) => s.signalCloseAnimDone);
  const [reverseTarget, setReverseTarget] = React.useState<
    | null
    | { top: number; left: number; width: number; height: number }
  >(null);
  const [closing, setClosing] = React.useState(false);
  const closeFiredRef = React.useRef(false);

  // Mount the live element on first render.
  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // Element is currently in the tile (or hidden host if tile evicted).
    // mountLane atomically moves it here; hls instance stays paired.
    VideoEngine.mountLane(borrow.laneId, el);
    // Assert play-intent post-mount (Stage-7 PR-1 fix): sets wantPlay and
    // recovers any owner-caller pause that raced between pin + markBorrowed.
    // Belt-and-braces with the engine's borrow guard. Honors viewer pause
    // intent — if the user paused this media in a prior fullscreen session
    // for the same borrowed key, we do NOT re-assert play here.
    const hasPauseIntent = useFullscreenFeedStore
      .getState()
      .pausedOwnerKeys.has(borrow.ownerKey);
    if (!hasPauseIntent) {
      void VideoEngine.play(borrow.laneId, { callerPostId: borrow.ownerKey });
    }
    // Ensure cover for Phase 1.
    VideoEngine.setObjectFit(borrow.laneId, 'cover');

    if (isPerfEnabled() || (typeof window !== 'undefined' && (window as any).__VIDEO_ENGINE_DBG__)) {
      // eslint-disable-next-line no-console
      console.info('[BORROW]', 'mount', { laneId: borrow.laneId, ownerKey: borrow.ownerKey, postId: borrow.postId });
    }

    // ── AUDIO PUSHDOWN (borrow): reuse engine's session-policy apply right
    // after adoption so the borrowed lane element inherits current
    // useSessionAudio state at open time. No-op when session is muted
    // (elements default muted). Always runs — HUD logging is conditional.
    {
      const bElPre = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.(borrow.laneId) ?? null;
      const sessionMuted = useSessionAudio.getState().isMuted;
      const elMutedBefore = bElPre?.muted ?? null;
      try { VideoEngine.applyLaneAudioPolicy(borrow.laneId); } catch {}
      if (audioDbg.audioDebugEnabled()) {
        try {
          const bElAfter = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.(borrow.laneId) ?? null;
          audioDbg.logAudio('audio.pushdown', {
            site: 'borrow', laneId: borrow.laneId, sessionMuted,
            elMutedBefore, elMutedAfter: bElAfter?.muted ?? null,
          });
          audioDbg.logAudio('borrow.audio', {
            phase: 'bind', laneId: borrow.laneId, ownerKey: borrow.ownerKey,
            muted: bElAfter?.muted ?? null, volume: bElAfter?.volume ?? null,
            paused: bElAfter?.paused ?? null,
            currentTime: bElAfter ? +bElAfter.currentTime.toFixed(3) : null,
          });
          setTimeout(() => {
            try {
              const bEl2 = (VideoEngine as unknown as { _debugGetElement?: (id: string) => HTMLMediaElement | null })._debugGetElement?.(borrow.laneId) ?? null;
              audioDbg.logAudio('borrow.audio', {
                phase: 'post100', laneId: borrow.laneId,
                muted: bEl2?.muted ?? null, volume: bEl2?.volume ?? null,
                paused: bEl2?.paused ?? null,
                currentTime: bEl2 ? +bEl2.currentTime.toFixed(3) : null,
              });
              audioDbg.setSummary({ fsPos: bEl2 ? +bEl2.currentTime.toFixed(2) : null });
            } catch {}
          }, 100);
        } catch {}
      }
    }


    // Aspect-aware expand target — grow INTO the media's resting rect so
    // there is no post-expand shrink.
    //
    // Fallback chain (fix 3):
    //   1. VideoEngine.getLaneAspect(laneId)       — live element metadata
    //   2. origin.originMediaW / originMediaH      — threaded from tap
    //   3. viewport + contain                      — safe last resort
    // Emit [DECIDE] restingRect.late when we fall past step 1 so we can
    // quantify how often the tail fires (drives whether a corrective tween
    // is worth building).
    const vp = getCurrentViewport();
    const laneAspect = VideoEngine.getLaneAspect(borrow.laneId);
    let mw = 0;
    let mh = 0;
    let source: 'lane' | 'origin' | 'viewport-contain' = 'lane';
    if (laneAspect && laneAspect > 0) {
      mw = laneAspect * 1000; mh = 1000;
    } else if (
      originSnap && (originSnap.originMediaW ?? 0) > 0 && (originSnap.originMediaH ?? 0) > 0
    ) {
      mw = originSnap.originMediaW as number;
      mh = originSnap.originMediaH as number;
      source = 'origin';
      // eslint-disable-next-line no-console
      console.info('[DECIDE]', 'restingRect.late', {
        laneId: borrow.laneId, source, mw, mh,
      });
    } else {
      // Force contain fallback by feeding the resolver landscape-ish dims
      // that will letterbox inside safe area instead of covering full VP.
      mw = vp.w; mh = Math.max(1, Math.round(vp.w * 0.5625));
      source = 'viewport-contain';
      // eslint-disable-next-line no-console
      console.info('[DECIDE]', 'restingRect.late', {
        laneId: borrow.laneId, source, mw, mh,
      });
    }
    const rect = resolveRestingRect(mw, mh, vp, 'video');
    targetRectRef.current = rect;
    restingFitRef.current = rect.fit;
    // If the resting fit is CONTAIN, start the underlay fade concurrently
    // with the expand so bars are already established when we land.
    if (rect.fit === 'contain') {
      // rAF-defer so initial style (originRect) commits before we flip.
      requestAnimationFrame(() => setUnderlayVisible(true));
    }

    // LATE ASPECT CORRECTION (fit-width fix): when the lane had no metadata
    // yet we fell back to the origin snapshot, whose dims default to
    // 1080x1920 in feedMapper when the DB row carries none. A genuinely
    // landscape clip would then rest COVER and lose most of its width. Poll
    // briefly for the element's intrinsic aspect and, if it disagrees, move
    // to the correct resting rect (CONTAIN → fits width, blurred backdrop
    // fills the bars). No-op in the common case (source === 'lane').
    if (source !== 'lane') {
      let cancelled = false;
      const correct = () => {
        if (cancelled) return true;
        const a = VideoEngine.getLaneAspect(borrow.laneId);
        if (!a || a <= 0) return false;
        const nextRect = resolveRestingRect(a * 1000, 1000, getCurrentViewport(), 'video');
        const cur = targetRectRef.current;
        if (!cur || (cur.fit === nextRect.fit && Math.abs(cur.height - nextRect.height) < 1)) return true;
        targetRectRef.current = nextRect;
        restingFitRef.current = nextRect.fit;
        setRectVersion((v) => v + 1);
        if (nextRect.fit === 'contain') {
          setUnderlayVisible(true);
          setFitContain(true);
          try { VideoEngine.setObjectFit(borrow.laneId, 'contain'); } catch {}
        }
        return true;
      };
      if (!correct()) {
        const timers = [80, 200, 400, 800, 1500].map((ms) => setTimeout(correct, ms));
        lateCorrectCleanupRef.current = () => {
          cancelled = true;
          timers.forEach(clearTimeout);
        };
      }
    }


    // CUT mode: wrapper rendered at the resting rect on the first commit, and
    // this layout effect reparents the live <video> before paint. No rAF gap,
    // no tile-sized/first-frame flash before the fullscreen pixels are live.
    if (FS_TRANSITION_MODE === 'cut') {
      setExpanded(true);
      if (restingFitRef.current === 'contain') {
        setFitContain(true);
        try { VideoEngine.setObjectFit(borrow.laneId, 'contain'); } catch {}
      }
      if (!firedFirstFrameRef.current) {
        firedFirstFrameRef.current = true;
        onFirstFrameReady?.();
      }
      try { VideoEngine.nudgeLevelCap(borrow.laneId); } catch {}
      return;
    }

    // Fix 2/5: expand FIRST, then let handleTransitionEnd fire
    // onFirstFrameReady when the wrapper's own expand transition completes.
    // The old order revealed the host before the slot was fullscreen and
    // showed a one-frame flash of the underlying SnapFeed at fullscreen
    // geometry around a tile-sized borrow slot.
    const raf1 = requestAnimationFrame(() => {
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

  // Kick off the reverse-shrink when the overlay flips closeAnim to 'borrow'.
  React.useEffect(() => {
    if (FS_TRANSITION_MODE === 'cut') return; // cut mode: instant handback, no reverse motion
    if (closeAnim !== 'borrow') return;
    if (closing) return;

    // Fresh origin rect from the registry — the borrowed tile is still
    // mounted (feed scroll-locked) so its host's getBoundingClientRect is
    // valid. Fallback to the mount-time originRect prop if the host is gone.
    let target = originRect;
    try {
      const host = originHostRegistry.get(borrow.ownerKey);
      if (host) {
        const r = host.getBoundingClientRect();
        target = { top: r.top, left: r.left, width: r.width, height: r.height };
      }
    } catch {}
    setReverseTarget(target);
    // Fade the underlay out concurrently (contain-target letterbox bars
    // dissolve as the wrapper shrinks past their aspect).
    if (restingFitRef.current === 'contain') {
      setUnderlayVisible(false);
      // Flip fit back to cover so the shrink is a pure translate/scale.
      try { VideoEngine.setObjectFit(borrow.laneId, 'cover'); } catch {}
    }
    // Commit the collapse on the next frame so the browser has a real
    // "from" style (the current resting rect) to interpolate from.
    requestAnimationFrame(() => {
      try { vperfMotionMark('shrinkStart'); vperfCloseMotionMark('returnAnimStart'); } catch {}
      setClosing(true);
    });
  }, [closeAnim, closing, originRect, borrow.laneId, borrow.ownerKey]);

  const handleTransitionEnd = React.useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    // Only respond to the wrapper's own size/transform transitions.
    if (e.target !== wrapperRef.current) return;

    // ── Symmetric close: shrink transition just completed ──
    if (closing) {
      if (closeFiredRef.current) return;
      if (
        e.propertyName !== 'transform' &&
        e.propertyName !== 'width' &&
        e.propertyName !== 'height'
      ) return;
      closeFiredRef.current = true;
      try { vperfMotionMark('shrinkEnd'); vperfCloseMotionMark('returnAnimEnd'); } catch {}
      signalCloseAnimDone();
      return;
    }

    // [VPERF] motion trace: phase-1 (expand) done, phase-2 (fit swap) begins.
    try { vperfMotionMark('expandEnd'); vperfMotionMark('fitSwapStart'); } catch {}

    // Fix 5: motion clock = readiness clock. Reveal the fullscreen host only
    // after the borrow wrapper's own expand transition has committed. Fires
    // once per open, on the first size/transform transition end.
    if (!firedFirstFrameRef.current && (
      e.propertyName === 'transform' || e.propertyName === 'width' || e.propertyName === 'height'
    )) {
      firedFirstFrameRef.current = true;
      onFirstFrameReady?.();
    }

    // Resting fit was decided at mount from the media's aspect ratio.
    if (restingFitRef.current === 'cover') {
      // Portrait/square video — wrapper already fills viewport, media already
      // covers it, nothing to swap. Cover fast-path.
      skipFitSwapRef.current = true;
      try { VideoEngine.nudgeLevelCap(borrow.laneId); } catch {}
      try { vperfMotionMark('fitSwapEnd'); } catch {}
      return;
    }

    // CONTAIN target — the wrapper landed on the letterboxed rect itself, so
    // flipping object-fit from cover→contain at rest is visually a no-op
    // (cover-cropping a rect at the media's own aspect ratio IS the same as
    // containing it). Underlay was already faded in during the expand.
    if (!fitContain) {
      setFitContain(true);
      try { VideoEngine.setObjectFit(borrow.laneId, 'contain'); } catch {}
      try { VideoEngine.nudgeLevelCap(borrow.laneId); } catch {}
    }
    try { vperfMotionMark('fitSwapEnd'); } catch {}
  }, [borrow.laneId, fitContain, onFirstFrameReady, closing, signalCloseAnimDone]);

  const target = targetRectRef.current;
  // Style resolves in three states: initial (originRect) → expanded (target) →
  // closing (reverseTarget). Only the transition property differs (initial is
  // a snap; expanded/closing use the 300ms curve).
  const rectNow = closing && reverseTarget
    ? reverseTarget
    : expanded && target
      ? { top: target.top, left: target.left, width: target.width, height: target.height }
      : { top: originRect.top, left: originRect.left, width: originRect.width, height: originRect.height };
  const style: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    transform: `translate(${rectNow.left}px, ${rectNow.top}px)`,
    width: rectNow.width,
    height: rectNow.height,
    zIndex: 3,
    background: '#000',
    overflow: 'hidden',
    willChange: 'transform, width, height',
    // CUT mode: never animate the wrapper — instant snap on open, instant
    // handback on close. EXPAND mode: 300ms shared-element transition.
    transition:
      FS_TRANSITION_MODE === 'cut'
        ? 'none'
        : (expanded || closing)
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
        {/* Dark scrim over the blurred poster for CONTAIN targets (landscape
            video). Product rule: contained-media surround = blur + darken,
            NEVER solid black. 0.55 leaves the blurred poster visible beneath
            so the letterbox reads as one blurred world, not black bars.
            COVER (portrait/full-bleed) targets never toggle this layer.
            Same fade timing/trigger as before. */}
        <div
          aria-hidden
          data-vperf="flip-underlay"
          style={{
            position: 'absolute', inset: 0, background: '#000',
            opacity: underlayVisible ? 0.55 : 0,
            transition: 'opacity 260ms linear',
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
  const setStoreActivePagerIdx = useFullscreenFeedStore((s) => s.setActivePagerIdx);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const demotedRef = useRef(false);

  // Publish the initial page index and every settle so <FullscreenScrubber/>
  // computes the correct ownerKey (broken previously — it read from
  // clubhouseStore.carouselPositions which lags this pager).
  useEffect(() => {
    setStoreActivePagerIdx(activePagerIdx);
  }, [activePagerIdx, setStoreActivePagerIdx]);


  // [FSPAGER] HTTP warm — request i±1 video neighbours through the
  // PrefetchController on mount and on every page transition. Lane-free:
  // structurally impossible to warm engine lanes without a second lane
  // (see A4). abortAll is global — vertical warms may be momentarily
  // cancelled; controller re-issues on the next scroll sample.
  const warmNeighbours = React.useCallback((idx: number) => {
    for (const k of [-1, 1]) {
      const i = idx + k;
      if (i < 0 || i >= media.length) continue;
      const m = media[i];
      if (!m || m.type !== 'video') continue;
      const hlsUrl = (m as any).hlsUrl as string | undefined;
      if (!hlsUrl) continue;
      PrefetchController.request(`${post.id}:${i}`, hlsUrl);
    }
  }, [media, post.id]);

  // Jump to the opening media on mount (auto, no smooth animation — the FLIP
  // clone / borrow FLIP is the visual open animation).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollLeft = openIdx * el.clientWidth;
    });
    return () => cancelAnimationFrame(raf);
  }, [openIdx]);

  // [FSPAGER] pager.openIdxMount + first neighbour warm.
  useEffect(() => {
    trace('pager.openIdxMount', {
      surface: 'FSPAGER',
      postId: post.id,
      openIdx,
      count: media.length,
    });
    warmNeighbours(openIdx);
    return () => {
      PrefetchController.abortAll('pagerUnmount');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const fromIdx = activePagerIdx;
        // Borrow demote — one-shot on first horizontal move.
        let demoteReason: 'borrow.demote' | null = null;
        if (
          !demotedRef.current &&
          borrow &&
          borrow.postId === post.id &&
          idx !== openIdx
        ) {
          demotedRef.current = true;
          demoteReason = 'borrow.demote';
          trace('borrow.demote', {
            surface: 'FSPAGER',
            postId: post.id,
            fromIdx,
            toIdx: idx,
          });
          useFullscreenFeedStore.getState().demoteBorrow();
        }
        setActivePagerIdx(idx);

        const nextItem = media[idx];
        const pageKind: 'video' | 'image' | 'unknown' =
          nextItem?.type === 'video' ? 'video' : nextItem?.type === 'image' ? 'image' : 'unknown';

        // [FSPAGER] slide.change trace.
        const dir: 1 | -1 | 0 = idx > fromIdx ? 1 : idx < fromIdx ? -1 : 0;
        const wasPrefetched = pageKind === 'video'
          ? PrefetchController.wasPrefetched(`${post.id}:${idx}`)
          : false;
        trace('slide.change', {
          surface: 'FSPAGER',
          postId: post.id,
          from: fromIdx,
          to: idx,
          dir,
          pageKind,
          prefetched: wasPrefetched,
          ...(demoteReason ? { demoted: true } : {}),
        });

        // HTTP warm for the new neighbours.
        warmNeighbours(idx);

        // [VPERF] S5 swipe.pager — measure horizontal settle onto a video
        // page. Closer on firstFrame, waypoint on playing (mirror fs.open).
        if (pageKind === 'video') {
          const spanId = vperfNextId(`swipe.pager:${post.id}:${idx}`);
          vperfStart(spanId, 'swipe.pager', {
            postId: post.id,
            mediaIndex: idx,
            pageKind: 'video',
          });
          vperfArmLane('fullscreen', { spanId, endOn: 'firstFrame' });
          vperfArmLane('fullscreen', { spanId, endOn: 'playing', phase: 'playing' });

          // [FSPAGER] slide.mismatch guard — video pages only (already
          // gated by pageKind === 'video' above). Retained prior lane
          // content must not fire the guard: record laneOwnerKeyAtStart
          // and wait until EITHER (a) firstFrame && repointed away from
          // start-owner (compare with expected); OR (b) firstFrame &&
          // already matches expected; OR (c) 1500ms timeout — nothing.
          if (isPerfEnabled()) {
            const expectedKey = `${post.id}:${idx}`;
            let laneOwnerKeyAtStart: string | null = null;
            try { laneOwnerKeyAtStart = VideoEngine.snapshot('fullscreen').postId ?? null; } catch { /* noop */ }
            const started = performance.now();
            let done = false;
            const poll = () => {
              if (done) return;
              if (performance.now() - started > 1500) { done = true; return; }
              try {
                const s = VideoEngine.snapshot('fullscreen');
                if (s.firstFrame) {
                  const repointed = !ownerKeysMatch(s.postId, laneOwnerKeyAtStart ?? '');
                  const matches = ownerKeysMatch(s.postId, expectedKey);
                  if (matches) { done = true; return; }
                  if (repointed) {
                    done = true;
                    trace('slide.mismatch', {
                      surface: 'FSPAGER',
                      expectedOwnerKey: expectedKey,
                      laneOwnerKey: s.postId,
                      laneOwnerKeyAtStart,
                      pagerIdx: idx,
                    });
                    return;
                  }
                  // firstFrame on retained prior owner — keep polling.
                }
              } catch { /* trace-only */ }
              requestAnimationFrame(poll);
            };
            requestAnimationFrame(poll);
          }
        }
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
      PrefetchController.abortAll('slideDeactivated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Carousel dots for the fullscreen pager are rendered by
          ImmersiveFullscreenChrome (bottom-center, above the scrubber). No
          inline dots here to avoid a duplicate row above the author block. */}
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

  // [FSPAGER] slide.video.play / slide.video.pause — emit whenever a video
  // page's isActivePage flips. Reasons are structural (page activation /
  // deactivation); the borrow.demote reason is emitted alongside in the
  // parent scroll handler. isPerfEnabled-gated inside trace().
  const wasActiveRef = useRef(isActivePage);
  useEffect(() => {
    if (m?.type !== 'video') return;
    if (wasActiveRef.current === isActivePage) return;
    wasActiveRef.current = isActivePage;
    trace(isActivePage ? 'slide.video.play' : 'slide.video.pause', {
      surface: 'FSPAGER',
      postId: post.id,
      pageIdx,
      ownerKey,
      reason: isActivePage ? 'pageActivated' : 'pageInactivated',
    });
  }, [isActivePage, m?.type, post.id, pageIdx, ownerKey]);

  if (m?.type === 'video') {
    const posterSrc = m.thumbnailUrl || '';
    const mHlsUrl = (m as any).hlsUrl || null;
    const videoRect = resolveRestingRect(m.width ?? 0, m.height ?? 0, getCurrentViewport(), 'video');
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
          mediaW={m.width ?? 0}
          mediaH={m.height ?? 0}
        />
      );
    }
    // Inactive video page — poster fallback (rect matches active slot so
    // page-become-active does not resize).
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
        {/* Dim the surround (near-black); media sits above at zIndex 1. */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        {posterSrc && (
          <img
            src={posterSrc}
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              top: videoRect.top, left: videoRect.left,
              width: videoRect.width, height: videoRect.height,
              objectFit: videoRect.fit, zIndex: 1,
            }}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        )}
      </div>
    );
  }

  if (m?.type === 'image') {
    const imgSrc = m.imageUrl || m.thumbnailUrl || '';
    const imgRect = resolveRestingRect(m.width ?? 0, m.height ?? 0, getCurrentViewport(), 'image');
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
        {/* Dim the surround (near-black); media sits above at zIndex 1. */}
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
        <div
          ref={zoomRef}
          style={{
            ...zoomStyle,
            position: 'absolute',
            top: imgRect.top, left: imgRect.left,
            width: imgRect.width, height: imgRect.height,
            zIndex: 1,
          }}
        >
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            className="w-full h-full"
            style={{ objectFit: imgRect.fit }}
            loading={isActivePage ? 'eager' : 'lazy'}
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return null;
};
