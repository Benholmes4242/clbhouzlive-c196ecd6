import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useCarouselNavigation } from '@/hooks/useCarouselNavigation';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { Button } from '@/components/ui/button';
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

const VideoCard: React.FC<{ 
  video: HighlightVideo; 
  isActive: boolean; 
  onVideoPlay?: (videoId: string) => void;
}> = ({ video, isActive, onVideoPlay }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(
    video.videoUrl || '', 
    video.id, 
    video.thumbnail
  );

  useEffect(() => {
    if (videoRef.current) {
      if (isActive && !isPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else if (!isActive && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, isPlaying]);

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
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative h-[28rem] rounded-lg overflow-hidden bg-black cursor-pointer group" onClick={handleVideoClick}>
      {video.videoUrl && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={isMuted}
          loop
          playsInline
          poster={thumbnailReady ? thumbnailSrc : video.thumbnail}
        >
          <source src={video.videoUrl} type="video/mp4" />
        </video>
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
  return (
    <div 
      className="relative h-[28rem] rounded-lg overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20"
      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
    </div>
  );
};

const DepthStackCarousel: React.FC<DepthStackCarouselProps> = ({
  highlights,
  onVideoPlay
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
        ref={carouselRef}
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
                isActive={index === 0} // Only first card autoplays
                onVideoPlay={onVideoPlay}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepthStackCarousel;