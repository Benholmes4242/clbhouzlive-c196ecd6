/**
 * FullscreenNavigation - Vertical swipe navigation between posts
 * 
 * Handles touch gestures, snap scrolling, and infinite scroll trigger.
 * CRITICAL: Uses virtualization to only render ~3 items at a time to prevent freeze.
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useFullscreenViewerContext } from '../hooks/useFullscreenViewer';
import { FullscreenMediaItem } from './FullscreenMediaItem';

export interface FullscreenNavigationProps {
  className?: string;
}

export const FullscreenNavigation: React.FC<FullscreenNavigationProps> = ({
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const scrollTop = scrollRef.current.scrollTop;
    const itemHeight = window.innerHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    // Mark as scrolling
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);

    // Update index if changed
    if (newIndex !== viewer.currentIndex && newIndex >= 0 && newIndex < viewer.items.length) {
      viewer.goToIndex(newIndex);
    }

    // Check for infinite scroll
    if (newIndex >= viewer.items.length - 3 && viewer.hasMore && !viewer.isLoading) {
      viewer.fetchMore();
    }
  }, [viewer]);

  // FIX 1: Virtualization - only render items within window around currentIndex
  // This prevents mounting 50+ video players and causing freeze
  const virtualizedItems = useMemo(() => {
    return viewer.items
      .map((item, index) => ({ item, index }))
      .filter(({ item, index }) => {
        if (!item || item.id == null) return false;
        // Only render items within 1 position of current (max 3 items)
        return Math.abs(index - viewer.currentIndex) <= 1;
      });
  }, [viewer.items, viewer.currentIndex]);

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
        // FIX 4A: Change from pan-y to manipulation to allow horizontal swipes
        touchAction: 'manipulation',
      }}
    >
      {/* Render all items with placeholders for non-virtualized ones */}
      {viewer.items.map((item, index) => {
        if (!item || item.id == null) return null;
        
        const isNearby = Math.abs(index - viewer.currentIndex) <= 1;
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
};

export default FullscreenNavigation;
