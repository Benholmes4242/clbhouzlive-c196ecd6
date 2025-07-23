import React, { useEffect, useState } from 'react';
import { ExploreContentItem } from './types';
import VideoCard from './VideoCard';
import ImageCard from './ImageCard';

interface StaggeredGridProps {
  content: ExploreContentItem[];
  onMediaClick: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isTrendingSection?: boolean;
}

const StaggeredGrid: React.FC<StaggeredGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore,
  isTrendingSection = false
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

  // Determine autoplay logic
  const shouldAutoplay = (index: number, isVideo: boolean) => {
    if (!isVideo) return false;
    
    // First video in trending section always autoplays
    if (isTrendingSection && index === 0) return true;
    
    // Every 5th video in the grid autoplays (1st, 6th, 11th, etc.)
    return (index + 1) % 5 === 1;
  };

  // Determine if video card should be tall
  const shouldBeTall = (index: number, isVideo: boolean) => {
    if (!isVideo) return false;
    
    // Every 5th video becomes tall (1st, 6th, 11th, etc.)
    return (index + 1) % 5 === 1;
  };

  // Filter content to only show videos and images
  const filteredContent = content.filter(item => item.type === 'video' || item.type === 'image');

  if (filteredContent.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🏌️‍♂️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No content found</h3>
        <p className="text-muted-foreground max-w-md">
          Check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Staggered Grid Layout */}
      <div className={`grid gap-0.5 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {filteredContent.map((item, index) => {
          const isVideo = item.type === 'video';
          const isAutoplay = shouldAutoplay(index, isVideo);
          const isTall = shouldBeTall(index, isVideo);

          if (isVideo) {
            return (
              <VideoCard
                key={`${item.id}-${index}`}
                item={item}
                isAutoplay={isAutoplay}
                isTall={isTall}
                onClick={() => onMediaClick(item)}
              />
            );
          } else {
            return (
              <ImageCard
                key={`${item.id}-${index}`}
                item={item}
                onClick={() => onMediaClick(item)}
              />
            );
          }
        })}
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
};

export default StaggeredGrid;