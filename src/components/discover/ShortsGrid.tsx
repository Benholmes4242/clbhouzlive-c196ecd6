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
  const cardRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Track column width to compute pixel-perfect height from aspect ratio
  const [columnWidth, setColumnWidth] = useState(0);
  
  // Performance timing
  const mountTimeRef = useRef<number>(0);

  // Start performance timing
  useEffect(() => {
    mountTimeRef.current = performance.now();
    console.time('[shorts-autoplay-first-frame]');
    console.log('[Shorts] Component mounted at', mountTimeRef.current);
  }, []);

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
      cardRefsMap.current.set(id, element);
      
      // NEW: Observe immediately when card registers, not in separate effect
      if (observerRef.current) {
        observerRef.current.observe(element);
        console.log('[Shorts] Registered and observing card:', id);
      }
    } else {
      // Unregister
      const existing = cardRefsMap.current.get(id);
      if (existing && observerRef.current) {
        observerRef.current.unobserve(existing);
      }
      cardRefsMap.current.delete(id);
    }
  }, []);

  // Create single shared IntersectionObserver on mount
  useEffect(() => {
    if (observerRef.current) return;

    console.log('[Shorts] Creating shared IntersectionObserver');
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates: Record<string, boolean> = {};
        let firstPlayTriggered = false;
        
        entries.forEach((entry) => {
          const cardId = entry.target.getAttribute('data-card-id');
          if (!cardId) return;
          
          const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
          
          if (isVisible) {
            // Determine if this card should autoplay based on position
            const gridPosition = parseInt(entry.target.getAttribute('data-grid-position') || '0', 10);
            const variant = entry.target.getAttribute('data-variant');
            
            let shouldAutoplay = false;
            if (variant === 'landscape') {
              shouldAutoplay = true;
            } else {
              // Portrait cards: position 0 or 3 in repeating pattern of 4
              const positionInPattern = gridPosition % 4;
              shouldAutoplay = positionInPattern === 0 || positionInPattern === 3;
            }
            
            updates[cardId] = shouldAutoplay;
            
            // Track first successful autoplay for telemetry
            if (shouldAutoplay && !firstPlayTriggered) {
              firstPlayTriggered = true;
              console.timeEnd('[shorts-autoplay-first-frame]');
              console.log('[Shorts] First video autoplaying at', performance.now() - mountTimeRef.current, 'ms after mount');
            }
          } else {
            updates[cardId] = false;
          }
        });
        
        setAutoplayMap(prev => ({ ...prev, ...updates }));
      },
      {
        threshold: [0, 0.2, 0.5, 1.0],
        rootMargin: '0px'
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

  // REMOVED: Observer registration now happens in registerCardRef callback
  // This useEffect was running before cards mounted, causing observer to never attach

  // Mark initial above-the-fold cards for immediate attachment & autoplay
  // FIX: Retry until refs are actually registered before checking viewport
  useEffect(() => {
    if (layout.length === 0) return;
    
    console.log('[Shorts] Detecting initial viewport cards');
    
    let tries = 0;
    const maxTries = 10; // Max 10 RAF attempts (~160ms max)
    
    function attemptInitialAutoplay() {
      // Check if we have refs for the first cards yet
      const firstIds = layout.slice(0, 4).map(l => l.item.id);
      const registeredCount = firstIds.filter(id => cardRefsMap.current.has(id)).length;
      
      console.log('[Shorts] Attempt', tries + 1, '- Registered refs:', registeredCount, '/', firstIds.length);
      
      // If we don't have all refs yet and haven't exceeded max tries, retry
      if (registeredCount < firstIds.length && tries < maxTries) {
        tries += 1;
        requestAnimationFrame(attemptInitialAutoplay);
        return;
      }
      
      // Now we have refs (or gave up) - run the existing logic
      const initialAutoplay: Record<string, boolean> = {};
      let count = 0;
      
      // Check first 4 cards (likely above fold)
      layout.slice(0, 4).forEach((layoutItem, idx) => {
        const element = cardRefsMap.current.get(layoutItem.item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
          
          if (isInViewport) {
            // Apply same autoplay pattern logic
            if (layoutItem.variant === 'landscape') {
              initialAutoplay[layoutItem.item.id] = true;
              count++;
            } else {
              const positionInPattern = idx % 4;
              const shouldAutoplay = positionInPattern === 0 || positionInPattern === 3;
              if (shouldAutoplay) {
                initialAutoplay[layoutItem.item.id] = true;
                count++;
              }
            }
          }
        }
      });
      
      if (count > 0) {
        console.log('[Shorts] Marking', count, 'initial cards for immediate autoplay');
        setAutoplayMap(prev => ({ ...prev, ...initialAutoplay }));
      } else {
        console.log('[Shorts] No initial cards found in viewport after', tries, 'attempts');
      }
    }
    
    requestAnimationFrame(attemptInitialAutoplay);
  }, [layout]);

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
