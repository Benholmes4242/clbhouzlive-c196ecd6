import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, MapPin } from 'lucide-react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { Button } from '@/components/ui/button';
import CourseRankBadges from '../CourseRankBadges';
import MedalIcon from '@/components/ui/medal-icon';
import Top100AchievementsList from '@/components/badges/Top100AchievementsList';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import Hls from 'hls.js';
// Links legend trophy now uses uploaded UK flag trophy
// Continental swinger trophy now uses uploaded EU flag trophy
// Stars & Stripes trophy now uses uploaded US flag trophy

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

// Remove LiquidGlassCard - achievements are now in dedicated section below

interface DepthStackCarouselProps {
  highlights: HighlightVideo[];
  onVideoPlay?: (videoId: string) => void;
  userId?: string; // Add userId prop to support other user profiles
  userFirstName?: string;
  isOwnProfile?: boolean;
}

const VideoCard: React.FC<{ 
  video: HighlightVideo; 
  isActive: boolean; 
  onVideoPlay?: (videoId: string) => void;
  isMobile: boolean;
  isHovered?: boolean;
  isFirstCard?: boolean;
  shouldAutoPlay?: boolean;
  userFirstName?: string;
  isOwnProfile?: boolean;
}> = ({ video, isActive, onVideoPlay, isMobile, isHovered = false, isFirstCard = false, shouldAutoPlay = false, userFirstName = 'User', isOwnProfile = false }) => {
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

  // Handle autoplay and hover logic
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = isMuted;

    // Play logic: first card auto-plays when shouldAutoPlay is true, other cards play on hover
    const shouldPlay = isFirstCard ? shouldAutoPlay : isHovered;

    if (shouldPlay && isInView) {
      videoElement.play().catch(() => {});
      setIsPlaying(true);
    } else {
      // Pause but ensure video shows first frame (not black)
      videoElement.pause();
      videoElement.currentTime = 0; // Reset to first frame
      setIsPlaying(false);
    }
  }, [isHovered, isFirstCard, shouldAutoPlay, isInView, isMuted]);

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
      className="relative aspect-video h-[266px] rounded-lg overflow-hidden bg-black cursor-pointer group" 
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
      
      {/* My Highlights Badge - Top Left */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative flex items-center px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="relative z-10 flex items-center">
            <span className="text-sm text-foreground">
              {isOwnProfile ? "My Highlights" : `${userFirstName}'s Highlights`}
            </span>
          </div>
        </div>
      </div>
      
      {/* Mute button */}
      <Button
        onClick={toggleMute}
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 h-8 w-8 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-black/10"
        style={{ 
          backdropFilter: 'blur(40px) saturate(180%)'
        }}
      >
        <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
        <div className="relative z-10 text-white">
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </div>
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

// LiquidGlassCard component removed - achievements are now in dedicated section below

const DepthStackCarousel: React.FC<DepthStackCarouselProps> = ({
  highlights,
  onVideoPlay,
  userId,
  userFirstName = 'User',
  isOwnProfile = false
}) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  
  // Use all highlight videos for infinite carousel
  const carouselItems = highlights;

  const {
    carouselRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    isMobile
  } = useCarouselNavigation(carouselItems.length);

  // Responsive card visibility based on screen size
  const getVisibleCards = () => {
    if (typeof window === 'undefined') return 3; // SSR fallback
    
    const width = window.innerWidth;
    if (width <= 430) return 1.15; // Mobile: 1 full + peek
    if (width <= 768) return 1.7; // Small tablet: ~1.6-1.8
    if (width <= 1024) return 2.2; // Large tablet: ~2.2
    return 3; // Desktop: 3
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards);

  // Update visible cards on resize
  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full overflow-hidden disabled:opacity-30 shadow-lg shadow-black/10"
            style={{ 
              backdropFilter: 'blur(40px) saturate(180%)'
            }}
          >
            <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
            <div className="relative z-10 text-white">
              <ChevronLeft className="h-5 w-5" />
            </div>
          </Button>
          
          <Button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full overflow-hidden disabled:opacity-30 shadow-lg shadow-black/10"
            style={{ 
              backdropFilter: 'blur(40px) saturate(180%)'
            }}
          >
            <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
            <div className="relative z-10 text-white">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Button>
        </>
      )}

      {/* Carousel container with peek effect */}
      <div
        ref={(node) => {
          carouselRef(node);
          containerRef.current = node;
        }}
        className={`flex gap-4 overflow-x-auto scrollbar-hide ${
          isMobile ? 'px-0' : 'px-0'
        }`}
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {carouselItems
          .filter(item => item.videoUrl) // Hide cards without videos
          .map((item, index) => {
            // Calculate responsive width based on visible cards - made bigger
            const getCardWidth = () => {
              if (typeof window === 'undefined') return 'w-96'; // SSR fallback - bigger
              
              const width = window.innerWidth;
              if (width <= 430) return 'w-[calc(92vw)]'; // Mobile: bigger cards
              if (width <= 768) return 'w-[calc(65vw)]'; // Small tablet: bigger cards  
              if (width <= 1024) return 'w-[calc(50vw)]'; // Large tablet: bigger cards
              return 'w-96'; // Desktop: bigger cards (384px each, was 320px)
            };

            return (
              <div
                key={item.id}
                className={`flex-shrink-0 transition-all duration-300 ${getCardWidth()}`}
                style={{ scrollSnapAlign: 'start' }}
                onMouseEnter={() => !isMobile && setHoveredCardIndex(index)}
                onMouseLeave={() => !isMobile && setHoveredCardIndex(null)}
              >
                <VideoCard
                  video={item}
                  isActive={index === activeVideoIndex}
                  onVideoPlay={onVideoPlay}
                  isMobile={isMobile}
                  isHovered={hoveredCardIndex === index}
                  isFirstCard={index === 0}
                  shouldAutoPlay={hoveredCardIndex === null || hoveredCardIndex === 0}
                  userFirstName={userFirstName}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            );
          })}
      </div>

      {/* Carousel dots */}
      {carouselItems.filter(item => item.videoUrl).length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {carouselItems.filter(item => item.videoUrl).map((_, index) => (
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
                  ? 'bg-foreground scale-125' 
                  : 'bg-muted-foreground/50 hover:bg-muted-foreground/70'
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