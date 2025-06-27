
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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    
    const newIndex = Math.max(0, Math.min(index, items.length - 1));
    if (newIndex === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    onSlideChange?.(newIndex);
    
    // Reset transition lock after animation completes
    setTimeout(() => setIsTransitioning(false), 350);
  }, [items.length, onSlideChange, currentIndex, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning || currentIndex <= 0) return;
    goToSlide(currentIndex - 1);
  }, [currentIndex, goToSlide, isTransitioning]);

  const goToNext = useCallback(() => {
    if (isTransitioning || currentIndex >= items.length - 1) return;
    goToSlide(currentIndex + 1);
  }, [currentIndex, items.length, goToSlide, isTransitioning]);

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!isTransitioning && currentIndex < items.length - 1) {
        goToNext();
      }
    },
    onSwipedRight: () => {
      if (!isTransitioning && currentIndex > 0) {
        goToPrevious();
      }
    },
    trackMouse: false, // Disable mouse tracking for better mobile performance
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 30, // Lower threshold for better mobile responsiveness
    swipeDuration: 500, // Shorter duration for quicker response
    touchEventOptions: { passive: false } // Better touch event handling
  });

  if (items.length === 0) return null;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Carousel container */}
      <div 
        {...handlers} 
        className="relative overflow-hidden w-full select-none touch-pan-y"
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className={cn(
            "flex ease-out",
            isTransitioning ? "transition-transform duration-300" : ""
          )}
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            willChange: 'transform'
          }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              className="w-full flex-shrink-0"
              style={{ touchAction: 'pan-y' }}
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
            disabled={currentIndex === 0 || isTransitioning}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline" 
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 hover:bg-white"
            onClick={goToNext}
            disabled={currentIndex === items.length - 1 || isTransitioning}
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
              disabled={isTransitioning}
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
