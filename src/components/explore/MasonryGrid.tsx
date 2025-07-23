import React, { useState, useEffect, useRef, memo } from 'react';
import Masonry from 'react-masonry-css';
import { MapPin } from 'lucide-react';
import MediaDisplay from './MediaDisplay';
import { ExploreContentItem } from './types';

interface MasonryGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore
}) => {
  const [imageHeights, setImageHeights] = useState<Record<string, number>>({});
  
  // Responsive breakpoints for masonry
  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  // Clean title text
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

  // Truncate title to 5 words
  const truncateTitle = (title: string) => {
    const cleanedTitle = cleanTitleText(title);
    if (!cleanedTitle) return '';
    
    const words = cleanedTitle.split(' ');
    if (words.length <= 5) return cleanedTitle;
    
    return words.slice(0, 5).join(' ') + '...';
  };

  // Generate random height for varied card sizes
  const getCardHeight = (item: ExploreContentItem, index: number) => {
    // Use item ID for consistent heights
    const seed = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (seed + index) % 100;
    
    // Create 3 different height categories
    if (random < 30) return 'h-48'; // Short cards
    if (random < 70) return 'h-64'; // Medium cards
    return 'h-80'; // Tall cards
  };

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('masonry-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (content.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
        <p className="text-muted-foreground max-w-md">
          Try adjusting your filters or check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-2"
        columnClassName="pl-2 bg-clip-padding"
      >
        {content.filter(item => item.type === 'video' || item.type === 'image').map((item, index) => {
          const cardHeight = getCardHeight(item, index);
          
          return (
            <div
              key={`masonry-${item.id}-${index}`}
              className={`relative bg-muted rounded-lg overflow-hidden cursor-pointer group mb-2 ${cardHeight}`}
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
                hidePlayButton={true}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Golf Club Tag */}
              {item.golfCourse && (
                <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 max-w-[70%]">
                  <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-xs font-medium truncate">
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
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">
                      {item.user?.name || item.user?.username || 'Anonymous'}
                    </p>
                    {truncateTitle(item.title) && (
                      <p className="text-white/80 text-xs truncate">{truncateTitle(item.title)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </Masonry>
      
      {/* Infinite scroll sentinel */}
      <div id="masonry-scroll-sentinel" className="h-4">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default memo(MasonryGrid);