import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { Button } from '@/components/ui/button';
import CourseRankBadges from '../CourseRankBadges';
import Hls from 'hls.js';

// Session-based mute preference management
const MUTE_PREFERENCE_KEY = 'videoMutePreference';

const getSessionMutePreference = (): boolean => {
  const stored = sessionStorage.getItem(MUTE_PREFERENCE_KEY);
  return stored ? JSON.parse(stored) : true; // Default to muted
};

const setSessionMutePreference = (isMuted: boolean): void => {
  sessionStorage.setItem(MUTE_PREFERENCE_KEY, JSON.stringify(isMuted));
};

interface HighlightVideo {
  id: string;
  courseId: string;
  courseName: string;
  location: string;
  thumbnail: string;
  videoUrl?: string;
  caption: string;
  duration?: string;
  globalRank?: number | null;
  regionalRank?: number | null;
  usaRank?: number | null;
  country: string;
  averageRating?: number | null;
}

interface LiquidGlassCard {
  id: string;
  type: 'glass';
}

type CarouselItem = HighlightVideo | LiquidGlassCard;

interface DepthStackCarouselProps {
  highlights: HighlightVideo[];
  onVideoPlay?: (videoId: string) => void;
}

const VideoCard: React.FC<{ 
  video: HighlightVideo; 
  isActive: boolean; 
  onVideoPlay?: (videoId: string) => void;
  isMobile: boolean;
}> = ({ video, isActive, onVideoPlay, isMobile }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => getSessionMutePreference());
  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(
    video.videoUrl || '', 
    video.id, 
    video.thumbnail
  );

  const {
    ref: autoplayRef,
    shouldAutoplay,
    isInView,
    handleMouseEnter,
    handleMouseLeave
  } = useVideoAutoplay({
    enabled: true,
    threshold: isMobile ? 0.8 : 0.6 // Higher threshold for mobile (more of card must be visible)
  });

  // Initialize HLS for .m3u8 streams
  useEffect(() => {
    if (!video.videoUrl || !videoRef.current) return;

    if (video.videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hlsRef.current = new Hls();
        hlsRef.current.loadSource(video.videoUrl);
        hlsRef.current.attachMedia(videoRef.current);
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video.videoUrl]);

  // Initialize video loading and ensure first frame is visible
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video.videoUrl) return;

    // Ensure video loads metadata and first frame
    videoElement.load();
    
    // Set to first frame when loaded
    const handleLoadedData = () => {
      if (videoElement.paused) {
        videoElement.currentTime = 0;
      }
    };

    videoElement.addEventListener('loadeddata', handleLoadedData);
    return () => videoElement.removeEventListener('loadeddata', handleLoadedData);
  }, [video.videoUrl]);

  // Handle autoplay based on intersection observer
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = isMuted;

    if (isActive && shouldAutoplay && isInView) {
      videoElement.play().catch(() => {});
      setIsPlaying(true);
    } else {
      // Pause but ensure video shows first frame (not black)
      videoElement.pause();
      videoElement.currentTime = 0; // Reset to first frame
      setIsPlaying(false);
    }
  }, [isActive, shouldAutoplay, isInView, isMuted]);

  // Update video mute state when session preference changes
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.muted = isMuted;
    }
  }, [isMuted]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
    onVideoPlay?.(video.id);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setSessionMutePreference(newMutedState);
    
    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
  };

  return (
    <div 
      ref={autoplayRef}
      className="relative h-[28rem] rounded-lg overflow-hidden bg-black cursor-pointer group" 
      onClick={handleVideoClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {video.videoUrl ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          loop
          playsInline
          controls={false}
          preload="metadata" // Ensure first frame loads
          poster={thumbnailReady ? thumbnailSrc : video.thumbnail}
          onLoadedData={() => {
            console.log('Video loaded:', video.id);
            // Ensure paused videos show first frame
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.currentTime = 0;
            }
          }}
          onError={(e) => console.error('Video error:', e)}
        />
      ) : (
        <img 
          src={thumbnailReady ? thumbnailSrc : video.thumbnail}
          alt={video.courseName}
          className="w-full h-full object-cover"
        />
      )}
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      
      {/* Mute button */}
      <Button
        onClick={toggleMute}
        variant="ghost"
        size="icon"
        className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>

      {/* Course rankings */}
      <div className="absolute top-3 right-3">
        <CourseRankBadges
          globalRank={video.globalRank}
          regionalRank={video.regionalRank}
          usaRank={video.usaRank}
          country={video.country}
          viewContext="global"
          positioning="top-left"
        />
      </div>

      {/* Course info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg mb-1">{video.courseName}</h3>
        <p className="text-white/80 text-sm">{video.location}</p>
      </div>
    </div>
  );
};

const LiquidGlassCard: React.FC = () => {
  // Mock data - in real app this would come from user's progress
  const userProgress = {
    played: 21,
    total: 300,
    achievements: [
      { id: '20-club', name: '20 Club', description: 'Play 20 Top 100 courses', target: 20, earned: true },
      { id: '50-club', name: '50 Club', description: 'Play 50 Top 100 courses', target: 50, earned: false },
      { id: '100-club', name: '100 Club', description: 'Play 100 Top 100 courses', target: 100, earned: false },
      { id: '300-club', name: '300 Club', description: 'Play 300 Top 100 courses', target: 300, earned: false },
    ]
  };

  const progressPercentage = (userProgress.played / userProgress.total) * 100;

  return (
    <div 
      className="relative h-[28rem] rounded-lg overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20"
      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
      
      {/* Achievement Content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-white font-bold text-2xl mb-2">Achievements</h3>
          <p className="text-white/70 text-base">
            You&apos;ve played {userProgress.played} of {userProgress.total} Top 100 courses
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-white/70 text-xs mb-2">
            <span>{userProgress.played}</span>
            <span>{userProgress.total}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
          {userProgress.achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`relative backdrop-blur-sm rounded-lg p-4 border ${
                achievement.earned 
                  ? 'bg-green-500/10 border-green-400/20' 
                  : 'bg-white/10 border-white/10'
              }`}
            >
              {/* Completed Stamp */}
              {achievement.earned && (
                <div className="absolute -top-4 -right-4 transform -rotate-12 animate-scale-in z-10">
                  <img 
                    src="/lovable-uploads/e4e44275-1266-4a51-a3d2-1e02f989f7d8.png" 
                    alt="Completed"
                    className="w-16 h-16 drop-shadow-lg"
                    style={{ 
                      filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pr-16">
                <div className="flex items-center space-x-3">
                  {/* Achievement Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.earned 
                      ? 'bg-green-500/20 border border-green-400/30' 
                      : 'bg-white/10 border border-white/20'
                  }`}>
                    <span className="text-lg font-bold text-white">
                      {achievement.target}
                    </span>
                  </div>
                  
                  {/* Achievement Info */}
                  <div>
                    <h4 className="text-white font-medium text-sm">{achievement.name}</h4>
                    <p className="text-white/60 text-xs">{achievement.description}</p>
                  </div>
                </div>

                {/* Progress for unearned achievements */}
                {!achievement.earned && (
                  <div className="text-white/40 text-xs">
                    {userProgress.played}/{achievement.target}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DepthStackCarousel: React.FC<DepthStackCarouselProps> = ({
  highlights,
  onVideoPlay
}) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  
  // Create carousel items with liquid glass card as second item
  const carouselItems: CarouselItem[] = [
    ...highlights.slice(0, 1), // First highlight
    { id: 'liquid-glass', type: 'glass' }, // Liquid glass card
    ...highlights.slice(1, 7) // Remaining highlights (up to 8 total)
  ];

  const {
    carouselRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    isMobile
  } = useCarouselNavigation(carouselItems.length);

  const visibleCards = isMobile ? 1 : 3;

  // Create a local ref to access the container element
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle scroll to detect which card should be active
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const cards = container.children;
      
      let newActiveIndex = 0;
      let maxVisibility = 0;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as HTMLElement;
        const cardRect = card.getBoundingClientRect();
        
        // Calculate how much of the card is visible
        const left = Math.max(cardRect.left, containerRect.left);
        const right = Math.min(cardRect.right, containerRect.right);
        const visibleWidth = Math.max(0, right - left);
        const visibility = visibleWidth / cardRect.width;
        
        // For mobile, require higher visibility threshold
        const threshold = isMobile ? 0.8 : 0.6;
        
        if (visibility > threshold && visibility > maxVisibility) {
          maxVisibility = visibility;
          newActiveIndex = i;
        }
      }

      if (newActiveIndex !== activeVideoIndex) {
        setActiveVideoIndex(newActiveIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeVideoIndex, isMobile]);

  return (
    <div className="relative w-full">
      {/* Navigation buttons */}
      {!isMobile && carouselItems.length > visibleCards && (
        <>
          <Button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Carousel container */}
      <div
        ref={(node) => {
          carouselRef(node);
          containerRef.current = node;
        }}
        className="flex gap-4 overflow-x-auto scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {carouselItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex-shrink-0 ${isMobile ? 'w-full' : 'w-80'}`}
            style={{ scrollSnapAlign: 'start' }}
          >
            {'type' in item && item.type === 'glass' ? (
              <LiquidGlassCard />
            ) : (
              <VideoCard
                video={item as HighlightVideo}
                isActive={index === activeVideoIndex && 'type' in item === false}
                onVideoPlay={onVideoPlay}
                isMobile={isMobile}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepthStackCarousel;