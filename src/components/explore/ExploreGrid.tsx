
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
    
    // Always start with a big square (2x2) for visual impact
    gridItems.push({
      type: 'big-square',
      item: content[index],
      key: `first-big-${content[index].id}`
    });
    index++;
    
    // Define tile types with their probabilities for varied layouts
    const tileTypes = [
      { type: 'regular', weight: 50 },        // 1x1 squares
      { type: 'big-square', weight: 15 },     // 2x2 squares  
      { type: 'vertical', weight: 20 },       // 1x2 vertical
      { type: 'horizontal', weight: 15 }      // 2x1 horizontal
    ];
    
    // Randomly assign tile sizes for dynamic, non-predictable layout
    while (index < content.length) {
      // Skip special tiles if not enough content remaining
      const availableTypes = index < content.length - 3 ? tileTypes : 
        tileTypes.filter(t => t.type === 'regular');
      
      // Weighted random selection for varied appearance
      const totalWeight = availableTypes.reduce((sum, t) => sum + t.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedType = 'regular';
      
      for (const tileType of availableTypes) {
        random -= tileType.weight;
        if (random <= 0) {
          selectedType = tileType.type;
          break;
        }
      }
      
      gridItems.push({
        type: selectedType,
        item: content[index],
        key: `${selectedType}-${content[index].id}`
      });
      index++;
    }
    
    return gridItems;
  };

  const gridItems = createGridLayout();

  return (
    <>
      {/* Dynamic Mosaic Grid - Seamless, Gap-Free Layout */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6" style={{ 
        gridAutoRows: 'minmax(80px, 1fr)',
        gridAutoFlow: 'row dense',
        gap: 0
      }}>
        {gridItems.map((gridItem) => {
          switch (gridItem.type) {
            case 'big-square':
              return (
                <div key={gridItem.key} className="col-span-2 row-span-2">
                  <ExploreContentCard 
                    item={gridItem.item} 
                    onLike={onLike} 
                    onFollow={onFollow} 
                    onMediaClick={onMediaClick}
                    isFeatured={true}
                  />
                </div>
              );
            case 'vertical':
              return (
                <div key={gridItem.key} className="col-span-1 row-span-2">
                  <ExploreContentCard 
                    item={gridItem.item} 
                    onLike={onLike} 
                    onFollow={onFollow} 
                    onMediaClick={onMediaClick}
                  />
                </div>
              );
            case 'horizontal':
              return (
                <div key={gridItem.key} className="col-span-2 row-span-1">
                  <ExploreContentCard 
                    item={gridItem.item} 
                    onLike={onLike} 
                    onFollow={onFollow} 
                    onMediaClick={onMediaClick}
                  />
                </div>
              );
            default: // 'regular'
              return (
                <div key={gridItem.key} className="col-span-1 row-span-1">
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
