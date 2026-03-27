import React, { useState, useCallback, useEffect, useRef, useId, useLayoutEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { Button } from '@/components/ui/button';
import UnifiedVideoPlayer, { UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { getFilterClass } from '@/utils/studioFilters';
import { cn } from '@/lib/utils';
import { useVideoReadyQueue } from '@/hooks/useVideoReadyQueue';
import { useClubhouseStore } from '@/store/clubhouseStore';

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
  filterId?: string | null;
}

interface DepthStackCarouselProps {
  highlights: HighlightVideo[];
  onVideoPlay?: (videoId: string) => void;
  userId?: string;
  userFirstName?: string;
  isOwnProfile?: boolean;
}

const VideoCard: React.FC<{ 
  video: HighlightVideo; 
  isActive: boolean; 
  onVideoPlay?: (videoId: string) => void;
  isMobile: boolean;
  isHovered?: boolean;
  userFirstName?: string;
  isOwnProfile?: boolean;
  isVideoReady?: boolean;
  onReady?: (id: string) => void;
  globalMuted?: boolean;
}> = ({ video, isActive, onVideoPlay, isMobile, isHovered = false, userFirstName = 'User', isOwnProfile = false, isVideoReady = false, onReady, globalMuted = true }) => {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const [shouldAttach, setShouldAttach] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mediaId = useId();

  // Get HLS URL and poster from video URL
  const uid = video.videoUrl ? uidFromNode({ src: video.videoUrl }) : null;
  const hlsUrl = uid ? generateStreamHlsUrl(uid) : null;
  const poster = uid 
    ? generateStreamThumbnailUrl(uid, { height: 600 })
    : video.thumbnail;

  // Parse duration string to seconds for smart looping
  const durationSeconds = useMemo(() => {
    if (!video.duration) return 0;
    const parts = video.duration.split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }, [video.duration]);

  // Smart looping: only loop videos under 60 seconds
  const shouldLoop = durationSeconds > 0 ? durationSeconds < 60 : true;

  // Reset ready state on video change
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setHasError(false);
  }, [video.id]);

  // Intersection observer for attach/autoplay with hysteresis (50% start / 10% stop)
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        
        setShouldAttach(entry.isIntersecting);
        
        if (ratio >= 0.5) {
          setAutoplay(true);
          setIsPausing(false);
        } else if (ratio < 0.1) {
          setAutoplay(false);
          setIsPausing(true);
        }
      },
      { 
        root: null, 
        rootMargin: '200px 0px',
        threshold: [0, 0.1, 0.3, 0.5, 0.8, 1.0] 
      }
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [isMobile]);

  // Handle attach/detach based on visibility
  useEffect(() => {
    if (shouldAttach) {
      playerRef.current?.attach();
    } else {
      playerRef.current?.detach();
    }
  }, [shouldAttach]);

  const handleVideoClick = () => {
    onVideoPlay?.(video.id);
  };

  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && hlsUrl) {
      hasReportedReadyRef.current = true;
      onReady?.(video.id);
    }
  }, [video.id, hlsUrl, onReady]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  // Format duration for badge
  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const filterClass = getFilterClass(video.filterId);

  return (
    <div 
      ref={cardRef}
      className="relative aspect-video h-[266px] rounded-lg overflow-hidden bg-black cursor-pointer group will-change-transform" 
      onClick={handleVideoClick}
    >
      {/* UnifiedVideoPlayer - always mounted, opacity controlled by isVideoReady */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-150 ease-out",
        filterClass,
        isVideoReady && !hasError ? "opacity-100" : "opacity-0"
      )}>
        {hlsUrl && !hasError ? (
          <UnifiedVideoPlayer
            ref={playerRef}
            src={hlsUrl}
            posterUrl={poster}
            muted={globalMuted}
            autoplay={autoplay}
            loop={shouldLoop}
            className="w-full h-full"
            objectFit="cover"
            surface="course-highlights"
            managedByMediaRuntime={true}
            showMuteButton={false}
            onLoadedData={handleCanPlayThrough}
            onError={handleError}
          />
        ) : (
          <img 
            src={poster}
            alt={video.courseName}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.onerror = null;
            }}
          />
        )}
      </div>
      
      {/* Shimmer skeleton until video is ready */}
      {hlsUrl && !isVideoReady && !hasError && (
        <div className="absolute inset-0 bg-muted motion-safe:animate-shimmer-down" />
      )}

      {/* Silent error fallback: show poster */}
      {hasError && poster && (
        <img 
          src={poster}
          alt={video.courseName}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
      
      {/* My Highlights Badge - Top Left */}
      <div className="absolute top-3 left-3 z-10">
        <div className="relative flex items-center px-2.5 py-1.5 rounded-lg shadow-lg shadow-black/20 overflow-hidden backdrop-blur-md" style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div className="relative z-10 flex items-center">
            <span className="text-sm text-white">
              {isOwnProfile ? "My Highlights" : `${userFirstName}'s Highlights`}
            </span>
          </div>
        </div>
      </div>

      {/* Duration badge - Bottom Right */}
      {durationSeconds > 0 && (
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white z-10">
          {formatDur(durationSeconds)}
        </div>
      )}
    </div>
  );
};

