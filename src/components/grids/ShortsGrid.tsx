/**
 * ShortsGrid - 3 column grid for short videos (<4 min)
 * Minimal gap (2px) between tiles for dense layout
 */

import { useRef, useEffect } from 'react';
import { ShortVideoTile } from './ShortVideoTile';
import { GridPost } from './types';
import { Loader2 } from 'lucide-react';

interface ShortsGridProps {
  posts: GridPost[];
  onPostTap: (post: GridPost, index: number) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export function ShortsGrid({
  posts,
  onPostTap,
  hasMore,
  onLoadMore,
  isLoading,
}: ShortsGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || !onLoadMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);
  
  return (
    <div className="px-1">
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post, index) => (
          <ShortVideoTile
            key={post.id}
            post={post}
            onClick={() => onPostTap(post, index)}
          />
        ))}
      </div>
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoading && (
            <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
          )}
        </div>
      )}
      
      {/* End state */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-[#64748b] text-sm">
          You've seen all shorts
        </div>
      )}
    </div>
  );
}
