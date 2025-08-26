import React, { memo, useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { ExploreContentItem } from './types';
import ExploreContentCard from './ExploreContentCard';
import MediaDisplay from './MediaDisplay';
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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to clean title text
  const cleanTitleText = (title: string) => {
    if (!title) return '';
    
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
  
  // Function to truncate title to 5 words
  const truncateTitle = (title: string) => {
    const cleanedTitle = cleanTitleText(title);
    if (!cleanedTitle) return '';
    
    const words = cleanedTitle.split(' ');
    if (words.length <= 5) return cleanedTitle;
    
    return words.slice(0, 5).join(' ') + '...';
  };

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

  // Don't show skeleton loading on initial load
  if (isLoading && content.length === 0) {
    return null;
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

  // Content assignment logic with queues
  const isPortraitMedia = (item: ExploreContentItem): boolean => {
    // Check if media has portrait aspect ratio (height > width)
    // For demo purposes, every 3rd item is considered portrait
    // In real implementation, you'd check actual media dimensions
    const index = content.indexOf(item);
    return index % 3 === 0;
  };

  const createContentQueues = () => {
    const generalQueue = [...content]; // All items
    const portraitQueue = content.filter(item => isPortraitMedia(item)); // Portrait-only items
    
    return { generalQueue, portraitQueue };
  };

  const createFallbackTile = (type: 'portrait' | 'square' | 'hero') => ({
    id: `fallback-${type}-${Date.now()}`,
    type: 'image' as const,
    src: '/placeholder.svg',
    title: 'Loading more content...',
    likes: 0,
    user: {
      id: 'fallback',
      name: 'System',
      username: 'system',
      avatar: '/placeholder.svg'
    }
  });

  const createMobileLayout = () => {
    const { generalQueue, portraitQueue } = createContentQueues();
    const items = [];
    let generalIndex = 0;
    let portraitIndex = 0;
    
    for (let section = 0; section < 20; section++) {
      const isHeroSection = (section + 1) % 3 === 0;
      
      if (isHeroSection) {
        // Hero section: 1 hero (2x2) + 2 squares
        const heroIndex = Math.floor(section / 3);
        const heroOnRight = heroIndex % 2 === 0;
        
        // Pull hero from GeneralQueue
        const heroItem = generalIndex < generalQueue.length 
          ? generalQueue[generalIndex++] 
          : createFallbackTile('hero');
        
        items.push({
          type: 'hero',
          item: heroItem,
          heroOnRight,
          section
        });
        
        // Pull 2 squares from GeneralQueue
        for (let i = 0; i < 2; i++) {
          const squareItem = generalIndex < generalQueue.length 
            ? generalQueue[generalIndex++] 
            : createFallbackTile('square');
          
          items.push({
            type: 'square',
            item: squareItem,
            heroOnRight,
            stackIndex: i,
            section
          });
        }
      } else {
        // Standard section: 1 portrait + 4 squares
        const portraitOnRight = section % 2 === 0;
        
        // Pull portrait from PortraitQueue
        const portraitItem = portraitIndex < portraitQueue.length 
          ? portraitQueue[portraitIndex++] 
          : createFallbackTile('portrait');
        
        items.push({
          type: 'portrait',
          item: portraitItem,
          portraitOnRight,
          section
        });
        
        // Pull 4 squares from GeneralQueue
        for (let i = 0; i < 4; i++) {
          const squareItem = generalIndex < generalQueue.length 
            ? generalQueue[generalIndex++] 
            : createFallbackTile('square');
          
          items.push({
            type: 'square',
            item: squareItem,
            portraitOnRight,
            squareIndex: i,
            section
          });
        }
      }
      
      // Stop if we've used all content and don't need more fallbacks
      if (generalIndex >= generalQueue.length && portraitIndex >= portraitQueue.length) {
        break;
      }
    }
    
    return items;
  };

  const createDesktopLayout = () => {
    const { generalQueue, portraitQueue } = createContentQueues();
    const items = [];
    let generalIndex = 0;
    let portraitIndex = 0;
    
    for (let section = 0; section < 10; section++) {
      const portraitOnRight = section % 2 === 0; // Alternate portrait column left/right
      
      // Pull portrait from PortraitQueue
      const portraitItem = portraitIndex < portraitQueue.length 
        ? portraitQueue[portraitIndex++] 
        : createFallbackTile('portrait');
      
      items.push({
        type: 'portrait',
        item: portraitItem,
        portraitOnRight,
        section
      });
      
      // Pull squares from GeneralQueue for 3 rows
      for (let row = 1; row <= 3; row++) {
        const squaresInRow = row === 3 ? 4 : 3; // Row 3 has 4 squares, rows 1-2 have 3
        
        for (let i = 0; i < squaresInRow; i++) {
          const squareItem = generalIndex < generalQueue.length 
            ? generalQueue[generalIndex++] 
            : createFallbackTile('square');
          
          items.push({
            type: 'square',
            item: squareItem,
            portraitOnRight,
            section,
            row,
            position: i
          });
        }
      }
      
      // Stop if we've used all content
      if (generalIndex >= generalQueue.length && portraitIndex >= portraitQueue.length) {
        break;
      }
    }
    
    return items;
  };

  // Check if we should use TrendingVideos-style layout for Friends tab on Clubhouse
  if (isClubhousePage && activeFilter === FILTER_TYPES.FRIENDS) {
    return (
      <>
        <div className="grid grid-cols-1 gap-6 max-w-md mx-auto">
          {content.filter(item => item.type === 'video' || item.type === 'image').map((item, index) => (
            <div
              key={`friends-${item.id}-${index}`}
              className="relative bg-muted overflow-hidden cursor-pointer group aspect-[9/16]"
              style={{ borderRadius: '0px' }}
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
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {item.golfCourse && (
                <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm px-3 py-1.5 text-white shadow-lg hover:bg-black/40 transition-colors rounded-full flex items-center gap-2 max-w-[70%]">
                  <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-sm font-medium truncate">
                    {item.golfCourse.name}
                  </span>
                </div>
              )}
              
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

  // Discover page layout
  if (isDiscoverPage) {
    if (isMobile) {
      const mobileItems = createMobileLayout();
      
      return (
        <>
          <div className="grid grid-cols-3 gap-px auto-rows-fr">
            {mobileItems.map((layoutItem, index) => {
              const { type, item, section } = layoutItem;
              
              if (type === 'hero') {
                const { heroOnRight } = layoutItem;
                const gridColumn = heroOnRight ? '2 / 4' : '1 / 3';
                const gridRow = `${section * 2 + 1} / ${section * 2 + 3}`;
                
                return (
                  <div
                    key={`hero-${item.id}-${index}`}
                    className="aspect-square relative bg-muted overflow-hidden cursor-pointer"
                    style={{ gridColumn, gridRow }}
                    onClick={() => onMediaClick?.(item)}
                  >
                    <div className="absolute inset-0">
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
                    </div>
                  </div>
                );
              }
              
              if (type === 'portrait') {
                const { portraitOnRight } = layoutItem;
                const gridColumn = portraitOnRight ? '2 / 4' : '1 / 3';
                const gridRow = `${section * 2 + 1} / ${section * 2 + 3}`;
                
                return (
                  <div
                    key={`portrait-${item.id}-${index}`}
                    className="aspect-[2/3] relative bg-muted overflow-hidden cursor-pointer"
                    style={{ gridColumn, gridRow }}
                    onClick={() => onMediaClick?.(item)}
                  >
                    <div className="absolute inset-0" style={{ objectFit: 'contain', objectPosition: 'center' }}>
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
                    </div>
                  </div>
                );
              }
              
              if (type === 'square') {
                let gridColumn, gridRow;
                
                if ('heroOnRight' in layoutItem) {
                  // Hero section squares
                  const { heroOnRight, stackIndex } = layoutItem;
                  gridColumn = heroOnRight ? '1' : '3';
                  gridRow = `${section * 2 + 1 + stackIndex}`;
                } else {
                  // Standard section squares
                  const { portraitOnRight, squareIndex } = layoutItem;
                  const row = Math.floor(squareIndex / 2);
                  const col = squareIndex % 2;
                  
                  if (portraitOnRight) {
                    gridColumn = `${col + 1}`;
                  } else {
                    gridColumn = `${col + 2}`;
                  }
                  gridRow = `${section * 2 + 1 + row}`;
                }
                
                return (
                  <div
                    key={`square-${item.id}-${index}`}
                    className="aspect-square relative bg-muted overflow-hidden cursor-pointer"
                    style={{ gridColumn, gridRow }}
                    onClick={() => onMediaClick?.(item)}
                  >
                    <div className="absolute inset-0">
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
                    </div>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
          
          <div id="scroll-sentinel" className="h-4">
            {isLoading && hasMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </>
      );
    } else {
      // Desktop layout with queue-based assignment
      const desktopItems = createDesktopLayout();
      
      return (
        <>
          <div className="grid grid-cols-4 gap-2 auto-rows-fr">
            {desktopItems.map((layoutItem, index) => {
              const { type, item, section, portraitOnRight } = layoutItem;
              
              if (type === 'portrait') {
                const gridColumn = portraitOnRight ? '4 / 5' : '1 / 2';
                const gridRow = `${section * 3 + 1} / ${section * 3 + 3}`;
                
                return (
                  <div
                    key={`desktop-portrait-${item.id}-${index}`}
                    className="relative bg-muted overflow-hidden cursor-pointer"
                    style={{ 
                      gridColumn, 
                      gridRow,
                      aspectRatio: '2/3' // Portrait ratio
                    }}
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
                  </div>
                );
              }
              
              if (type === 'square') {
                const { row, position } = layoutItem;
                let gridColumn, gridRow;
                
                if (portraitOnRight) {
                  // Portrait on right, squares fill columns 1-3
                  gridColumn = `${position + 1} / ${position + 2}`;
                } else {
                  // Portrait on left, squares fill columns 2-4
                  gridColumn = `${position + 2} / ${position + 3}`;
                }
                
                gridRow = `${section * 3 + row} / ${section * 3 + row + 1}`;
                
                return (
                  <div
                    key={`desktop-square-${item.id}-${index}`}
                    className="aspect-square relative bg-muted overflow-hidden cursor-pointer"
                    style={{ gridColumn, gridRow }}
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
                  </div>
                );
              }
              
              return null;
            })}
          </div>
          
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
  }

  // Default masonry layout for other pages
  return (
    <>
      <div className="columns-1 md:columns-3 gap-2 space-y-2">
        {content.map((item, index) => {
          const { aspect } = getAspectRatio(index);
          return (
            <div key={`default-${item.id}-${index}`} className={`break-inside-avoid ${aspect} relative bg-muted overflow-hidden cursor-pointer group`}>
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
      
      <div id="scroll-sentinel" className="h-4">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );

  // Helper function for aspect ratios
  function getAspectRatio(index: number) {
    const ratios = [
      { aspect: 'aspect-square' },
      { aspect: 'aspect-[4/5]' },
      { aspect: 'aspect-[9/16]' }
    ];
    return ratios[index % ratios.length];
  }
};

export default memo(ExploreGrid);