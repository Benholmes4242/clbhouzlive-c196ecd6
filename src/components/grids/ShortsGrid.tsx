/**
 * ShortsGrid - Unified Watch Tab Standard
 * 
 * All tiles are uniform 3:4 portrait in a 2-column grid
 * - 3px gap and padding
 * - Diagonal autoplay pattern (index % 4 === 0 || index % 4 === 3)
 * - Paced infinite scroll with 600ms hold
 * - Grey shimmer loading states
 * - Fade-up entrance animation
 * - Loading skeleton for initial load
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ShortVideoTile } from './ShortVideoTile';
import { GridPost } from './types';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

// Paced loading constants (Watch tab standard)
const MIN_LOADING_DISPLAY_MS = 600;
const TILE_ENTRANCE_STAGGER_MS = 30;

// Helper to extract stream UID from post for cache consistency
const getStreamId = (post: GridPost): string => {
  const videoUrl = post.post_media?.[0]?.media_url;
  return uidFromNode({ src: videoUrl }) || post.id;
};

interface ShortsGridProps {
  posts: GridPost[];
  onPostTap: (post: GridPost, index: number) => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isReady?: (id: string) => boolean;
  onReady?: (id: string) => void;
}

export function ShortsGrid({
  posts,
  onPostTap,
  hasMore,
  onLoadMore,
  isLoading,
  isReady = () => true,
  onReady,
}: ShortsGridProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  
  // Paced loading state
  const loadStartTimeRef = useRef<number>(0);
  const [newlyLoadedStartIndex, setNewlyLoadedStartIndex] = useState<number | null>(null);
  const prevPostsCountRef = useRef(posts.length);
  const [isPacingDelay, setIsPacingDelay] = useState(false);
  const [renderedPosts, setRenderedPosts] = useState<GridPost[]>(posts);

  // Reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Handle paced loading when new posts arrive
  useEffect(() => {
    const prevCount = prevPostsCountRef.current;
    const newCount = posts.length;
    
    if (newCount > prevCount && loadStartTimeRef.current > 0) {
      const elapsed = Date.now() - loadStartTimeRef.current;
      const remaining = Math.max(0, MIN_LOADING_DISPLAY_MS - elapsed);
      
      if (remaining > 0) {
        setIsPacingDelay(true);
        const timer = setTimeout(() => {
          setRenderedPosts(posts);
          setNewlyLoadedStartIndex(prevCount);
          setIsPacingDelay(false);
          loadStartTimeRef.current = 0;
          setTimeout(() => setNewlyLoadedStartIndex(null), 500);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setRenderedPosts(posts);
        setNewlyLoadedStartIndex(prevCount);
        loadStartTimeRef.current = 0;
        setTimeout(() => setNewlyLoadedStartIndex(null), 500);
      }
    } else if (newCount !== prevCount) {
      setRenderedPosts(posts);
    }
    
    prevPostsCountRef.current = newCount;
  }, [posts]);

  // Infinite scroll with rootMargin: 0px (Watch tab standard)
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || !onLoadMore) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadingRef.current = true;
          loadStartTimeRef.current = Date.now();
          onLoadMore();
          setTimeout(() => { loadingRef.current = false; }, 1000);
        }
      },
      { rootMargin: '0px' } // Watch tab standard: trigger at bottom
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);
  
  // Show loading indicator
  const showBottomLoader = isLoading || isPacingDelay;

  // Initial loading skeleton
  const showInitialSkeleton = isLoading && renderedPosts.length === 0;
  
  return (
    <div className="px-[3px]">
      {/* Initial loading skeleton — 6 tiles in 2-column grid */}
      {showInitialSkeleton && (
        <div className="grid grid-cols-2 gap-[3px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* 2-column grid - Watch tab standard: 3px gap */}
      {!showInitialSkeleton && (
        <div className="grid grid-cols-2 gap-[3px]">
          {renderedPosts.map((post, index) => {
            // CRITICAL: Use stream UID for cache lookup
            const streamId = getStreamId(post);
            
            // Diagonal autoplay pattern (Watch tab standard)
            const isAutoplayCandidate = index % 4 === 0 || index % 4 === 3;
            
            // Entrance animation for newly loaded tiles
            const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
            const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * TILE_ENTRANCE_STAGGER_MS : 0;
            
            return (
              <div
                key={post.id}
                className={isNewlyLoaded && !prefersReducedMotion 
                  ? 'animate-in fade-in slide-in-from-bottom-2 duration-200 fill-mode-backwards' 
                  : undefined
                }
                style={isNewlyLoaded && !prefersReducedMotion 
                  ? { animationDelay: `${entranceDelay}ms` } 
                  : undefined
                }
              >
                <ShortVideoTile
                  post={post}
                  onClick={() => onPostTap(post, index)}
                  isVideoReady={isReady(streamId)}
                  onReady={onReady}
                  isAutoplayCandidate={isAutoplayCandidate}
                />
              </div>
            );
          })}
        </div>
      )}
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-4" />
      )}
      
      {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
      {showBottomLoader && !showInitialSkeleton && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {/* End state */}
      {!hasMore && posts.length > 0 && !isLoading && !isPacingDelay && (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <div className="w-12 h-0.5 bg-muted/40 rounded-full mb-3" />
          <p className="text-xs font-medium">You're all caught up</p>
        </div>
      )}
    </div>
  );
}
