import React, { memo, useState, useEffect } from 'react';
import { ExploreContentItem, FILTER_TYPES } from './types';
import ExploreContentCard from './ExploreContentCard';
import { MapPin } from 'lucide-react';
import { HiTrendingUp } from 'react-icons/hi';
import MediaDisplay from '@/components/explore/MediaDisplay';
// import { useAutoplayManager } from '@/hooks/useAutoplayManager';

interface ExploreGridProps {
  content: ExploreContentItem[];
  onLike: (contentId: string) => void;
  onFollow: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  activeFilter?: string;
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore,
  activeFilter
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
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
  
  // Temporarily disable autoplay manager to fix loading issues
  // const autoplayManager = useAutoplayManager({ interval: 8, threshold: 0.5 });
  // Intersection observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
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

  // Create layout with featured big cards every 9-12 items
  const createGridLayout = () => {
    const gridItems = [];
    let index = 0;
    // Disable video tracking for now
    // let videoIndex = 0; // Track video position for autoplay
    
    while (index < content.length) {
      // Add 8-10 regular items
      const regularItemsCount = Math.min(9 + Math.floor(Math.random() * 3), content.length - index);
      
      for (let i = 0; i < regularItemsCount && index < content.length; i++) {
        // const currentVideoIndex = content[index].type === 'video' ? videoIndex++ : -1;
        gridItems.push({
          type: 'regular',
          item: content[index],
          key: `regular-${content[index].id}`,
          // videoIndex: currentVideoIndex
        });
        index++;
      }
      
      // Add one big featured card if we have more content
      if (index < content.length) {
        // const currentVideoIndex = content[index].type === 'video' ? videoIndex++ : -1;
        gridItems.push({
          type: 'featured',
          item: content[index],
          key: `featured-${content[index].id}`,
          // videoIndex: currentVideoIndex
        });
        index++;
      }
    }
    
    return gridItems;
  };

  const gridItems = createGridLayout();

  // Friends filter - use trending videos layout
  if (activeFilter === FILTER_TYPES.FRIENDS) {
    return (
      <>
        <div className="grid gap-4 grid-cols-3">
          {content.map((item, index) => (
            <div
              key={`friends-${item.id}-${index}`}
              className="relative bg-muted rounded-lg overflow-hidden cursor-pointer group aspect-square"
              onClick={() => onMediaClick?.(item)}
            >
              {/* Only render MediaDisplay for non-CTA items */}
              {item.type !== 'cta' && (
                <MediaDisplay
                  media={{
                    id: item.id,
                    media_type: item.type as 'video' | 'image',
                    media_url: item.src
                  }}
                  itemTitle={item.title}
                  shouldAutoplay={index === 0}
                  isLoading={false}
                  onImageError={() => {}}
                  onImageLoad={() => {}}
                  itemId={item.id}
                  currentIndex={index}
                  loop={index === 0}
                />
              )}
              
              {/* Fallback for CTA items */}
              {item.type === 'cta' && (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">CTA Content</span>
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Golf Club Tag */}
              {item.golfCourse && (
                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 max-w-[70%]">
                  <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-sm font-medium truncate">
                    {item.golfCourse.name}
                  </span>
                </div>
              )}
              
              {/* Trending Icon */}
              <div className="absolute top-3 right-3">
                <HiTrendingUp className="w-8 h-8 drop-shadow-lg" style={{ color: '#f7931e' }} />
              </div>
              
              {/* User info */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2">
                  <img
                    src={item.user?.avatar || '/placeholder.svg'}
                    alt={item.user?.name || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-base font-medium truncate">
                      {item.user?.name || item.user?.username || 'Anonymous'}
                    </p>
                    {truncateTitle(item.title) && (
                      <p className="text-white/80 text-sm truncate">{truncateTitle(item.title)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Infinite scroll sentinel */}
        <div id="scroll-sentinel" className="h-4">
          {isLoading && hasMore && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Instagram-style Grid Layout with Featured Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1 auto-rows-fr">
        {gridItems.map((gridItem) => (
          gridItem.type === 'featured' ? (
            <div key={gridItem.key} className="col-span-2 row-span-2 aspect-square">
              <ExploreContentCard 
                item={gridItem.item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
                isFeatured={true}
              />
            </div>
          ) : (
            <div key={gridItem.key} className="aspect-square">
              <ExploreContentCard 
                item={gridItem.item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
              />
            </div>
          )
        ))}
      </div>
      
      {/* Infinite scroll sentinel */}
      <div id="scroll-sentinel" className="h-4">
        {isLoading && hasMore && activeFilter !== 'Hack Shack' && activeFilter !== 'Videos' && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(ExploreGrid);