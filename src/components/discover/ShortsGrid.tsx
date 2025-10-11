import React, { useEffect, useRef, useReducer } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortsVideoTile from '@/components/shorts/ShortsVideoTile';
import { getResponsiveCols } from '@/utils/layout';

// 🔍 AUDIT FLAG - Remove after diagnosis
const AUDIT_SHORTS_AUTOPLAY = true;
let batchCounter = 0;

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ShortsGrid({ items, onOpen, isLoading, hasMore, onLoadMore }: ShortsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const [cols, setCols] = React.useState(getResponsiveCols());
  const prevItemsCountRef = useRef(0);

  // Update cols on resize
  useEffect(() => {
    const handler = () => setCols(getResponsiveCols());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // 🔍 AUDIT: Detect new batch appends
  useEffect(() => {
    if (items.length > prevItemsCountRef.current) {
      const newItemsCount = items.length - prevItemsCountRef.current;
      batchCounter++;
      if (AUDIT_SHORTS_AUTOPLAY) {
        console.log(`[ShortsAudit] 📦 New batch appended`, {
          batchIndex: batchCounter,
          newItems: newItemsCount,
          totalItems: items.length,
          timestamp: performance.now()
        });
      }
    }
    prevItemsCountRef.current = items.length;
  }, [items.length]);

  // Observe visibility for all tiles
  const inViewMap = useRef<Record<string, boolean>>({});
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;
    
    if (AUDIT_SHORTS_AUTOPLAY) {
      console.log(`[ShortsAudit] 🔭 Setting up IntersectionObserver`, {
        threshold: [0, 0.6, 1],
        rootMargin: '200px 0px',
        itemsCount: items.length,
        cols
      });
    }

    const io = new IntersectionObserver(
      entries => {
        let changedCount = 0;
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.id;
          if (!id) continue;
          const wasInView = inViewMap.current[id];
          const nowInView = e.isIntersecting && e.intersectionRatio >= 0.6;
          if (wasInView !== nowInView) {
            changedCount++;
            if (AUDIT_SHORTS_AUTOPLAY) {
              console.log(`[ShortsAudit][${id}] IO visibility changed`, {
                isIntersecting: e.isIntersecting,
                intersectionRatio: e.intersectionRatio.toFixed(2),
                nowInView,
                boundingClientRect: {
                  top: e.boundingClientRect.top.toFixed(0),
                  bottom: e.boundingClientRect.bottom.toFixed(0)
                }
              });
            }
          }
          inViewMap.current[id] = nowInView;
        }
        if (changedCount > 0) {
          forceUpdate();
        }
      },
      { root: null, threshold: [0, 0.6, 1], rootMargin: '200px 0px' }
    );

    const nodes = root.querySelectorAll('[data-id]');
    if (AUDIT_SHORTS_AUTOPLAY) {
      console.log(`[ShortsAudit] 🔭 Observing ${nodes.length} cards`);
    }
    nodes.forEach(n => io.observe(n));

    return () => io.disconnect();
  }, [items, cols]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || !hasMore || loadingRef.current || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = scrollHeight - clientHeight - 800;

      if (scrollTop > scrollThreshold && onLoadMore) {
        if (AUDIT_SHORTS_AUTOPLAY) {
          console.log(`[ShortsAudit] 📜 Infinite scroll triggered`, {
            scrollTop: scrollTop.toFixed(0),
            scrollThreshold: scrollThreshold.toFixed(0),
            timestamp: performance.now()
          });
        }
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
  // 🔍 AUDIT: Log initial mount
  useEffect(() => {
    if (AUDIT_SHORTS_AUTOPLAY && items.length > 0) {
      console.log(`[ShortsAudit] 🎬 ShortsGrid mounted/updated`, {
        itemsCount: items.length,
        cols,
        firstCardId: items[0]?.id,
        timestamp: performance.now()
      });
    }
  }, []);

  return (
    <>
      <div
        ref={gridRef}
        className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 pb-4"
        style={{ gap: '1px' }}
      >
        {items.map((item, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;

          // Alternating rule:
          // odd rows (0-based even): leftmost auto-plays
          // even rows: rightmost auto-plays
          const leftmost = col === 0;
          const rightmost = col === cols - 1;
          const shouldAutoplay = row % 2 === 0 ? leftmost : rightmost;

          const inView = !!inViewMap.current[item.id];

          // 🔍 AUDIT: Log first 6 cards in each batch for detailed tracking
          const isFirstSix = i < 6 || (i >= prevItemsCountRef.current && i < prevItemsCountRef.current + 6);
          if (AUDIT_SHORTS_AUTOPLAY && isFirstSix) {
            React.useEffect(() => {
              console.log(`[ShortsAudit][${item.id}] Card config`, {
                index: i,
                row,
                col,
                shouldAutoplay,
                inView,
                hlsUrl: item.src,
                posterUrl: item.thumbnailSrc || item.src
              });
            }, []);
          }

          return (
            <div key={item.id} data-id={item.id}>
              <ShortsVideoTile
                id={item.id}
                hlsUrl={item.src}
                posterUrl={item.thumbnailSrc || item.src}
                shouldAutoplay={shouldAutoplay}
                inView={inView}
                onClick={() => onOpen(item)}
              />
            </div>
          );
        })}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}
    </>
  );
}
