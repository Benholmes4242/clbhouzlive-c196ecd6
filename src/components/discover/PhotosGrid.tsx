import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';
import { useLocation } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import HighQualityImage from '@/components/ui/high-quality-image';
import { useLazyTiles } from '@/components/shared/grid/useLazyTiles';

interface PhotosGridProps {
  items: ExploreContentItem[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpenLightbox?: (item: ExploreContentItem, index: number) => void;
}

/**
 * Hook to track when the app window/tab regains focus or visibility
 * Increments a counter on visibility change, useful for forcing re-renders/resets
 */
function useVisibilityTick() {
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setTick(t => t + 1);
      }
    };
    
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);
  
  return tick;
}

export default function PhotosGrid({ 
  items, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onOpenLightbox 
}: PhotosGridProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [itemLoadingStates, setItemLoadingStates] = useState<Record<string, boolean>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Track route changes and visibility changes
  const location = useLocation();
  const visibilityTick = useVisibilityTick();

  // Reset loading states on content change, route change, or visibility change
  useEffect(() => {
    if (!items?.length) {
      setItemLoadingStates({});
      return;
    }
    
    // Always rebuild loading state fresh for current dataset
    setItemLoadingStates(() => {
      const next: Record<string, boolean> = {};
      for (const item of items) {
        next[item.id] = true; // Always initialize to loading
      }
      return next;
    });
  }, [
    items,             // Data changed
    location.key,      // Route changed (navigated away/back or query params changed)
    visibilityTick     // App regained focus (user returned from another tab/window)
  ]);

  // Memoized handler to flip tiles to loaded state
  const handleTileLoaded = useCallback((id: string) => {
    setItemLoadingStates(prev => (prev[id] === false ? prev : { ...prev, [id]: false }));
  }, []);

  // Optimized mobile detection
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [checkMobile]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.3 }
    );

    const sentinel = document.getElementById('photos-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">📷</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No photos yet</h3>
        <p className="text-muted-foreground max-w-md">
          Try a different filter or check back later for new content.
        </p>
      </div>
    );
  }

  const columns = isMobile ? 3 : 4;

  // Lazy loading: only render items in/near viewport
  const { visibleIndices, registerTile } = useLazyTiles({
    totalItems: items.length,
    initialVisible: columns * 3, // First 3 rows
    preloadViewports: 2,
    estimatedRowHeight: 150,
  });

  return (
    <>
      {/* Masonry Grid - CSS columns approach for simplicity */}
      <div 
        className="w-full max-w-[1200px] mx-auto"
        style={{
          columnCount: columns,
          columnGap: isMobile ? '0px' : '0px',
          rowGap: '0px'
        }}
      >
        {items.map((item, index) => {
          const isVisible = visibleIndices.has(index);
          
          // Render placeholder for items not yet visible
          if (!isVisible) {
            return (
              <div
                key={`placeholder-${item.id}-${index}`}
                ref={(el) => el && registerTile(index, el)}
                data-lazy-index={index}
                className="relative break-inside-avoid mb-0 aspect-square bg-muted/20"
                style={{ display: 'inline-block', width: '100%' }}
              />
            );
          }
          
          return (
          <div
            key={`${item.id}-${index}`}
            className="relative break-inside-avoid mb-0"
            style={{ display: 'inline-block', width: '100%' }}
            onMouseEnter={() => !isMobile && setHoveredId(item.id)}
            onMouseLeave={() => !isMobile && setHoveredId(null)}
          >
            {/* Photo Card */}
            <div 
              className="relative overflow-hidden cursor-pointer group"
              onClick={() => onOpenLightbox?.(item, index)}
            >
              {/* Image */}
              <HighQualityImage
                src={item.src}
                alt={item.title || 'Photo'}
                className="w-full h-auto object-cover"
                onLoad={() => handleTileLoaded(item.id)}
                onError={() => handleTileLoaded(item.id)}
              />

              {/* Loading skeleton */}
              {itemLoadingStates[item.id] && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}

              {/* Bottom gradient overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent h-24 pointer-events-none" />

              {/* Course chip (if present) */}
              {item.golfCourse && (
                <div className="absolute bottom-2 inset-x-0 flex justify-center z-10">
                  <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1">
                    ⛳️ {item.golfCourse.name}
                  </div>
                </div>
              )}

              {/* Meta row - avatar + name + likes */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                {/* User avatar */}
                <img
                  src={item.user?.avatar || '/placeholder.svg'}
                  alt={item.user?.name || 'Golfer'}
                  className="w-6 h-6 rounded-full object-cover border border-white/50"
                />
                {/* Display name only - never username */}
                <span className="text-white text-xs font-medium truncate max-w-[80px]">
                  {item.user?.name || 'Golfer'}
                </span>
              </div>

              {/* Quick actions on hover (desktop only) */}
              {!isMobile && hoveredId === item.id && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center gap-4 transition-opacity">
                  <button 
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle like
                    }}
                  >
                    <Heart className="w-6 h-6" />
                    <span className="text-xs">{item.likes}</span>
                  </button>
                  <button 
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle comment
                    }}
                  >
                    <MessageCircle className="w-6 h-6" />
                    <span className="text-xs">{item.comments || 0}</span>
                  </button>
                  <button 
                    className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle share
                    }}
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      <div id="photos-scroll-sentinel" className="h-4 mt-4">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      {/* All caught up message */}
      {!hasMore && items.length > 0 && !isLoading && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">You're all caught up</p>
        </div>
      )}
    </>
  );
}
