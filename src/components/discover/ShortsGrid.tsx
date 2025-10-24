import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCardWithObserver from '@/components/shorts/ShortCardWithObserver';
import { getStreamIdFromUrl, getStreamPoster } from '@/utils/stream';
import { selectLandscapeCandidate, preloadLandscapePoster, isLandscapeEligible } from '@/utils/landscapeEligibility';

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
const CARD_ASPECT = 0.52; // width / height (slightly wider than 9:16)
const PORTRAITS_PER_LANDSCAPE = 4; // Insert landscape after every 4 portraits (2 rows)
const LOOKAHEAD_WINDOW = 20; // Lookahead window for landscape candidate search
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
    if (columnWidth <= 0) return 280 * 0.9;
    return Math.round((columnWidth / CARD_ASPECT) * 0.9); // height = width / (w/h), reduced by 10%
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
    let insertedLandscapeThisBoundary = false;
    
    while (itemIndex < items.length) {
      const item = items[itemIndex];
      
      // Check if we should try to insert a landscape card
      if (portraitCount > 0 && portraitCount % PORTRAITS_PER_LANDSCAPE === 0 && !insertedLandscapeThisBoundary) {
        const start = itemIndex;

        // Try to find a landscape candidate within a limited lookahead window
        const landscapeCandidate = selectLandscapeCandidate(items, usedIndexes, start, LOOKAHEAD_WINDOW);
        
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
          
          // Reset counter to start a new block and prevent double inserts
          portraitCount = 0;
          insertedLandscapeThisBoundary = true;
          
          // Do NOT advance itemIndex here since we didn't consume items[itemIndex]
          continue;
        }
      }
      
      // Add portrait card if not already used - all use base height (no variant)
      if (!usedIndexes.has(itemIndex)) {
        result.push({
          item,
          index: itemIndex,
          type: 'portrait',
          height: baseHeightPx, // All portraits same size
          variant: 'portrait'
        });
        usedIndexes.add(itemIndex);
        portraitCount++;
        insertedLandscapeThisBoundary = false;
      }
      
      itemIndex++;
    }
    
    return result;
  }, [items, baseHeightPx]);

  // Organize layout into rows: 2x2 portrait grids with landscape breaks
  const { firstRow, sections } = useMemo(() => {
    if (layout.length === 0) return { firstRow: [], sections: [] };
    
    const firstRow = layout.slice(0, 2).filter(item => item.type === 'portrait');
    const remaining = layout.slice(2);
    
    const sections: Array<{
      type: 'portrait-grid' | 'landscape';
      items?: Array<{ item: ExploreContentItem; index: number; height: number }>;
      landscapeItem?: { item: ExploreContentItem; index: number };
    }> = [];
    
    let currentPortraits: LayoutItem[] = [];
    
    remaining.forEach((layoutItem) => {
      if (layoutItem.type === 'landscape') {
        // Flush current portrait section
        if (currentPortraits.length > 0) {
          sections.push({
            type: 'portrait-grid',
            items: currentPortraits.map(p => ({ item: p.item, index: p.index, height: p.height! }))
          });
          currentPortraits = [];
        }
        
        // Add landscape section
        sections.push({
          type: 'landscape',
          landscapeItem: { item: layoutItem.item, index: layoutItem.index }
        });
      } else {
        currentPortraits.push(layoutItem);
      }
    });
    
    // Flush remaining portrait items
    if (currentPortraits.length > 0) {
      sections.push({
        type: 'portrait-grid',
        items: currentPortraits.map(p => ({ item: p.item, index: p.index, height: p.height! }))
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
          paddingRight: 0,
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
              <div 
                key={`landscape-${sectionIndex}`} 
                className="shortsLandscapeRow"
                style={{ 
                  width: '100vw',
                  maxWidth: '100vw',
                  boxSizing: 'border-box',
                  marginLeft: `-${GUTTER_PX}px`,
                  marginRight: `-${GUTTER_PX}px`,
                  marginBottom: `${GUTTER_PX}px`,
                  position: 'relative',
                  left: 0,
                  paddingLeft: 0,
                  paddingRight: 0
                }}
              >
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
          
          if (section.type === 'portrait-grid' && section.items) {
            return (
              <div 
                key={`portrait-grid-${sectionIndex}`} 
                className="grid grid-cols-2" 
                style={{ gap: `${GUTTER_PX}px`, marginBottom: `${GUTTER_PX}px` }}
              >
                {section.items.map(({ item, index, height }) => (
                  <ShortCardWithObserver
                    key={item.id}
                    item={item}
                    onClick={() => handleCardClick(item, index)}
                    height={baseHeightPx}
                    onVisibilityChange={handleVisibilityChange}
                    onLike={onLike}
                    onAuthorClick={onAuthorClick}
                    currentUserId={currentUserId}
                  />
                ))}
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
