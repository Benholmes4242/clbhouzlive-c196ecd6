import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useIsMobile } from '@/hooks/use-mobile';
import { ProfileMediaItem } from '@/hooks/useProfileMediaManager';

interface ProfileMediaCarouselProps {
  mediaItems: ProfileMediaItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

// Golf-themed indicators
const GolfIndicator: React.FC<{ 
  isActive: boolean; 
  onClick: () => void; 
  index: number;
  total: number;
}> = ({ isActive, onClick, index, total }) => (
  <button
    onClick={onClick}
    className={`
      w-3 h-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary
      ${isActive 
        ? 'bg-white scale-110 shadow-lg' 
        : 'bg-white/50 hover:bg-white/75'
      }
    `}
    aria-label={`Slide ${index + 1} of ${total}`}
  />
);

// Mini thumbnail indicators
const ThumbnailIndicator: React.FC<{
  item: ProfileMediaItem;
  isActive: boolean;
  onClick: () => void;
  index: number;
  total: number;
}> = ({ item, isActive, onClick, index, total }) => {
  const imageUrl = item.media_type === 'video' 
    ? (item.thumbnail_url || item.media_url) 
    : item.media_url;

  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8 rounded-full overflow-hidden border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary
        ${isActive 
          ? 'border-white scale-110' 
          : 'border-white/50 hover:border-white/75'
        }
      `}
      aria-label={`Slide ${index + 1} of ${total}`}
    >
      <img 
        src={imageUrl} 
        alt={`Media ${index + 1}`}
        className="w-full h-full object-cover"
      />
    </button>
  );
};

const ProfileMediaCarousel: React.FC<ProfileMediaCarouselProps> = ({
  mediaItems,
  currentIndex,
  onIndexChange,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  
  const currentItem = mediaItems[currentIndex];
  const isVideo = currentItem?.media_type === 'video';
  const hasMultipleItems = mediaItems.length > 1;

  // Preload next and previous items
  useEffect(() => {
    const preloadIndexes = [];
    if (currentIndex > 0) preloadIndexes.push(currentIndex - 1);
    if (currentIndex < mediaItems.length - 1) preloadIndexes.push(currentIndex + 1);

    preloadIndexes.forEach(index => {
      const item = mediaItems[index];
      if (item) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = item.media_type === 'video' ? 'video' : 'image';
        link.href = item.media_url;
        document.head.appendChild(link);
        
        // Clean up after 5 seconds
        setTimeout(() => {
          if (document.head.contains(link)) {
            document.head.removeChild(link);
          }
        }, 5000);
      }
    });
  }, [currentIndex, mediaItems]);

  // Handle video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isPlaying, isVideo]);

  // Reset video state when slide changes
  useEffect(() => {
    setIsPlaying(false);
    setVideoEnded(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [currentIndex]);

  // Auto-play video on mobile when slide becomes active
  useEffect(() => {
    if (isMobile && isVideo && currentItem) {
      // Start playing after a short delay
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isVideo, currentItem]);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
    setIsPlaying(false);
    
    // Check if there's a paired photo to transition to
    // For now, just loop the video
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        setVideoEnded(false);
        // Don't auto-replay
      }
    }, 1000);
  }, []);

  const nextSlide = useCallback(() => {
    if (mediaItems.length <= 1) return;
    onIndexChange((currentIndex + 1) % mediaItems.length);
  }, [currentIndex, mediaItems.length, onIndexChange]);

  const prevSlide = useCallback(() => {
    if (mediaItems.length <= 1) return;
    onIndexChange((currentIndex - 1 + mediaItems.length) % mediaItems.length);
  }, [currentIndex, mediaItems.length, onIndexChange]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: nextSlide,
    onSwipedRight: prevSlide,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  if (!currentItem) {
    return (
      <div className={`relative w-full h-full bg-muted flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No media available</p>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full h-full overflow-hidden ${className}`}
      {...swipeHandlers}
    >
      {/* Main media content */}
      <div className="relative w-full h-full">
        {isVideo ? (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={currentItem.media_url}
            poster={currentItem.thumbnail_url}
            muted={isMuted}
            playsInline
            onEnded={handleVideoEnd}
            onError={(e) => console.error('Video error:', e)}
            preload="metadata"
          />
        ) : (
          <img
            src={currentItem.media_url}
            alt={`Profile media ${currentIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading={currentIndex === 0 ? 'eager' : 'lazy'}
          />
        )}
        
        {/* Video controls overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="bg-black/20 backdrop-blur-sm text-white hover:bg-black/30"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation arrows - Desktop */}
      {!isMobile && hasMultipleItems && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/20 backdrop-blur-sm text-white hover:bg-black/30 z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {hasMultipleItems && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          {/* Golf ball indicators for 1-3 items */}
          {mediaItems.length <= 3 ? (
            <div className="flex gap-2">
              {mediaItems.map((_, index) => (
                <GolfIndicator
                  key={index}
                  isActive={index === currentIndex}
                  onClick={() => onIndexChange(index)}
                  index={index}
                  total={mediaItems.length}
                />
              ))}
            </div>
          ) : (
            /* Mini thumbnails for 4-5 items */
            <div className="flex gap-2">
              {mediaItems.map((item, index) => (
                <ThumbnailIndicator
                  key={item.id}
                  item={item}
                  isActive={index === currentIndex}
                  onClick={() => onIndexChange(index)}
                  index={index}
                  total={mediaItems.length}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media counter */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
          {isVideo ? '📹' : '📸'} {currentIndex + 1}/{mediaItems.length}
        </div>
      </div>

      {/* Processing status for header enhancement */}
      {currentItem.header_processing_status === 'processing' && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            ✨ Enhancing...
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMediaCarousel;