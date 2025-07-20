import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface VideoData {
  videoUrl: string;
  username?: string;
  timestamp?: string;
}

interface CourseVideoOverlayProps {
  videos: VideoData[];
  courseName: string;
  onOpenFullVideo?: (videoIndex: number) => void;
}

const CourseVideoOverlay: React.FC<CourseVideoOverlayProps> = ({ 
  videos, 
  courseName,
  onOpenFullVideo 
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadVideoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const currentVideo = videos[currentVideoIndex];
  const nextVideoData = videos[(currentVideoIndex + 1) % videos.length];
  const prevVideoData = videos[(currentVideoIndex - 1 + videos.length) % videos.length];
  const hasMultipleVideos = videos.length > 1;

  const handleOverlayClick = () => {
    if (onOpenFullVideo) {
      onOpenFullVideo(currentVideoIndex);
    }
  };

  const goToNextVideo = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Add a small delay for smooth transition
    setTimeout(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
      setIsTransitioning(false);
    }, 150);
  };

  const goToPrevVideo = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    // Add a small delay for smooth transition  
    setTimeout(() => {
      setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
      setIsTransitioning(false);
    }, 150);
  };

  // Swipe gesture hook for mobile
  const swipeRef = useSwipeGesture({
    onSwipeLeft: goToNextVideo,
    onSwipeRight: goToPrevVideo,
    threshold: 50
  });

  // Helper function to format timestamp
  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    
    if (diffInDays < 1) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInWeeks === 1) return '1 week ago';
    return `${diffInWeeks} weeks ago`;
  };

  return (
    <div className="fixed bottom-6 left-6 right-6 z-20 flex items-end justify-between">
      {/* Latest Posts Label - Left aligned with club title */}
      <div className={`mb-6 ${isMobile ? 'max-w-[200px]' : ''}`}>
        <p className={`text-white font-bold leading-tight ${isMobile ? 'text-3xl' : 'text-xl'}`}>
          Latest Posts from {courseName}
        </p>
      </div>

      {/* Video Container */}
      <div
        ref={swipeRef}
        className="relative cursor-pointer group flex-shrink-0"
        style={{ 
          width: isMobile ? '180px' : '270px',
          height: isMobile ? '220px' : '330px'
        }}
        onClick={handleOverlayClick}
      >
        <div className="relative w-full h-full rounded-xl bg-black shadow-2xl overflow-hidden">
          {/* Main Video Player */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <EnhancedVideoPlayer
              ref={videoRef}
              src={currentVideo?.videoUrl}
              autoplay={true}
              muted={true}
              loop={true}
              className="w-full h-full object-contain"
              enableHLS={true}
              key={`video-${currentVideoIndex}-${currentVideo?.videoUrl}`}
            />
          </div>
          
          {/* Preload next video (invisible) */}
          {hasMultipleVideos && nextVideoData && (
            <div className="absolute inset-0 opacity-0 pointer-events-none">
              <EnhancedVideoPlayer
                ref={preloadVideoRef}
                src={nextVideoData.videoUrl}
                autoplay={false}
                muted={true}
                loop={true}
                className="w-full h-full object-contain"
                enableHLS={true}
              />
            </div>
          )}
          
          {/* Navigation Arrows Overlay */}
          {hasMultipleVideos && (
            <>
              {/* Left Arrow - Only show when not on first video */}
              {currentVideoIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevVideo();
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 p-1 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100"
                  aria-label="Previous video"
                >
                  <ChevronLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                </button>
              )}

              {/* Right Arrow - Only show when not on last video */}
              {currentVideoIndex < videos.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNextVideo();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 p-1 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 opacity-0 group-hover:opacity-100"
                  aria-label="Next video"
                >
                  <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                </button>
              )}
            </>
          )}
          
          {/* Bottom Left Overlay - Username and Timestamp */}
          <div className="absolute bottom-4 left-4 text-white">
            {currentVideo?.username && (
              <p className="text-lg opacity-90 font-medium leading-tight">
                @{currentVideo.username}
              </p>
            )}
            {currentVideo?.timestamp && (
              <p className="text-sm opacity-80 leading-tight">
                {formatTimestamp(currentVideo.timestamp)}
              </p>
            )}
          </div>
          
          {/* Subtle Border */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
        </div>
      </div>
    </div>
  );
};

export default CourseVideoOverlay;