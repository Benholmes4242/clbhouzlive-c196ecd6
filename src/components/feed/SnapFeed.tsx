import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { FeedSlide } from './FeedSlide';
import type { FeedPost } from '@/components/media-system/types/media';
import { haptic } from '@/utils/haptics';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { registerInPool } from '@/utils/hlsPoolPreloader';
import { pauseAllAudio } from '@/utils/globalVideoMute';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWatchProgressTracker } from '@/components/watch/hooks/useWatchProgressTracker';


const NEAR_END_THRESHOLD = 3;
const ACTIVE_SLIDE_RATIO = 0.5;
const INTERSECTION_THRESHOLDS = [0.5];
const PTR_DISTANCE = 80;
const VIRTUAL_WINDOW = 3; // render activeIndex ± 3 slides

interface SnapFeedProps {
  posts: FeedPost[];
  activeTab: string;
  onNearEnd: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  hasNextPage: boolean;
  followOverrides: Map<string, boolean>;
  onFollowChange: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
  onLike?: (post: FeedPost) => void;
  onComment?: () => void;
  onShare?: (post: FeedPost) => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
  startIndex?: number;
  onActiveIndexChange?: (idx: number) => void;
  activeIndexOverride?: number;
  /** Forwarded to FeedSlide so fullscreen hosts (FullscreenFeedOverlay, CourseMediaViewer) can suppress the inline top-right dots in favour of the segmented FullscreenCarouselOverlay. */
  isFullscreen?: boolean;
}

export function SnapFeed({
  posts, activeTab, onNearEnd, onRefresh, isRefreshing, hasNextPage,
  followOverrides, onFollowChange, onFirstFrameReady,
  onLike, onComment, onShare, getLikeState, getCommentCount,
  startIndex,
  onActiveIndexChange,
  activeIndexOverride,
  isFullscreen,
}: SnapFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const firstFrameFired = useRef(false);
  const ptrStartY = useRef(0);
  const ptrActive = useRef(false);
  const hasScrolledToStart = useRef(false);
  const [anySlideZoomed, setAnySlideZoomed] = useState(false);

  // ── Stable refs for observer callback (avoid reconnecting observer) ──
  const postsRef = useRef(posts);
  const postsLengthRef = useRef(posts.length);
  const hasNextPageRef = useRef(hasNextPage);
  const onNearEndRef = useRef(onNearEnd);
  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  const pendingIndexRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { postsRef.current = posts; }, [posts]);
  useEffect(() => { postsLengthRef.current = posts.length; }, [posts.length]);
  useEffect(() => { hasNextPageRef.current = hasNextPage; }, [hasNextPage]);
  useEffect(() => { onNearEndRef.current = onNearEnd; }, [onNearEnd]);
  useEffect(() => { onActiveIndexChangeRef.current = onActiveIndexChange; }, [onActiveIndexChange]);

  // Scroll to startIndex on first mount only — retry until container has layout
  useEffect(() => {
    if (hasScrolledToStart.current) return;
    if (!startIndex || startIndex === 0) return;
    const container = containerRef.current;
    if (!container) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    const tryScroll = () => {
      const slideHeight = container.clientHeight;
      if (slideHeight === 0 && attempts < MAX_ATTEMPTS) {
        attempts++;
        requestAnimationFrame(tryScroll);
        return;
      }
      const resolvedHeight = slideHeight > 0 ? slideHeight : window.innerHeight;
      container.scrollTo({
        top: resolvedHeight * startIndex,
        behavior: 'instant' as ScrollBehavior,
      });
      hasScrolledToStart.current = true;
    };

    requestAnimationFrame(tryScroll);
  }, [startIndex]);

  const storeActiveIndex = useClubhouseStore(s => s.activeIndex);
  const setActiveIndex = useClubhouseStore(s => s.setActiveIndex);
  // When an override is supplied (e.g. by FullscreenFeedOverlay which owns its
  // own active-index store), it is the source of truth for both rendering AND
  // virtualization window math. Previously SnapFeed used storeActiveIndex for
  // window math even when overridden — which left off-window slides as black
  // placeholders when the overlay opened at index ≥ VIRTUAL_WINDOW (4+).
  const activeIndex = activeIndexOverride ?? storeActiveIndex;
  const location = useLocation();

  // Pause all audio when route changes away
  useEffect(() => {
    pauseAllAudio();
  }, [location.pathname]);

  // Watch-progress tracking — populates user_content_preferences with
  // watched_partial / watched_complete signals for whichever surface is
  // hosting this SnapFeed (Clubhouse Suggested inline, fullscreen overlay,
  // course media viewer). Container-scoped so stacked SnapFeeds don't
  // cross-target each other's <video> elements.
  const { session } = useSupabaseSession();
  const trackerUserId = session?.user?.id;
  const getTrackerContainer = useCallback(() => containerRef.current, []);
  useWatchProgressTracker({
    userId: trackerUserId,
    activeIndex,
    posts,
    getContainer: getTrackerContainer,
  });

  // ── IntersectionObserver setup ──
  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      let bestEntry: IntersectionObserverEntry | null = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
          bestEntry = entry;
        }
      }

      if (bestEntry && bestEntry.intersectionRatio >= ACTIVE_SLIDE_RATIO) {
        const idx = Number((bestEntry.target as HTMLElement).dataset.index);
        if (!isNaN(idx)) {
          const nextPosts = [
            postsRef.current[idx + 1],
            postsRef.current[idx + 2],
          ];
          nextPosts.forEach(post => {
            const hlsUrl = post?.mediaItems?.[0]?.hlsUrl;
            if (hlsUrl) {
              preloadHlsManifest(hlsUrl)
                .then(() => registerInPool(hlsUrl))
                .catch(() => {});
            }
          });
          
          pendingIndexRef.current = idx;
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            if (pendingIndexRef.current !== null) {
              // Guard against end-card setting index beyond posts array
              const safeIdx = Math.min(pendingIndexRef.current, postsLengthRef.current - 1);
              if (safeIdx < 0) return;
              if (onActiveIndexChangeRef.current) {
                onActiveIndexChangeRef.current(safeIdx);
              } else {
                setActiveIndex(safeIdx);
              }
              if (hasNextPageRef.current && safeIdx >= postsLengthRef.current - NEAR_END_THRESHOLD) {
                onNearEndRef.current();
              }
              pendingIndexRef.current = null;
            }
          }, 80);
        }
      }
    }, { threshold: INTERSECTION_THRESHOLDS });

    slideRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [setActiveIndex]);

  // ── Register/unregister slide refs ──
  const setSlideRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (el) {
      slideRefs.current.set(idx, el);
      observerRef.current?.observe(el);
    } else {
      const old = slideRefs.current.get(idx);
      if (old) observerRef.current?.unobserve(old);
      slideRefs.current.delete(idx);
    }
  }, []);

  // ── Scroll to top when tab changes ──
  const prevTab = useRef(activeTab);
  useEffect(() => {
    if (prevTab.current !== activeTab) {
      containerRef.current?.scrollTo({ top: 0, behavior: 'instant' as any });
      prevTab.current = activeTab;
    }
  }, [activeTab]);

  // ── Pull-to-refresh ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current;
    if (!el || el.scrollTop > 5) return;
    ptrStartY.current = e.touches[0].clientY;
    ptrActive.current = true;
  }, []);

  const handleTouchEnd = useCallback(async (e: React.TouchEvent) => {
    if (!ptrActive.current) return;
    ptrActive.current = false;
    const delta = e.changedTouches[0].clientY - ptrStartY.current;
    if (delta > PTR_DISTANCE && !isRefreshing) {
      haptic('medium');
      await onRefresh();
    }
  }, [isRefreshing, onRefresh]);

  // ── First frame signal ──
  const handleFirstFrame = useCallback(() => {
    if (!firstFrameFired.current) {
      firstFrameFired.current = true;
      onFirstFrameReady?.();
    }
  }, [onFirstFrameReady]);

  // ── Zoom change handler from child slides ──
  const handleZoomChange = useCallback((isZoomed: boolean) => {
    setAnySlideZoomed(isZoomed);
  }, []);

  // ── scrollend safety fallback (fires once after snap settles) ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScrollEnd = () => {
      const slideHeight = el.clientHeight;
      if (slideHeight === 0) return;
      const idx = Math.round(el.scrollTop / slideHeight);
      const safeIdx = Math.min(idx, postsLengthRef.current - 1);
      if (safeIdx < 0) return;
      if (onActiveIndexChangeRef.current) {
        onActiveIndexChangeRef.current(safeIdx);
      } else {
        setActiveIndex(safeIdx);
      }
    };

    el.addEventListener('scrollend', onScrollEnd, { passive: true });
    return () => el.removeEventListener('scrollend', onScrollEnd);
  }, [setActiveIndex]);

  // ── Prefetch next 2 HLS manifests ──
  useEffect(() => {
    const next = postsRef.current.slice(activeIndex + 1, activeIndex + 3);
    next.forEach(post => {
      const url = post.mediaItems?.[0]?.hlsUrl;
      if (url) {
        preloadHlsManifest(url).catch(() => {});
      }
    });
  }, [activeIndex]);

  // ── Editorial card sentinel observer ──
  const setIsTournamentCardActive = useClubhouseStore(s => s.setIsTournamentCardActive);

  // Stable key that changes only when editorial cards enter/leave/reorder.
  // Avoids re-binding the observer on every like/comment update.
  const editorialCardKey = useMemo(
    () => posts
      .filter(p =>
        p.postType === 'pga_card' ||
        p.postType === 'tournament_result' ||
        p.postType === 'course_of_week_card'
      )
      .map(p => p.id)
      .join('|'),
    [posts]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const visibleSet = new Set<Element>();
    const observedSet = new Set<Element>();

    const syncSentinelVisibility = (sentinel: Element) => {
      const rect = sentinel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;

      if (ratio >= 0.85) {
        visibleSet.add(sentinel);
      } else {
        visibleSet.delete(sentinel);
      }
    };

    const publishVisibility = () => {
      setIsTournamentCardActive(visibleSet.size > 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.85) {
            visibleSet.add(entry.target);
          } else {
            visibleSet.delete(entry.target);
          }
        }
        publishVisibility();
      },
      { root: container, threshold: [0, 0.85] }
    );

    // Reconcile observer attachments without forcing layout on existing sentinels.
    // IO will fire within a frame for newly-attached targets with the correct state.
    const reconcileSentinels = () => {
      const sentinels = Array.from(container.querySelectorAll("[data-pga-sentinel='true']"));
      const currentSet = new Set<Element>(sentinels);

      observedSet.forEach((sentinel) => {
        if (!currentSet.has(sentinel)) {
          observer.unobserve(sentinel);
          observedSet.delete(sentinel);
          visibleSet.delete(sentinel);
        }
      });

      sentinels.forEach((sentinel) => {
        if (!observedSet.has(sentinel)) {
          observedSet.add(sentinel);
          observer.observe(sentinel);
          // No syncSentinelVisibility here — let IO publish the correct state.
        }
      });

      if (sentinels.length === 0) {
        visibleSet.clear();
        publishVisibility();
      }
    };

    // Initial seed — synchronous measurement to kill first-mount / return-to-page flash.
    const initialSentinels = Array.from(container.querySelectorAll("[data-pga-sentinel='true']"));
    initialSentinels.forEach((sentinel) => {
      observedSet.add(sentinel);
      observer.observe(sentinel);
      syncSentinelVisibility(sentinel);
    });
    publishVisibility();

    // SnapFeed virtualizes slides, so editorial sentinels mount later as the user
    // scrolls into the active window. Watch direct child mount/unmount on the
    // scroll container (subtree:false avoids reacting to descendant noise like
    // like animations or video buffer mutations) and coalesce per frame.
    let rafId: number | null = null;
    const mutationObserver = new MutationObserver(() => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        reconcileSentinels();
      });
    });

    mutationObserver.observe(container, { childList: true, subtree: false });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [editorialCardKey, setIsTournamentCardActive]);

  // Dev-only invariant: SnapFeed keys slides by post.id. Callers MUST pass a
  // grouped-by-post array (apply groupMultiMedia upstream). If a duplicate id
  // surfaces, surface it loudly so the buggy pipeline is fixed at its source
  // rather than silently dropping media via a defensive dedup here.
  if (process.env.NODE_ENV !== 'production') {
    const ids = posts.map(p => p.id);
    if (new Set(ids).size !== ids.length) {
      // eslint-disable-next-line no-console
      console.error(
        '[SnapFeed] Ungrouped posts array received — caller must apply groupMultiMedia() before open(). Duplicate ids:',
        ids,
      );
    }
  }

  return (
    <div
      ref={containerRef}
      data-snap-feed
      className="absolute inset-0 overflow-y-auto"
      style={{
        scrollSnapType: anySlideZoomed ? 'none' : 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {posts.map((post, idx) => {
        const distance = Math.abs(idx - activeIndex);
        const isInWindow = distance <= VIRTUAL_WINDOW;

        if (!isInWindow) {
          return (
            <div
              key={post.id}
              ref={(el) => setSlideRef(idx, el)}
              data-index={idx}
              className="relative w-full flex-shrink-0"
              style={{
                height: '100dvh',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
                background: '#000',
              }}
            />
          );
        }

        return (
          <FeedSlide
            key={post.id}
            post={post}
            index={idx}
            setRef={(el) => setSlideRef(idx, el)}
            activeTab={activeTab}
            followOverrides={followOverrides}
            onFollowChange={onFollowChange}
            onFirstFrameReady={idx === 0 ? handleFirstFrame : undefined}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            getLikeState={getLikeState}
            getCommentCount={getCommentCount}
            onZoomChange={handleZoomChange}
            activeIndexOverride={activeIndexOverride}
            isFullscreen={isFullscreen}
          />
        );
      })}

      {!hasNextPage && posts.length > 0 && (
        <div
          data-index={posts.length}
          className="w-full flex-shrink-0 flex flex-col items-center justify-center bg-background"
          style={{
            height: '100dvh',
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always',
          }}
        >
          <div className="flex flex-col items-center gap-4 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-3xl">⛳</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">
                You've seen it all
              </h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up. Check back later for new posts.
              </p>
            </div>
            <button
              onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-2 px-6 py-2.5 rounded-full bg-foreground text-background text-sm font-semibold active:scale-[0.97] transition-all"
            >
              Back to top
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapFeed;
