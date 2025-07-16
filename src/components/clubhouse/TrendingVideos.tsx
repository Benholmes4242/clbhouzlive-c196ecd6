import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ExploreContentItem } from '@/components/explore/types';
import { useVideoPlaybackManager } from '@/hooks/useVideoPlaybackManager';
import MediaDisplay from '@/components/explore/MediaDisplay';

interface TrendingVideosProps {
  videos: ExploreContentItem[];
  onVideoClick: (item: ExploreContentItem) => void;
}

const TrendingVideos: React.FC<TrendingVideosProps> = ({ videos, onVideoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Get first 8 videos for trending
  const trendingVideos = videos.filter(item => item.type === 'video').slice(0, 8);
  
  const { togglePlayPause, shouldShowPlayIcon } = useVideoPlaybackManager({
    section: 'trending',
    videoId: `trending-${currentIndex}`,
    autoplayAllowed: true,
    priority: 1
  });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % trendingVideos.length);
  };

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + trendingVideos.length) % trendingVideos.length);
  };

  const handleVideoClick = (index: number) => {
    const video = trendingVideos[index];
    if (video) {
      onVideoClick(video);
    }
  };

  if (trendingVideos.length === 0) return null;

  const visibleVideos = isMobile ? 1 : 3;
  const currentVideos = trendingVideos.slice(currentIndex, currentIndex + visibleVideos);
  
  // Handle wrap around for desktop view
  if (currentVideos.length < visibleVideos && !isMobile) {
    const remaining = visibleVideos - currentVideos.length;
    currentVideos.push(...trendingVideos.slice(0, remaining));
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Trending Videos</h2>
        
        {/* Desktop Navigation */}
        {!isMobile && (
          <div className="flex gap-2">
            <button
              onClick={prevVideo}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Previous videos"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextVideo}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Next videos"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="relative">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {currentVideos.map((video, index) => {
            const isFirstCard = index === 0;
            const actualIndex = (currentIndex + index) % trendingVideos.length;
            
            return (
              <div
                key={`${video.id}-${actualIndex}`}
                className={`relative bg-muted rounded-lg overflow-hidden cursor-pointer group ${
                  isMobile ? 'h-[35vh]' : 'aspect-[9/8]'
                }`}
                onClick={() => handleVideoClick(actualIndex)}
              >
                {isFirstCard ? (
                  // First card - autoplay video
                  <MediaDisplay
                    media={{
                      id: video.id,
                      media_type: 'video',
                      media_url: video.src
                    }}
                    itemTitle={video.title}
                    shouldAutoplay={true}
                    isLoading={false}
                    onImageError={() => {}}
                    onImageLoad={() => {}}
                    itemId={video.id}
                    currentIndex={actualIndex}
                  />
                ) : (
                  // Other cards - video without autoplay (shows first frame)
                  <MediaDisplay
                    media={{
                      id: video.id,
                      media_type: 'video',
                      media_url: video.src
                    }}
                    itemTitle={video.title}
                    shouldAutoplay={false}
                    isLoading={false}
                    onImageError={() => {}}
                    onImageLoad={() => {}}
                    itemId={video.id}
                    currentIndex={actualIndex}
                  />
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* User info */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={video.user?.avatar || '/placeholder.svg'}
                      alt={video.user?.name || 'User'}
                      className="w-8 h-8 rounded-full border border-white/20"
                    />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {video.user?.name || video.user?.username || 'Anonymous'}
                      </p>
                      {video.title && (
                        <p className="text-white/80 text-xs truncate">{video.title}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Play indicator for non-playing cards */}
                {!isFirstCard && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile swipe navigation */}
        {isMobile && (
          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={prevVideo}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Previous video"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextVideo}
              className="p-3 rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Next video"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Dots indicator */}
        <div className="flex justify-center mt-4 gap-2">
          {trendingVideos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-primary' : 'bg-muted'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingVideos;
