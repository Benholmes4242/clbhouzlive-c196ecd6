import React, { memo } from 'react';
import { MediaItem, MediaGridConfig } from './types';
import MediaDisplay from './MediaDisplay';
import { useMediaGrid } from './hooks/useMediaGrid';

interface MediaGridProps {
  items: MediaItem[];
  config: MediaGridConfig;
  isLoading?: boolean;
}

const MediaGrid: React.FC<MediaGridProps> = memo(({
  items,
  config,
  isLoading = false
}) => {
  const {
    layoutItems,
    gridClasses,
    itemLoadingStates,
    handleImageLoad,
    handleImageError
  } = useMediaGrid(items, config);

  const handleMediaClick = (item: MediaItem) => {
    config.interactions?.onMediaClick?.(item);
  };

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-2">No media yet</h3>
        <p className="text-muted-foreground">Media will appear here when available.</p>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {layoutItems.map((layoutItem) => (
        <div
          key={layoutItem.key}
          className={layoutItem.className}
          style={layoutItem.style}
        >
          <div
            className="relative bg-background overflow-hidden h-full cursor-pointer border-0"
            style={{ borderRadius: '0px' }}
            onClick={() => handleMediaClick(layoutItem.item)}
          >
            <MediaDisplay
              media={{
                id: layoutItem.item.id,
                media_type: layoutItem.item.type as 'video' | 'image',
                media_url: layoutItem.item.src
              }}
              itemTitle={layoutItem.item.title}
              shouldAutoplay={config.features.autoplay}
              isLoading={itemLoadingStates[layoutItem.item.id] ?? true}
              onImageError={() => handleImageError(layoutItem.item.id)}
              onImageLoad={() => handleImageLoad(layoutItem.item.id)}
              itemId={layoutItem.item.id}
              currentIndex={0}
              loop={true}
              useSmartMedia={false}
              onMediaClick={() => handleMediaClick(layoutItem.item)}
            />
          </div>
        </div>
      ))}
    </div>
  );
});

MediaGrid.displayName = 'MediaGrid';

export default MediaGrid;