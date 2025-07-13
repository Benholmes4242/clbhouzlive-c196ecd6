
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
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore,
  activeFilter
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

  // Create layout with only squares for seamless fitting
  const createGridLayout = () => {
    if (content.length === 0) return [];
    
    const gridItems = [];
    let index = 0;
    
    // Always start with a big square (2x2)
    gridItems.push({
      type: 'big-square',
      item: content[index],
      key: `first-big-${content[index].id}`
    });
    index++;
    
    while (index < content.length) {
      // Add regular items in batches
      const regularItemsCount = Math.min(9 + Math.floor(Math.random() * 4), content.length - index);
      
      for (let i = 0; i < regularItemsCount && index < content.length; i++) {
        gridItems.push({
          type: 'regular',
          item: content[index],
          key: `regular-${content[index].id}`
        });
        index++;
      }
      
      // Add big square only if we have sufficient content remaining
      if (index < content.length - 3) {
        gridItems.push({
          type: 'big-square',
          item: content[index],
          key: `big-square-${content[index].id}`
        });
        index++;
      }
    }
    
    // Fill all remaining slots with regular cards
    while (index < content.length) {
      gridItems.push({
        type: 'regular',
        item: content[index],
        key: `regular-end-${content[index].id}`
      });
      index++;
    }
    
    return gridItems;
  };

  const gridItems = createGridLayout();

  return (
    <>
      {/* Seamless Grid - No Gaps on Any Screen Size */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1" style={{ 
        gridAutoRows: '1fr',
        gridAutoFlow: 'row dense'
      }}>
        {gridItems.map((gridItem) => {
          if (gridItem.type === 'big-square') {
            return (
              <div key={gridItem.key} className="col-span-2 row-span-2 aspect-square">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                  isFeatured={true}
                />
              </div>
            );
          } else {
            return (
              <div key={gridItem.key} className="aspect-square">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          }
        })}
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
