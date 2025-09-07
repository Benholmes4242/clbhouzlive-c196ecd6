import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useTop100Highlights, Top100Highlight } from '@/hooks/useTop100Highlights';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/useDragScroll';
import { HighlightsVideoProvider } from './HighlightsVideoController';
import HighlightCardWithModal from './HighlightCardWithModal';
import { useHighlightsAutoplay } from '@/hooks/useHighlightsAutoplay';

interface HighlightsCarouselProps {
  userId: string;
  className?: string;
}

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({ userId, className = '' }) => {
  const { highlights, isLoading, error } = useTop100Highlights(userId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragRefCallback = useDragScroll({ enabled: true, direction: 'horizontal' });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Autoplay management
  const { activeCardIndex, registerCard, shouldAutoplay } = useHighlightsAutoplay({
    containerRef: scrollContainerRef,
    highlights: highlights || []
  });
  
  // Remove fullscreen modal functionality
  // const { isOpen, currentHighlight, openModal, closeModal } = useHighlightsModal({
  //   highlights: highlights || [],
  //   userId
  // });

  // Remove modal-related state and effects

  // Combined ref callback that handles both scroll container and drag functionality
  const combinedRefCallback = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    dragRefCallback(node);
  }, [dragRefCallback]);

  // Handle scroll to update arrow visibility
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check
    handleScroll();

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll, highlights]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (isLoading) {
  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2 pt-0">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-80 h-60 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
  }

  if (error || !highlights || highlights.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2 pt-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🏌️‍♂️</div>
          <h4 className="text-lg font-semibold mb-2">No Top-100 Highlights Yet</h4>
          <p className="text-muted-foreground">
            Share photos and videos from your rounds at Top-100 courses to see them featured here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <HighlightsVideoProvider>
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-2 pt-0">
          <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
          
          {highlights.length > 1 && (
            <div className="flex gap-2">
              {showLeftArrow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollLeft}
                  className="w-8 h-8 p-0 hover:bg-accent"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
              {showRightArrow && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={scrollRight}
                  className="w-8 h-8 p-0 hover:bg-accent"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div 
          ref={combinedRefCallback}
          className="flex overflow-x-auto gap-1 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4 [--cards:1.3] md:[--cards:3.5] lg:[--cards:3.5] xl:[--cards:3.5] [--g:0.5rem] sm:[--g:0.75rem] md:[--g:1rem] lg:[--g:1.25rem] xl:[--g:1.5rem] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: 'default'
          }}
        >
          {highlights.map((highlight, index) => (
            <div 
              key={highlight.id} 
              ref={(el) => registerCard(index, el)}
              className="shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))]"
            >
              <HighlightCardWithModal 
                highlight={highlight}
                isLandscape={true}
                shouldAutoplay={shouldAutoplay(index)}
                cardIndex={index}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Fullscreen modal functionality removed */}
    </HighlightsVideoProvider>
  );
};

export default HighlightsCarousel;