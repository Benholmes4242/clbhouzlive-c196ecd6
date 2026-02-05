/**
 * FullscreenNavigation - Vertical swipe navigation between posts
 * 
 * TikTok-Level Improvements:
 * - FIX #2: Autoplay hysteresis (50% in / 10% out threshold)
 * - FIX #4: Scroll velocity tracking with EWMA smoothing
 * - FIX #8: Memory-aware virtualization window
 * 
 * Handles touch gestures, snap scrolling, and infinite scroll trigger.
 * CRITICAL: Uses virtualization to only render ~3 items at a time to prevent freeze.
 */

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { FullscreenMediaItem } from './FullscreenMediaItem';
import { useFullscreenPlayerOptional } from '@/contexts/FullscreenPlayerContext';

// ============ Constants ============

// FIX #2: Hysteresis thresholds
const VISIBILITY_START_THRESHOLD = 0.5; // Start playing at 50% visible
const VISIBILITY_STOP_THRESHOLD = 0.1;  // Stop playing at 10% visible

// FIX #4: Scroll velocity tracking
const SCROLL_VELOCITY_WINDOW = 1500; // 1.5s for averaging
const VELOCITY_EWMA_ALPHA = 0.3; // Smoothing factor

// FIX #8: Memory pressure detection
const MEMORY_CHECK_INTERVAL = 3000;
const MEMORY_HIGH_THRESHOLD = 80; // % heap usage

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
  
  // FIX #2: Track active item with hysteresis
  const lastActiveIndexRef = useRef<number>(viewer.currentIndex);
  
  // FIX #4: Scroll velocity tracking
  const scrollEventsRef = useRef<number[]>([]);
  const smoothedVelocityRef = useRef<number>(0);
  
  // FIX #8: Memory pressure state
  const [isLowMemory, setIsLowMemory] = useState(false);

  // FIX #8: Monitor memory pressure
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

  // FIX #4: Record scroll event for velocity tracking
  const recordScrollEvent = useCallback(() => {
    const now = Date.now();
    scrollEventsRef.current.push(now);
    
    // Cleanup old events
    scrollEventsRef.current = scrollEventsRef.current.filter(
      t => now - t < SCROLL_VELOCITY_WINDOW * 2
    );
  }, []);

  // FIX #4: Calculate smoothed scroll velocity
  const getScrollVelocity = useCallback((): number => {
    const now = Date.now();
    const recentEvents = scrollEventsRef.current.filter(
      t => now - t < SCROLL_VELOCITY_WINDOW
    );
    
    if (recentEvents.length < 2) return smoothedVelocityRef.current;
    
    const duration = (recentEvents[recentEvents.length - 1] - recentEvents[0]) / 1000;
    if (duration === 0) return smoothedVelocityRef.current;
    
    const rawVelocity = (recentEvents.length - 1) / duration;
    
    // Apply EWMA smoothing
    smoothedVelocityRef.current = 
      VELOCITY_EWMA_ALPHA * rawVelocity + 
      (1 - VELOCITY_EWMA_ALPHA) * smoothedVelocityRef.current;
    
    return smoothedVelocityRef.current;
  }, []);

  // FIX #2: Handle scroll events with hysteresis
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    
    // FIX #4: Record scroll event
    recordScrollEvent();

    // Mark as scrolling
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);

    // FIX #2: Calculate visibility with hysteresis
    const rawIndex = scrollTop / itemHeight;
    const currentVisibility = 1 - Math.abs(rawIndex - lastActiveIndexRef.current);
    
    // Determine which index should be active based on hysteresis
    let newIndex = lastActiveIndexRef.current;
    
    // Check if we should switch to a new index
    const candidateIndex = Math.round(rawIndex);
    if (candidateIndex !== lastActiveIndexRef.current) {
      const candidateVisibility = 1 - Math.abs(rawIndex - candidateIndex);
      
      // FIX #2: Use hysteresis thresholds
      // Only switch if:
      // 1. New candidate is >50% visible, AND
      // 2. Current item is <10% visible
      if (candidateVisibility >= VISIBILITY_START_THRESHOLD && 
          currentVisibility <= VISIBILITY_STOP_THRESHOLD) {
        newIndex = candidateIndex;
      }
      // OR if candidate is dominant (>60%) and current is minority (<40%)
      else if (candidateVisibility > 0.6 && currentVisibility < 0.4) {
        newIndex = candidateIndex;
      }
    }

    // Update index if changed
    if (newIndex !== viewer.currentIndex && newIndex >= 0 && newIndex < viewer.items.length) {
      lastActiveIndexRef.current = newIndex;
      viewer.goToIndex(newIndex);
      
      // FIX #5: Notify context for re-prefetch
      fullscreenPlayer?.notifyIndexChange(newIndex);
    }

    // Check for infinite scroll (unchanged)
    if (Math.round(rawIndex) >= viewer.items.length - 3 && viewer.hasMore && !viewer.isLoading) {
      viewer.fetchMore();
    }
  }, [viewer, fullscreenPlayer, recordScrollEvent]);

  // TikTok-Level Virtualization: ±2 items for smoother prefetch
  // Under memory pressure, reduce to ±1 for memory safety
  const virtualizationWindow = isLowMemory ? 1 : 2;
  
  const virtualizedItems = useMemo(() => {
    return viewer.items
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => {
        if (!item || item.id == null) return false;
        // FIX #8: Reduce window under memory pressure
        return Math.abs(index - viewer.currentIndex) <= virtualizationWindow;
      });
  }, [viewer.items, viewer.currentIndex, virtualizationWindow]);

  return (
    <div
      ref={scrollRef}
      className={`h-full w-full overflow-y-auto snap-y snap-mandatory ${className || ''}`}
      onScroll={handleScroll}
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        scrollSnapType: 'y mandatory',
        overscrollBehavior: 'none',
        touchAction: 'manipulation',
      }}
    >
      {/* Render all items with placeholders for non-virtualized ones */}
      {viewer.items.map((item, index) => {
        if (!item || item.id == null) return null;
        
        const isNearby = Math.abs(index - viewer.currentIndex) <= virtualizationWindow;
        const isActive = index === viewer.currentIndex;

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
            {/* Only render actual content for nearby items (virtualization) */}
            {isNearby ? (
              <FullscreenMediaItem
                item={item}
                isActive={isActive}
                isNearby={isNearby}
              />
            ) : (
              // Lightweight placeholder to maintain scroll height
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
