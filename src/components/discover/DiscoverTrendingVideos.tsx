import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { HiTrendingUp } from 'react-icons/hi';
import { useSwipeable } from 'react-swipeable';
import { ExploreContentItem } from '@/components/explore/types';

interface DiscoverTrendingVideosProps {
  videos: ExploreContentItem[];
  onVideoClick: (item: ExploreContentItem) => void;
}

const DiscoverTrendingVideos: React.FC<DiscoverTrendingVideosProps> = ({ videos, onVideoClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeButton, setActiveButton] = useState<'left' | 'right' | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  
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
  
  // Function to pause all videos except the specified one
  const pauseAllVideosExcept = (exceptId?: string) => {
    videoRefs.current.forEach((video, videoId) => {
      if (videoId !== exceptId && !video.paused) {
        video.pause();
      }
    });
  };

  // Function to play the first visible video
  const playFirstVideo = () => {
    if (trendingVideos.length === 0) return;
    
    const firstVideo = trendingVideos[currentIndex];
    const firstVideoId = `trending-${firstVideo.id}`;
    const videoElement = videoRefs.current.get(firstVideoId);
    
    if (videoElement) {
      // Pause all other videos first
      pauseAllVideosExcept(firstVideoId);
      
      // Play the first video
      videoElement.muted = true; // Ensure muted for autoplay
      videoElement.play().catch(() => {
        // Autoplay failed, which is normal on some browsers
      });
      
      setActiveVideoId(firstVideoId);
    }
  };

  // Effect to handle video playback when currentIndex changes
  useEffect(() => {
    const timer = setTimeout(() => {
      playFirstVideo();
    }, 100); // Small delay to ensure DOM is updated
    
    return () => clearTimeout(timer);
  }, [currentIndex, trendingVideos.length]);

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
    <div className="container mx-auto px-4 pt-6 pb-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-foreground">Trending</h2>
      </div>

      <div className="relative">
        {/* Navigation arrows for desktop */}
        {!isMobile && trendingVideos.length > visibleVideos && (
          <>
            <button
              onClick={(e) => handleButtonClick('left', prevVideo, e)}
              className={`absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 ${
                activeButton === 'left' ? 'scale-95' : 'hover:scale-105'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => handleButtonClick('right', nextVideo, e)}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-200 ${
                activeButton === 'right' ? 'scale-95' : 'hover:scale-105'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Grid with 1080x1350 aspect ratio */}
        <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`} {...(isMobile ? swipeHandlers : {})}>
          {currentVideos.map((video, index) => {
            const isFirstCard = index === 0;
            const actualIndex = (currentIndex + index) % trendingVideos.length;
            
            return (
              <div
                key={`${video.id}-${actualIndex}`}
                className="relative bg-muted rounded-lg overflow-hidden cursor-pointer group aspect-[1080/1350]"
                onClick={() => handleVideoClick(actualIndex)}
              >
                {/* Video Element */}
                <video
                  key={`trending-video-${video.id}-${actualIndex}`}
                  ref={(el) => {
                    const videoId = `trending-${video.id}`;
                    if (el) {
                      videoRefs.current.set(videoId, el);
                      // Auto-play first video when ref is set
                      if (isFirstCard && el.readyState >= 1) {
                        el.muted = true;
                        el.play().catch(() => {});
                      }
                    } else {
                      videoRefs.current.delete(videoId);
                    }
                  }}
                  src={video.src}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  onLoadedData={(e) => {
                    const videoElement = e.currentTarget;
                    // If this is the first card, play it
                    if (isFirstCard) {
                      videoElement.muted = true;
                      videoElement.play().catch(() => {});
                      setActiveVideoId(`trending-${video.id}`);
                    }
                  }}
                  onError={(e) => {
                    console.error('Video failed to load:', video.src);
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                
                {/* Trending Icon */}
                <div className="absolute top-3 right-3">
                  <HiTrendingUp className="w-8 h-8 drop-shadow-lg" style={{ color: '#f7931e' }} />
                </div>
                
                {/* User info and caption */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={video.user?.avatar || '/placeholder.svg'}
                      alt={video.user?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm font-medium truncate">
                        {video.user?.name || video.user?.username || 'Anonymous'}
                      </p>
                    </div>
                  </div>
                  {/* Caption text */}
                  <p className="text-white text-sm line-clamp-2 opacity-90">
                    {truncateTitle(video.title)}
                  </p>
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