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

      {/* Fanned Video Stack Container */}
      <div className="relative flex-shrink-0 group" style={{ marginRight: isMobile ? '20px' : '40px' }}>
        {/* Stack of video cards - show up to 4 videos */}
        {videos.slice(0, 4).map((video, index) => {
          const isTopCard = index === 0;
          const totalCards = Math.min(videos.length, 4);
          
          // Calculate rotation and offset for fan effect
          const baseRotation = index === 0 ? 0 : index === 1 ? -3 : index === 2 ? 3 : -6;
          const hoverRotation = index === 0 ? 0 : index === 1 ? -8 : index === 2 ? 8 : -12;
          const zIndex = 30 - index;
          const xOffset = index * (isMobile ? 8 : 12);
          const yOffset = index * (isMobile ? 4 : 6);
          
          return (
            <div
              key={`video-stack-${index}`}
              className="absolute cursor-pointer transition-all duration-300 ease-out"
              style={{
                width: isMobile ? '180px' : '270px',
                height: isMobile ? '220px' : '330px',
                zIndex: zIndex,
                transform: `
                  translateX(${xOffset}px) 
                  translateY(${yOffset}px) 
                  rotate(${baseRotation}deg)
                `,
                transformOrigin: 'center bottom',
              }}
              onClick={() => {
                if (onOpenFullVideo) {
                  // Find the actual index in the full videos array
                  const videoIndex = videos.findIndex(v => v.videoUrl === video.videoUrl);
                  onOpenFullVideo(videoIndex);
                }
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = `
                    translateX(${xOffset + (index * 8)}px) 
                    translateY(${yOffset - (index * 4)}px) 
                    rotate(${hoverRotation}deg) 
                    scale(${isTopCard ? 1.02 : 1.01})
                  `;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = `
                    translateX(${xOffset}px) 
                    translateY(${yOffset}px) 
                    rotate(${baseRotation}deg) 
                    scale(1)
                  `;
                }
              }}
            >
              <div className="relative w-full h-full rounded-xl bg-black overflow-hidden shadow-2xl">
                {/* Enhanced shadow for depth */}
                <div 
                  className="absolute inset-0 rounded-xl"
                  style={{
                    boxShadow: `
                      0 ${4 + index * 2}px ${12 + index * 4}px rgba(0, 0, 0, 0.3),
                      0 ${2 + index}px ${6 + index * 2}px rgba(0, 0, 0, 0.2)
                    `
                  }}
                />
                
                {/* Video Player */}
                <div className="relative w-full h-full">
                  <EnhancedVideoPlayer
                    src={video.videoUrl}
                    autoplay={isTopCard}
                    muted={true}
                    loop={true}
                    className="w-full h-full object-contain"
                    enableHLS={true}
                    key={`fanned-video-${index}-${video.videoUrl}`}
                  />
                </div>

                {/* Only show user info on the top card */}
                {isTopCard && (
                  <div className="absolute bottom-4 left-4 text-white">
                    {video.username && (
                      <p className="text-lg opacity-90 font-medium leading-tight">
                        @{video.username}
                      </p>
                    )}
                    {video.timestamp && (
                      <p className="text-sm opacity-80 leading-tight">
                        {formatTimestamp(video.timestamp)}
                      </p>
                    )}
                  </div>
                )}

                {/* Card number indicator for non-top cards */}
                {!isTopCard && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {index + 1}
                  </div>
                )}

                {/* Subtle border */}
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
              </div>
            </div>
          );
        })}

        {/* Navigation arrows for the stack */}
        {videos.length > 1 && (
          <>
            {/* Left Arrow - Previous video in stack */}
            {currentVideoIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevVideo();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 z-40 p-1 rounded-full text-white bg-black/40 hover:bg-black/60 transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Previous video"
              >
                <ChevronLeft className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </button>
            )}

            {/* Right Arrow - Next video in stack */}
            {currentVideoIndex < videos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextVideo();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 z-40 p-1 rounded-full text-white bg-black/40 hover:bg-black/60 transition-all duration-300 opacity-0 group-hover:opacity-100"
                aria-label="Next video"
              >
                <ChevronRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
              </button>
            )}
          </>
        )}

        {/* "Swipe for more" indicator */}
        {videos.length > 4 && (
          <div className="absolute -bottom-6 right-0 text-white text-xs opacity-60">
            {isMobile ? 'Tap to see more' : 'Click to see more'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseVideoOverlay;