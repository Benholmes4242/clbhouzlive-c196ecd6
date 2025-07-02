
import React from 'react';
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
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore 
}) => {
  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Only show skeleton loading on initial load, not during pagination
  if (isLoading && content.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (content.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-lg font-semibold mb-2">No content yet</h3>
        <p className="text-muted-foreground">Be the first to share something amazing!</p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive Grid Layout - No loading states between content */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
        {content.map((item) => (
          <div key={item.id} className="aspect-square">
            <ExploreContentCard 
              item={item} 
              onLike={onLike} 
              onFollow={onFollow} 
              onMediaClick={onMediaClick}
            />
          </div>
        ))}
      </div>
      
      {/* Infinite scroll sentinel - minimal loading indicator */}
      <div id="scroll-sentinel" className="h-4">
        {isLoading && content.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExploreGrid;
