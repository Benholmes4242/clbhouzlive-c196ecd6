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

  // Create layout with featured big cards every 9-12 items
  const createGridLayout = () => {
    const gridItems = [];
    let index = 0;
    
    while (index < content.length) {
      // Add 8-10 regular items
      const regularItemsCount = Math.min(9 + Math.floor(Math.random() * 3), content.length - index);
      
      for (let i = 0; i < regularItemsCount && index < content.length; i++) {
        gridItems.push({
          type: 'regular',
          item: content[index],
          key: `regular-${content[index].id}`,
          gridIndex: gridItems.length
        });
        index++;
      }
      
      // Add one big featured card if we have more content
      if (index < content.length) {
        gridItems.push({
          type: 'featured',
          item: content[index],
          key: `featured-${content[index].id}`,
          gridIndex: gridItems.length
        });
        index++;
      }
    }
    
    return gridItems;
  };

  // Calculate autoplay for Friends tab on desktop
  const shouldAutoplayItem = (gridIndex: number, gridItems: any[]) => {
    if (activeFilter !== 'Friends') return false;
    
    // Check if we're on desktop (using same breakpoint as grid: md and above)
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return false;

    // Grid is 4 columns on desktop, so each row has 4 items (accounting for featured cards that span 2x2)
    // Calculate which row this item is in (0-indexed)
    const row = Math.floor(gridIndex / 4);
    
    // Autoplay on rows 0, 2, 4, 6, etc. (every other row starting from first)
    const shouldAutoplayRow = row % 2 === 0;
    if (!shouldAutoplayRow) return false;

    // Find all items in this row
    const rowStartIndex = row * 4;
    const rowEndIndex = Math.min(rowStartIndex + 4, gridItems.length);
    const rowItems = gridItems.slice(rowStartIndex, rowEndIndex);
    
    // Find the first video in this row
    let firstVideoIndex = -1;
    for (let i = 0; i < rowItems.length; i++) {
      const item = rowItems[i].item;
      const isVideo = item.type === 'video' || 
                     (item.media && item.media.length > 0 && item.media[0].media_type === 'video');
      
      if (isVideo) {
        firstVideoIndex = rowStartIndex + i;
        break;
      }
    }
    
    // Autoplay if this is the first video in the row
    return firstVideoIndex === gridIndex;
  };

  const gridItems = createGridLayout();

  return (
    <>
      {/* Instagram-style Grid Layout with Featured Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1 auto-rows-fr">
        {gridItems.map((gridItem) => (
          gridItem.type === 'featured' ? (
            <div key={gridItem.key} className="col-span-2 row-span-2 aspect-square">
              <ExploreContentCard 
                item={gridItem.item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
                isFeatured={true}
                shouldAutoplay={shouldAutoplayItem(gridItem.gridIndex, gridItems)}
              />
            </div>
          ) : (
            <div key={gridItem.key} className="aspect-square">
              <ExploreContentCard 
                item={gridItem.item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
                shouldAutoplay={shouldAutoplayItem(gridItem.gridIndex, gridItems)}
              />
            </div>
          )
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