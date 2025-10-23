import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCardWithObserver from '@/components/shorts/ShortCardWithObserver';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { selectLandscapeCandidate, preloadLandscapePoster } from '@/utils/landscapeEligibility';

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
const CARD_ASPECT = 0.5625; // width / height (9:16 portrait)
const PORTRAITS_PER_LANDSCAPE = 6; // Insert landscape after every 6 portraits

// Deterministic height variance based on item ID
const getHeightVariant = (id: string): number => {
  const variants = [-10, -6, -3, 3, 6, 10]; // percentage variants
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return variants[hash % variants.length];
};

interface LayoutItem {
  item: ExploreContentItem;
  index: number;
  type: 'portrait' | 'landscape';
  height?: number;
  variant?: 'portrait' | 'landscape';
}

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

  // Keep columnWidth accurate on mount, resize and container size changes
  useEffect(() => {
    updateColumnWidth();
    window.addEventListener('resize', updateColumnWidth);

    const el = gridRef.current;
    let ro: ResizeObserver | undefined;
    if (el && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => updateColumnWidth());
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', updateColumnWidth);
      ro?.disconnect();
    };
  }, [updateColumnWidth]);

  // Layout with landscape cards: Portrait cards organized in blocks of 6, with landscape cards inserted after each block
  const layout = useMemo(() => {
    if (items.length === 0) return [];
    
    const result: LayoutItem[] = [];
    const usedIndexes = new Set<number>();
    let portraitCount = 0;
    let itemIndex = 0;
    
    while (itemIndex < items.length) {
      const item = items[itemIndex];
      
      // Check if we should try to insert a landscape card
      if (portraitCount > 0 && portraitCount % PORTRAITS_PER_LANDSCAPE === 0) {
        // Try to find a landscape candidate
        const landscapeCandidate = selectLandscapeCandidate(items, usedIndexes);
        
        if (landscapeCandidate) {
          // Preload the landscape card's poster
          preloadLandscapePoster(landscapeCandidate.item);
          
          result.push({
            item: landscapeCandidate.item,
            index: landscapeCandidate.index,
            type: 'landscape',
            variant: 'landscape'
          });
          usedIndexes.add(landscapeCandidate.index);
          
          // Don't increment itemIndex - we still need to process the current item as a portrait
          continue;
        }
      }
      
      // Add portrait card if not already used
      if (!usedIndexes.has(itemIndex)) {
        const variant = getHeightVariant(item.id);
        const cardHeight = baseHeightPx * (1 + variant / 100);
        
        result.push({
          item,
          index: itemIndex,
          type: 'portrait',
          height: cardHeight,
          variant: 'portrait'
        });
        usedIndexes.add(itemIndex);
        portraitCount++;
      }
      
      itemIndex++;
    }
    
    return result;
  }, [items, baseHeightPx]);

  // Organize layout into rows: first 2 portraits, then masonry columns with landscape breaks
  const { firstRow, sections } = useMemo(() => {
    if (layout.length === 0) return { firstRow: [], sections: [] };
    
    const firstRow = layout.slice(0, 2).filter(item => item.type === 'portrait');
    const remaining = layout.slice(2);
    
    const sections: Array<{
      type: 'masonry' | 'landscape';
      items?: Array<{ item: ExploreContentItem; index: number; height: number; column: 'left' | 'right' }>;
      landscapeItem?: { item: ExploreContentItem; index: number };
    }> = [];
    
    let currentMasonry: LayoutItem[] = [];
    
    remaining.forEach((layoutItem) => {
      if (layoutItem.type === 'landscape') {
        // Flush current masonry section
        if (currentMasonry.length > 0) {
          const leftCol: Array<{ item: ExploreContentItem; index: number; height: number; column: 'left' | 'right' }> = [];
          const rightCol: Array<{ item: ExploreContentItem; index: number; height: number; column: 'left' | 'right' }> = [];
          let leftHeight = 0;
          let rightHeight = 0;
          
          currentMasonry.forEach((portItem) => {
            if (leftHeight <= rightHeight) {
              leftCol.push({ item: portItem.item, index: portItem.index, height: portItem.height!, column: 'left' });
              leftHeight += portItem.height! + GUTTER_PX;
            } else {
              rightCol.push({ item: portItem.item, index: portItem.index, height: portItem.height!, column: 'right' });
              rightHeight += portItem.height! + GUTTER_PX;
            }
          });
          
          sections.push({
            type: 'masonry',
            items: [...leftCol, ...rightCol]
          });
          
          currentMasonry = [];
        }
        
        // Add landscape section
        sections.push({
          type: 'landscape',
          landscapeItem: { item: layoutItem.item, index: layoutItem.index }
        });
      } else {
        currentMasonry.push(layoutItem);
      }
    });
    
    // Flush remaining masonry items
    if (currentMasonry.length > 0) {
      const leftCol: Array<{ item: ExploreContentItem; index: number; height: number; column: 'left' | 'right' }> = [];
      const rightCol: Array<{ item: ExploreContentItem; index: number; height: number; column: 'left' | 'right' }> = [];
      let leftHeight = 0;
      let rightHeight = 0;
      
      currentMasonry.forEach((portItem) => {
        if (leftHeight <= rightHeight) {
          leftCol.push({ item: portItem.item, index: portItem.index, height: portItem.height!, column: 'left' });
          leftHeight += portItem.height! + GUTTER_PX;
        } else {
          rightCol.push({ item: portItem.item, index: portItem.index, height: portItem.height!, column: 'right' });
          rightHeight += portItem.height! + GUTTER_PX;
        }
      });
      
      sections.push({
        type: 'masonry',
        items: [...leftCol, ...rightCol]
      });
    }
    
    return { firstRow, sections };
  }, [layout]);

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
          paddingLeft: `${GUTTER_PX}px`,
          paddingRight: `${GUTTER_PX}px`,
          boxSizing: 'border-box'
        }}
      >
        {/* First Row - Pinned, Same Height */}
        {firstRow.length > 0 && (
          <div className="grid grid-cols-2" style={{ gap: `${GUTTER_PX}px`, marginBottom: `${GUTTER_PX}px` }}>
            {firstRow.map((layoutItem) => (
              <ShortCardWithObserver
                key={layoutItem.item.id}
                item={layoutItem.item}
                onClick={() => handleCardClick(layoutItem.item, layoutItem.index)}
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
        
        {/* Sections: Masonry blocks interspersed with landscape cards */}
        {sections.map((section, sectionIndex) => {
          if (section.type === 'landscape' && section.landscapeItem) {
            return (
              <div key={`landscape-${sectionIndex}`} style={{ marginBottom: `${GUTTER_PX}px` }}>
                <ShortCardWithObserver
                  item={section.landscapeItem.item}
                  onClick={() => handleCardClick(section.landscapeItem.item, section.landscapeItem.index)}
                  onVisibilityChange={handleVisibilityChange}
                  onLike={onLike}
                  onAuthorClick={onAuthorClick}
                  currentUserId={currentUserId}
                  variant="landscape"
                />
              </div>
            );
          }
          
          if (section.type === 'masonry' && section.items) {
            const leftItems = section.items.filter(item => item.column === 'left');
            const rightItems = section.items.filter(item => item.column === 'right');
            
            return (
              <div 
                key={`masonry-${sectionIndex}`} 
                className="grid grid-cols-2" 
                style={{ gap: `${GUTTER_PX}px`, marginBottom: `${GUTTER_PX}px` }}
              >
                <div style={{ display: 'grid', rowGap: `${GUTTER_PX}px` }}>
                  {leftItems.map(({ item, index, height }) => (
                    <ShortCardWithObserver
                      key={item.id}
                      item={item}
                      onClick={() => handleCardClick(item, index)}
                      height={height}
                      onVisibilityChange={handleVisibilityChange}
                      onLike={onLike}
                      onAuthorClick={onAuthorClick}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
                <div style={{ display: 'grid', rowGap: `${GUTTER_PX}px` }}>
                  {rightItems.map(({ item, index, height }) => (
                    <ShortCardWithObserver
                      key={item.id}
                      item={item}
                      onClick={() => handleCardClick(item, index)}
                      height={height}
                      onVisibilityChange={handleVisibilityChange}
                      onLike={onLike}
                      onAuthorClick={onAuthorClick}
                      currentUserId={currentUserId}
                    />
                  ))}
                </div>
              </div>
            );
          }
          
          return null;
        })}
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
