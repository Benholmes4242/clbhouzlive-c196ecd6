import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { HiTrendingUp } from 'react-icons/hi';
import { useSwipeable } from 'react-swipeable';
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
  const [activeButton, setActiveButton] = useState<'left' | 'right' | null>(null);
  
  // Get first 8 videos for trending
  const trendingVideos = videos.filter(item => item.type === 'video').slice(0, 8);
  
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

  const handleButtonClick = (direction: 'left' | 'right', action: () => void, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveButton(direction);
    action();
    // Remove active state after animation
    setTimeout(() => setActiveButton(null), 150);
  };

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile) {
        nextVideo();
      }
    },
    onSwipedRight: () => {
      if (isMobile) {
        prevVideo();
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  if (trendingVideos.length === 0) return null;

  const visibleVideos = isMobile ? 1 : 3;
  const currentVideos = trendingVideos.slice(currentIndex, currentIndex + visibleVideos);
  
  // Handle wrap around for desktop view
  if (currentVideos.length < visibleVideos && !isMobile) {
    const remaining = visibleVideos - currentVideos.length;
    currentVideos.push(...trendingVideos.slice(0, remaining));
  }

  return (
    <div className="container mx-auto px-4 md:px-0 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground">Trending Videos</h2>
      </div>

      <div className="relative">
        {/* Desktop Navigation Arrows - Overlaid on cards */}
        {!isMobile && (
          <>
            {/* Left arrow */}
            <button
              onClick={prevVideo}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors z-30"
              aria-label="Previous videos"
            >
              <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
            </button>
            
            {/* Right arrow */}
            <button
              onClick={nextVideo}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors z-30"
              aria-label="Next videos"
            >
              <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
            </button>
          </>
        )}
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`} {...(isMobile ? swipeHandlers : {})}>
          {currentVideos.map((video, index) => {
            const isFirstCard = index === 0;
            const actualIndex = (currentIndex + index) % trendingVideos.length;
            
            return (
              <div
                key={`${video.id}-${actualIndex}`}
                className={`relative bg-muted rounded-lg overflow-hidden cursor-pointer group ${
                  isMobile ? 'h-[60vh]' : 'aspect-[9/8]'
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
                    loop={true}
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
                
                {/* Golf Club Tag */}
                {video.golfCourse && (
                  <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-2 max-w-[70%]">
                    <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="text-white text-sm font-medium truncate">
                      {video.golfCourse.name}
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
                      src={video.user?.avatar || '/placeholder.svg'}
                      alt={video.user?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-base font-medium truncate">
                        {video.user?.name || video.user?.username || 'Anonymous'}
                      </p>
                      {truncateTitle(video.title) && (
                        <p className="text-white/80 text-sm truncate">{truncateTitle(video.title)}</p>
                      )}
                    </div>
                  </div>
                </div>


                {/* Mobile navigation arrows */}
                {isMobile && (
                  <>
                    {/* Left arrow */}
                    <button
                      onClick={(e) => handleButtonClick('left', prevVideo, e)}
                      className={`absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors z-10 ${
                        activeButton === 'left' ? 'bg-white/20' : ''
                      }`}
                      aria-label="Previous video"
                    >
                      <ChevronLeft className="w-6 h-6 text-white drop-shadow-lg" />
                    </button>
                    
                    {/* Right arrow */}
                    <button
                      onClick={(e) => handleButtonClick('right', nextVideo, e)}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors z-10 ${
                        activeButton === 'right' ? 'bg-white/20' : ''
                      }`}
                      aria-label="Next video"
                    >
                      <ChevronRight className="w-6 h-6 text-white drop-shadow-lg" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrendingVideos;
