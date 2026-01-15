/**
 * ShortsGrid - 2-column mixed layout for short videos (<4 min)
 * Portrait videos: 2-column, 9:16 fixed
 * Landscape videos: Full width (spans both columns), adaptive aspect ratio
 */

import { useRef, useEffect } from 'react';
import { ShortVideoTile } from './ShortVideoTile';
import { LandscapeShortTile } from './LandscapeShortTile';
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
  
  // Helper to determine if video is landscape
  const isLandscape = (post: GridPost): boolean => {
    const media = post.post_media?.[0];
    if (!media) return false;
    
    // Check aspect_ratio field first
    if (media.aspect_ratio != null) {
      return media.aspect_ratio >= 1;
    }
    
    // Fallback to width/height calculation
    if (media.width && media.height) {
      return media.width >= media.height;
    }
    
    // Default to portrait if no data
    return false;
  };
  
  return (
    <div className="px-1">
      {/* 2-column grid - landscape videos span both columns */}
      <div className="grid grid-cols-2 gap-0.5">
        {posts.map((post, index) => {
          if (isLandscape(post)) {
            // Landscape: full width (spans 2 columns)
            return (
              <div key={post.id} className="col-span-2">
                <LandscapeShortTile
                  post={post}
                  onClick={() => onPostTap(post, index)}
                />
              </div>
            );
          }
          
          // Portrait/Square/Unknown: regular 2-column grid item
          return (
            <ShortVideoTile
              key={post.id}
              post={post}
              onClick={() => onPostTap(post, index)}
            />
          );
        })}
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
