/**
 * ImagesGrid - 3 column grid for images
 * 1:1 square crop with minimal gap (2px)
 * 
 * Watch Tab Standard:
 * - rootMargin: 0px (trigger at bottom)
 * - 600ms pacing delay
 * - Orange brand spinner
 * - Fade-up entrance animation
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { GridImageTile } from './GridImageTile';
import { GridPost } from './types';

// Paced loading constants (Watch tab standard)
const MIN_LOADING_DISPLAY_MS = 600;
const TILE_ENTRANCE_STAGGER_MS = 30;

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
  
  // Infinite scroll - Watch tab standard: rootMargin 0px
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
  
  return (
    <div className="px-1">
      <div className="grid grid-cols-3 gap-0.5">
        {renderedPosts.map((post, index) => {
          // Entrance animation for newly loaded tiles
          const isNewlyLoaded = newlyLoadedStartIndex !== null && index >= newlyLoadedStartIndex;
          const entranceDelay = isNewlyLoaded ? (index - newlyLoadedStartIndex) * TILE_ENTRANCE_STAGGER_MS : 0;
          
          return (
            <GridImageTile
              key={post.id}
              post={post}
              onClick={() => onPostTap(post, index)}
              index={index}
              isNewlyLoaded={isNewlyLoaded}
              entranceDelay={entranceDelay}
              prefersReducedMotion={prefersReducedMotion}
            />
          );
        })}
      </div>
      
      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-4" />
      )}
      
      {/* Orange brand spinner for paced infinite scroll (Watch tab standard) */}
      {showBottomLoader && (
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
