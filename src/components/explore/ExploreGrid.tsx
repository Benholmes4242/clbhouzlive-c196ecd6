
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

  // Create dynamic mosaic layout with varied tile sizes
  const createGridLayout = () => {
    if (content.length === 0) return [];
    
    const gridItems = [];
    let index = 0;
    
    // Always start with a large square (2x2)
    gridItems.push({
      type: 'large-square',
      item: content[index],
      key: `first-large-${content[index].id}`
    });
    index++;
    
    while (index < content.length) {
      // Randomly assign tile types with weighted probabilities
      const remainingItems = content.length - index;
      const rand = Math.random();
      
      let tileType = 'small-square';
      
      if (remainingItems >= 6) {
        if (rand < 0.15) tileType = 'large-horizontal'; // 3x2
        else if (rand < 0.3) tileType = 'large-vertical'; // 2x3
        else if (rand < 0.45) tileType = 'wide-horizontal'; // 3x1
        else if (rand < 0.6) tileType = 'tall-vertical'; // 1x3
        else if (rand < 0.75) tileType = 'large-square'; // 2x2
        else if (rand < 0.85) tileType = 'horizontal'; // 2x1
        else if (rand < 0.95) tileType = 'vertical'; // 1x2
        // else small-square (5% chance)
      } else if (remainingItems >= 4) {
        if (rand < 0.2) tileType = 'large-square'; // 2x2
        else if (rand < 0.4) tileType = 'horizontal'; // 2x1
        else if (rand < 0.6) tileType = 'vertical'; // 1x2
        else if (rand < 0.8) tileType = 'wide-horizontal'; // 3x1
        // else small-square
      } else if (remainingItems >= 2) {
        if (rand < 0.4) tileType = 'horizontal'; // 2x1
        else if (rand < 0.8) tileType = 'vertical'; // 1x2
        // else small-square
      }
      
      gridItems.push({
        type: tileType,
        item: content[index],
        key: `${tileType}-${content[index].id}`
      });
      index++;
    }
    
    return gridItems;
  };

  const gridItems = createGridLayout();

  return (
    <>
      {/* Dynamic Mosaic Grid - Seamless with No Gaps */}
      <div className="grid grid-cols-6 gap-0" style={{ 
        gridAutoRows: '1fr',
        gridAutoFlow: 'row dense'
      }}>
        {gridItems.map((gridItem) => {
          const { type } = gridItem;
          
          // Define grid positioning for each tile type
          const getGridClasses = () => {
            switch (type) {
              case 'large-square': return 'col-span-2 row-span-2 aspect-square';
              case 'large-horizontal': return 'col-span-3 row-span-2 aspect-[3/2]';
              case 'large-vertical': return 'col-span-2 row-span-3 aspect-[2/3]';
              case 'wide-horizontal': return 'col-span-3 row-span-1 aspect-[3/1]';
              case 'tall-vertical': return 'col-span-1 row-span-3 aspect-[1/3]';
              case 'horizontal': return 'col-span-2 row-span-1 aspect-[2/1]';
              case 'vertical': return 'col-span-1 row-span-2 aspect-[1/2]';
              default: return 'col-span-1 row-span-1 aspect-square'; // small-square
            }
          };
          
          const isFeatured = ['large-square', 'large-horizontal', 'large-vertical'].includes(type);
          
          return (
            <div key={gridItem.key} className={getGridClasses()}>
              <ExploreContentCard 
                item={gridItem.item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
                isFeatured={isFeatured}
              />
            </div>
          );
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
