import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortCard from '@/components/shorts/ShortCard';
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
const GUTTER_PX = 2 as const;
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
  
  // Shared autoplay state managed by single IntersectionObserver
  const [autoplayMap, setAutoplayMap] = useState<Record<string, boolean>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Track column width to compute pixel-perfect height from aspect ratio
  const [columnWidth, setColumnWidth] = useState(0);

  const updateColumnWidth = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth;
    const col = (containerWidth - GUTTER_PX) / 2; // remove inter-column gap, then split
    setColumnWidth(col);
  }, []);

  useEffect(() => {
    updateColumnWidth();
    window.addEventListener('resize', updateColumnWidth);
    return () => window.removeEventListener('resize', updateColumnWidth);
  }, [updateColumnWidth]);

  // Landscape card height (10% reduction)
  const landscapeHeightPx = useMemo(() => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
    const aspectRatio = 16 / 11.592;
    return Math.round((viewportWidth / aspectRatio) * 0.9); // 10% reduction
  }, []);

  // Portrait cards match landscape card height
  const baseHeightPx = landscapeHeightPx;

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

  // Register card ref for shared observer - observe immediately on registration
  const registerCardRef = useCallback((id: string, element: HTMLDivElement | null) => {
    if (element) {
      // Observe immediately when card registers
      if (observerRef.current) {
        observerRef.current.observe(element);
      }
    } else {
      // Unregister
      const existing = document.querySelector(`[data-card-id="${id}"]`);
      if (existing && observerRef.current) {
        observerRef.current.unobserve(existing);
      }
    }
  }, []);

  // Create single shared IntersectionObserver on mount with simple rule:
  // Left cards (col 0), second-row right cards (col 1, row 2+), and landscape cards autoplay when in view
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardId = entry.target.getAttribute('data-card-id');
          if (!cardId) return;
          
          const variant = entry.target.getAttribute('data-variant');
          const gridPosition = parseInt(entry.target.getAttribute('data-grid-position') || '0', 10);
          const colIndex = gridPosition % 2; // 0 = left, 1 = right
          
          // Simple rule: autoplay if visible AND (landscape OR left card OR second-row+ right card)
          let shouldAutoplay = false;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (variant === 'landscape') {
              shouldAutoplay = true;
            } else {
              // Portrait: left column (0) OR right column position 3+ (second row onwards)
              shouldAutoplay = colIndex === 0 || gridPosition >= 3;
            }
          }
          
          setAutoplayMap(prev => {
            if (prev[cardId] === shouldAutoplay) return prev;
            return { ...prev, [cardId]: shouldAutoplay };
          });
        });
      },
      {
        threshold: [0, 0.5, 1.0],
        rootMargin: '100px'
      }
    );

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
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
          paddingLeft: 0,
          paddingRight: 0,
          boxSizing: 'border-box'
        }}
      >
        {/* First Row - Pinned, Same Height */}
        {firstRow.length > 0 && (
          <div className="grid grid-cols-2" style={{ gap: `${GUTTER_PX}px`, marginBottom: '2px' }}>
            {firstRow.map((layoutItem, posInRow) => (
              <div 
                key={layoutItem.item.id}
                ref={(el) => registerCardRef(layoutItem.item.id, el)}
                data-card-id={layoutItem.item.id}
                data-grid-position={posInRow}
                data-variant="portrait"
              >
                <ShortCard
                  item={layoutItem.item}
                  onClick={() => handleCardClick(layoutItem.item, layoutItem.index)}
                  height={baseHeightPx}
                  isPinned
                  shouldAttach={true}
                  autoplay={autoplayMap[layoutItem.item.id] || false}
                  onLike={onLike}
                  onAuthorClick={onAuthorClick}
                  currentUserId={currentUserId}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Sections: Masonry blocks interspersed with landscape cards */}
        {sections.map((section, sectionIndex) => {
          if (section.type === 'landscape' && section.landscapeItem) {
            return (
              <div 
                key={`landscape-${sectionIndex}`} 
                ref={(el) => registerCardRef(section.landscapeItem.item.id, el)}
                data-card-id={section.landscapeItem.item.id}
                data-grid-position={0}
                data-variant="landscape"
                className="shortsLandscapeRow"
                style={{ 
                  width: '100vw',
                  maxWidth: '100vw',
                  boxSizing: 'border-box',
                  marginLeft: 0,
                  marginBottom: '2px',
                  position: 'relative',
                  left: 0,
                  paddingLeft: 0,
                  paddingRight: 0
                }}
              >
                <ShortCard
                  item={section.landscapeItem.item}
                  onClick={() => handleCardClick(section.landscapeItem.item, section.landscapeItem.index)}
                  height={landscapeHeightPx}
                  shouldAttach={true}
                  autoplay={autoplayMap[section.landscapeItem.item.id] || false}
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
                style={{ gap: `${GUTTER_PX}px`, marginBottom: '2px' }}
              >
                {section.items.map(({ item, index, height }, posInGrid) => {
                  // Calculate global grid position accounting for first row and previous sections
                  const basePosition = firstRow.length; // Start after first row
                  let previousPortraits = 0;
                  for (let i = 0; i < sectionIndex; i++) {
                    if (sections[i].type === 'portrait-grid' && sections[i].items) {
                      previousPortraits += sections[i].items!.length;
                    }
                  }
                  const gridPosition = basePosition + previousPortraits + posInGrid;
                  
                  return (
                    <div
                      key={item.id}
                      ref={(el) => registerCardRef(item.id, el)}
                      data-card-id={item.id}
                      data-grid-position={gridPosition}
                      data-variant="portrait"
                    >
                      <ShortCard
                        item={item}
                        onClick={() => handleCardClick(item, index)}
                        height={baseHeightPx}
                        shouldAttach={true}
                        autoplay={autoplayMap[item.id] || false}
                        onLike={onLike}
                        onAuthorClick={onAuthorClick}
                        currentUserId={currentUserId}
                      />
                    </div>
                  );
                })}
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
