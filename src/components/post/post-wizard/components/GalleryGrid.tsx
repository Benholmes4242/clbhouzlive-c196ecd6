import React, { useCallback, useMemo } from 'react';
import { Check, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GalleryMediaItem } from '@/utils/capacitor/galleryService';
import { useInView } from 'react-intersection-observer';

interface GalleryGridProps {
  items: GalleryMediaItem[];
  selectedIds: string[];
  maxSelection: number;
  onSelect: (item: GalleryMediaItem) => void;
  onDeselect: (itemId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function GalleryGrid({
  items,
  selectedIds,
  maxSelection,
  onSelect,
  onDeselect,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: GalleryGridProps) {
  // Infinite scroll trigger
  const { ref: loadMoreRef } = useInView({
    threshold: 0,
    onChange: (inView) => {
      if (inView && hasMore && !isLoadingMore && onLoadMore) {
        onLoadMore();
      }
    },
  });
  
  // Create selection order map for numbered indicators
  const selectionOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    selectedIds.forEach((id, index) => {
      map.set(id, index + 1);
    });
    return map;
  }, [selectedIds]);
  
  const handleItemClick = useCallback((item: GalleryMediaItem) => {
    const isSelected = selectedIds.includes(item.id);
    
    if (isSelected) {
      onDeselect(item.id);
    } else if (selectedIds.length < maxSelection) {
      onSelect(item);
    }
    // If at max and trying to select new item, do nothing (or could show toast)
  }, [selectedIds, maxSelection, onSelect, onDeselect]);
  
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="w-full">
      {/* Grid */}
      <div className="grid grid-cols-3 gap-0.5">
        {items.map((item) => {
          const isSelected = selectedIds.includes(item.id);
          const selectionOrder = selectionOrderMap.get(item.id);
          const canSelect = selectedIds.length < maxSelection;
          const thumbnailSrc = item.thumbnailUri || item.uri;
          
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={cn(
                'relative aspect-square overflow-hidden bg-muted',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                'transition-transform active:scale-[0.98]',
                !isSelected && !canSelect && 'opacity-50'
              )}
            >
              {/* Thumbnail Image */}
              <img
                src={thumbnailSrc}
                alt=""
                className={cn(
                  'w-full h-full object-cover',
                  'transition-transform duration-200',
                  isSelected && 'scale-[0.92]'
                )}
                loading="lazy"
              />
              
              {/* Video Duration Badge */}
              {item.type === 'video' && (
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5 px-1 py-0.5 bg-black/70 rounded text-white text-xs">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>{formatDuration(item.duration)}</span>
                </div>
              )}
              
              {/* Selection Indicator */}
              <div
                className={cn(
                  'absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                  'transition-all duration-200',
                  isSelected
                    ? 'bg-primary border-primary text-primary-foreground scale-100'
                    : 'bg-black/30 border-white/80 text-transparent scale-90'
                )}
              >
                {isSelected ? (
                  selectedIds.length > 1 ? (
                    <span className="text-xs font-semibold">{selectionOrder}</span>
                  ) : (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  )
                ) : null}
              </div>
              
              {/* Selected Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Load More Trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {items.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <p>No photos or videos found</p>
        </div>
      )}
    </div>
  );
}
