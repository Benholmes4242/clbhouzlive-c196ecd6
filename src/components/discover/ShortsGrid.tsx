import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCardWithObserver from '@/components/shorts/ShortCardWithObserver';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';

// Lazy load fullscreen viewer - only loads when user opens a short
const ShortsViewer = lazy(() => import('@/components/shorts/ShortsViewer'));

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

// Deterministic height variance based on item ID
const getHeightVariant = (id: string): number => {
  const variants = [-10, -6, -3, 3, 6, 10]; // percentage variants
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

export default function ShortsGrid({ items, onOpen, isLoading, hasMore, onLoadMore }: ShortsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());

  // Preload posters for first visible items on mount
  useEffect(() => {
    const firstItems = items.slice(0, 6);
    firstItems.forEach(item => {
      if (item.src) {
        const streamId = getStreamIdFromUrl(item.src);
        if (streamId) {
          const posterUrl = getStreamPoster(streamId, '0s', 720);
          if (posterUrl) {
            const img = new Image();
            img.src = posterUrl;
          }
        }
      }
    });
  }, [items]);

  const handleCardClick = (item: ExploreContentItem, index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
    onOpen(item);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
  };

  const handleVisibilityChange = useCallback((id: string, visible: boolean) => {
    setVisibleCards(prev => {
      const next = new Set(prev);
      if (visible) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Masonry layout: first 2 items in a row, rest balanced between 2 columns
  const { firstRow, leftColumn, rightColumn } = useMemo(() => {
    if (items.length === 0) return { firstRow: [], leftColumn: [], rightColumn: [] };
    
    const firstRow = items.slice(0, 2);
    const remaining = items.slice(2);
    
    const leftCol: Array<{ item: ExploreContentItem; index: number }> = [];
    const rightCol: Array<{ item: ExploreContentItem; index: number }> = [];
    
    let leftHeight = 0;
    let rightHeight = 0;
    const baseHeight = 280;
    
    remaining.forEach((item, idx) => {
      const actualIndex = idx + 2; // offset by first row
      const variant = getHeightVariant(item.id);
      const cardHeight = baseHeight * (1 + variant / 100);
      
      if (leftHeight <= rightHeight) {
        leftCol.push({ item, index: actualIndex });
        leftHeight += cardHeight + 8; // 8px gap
      } else {
        rightCol.push({ item, index: actualIndex });
        rightHeight += cardHeight + 8;
      }
    });
    
    return { firstRow, leftColumn: leftCol, rightColumn: rightCol };
  }, [items]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || !hasMore || loadingRef.current || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = scrollHeight - clientHeight - 800;

      if (scrollTop > scrollThreshold && onLoadMore) {
        loadingRef.current = true;
        onLoadMore();
        setTimeout(() => {
          loadingRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, onLoadMore]);

  return (
    <>
      <div ref={gridRef} className="pb-4 px-1">
        {/* First Row - Pinned, Same Height */}
        {firstRow.length > 0 && (
          <div className="grid grid-cols-2 gap-1 mb-2">
            {firstRow.map((item, index) => (
              <ShortCardWithObserver
                key={item.id}
                item={item}
                onClick={() => handleCardClick(item, index)}
                height={280}
                isPinned
                onVisibilityChange={handleVisibilityChange}
              />
            ))}
          </div>
        )}
        
        {/* Masonry Columns - Staggered */}
        {(leftColumn.length > 0 || rightColumn.length > 0) && (
          <div className="grid grid-cols-2 gap-1 items-start">
            {/* Left Column */}
            <div className="flex flex-col gap-2">
              {leftColumn.map(({ item, index }) => (
                <ShortCardWithObserver
                  key={item.id}
                  item={item}
                  onClick={() => handleCardClick(item, index)}
                  height={280 * (1 + getHeightVariant(item.id) / 100)}
                  onVisibilityChange={handleVisibilityChange}
                />
              ))}
            </div>
            
            {/* Right Column */}
            <div className="flex flex-col gap-2">
              {rightColumn.map(({ item, index }) => (
                <ShortCardWithObserver
                  key={item.id}
                  item={item}
                  onClick={() => handleCardClick(item, index)}
                  height={280 * (1 + getHeightVariant(item.id) / 100)}
                  onVisibilityChange={handleVisibilityChange}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}

      {/* Full-screen Shorts Viewer - lazy loaded */}
      <Suspense fallback={null}>
        <ShortsViewer
          items={items}
          initialIndex={selectedIndex}
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
        />
      </Suspense>
    </>
  );
}
