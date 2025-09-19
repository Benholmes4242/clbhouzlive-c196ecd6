import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { HiTrendingUp } from 'react-icons/hi';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';
import { FILTER_TYPES } from './types';

interface ExploreGridProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  activeFilter?: string;
  isClubhousePage?: boolean;
  hideBadges?: boolean;
}

const ExploreGrid: React.FC<ExploreGridProps> = memo(({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore,
  activeFilter,
  isClubhousePage = false,
  hideBadges = false
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Optimized mobile detection
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to clean title text and remove golf course information
  const cleanTitleText = (title: string) => {
    if (!title) return '';
    
    // Remove golf course patterns from title
    return title
      .replace(/\s*Played at\s+[^.!?]*[.!?]?\s*/gi, '')
      .replace(/\s*#golf\s*/gi, '')
      .replace(/\s*#family\s*/gi, '')
      .replace(/\s*#chaos\s*/gi, '')
      .replace(/\s*⛳\s*/gi, '')
      .replace(/\s*📍\s*/gi, '')
      .replace(/\s*🏌️\s*/gi, '')
      .replace(/\s*🏌️‍♂️\s*/gi, '')
      .replace(/\s*🏌️‍♀️\s*/gi, '')
      .trim();
  };
  
  // Function to truncate title to 5 words for preview
  const truncateTitle = (title: string) => {
    const cleanedTitle = cleanTitleText(title);
    if (!cleanedTitle) return '';
    
    const words = cleanedTitle.split(' ');
    if (words.length <= 5) return cleanedTitle;
    
    return words.slice(0, 5).join(' ') + '...';
  };

  // Intersection observer for infinite scroll with preload threshold
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.3 }
    );

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          // Preload more content when close to end
          onLoadMore();
        }
      },
      { threshold: 1.0 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    const preloadSentinel = document.getElementById('preload-sentinel');

    if (sentinel) {
      observer.observe(sentinel);
    }

    if (preloadSentinel) {
      preloadObserver.observe(preloadSentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
      if (preloadSentinel) {
        preloadObserver.unobserve(preloadSentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Don't show skeleton loading on initial load for any filter
  if (isLoading && content.length === 0) {
    return null; // No loading state shown
  }

  if (content.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
        <p className="text-muted-foreground max-w-md">
          {activeFilter === 'Hack Shack' 
            ? "No hacks yet! Be the first to upload a hilarious golf mishit using #hackshack in your post."
            : "Try adjusting your filters or check back later for new content."}
        </p>
      </div>
    );
  }

  // Create simple grid items from content (same as ActivityFeed pattern)
  const gridItems = useMemo(() => {
    return content.map((item, index) => {
      // Determine if it's a portrait video (simplified logic)
      const isPortrait = item.type === 'video' && Math.random() > 0.7; // Temporary logic
      
      return {
        key: `${item.id}-${index}`,
        item,
        type: isPortrait ? 'portrait' : 'square'
      };
    });
  }, [content]);

  // Check if we should use TrendingVideos-style layout for Friends tab on Clubhouse
  if (isClubhousePage && activeFilter === FILTER_TYPES.FRIENDS) {
    return (
      <>
        {/* TrendingVideos-style Layout for Friends Tab on Clubhouse */}
        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {content.filter(item => item.type === 'video' || item.type === 'image').map((item, index) => (
            <div
              key={`friends-${item.id}-${index}`}
              className="relative overflow-hidden cursor-pointer group aspect-[9/16]"
              style={{ borderRadius: '0px' }}
              onClick={() => onMediaClick?.(item)}
            >
              <ExploreContentCard 
                item={item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
                isPortrait={true}
              />
              
              {/* Golf course overlay for videos */}
              {item.golfCourse && (
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                    <div className="flex items-center text-white">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.golfCourse.name}</p>
                        <p className="text-xs text-white/80 truncate">{item.golfCourse.country}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Title overlay */}
              {item.title && (
                <div className="absolute top-4 left-4 right-4 z-20">
                  <div className="bg-black/40 backdrop-blur-sm rounded-lg p-2">
                    <p className="text-white text-sm font-medium leading-tight">
                      {truncateTitle(item.title)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Trending icon - this shouldn't appear in Friends filter */}
              {/* Removed trending icon as this is specifically the Friends layout */}
              
              {/* Play icon for videos */}
              {item.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="bg-black/50 rounded-full p-4">
                    <MdOutlinePlayCircle className="h-12 w-12 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Preload sentinel and Infinite scroll sentinel */}
        <div id="preload-sentinel" className="h-20" />
        <div id="scroll-sentinel" className="h-4">
          {isLoading && hasMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Simple grid layout (same as Profile Activity) - ALWAYS used now for Discover and all other pages
  return (
    <>
      {/* Simple Grid Layout - same as Profile Activity tab */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-px min-h-0 -mx-0 md:mx-0" style={{ gridAutoRows: 'minmax(auto, max-content)' }}>
        {gridItems.map((gridItem, index) => {
          if (gridItem.type === 'portrait') {
            return (
              <div key={gridItem.key} className="row-span-2 overflow-hidden self-stretch" style={{ gridRow: 'span 2' }}>
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                  isPortrait={true}
                />
              </div>
            );
          } else {
            // Square card
            return (
              <div key={gridItem.key} className="aspect-square">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          }
        })}
      </div>
      
      {/* Preload sentinel and Infinite scroll sentinel */}
      <div id="preload-sentinel" className="h-20" />
      <div id="scroll-sentinel" className="h-4">
        {isLoading && hasMore && activeFilter !== 'Hack Shack' && activeFilter !== 'Videos' && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
});

export default ExploreGrid;