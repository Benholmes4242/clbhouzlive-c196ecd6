import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { Button } from '@/components/ui/button';
import CourseRankBadges from '../CourseRankBadges';
import MedalIcon from '@/components/ui/medal-icon';
import Top100AchievementsList from '@/components/badges/Top100AchievementsList';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import Hls from 'hls.js';
import linksLegendTrophy from '@/assets/links-legend-trophy.png';
import continentalSwingerTrophy from '@/assets/continental-swinger-trophy.png';
import starsStripesTrophy from '@/assets/stars-stripes-trophy.png';

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

      {/* Course rankings - removed for highlights section */}

      {/* Course info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-semibold text-lg mb-1">{video.courseName}</h3>
        <p className="text-white/80 text-sm">{video.location}</p>
      </div>
    </div>
  );
};

const LiquidGlassCard: React.FC = () => {
  const { user } = useSupabaseSession();
  
  // Mock data - in real app this would come from user's progress
  const userProgress = {
    played: 21,
    total: 300,
    achievements: [
      { id: 'links-legend', name: 'Links Legend', description: "You've mastered the finest across the British Isles", target: 100, earned: true, progress: 100 },
      { id: 'continental-swinger', name: 'The Continental Swinger', description: "Algarve to the Alps - Europe's elite courses, conquered", target: 100, earned: true, progress: 100 },
      { id: 'stars-stripes', name: 'Stars & Stripes Tourer', description: "Coast to coast, you've played the American greats", target: 100, earned: true, progress: 100 },
      { id: '20-club', name: 'Green Fee Rookie', description: "You've paid your dues - 20 down!", target: 20, earned: true, progress: 21 },
      { id: '50-club', name: 'The Turn', description: 'Halfway through your Top 100 journey', target: 50, earned: false, progress: 21 },
      { id: '100-club', name: 'The Century Club', description: "You're a member of the century club - a prestigious club", target: 100, earned: false, progress: 21 },
      { id: '200-club', name: 'Clubhouse Elite', description: 'Bunkers, winds, and triumphs - 200 conquered', target: 200, earned: false, progress: 21 },
      { id: '300-club', name: 'Course Collector', description: "All 300? That's a collector's dream come true", target: 300, earned: false, progress: 21 },
    ]
  };

  const progressPercentage = (userProgress.played / userProgress.total) * 100;

  return (
    <div 
      className="relative h-[28rem] rounded-lg overflow-hidden bg-black"
    >
      
      {/* Achievement Content */}
      <div className="relative h-full p-6 flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-white font-bold text-2xl mb-2">Achievements</h3>
          <p className="text-white/70 text-base">
            You&apos;ve played {userProgress.played} of {userProgress.total} Top 100 courses
          </p>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3">
          {userProgress.achievements.map((achievement) => {
            const achievementProgressPercentage = Math.min((achievement.progress / achievement.target) * 100, 100);
            
            return (
              <div 
                key={achievement.id}
                className={`relative backdrop-blur-sm rounded-lg p-4 border ${
                  achievement.earned 
                    ? achievement.id === '20-club'
                      ? 'bg-green-500/20 border-green-400 shadow-2xl shadow-green-400/50'
                      : 'bg-green-500/10 border-green-400/20' 
                    : 'bg-white/10 border-white/10'
                }`}
                style={achievement.earned && achievement.id === '20-club' ? {
                  boxShadow: '0 0 30px #22c55e, inset 0 0 20px rgba(34, 197, 94, 0.2)'
                } : {}}
              >

                <div className="flex items-center w-full mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                     {/* Achievement Icon - Keep original trophy styling */}
                     {achievement.id === 'links-legend' ? (
                       <img src={linksLegendTrophy} alt="Links Legend Trophy" className="w-16 h-16 flex-shrink-0" />
                     ) : achievement.id === 'continental-swinger' ? (
                       <img src={continentalSwingerTrophy} alt="Continental Swinger Trophy" className="w-16 h-16 flex-shrink-0" />
                     ) : achievement.id === 'stars-stripes' ? (
                       <img src={starsStripesTrophy} alt="Stars & Stripes Tourer Trophy" className="w-16 h-16 flex-shrink-0" />
                     ) : achievement.id === '20-club' ? (
                       <MedalIcon size="xl" type="20-club" className="!w-16 !h-16 flex-shrink-0" />
                     ) : achievement.id === '50-club' ? (
                       <MedalIcon size="xl" type="50-club" className="!w-16 !h-16 flex-shrink-0" />
                     ) : achievement.id === '100-club' ? (
                       <MedalIcon size="xl" type="100-club" className="!w-16 !h-16 flex-shrink-0" />
                     ) : achievement.id === '200-club' ? (
                       <img src="/lovable-uploads/b61d6231-d352-48ae-ae1e-03e347cbd07c.png" alt="Clubhouse Elite Trophy" className="w-16 h-16 flex-shrink-0" />
                     ) : achievement.id === '300-club' ? (
                       <MedalIcon size="xl" type="300-club" className="!w-16 !h-16 flex-shrink-0" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        achievement.earned 
                          ? 'bg-green-500/20 border border-green-400/30' 
                          : 'bg-white/10 border border-white/20'
                      }`}>
                        <span className="text-lg font-bold text-white">
                          {achievement.target}
                        </span>
                      </div>
                    )}
                    
                     {/* Achievement Info */}
                     <div className="flex-1">
                       <h4 className="text-white font-medium text-base whitespace-nowrap">{achievement.name}</h4>
                       <p className="text-white/60 text-sm">{achievement.description}</p>
                     </div>
                  </div>
                </div>

                {/* Progress Bar - New addition */}
                <div className="w-full">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/70 font-medium">
                      Progress: {achievementProgressPercentage.toFixed(0)}%
                    </span>
                    <span className="text-white/70 font-medium">
                      {Math.min(achievement.progress, achievement.target)}/{achievement.target}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-green-400 to-green-500"
                      style={{ width: `${achievementProgressPercentage}%` }}
                    />
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
        className={`flex gap-4 overflow-x-auto scrollbar-hide ${
          isMobile ? 'px-4 -mx-4' : ''
        }`}
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {carouselItems.map((item, index) => (
          <div
            key={item.id}
            className={`flex-shrink-0 ${
              isMobile ? 'w-[calc(100vw-6rem)]' : 'w-80'
            }`}
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

      {/* Carousel dots */}
      {carouselItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {carouselItems.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                const container = containerRef.current;
                if (container) {
                  const cardWidth = isMobile ? container.offsetWidth : 320; // w-80 = 320px
                  const gap = 16; // gap-4 = 16px
                  const scrollPosition = index * (cardWidth + gap);
                  container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeVideoIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DepthStackCarousel;