import React, { useState, useRef } from 'react';
import { Play, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  const currentVideo = videos[currentVideoIndex];
  const hasMultipleVideos = videos.length > 1;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

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

      {/* Video Carousel Container - Right side */}
      <div className="relative flex items-center">
        {/* Left Arrow - Desktop */}
        {hasMultipleVideos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevVideo();
            }}
            className="absolute left-[-50px] z-30 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-label="Previous video"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Video Container */}
        <div
          ref={swipeRef}
          className="relative cursor-pointer group flex-shrink-0"
          style={{ 
            width: isMobile ? '180px' : '270px',
            height: isMobile ? '220px' : '330px'
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleOverlayClick}
        >
          <div className="relative w-full h-full rounded-xl bg-black shadow-2xl overflow-hidden">
            <EnhancedVideoPlayer
              ref={videoRef}
              src={currentVideo?.videoUrl}
              autoplay={true}
              muted={isMuted}
              loop={true}
              className="w-full h-full object-contain"
              enableHLS={true}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Top Controls */}
              <div className="flex justify-end">
                <button
                  onClick={handleMuteToggle}
                  className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Center Play Button */}
              <div className="flex items-center justify-center">
                <button
                  onClick={handlePlayToggle}
                  className="p-4 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  <Play className="h-8 w-8" fill="currentColor" />
                </button>
              </div>
              
              {/* Mobile Swipe Arrows - Show on hover */}
              {hasMultipleVideos && isMobile && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      prevVideo();
                    }}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    aria-label="Previous video"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      nextVideo();
                    }}
                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    aria-label="Next video"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
            
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

        {/* Right Arrow - Desktop */}
        {hasMultipleVideos && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextVideo();
            }}
            className="absolute right-[-50px] z-30 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-label="Next video"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseVideoOverlay;