import React, { useEffect, useRef, useReducer } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortsVideoTile from '@/components/shorts/ShortsVideoTile';
import { getResponsiveCols } from '@/utils/layout';

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

  // Update cols on resize
  useEffect(() => {
    const handler = () => setCols(getResponsiveCols());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Track in-view state per item
  const inViewMap = useRef<Record<string, boolean>>({});
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Create observer once
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        let changed = false;
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.id;
          if (!id) continue;
          const wasInView = inViewMap.current[id];
          const nowInView = e.isIntersecting && e.intersectionRatio >= 0.6;
          if (wasInView !== nowInView) {
            inViewMap.current[id] = nowInView;
            changed = true;
          }
        }
        if (changed) forceUpdate();
      },
      { root: null, threshold: [0, 0.6, 1], rootMargin: '200px 0px' }
    );

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  // Observe all current items whenever items or cols change
  useEffect(() => {
    const io = observerRef.current;
    const root = gridRef.current;
    if (!io || !root) return;

    // Small delay to ensure DOM is ready (especially for initial render)
    const timeoutId = setTimeout(() => {
      const nodes = root.querySelectorAll('[data-id]');
      nodes.forEach(n => io.observe(n));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [items, cols]);

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
