/**
 * ImagesGrid - 3 column grid for images
 * 1:1 square crop with minimal gap (2px)
 */

import { useRef, useEffect } from 'react';
import { GridImageTile } from './GridImageTile';
import { GridPost } from './types';
import { Loader2 } from 'lucide-react';

interface ImagesGridProps {
  posts: GridPost[];
  onPostTap: (post: GridPost, index: number) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

export function ImagesGrid({
  posts,
  onPostTap,
  hasMore,
  onLoadMore,
  isLoading,
}: ImagesGridProps) {
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
          <GridImageTile
            key={post.id}
            post={post}
            onClick={() => onPostTap(post, index)}
            index={index}
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
          You've seen all images
        </div>
      )}
    </div>
  );
}
