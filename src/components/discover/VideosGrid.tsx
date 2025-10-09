import React, { useEffect } from 'react';
import VideoExploreCard from './VideoExploreCard';
import { ExploreContentItem } from '@/components/explore/types';

interface VideosGridProps {
  content: ExploreContentItem[];
  onMediaClick?: (item: ExploreContentItem) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const VideosGrid: React.FC<VideosGridProps> = ({
  content,
  onMediaClick,
  isLoading,
  hasMore,
  onLoadMore
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

  // Filter to only show 3-10 minute videos
  const filteredVideos = content.filter(item => {
    if (item.type !== 'video') return false;
    if (!item.durationSeconds) return true; // Include if duration unknown
    return item.durationSeconds >= 180 && item.durationSeconds <= 600;
  });

  if (filteredVideos.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">🎥</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No videos found</h3>
        <p className="text-muted-foreground max-w-md">
          Check back later for new 3-10 minute videos.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Cinematic grid - 2 columns mobile, 3 columns desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-[1200px] mx-auto px-2 md:px-4">
        {filteredVideos.map((item) => (
          <VideoExploreCard
            key={item.id}
            item={item}
            onMediaClick={onMediaClick}
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
