/**
 * MediaGrid
 * Unified grid component for displaying video thumbnails with consistent behavior
 * 
 * Features:
 * - Configurable columns (fixed or responsive)
 * - Configurable gap and aspect ratio
 * - Infinite scroll support
 * - Skeleton loading states
 * - Custom overlay rendering
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { MediaThumbnail } from './MediaThumbnail';
import { ThumbnailSkeleton } from './ThumbnailSkeleton';
import type { AspectRatio } from '../types';

// ============================================
// TYPES
// ============================================

export interface MediaGridItem {
  id: string;
  /** Cloudflare Stream UID for videos */
  streamId?: string;
  /** Direct image URL (alternative to streamId) */
  imageUrl?: string;
  /** Title/alt text */
  title?: string;
  /** Duration in seconds (for videos) */
  duration?: number;
  /** View count */
  viewCount?: number;
  /** Creator display name */
  creatorName?: string;
  /** Creator avatar URL */
  creatorAvatar?: string;
  /** Any additional data */
  [key: string]: any;
}

export interface ResponsiveColumns {
  /** < 640px (default: 2) */
  xs?: number;
  /** 640px+ (default: 3) */
  sm?: number;
  /** 768px+ (default: 3) */
  md?: number;
  /** 1024px+ (default: 4) */
  lg?: number;
  /** 1280px+ (default: 4) */
  xl?: number;
}

export interface MediaGridProps {
  /** Array of media items to display */
  items: MediaGridItem[];
  /** Number of columns (fixed or responsive) */
  columns?: number | ResponsiveColumns;
  /** Gap between items in pixels (default: 8) */
  gap?: number;
  /** Aspect ratio for items (default: '3:4') */
  aspectRatio?: AspectRatio;
  /** Click handler for items */
  onItemClick?: (item: MediaGridItem, index: number) => void;
  /** Custom overlay renderer per item */
  renderOverlay?: (item: MediaGridItem, index: number) => React.ReactNode;
  /** Show loading skeleton */
  loading?: boolean;
  /** Number of skeleton items to show (default: 9) */
  skeletonCount?: number;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Has more items to load (for infinite scroll) */
  hasMore?: boolean;
  /** Callback to load more items */
  onLoadMore?: () => void;
  /** Items from end to trigger load more (default: 3) */
  loadMoreThreshold?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show view count on thumbnails */
  showViewCount?: boolean;
  /** Show duration on thumbnails (default: true) */
  showDuration?: boolean;
  /** Show play button on hover */
  showPlayButton?: boolean;
}

// ============================================
// COLUMN CLASSES
// ============================================

const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

// ============================================
// COMPONENT
// ============================================

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  columns = 3,
  gap = 8,
  aspectRatio = '3:4',
  onItemClick,
  renderOverlay,
  loading = false,
  skeletonCount = 9,
  emptyState,
  hasMore = false,
  onLoadMore,
  loadMoreThreshold = 3,
  className,
  showViewCount = false,
  showDuration = true,
  showPlayButton = false,
}) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggeredRef = useRef(false);

  // Generate grid columns class
  const getColumnsClass = useCallback(() => {
    if (typeof columns === 'number') {
      return COLUMN_CLASSES[columns] || 'grid-cols-3';
    }
    const { xs = 2, sm = 3, md = 3, lg = 4, xl = 4 } = columns;
    const xsClass = COLUMN_CLASSES[xs] || 'grid-cols-2';
    const smClass = COLUMN_CLASSES[sm] || 'grid-cols-3';
    const mdClass = COLUMN_CLASSES[md] || 'grid-cols-3';
    const lgClass = COLUMN_CLASSES[lg] || 'grid-cols-4';
    const xlClass = COLUMN_CLASSES[xl] || 'grid-cols-4';
    return `${xsClass} sm:${smClass} md:${mdClass} lg:${lgClass} xl:${xlClass}`;
  }, [columns]);

  // Infinite scroll observer callback
  const lastItemRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node || !hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadMoreTriggeredRef.current) {
          loadMoreTriggeredRef.current = true;
          onLoadMore();
          // Reset after a short delay to allow next trigger
          setTimeout(() => {
            loadMoreTriggeredRef.current = false;
          }, 500);
        }
      },
      { rootMargin: '100px' }
    );

    observerRef.current.observe(node);
  }, [hasMore, onLoadMore]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Loading skeleton state (only when no items)
  if (loading && items.length === 0) {
    return (
      <div
        className={cn('grid', getColumnsClass(), className)}
        style={{ gap: `${gap}px` }}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ThumbnailSkeleton key={`skeleton-${i}`} aspectRatio={aspectRatio} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        {emptyState || 'No items to display'}
      </div>
    );
  }

  return (
    <div
      className={cn('grid', getColumnsClass(), className)}
      style={{ gap: `${gap}px` }}
    >
      {items.map((item, index) => {
        const isNearEnd = index >= items.length - loadMoreThreshold;
        const shouldObserve = isNearEnd && hasMore && onLoadMore;

        return (
          <div
            key={item.id}
            ref={shouldObserve ? lastItemRef : undefined}
          >
            <MediaThumbnail
              streamId={item.streamId}
              imageUrl={item.imageUrl}
              alt={item.title || 'Media item'}
              aspectRatio={aspectRatio}
              duration={item.duration}
              viewCount={item.viewCount}
              showDuration={showDuration}
              showViewCount={showViewCount}
              showPlayButton={showPlayButton}
              onClick={onItemClick ? () => onItemClick(item, index) : undefined}
              overlay={renderOverlay?.(item, index)}
            />
          </div>
        );
      })}

      {/* Loading more skeletons */}
      {loading && items.length > 0 && (
        <>
          {Array.from({ length: 3 }).map((_, i) => (
            <ThumbnailSkeleton key={`loading-${i}`} aspectRatio={aspectRatio} />
          ))}
        </>
      )}
    </div>
  );
};

export default MediaGrid;
