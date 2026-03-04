/**
 * FeedContainer — spring-physics-driven vertical feed.
 * Replaces CSS scroll-snap with translateY + spring animations for natural feel.
 * Includes pull-to-refresh, rubber-band edges, and fling detection.
 */
import { useState, useCallback, useEffect, useRef } from 'react';
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

interface FeedContainerProps {
  posts: FeedPost[];
  onNearEnd?: () => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
  hasNextPage?: boolean;
}

export function FeedContainer({ posts, onNearEnd, onRefresh, isRefreshing = false, hasNextPage = true }: FeedContainerProps) {
  const [itemHeight, setItemHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const [offsetY, setOffsetY] = useState(0);

  const cancelSpring = useRef<(() => void) | null>(null);
  const activeIndexRef = useRef(0);
  const touchStartRef = useRef({ y: 0, time: 0, offsetY: 0 });
  const velocityTracker = useRef<{ y: number; time: number }[]>([]);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const isRefreshTriggered = useRef(false);

  const setActiveIndex = useMediaStore((s) => s.setActiveIndex);
  const pool = useVideoPoolContext();

  // Resize handling
  useEffect(() => {
    const onResize = () => setItemHeight(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Recalculate offset when itemHeight changes (e.g. rotation)
  useEffect(() => {
    setOffsetY(-activeIndexRef.current * itemHeight);
  }, [itemHeight]);

  // Infinite scroll trigger
  useEffect(() => {
    const idx = activeIndexRef.current;
    if (onNearEnd && idx >= posts.length - 3 && posts.length > 0) {
      onNearEnd();
    }
  }, [posts.length, onNearEnd]);

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

  // ── Navigate to index ──
  const goToIndex = useCallback((index: number, velocity: number = 0) => {
    const clamped = Math.max(0, Math.min(posts.length - 1, index));
    const targetY = -clamped * itemHeight;

    cancelSpring.current?.();
    setPullDistance(0);

    const config = Math.abs(velocity) > FLING_VELOCITY_THRESHOLD
      ? SPRING_CONFIGS.fling
      : SPRING_CONFIGS.snap;

    cancelSpring.current = flingSpring(
      offsetY,
      targetY,
      velocity * 1000,
      config,
      (value) => setOffsetY(value),
      () => {
        activeIndexRef.current = clamped;
        setActiveIndex(clamped);
        useMediaStore.getState().setCarouselPosition(clamped, 0);
        haptic('light');
      }
    );
  }, [offsetY, posts.length, itemHeight, setActiveIndex]);

  // ── Velocity from tracker ──
  const calculateVelocity = (): number => {
    const samples = velocityTracker.current;
    if (samples.length < 2) return 0;
    const last = samples[samples.length - 1];
    const prev = samples[Math.max(0, samples.length - 3)];
    const dt = last.time - prev.time;
    if (dt === 0) return 0;
    return (last.y - prev.y) / dt; // px/ms, negative = upward
  };

  // ── Touch handlers ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    cancelSpring.current?.();
    isDragging.current = true;
    isRefreshTriggered.current = false;
    touchStartRef.current = { y: touch.clientY, time: Date.now(), offsetY: offsetY };
    velocityTracker.current = [{ y: touch.clientY, time: Date.now() }];
  }, [offsetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaY = touch.clientY - touchStartRef.current.y;
    const currentIndex = activeIndexRef.current;
    const maxOffset = 0;
    const minOffset = -(posts.length - 1) * itemHeight;
    let newOffset = touchStartRef.current.offsetY + deltaY;

    // Rubber-band at edges
    if (newOffset > maxOffset) {
      const overscroll = newOffset - maxOffset;
      newOffset = maxOffset + overscroll * RUBBER_BAND_FACTOR;

      // Pull-to-refresh tracking (only on first item)
      if (currentIndex === 0 && onRefresh) {
        const actualPull = overscroll * RUBBER_BAND_FACTOR;
        setPullDistance(actualPull);

        // Haptic when crossing threshold
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
      setPullDistance(0);
    }

    setOffsetY(newOffset);

    // Track velocity (keep last 5)
    velocityTracker.current.push({ y: touch.clientY, time: Date.now() });
    if (velocityTracker.current.length > 5) velocityTracker.current.shift();
  }, [posts.length, itemHeight, onRefresh]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const velocity = calculateVelocity(); // px/ms
    const currentIndex = activeIndexRef.current;

    // Pull-to-refresh check
    if (currentIndex === 0 && pullDistance >= PTR_THRESHOLD && onRefresh && !isRefreshing) {
      onRefresh();
      // Spring back after refresh (handled by isRefreshing effect)
    }

    // Determine target index
    let targetIndex = currentIndex;

    if (Math.abs(velocity) > FLING_VELOCITY_THRESHOLD) {
      // Fling
      if (velocity < 0 && currentIndex < posts.length - 1) {
        targetIndex = currentIndex + 1;
      } else if (velocity > 0 && currentIndex > 0) {
        targetIndex = currentIndex - 1;
      }
    } else {
      // Snap to nearest based on current offset
      targetIndex = Math.round(-offsetY / itemHeight);
      targetIndex = Math.max(0, Math.min(posts.length - 1, targetIndex));
    }

    setPullDistance(0);
    goToIndex(targetIndex, velocity);
  }, [offsetY, posts.length, itemHeight, pullDistance, onRefresh, isRefreshing, goToIndex]);

  // When refresh completes, spring back
  useEffect(() => {
    if (!isRefreshing && pullDistance > 0) {
      setPullDistance(0);
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
    >
      {/* Pull-to-refresh indicator */}
      {onRefresh && (
        <PullToRefresh
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          threshold={PTR_THRESHOLD}
        />
      )}

      {/* Feed track */}
      <div
        style={{
          transform: `translateY(${offsetY}px)`,
          willChange: isDragging.current ? 'transform' : 'auto',
        }}
      >
        {posts.map((post, index) => (
          <FeedItem
            key={post.id}
            post={post}
            index={index}
            isActive={index === activeIndexRef.current}
            isLastItem={index === posts.length - 1}
            hasNextPage={hasNextPage}
          />
        ))}
      </div>
    </div>
  );
}
