/**
 * LongFormGrid - Single column grid for long-form videos (≥4 min)
 * Uses adaptive aspect ratio tiles that support both portrait and landscape
 */

import { useRef, useEffect } from 'react';
import { LongFormVideoTile } from './LongFormVideoTile';
import { GridPost } from './types';
import { Loader2 } from 'lucide-react';

interface LongFormGridProps {
  posts: GridPost[];
  onPostTap: (post: GridPost, index: number) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isReady?: (id: string) => boolean;    // NEW: Video ready state checker
  onReady?: (id: string) => void;        // NEW: Video ready callback
}

export function LongFormGrid({
  posts,
  onPostTap,
  hasMore,
  onLoadMore,
  isLoading,
  isReady = () => true,
  onReady,
}: LongFormGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Use IntersectionObserver for infinite scroll
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
    <div className="flex flex-col gap-4 px-4">
      {posts.map((post, index) => (
        <LongFormVideoTile
          key={post.id}
          post={post}
          onClick={() => onPostTap(post, index)}
          isVideoReady={isReady(post.id)}
          onReady={onReady}
        />
      ))}
      
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
          You've seen all videos
        </div>
      )}
    </div>
  );
}
