/**
 * FullscreenNavigation - Vertical swipe navigation between posts
 * 
 * Performance Fixes:
 * - Fix 5: Swipe-down to close gesture
 * - Fix 7: Poster placeholders for non-virtualized items (±4 range)
 * - Fix 11: Poster preload for adjacent items
 * - Fix 12: Clean audio on close (immediate mute before animation)
 * 
 * Handles touch gestures, snap scrolling, and infinite scroll trigger.
 * CRITICAL: Uses virtualization to only render ~5 items at a time to prevent freeze.
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { FullscreenMediaItem } from './FullscreenMediaItem';
import { useFullscreenPlayerOptional } from '@/contexts/FullscreenPlayerContext';

// ============ Constants ============

// Hysteresis thresholds
const VISIBILITY_START_THRESHOLD = 0.5;
const VISIBILITY_STOP_THRESHOLD = 0.1;

// Scroll velocity tracking
const SCROLL_VELOCITY_WINDOW = 1500;
const VELOCITY_EWMA_ALPHA = 0.3;

// Memory pressure detection
const MEMORY_CHECK_INTERVAL = 3000;
const MEMORY_HIGH_THRESHOLD = 80;

// Fix 7: Extended poster range beyond virtualization window
const POSTER_PRELOAD_RANGE = 4;

// Fix 5: Swipe-down-to-close threshold
const SWIPE_DOWN_CLOSE_THRESHOLD = 80;

export interface FullscreenNavigationProps {
  className?: string;
}

export const FullscreenNavigation: React.FC<FullscreenNavigationProps> = React.memo(({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const fullscreenPlayer = useFullscreenPlayerOptional();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hysteresis tracking
  const lastActiveIndexRef = useRef<number>(viewer.currentIndex);
  
  // Scroll velocity tracking
  const scrollEventsRef = useRef<number[]>([]);
  const smoothedVelocityRef = useRef<number>(0);
  
  // Memory pressure state
  const [isLowMemory, setIsLowMemory] = useState(false);

  // Fix 5: Swipe-down-to-close state
  const swipeDownRef = useRef({
    startY: 0,
    startX: 0,
    isDragging: false,
    isActive: false,
  });
  const [swipeDownOffset, setSwipeDownOffset] = useState(0);

  // Monitor memory pressure
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (!memory) return;
      
      const usedPct = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      setIsLowMemory(usedPct >= MEMORY_HIGH_THRESHOLD);
    };
    
    checkMemory();
    const intervalId = setInterval(checkMemory, MEMORY_CHECK_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, []);

  // Fix 11: Preload posters for items in ±POSTER_PRELOAD_RANGE
  useEffect(() => {
    const items = viewer.items;
    const idx = viewer.currentIndex;
    
    const start = Math.max(0, idx - POSTER_PRELOAD_RANGE);
    const end = Math.min(items.length, idx + POSTER_PRELOAD_RANGE + 1);
    
    for (let i = start; i < end; i++) {
      const item = items[i];
      if (!item) continue;
      const posterUrl = item.posterUrl;
      if (posterUrl) {
        // Check if preload link already exists
        const existing = document.querySelector(`link[href="${posterUrl}"][rel="preload"]`);
        if (!existing) {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = posterUrl;
          document.head.appendChild(link);
          // Cleanup after 30s
          setTimeout(() => {
            try { document.head.removeChild(link); } catch {}
          }, 30000);
        }
      }
    }
  }, [viewer.currentIndex, viewer.items]);

  // Scroll to index when currentIndex changes
  useEffect(() => {
    if (!scrollRef.current || isScrollingRef.current) return;
    
    const itemHeight = window.innerHeight;
    const targetScroll = viewer.currentIndex * itemHeight;
    
    scrollRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  }, [viewer.currentIndex]);

  // Record scroll event for velocity tracking
  const recordScrollEvent = useCallback(() => {
    const now = Date.now();
    scrollEventsRef.current.push(now);
    scrollEventsRef.current = scrollEventsRef.current.filter(
      t => now - t < SCROLL_VELOCITY_WINDOW * 2
    );
  }, []);

  // Handle scroll events with hysteresis
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    
    recordScrollEvent();

    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);

    const rawIndex = scrollTop / itemHeight;
    const currentVisibility = 1 - Math.abs(rawIndex - lastActiveIndexRef.current);
    
    let newIndex = lastActiveIndexRef.current;
    
    const candidateIndex = Math.round(rawIndex);
    if (candidateIndex !== lastActiveIndexRef.current) {
      const candidateVisibility = 1 - Math.abs(rawIndex - candidateIndex);
      
      if (candidateVisibility >= VISIBILITY_START_THRESHOLD && 
          currentVisibility <= VISIBILITY_STOP_THRESHOLD) {
        newIndex = candidateIndex;
      } else if (candidateVisibility > 0.6 && currentVisibility < 0.4) {
        newIndex = candidateIndex;
      }
    }

    if (newIndex !== viewer.currentIndex && newIndex >= 0 && newIndex < viewer.items.length) {
      lastActiveIndexRef.current = newIndex;
      viewer.goToIndex(newIndex);
      fullscreenPlayer?.notifyIndexChange(newIndex);
    }

    // Infinite scroll trigger
    if (Math.round(rawIndex) >= viewer.items.length - 3 && viewer.hasMore && !viewer.isLoading) {
      viewer.fetchMore();
    }
  }, [viewer, fullscreenPlayer, recordScrollEvent]);

  // Fix 5: Swipe-down-to-close touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    swipeDownRef.current = {
      startY: touch.clientY,
      startX: touch.clientX,
      isDragging: true,
      isActive: false,
    };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeDownRef.current.isDragging) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - swipeDownRef.current.startY;
    const deltaX = Math.abs(touch.clientX - swipeDownRef.current.startX);
    
    // Only trigger swipe-down-to-close if:
    // 1. Pulling downward
    // 2. More vertical than horizontal
    // 3. At the first video OR pulling from top 20% of screen
    const isFirstVideo = viewer.currentIndex === 0;
    const isFromTopArea = swipeDownRef.current.startY < window.innerHeight * 0.2;
    
    if (deltaY > 20 && deltaY > deltaX && (isFirstVideo || isFromTopArea)) {
      swipeDownRef.current.isActive = true;
      setSwipeDownOffset(Math.max(0, deltaY));
    }
  }, [viewer.currentIndex]);

  // Fix 12: Immediate audio stop on close
  const immediateAudioStop = useCallback(() => {
    const videoRef = viewer.activeVideoRef;
    if (videoRef?.current) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
  }, [viewer.activeVideoRef]);

  const handleTouchEnd = useCallback(() => {
    if (swipeDownRef.current.isActive && swipeDownOffset > SWIPE_DOWN_CLOSE_THRESHOLD) {
      // Fix 12: Stop audio immediately, then close
      immediateAudioStop();
      viewer.close();
    }
    swipeDownRef.current = { startY: 0, startX: 0, isDragging: false, isActive: false };
    setSwipeDownOffset(0);
  }, [swipeDownOffset, viewer, immediateAudioStop]);

  // Virtualization: ±2 items, with poster placeholders for ±4
  const virtualizationWindow = isLowMemory ? 1 : 2;

  // Compute swipe-down transform style
  const swipeDownStyle = useMemo(() => {
    if (swipeDownOffset <= 0) return {};
    const progress = Math.min(swipeDownOffset / 300, 1);
    return {
      transform: `translateY(${swipeDownOffset}px) scale(${1 - progress * 0.1})`,
      opacity: 1 - progress * 0.3,
      transition: swipeDownRef.current.isActive ? 'none' : 'transform 0.3s ease, opacity 0.3s ease',
    };
  }, [swipeDownOffset]);

  return (
    <div
      ref={scrollRef}
      className={`h-full w-full overflow-y-auto snap-y snap-mandatory ${className || ''}`}
      onScroll={handleScroll}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y mandatory',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
        ...swipeDownStyle,
      }}
    >
      {/* Render all items with virtualization */}
      {viewer.items.map((item, index) => {
        if (!item || item.id == null) return null;
        
        const isNearby = Math.abs(index - viewer.currentIndex) <= virtualizationWindow;
        const isActive = index === viewer.currentIndex;
        // Fix 7: Extended poster range
        const isInPosterRange = Math.abs(index - viewer.currentIndex) <= POSTER_PRELOAD_RANGE;

        return (
          <div
            key={item.id}
            data-postid={item.id}
            className="relative w-full snap-start snap-always"
            style={{
              height: '100svh',
              minHeight: '100svh',
              maxHeight: '100svh',
              width: '100vw',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            {isNearby ? (
              <FullscreenMediaItem
                item={item}
                isActive={isActive}
                isNearby={isNearby}
              />
            ) : isInPosterRange && item.posterUrl ? (
              // Fix 7: Poster placeholder instead of bare black div
              <div className="w-full h-full bg-black relative">
                <img
                  src={item.posterUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-black" />
            )}
          </div>
        );
      })}

      {/* Loading indicator */}
      {viewer.isLoading && (
        <div className="h-screen flex items-center justify-center">
          <div className="text-white/70">Loading more posts...</div>
        </div>
      )}

      <style>{`
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        .snap-y { scrollbar-width: none !important; scroll-snap-type: y mandatory; }
        .snap-start { scroll-snap-align: start; scroll-snap-stop: always; }
      `}</style>
    </div>
  );
});

export default FullscreenNavigation;
