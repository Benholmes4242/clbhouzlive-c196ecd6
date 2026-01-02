import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  UniversalMediaGrid, 
  UniversalGridConfig, 
  UniversalMediaItem 
} from '@/components/grid';

export type LayoutHint = 'square' | 'tall' | 'wide';

export interface ActivityGridItem {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  previewUrl?: string;
  layoutHint?: LayoutHint;
  roundId?: string;
  courseName?: string;
  roundDate?: string;
}

interface ActivityGridProps {
  items: ActivityGridItem[];
  onItemClick: (item: ActivityGridItem, index: number) => void;
  className?: string;
}

// Grid config for Profile Activity grid
const ACTIVITY_GRID_CONFIG: UniversalGridConfig = {
  layout: 'portrait-grid',
  columns: 3,
  autoplayPattern: 'every-nth',
  autoplayNth: 3,
  maxConcurrent: 2,
  surface: 'profile',
  lazyLoad: true,
  preloadViewports: 2,
  initialVisible: 9, // 3 rows of 3
  showCreator: false,
  showLikes: false,
  showDuration: true,
  infiniteScroll: false,
};

/**
 * Convert ActivityGridItem to UniversalMediaItem
 */
function activityItemToUniversal(
  item: ActivityGridItem & { _stackCount?: number; _stackName?: string }, 
  index: number
): UniversalMediaItem {
  return {
    id: item.id,
    postId: item.roundId || item.id,
    type: item.type,
    url: item.thumbnailUrl,
    thumbnailUrl: item.thumbnailUrl,
    playbackUrl: item.previewUrl,
    sortIndex: index,
    orientation: item.layoutHint === 'wide' ? 'landscape' : item.layoutHint === 'tall' ? 'portrait' : 'square',
    tileVariant: 'portrait',
    additionalMediaCount: item._stackCount ? item._stackCount - 1 : undefined,
    courseName: item._stackName || item.courseName,
  };
}

/**
 * ActivityGrid - Premium 3-column grid with 2px gaps
 * Uses UniversalMediaGrid under the hood
 */
const ActivityGrid: React.FC<ActivityGridProps> = ({
  items,
  onItemClick,
  className
}) => {
  // Keep reference to original items for lookup
  const itemsRef = useRef(items);
  itemsRef.current = items;
  
  // Group posts by round for stacking
  const groupedItems = useMemo(() => {
    const byRound = new Map<string, ActivityGridItem[]>();
    
    for (const item of items) {
      const key = item.roundId ?? `${item.courseName ?? 'none'}-${item.roundDate?.slice(0, 10) ?? item.id}`;
      if (!byRound.has(key)) byRound.set(key, []);
      byRound.get(key)!.push(item);
    }
    
    return Array.from(byRound.entries()).map(([key, value]) => {
      if (value.length === 1) {
        return { kind: 'single' as const, item: value[0] };
      }
      return {
        kind: 'round' as const,
        roundId: key,
        courseName: value[0].courseName ?? 'Golf round',
        items: value
      };
    });
  }, [items]);

  // Flatten for grid display with stack metadata
  const displayItems = useMemo(() => {
    return groupedItems.flatMap(group => {
      if (group.kind === 'single') return [group.item];
      return [{ 
        ...group.items[0], 
        _stackCount: group.items.length, 
        _stackName: group.courseName 
      }];
    });
  }, [groupedItems]);
  
  // Convert to UniversalMediaItem format
  const unifiedItems = useMemo(() => {
    return displayItems.map((item, index) => activityItemToUniversal(item as any, index));
  }, [displayItems]);
  
  // Handle item click - find original item
  const handleItemClick = useCallback((unifiedItem: UniversalMediaItem, index: number) => {
    const originalItem = itemsRef.current.find(item => item.id === unifiedItem.id);
    if (originalItem) {
      onItemClick(originalItem, index);
    }
  }, [onItemClick]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
        <p className="text-muted-foreground text-sm max-w-[280px]">
          Share your golf moments to see them here
        </p>
      </div>
    );
  }

  return (
    <div className={cn("pb-[var(--page-bottom-padding)]", className)}>
      <UniversalMediaGrid
        items={unifiedItems}
        config={ACTIVITY_GRID_CONFIG}
        onItemClick={handleItemClick}
      />
    </div>
  );
};

export default ActivityGrid;
