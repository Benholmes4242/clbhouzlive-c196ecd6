
import React, { memo } from 'react';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';

interface ExploreGridProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  activeFilter?: string;
  isPreloaded?: (id: string) => boolean;
  createSentinel?: (callback: () => void) => HTMLElement;
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore,
  activeFilter,
  isPreloaded,
  createSentinel
}) => {
  // Enhanced intersection observer with preloading support
  React.useEffect(() => {
    let observer: IntersectionObserver;
    let sentinel: HTMLElement;

    if (createSentinel) {
      // Use the enhanced sentinel creator
      sentinel = createSentinel(onLoadMore);
      const existingSentinel = document.getElementById('scroll-sentinel');
      if (existingSentinel) {
        existingSentinel.appendChild(sentinel);
      }
    } else {
      // Fallback to traditional intersection observer
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            onLoadMore();
          }
        },
        { threshold: 0.1 }
      );

      const fallbackSentinel = document.getElementById('scroll-sentinel');
      if (fallbackSentinel) {
        observer.observe(fallbackSentinel);
      }
    }

    return () => {
      if (observer) {
        const fallbackSentinel = document.getElementById('scroll-sentinel');
        if (fallbackSentinel) {
          observer.unobserve(fallbackSentinel);
        }
      }
      if (sentinel) {
        sentinel.remove();
      }
    };
  }, [hasMore, isLoading, onLoadMore, createSentinel]);

  // Don't show skeleton loading on initial load for any filter
  if (isLoading && content.length === 0) {
    return null; // No loading state shown
  }

  if (content.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
        <p className="text-muted-foreground max-w-md">
          {activeFilter === 'Hack Shack' 
            ? "No hacks yet! Be the first to upload a hilarious golf mishit using #hackshack in your post."
            : "Try adjusting your filters or check back later for new content."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive Grid Layout with preload indicators */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
        {content.map((item) => (
          <div key={item.id} style={{ aspectRatio: '4/5' }} className="relative">
            <ExploreContentCard 
              item={item} 
              onLike={onLike} 
              onFollow={onFollow} 
              onMediaClick={onMediaClick}
            />
            {/* Show preload indicator in development or when explicitly enabled */}
            {isPreloaded?.(item.id) && process.env.NODE_ENV === 'development' && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full opacity-60" 
                   title="Preloaded" />
            )}
          </div>
        ))}
      </div>
      
      {/* Infinite scroll sentinel */}
      <div id="scroll-sentinel" className="h-4">
        {isLoading && hasMore && activeFilter !== 'Hack Shack' && activeFilter !== 'Videos' && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(ExploreGrid);
