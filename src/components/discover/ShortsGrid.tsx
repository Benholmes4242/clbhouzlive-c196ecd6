import React, { useEffect, useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import ShortsVideoTile from '@/components/shorts/ShortsVideoTile';
import { RowAutoplayProvider } from '@/components/shorts/RowAutoplayProvider';

interface ShortsGridProps {
  items: ExploreContentItem[];
  onOpen: (item: ExploreContentItem) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export default function ShortsGrid({ items, onOpen, isLoading, hasMore, onLoadMore }: ShortsGridProps) {
  const loadingRef = useRef(false);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || loadingRef.current || isLoading) return;

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
    <RowAutoplayProvider>
      <div
        className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-5 pb-4"
        style={{ gap: '1px' }}
      >
        {items.map((item, i) => (
          <ShortsVideoTile
            key={item.id}
            id={item.id}
            index={i}
            hlsUrl={item.src}
            posterUrl={item.thumbnailSrc || item.src}
            onClick={() => onOpen(item)}
          />
        ))}
      </div>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      )}
    </RowAutoplayProvider>
  );
}
