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
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle, type StateSnapshot } from 'react-virtuoso';
import type { FeedPost } from '@/components/media-system/types/media';
import type { ActiveActor } from '@/types/actor';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { registerNavScroller } from '@/hooks/useScrollDirection';

import { VideoEngine } from '@/video/VideoEngine';

import { FeedCard } from './FeedCard';

const CANVAS = '#15171F';

/** How many neighbours on each side of the active card may mount a <video>. */
const VIDEO_NEIGHBOUR_RADIUS = 1; // matches iOS ~3-decoder cap (active ±1 = 3)

export interface CardFeedProps {
  posts: FeedPost[];
  onLike: (post: FeedPost, actor?: ActiveActor | null) => void;
  onComment: (post: FeedPost, actor?: ActiveActor | null) => void;
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
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  /** Fires once when the first card's primary content is paint-ready. */
  onFirstContentReady?: () => void;
  /** Per-tab key — routes activeIndex/carouselPosition writes to the right slot. */
  tab?: string;
  /** Restore Virtuoso scroll state from a prior snapshot (per-tab handoff). */
  initialState?: StateSnapshot;
  /** Called on unmount with the current Virtuoso state snapshot. */
  onSnapshot?: (state: StateSnapshot) => void;
}

export interface CardFeedHandle {
  /** Synchronously snapshot Virtuoso state via the parent's `onSnapshot`. */
  captureSnapshot: () => void;
}

const PTR_THRESHOLD = 64;
const PTR_MAX_PULL = 96;

