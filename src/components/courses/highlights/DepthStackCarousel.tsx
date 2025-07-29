import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, MapPin, Trophy } from 'lucide-react';
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
  
  // Ref to track all video elements and HLS instances
  const videoRefs = React.useRef<(HTMLVideoElement | null)[]>([]);
  const hlsInstances = React.useRef<(Hls | null)[]>([]);

  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev + 1) % highlights.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [highlights.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev - 1 + highlights.length) % highlights.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [highlights.length, isTransitioning]);

  const goToIndex = useCallback((index: number) => {
    if (isTransitioning || index === activeIndex) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [activeIndex, isTransitioning]);

  const swipeRef = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    threshold: 50
  });

  // Video management effect
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === activeIndex) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
    });
  }, [activeIndex]);

  // Cleanup HLS instances on unmount
  useEffect(() => {
    return () => {
      hlsInstances.current.forEach(hls => {
        if (hls) {
          hls.destroy();
        }
      });
    };
  }, []);

  // Auto-advance removed - user controls only

  const getCardStyle = (index: number, isMobile: boolean) => {
    const diff = index - activeIndex;
    const maxVisible = isMobile ? 1 : 2; // Show 1 card per side on mobile, 2 on desktop
    
    if (Math.abs(diff) > maxVisible) {
      return {
        opacity: 0,
        transform: `translateX(${diff > 0 ? 120 : -120}%) translateZ(-200px) scale(0.7)`,
        zIndex: 0,
        pointerEvents: 'none' as const
      };
    }

    if (diff === 0) {
      // Center card
      return {
        opacity: 1,
        transform: 'translateX(0%) translateZ(0px) scale(1)',
        zIndex: 10,
        pointerEvents: 'auto' as const
      };
    } else if (Math.abs(diff) === 1) {
      // Adjacent cards
      return {
        opacity: 0.7,
        transform: `translateX(${diff > 0 ? 60 : -60}%) translateZ(-100px) scale(0.85)`,
        zIndex: 5,
        pointerEvents: 'auto' as const
      };
    } else {
      // Far cards (desktop only)
      return {
        opacity: 0.4,
        transform: `translateX(${diff > 0 ? 100 : -100}%) translateZ(-150px) scale(0.75)`,
        zIndex: 2,
        pointerEvents: 'auto' as const
      };
    }
  };

  if (!highlights.length) {
    return (
      <div className="flex items-center justify-center h-96 text-white/60">
        <p>No highlights available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 overflow-hidden" style={{ perspective: '1000px' }}>
      {/* Carousel container */}
      <div 
        ref={swipeRef}
        className="relative w-full h-full flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {highlights.map((highlight, index) => {
          const isMobile = window.innerWidth < 768;
          const cardStyle = getCardStyle(index, isMobile);
          
          return (
            <div
              key={highlight.id}
              className={`absolute w-80 h-72 cursor-pointer transition-all duration-500 ease-out ${
                isTransitioning ? 'pointer-events-none' : ''
              }`}
              style={cardStyle}
              onClick={() => index !== activeIndex ? goToIndex(index) : onVideoPlay?.(highlight.id)}
            >
              {/* Video card */}
              <div className="relative w-full h-full bg-white/5 backdrop-blur-2xl border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                {/* Video player */}
                <div className="relative w-full h-48 overflow-hidden bg-black">
                  {highlight.videoUrl ? (
                    <video
                      ref={(el) => {
                        if (el && highlight.videoUrl) {
                          videoRefs.current[index] = el;
                          
                          // Clean up previous HLS instance
                          if (hlsInstances.current[index]) {
                            hlsInstances.current[index]?.destroy();
                          }
                          
                          // Check if it's an HLS stream
                          if (highlight.videoUrl.includes('.m3u8')) {
                            if (Hls.isSupported()) {
                              const hls = new Hls({
                                enableWorker: false,
                                lowLatencyMode: false
                              });
                              hlsInstances.current[index] = hls;
                              hls.loadSource(highlight.videoUrl);
                              hls.attachMedia(el);
                              
                              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                                console.log('HLS manifest parsed for:', highlight.videoUrl);
                                if (index === activeIndex) {
                                  el.play().catch(console.error);
                                }
                              });
                              
                              hls.on(Hls.Events.ERROR, (event, data) => {
                                console.error('HLS error:', event, data);
                              });
                            } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
                              // Safari native HLS support
                              el.src = highlight.videoUrl;
                            }
                          } else {
                            // Regular video file
                            el.src = highlight.videoUrl;
                          }
                        }
                      }}
                      className="w-full h-full object-cover"
                      poster={highlight.thumbnail}
                      muted
                      loop
                      playsInline
                      controls={false}
                      onLoadedData={(e) => {
                        console.log('Video loaded:', highlight.videoUrl);
                        if (index === activeIndex) {
                          e.currentTarget.play().catch(console.error);
                        }
                      }}
                      onError={(e) => {
                        console.error('Video error for:', highlight.videoUrl, e);
                      }}
                      onCanPlay={() => {
                        console.log('Video can play:', highlight.videoUrl);
                      }}
                    />
                  ) : (
                    <img
                      src={highlight.thumbnail}
                      alt={highlight.courseName}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Play button overlay for non-active cards */}
                  {index !== activeIndex && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Duration badge */}
                  {highlight.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {highlight.duration}
                    </div>
                  )}
                  
                  {/* Course ranking badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 scale-75 origin-top-left mr-16">
                    <CourseRankBadges
                      globalRank={highlight.globalRank}
                      regionalRank={highlight.regionalRank}
                      usaRank={highlight.usaRank}
                      country={highlight.country}
                      positioning="top-left"
                    />
                  </div>
                  
                  {/* ClbHouse average rating top right */}
                  {highlight.averageRating && (
                    <div className="absolute top-2 right-2 scale-75 origin-top-right z-20">
                      <div className="flex items-center gap-2 px-1.5 py-1.5 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl shadow-sm">
                        <img
                          src="/lovable-uploads/2b0e2d79-6b26-4b6b-a27b-8dd5f8cc5aad.png"
                          alt="Clubhouse Community Rating"
                          className="h-6 w-6"
                          style={{ objectFit: 'contain' }}
                        />
                        <span className="text-base font-bold text-white">{highlight.averageRating}/10</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Course info */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-1 line-clamp-1">
                    {highlight.courseName}
                  </h3>
                  <div className="flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3 text-white/60" />
                    <span className="text-white/80 text-sm">{highlight.location}</span>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">
                    {highlight.caption}
                  </p>
                </div>
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
        {highlights.map((_, index) => (
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