const DepthStackCarousel: React.FC<DepthStackCarouselProps> = ({
  highlights,
  onVideoPlay,
  userId,
  userFirstName = 'User',
  isOwnProfile = false
}) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const hasPreloadedFirst = useRef(false);
  const { isGloballyMuted } = useGlobalAudio();
  
  const carouselItems = highlights;

  // Video ready queue integration
  const {
    initiatePrefetch,
    markReady,
    isReady,
    readySet,
  } = useVideoReadyQueue({
    prefetchAhead: 3,
    prefetchBehind: 1,
    onVideoReady: (id) => console.log(`[DepthStackCarousel] Video ${id.substring(0, 8)} marked ready`),
  });

  const markReadyRef = useRef(markReady);
  markReadyRef.current = markReady;

  // CRITICAL: Use stream UIDs for cache consistency
  const videoIds = useMemo(() => {
    return carouselItems.filter(i => i.videoUrl).map(item => {
      const uid = uidFromNode({ src: item.videoUrl });
      return uid || item.id;
    });
  }, [carouselItems]);

  // Create videoUrlMap keyed by stream UID
  const videoUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    carouselItems.forEach(item => {
      if (item.videoUrl) {
        const uid = uidFromNode({ src: item.videoUrl });
        if (uid) {
          map.set(uid, generateStreamHlsUrl(uid));
        }
      }
    });
    return map;
  }, [carouselItems]);

  // Trigger prefetch
  useEffect(() => {
    if (videoIds.length > 0 && videoUrlMap.size > 0) {
      initiatePrefetch(videoIds, activeVideoIndex, videoUrlMap);
    }
  }, [videoIds, videoUrlMap, activeVideoIndex, initiatePrefetch]);

  // Preload first video manifest for fast startup
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !carouselItems.length) return;
    
    const firstWithVideo = carouselItems.find(item => item.videoUrl);
    if (!firstWithVideo?.videoUrl) return;
    
    hasPreloadedFirst.current = true;
    const uid = uidFromNode({ src: firstWithVideo.videoUrl });
    if (uid) {
      preloadHlsManifest(generateStreamHlsUrl(uid));
    }
  }, [carouselItems]);

  const {
    carouselRef,
    canScrollLeft,
    canScrollRight,
    scroll,
    isMobile
  } = useCarouselNavigation(carouselItems.length);

  const getVisibleCards = () => {
    if (typeof window === 'undefined') return 3;
    
    const width = window.innerWidth;
    if (width <= 430) return 1.15;
    if (width <= 768) return 1.7;
    if (width <= 1024) return 2.2;
    return 3;
  };

  const [visibleCards, setVisibleCards] = useState(getVisibleCards);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCards(getVisibleCards());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);

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
        
        const left = Math.max(cardRect.left, containerRect.left);
        const right = Math.min(cardRect.right, containerRect.right);
        const visibleWidth = Math.max(0, right - left);
        const visibility = visibleWidth / cardRect.width;
        
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
    handleScroll();
    
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
            style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
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
            style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
          >
            <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
            <div className="relative z-10 text-white">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Button>
        </>
      )}

      {/* Carousel container */}
      <div
        ref={(node) => {
          carouselRef(node);
          containerRef.current = node;
        }}
        className={`flex gap-3 overflow-x-auto scrollbar-hide ${
          isMobile ? 'px-0' : 'px-0'
        }`}
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {carouselItems
          .filter(item => item.videoUrl)
          .map((item, index) => {
            const getCardWidth = () => {
              if (typeof window === 'undefined') return 'w-72';
              
              const width = window.innerWidth;
              if (width <= 430) return 'w-[85vw]';
              if (width <= 768) return 'w-64';
              if (width <= 1024) return 'w-72';
              return 'w-80';
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
                  userFirstName={userFirstName}
                  isOwnProfile={isOwnProfile}
                  isVideoReady={item.videoUrl ? isReady(uidFromNode({ src: item.videoUrl }) || item.id) : true}
                  onReady={(id) => markReadyRef.current(id)}
                  globalMuted={isGloballyMuted}
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
                  const cardWidth = isMobile ? container.offsetWidth * 0.85 : 320;
                  const gap = 12;
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
