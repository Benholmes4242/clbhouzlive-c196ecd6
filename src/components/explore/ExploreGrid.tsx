
import React, { memo } from 'react';
import Masonry from 'react-masonry-css';
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

  // Create seamless grid layout with three card types
  const createGridLayout = () => {
    if (content.length === 0) return [];
    
    const gridItems = [];
    let index = 0;
    
    while (index < content.length) {
      const random = Math.random();
      
      if (random < 0.50) {
        // 50% chance for 1x1 squares
        gridItems.push({
          type: 'square',
          item: content[index],
          key: `square-${content[index].id}`
        });
        index++;
      } else if (random < 0.85) {
        // 35% chance for 4:5 portraits (50% + 35% = 85%)
        gridItems.push({
          type: 'portrait',
          item: content[index],
          key: `portrait-${content[index].id}`
        });
        index++;
      } else {
        // 15% chance for 1x2 tall rectangles
        gridItems.push({
          type: 'tall',
          item: content[index],
          key: `tall-${content[index].id}`
        });
        index++;
      }
    }
    
    return gridItems;
  };

  const gridItems = createGridLayout();

  // Masonry breakpoints for responsive columns
  const breakpointColumnsObj = {
    default: 3,
    1100: 4,
    700: 3,
    500: 2
  };

  return (
    <>
      {/* Seamless Masonry Grid - Instagram Style */}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex gap-1 w-full"
        columnClassName="flex flex-col gap-1"
      >
        {gridItems.map((gridItem) => {
          if (gridItem.type === 'square') {
            return (
              <div key={gridItem.key} className="aspect-square mb-1">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          } else if (gridItem.type === 'portrait') {
            return (
              <div key={gridItem.key} className="aspect-[4/5] mb-1">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          } else if (gridItem.type === 'tall') {
            return (
              <div key={gridItem.key} className="aspect-[1/2] mb-1">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          }
          // Fallback for any unmatched types
          return null;
        })}
      </Masonry>
      
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