export const CardFeed = forwardRef<CardFeedHandle, CardFeedProps>(function CardFeed({
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
  onRefresh,
  isRefreshing = false,
  onFirstContentReady,
  tab,
  initialState,
  onSnapshot,
}, ref) {

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const scrollerElRef = useRef<HTMLElement | null>(null);

  // Snapshot Virtuoso state per-tab. Keep `onSnapshot` in a ref so the
  // imperative capture never depends on identity churn.
  const onSnapshotRef = useRef(onSnapshot);
  useEffect(() => { onSnapshotRef.current = onSnapshot; }, [onSnapshot]);

  // getState(cb) is synchronous while the instance is still mounted —
  // the callback fires inline. Expose this so the parent can capture
  // BEFORE flipping activeTab (the keyed remount tears us down otherwise).
  const captureSnapshot = useCallback(() => {
    try {
      virtuosoRef.current?.getState?.((snap: any) => {
        onSnapshotRef.current?.(snap);
      });
    } catch { /* noop */ }
  }, []);

  useImperativeHandle(ref, () => ({ captureSnapshot }), [captureSnapshot]);

  // Secondary fallback: useLayoutEffect cleanup runs BEFORE the ref is
  // nulled (unlike a passive useEffect cleanup), so the snapshot still
  // lands if the parent forgets to call captureSnapshot pre-flip.
  useLayoutEffect(() => {
    return () => { captureSnapshot(); };
  }, [captureSnapshot]);

  // ── Restore scrollTop explicitly ──────────────────────────────────
  // `restoreStateFrom` rehydrates the materialized item RANGES so the
  // target cards mount, but react-virtuoso does NOT reliably restore raw
  // scrollTop on a fresh mount when item heights are dynamic (cards with
  // images/video that measure after mount). Items re-measure, offsets
  // recompute, scroll resets to 0. So drive scrollTop ourselves, with a
  // short rAF retry loop to absorb the post-measure shift.
  // Guard `> 0` skips PTR rubber-band negative "top" snapshots.
  const restoreScrollTopRef = useRef<number | null>(
    initialState && typeof (initialState as any).scrollTop === 'number' && (initialState as any).scrollTop > 0
      ? (initialState as any).scrollTop
      : null
  );

  useLayoutEffect(() => {
    const target = restoreScrollTopRef.current;
    if (target == null) return;
    let tries = 0;
    let raf = 0;
    const apply = () => {
      const vr = virtuosoRef.current;
      const scroller = scrollerElRef.current;
      if (!vr || !scroller) { raf = requestAnimationFrame(apply); return; }
      vr.scrollTo({ top: target });
      tries++;
      if (tries < 6 && Math.abs(scroller.scrollTop - target) > 4) {
        raf = requestAnimationFrame(apply);
      } else {
        restoreScrollTopRef.current = null; // release so we never fight the user
      }
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Explore tab retap → scroll Clubhouse feed to top
  useEffect(() => {
    const onRetap = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tabId !== 'clubhouse') return;
      virtuosoRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('clbhouz-active-tab-retap', onRetap);
    return () => window.removeEventListener('clbhouz-active-tab-retap', onRetap);
  }, []);

  // ── Active-card tracking (center-proximity) ──
  // The card whose vertical center is nearest the viewport's vertical center
  // becomes active. Height-independent + symmetric. IntersectionObserver
  // maintains the on-screen candidate set; a scroll listener re-evaluates
  // continuously as the user scrolls within that set.
  const [activeIdx, setActiveIdx] = useState(0);
  // playingIdx lags activeIdx until scrolling settles — only the settled
  // centre tile is promoted to "playing". Prevents load-thrash mid-scroll
  // (iOS cold HLS attach ~1.3s vs. active-window ~400-800ms during scroll).
  const [playingIdx, setPlayingIdx] = useState(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SETTLE_MS = 80;
  const PLAY_IN = 0.5;
  const PLAY_OUT = 0.35;
  const HYSTERESIS = 0.1;
  const visibilityRef = useRef<Map<number, number>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardEls = useRef<Map<number, HTMLElement>>(new Map());

  // Debounce: promote activeIdx → playingIdx only after the centre has
  // held steady for SETTLE_MS. While scrolling, playingIdx stays put so
  // no tile is asked to play (frames still paint via the paused-first-frame
  // primitive on mounted neighbours).
  useEffect(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      setPlayingIdx(activeIdx);
    }, SETTLE_MS);
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, [activeIdx, posts]);

  // Warm the NEXT card's HLS into the `feed-next` lane so its manifest
  // + first segment are already in the CDN/hls cache when it becomes active.
  useEffect(() => {
    const next = posts[playingIdx + 1];
    const nextMedia = next?.mediaItems?.[0];
    if (next && nextMedia?.type === 'video' && (nextMedia as any).hlsUrl) {
      try {
        VideoEngine.preload('feed-next', {
          hlsUrl: (nextMedia as any).hlsUrl,
          posterUrl: (nextMedia as any).thumbnailUrl ?? null,
          postId: next.id,
        });
      } catch { /* engine may not be booted yet — safe to ignore */ }
    }
  }, [playingIdx, posts]);


  const recheckActive = useCallback(() => {
    // Platform-standard card-feed activation: eligible at >=PLAY_IN visible,
    // most-visible eligible card wins, asymmetric PLAY_OUT + hysteresis to
    // prevent boundary flicker.
    let bestIdx = -1;
    let bestRatio = 0;
    visibilityRef.current.forEach((ratio, idx) => {
      if (ratio > bestRatio) { bestRatio = ratio; bestIdx = idx; }
    });

    setActiveIdx((prev) => {
      const prevRatio = prev >= 0 ? (visibilityRef.current.get(prev) ?? 0) : 0;
      // Keep current active while it's still >=PLAY_OUT and no one clearly beats it.
      if (prev >= 0 && prevRatio >= PLAY_OUT && (bestRatio - prevRatio) < HYSTERESIS) return prev;
      // Switch only to a card that has cleared the play-in threshold.
      if (bestIdx >= 0 && bestRatio >= PLAY_IN) return bestIdx;
      // If nothing qualifies (between cards), keep last active if still barely visible.
      if (prev >= 0 && prevRatio >= PLAY_OUT) return prev;
      return bestIdx >= 0 && bestRatio >= PLAY_OUT ? bestIdx : prev;
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.cardIndex);
          if (Number.isNaN(idx)) continue;
          if (e.isIntersecting) {
            visibilityRef.current.set(idx, e.intersectionRatio);
          } else {
            visibilityRef.current.delete(idx);
          }


        }
        recheckActive();
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] },
    );
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
      visibilityRef.current.clear();
      cardEls.current.clear();
    };
  }, [recheckActive, posts]);

  // Re-evaluate on scroll — IntersectionObserver alone doesn't fire
  // continuously during scroll within the on-screen set.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        recheckActive();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [recheckActive]);

  // Virtuoso's rangeChanged kept as a no-op; center-proximity owns activeIdx.
  const handleRangeChanged = useCallback(
    (_r: { startIndex: number; endIndex: number }) => {},
    [],
  );



  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositionsByTab = useClubhouseStore((s) => s.carouselPositionsByTab);
  const globalCarouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const carouselPositions = tab ? (carouselPositionsByTab[tab] ?? globalCarouselPositions) : globalCarouselPositions;
  const openFullscreen = useFullscreenFeedStore((s) => s.open);
  const fsOpen = useFullscreenFeedStore((s) => s.isOpen);

  // Sync the active card to the global store so other consumers (top-bar
  // carousel chip, fullscreen handoff, etc.) stay in step. Routed to the
  // owning tab's slot so switching back retains the centred card.
  useEffect(() => {
    setActiveIndex(activeIdx, tab);
  }, [activeIdx, setActiveIndex, tab]);

  // Warm-start the next 1-2 upcoming videos so they play instantly on arrival.
  useEffect(() => {
    const PREFETCH_AHEAD = 2; // was 3 — keep concurrent decoders within iOS cap (3)
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const next = posts[activeIdx + i];
      if (!next) continue;
      const media = next.mediaItems?.[0];
      const hlsUrl = media?.hlsUrl;
    }
  }, [activeIdx, posts]);

  // Warm the first videos on feed mount so even the initial card isn't fully cold.
  useEffect(() => {
    if (!posts?.length) return;
    [0, 1].forEach((i) => {
      const hlsUrl = posts[i]?.mediaItems?.[0]?.hlsUrl;
    });
  }, [posts?.length]);

  // Tab warmer — fires on setActiveTab (from clubhouseStore) so tab-restore
  // pre-warms the active card's HLS first segment (manifest is already pooled;
  // this closes the cold-segment gap).
  const registerTabWarmer = useClubhouseStore((s) => s.registerTabWarmer);
  const activeIdxRef = useRef(activeIdx);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);
  const postsRef = useRef(posts);
  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => {
    if (!tab) return;
    registerTabWarmer(tab, () => {
      const idx = activeIdxRef.current;
      const hlsUrl = postsRef.current[idx]?.mediaItems?.[0]?.hlsUrl;
    });
    return () => { registerTabWarmer(tab, null); };
  }, [tab, registerTabWarmer]);

  const handleOpenMedia = useCallback(
    (
      post: FeedPost,
      mediaIndex: number,
      origin?: { el: HTMLElement | null; posterUrl?: string | null; handOffUrl?: string | null },
    ) => {
      const idx = posts.findIndex((p) => p.id === post.id);
      if (idx < 0) return;
      setActiveIndex(idx, tab);
      if (mediaIndex > 0) setCarouselPosition(idx, mediaIndex, tab);
      if (origin?.el) {
        openWithOrigin({
          posts,
          index: idx,
          originEl: origin.el,
          posterUrl: origin.posterUrl ?? null,
          handOffUrls: origin.handOffUrl ? [origin.handOffUrl] : undefined,
        });
      } else {
        openFullscreen(posts, idx);
      }
    },
    [posts, setActiveIndex, setCarouselPosition, openFullscreen, tab],
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
          if (idx >= 0) setCarouselPosition(idx, slide, tab);
        };
        cache.set(postId, fn);
      }
      return fn;
    },
    [posts, setCarouselPosition, tab],
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
      const isActive = !fsOpen && index === playingIdx; // PLAYS — settle-gated; suspended while fullscreen
      const isNear = !fsOpen && Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS; // mounts InlineVideo + host so it's in the DOM before activation
      const mountVideo = isNear;
      return (
        <div
          data-card-index={index}
          ref={(el) => {
            const obs = observerRef.current;
            if (el) {
              cardEls.current.set(index, el);
              if (obs) obs.observe(el);
            } else {
              cardEls.current.delete(index);
            }
          }}
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
            isActive={isActive}
            mountVideo={mountVideo}
            initialMediaIndex={initialSlide}
            onCarouselIndexChange={getCarouselChangeHandler(post.id)}
            onFollow={onFollow}
            currentUserId={currentUserId}
            feedIndex={index}
            isFirstCard={index === 0}
            onContentReady={onFirstContentReady}
          />
          {/* Subtle inter-card seam — just-perceptible lift above ink chrome */}
          <div aria-hidden style={{ height: 5, background: '#1E212B' }} />
        </div>
      );
    },
    [
      activeIdx,
      playingIdx,        // isActive keys off playingIdx; without this the
                         // settle-promoted play index never reaches the tiles
      fsOpen,            // recompute isActive/isNear when fullscreen opens/closes
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
      onFirstContentReady,
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






  // ── Pull-to-refresh ───────────────────────────────────────────────
  // Engages only when the real scroller (#root) is at top. Damped 0.5x,
  // capped at PTR_MAX_PULL. Releasing past PTR_THRESHOLD fires onRefresh.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pull, setPull] = useState(0);
  const pullRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const armedRef = useRef(false);
  const activelyPullingRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onRefresh) return;

    const getScrollTop = () => scrollerElRef.current?.scrollTop ?? 0;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
      armedRef.current = getScrollTop() <= 0;
      activelyPullingRef.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!armedRef.current || startYRef.current == null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy <= 0) {
        if (activelyPullingRef.current) {
          activelyPullingRef.current = false;
          pullRef.current = 0;
          setPull(0);
        }
        return;
      }
      // Only check scrollTop BEFORE we've engaged; once engaged we own the gesture.
      if (!activelyPullingRef.current && getScrollTop() > 0) {
        armedRef.current = false;
        return;
      }

      activelyPullingRef.current = true;
      const next = Math.min(dy * 0.5, PTR_MAX_PULL);
      pullRef.current = next;
      setPull(next);
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (activelyPullingRef.current && pullRef.current >= PTR_THRESHOLD && onRefresh) {
        // Snap to resting position and fire
        pullRef.current = PTR_THRESHOLD;
        setPull(PTR_THRESHOLD);
        
        Promise.resolve(onRefresh()).catch(() => {});
      } else {
        pullRef.current = 0;
        setPull(0);
      }
      activelyPullingRef.current = false;
      armedRef.current = false;
      startYRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart as any);
      el.removeEventListener('touchmove', onTouchMove as any);
      el.removeEventListener('touchend', onTouchEnd as any);
      el.removeEventListener('touchcancel', onTouchEnd as any);
    };
  }, [onRefresh, isRefreshing]);

  // When a refresh completes, retract the spinner.
  useEffect(() => {
    if (!isRefreshing && !activelyPullingRef.current) {
      pullRef.current = 0;
      setPull(0);
    }
  }, [isRefreshing]);

  const spinnerOffset = isRefreshing ? PTR_THRESHOLD : pull;
  const spinnerProgress = Math.min(pull / PTR_THRESHOLD, 1);
  const spinnerRotation = isRefreshing ? 0 : pull * 3;

  return (
    <div
      ref={containerRef}
      style={{
        background: CANVAS,
        height: '100dvh',
        width: '100%',
        position: 'relative',
        overscrollBehaviorY: 'contain',
      }}
      data-card-feed
    >
      {/* Pull-to-refresh spinner */}
      {onRefresh && (spinnerOffset > 0 || isRefreshing) && (
        <div
          aria-hidden={!isRefreshing}
          style={{
            position: 'absolute',
            top: `calc(env(safe-area-inset-top, 0px) + 59px)`,
            left: '50%',
            transform: `translate(-50%, ${spinnerOffset - 36}px)`,
            zIndex: 30,
            pointerEvents: 'none',
            transition: activelyPullingRef.current ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: isRefreshing ? 1 : Math.min(0.4 + spinnerProgress * 0.6, 1),
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: 'rgba(21,23,31,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.18)',
                borderTopColor: 'rgba(255,255,255,0.92)',
                transform: `rotate(${spinnerRotation}deg)`,
                animation: isRefreshing ? 'ptrSpin 0.8s linear infinite' : undefined,
              }}
            />
          </div>
          <style>{`@keyframes ptrSpin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
      <div
        style={{
          height: '100%',
          transform: `translateY(${isRefreshing ? PTR_THRESHOLD : pull}px)`,
          transition: activelyPullingRef.current ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        <Virtuoso
          ref={virtuosoRef}
          scrollerRef={(el) => {
            const node = (el as HTMLElement) ?? null;
            scrollerElRef.current = node;
            // Wire this scroller into the floating-nav scroll-direction store
            // so the pill condenses/expands as the feed scrolls. Virtuoso
            // owns its own inner scroll div — window never scrolls on this
            // route (PageRoot fixedHeight), so the auto-registered window
            // scroller receives no events.
            if (node) registerNavScroller(node);
          }}
          data={posts}
          itemContent={itemContent}
          computeItemKey={(_, post) => post.id}
          rangeChanged={handleRangeChanged}
          endReached={handleEndReached}
          increaseViewportBy={{ top: 400, bottom: 800 }}
          overscan={{ main: 400, reverse: 400 }}
          components={components}
          restoreStateFrom={initialState}
          initialScrollTop={restoreScrollTopRef.current ?? 0}
          initialTopMostItemIndex={initialState ? undefined : 0}
          style={{ height: '100%', width: '100%' }}
        />
      </div>

    </div>
  );
});

CardFeed.displayName = 'CardFeed';
