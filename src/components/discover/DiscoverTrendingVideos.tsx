import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { HiTrendingUp } from 'react-icons/hi';
import { useSwipeable } from 'react-swipeable';
import { ExploreContentItem } from '@/components/explore/types';
import { useVideoPlaybackManager } from '@/hooks/useVideoPlaybackManager';
import MediaDisplay from '@/components/explore/MediaDisplay';

interface DiscoverTrendingVideosProps {
  videos: ExploreContentItem[];
  onVideoClick: (item: ExploreContentItem) => void;
}

const DiscoverTrendingVideos: React.FC<DiscoverTrendingVideosProps> = ({ videos, onVideoClick }) => {
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

  const visibleVideos = isMobile ? 2 : 3; // Mobile: 2 cards, Desktop: 3 cards
  const currentVideos = trendingVideos.slice(currentIndex, currentIndex + visibleVideos);
  
  // Handle wrap around
  if (currentVideos.length < visibleVideos) {
    const remaining = visibleVideos - currentVideos.length;
    currentVideos.push(...trendingVideos.slice(0, remaining));
  }

  return (
    <div className="container mx-auto px-4 md:px-0 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Trending</h2>
      </div>

      <div className="relative">
        {/* Grid with 1080x1350 aspect ratio */}
        <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`} {...(isMobile ? swipeHandlers : {})}>
          {currentVideos.map((video, index) => {
            const isFirstCard = index === 0;
            const actualIndex = (currentIndex + index) % trendingVideos.length;
            
            return (
              <div
                key={`${video.id}-${actualIndex}`}
                className="relative bg-muted overflow-hidden cursor-pointer group aspect-[1080/1350]"
                style={{ borderRadius: '8px' }}
                onClick={() => handleVideoClick(actualIndex)}
              >
                {/* Media Display */}
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
                  loop={true}
                  hidePlayButton={true}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                
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
                    </div>
                  </div>
                </div>

                
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiscoverTrendingVideos;