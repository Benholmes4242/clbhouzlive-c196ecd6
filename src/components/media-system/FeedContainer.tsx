/**
 * FeedContainer — spring-physics-driven vertical feed.
 * Replaces CSS scroll-snap with translateY + spring animations for natural feel.
 * Includes pull-to-refresh, rubber-band edges, and fling detection.
 * Supports both touch (mobile) and mouse (desktop/preview) drag.
 *
 * Performance: During drag/spring, transforms are applied directly to the DOM
 * via refs (no React state updates per frame). State is synced only on settle.
 */
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { FeedItem } from './FeedItem';
import { PullToRefresh } from './PullToRefresh';
import { useMediaStore } from './store/mediaStore';
import { useVideoPoolContext } from './VideoPoolProvider';
import { flingSpring, SPRING_CONFIGS } from './utils/spring';
import type { FeedPost } from './types/media';
import { haptic } from '@/utils/haptics';

const FLING_VELOCITY_THRESHOLD = 0.4;   // px/ms — above this = fling
const RUBBER_BAND_FACTOR = 0.35;
const PTR_THRESHOLD = 80;               // px of actual pull to trigger refresh
const PTR_RENDER_THRESHOLD = 10;        // px change to trigger PTR re-render

interface FeedContainerProps {
  posts: FeedPost[];
  onNearEnd?: () => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  hasNextPage?: boolean;
  followOverrides?: Map<string, boolean>;
  onFollowChange?: (userId: string, isFollowed: boolean) => void;
  onFirstFrameReady?: () => void;
}

export function FeedContainer({ posts, onNearEnd, onRefresh, isRefreshing = false, hasNextPage = true, followOverrides, onFollowChange, onFirstFrameReady }: FeedContainerProps) {
  const [itemHeight, setItemHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [offsetY, setOffsetY] = useState(0);

  const offsetRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const cancelSpring = useRef<(() => void) | null>(null);
  const activeIndexRef = useRef(0);
  const touchStartRef = useRef({ y: 0, time: 0, offsetY: 0 });
  const velocityTracker = useRef<{ y: number; time: number }[]>([]);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const lastRenderedPull = useRef(0);
  const isRefreshTriggered = useRef(false);

  const setActiveIndex = useMediaStore((s) => s.setActiveIndex);
  const storeActiveIndex = useMediaStore((s) => s.activeIndex);
  const pool = useVideoPoolContext();

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
    setOffsetY(newOffset);
    if (trackRef.current) {
      trackRef.current.style.transform = `translateY(${newOffset}px)`;
    }
  }, [itemHeight]);

  // iOS gesture priming
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchEnd = () => {
      if (useMediaStore.getState().userPaused) return;
      const currentActiveIndex = useMediaStore.getState().activeIndex;
      const activePost = posts[currentActiveIndex];
      if (!activePost) return;
      const activeUrl = activePost.mediaItems?.[0]?.hlsUrl;
      if (!activeUrl) return;
      const video = pool.getElement(activeUrl);
      if (video && video.paused) {
        video.play().catch(() => {});
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

    // Instant snap for reduced-motion users
    if (prefersReducedMotion) {
      offsetRef.current = targetY;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateY(${targetY}px)`;
      }
      setOffsetY(targetY);
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);
      useMediaStore.getState().setCarouselPosition(clamped, 0);
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
        activeIndexRef.current = clamped;
        setActiveIndex(clamped);
        useMediaStore.getState().setCarouselPosition(clamped, 0);
        haptic('light');

        if (clamped >= posts.length - 3 && posts.length > 0) {
          onNearEnd?.();
        }
      }
    );
  }, [posts.length, itemHeight, setActiveIndex, onNearEnd, prefersReducedMotion]);

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
        {posts.map((post, index) => (
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
          />
        ))}
      </div>
    </div>
  );
}
