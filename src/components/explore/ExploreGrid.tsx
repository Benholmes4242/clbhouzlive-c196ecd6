
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
                isLoading={false}
                onImageError={() => {}}
                onImageLoad={() => {}}
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

  // Check if we should use Discover page layout with dynamic mobile grid
  if (isDiscoverPage) {
    const filteredContent = content.filter(item => item.type === 'video' || item.type === 'image');
    
    // Function to detect aspect ratio of media
    const detectAspectRatio = (item: ExploreContentItem) => {
      // Use a deterministic hash-based approach for consistency
      const hash = item.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      
      if (item.type === 'video') {
        // For videos, distribute based on common aspect ratios
        const videoType = hash % 10;
        if (videoType < 3) return 'portrait'; // 30% portrait (9:16, 4:5)
        if (videoType < 5) return 'landscape'; // 20% landscape (16:9)
        return 'square'; // 50% square (1:1)
      }
      
      // For images, more likely to be square but still have variety
      const imageType = hash % 10;
      if (imageType < 2) return 'portrait'; // 20% portrait
      if (imageType < 3) return 'landscape'; // 10% landscape
      return 'square'; // 70% square
    };

    // Create mobile-specific dynamic layout for activity feed
    const createMobileLayout = () => {
      const layoutItems = [];
      let contentIndex = 0;
      let squareCount = 0;
      let tallCount = 0;
      let heroCount = 0;
      let rowPosition = 0; // Track position in current row (0, 1, 2 for 3-column grid)
      let currentRow = 0;
      let lastTallColumn = -1; // Track last column where tall card was placed
      let squaresSinceLastTall = 0; // Track squares placed since last tall card
      
      // Activity Feed Ratio & Placement Rules (per 20 cards)
      // 70% Squares (1×1) = 14 cards
      // 15% Tall (1×2) = 3 cards  
      // 15% Large (4×4 Hero) = 3 cards
      const totalItems = filteredContent.length;
      const cycleSize = 20;
      const cycles = Math.ceil(totalItems / cycleSize);
      const targetSquares = cycles * 14; // 14 per 20-card cycle
      const targetTalls = cycles * 3;    // 3 per 20-card cycle
      const targetHeroes = cycles * 3;   // 3 per 20-card cycle
      
      while (contentIndex < filteredContent.length) {
        const remainingItems = filteredContent.length - contentIndex;
        let cardType = 'regular';
        
        // Determine card type based on position, quotas, and rules
        
        // Rule 4: Heroes only at row boundaries (start of row)
        if (rowPosition === 0 && heroCount < targetHeroes && remainingItems >= 4) {
          cardType = 'hero';
        }
        // Rule 1: One special per row - check if row already has a special card
        else if (rowPosition < 3) {
          const currentRowHasSpecial = layoutItems.some(item => 
            Math.floor(item.rowIndex || 0) === currentRow && (item.type === 'tall' || item.type === 'hero')
          );
          
          if (!currentRowHasSpecial) {
            // Rule 3: Minimum buffer between tall cards (3 squares since they're rarer now)
            if (tallCount < targetTalls && squaresSinceLastTall >= 3) {
              // Rule 2: Alternating columns for talls
              const canPlaceTall = lastTallColumn === -1 || 
                (rowPosition !== lastTallColumn && Math.abs(rowPosition - lastTallColumn) >= 1);
              
              if (canPlaceTall) {
                const aspectRatio = detectAspectRatio(filteredContent[contentIndex]);
                // Prefer tall cards for portrait content
                if (aspectRatio === 'portrait' || tallCount < targetTalls) {
                  cardType = 'tall';
                }
              }
            }
          }
        }
        
        // Fallback to ensure quotas are met
        if (cardType === 'regular') {
          if (squareCount >= targetSquares && tallCount < targetTalls) {
            cardType = 'tall';
          } else if (squareCount >= targetSquares && heroCount < targetHeroes && rowPosition === 0) {
            cardType = 'hero';
          }
        }
        
        // Rule 6: Fallback rule - if intended slot isn't available, place as square
        if (cardType === 'tall' && rowPosition === 2) {
          cardType = 'regular'; // Can't fit tall in last column
        }
        if (cardType === 'hero' && rowPosition !== 0) {
          cardType = 'regular'; // Hero must start at row boundary
        }
        
        const videoCount = filteredContent.slice(0, contentIndex + 1).filter(item => item.type === 'video').length;
        const shouldAutoplay = filteredContent[contentIndex].type === 'video' && videoCount % 5 === 1;
        const aspectRatio = detectAspectRatio(filteredContent[contentIndex]);
        
        layoutItems.push({
          type: cardType,
          item: filteredContent[contentIndex],
          index: contentIndex,
          shouldAutoplay,
          aspectRatio,
          rowIndex: currentRow,
          columnIndex: rowPosition
        });
        
        // Update counters and position tracking
        if (cardType === 'regular') {
          squareCount++;
          squaresSinceLastTall++;
          rowPosition++;
        } else if (cardType === 'tall') {
          tallCount++;
          lastTallColumn = rowPosition;
          squaresSinceLastTall = 0;
          rowPosition++; // Tall card takes 1 column width
        } else if (cardType === 'hero') {
          heroCount++;
          squaresSinceLastTall = 0;
          currentRow += 4; // Hero spans 4 rows
          rowPosition = 0; // Reset to start of new row after hero
        }
        
        // Move to next row when current row is full
        if (rowPosition >= 3) {
          currentRow++;
          rowPosition = 0;
        }
        
        contentIndex++;
      }
      
      return layoutItems;
    };

    // Use mobile layout when on mobile, otherwise keep existing layout
    const createDiscoverLayout = () => {
      const isMobileView = window.innerWidth < 768;
      
      if (isMobileView) {
        return createMobileLayout();
      }
      
      // Desktop layout (existing logic)
      const layoutItems = [];
      let contentIndex = 0;
      let rowCount = 0;
      const colsPerRow = 4;
      
      while (contentIndex < filteredContent.length) {
        rowCount++;
        const remainingItems = filteredContent.length - contentIndex;
        
        // Every third row, try to place a large video card
        if (rowCount % 3 === 0) {
          // Look for a video in the upcoming content for large card
          let largeCardVideo = null;
          let largeCardIndex = -1;
          
          // First try to find a video for the large card
          for (let i = contentIndex; i < Math.min(contentIndex + colsPerRow * 3, filteredContent.length); i++) {
            if (filteredContent[i].type === 'video') {
              largeCardVideo = filteredContent[i];
              largeCardIndex = i;
              break;
            }
          }
          
          // If no video found, use any content item for large card (image can work too)
          if (!largeCardVideo && contentIndex < filteredContent.length) {
            largeCardVideo = filteredContent[contentIndex + Math.min(2, filteredContent.length - contentIndex - 1)];
            largeCardIndex = contentIndex + Math.min(2, filteredContent.length - contentIndex - 1);
          }
          
          if (largeCardVideo && remainingItems >= 3) {
            // Calculate how many regular cards we can fit alongside the large card
            const regularCardsInRow = colsPerRow - 2; // Large card takes 2 columns
            let regularCardsAdded = 0;
            
            // Add regular cards first, skipping the item we'll use for large card
            while (regularCardsAdded < regularCardsInRow && contentIndex < filteredContent.length) {
              if (contentIndex === largeCardIndex) {
                contentIndex++; // Skip the item we'll use for large card
                if (contentIndex >= filteredContent.length) break;
              }
              
              const videoCount = filteredContent.slice(0, contentIndex + 1).filter(item => item.type === 'video').length;
              const shouldAutoplay = filteredContent[contentIndex].type === 'video' && videoCount % 5 === 1;
              
              layoutItems.push({
                type: 'regular',
                item: filteredContent[contentIndex],
                index: contentIndex,
                shouldAutoplay
              });
              contentIndex++;
              regularCardsAdded++;
            }
            
            // Add the large card
            layoutItems.push({
              type: 'large',
              item: largeCardVideo,
              index: largeCardIndex,
              shouldAutoplay: largeCardVideo.type === 'video' // Only autoplay if it's a video
            });
            
            // Skip the item we used for large card if we haven't passed it yet
            if (largeCardIndex >= contentIndex) {
              contentIndex = largeCardIndex + 1;
            }
            
            // The large card spans 2 rows, so increment row count by 1
            rowCount++;
            
            // Add one more row to completely fill the space around the large card
            const nextRowItems = Math.min(colsPerRow, filteredContent.length - contentIndex);
            for (let i = 0; i < nextRowItems; i++) {
              if (contentIndex < filteredContent.length) {
                const videoCount = filteredContent.slice(0, contentIndex + 1).filter(item => item.type === 'video').length;
                const shouldAutoplay = filteredContent[contentIndex].type === 'video' && videoCount % 5 === 1;
                
                layoutItems.push({
                  type: 'regular',
                  item: filteredContent[contentIndex],
                  index: contentIndex,
                  shouldAutoplay
                });
                contentIndex++;
              }
            }
          } else {
            // No video available or not enough content, fill row with regular cards
            const itemsInThisRow = Math.min(colsPerRow, remainingItems);
            for (let i = 0; i < itemsInThisRow; i++) {
              const videoCount = filteredContent.slice(0, contentIndex + 1).filter(item => item.type === 'video').length;
              const shouldAutoplay = filteredContent[contentIndex].type === 'video' && videoCount % 5 === 1;
              
              layoutItems.push({
                type: 'regular',
                item: filteredContent[contentIndex],
                index: contentIndex,
                shouldAutoplay
              });
              contentIndex++;
            }
          }
        } else {
          // Regular row - fill with normal cards
          const itemsInThisRow = Math.min(colsPerRow, remainingItems);
          for (let i = 0; i < itemsInThisRow; i++) {
            const videoCount = filteredContent.slice(0, contentIndex + 1).filter(item => item.type === 'video').length;
            const shouldAutoplay = filteredContent[contentIndex].type === 'video' && videoCount % 5 === 1;
            
            layoutItems.push({
              type: 'regular',
              item: filteredContent[contentIndex],
              index: contentIndex,
              shouldAutoplay
            });
            contentIndex++;
          }
        }
      }
      
      return layoutItems;
    };
    
    const layoutItems = createDiscoverLayout();
    
    // Helper functions for media navigation
    const handlePrevMedia = (itemId: string, mediaLength: number) => {
      setMediaIndices(prev => ({
        ...prev,
        [itemId]: prev[itemId] > 0 ? prev[itemId] - 1 : mediaLength - 1
      }));
    };

    const handleNextMedia = (itemId: string, mediaLength: number) => {
      setMediaIndices(prev => ({
        ...prev,
        [itemId]: prev[itemId] < mediaLength - 1 ? prev[itemId] + 1 : 0
      }));
    };

    // Create touch handlers for swipe detection
    const createTouchHandlers = (itemId: string, mediaLength: number) => {
      let startX = 0;
      let startY = 0;
      
      return {
        onTouchStart: (e: any) => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        },
        onTouchEnd: (e: any) => {
          if (!startX || !startY) return;
          
          const endX = e.changedTouches[0].clientX;
          const endY = e.changedTouches[0].clientY;
          const diffX = startX - endX;
          const diffY = startY - endY;
          
          // Only handle horizontal swipes (ignore vertical scrolling)
          if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            e.preventDefault();
            if (diffX > 0) {
              // Swiped left - next media
              handleNextMedia(itemId, mediaLength);
            } else {
              // Swiped right - previous media
              handlePrevMedia(itemId, mediaLength);
            }
          }
          
          startX = 0;
          startY = 0;
        }
      };
    };
    
    const isMobileView = window.innerWidth < 768;
    
    return (
      <>
        {/* Discover Page Layout - Dynamic Mobile Grid */}
        <div className={`grid ${isMobileView ? 'grid-cols-3' : 'grid-cols-4'} gap-0.5 auto-rows-fr`}>
        {layoutItems.map((layoutItem, index) => {
          const hasMultipleMedia = layoutItem.item.media && layoutItem.item.media.length > 1;
          const currentMediaIndex = mediaIndices[layoutItem.item.id] || 0;
          const currentMedia = hasMultipleMedia ? layoutItem.item.media![currentMediaIndex] : null;

            if (layoutItem.type === 'large') {
              return (
                <div
                  key={`discover-large-${layoutItem.item.id}-${index}`}
                  className={`${isMobileView ? 'col-span-2 row-span-2' : 'col-span-2 row-span-2'} relative overflow-hidden cursor-pointer group aspect-square`}
                  style={{ borderRadius: '0px' }}
                  onClick={() => onMediaClick?.(layoutItem.item)}
                  {...(hasMultipleMedia ? createTouchHandlers(layoutItem.item.id, layoutItem.item.media!.length) : {})}
                >
                   {/* Shimmer loading placeholder */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse z-0">
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                   </div>
                
                {/* Large Video Card - Always Autoplay */}
                <MediaDisplay
                  media={hasMultipleMedia && currentMedia ? {
                    id: currentMedia.id,
                    media_type: currentMedia.media_type,
                    media_url: currentMedia.media_url
                  } : {
                    id: layoutItem.item.id,
                    media_type: layoutItem.item.type as 'video' | 'image',
                    media_url: layoutItem.item.src
                  }}
                  itemTitle={layoutItem.item.title}
                  shouldAutoplay={true}
                  isLoading={false}
                  onImageError={() => {}}
                  onImageLoad={() => {}}
                  itemId={layoutItem.item.id}
                  currentIndex={layoutItem.index}
                  loop={true}
                  hidePlayButton={true}
                />
                
                {/* Context Label */}
                {!hideBadges && (
                  <div className="absolute top-2 left-2 z-30">
                    <div className="bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-md flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white">
                        {(() => {
                          const labels = [
                            '🔥 Trending Now',
                            '🎯 Shot of the Week', 
                            '💡 From the Pros',
                            '⭐ Featured',
                            '🚀 Going Viral',
                            '🏆 Top Pick'
                          ];
                          // Use item ID to consistently pick the same label for the same content
                          const labelIndex = layoutItem.item.id.charCodeAt(0) % labels.length;
                          return labels[labelIndex];
                        })()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Golf Club Tag for large cards - only in full screen modal, not in grid thumbnails */}
                
                {/* Film icon for videos */}
                {layoutItem.item.type === 'video' && (
                  <div className="absolute bottom-3 right-3 z-20">
                    <div 
                      className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center"
                      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                    >
                      <MdOutlinePlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}
                
                {/* Media navigation dots for multiple media */}
                {hasMultipleMedia && (
                  <MediaNavigationDots
                    mediaCount={layoutItem.item.media!.length}
                    currentIndex={currentMediaIndex}
                  />
                )}
                
                {/* User info for large cards */}
                <div className="absolute bottom-3 left-3 right-12">
                  <div className="flex items-center gap-2">
                    <img
                      src={layoutItem.item.user?.avatar || '/placeholder.svg'}
                      alt={layoutItem.item.user?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-base font-medium truncate">
                        {layoutItem.item.user?.name || layoutItem.item.user?.username || 'Anonymous'}
                      </p>
                      {truncateTitle(layoutItem.item.title) && (
                        <p className="text-white/80 text-sm max-w-[75%] md:max-w-none line-clamp-2 md:line-clamp-none">
                          {cleanTitleText(layoutItem.item.title)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hover animation */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              );
            } else if (layoutItem.type === 'tall') {
              return (
                <div
                  key={`discover-tall-${layoutItem.item.id}-${index}`}
                  className={`${isMobileView ? 'col-span-1 row-span-2' : 'col-span-1 row-span-2'} relative overflow-hidden cursor-pointer group`}
                  style={{ borderRadius: '0px' }}
                  onClick={() => onMediaClick?.(layoutItem.item)}
                  {...(hasMultipleMedia ? createTouchHandlers(layoutItem.item.id, layoutItem.item.media!.length) : {})}
                >
                  {/* Shimmer loading placeholder */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                  </div>
                  
                  {/* Tall Portrait Card */}
                  <MediaDisplay
                    media={hasMultipleMedia && currentMedia ? {
                      id: currentMedia.id,
                      media_type: currentMedia.media_type,
                      media_url: currentMedia.media_url
                    } : {
                      id: layoutItem.item.id,
                      media_type: layoutItem.item.type as 'video' | 'image',
                      media_url: layoutItem.item.src
                    }}
                    itemTitle={layoutItem.item.title}
                    shouldAutoplay={layoutItem.shouldAutoplay}
                    isLoading={false}
                    onImageError={() => {}}
                    onImageLoad={() => {}}
                    itemId={layoutItem.item.id}
                    currentIndex={layoutItem.index}
                    loop={true}
                    hidePlayButton={true}
                  />
                  
                  {/* Film icon for videos in tall cards */}
                  {layoutItem.item.type === 'video' && (
                    <div className="absolute bottom-2 right-2 z-20">
                      <div 
                        className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center"
                        style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                      >
                        <MdOutlinePlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    </div>
                  )}
                  
                  {/* Media navigation dots for multiple media */}
                  {hasMultipleMedia && (
                    <MediaNavigationDots
                      mediaCount={layoutItem.item.media!.length}
                      currentIndex={currentMediaIndex}
                    />
                  )}
                  
                  {/* Hover animation */}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              );
            } else {
              return (
                <div
                  key={`discover-regular-${layoutItem.item.id}-${index}`}
                  className="relative overflow-hidden cursor-pointer group aspect-square"
                  style={{ borderRadius: '0px' }}
                  onClick={() => onMediaClick?.(layoutItem.item)}
                  {...(hasMultipleMedia ? createTouchHandlers(layoutItem.item.id, layoutItem.item.media!.length) : {})}
                >
                {/* Shimmer loading placeholder */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse z-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                </div>
                
                {/* Regular Card */}
                <MediaDisplay
                  media={hasMultipleMedia && currentMedia ? {
                    id: currentMedia.id,
                    media_type: currentMedia.media_type,
                    media_url: currentMedia.media_url
                  } : {
                    id: layoutItem.item.id,
                    media_type: layoutItem.item.type as 'video' | 'image',
                    media_url: layoutItem.item.src
                  }}
                  itemTitle={layoutItem.item.title}
                  shouldAutoplay={layoutItem.shouldAutoplay}
                  isLoading={false}
                  onImageError={() => {}}
                  onImageLoad={() => {}}
                  itemId={layoutItem.item.id}
                  currentIndex={layoutItem.index}
                  loop={true}
                  hidePlayButton={true}
                />
                
                {/* Film icon for videos in regular cards */}
                {layoutItem.item.type === 'video' && (
                  <div className="absolute bottom-2 right-2 z-20">
                    <div 
                      className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center"
                      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
                    >
                      <MdOutlinePlayCircle className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  </div>
                )}
                
                  {/* Media navigation dots for multiple media */}
                  {hasMultipleMedia && (
                    <MediaNavigationDots
                      mediaCount={layoutItem.item.media!.length}
                      currentIndex={currentMediaIndex}
                    />
                  )}
                </div>
              );
            }
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
      {/* Instagram-style Grid Layout with Featured Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-0 md:gap-1 auto-rows-fr -mx-0 md:mx-0">
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
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(ExploreGrid);
