import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import Hls from 'hls.js';
import CourseRankBadges from '../CourseRankBadges';

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

const DepthStackCarousel: React.FC<DepthStackCarouselProps> = ({
  highlights,
  onVideoPlay
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mutedVideos, setMutedVideos] = useState<{[key: number]: boolean}>({});
  
  // Ref to track all video elements and HLS instances
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const hlsInstances = useRef<(Hls | null)[]>([]);

  // Filter highlights to only include top 100 courses, sorted by recency
  const top100Highlights = highlights
    .filter(highlight => highlight.globalRank && highlight.globalRank <= 100)
    .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())
    .slice(0, 10); // Limit to 10 most recent

  // Add liquid glass card as second item
  const carouselItems = [
    ...top100Highlights.slice(0, 1), // First video
    { id: 'liquid-glass', type: 'glass' as const }, // Liquid glass card
    ...top100Highlights.slice(1) // Rest of videos
  ];

  const totalItems = carouselItems.length;

  const goToNext = useCallback(() => {
    if (isTransitioning || totalItems === 0) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev + 1) % totalItems);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [totalItems, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning || totalItems === 0) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev - 1 + totalItems) % totalItems);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [totalItems, isTransitioning]);

  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === activeIndex || totalItems === 0) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [activeIndex, isTransitioning, totalItems]);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50
  });

  const toggleMute = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      setMutedVideos(prev => ({
        ...prev,
        [index]: video.muted
      }));
    }
  }, []);

  // Video management effect
  useEffect(() => {
    if (isTransitioning) return;
    
    const timeoutId = setTimeout(() => {
      videoRefs.current.forEach((video, index) => {
        if (video) {
          if (index === activeIndex) {
            // Auto-play active video
            if (video.paused && video.readyState >= 2) {
              video.play().catch(console.error);
            }
          } else {
            // Pause but keep frame for other videos
            if (!video.paused) {
              video.pause();
            }
          }
        }
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [activeIndex, isTransitioning]);

  // Cleanup HLS instances
  useEffect(() => {
    return () => {
      hlsInstances.current.forEach(hls => {
        if (hls) {
          hls.destroy();
        }
      });
    };
  }, []);

  const getCardStyle = (index: number) => {
    const diff = index - activeIndex;
    const maxVisible = 2;
    
    if (Math.abs(diff) > maxVisible) {
      return {
        opacity: 0,
        transform: `translateX(${diff > 0 ? 120 : -120}%) translateZ(-300px) scale(0.6)`,
        zIndex: 0,
        pointerEvents: 'none' as const
      };
    }

    if (diff === 0) {
      // Center card - tall and prominent
      return {
        opacity: 1,
        transform: 'translateX(0%) translateZ(0px) scale(1)',
        zIndex: 10,
        pointerEvents: 'auto' as const
      };
    } else if (Math.abs(diff) === 1) {
      // Adjacent cards - stacked behind
      return {
        opacity: 0.8,
        transform: `translateX(${diff > 0 ? 40 : -40}%) translateZ(-150px) scale(0.9)`,
        zIndex: 5,
        pointerEvents: 'auto' as const
      };
    } else {
      // Far cards
      return {
        opacity: 0.5,
        transform: `translateX(${diff > 0 ? 80 : -80}%) translateZ(-250px) scale(0.75)`,
        zIndex: 2,
        pointerEvents: 'auto' as const
      };
    }
  };

  if (totalItems === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-white/60">
        <p>No top 100 course highlights available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[36rem] overflow-hidden" style={{ perspective: '1200px' }}>
      {/* Carousel container */}
      <div 
        ref={swipeRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {carouselItems.map((item, index) => {
          const cardStyle = getCardStyle(index);
          
          if ('type' in item && item.type === 'glass') {
            // Liquid glass card
            return (
              <div
                key={item.id}
                className="absolute w-72 h-96 cursor-pointer transition-all duration-500 ease-out"
                style={cardStyle}
                onClick={() => goToIndex(index)}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden bg-white/5 backdrop-blur-2xl border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5" />
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white/60">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-white/20" />
                      </div>
                      <p className="text-sm">Liquid Glass Card</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // Video card
          const highlight = item as HighlightVideo;
          return (
            <div
              key={highlight.id}
              className="absolute w-72 h-96 cursor-pointer transition-all duration-500 ease-out"
              style={cardStyle}
              onClick={() => goToIndex(index)}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden bg-black">
                {highlight.videoUrl ? (
                  <video
                    ref={(el) => {
                      if (el && highlight.videoUrl) {
                        videoRefs.current[index] = el;
                        
                        // Clean up existing HLS
                        if (hlsInstances.current[index]) {
                          hlsInstances.current[index]?.destroy();
                        }
                        
                        // Setup video
                        if (highlight.videoUrl.includes('.m3u8')) {
                          if (Hls.isSupported()) {
                            const hls = new Hls({
                              enableWorker: false,
                              lowLatencyMode: false,
                              startLevel: 0,
                              maxBufferLength: 10
                            });
                            hlsInstances.current[index] = hls;
                            hls.loadSource(highlight.videoUrl);
                            hls.attachMedia(el);
                            
                            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                              el.currentTime = 0.1;
                            });
                          }
                        } else {
                          el.src = highlight.videoUrl;
                        }
                      }
                    }}
                    className="w-full h-full object-cover"
                    poster={highlight.thumbnail}
                    muted={mutedVideos[index] !== false}
                    loop
                    playsInline
                    controls={false}
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={highlight.thumbnail}
                    alt={highlight.courseName}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* Ranking badges - top left */}
                <div className="absolute top-3 left-3">
                  <CourseRankBadges 
                    globalRank={highlight.globalRank}
                    regionalRank={highlight.regionalRank}
                    usaRank={highlight.usaRank}
                    country={highlight.country}
                  />
                </div>

                {/* Mute/Unmute button - bottom right */}
                <button
                  onClick={(e) => toggleMute(index, e)}
                  className="absolute bottom-3 right-3 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors z-20"
                >
                  {mutedVideos[index] !== false ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                
                {/* Duration badge - bottom left */}
                {highlight.duration && (
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {highlight.duration}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Navigation arrows */}
      <button
        onClick={goToPrevious}
        disabled={isTransitioning}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50 z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={goToNext}
        disabled={isTransitioning}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50 z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      
      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            disabled={isTransitioning}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === activeIndex 
                ? 'bg-white' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default DepthStackCarousel;