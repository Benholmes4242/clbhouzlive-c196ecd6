import React, { useEffect, useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';

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

  useEffect(() => {
    const handleScroll = () => {
      if (!gridRef.current || !hasMore || loadingRef.current || isLoading) return;

      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      const scrollThreshold = scrollHeight - clientHeight - 800; // Trigger 800px before end

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
        className="
          grid
          grid-cols-3
          md:grid-cols-4
          xl:grid-cols-5
          pb-4
        "
        style={{ gap: '1px' }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-muted"
            onClick={() => onOpen(item)}
          >
            <img
              src={item.thumbnailSrc || item.src}
              alt={item.title || ''}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-active:opacity-10 group-hover:opacity-10 bg-black" />
          </button>
        ))}
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
