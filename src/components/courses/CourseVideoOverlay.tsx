import React, { useState, useRef, useLayoutEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';

interface VideoData {
  videoUrl: string;
  displayName?: string;
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const preloadVideoRef = useRef<HTMLVideoElement>(null);
  const hasPreloadedFirst = useRef(false);
  const isMobile = useIsMobile();

  // Eager preload first video's HLS manifest on mount
  useLayoutEffect(() => {
    if (hasPreloadedFirst.current || !videos?.length) return;
    
    const firstVideo = videos[0];
    if (firstVideo?.videoUrl) {
      const uid = uidFromNode({ media_url: firstVideo.videoUrl });
      if (uid) {
        preloadHlsManifest(generateStreamHlsUrl(uid));
        hasPreloadedFirst.current = true;
      }
    }
  }, [videos]);

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

  const handleFullscreenToggle = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
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

  // Get the videos to show in the fan (up to 4 cards)
  const fanVideos = videos.slice(0, Math.min(4, videos.length));
  const displayCount = fanVideos.length;

  // Fullscreen modal
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
        <div 
          className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
          style={{
            width: '100vw',
            height: '75vh',
            maxWidth: '100vw'
          }}
        >
          {/* Fullscreen Video Player */}
          <EnhancedVideoPlayer
            src={currentVideo?.videoUrl}
            autoplay={true}
            muted={isMuted}
            loop={true}
            className="w-full h-full object-contain"
            enableHLS={true}
            hideControls={true}
            key={`fullscreen-video-${currentVideoIndex}-${currentVideo?.videoUrl}`}
          />

          {/* Top Right Controls */}
          <div className="absolute top-4 right-4 z-30 flex gap-2">
            {/* Mute/Unmute Button */}
            <button
              onClick={handleMuteToggle}
              className="p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <VolumeX className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </button>

            {/* Minimize Button */}
            <button
              onClick={handleFullscreenToggle}
              className="p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300"
              aria-label="Exit fullscreen"
            >
              <Minimize2 className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation Arrows - Desktop */}
          {hasMultipleVideos && !isMobile && (
            <>
              {/* Left Arrow */}
              <button
                onClick={goToPrevVideo}
                disabled={currentVideoIndex === 0}
                className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 p-4 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Previous video"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={goToNextVideo}
                disabled={currentVideoIndex >= videos.length - 1}
                className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 p-4 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
                aria-label="Next video"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Bottom Info */}
          <div className="absolute bottom-6 left-6 text-white z-30">
            {currentVideo?.displayName && (
              <p className="text-2xl font-medium mb-1">
                {currentVideo.displayName}
              </p>
            )}
            {currentVideo?.timestamp && (
              <p className="text-lg opacity-80">
                {formatTimestamp(currentVideo.timestamp)}
              </p>
            )}
            <p className="text-sm opacity-60 mt-2">
              {currentVideoIndex + 1} of {videos.length}
            </p>
          </div>

          {/* Mobile Swipe Area */}
          {isMobile && hasMultipleVideos && (
            <div
              ref={swipeRef}
              className="absolute inset-0 z-20"
              style={{ touchAction: 'pan-y' }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 right-6 z-20 flex items-end justify-between">
      {/* Latest Posts Label - Left aligned with club title */}
      <div className={`mb-6 ${isMobile ? 'max-w-[200px]' : ''}`}>
        <p className={`text-white font-bold leading-tight ${isMobile ? 'text-3xl' : 'text-xl'}`}>
          Latest Posts from {courseName}
        </p>
      </div>

      {/* Fanned Video Card Stack */}
      <div
        ref={swipeRef}
        className="relative cursor-pointer group flex-shrink-0 hover:scale-105 transition-transform duration-300"
        style={{ 
          width: isMobile ? '180px' : '270px',
          height: isMobile ? '220px' : '330px'
        }}
      >
        {/* Background Fan Cards */}
        {fanVideos.map((video, index) => {
          if (index === currentVideoIndex) return null; // Skip the current active card
          
          const isNext = index === (currentVideoIndex + 1) % videos.length;
          const isPrev = index === (currentVideoIndex - 1 + videos.length) % videos.length;
          const isFarBack = !isNext && !isPrev;
          
          // Calculate positions for fan effect
          let transform = '';
          let zIndex = 10;
          let opacity = 0.7;
          
          if (isNext) {
            transform = isMobile 
              ? 'translateX(8px) translateY(4px) rotate(2deg)' 
              : 'translateX(12px) translateY(6px) rotate(3deg)';
            zIndex = 15;
            opacity = 0.8;
          } else if (isPrev) {
            transform = isMobile 
              ? 'translateX(-8px) translateY(4px) rotate(-2deg)' 
              : 'translateX(-12px) translateY(6px) rotate(-3deg)';
            zIndex = 15;
            opacity = 0.8;
          } else if (isFarBack) {
            transform = isMobile 
              ? 'translateX(4px) translateY(8px) rotate(1deg)' 
              : 'translateX(6px) translateY(12px) rotate(1.5deg)';
            zIndex = 5;
            opacity = 0.6;
          }

          return (
            <div
              key={`fan-${index}`}
              className="absolute inset-0 rounded-xl bg-black shadow-lg overflow-hidden transition-all duration-300 group-hover:scale-105"
              style={{
                transform,
                zIndex,
                opacity,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentVideoIndex(index);
              }}
            >
              <EnhancedVideoPlayer
                src={video.videoUrl}
                autoplay={false}
                muted={true}
                loop={true}
                className="w-full h-full object-contain"
                enableHLS={true}
                hideControls={true}
              />
              <div className="absolute inset-0 rounded-xl ring-1 ring-white/10" />
            </div>
          );
        })}

        {/* Main Active Video Card */}
        <div 
          className="relative w-full h-full rounded-xl bg-black shadow-2xl overflow-hidden z-20"
          onClick={handleOverlayClick}
        >
          {/* Main Video Player */}
          <div className={`absolute inset-0 transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <EnhancedVideoPlayer
              ref={videoRef}
              src={currentVideo?.videoUrl}
              autoplay={true}
              muted={isMuted}
              loop={true}
              className="w-full h-full object-contain"
              enableHLS={true}
              hideControls={true}
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
                  hideControls={true}
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
          
          {/* Bottom Left Overlay - Creator Name and Timestamp */}
          <div className="absolute bottom-4 left-4 text-white z-25">
            {currentVideo?.displayName && (
              <p className="text-lg opacity-90 font-medium leading-tight">
                {currentVideo.displayName}
              </p>
            )}
            {currentVideo?.timestamp && (
              <p className="text-sm opacity-80 leading-tight">
                {formatTimestamp(currentVideo.timestamp)}
              </p>
            )}
          </div>

          {/* Fullscreen Icon - Top Right of Video Card */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFullscreenToggle();
            }}
            className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="Open fullscreen"
          >
            <Maximize2 className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
          </button>
          
          {/* Subtle Border */}
          <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
        </div>

        {/* Swipe Indicator (subtle hint) */}
        {hasMultipleVideos && (
          <div className="absolute -bottom-6 right-0 text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Swipe or click cards
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseVideoOverlay;