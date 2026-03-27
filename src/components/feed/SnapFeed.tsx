import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { FeedSlide } from './FeedSlide';
import type { FeedPost } from '@/components/media-system/types/media';
import { haptic } from '@/utils/haptics';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { registerInPool } from '@/utils/hlsPoolPreloader';
import { pauseAllAudio } from '@/utils/globalVideoMute';


const NEAR_END_THRESHOLD = 3;
const ACTIVE_SLIDE_RATIO = 0.5;
const INTERSECTION_THRESHOLDS = [0.5];
const PTR_DISTANCE = 80;

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
}

export function SnapFeed({
  posts, activeTab, onNearEnd, onRefresh, isRefreshing, hasNextPage,
  followOverrides, onFollowChange, onFirstFrameReady,
  onLike, onComment, onShare, getLikeState, getCommentCount,
  startIndex,
  onActiveIndexChange,
  activeIndexOverride,
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

  // Scroll to startIndex on first mount only
  useEffect(() => {
    if (hasScrolledToStart.current) return;
    if (!startIndex || startIndex === 0) return;
    const container = containerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      const slideHeight = container.clientHeight;
      container.scrollTo({ top: slideHeight * startIndex, behavior: 'instant' as ScrollBehavior });
      hasScrolledToStart.current = true;
    });
  }, [startIndex]);

  const activeIndex = useClubhouseStore(s => s.activeIndex);
  const setActiveIndex = useClubhouseStore(s => s.setActiveIndex);
  const location = useLocation();

  // Pause all audio when route changes away
  useEffect(() => {
    pauseAllAudio();
  }, [location.pathname]);

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
              setActiveIndex(pendingIndexRef.current);
              if (hasNextPageRef.current && pendingIndexRef.current >= postsLengthRef.current - NEAR_END_THRESHOLD) {
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
      setActiveIndex(idx);
    };

    el.addEventListener('scrollend', onScrollEnd, { passive: true });
    return () => el.removeEventListener('scrollend', onScrollEnd);
  }, [setActiveIndex]);

  // ── Prefetch next 2 HLS manifests ──
  useEffect(() => {
    const next = posts.slice(activeIndex + 1, activeIndex + 3);
    next.forEach(post => {
      const url = post.mediaItems?.[0]?.hlsUrl;
      if (url) {
        preloadHlsManifest(url).catch(() => {});
      }
    });
  }, [activeIndex, posts]);

  // ── PGA card sentinel observer ──
  const setIsTournamentCardActive = useClubhouseStore(s => s.setIsTournamentCardActive);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const sentinel = container.querySelector("[data-pga-sentinel='true']") as HTMLElement | null;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsTournamentCardActive(entry.isIntersecting && entry.intersectionRatio >= 0.85);
      },
      { root: container, threshold: [0, 0.85] }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [setIsTournamentCardActive, posts]);

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
      <style>{`::-webkit-scrollbar { display: none; }`}</style>
      {posts.map((post, idx) => (
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
        />
      ))}

      {!hasNextPage && posts.length > 0 && (
        <div
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
