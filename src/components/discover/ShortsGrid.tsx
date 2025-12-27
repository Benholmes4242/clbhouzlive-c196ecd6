import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreContentItem } from '@/components/explore/types';
import { 
  UniversalMediaGrid, 
  UniversalGridConfig, 
  UniversalMediaItem,
  exploreItemsToUniversal,
  AR_LANDSCAPE_THRESHOLD,
} from '@/components/grid';

// Extended type to include clustering metadata
interface ClusteredExploreItem extends ExploreContentItem {
  _clusterHeader?: string;
}

interface ShortsGridProps {
  items: ClusteredExploreItem[];
  onOpen: (item: ExploreContentItem, index: number) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// Grid config for Watch page using mixed-grid layout
// Every 5th tile is landscape, others are portrait
// Only landscape tiles autoplay
const WATCH_GRID_CONFIG: UniversalGridConfig = {
  layout: 'mixed-grid',
  columns: 2,
  autoplayPattern: 'every-nth',
  autoplayNth: 5, // Every 5th item (landscape tiles) can autoplay
  maxConcurrent: 1, // Only 1 video at a time
  surface: 'shorts',
  lazyLoad: true,
  preloadViewports: 2,
  initialVisible: 6,
  showCreator: true,
  showLikes: true, // Enable likes display
  showDuration: true,
  infiniteScroll: true,
  playThreshold: 0.4,
  pauseThreshold: 0.25,
};

/**
 * CourseClusterHeader - Simple text header for course-grouped content
 */
function CourseClusterHeader({ courseName }: { courseName: string }) {
  return (
    <div className="col-span-2 px-4 py-3">
      <h3 className="text-sm font-semibold text-foreground">
        Trending at {courseName}
      </h3>
      <p className="text-xs text-muted-foreground">Popular right now</p>
    </div>
  );
}

/**
 * ShortsGrid - Watch page grid wrapper
 * Uses UniversalMediaGrid with Watch-specific config
 * 
 * Supports course clustering - when items have _clusterHeader,
 * renders a section header before them.
 * 
 * Tap behavior: Opens Shorts Fullscreen Player at tapped index
 */
export default function ShortsGrid({ 
  items, 
  onOpen, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onLike,
  onAuthorClick,
  currentUserId
}: ShortsGridProps) {
  const navigate = useNavigate();
  
  // Keep reference to original items for lookup
  const itemsRef = React.useRef(items);
  itemsRef.current = items;
  
  // Extract cluster headers and their positions
  const clusterHeaders = useMemo(() => {
    const headers: { index: number; courseName: string }[] = [];
    items.forEach((item, index) => {
      if (item._clusterHeader) {
        headers.push({ index, courseName: item._clusterHeader });
      }
    });
    return headers;
  }, [items]);
  
  // Separate videos by orientation for smart assignment
  const { portraitVideos, landscapeVideos } = useMemo(() => {
    const portrait: ClusteredExploreItem[] = [];
    const landscape: ClusteredExploreItem[] = [];

    items.forEach(item => {
      const aspectRatio = item.aspectRatio || 
        (item.width && item.height && item.height > 0 ? item.width / item.height : 1);
      
      if (aspectRatio >= AR_LANDSCAPE_THRESHOLD || item.landscapeSuitable) {
        landscape.push(item);
      } else {
        portrait.push(item);
      }
    });

    return { portraitVideos: portrait, landscapeVideos: landscape };
  }, [items]);

  // Weave videos into mixed pattern (every 5th = landscape)
  const mixedItems = useMemo(() => {
    const result: ClusteredExploreItem[] = [];
    let portraitIndex = 0;
    let landscapeIndex = 0;
    const totalSlots = Math.max(items.length, 20);

    for (let i = 0; i < totalSlots; i++) {
      const isLandscapeSlot = (i + 1) % 5 === 0;

      if (isLandscapeSlot && landscapeIndex < landscapeVideos.length) {
        result.push(landscapeVideos[landscapeIndex]);
        landscapeIndex++;
      } else if (!isLandscapeSlot && portraitIndex < portraitVideos.length) {
        result.push(portraitVideos[portraitIndex]);
        portraitIndex++;
      } else {
        // Fallback: use whatever is available
        if (portraitIndex < portraitVideos.length) {
          result.push(portraitVideos[portraitIndex]);
          portraitIndex++;
        } else if (landscapeIndex < landscapeVideos.length) {
          result.push(landscapeVideos[landscapeIndex]);
          landscapeIndex++;
        }
      }
      
      // Stop if we've used all items
      if (portraitIndex >= portraitVideos.length && landscapeIndex >= landscapeVideos.length) {
        break;
      }
    }

    return result;
  }, [portraitVideos, landscapeVideos, items.length]);
  
  // Convert mixed items to unified format with orientation metadata
  const unifiedItems = useMemo(() => {
    const unified = exploreItemsToUniversal(mixedItems);
    
    // Add orientation metadata for mixed-grid layout
    return unified.map((item, index) => {
      const isLandscapeSlot = (index + 1) % 5 === 0;
      const aspectRatio = item.aspectRatio || 
        (item.mediaWidth && item.mediaHeight && item.mediaHeight > 0 
          ? item.mediaWidth / item.mediaHeight 
          : 1);
      const isActuallyLandscape = aspectRatio >= AR_LANDSCAPE_THRESHOLD;
      
      return {
        ...item,
        orientation: isActuallyLandscape ? 'landscape' as const : 'portrait' as const,
        tileVariant: isLandscapeSlot && isActuallyLandscape ? 'landscape' as const : 'portrait' as const,
        // Only landscape tiles can autoplay
        isAutoplayCandidate: isLandscapeSlot && isActuallyLandscape,
      };
    });
  }, [mixedItems]);

  // Handle item click - passes index for Shorts Player entry
  const handleItemClick = useCallback((unifiedItem: UniversalMediaItem, index: number) => {
    const originalItem = itemsRef.current.find(item => item.id === unifiedItem.id);
    if (originalItem) {
      onOpen(originalItem, index);
    }
  }, [onOpen]);

  // Handle author click
  const handleAuthorClick = useCallback((authorId: string) => {
    if (onAuthorClick) {
      onAuthorClick(authorId);
    } else {
      navigate(`/u/${authorId}`);
    }
  }, [navigate, onAuthorClick]);

  // Handle like
  const handleLike = useCallback((itemId: string) => {
    onLike?.(itemId);
  }, [onLike]);

  // If there are cluster headers, we need custom rendering with sections
  if (clusterHeaders.length > 0) {
    const sections: React.ReactNode[] = [];
    let lastIndex = 0;
    
    clusterHeaders.forEach((header, headerIdx) => {
      // Items before this header (if any)
      if (header.index > lastIndex) {
        const beforeItems = unifiedItems.slice(lastIndex, header.index);
        if (beforeItems.length > 0) {
          sections.push(
            <UniversalMediaGrid
              key={`section-${lastIndex}`}
              items={beforeItems}
              config={WATCH_GRID_CONFIG}
              isLoading={false}
              hasMore={false}
              onItemClick={handleItemClick}
              onLike={handleLike}
              onAuthorClick={handleAuthorClick}
              currentUserId={currentUserId}
            />
          );
        }
      }
      
      // Add the header
      sections.push(
        <CourseClusterHeader key={`header-${header.index}`} courseName={header.courseName} />
      );
      
      // Determine where this section ends
      const nextHeaderIndex = clusterHeaders[headerIdx + 1]?.index ?? unifiedItems.length;
      const sectionItems = unifiedItems.slice(header.index, nextHeaderIndex);
      
      if (sectionItems.length > 0) {
        sections.push(
          <UniversalMediaGrid
            key={`section-${header.index}`}
            items={sectionItems}
            config={WATCH_GRID_CONFIG}
            isLoading={headerIdx === clusterHeaders.length - 1 ? isLoading : false}
            hasMore={headerIdx === clusterHeaders.length - 1 ? hasMore : false}
            onLoadMore={headerIdx === clusterHeaders.length - 1 ? onLoadMore : undefined}
            onItemClick={handleItemClick}
            onLike={handleLike}
            onAuthorClick={handleAuthorClick}
            currentUserId={currentUserId}
          />
        );
      }
      
      lastIndex = nextHeaderIndex;
    });
    
    // Any remaining items after the last header
    if (lastIndex < unifiedItems.length) {
      sections.push(
        <UniversalMediaGrid
          key={`section-final`}
          items={unifiedItems.slice(lastIndex)}
          config={WATCH_GRID_CONFIG}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onItemClick={handleItemClick}
          onLike={handleLike}
          onAuthorClick={handleAuthorClick}
          currentUserId={currentUserId}
        />
      );
    }
    
    return <>{sections}</>;
  }

  // No clustering - render single grid
  return (
    <>
      <UniversalMediaGrid
        items={unifiedItems}
        config={WATCH_GRID_CONFIG}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        onItemClick={handleItemClick}
        onLike={handleLike}
        onAuthorClick={handleAuthorClick}
        currentUserId={currentUserId}
      />
      
      {/* All caught up message */}
      {!hasMore && unifiedItems.length > 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </>
  );
}
