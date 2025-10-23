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
  onLike?: (itemId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  currentUserId?: string;
}

// Single source of truth for spacing
const GUTTER_PX = 4 as const;
const CARD_ASPECT = 0.75; // width / height (3:4)

// Deterministic height variance based on item ID
const getHeightVariant = (id: string): number => {
  const variants = [-10, -6, -3, 3, 6, 10]; // percentage variants
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

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
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());

  // Track column width to compute pixel-perfect height from aspect ratio
  const [columnWidth, setColumnWidth] = useState(0);

  const updateColumnWidth = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth; // includes padding
    const inner = containerWidth - GUTTER_PX * 2; // remove left/right padding
    const col = (inner - GUTTER_PX) / 2; // remove inter-column gap, then split
    setColumnWidth(col);
  }, []);

  useEffect(() => {
    updateColumnWidth();
    window.addEventListener('resize', updateColumnWidth);
    return () => window.removeEventListener('resize', updateColumnWidth);
  }, [updateColumnWidth]);

  const baseHeightPx = useMemo(() => {
    if (columnWidth <= 0) return 280;
    return Math.round(columnWidth / CARD_ASPECT); // height = width / (w/h)
  }, [columnWidth]);

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
    const baseHeight = baseHeightPx;
    
    remaining.forEach((item, idx) => {
      const actualIndex = idx + 2; // offset by first row
      const variant = getHeightVariant(item.id);
      const cardHeight = baseHeight * (1 + variant / 100);
      
      if (leftHeight <= rightHeight) {
        leftCol.push({ item, index: actualIndex });
        leftHeight += cardHeight + GUTTER_PX;
      } else {
        rightCol.push({ item, index: actualIndex });
        rightHeight += cardHeight + GUTTER_PX;
      }
    });
    
    return { firstRow, leftColumn: leftCol, rightColumn: rightCol };
  }, [items, baseHeightPx]);

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
      <div 
        ref={gridRef} 
        className="shortsGrid pb-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: `${GUTTER_PX}px`,
          paddingLeft: `${GUTTER_PX}px`,
          paddingRight: `${GUTTER_PX}px`,
          boxSizing: 'border-box'
        }}
      >
        {/* First Row - Pinned, Same Height */}
        {firstRow.length > 0 && (
          <div className="col-span-2 grid grid-cols-2" style={{ gap: `${GUTTER_PX}px`, marginBottom: `${GUTTER_PX}px` }}>
            {firstRow.map((item, index) => (
              <ShortCardWithObserver
                key={item.id}
                item={item}
                onClick={() => handleCardClick(item, index)}
                height={baseHeightPx}
                isPinned
                onVisibilityChange={handleVisibilityChange}
                onLike={onLike}
                onAuthorClick={onAuthorClick}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
        
        {/* Masonry Columns - Staggered */}
        {leftColumn.length > 0 && (
          <div className="shortsCol shortsCol--left" style={{ display: 'grid', rowGap: `${GUTTER_PX}px` }}>
              {leftColumn.map(({ item, index }) => (
                <ShortCardWithObserver
                  key={item.id}
                  item={item}
                  onClick={() => handleCardClick(item, index)}
                  height={baseHeightPx * (1 + getHeightVariant(item.id) / 100)}
                  onVisibilityChange={handleVisibilityChange}
                  onLike={onLike}
                  onAuthorClick={onAuthorClick}
                  currentUserId={currentUserId}
                />
              ))}
          </div>
        )}
            
        {rightColumn.length > 0 && (
          <div className="shortsCol shortsCol--right" style={{ display: 'grid', rowGap: `${GUTTER_PX}px` }}>
              {rightColumn.map(({ item, index }) => (
                <ShortCardWithObserver
                  key={item.id}
                  item={item}
                  onClick={() => handleCardClick(item, index)}
                  height={baseHeightPx * (1 + getHeightVariant(item.id) / 100)}
                  onVisibilityChange={handleVisibilityChange}
                  onLike={onLike}
                  onAuthorClick={onAuthorClick}
                  currentUserId={currentUserId}
                />
              ))}
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
