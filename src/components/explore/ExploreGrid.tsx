
import React, { memo, useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { HiTrendingUp } from 'react-icons/hi';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';
import MediaDisplay from './MediaDisplay';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
import { FILTER_TYPES } from './types';

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
  isClubhousePage?: boolean;
  isDiscoverPage?: boolean;
  hideBadges?: boolean;
}

const ExploreGrid: React.FC<ExploreGridProps> = ({ 
  content, 
  onLike, 
  onFollow, 
  onMediaClick,
  isLoading, 
  hasMore, 
  onLoadMore,
  activeFilter,
  isClubhousePage = false,
  isDiscoverPage = false,
  hideBadges = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  const [itemLoadingStates, setItemLoadingStates] = useState<{[key: string]: boolean}>({});

  // Check if mobile for TrendingVideos-style layout
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

  // Helper to check if media is portrait (H/W >= 1.1)
  const isPortraitMedia = (item: ExploreContentItem) => {
    // For now, we'll assume all items are eligible for portrait
    // In real implementation, this would check actual media dimensions
    return true;
  };

  // Create system fallback tile
  const createSystemTile = (id: string): ExploreContentItem => ({
    id: `system-${id}`,
    type: 'cta',
    src: '/placeholder.svg',
    title: 'Discover More Golf Content',
    likes: 0,
    ctaTitle: 'Join the Community',
    ctaDescription: 'Follow golfers and discover amazing content',
    ctaButton: 'Explore Now'
  });

  // Queue-based content assignment
  const createQueueBasedLayout = () => {
    // Create queues
    const generalQueue = [...content];
    const portraitQueue = content.filter(isPortraitMedia);
    
    let generalIndex = 0;
    let portraitIndex = 0;
    const gridItems = [];
    let sectionCount = 0;

    while (generalIndex < generalQueue.length || portraitIndex < portraitQueue.length) {
      const isPortraitLeft = sectionCount % 2 === 1; // Alternate portrait position
      
      // Each section has 3 rows with specific layout
      for (let row = 0; row < 3; row++) {
        if (row < 2) {
          // Row 1 & 2: three squares + portrait (top/bottom half)
          for (let col = 0; col < 3; col++) {
            if (generalIndex < generalQueue.length) {
              gridItems.push({
                type: 'square',
                item: generalQueue[generalIndex],
                key: `square-${generalQueue[generalIndex].id}-${sectionCount}-${row}-${col}`,
                position: { section: sectionCount, row, col: isPortraitLeft ? col + 1 : col }
              });
              generalIndex++;
            }
          }
          
          // Add portrait half (only add once per section, not per row)
          if (row === 0) {
            const portraitItem = portraitIndex < portraitQueue.length 
              ? portraitQueue[portraitIndex++] 
              : createSystemTile(`${sectionCount}-portrait`);
            
            gridItems.push({
              type: 'portrait',
              item: portraitItem,
              key: `portrait-${portraitItem.id}-${sectionCount}`,
              position: { 
                section: sectionCount, 
                row: 0, 
                col: isPortraitLeft ? 0 : 3,
                isLeft: isPortraitLeft
              }
            });
          }
        } else {
          // Row 3: four squares
          for (let col = 0; col < 4; col++) {
            if (generalIndex < generalQueue.length) {
              gridItems.push({
                type: 'square',
                item: generalQueue[generalIndex],
                key: `square-${generalQueue[generalIndex].id}-${sectionCount}-${row}-${col}`,
                position: { section: sectionCount, row, col }
              });
              generalIndex++;
            }
          }
        }
      }
      
      sectionCount++;
      
      // Break if we've run out of content
      if (generalIndex >= generalQueue.length && portraitIndex >= portraitQueue.length) {
        break;
      }
    }
    
    return gridItems;
  };

  const gridItems = createQueueBasedLayout();

  // Check if we should use TrendingVideos-style layout for Friends tab on Clubhouse
  if (isClubhousePage && activeFilter === FILTER_TYPES.FRIENDS) {
    return (
      <>
        {/* TrendingVideos-style Layout for Friends Tab on Clubhouse */}
        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {content.filter(item => item.type === 'video' || item.type === 'image').map((item, index) => (
            <div
              key={`friends-${item.id}-${index}`}
              className="relative bg-muted overflow-hidden cursor-pointer group aspect-[9/16]"
              style={{ borderRadius: '0px' }}
              onClick={() => onMediaClick?.(item)}
            >
              {/* Media Display */}
              <MediaDisplay
                media={{
                  id: item.id,
                  media_type: item.type as 'video' | 'image',
                  media_url: item.src
                }}
                itemTitle={item.title}
                shouldAutoplay={false}
                isLoading={itemLoadingStates[item.id] ?? true}
                onImageError={() => {
                  setItemLoadingStates(prev => ({ ...prev, [item.id]: false }));
                }}
                onImageLoad={() => {
                  setItemLoadingStates(prev => ({ ...prev, [item.id]: false }));
                }}
                itemId={item.id}
                currentIndex={index}
                loop={true}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Golf Club Tag */}
              {item.golfCourse && (
                <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm px-3 py-1.5 text-white shadow-lg hover:bg-black/40 transition-colors rounded-full flex items-center gap-2 max-w-[70%]">
                  <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-sm font-medium truncate">
                    {item.golfCourse.name}
                  </span>
                </div>
              )}
              
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
              <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </>
    );
  }

  // Function to get aspect ratio for masonry layout
  const getAspectRatio = (index: number) => {
    const ratios = [
      { aspect: 'aspect-square', gridRow: 'row-span-4' }, // 1080x1080
      { aspect: 'aspect-[4/5]', gridRow: 'row-span-5' },  // 1080x1350
      { aspect: 'aspect-[9/16]', gridRow: 'row-span-7' }  // 1080x1920
    ];
    return ratios[index % ratios.length];
  };

  // Check if we should use Discover page layout - use simple Instagram-style grid like profile
  if (isDiscoverPage) {
    return (
      <>
        {/* Simple Instagram-style grid that works on profile pages */}
        <div className="grid grid-cols-3 gap-px">
          {content.map((item, index) => {
            // Create larger featured cards every 9-12 items
            const isLargeCard = index > 0 && (index + 1) % (9 + Math.floor(index / 50)) === 0;
            
            return (
              <div
                key={`discover-${item.id}-${index}`}
                className={`
                  relative bg-muted overflow-hidden cursor-pointer group transition-all hover:scale-[1.02]
                  ${isLargeCard 
                    ? 'col-span-2 row-span-2 aspect-square' 
                    : 'aspect-square'
                  }
                `}
                onClick={() => onMediaClick?.(item)}
              >
                <MediaDisplay
                  media={{
                    id: item.id,
                    media_type: item.type as 'video' | 'image',
                    media_url: item.src
                  }}
                  itemTitle={item.title}
                  shouldAutoplay={false}
                  isLoading={itemLoadingStates[item.id] ?? true}
                  onImageError={() => {
                    setItemLoadingStates(prev => ({ ...prev, [item.id]: false }));
                  }}
                  onImageLoad={() => {
                    setItemLoadingStates(prev => ({ ...prev, [item.id]: false }));
                  }}
                  itemId={item.id}
                  currentIndex={index}
                  loop={true}
                />
                
                
                {/* Multiple media indicator */}
                {item.media && item.media.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                    <MediaNavigationDots
                      mediaCount={item.media.length}
                      currentIndex={0}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Infinite scroll sentinel */}
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

  return (
    <>
      {/* Desktop: 4-column grid with queue-based layout */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-px auto-rows-fr -mx-0 md:mx-0">
        {gridItems.map((gridItem) => {
          const { type, item, key, position } = gridItem;
          
          if (type === 'portrait') {
            return (
              <div 
                key={key} 
                className={`
                  row-span-2 aspect-[1/2]
                  ${position?.isLeft ? 'col-start-1' : 'col-start-4 md:col-start-4'}
                `}
              >
                <ExploreContentCard 
                  item={item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          }
          
          // Square cards (default)
          return (
            <div key={key} className="aspect-square">
              <ExploreContentCard 
                item={item} 
                onLike={onLike} 
                onFollow={onFollow} 
                onMediaClick={onMediaClick}
              />
            </div>
          );
        })}
      </div>
      
      {/* Infinite scroll sentinel */}
      <div id="scroll-sentinel" className="h-4">
        {isLoading && hasMore && activeFilter !== 'Hack Shack' && activeFilter !== 'Videos' && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(ExploreGrid);
