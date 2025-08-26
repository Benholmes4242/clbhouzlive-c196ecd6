
import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { MdOutlinePlayCircle } from 'react-icons/md';
import { HiTrendingUp } from 'react-icons/hi';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';
import MediaDisplay from './MediaDisplay';
import { MediaNavigationDots } from '@/components/posts/user-post/overlays/MediaNavigationDots';
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
  isDiscoverPage?: boolean;
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
  isDiscoverPage = false,
  hideBadges = false
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [mediaIndices, setMediaIndices] = useState<{[key: string]: number}>({});
  const [itemLoadingStates, setItemLoadingStates] = useState<{[key: string]: boolean}>({});

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

  // Temporarily disable autoplay manager to fix loading issues
  // const autoplayManager = useAutoplayManager({ interval: 8, threshold: 0.5 });
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

    // Preload observer - triggers earlier to preload content
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          // Trigger preload when user is closer to bottom
          const event = new CustomEvent('triggerPreload');
          window.dispatchEvent(event);
        }
      },
      { threshold: 0.8 }
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

  // Helper function to determine if media is portrait (H/W >= 1.1)
  const isPortraitMedia = (item: ExploreContentItem): boolean => {
    // For demo purposes, let's treat every 3rd item as portrait to ensure we have portrait cards
    // In real implementation, you'd check actual image dimensions
    const index = content.indexOf(item);
    return index % 3 === 0; // Every 3rd item is considered portrait
  };

  // Create media queues
  const createMediaQueues = () => {
    const portraitQueue: ExploreContentItem[] = [];
    const generalQueue: ExploreContentItem[] = [];
    
    content.forEach(item => {
      if (isPortraitMedia(item)) {
        portraitQueue.push(item);
        generalQueue.push(item); // Portrait items can also be used in square/hero cards
      } else {
        generalQueue.push(item);
      }
    });
    
    return { portraitQueue, generalQueue };
  };

  // Create mobile layout (3 columns, section-based)
  const createMobileGridLayout = () => {
    const { portraitQueue, generalQueue } = createMediaQueues();
    const gridItems = [];
    let portraitIndex = 0;
    let generalIndex = 0;
    let sectionIndex = 0;
    let heroCount = 0; // Track hero sections for alternation
    
    while (generalIndex < generalQueue.length && sectionIndex < 20) { // Limit sections
      const isHeroSection = (sectionIndex + 1) % 3 === 0; // Every 3rd section (3,6,9...)
      
      if (isHeroSection) {
        // Hero section
        const isHeroOnRight = heroCount % 2 === 0; // Alternate hero position: 0→right, 1→left, 2→right, etc.
        
        // Add hero card
        if (generalIndex < generalQueue.length) {
          gridItems.push({
            type: 'hero',
            item: generalQueue[generalIndex++],
            key: `hero-${sectionIndex}-${generalQueue[generalIndex - 1]?.id}`,
            sectionIndex,
            isOnRight: isHeroOnRight
          });
        }
        
        // Add 2 stacked squares on opposite side
        for (let i = 0; i < 2 && generalIndex < generalQueue.length; i++) {
          gridItems.push({
            type: 'square',
            item: generalQueue[generalIndex++],
            key: `square-hero-${sectionIndex}-${i}-${generalQueue[generalIndex - 1]?.id}`,
            sectionIndex,
            row: i + 1,
            isHeroSection: true,
            heroOnRight: isHeroOnRight
          });
        }
        
        heroCount++; // Increment hero counter for alternation
      } else {
        // Standard section
        const isPortraitOnRight = sectionIndex % 2 === 0; // Alternate portrait position: 0→right, 1→left, 2→right, etc.
        
        // Add portrait card (spans 2 rows)
        if (portraitIndex < portraitQueue.length) {
          gridItems.push({
            type: 'portrait',
            item: portraitQueue[portraitIndex++],
            key: `portrait-${sectionIndex}-${portraitQueue[portraitIndex - 1]?.id}`,
            sectionIndex,
            isOnRight: isPortraitOnRight
          });
        }
        
        // Add 4 squares (2 top row, 2 bottom row)
        for (let row = 1; row <= 2; row++) {
          for (let col = 0; col < 2 && generalIndex < generalQueue.length; col++) {
            gridItems.push({
              type: 'square',
              item: generalQueue[generalIndex++],
              key: `square-${sectionIndex}-${row}-${col}-${generalQueue[generalIndex - 1]?.id}`,
              sectionIndex,
              row,
              col,
              portraitOnRight: isPortraitOnRight
            });
          }
        }
      }
      
      sectionIndex++;
    }
    
    return gridItems;
  };

  // Create layout with fixed grid structure - 2 rows per section (Desktop)
  const createGridLayout = () => {
    const { portraitQueue, generalQueue } = createMediaQueues();
    const gridItems = [];
    let portraitIndex = 0;
    let generalIndex = 0;
    let sectionIndex = 0;
    
    while (generalIndex < generalQueue.length && sectionIndex < 10) { // Limit sections to prevent infinite loop
      const isPortraitOnRight = sectionIndex % 2 === 0; // Section 0,2,4... = right, Section 1,3,5... = left
      
      // Add portrait card first (spans rows 1 and 2 of this section)
      if (portraitIndex < portraitQueue.length) {
        gridItems.push({
          type: 'portrait',
          item: portraitQueue[portraitIndex++],
          key: `portrait-${sectionIndex}-${portraitQueue[portraitIndex - 1]?.id}`,
          sectionIndex,
          isOnRight: isPortraitOnRight
        });
      }
      
      // Row 1: 3 squares (portrait takes up column 1 or 4)
      for (let i = 0; i < 3 && generalIndex < generalQueue.length; i++) {
        gridItems.push({
          type: 'square',
          item: generalQueue[generalIndex++],
          key: `square-${sectionIndex}-1-${i}-${generalQueue[generalIndex - 1]?.id}`,
          sectionIndex,
          row: 1,
          position: i
        });
      }
      
      // Row 2: 3 squares (portrait continues in column 1 or 4)
      for (let i = 0; i < 3 && generalIndex < generalQueue.length; i++) {
        gridItems.push({
          type: 'square',
          item: generalQueue[generalIndex++],
          key: `square-${sectionIndex}-2-${i}-${generalQueue[generalIndex - 1]?.id}`,
          sectionIndex,
          row: 2,
          position: i
        });
      }
      
      sectionIndex++;
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

  // Function to get aspect ratio for masonry layout
  const getAspectRatio = (index: number) => {
    const ratios = [
      { aspect: 'aspect-square', gridRow: 'row-span-4' }, // 1080x1080
      { aspect: 'aspect-[4/5]', gridRow: 'row-span-5' },  // 1080x1350
      { aspect: 'aspect-[9/16]', gridRow: 'row-span-7' }  // 1080x1920
    ];
    return ratios[index % ratios.length];
  };

  // Check if we should use Discover page layout - use new grid structure (desktop only)
  if (isDiscoverPage && !isMobile) {
    const gridItems = createGridLayout();
    
    return (
      <>
        {/* New Grid Layout for Discover Page - Section-based with alternating portraits */}
        <div className="grid grid-cols-4 gap-px" style={{ gridAutoRows: '1fr' }}>
          {(() => {
            const sections = [];
            let currentSection = 0;
            let itemIndex = 0;
            
            while (itemIndex < gridItems.length && currentSection < 10) {
              const sectionItems = gridItems.filter(item => item.sectionIndex === currentSection);
              const isPortraitOnRight = currentSection % 2 === 0;
              
              if (sectionItems.length === 0) break;
              
              // Find portrait and square items for this section
              const portraitItem = sectionItems.find(item => item.type === 'portrait');
              const squareItems = sectionItems.filter(item => item.type === 'square');
              
              // Section starts here - 2 rows
              const sectionStart = currentSection * 2;
              
              // Row 1: 3 squares + portrait top half
              const row1Squares = squareItems.filter(item => item.row === 1).slice(0, 3);
              const row2Squares = squareItems.filter(item => item.row === 2).slice(0, 3);
              
              // Add row 1 items
              if (isPortraitOnRight) {
                // Portrait on right: squares in cols 1,2,3, portrait in col 4
                row1Squares.forEach((item, idx) => {
                  sections.push(
                    <div key={item.key} className="aspect-square" style={{ gridColumn: idx + 1, gridRow: sectionStart + 1 }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full"
                        onClick={() => onMediaClick?.(item.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: item.item.id,
                            media_type: item.item.type as 'video' | 'image',
                            media_url: item.item.src
                          }}
                          itemTitle={item.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[item.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          itemId={item.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                        
                        {/* Multiple media indicator */}
                        {item.item.media && item.item.media.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <MediaNavigationDots
                              mediaCount={item.item.media.length}
                              currentIndex={0}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
                
                // Portrait card (spans 2 rows)
                if (portraitItem) {
                  sections.push(
                    <div key={portraitItem.key} className="aspect-[1/2] mb-px" style={{ gridColumn: 4, gridRow: 'span 2' }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full w-full"
                        style={{ height: '100%' }}
                        onClick={() => onMediaClick?.(portraitItem.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: portraitItem.item.id,
                            media_type: portraitItem.item.type as 'video' | 'image',
                            media_url: portraitItem.item.src
                          }}
                          itemTitle={portraitItem.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[portraitItem.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [portraitItem.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [portraitItem.item.id]: false }));
                          }}
                          itemId={portraitItem.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                        
                        {/* Multiple media indicator */}
                        {portraitItem.item.media && portraitItem.item.media.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <MediaNavigationDots
                              mediaCount={portraitItem.item.media.length}
                              currentIndex={0}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              } else {
                // Portrait on left: portrait in col 1, squares in cols 2,3,4
                if (portraitItem) {
                  sections.push(
                    <div key={portraitItem.key} className="aspect-[1/2] mb-px" style={{ gridColumn: 1, gridRow: 'span 2' }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full w-full"
                        style={{ height: '100%' }}
                        onClick={() => onMediaClick?.(portraitItem.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: portraitItem.item.id,
                            media_type: portraitItem.item.type as 'video' | 'image',
                            media_url: portraitItem.item.src
                          }}
                          itemTitle={portraitItem.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[portraitItem.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [portraitItem.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [portraitItem.item.id]: false }));
                          }}
                          itemId={portraitItem.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                        
                        {/* Multiple media indicator */}
                        {portraitItem.item.media && portraitItem.item.media.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                            <MediaNavigationDots
                              mediaCount={portraitItem.item.media.length}
                              currentIndex={0}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                
                row1Squares.forEach((item, idx) => {
                  sections.push(
                    <div key={item.key} className="aspect-square" style={{ gridColumn: idx + 2, gridRow: sectionStart + 1 }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full"
                        onClick={() => onMediaClick?.(item.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: item.item.id,
                            media_type: item.item.type as 'video' | 'image',
                            media_url: item.item.src
                          }}
                          itemTitle={item.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[item.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          itemId={item.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                });
              }
              
              // Row 2 squares
              if (isPortraitOnRight) {
                row2Squares.forEach((item, idx) => {
                  sections.push(
                    <div key={item.key} className="aspect-square" style={{ gridColumn: idx + 1, gridRow: sectionStart + 2 }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full"
                        onClick={() => onMediaClick?.(item.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: item.item.id,
                            media_type: item.item.type as 'video' | 'image',
                            media_url: item.item.src
                          }}
                          itemTitle={item.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[item.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          itemId={item.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                });
              } else {
                row2Squares.forEach((item, idx) => {
                  sections.push(
                    <div key={item.key} className="aspect-square" style={{ gridColumn: idx + 2, gridRow: sectionStart + 2 }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full"
                        onClick={() => onMediaClick?.(item.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: item.item.id,
                            media_type: item.item.type as 'video' | 'image',
                            media_url: item.item.src
                          }}
                          itemTitle={item.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[item.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          itemId={item.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                });
              } // Fixed row3Squares reference issue
              
              currentSection++;
            }
            
            return sections;
          })()}
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

  // Check if mobile for new 3-column layout
  if (isMobile) {
    const mobileGridItems = createMobileGridLayout();
    
    return (
      <>
        {/* Mobile 3-column section-based layout */}
        <div className="grid grid-cols-3 gap-px" style={{ gridAutoRows: '1fr' }}>
          {(() => {
            const sections = [];
            let currentSection = 0;
            
            while (currentSection < 20) {
              const sectionItems = mobileGridItems.filter(item => item.sectionIndex === currentSection);
              if (sectionItems.length === 0) break;
              
              const isHeroSection = (currentSection + 1) % 3 === 0;
              const sectionStart = currentSection * 2; // Each section is 2 rows tall
              
              if (isHeroSection) {
                // Hero section
                const heroItem = sectionItems.find(item => item.type === 'hero');
                const squareItems = sectionItems.filter(item => item.type === 'square');
                const isHeroOnRight = heroItem?.isOnRight ?? true; // Use the isOnRight property from the grid item
                
                if (heroItem) {
                  const heroCol = isHeroOnRight ? 2 : 1;
                  sections.push(
                    <div key={heroItem.key} className="col-span-2 row-span-2 aspect-square" style={{ gridColumn: `${heroCol} / ${heroCol + 2}`, gridRow: 'span 2' }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full w-full"
                        onClick={() => onMediaClick?.(heroItem.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: heroItem.item.id,
                            media_type: heroItem.item.type as 'video' | 'image',
                            media_url: heroItem.item.src
                          }}
                          itemTitle={heroItem.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[heroItem.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [heroItem.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [heroItem.item.id]: false }));
                          }}
                          itemId={heroItem.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                }
                
                // Add 2 stacked squares on opposite side
                squareItems.forEach((item, idx) => {
                  const squareCol = isHeroOnRight ? 1 : 3;
                  sections.push(
                    <div key={item.key} className="aspect-square" style={{ gridColumn: squareCol, gridRow: sectionStart + 1 + idx }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full w-full"
                        onClick={() => onMediaClick?.(item.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: item.item.id,
                            media_type: item.item.type as 'video' | 'image',
                            media_url: item.item.src
                          }}
                          itemTitle={item.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[item.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          itemId={item.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                });
              } else {
                // Standard section
                const portraitItem = sectionItems.find(item => item.type === 'portrait');
                const squareItems = sectionItems.filter(item => item.type === 'square');
                const isPortraitOnRight = currentSection % 2 === 0;
                
                // Add portrait card (spans 2 rows)
                if (portraitItem) {
                  const portraitCol = isPortraitOnRight ? 3 : 1;
                  sections.push(
                    <div key={portraitItem.key} className="aspect-[1/2] row-span-2 mb-px" style={{ gridColumn: portraitCol, gridRow: 'span 2' }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full w-full"
                        style={{ height: '100%' }}
                        onClick={() => onMediaClick?.(portraitItem.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: portraitItem.item.id,
                            media_type: portraitItem.item.type as 'video' | 'image',
                            media_url: portraitItem.item.src
                          }}
                          itemTitle={portraitItem.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[portraitItem.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [portraitItem.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [portraitItem.item.id]: false }));
                          }}
                          itemId={portraitItem.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                }
                
                // Add 4 squares in 2x2 grid
                squareItems.forEach((item, idx) => {
                  const row = Math.floor(idx / 2) + 1; // Row 1 or 2
                  const colOffset = idx % 2; // 0 or 1
                  const baseCol = isPortraitOnRight ? 1 : 2; // Start at col 1 or 2
                  const col = baseCol + colOffset;
                  
                  sections.push(
                    <div key={item.key} className="aspect-square" style={{ gridColumn: col, gridRow: sectionStart + row }}>
                      <div
                        className="relative bg-muted overflow-hidden cursor-pointer group transition-all h-full w-full"
                        onClick={() => onMediaClick?.(item.item)}
                      >
                        <MediaDisplay
                          media={{
                            id: item.item.id,
                            media_type: item.item.type as 'video' | 'image',
                            media_url: item.item.src
                          }}
                          itemTitle={item.item.title}
                          shouldAutoplay={false}
                          isLoading={itemLoadingStates[item.item.id] ?? true}
                          onImageError={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          onImageLoad={() => {
                            setItemLoadingStates(prev => ({ ...prev, [item.item.id]: false }));
                          }}
                          itemId={item.item.id}
                          currentIndex={0}
                          loop={true}
                        />
                      </div>
                    </div>
                  );
                });
              }
              
              currentSection++;
            }
            
            return sections;
          })()}
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

  return (
    <>
      {/* Fixed Grid Layout with Square and Portrait Cards */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-px -mx-0 md:mx-0" style={{ gridAutoRows: '1fr' }}>
        {gridItems.map((gridItem) => {
          if (gridItem.type === 'portrait') {
            return (
              <div key={gridItem.key} className="aspect-[1/2] mb-px" style={{ gridRow: 'span 2' }}>
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                />
              </div>
            );
          } else if (gridItem.type === 'hero') {
            return (
              <div key={gridItem.key} className="col-span-2 row-span-2 aspect-square">
                <ExploreContentCard 
                  item={gridItem.item} 
                  onLike={onLike} 
                  onFollow={onFollow} 
                  onMediaClick={onMediaClick}
                  isFeatured={true}
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
