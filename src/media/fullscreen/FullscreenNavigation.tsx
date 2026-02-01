/**
 * FullscreenNavigation - Vertical swipe navigation between posts
 * 
 * Handles touch gestures, snap scrolling, and infinite scroll trigger.
 */

import React, { useEffect, useRef, useCallback } from 'react';
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
        touchAction: 'pan-y',
      }}
    >
      {/* Filter out any null/undefined items to prevent crashes */}
      {viewer.items
        .filter((item): item is NonNullable<typeof item> => item != null && item.id != null)
        .map((item, index) => {
          const isNearby = Math.abs(index - viewer.currentIndex) <= 1;
          const isActive = index === viewer.currentIndex;

          return (
            <div
              key={item.id}
              data-postid={item.id}
              className="relative w-full snap-start snap-always"
              style={{
                // Use 100dvh to include safe area on iOS (fixes grey bar at top)
                // dvh = dynamic viewport height, includes safe area unlike svh
                height: '100dvh',
                minHeight: '100dvh',
                maxHeight: '100dvh',
                width: '100vw',
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <FullscreenMediaItem
                item={item}
                isActive={isActive}
                isNearby={isNearby}
              />
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
