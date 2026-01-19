/**
 * MediaCarousel - Horizontal swipe navigation for multi-media posts
 * 
 * Allows swiping between multiple images/videos within a single post.
 */

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FullscreenMediaItem as FullscreenMediaItemType } from '../hooks/useFullscreenViewer';

export interface MediaCarouselProps {
  /** Array of media items to display */
  items: FullscreenMediaItemType[];
  /** Current media index */
  currentIndex: number;
  /** Callback when index changes */
  onIndexChange: (index: number) => void;
  /** Whether to show navigation arrows */
  showArrows?: boolean;
  /** Whether to show dots indicator */
  showDots?: boolean;
  /** Render function for each item */
  renderItem: (item: FullscreenMediaItemType, index: number, isActive: boolean) => React.ReactNode;
  className?: string;
}

export const MediaCarousel: React.FC<MediaCarouselProps> = ({
  items,
  currentIndex,
  onIndexChange,
  showArrows = true,
  showDots = true,
  renderItem,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Only trigger horizontal swipe if horizontal movement > vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        }
      } else {
        // Swipe left - go to next
        if (currentIndex < items.length - 1) {
          onIndexChange(currentIndex + 1);
        }
      }
    }
  }, [isDragging, currentIndex, items.length, onIndexChange]);

  const goToPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const goToNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < items.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, items.length, onIndexChange]);

  if (items.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full h-full', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current item */}
      <div className="absolute inset-0">
        {renderItem(items[currentIndex], currentIndex, true)}
      </div>

      {/* Navigation arrows */}
      {showArrows && items.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-0 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
              aria-label="Previous media"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {currentIndex < items.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-0 w-11 h-11 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm"
              aria-label="Next media"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}
        </>
      )}

      {/* Dots indicator */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(index);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white/40'
              )}
              aria-label={`Go to media ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute top-4 right-4 z-30 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
          {currentIndex + 1} / {items.length}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
