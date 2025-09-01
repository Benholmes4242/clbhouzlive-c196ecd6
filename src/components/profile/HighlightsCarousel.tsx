import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useTop100Highlights, Top100Highlight } from '@/hooks/useTop100Highlights';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDragScroll } from '@/hooks/useDragScroll';
import { HighlightsVideoProvider } from './HighlightsVideoController';
import { useHighlightsModal } from '@/hooks/useHighlightsModal';
import HighlightCardWithModal from './HighlightCardWithModal';
import FullscreenMediaModal from '@/components/ui/fullscreen-media-modal';

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
  
  // FullscreenMediaModal integration
  const { isOpen, currentHighlight, openModal, closeModal } = useHighlightsModal({
    highlights: highlights || [],
    userId
  });

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
      <div className="flex items-center justify-between mb-2 pt-2">
        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl text-foreground">Highlights From My Journey</h3>
      </div>
      <div className="flex gap-4">
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
        <div className="flex items-center justify-between mb-2 pt-2">
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
        <div className="flex items-center justify-between mb-2 pt-2">
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
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: 'default'
          }}
        >
          {highlights.map((highlight) => (
            <HighlightCardWithModal 
              key={highlight.id} 
              highlight={highlight}
              onOpenModal={openModal}
            />
          ))}
        </div>
      </div>
      
      {/* FullscreenMediaModal for highlights - same full social features as Activity tab */}
      {isOpen && currentHighlight && (
        <FullscreenMediaModal
          isOpen={isOpen}
          onClose={closeModal}
          mediaUrl={currentHighlight.post_media?.[0]?.media_url || ''}
          mediaType={currentHighlight.post_media?.[0]?.media_type as 'image' | 'video' || 'image'}
          alt={`Highlight at ${currentHighlight.golf_course?.name}`}
          golfCourse={currentHighlight.golf_course ? {
            id: currentHighlight.golf_course.id,
            name: currentHighlight.golf_course.name,
            country: currentHighlight.golf_course.country
          } : undefined}
          user={{ id: userId, profile_photo_url: null }}
          displayName="User"
          content={currentHighlight.content}
          postTags={[]}
          canNavigatePosts={highlights.length > 1}
          canGoNext={highlights.findIndex(h => h.id === currentHighlight.id) < highlights.length - 1}
          canGoPrevious={highlights.findIndex(h => h.id === currentHighlight.id) > 0}
          onNextPost={() => {
            const currentIndex = highlights.findIndex(h => h.id === currentHighlight.id);
            if (currentIndex < highlights.length - 1) {
              openModal(highlights[currentIndex + 1].id);
            }
          }}
          onPreviousPost={() => {
            const currentIndex = highlights.findIndex(h => h.id === currentHighlight.id);
            if (currentIndex > 0) {
              openModal(highlights[currentIndex - 1].id);
            }
          }}
          currentPostIndex={highlights.findIndex(h => h.id === currentHighlight.id)}
          totalPosts={highlights.length}
          postId={currentHighlight.id}
          onPostDeleted={() => {
            // Handle post deletion - could refresh highlights
            closeModal();
          }}
          onPostEdit={(postId) => {
            // Handle post editing
            console.log('Edit highlight post:', postId);
            closeModal();
          }}
        />
      )}
    </HighlightsVideoProvider>
  );
};

export default HighlightsCarousel;