import React, { memo, useMemo, useCallback } from 'react';
import UltraFastImage from './ultra-fast-image';
import UltraFastVideo from './ultra-fast-video';
import { ExploreContentItem } from '@/components/explore/types';
import { microCacheGet, microCacheSet } from '@/utils/ultraPerformance';

interface UltraFastGridProps {
  content: ExploreContentItem[];
  onItemClick?: (item: ExploreContentItem) => void;
  className?: string;
}

// Ultra-optimized grid component for maximum performance
const UltraFastGrid: React.FC<UltraFastGridProps> = memo(({
  content,
  onItemClick,
  className = ''
}) => {
  
  // Memoized grid layout calculation
  const gridItems = useMemo(() => {
    const cacheKey = `grid-layout-${content.length}`;
    const cached = microCacheGet<any[]>(cacheKey);
    if (cached) return cached;

    const items = content.map((item, index) => ({
      ...item,
      priority: index < 6, // First 6 items are priority
      isHero: (Math.floor(index / 6) + 1) % 3 === 0 && index % 6 < 2,
      gridPosition: index % 6
    }));

    microCacheSet(cacheKey, items, 10000); // Cache for 10 seconds
    return items;
  }, [content]);

  const handleItemClick = useCallback((item: ExploreContentItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  const renderMediaItem = useCallback((item: ExploreContentItem, priority: boolean) => {
    const isVideo = item.type === 'video';
    const MediaComponent = isVideo ? UltraFastVideo : UltraFastImage;
    
    const commonProps = {
      className: "w-full h-full object-cover rounded-lg",
      priority,
      onClick: () => handleItemClick(item)
    };

    if (isVideo) {
      return (
        <UltraFastVideo
          {...commonProps}
          src={item.src}
          muted
          autoplay={priority}
        />
      );
    }

    return (
      <UltraFastImage
        {...commonProps}
        src={item.src}
        alt={item.title || 'Content'}
      />
    );
  }, [handleItemClick]);

  return (
    <div className={`grid grid-cols-3 gap-1 ${className}`}>
      {gridItems.map((item, index) => {
        const isHero = item.isHero;
        const spanClasses = isHero ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1';
        
        return (
          <div
            key={item.id}
            className={`${spanClasses} aspect-square ${isHero ? 'aspect-[2/2]' : ''} cursor-pointer`}
          >
            {renderMediaItem(item, item.priority)}
          </div>
        );
      })}
    </div>
  );
});

UltraFastGrid.displayName = 'UltraFastGrid';

export default UltraFastGrid;