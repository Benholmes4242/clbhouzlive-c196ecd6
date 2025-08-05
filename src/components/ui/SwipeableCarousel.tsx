import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableCarouselProps {
  children: React.ReactNode[];
  className?: string;
  itemWidth?: string; // e.g., "80%", "85%", "300px"
  gap?: string; // e.g., "16px", "1rem"
  showDots?: boolean;
  showArrows?: boolean;
  snapToCenter?: boolean;
}

const SwipeableCarousel: React.FC<SwipeableCarouselProps> = ({
  children,
  className,
  itemWidth = "85%",
  gap = "16px",
  showDots = true,
  showArrows = false,
  snapToCenter = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const itemCount = children.length;

  // Touch/Mouse event handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current) return;
    
    const x = clientX;
    const walk = (x - startX) * 2; // Scroll speed
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleEnd = () => {
    setIsDragging(false);
    
    // Snap to nearest item
    if (containerRef.current && snapToCenter) {
      const container = containerRef.current;
      const itemWidthPx = container.clientWidth * (parseInt(itemWidth) / 100);
      const gapPx = parseInt(gap);
      const itemWithGap = itemWidthPx + gapPx;
      
      const newIndex = Math.round(container.scrollLeft / itemWithGap);
      const clampedIndex = Math.max(0, Math.min(newIndex, itemCount - 1));
      
      setCurrentIndex(clampedIndex);
      
      // Smooth scroll to the snapped position
      container.scrollTo({
        left: clampedIndex * itemWithGap,
        behavior: 'smooth'
      });
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Arrow navigation
  const goToNext = () => {
    const nextIndex = Math.min(currentIndex + 1, itemCount - 1);
    setCurrentIndex(nextIndex);
    scrollToIndex(nextIndex);
  };

  const goToPrev = () => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    setCurrentIndex(prevIndex);
    scrollToIndex(prevIndex);
  };

  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const itemWidthPx = container.clientWidth * (parseInt(itemWidth) / 100);
      const gapPx = parseInt(gap);
      const itemWithGap = itemWidthPx + gapPx;
      
      container.scrollTo({
        left: index * itemWithGap,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Arrow Controls */}
      {showArrows && (
        <>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full p-2 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === itemCount - 1}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border rounded-full p-2 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          scrollSnapType: snapToCenter ? 'x mandatory' : 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0"
            style={{
              width: itemWidth,
              marginRight: index < children.length - 1 ? gap : '0',
              scrollSnapAlign: snapToCenter ? 'center' : 'start'
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Dot Indicators */}
      {showDots && itemCount > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: itemCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                scrollToIndex(index);
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-200',
                index === currentIndex 
                  ? 'bg-black' 
                  : 'bg-black/30'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeableCarousel;