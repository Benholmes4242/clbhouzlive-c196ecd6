
import React, { useState, useCallback, memo } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface SwipeCarouselProps {
  items: React.ReactNode[];
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
  onSlideChange?: (index: number) => void;
}

const SwipeCarousel = memo(({ 
  items, 
  className, 
  showDots = true, 
  showArrows = false,
  onSlideChange 
}: SwipeCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToSlide = useCallback((index: number) => {
    const newIndex = Math.max(0, Math.min(index, items.length - 1));
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  }, [items.length, onSlideChange]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  }, [currentIndex, onSlideChange]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : items.length - 1;
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
  }, [currentIndex, items.length, onSlideChange]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < items.length - 1) {
        goToNext();
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        goToPrevious();
      }
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50
  });

  if (items.length === 0) return null;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Carousel container */}
      <div 
        {...handlers} 
        className="relative overflow-hidden w-full select-none"
        style={{ touchAction: 'pan-y' }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0"
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {showArrows && items.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
            onClick={goToNext}
            disabled={currentIndex === items.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Dot indicators */}
      {showDots && items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-200",
                index === currentIndex 
                  ? "bg-white" 
                  : "bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

SwipeCarousel.displayName = "SwipeCarousel";

export { SwipeCarousel };
