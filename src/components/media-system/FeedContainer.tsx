/**
 * FeedContainer — spring-physics-driven vertical feed.
 * Replaces CSS scroll-snap with translateY + spring animations for natural feel.
 * Includes pull-to-refresh, rubber-band edges, and fling detection.
 * Supports both touch (mobile) and mouse (desktop/preview) drag.
 *
 * Performance: During drag/spring, transforms are applied directly to the DOM
 * via refs (no React state updates per frame). State is synced only on settle.
 */
import { useState, useCallback, useEffect, useRef, useMemo, useContext } from 'react';
import { FeedItem } from './FeedItem';
import { PullToRefresh } from './PullToRefresh';
import { useMediaStore } from './store/mediaStore';
import { useMediaStoreCompat } from './store/useMediaStoreCompat';
import { MediaStoreContext } from './store/MediaStoreContext';
import { useVideoPoolContext } from './VideoPoolProvider';
import { flingSpring, SPRING_CONFIGS } from './utils/spring';
import { preloadByUrl } from './hooks/usePreloader';
import type { FeedPost } from './types/media';
import { haptic } from '@/utils/haptics';

const FLING_VELOCITY_THRESHOLD = 0.4;   // px/ms — above this = fling
const RUBBER_BAND_FACTOR = 0.35;
const PTR_THRESHOLD = 80;               // px of actual pull to trigger refresh
const PTR_RENDER_THRESHOLD = 10;        // px change to trigger PTR re-render
const RENDER_WINDOW = 5;                // DOM virtualization: render ±5 items around active

interface FeedContainerProps {
  posts: FeedPost[];
  initialIndex?: number;
  onNearEnd?: () => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  hasNextPage?: boolean;
  followOverrides?: Map<string, boolean>;
  onFollowChange?: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
  onLike?: (post: FeedPost) => void;
  onComment?: () => void;
  onShare?: (post: FeedPost) => void;
  getLikeState?: (post: FeedPost) => { isLiked: boolean; count: number };
  getCommentCount?: (post: FeedPost) => number;
}

export function FeedContainer({ posts, initialIndex = 0, onNearEnd, onRefresh, isRefreshing = false, hasNextPage = true, followOverrides, onFollowChange, onFirstFrameReady, onLike, onComment, onShare, getLikeState, getCommentCount }: FeedContainerProps) {
  const [itemHeight, setItemHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const startOffset = -(initialIndex) * (typeof window !== 'undefined' ? window.innerHeight : 800);

  const offsetRef = useRef(startOffset);
  const trackRef = useRef<HTMLDivElement>(null);
  const cancelSpring = useRef<(() => void) | null>(null);
  const activeIndexRef = useRef(initialIndex);
  const touchStartRef = useRef({ y: 0, time: 0, offsetY: 0 });
  const velocityTracker = useRef<{ y: number; time: number }[]>([]);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const lastRenderedPull = useRef(0);
  const isRefreshTriggered = useRef(false);

  const setActiveIndex = useMediaStoreCompat((s) => s.setActiveIndex);
  const storeActiveIndex = useMediaStoreCompat((s) => s.activeIndex);
  const scopedStore = useContext(MediaStoreContext);
  const pool = useVideoPoolContext();
  const prevPostsRef = useRef(posts);

  // Detect feed switch (posts array identity change)
  // Only reset to top when the feed is completely replaced (tab switch),
  // NOT when new pages are appended (infinite scroll).
  useEffect(() => {
    if (prevPostsRef.current !== posts && posts.length > 0) {
      const prevPosts = prevPostsRef.current;
      // An "append" is any update where the first post ID is unchanged.
      // This covers: new pages loaded (length grows) AND live feed refetches
      // (same length, new array reference). Only treat as a full feed switch
      // when the first post ID actually changes (genuine tab switch).
      const isAppend = prevPosts && prevPosts.length > 0 &&
        posts[0]?.id === prevPosts[0]?.id;
      
      if (!isAppend) {
        // Full feed switch (tab change) — reset to initialIndex (or 0)
        const startAt = initialIndex ?? 0;
        const newOffset = -startAt * itemHeight;
        offsetRef.current = newOffset;
        activeIndexRef.current = startAt;
        if (trackRef.current) {
          trackRef.current.style.transform = `translateY(${newOffset}px)`;
        }
        setActiveIndex(startAt);
      }
      // For appends, preserve current position — do nothing
    }
    prevPostsRef.current = posts;
  }, [posts, initialIndex, itemHeight, setActiveIndex]);

  // Jump to new index when initialIndex changes while already mounted
  // (handles pool-persistent fullscreen reopens with different startIndex)
  const prevInitialIndexRef = useRef(initialIndex);
  useEffect(() => {
    if (initialIndex === prevInitialIndexRef.current) return;
    prevInitialIndexRef.current = initialIndex;

    const newOffset = -initialIndex * itemHeight;
    offsetRef.current = newOffset;
    activeIndexRef.current = initialIndex;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateY(${newOffset}px)`;
    }
    setActiveIndex(initialIndex);
  }, [initialIndex, itemHeight, setActiveIndex]);

  // Resize handling
  useEffect(() => {
    const onResize = () => setItemHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Recalculate offset when itemHeight changes (e.g. rotation)
  useEffect(() => {
    const newOffset = -activeIndexRef.current * itemHeight;
    offsetRef.current = newOffset;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateY(${newOffset}px)`;
    }
  }, [itemHeight]);

  // iOS gesture priming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchEnd = () => {
      const storeState = scopedStore ? scopedStore.getState() : useMediaStore.getState();
      if (storeState.userPaused) return;
      const currentActiveIndex = storeState.activeIndex;
      const activePost = posts[currentActiveIndex];
      if (!activePost) return;
      const activeUrl = activePost.mediaItems?.[0]?.hlsUrl;
      if (!activeUrl) return;
      const video = pool.getElement(activeUrl);
      if (video && video.paused) {
        // Register playing listener before play() for iOS gesture priming
        const onPlaying = () => {
          video.removeEventListener('playing', onPlaying);
        };
        video.addEventListener('playing', onPlaying, { once: true });
        video.play().catch(() => {
          video.removeEventListener('playing', onPlaying);
        });
      }
    };

    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => el.removeEventListener('touchend', onTouchEnd);
  }, [posts, pool]);

  // ── Fix 10: prefers-reduced-motion ──
  const prefersReducedMotion = useMemo(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // ── Navigate to index ──
  const goToIndex = useCallback((index: number, velocity: number = 0) => {
    const clamped = Math.max(0, Math.min(posts.length - 1, index));
    const targetY = -clamped * itemHeight;

    cancelSpring.current?.();
    pullDistanceRef.current = 0;
    lastRenderedPull.current = 0;
    setPullDistance(0);

    // ── FIX 2: Start preloading target IMMEDIATELY (before spring) ──
    if (clamped !== activeIndexRef.current) {
      const targetPost = posts[clamped];
      const targetUrl = targetPost?.mediaItems[0]?.hlsUrl;
      preloadByUrl(targetUrl);
    }

    // Instant snap for reduced-motion users
    if (prefersReducedMotion) {
      offsetRef.current = targetY;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateY(${targetY}px)`;
      }
      // offsetY state removed — transform is DOM-only via trackRef
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      const gs = scopedStore ? scopedStore.getState() : useMediaStore.getState();
      gs.setCarouselPosition(clamped, 0);
      if (clamped >= posts.length - 3 && posts.length > 0) {
        onNearEnd?.();
      }
      return;
    }

    const config = Math.abs(velocity) > FLING_VELOCITY_THRESHOLD
      ? SPRING_CONFIGS.fling
      : SPRING_CONFIGS.snap;

    cancelSpring.current = flingSpring(
      offsetRef.current,
      targetY,
      velocity * 1000,
      config,
      (value) => {
        offsetRef.current = value;
        if (trackRef.current) {
          trackRef.current.style.transform = `translateY(${value}px)`;
        }
      },
      () => {
        offsetRef.current = targetY;
        setOffsetY(targetY);
        const prevIdx = activeIndexRef.current;
        activeIndexRef.current = clamped;
        setActiveIndex(clamped);
        const gs2 = scopedStore ? scopedStore.getState() : useMediaStore.getState();
        gs2.setCarouselPosition(clamped, 0);
        haptic('light');

        if (clamped >= posts.length - 3 && posts.length > 0) {
          onNearEnd?.();
        }
      }
    );
  }, [posts, itemHeight, setActiveIndex, onNearEnd, prefersReducedMotion]);

  // ── Velocity from tracker ──
  const calculateVelocity = (): number => {
    const samples = velocityTracker.current;
    if (samples.length < 2) return 0;
    const last = samples[samples.length - 1];
    const prev = samples[Math.max(0, samples.length - 3)];
    const dt = last.time - prev.time;
    if (dt === 0) return 0;
    return (last.y - prev.y) / dt;
  };

  // ── Shared drag logic (touch + mouse) ──
  const startDrag = useCallback((clientY: number) => {
    cancelSpring.current?.();
    isDragging.current = true;
    isRefreshTriggered.current = false;
    touchStartRef.current = { y: clientY, time: Date.now(), offsetY: offsetRef.current };
    velocityTracker.current = [{ y: clientY, time: Date.now() }];
  }, []);

  const moveDrag = useCallback((clientY: number) => {
    if (!isDragging.current) return;

    const deltaY = clientY - touchStartRef.current.y;
    const currentIndex = activeIndexRef.current;
    const maxOffset = 0;
    const minOffset = -(posts.length - 1) * itemHeight;
    let newOffset = touchStartRef.current.offsetY + deltaY;

    // Rubber-band at edges
    if (newOffset > maxOffset) {
      const overscroll = newOffset - maxOffset;
      newOffset = maxOffset + overscroll * RUBBER_BAND_FACTOR;

      if (currentIndex === 0 && onRefresh) {
        const actualPull = overscroll * RUBBER_BAND_FACTOR;
        pullDistanceRef.current = actualPull;

        if (Math.abs(actualPull - lastRenderedPull.current) > PTR_RENDER_THRESHOLD || actualPull === 0) {
          lastRenderedPull.current = actualPull;
          setPullDistance(actualPull);
        }

        if (actualPull >= PTR_THRESHOLD && !isRefreshTriggered.current) {
          isRefreshTriggered.current = true;
          haptic('medium');
        } else if (actualPull < PTR_THRESHOLD) {
          isRefreshTriggered.current = false;
        }
      }
    } else if (newOffset < minOffset) {
      const overscroll = minOffset - newOffset;
      newOffset = minOffset - overscroll * RUBBER_BAND_FACTOR;
    } else {
      if (pullDistanceRef.current !== 0) {
        pullDistanceRef.current = 0;
        lastRenderedPull.current = 0;
        setPullDistance(0);
      }
    }

    offsetRef.current = newOffset;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateY(${newOffset}px)`;
    }

    velocityTracker.current.push({ y: clientY, time: Date.now() });
    if (velocityTracker.current.length > 5) velocityTracker.current.shift();
  }, [posts.length, itemHeight, onRefresh]);

  const endDrag = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const velocity = calculateVelocity();
    const currentIndex = activeIndexRef.current;

    if (currentIndex === 0 && pullDistanceRef.current >= PTR_THRESHOLD && onRefresh && !isRefreshing) {
      onRefresh();
    }

    let targetIndex = currentIndex;

    if (Math.abs(velocity) > FLING_VELOCITY_THRESHOLD) {
      if (velocity < 0 && currentIndex < posts.length - 1) {
        targetIndex = currentIndex + 1;
      } else if (velocity > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      }
    } else {
      targetIndex = Math.round(-offsetRef.current / itemHeight);
      targetIndex = Math.max(0, Math.min(posts.length - 1, targetIndex));
    }

    setPullDistance(0);
    pullDistanceRef.current = 0;
    lastRenderedPull.current = 0;
    goToIndex(targetIndex, velocity);
  }, [posts.length, itemHeight, onRefresh, isRefreshing, goToIndex]);

  // ── Touch handlers ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startDrag(touch.clientY);
  }, [startDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    moveDrag(touch.clientY);
  }, [moveDrag]);

  const handleTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // ── Mouse handlers (desktop/preview support) ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientY);
  }, [startDrag]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    moveDrag(e.clientY);
  }, [moveDrag]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    endDrag();
  }, [endDrag]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging.current) endDrag();
  }, [endDrag]);

  // Cancel spring animation on unmount to prevent RAF loop on unmounted component
  useEffect(() => {
    return () => {
      cancelSpring.current?.();
      cancelSpring.current = null;
    };
  }, []);

  // When refresh completes, spring back
  useEffect(() => {
    if (!isRefreshing && pullDistance > 0) {
      setPullDistance(0);
      pullDistanceRef.current = 0;
      lastRenderedPull.current = 0;
    }
  }, [isRefreshing]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[100dvh] overflow-hidden bg-black relative"
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {onRefresh && (
        <PullToRefresh
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          threshold={PTR_THRESHOLD}
        />
      )}

      <div
        ref={trackRef}
        style={{
          transform: `translateY(${offsetY}px)`,
          willChange: 'transform',
        }}
      >
        {posts.map((post, index) => {
          const distance = Math.abs(index - storeActiveIndex);
          
          // DOM virtualization: only render FeedItems within ±5 of active
          if (distance > RENDER_WINDOW) {
            return (
              <div
                key={post.id}
                style={{ height: '100dvh', flexShrink: 0 }}
              />
            );
          }
          
          return (
            <FeedItem
              key={post.id}
              post={post}
              index={index}
              isActive={index === storeActiveIndex}
              isLastItem={index === posts.length - 1}
              hasNextPage={hasNextPage}
              followOverride={followOverrides?.get(post.userId)}
              onFollowChange={onFollowChange}
              onFirstFrameReady={index === 0 ? onFirstFrameReady : undefined}
              onLike={onLike}
              onComment={onComment}
              onShare={onShare}
              getLikeState={getLikeState}
              getCommentCount={getCommentCount}
            />
          );
        })}
      </div>
    </div>
  );
}