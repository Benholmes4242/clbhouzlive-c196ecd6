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
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const currentVideo = videos[currentVideoIndex];
  const hasMultipleVideos = videos.length > 1;

  // Debug logging
  console.log('Current video index:', currentVideoIndex);
  console.log('Current video:', currentVideo);
  console.log('All videos:', videos);

  const handleOverlayClick = () => {
    if (onOpenFullVideo) {
      onOpenFullVideo(currentVideoIndex);
    }
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  // Swipe gesture hook for mobile
  const swipeRef = useSwipeGesture({
    onSwipeLeft: nextVideo,
    onSwipeRight: prevVideo,
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
      <div className="max-w-[200px] mb-6">
        <p className={`text-white font-bold leading-tight ${isMobile ? 'text-2xl' : 'text-lg'}`}>
          Latest Posts from {courseName}
        </p>
        {hasMultipleVideos && (
          <p className="text-white/80 text-sm mt-1">
            {currentVideoIndex + 1} of {videos.length}
          </p>
        )}
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
          <EnhancedVideoPlayer
            key={`video-${currentVideoIndex}-${currentVideo?.videoUrl}`}
            ref={videoRef}
            src={currentVideo?.videoUrl}
            autoplay={true}
            muted={true}
            loop={true}
            className="w-full h-full object-contain"
            enableHLS={true}
          />
          
          {/* Navigation Arrows Overlay */}
          {hasMultipleVideos && (
            <>
              {/* Left Arrow - Overlay on video */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevVideo();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Previous video"
              >
                <ChevronLeft className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
              </button>

              {/* Right Arrow - Overlay on video */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextVideo();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Next video"
              >
                <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
              </button>
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