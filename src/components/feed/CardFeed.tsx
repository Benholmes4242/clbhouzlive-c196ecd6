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
import type { ActiveActor } from '@/types/actor';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { prefetchTile } from '@/hooks/useTileVideoPlayer';
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
  /**
   * When true, the feed uses the window/parent scroller instead of its
   * own 100dvh container. Use this when embedding CardFeed inside a page
   * that already owns the scroll (e.g. the profile Posts tab).
   */
  useWindowScroll?: boolean;
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
  useWindowScroll = false,
}) => {

  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

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
  const SETTLE_MS = 150;
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
  }, [activeIdx]);

  const recheckActive = useCallback(() => {
    const viewportCenter = window.innerHeight / 2;
    let bestIdx = -1;
    let bestDist = Infinity;

    visibilityRef.current.forEach((_ratio, idx) => {
      const el = cardEls.current.get(idx);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cardCenter = r.top + r.height / 2;
      const dist = Math.abs(cardCenter - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    if (bestIdx >= 0) {
      setActiveIdx((prev) => {
        if (prev === bestIdx) return prev;
        const prevEl = cardEls.current.get(prev);
        if (prevEl) {
          const pr = prevEl.getBoundingClientRect();
          const prevDist = Math.abs((pr.top + pr.height / 2) - viewportCenter);
          // Hysteresis: require new card to be ≥40px closer to center.
          if (prevDist - bestDist < 40) return prev;
        }
        return bestIdx;
      });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const idx = Number((e.target as HTMLElement).dataset.cardIndex);
          if (Number.isNaN(idx)) continue;
          if (e.isIntersecting) visibilityRef.current.set(idx, e.intersectionRatio);
          else visibilityRef.current.delete(idx);
        }
        recheckActive();
      },
      { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1.0] },
    );
    observerRef.current = observer;
    return () => {
      observer.disconnect();
      observerRef.current = null;
      visibilityRef.current.clear();
      cardEls.current.clear();
    };
  }, [recheckActive]);

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
    (_: { startIndex: number; endIndex: number }) => {},
    [],
  );

  const setActiveIndex = useClubhouseStore((s) => s.setActiveIndex);
  const setCarouselPosition = useClubhouseStore((s) => s.setCarouselPosition);
  const carouselPositions = useClubhouseStore((s) => s.carouselPositions);
  const openFullscreen = useFullscreenFeedStore((s) => s.open);
  const fsOpen = useFullscreenFeedStore((s) => s.isOpen);

  // Sync the active card to the global store so other consumers (top-bar
  // carousel chip, fullscreen handoff, etc.) stay in step.
  useEffect(() => {
    setActiveIndex(activeIdx);
  }, [activeIdx, setActiveIndex]);

  // Warm-start the next 1-2 upcoming videos so they play instantly on arrival.
  useEffect(() => {
    const PREFETCH_AHEAD = 2; // was 3 — keep concurrent decoders within iOS cap (3)
    for (let i = 1; i <= PREFETCH_AHEAD; i++) {
      const next = posts[activeIdx + i];
      if (!next) continue;
      const media = next.mediaItems?.[0];
      const hlsUrl = media?.hlsUrl;
      if (hlsUrl) prefetchTile(hlsUrl);
    }
  }, [activeIdx, posts]);

  // Warm the first videos on feed mount so even the initial card isn't fully cold.
  useEffect(() => {
    if (!posts?.length) return;
    [0, 1].forEach((i) => {
      const hlsUrl = posts[i]?.mediaItems?.[0]?.hlsUrl;
      if (hlsUrl) prefetchTile(hlsUrl);
    });
  }, [posts?.length]);

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
      const isActive = !fsOpen && index === playingIdx; // PLAYS — settle-gated; suspended while fullscreen
      const isNear = !fsOpen && Math.abs(index - activeIdx) <= VIDEO_NEIGHBOUR_RADIUS; // mounts + paints frame — instant; suspended while fullscreen
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

  if (useWindowScroll) {
    return (
      <div style={{ width: '100%', background: CANVAS }} data-card-feed>
        <Virtuoso
          ref={virtuosoRef}
          useWindowScroll
          data={posts}
          itemContent={itemContent}
          computeItemKey={(_, post) => post.id}
          rangeChanged={handleRangeChanged}
          endReached={handleEndReached}
          increaseViewportBy={{ top: 400, bottom: 800 }}
          overscan={{ main: 400, reverse: 400 }}
          components={components}
        />
      </div>
    );
  }

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
