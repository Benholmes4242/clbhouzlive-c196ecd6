import React, { useEffect } from 'react';
import VideoExploreCard from './VideoExploreCard';
import { ExploreContentItem } from '@/components/explore/types';

interface VideosGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isShorts?: boolean;
}

const VideosGrid: React.FC<VideosGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore,
  isShorts = false
}) => {
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

    const sentinel = document.getElementById('videos-scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Filter to only show videos (no duration filtering anymore - that's handled by parent)
  const filteredVideos = content.filter(item => item.type === 'video');

  if (filteredVideos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
        <p className="text-muted-foreground max-w-md">
          No videos match these filters. Try a different duration or topic.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Cinematic grid - 2 columns mobile, 3 columns desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3" style={{ rowGap: '14px', columnGap: '2px' }}>
        {filteredVideos.map((item) => (
          <VideoExploreCard
            key={item.id}
            item={item}
            onMediaClick={onMediaClick}
            compact={isShorts}
          />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div id="videos-scroll-sentinel" className="h-4 mt-8">
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </>
  );
};

export default VideosGrid;
