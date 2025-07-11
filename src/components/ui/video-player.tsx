import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThumbnailGenerator } from '@/components/posts/video/ThumbnailGenerator';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onClick?: () => void;
  showOverlayControls?: boolean;
  showVideoIcon?: boolean;
  videoId?: string; // Add videoId for thumbnail generation
  showMuteButton?: boolean; // Control whether to show mute button in top-left
  isInFeed?: boolean; // Indicates if this video is in the main feed
  videoRef?: React.RefObject<HTMLVideoElement>; // Allow external ref
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  autoplay = false,
  muted = true,
  loop = true,
  controls = false,
  className = '',
  onPlay,
  onPause,
  onClick,
  showOverlayControls = true,
  showVideoIcon = false,
  videoId,
  showMuteButton = true,
  isInFeed = false,
  videoRef: externalVideoRef
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const { isGloballyMuted, setGlobalMute } = useGlobalAudio();
  
  // Generate thumbnail for better UX
  const thumbnailId = videoId || `video-${src.split('/').pop()?.split('.')[0] || 'unknown'}`;
  const { thumbnailSrc, thumbnailReady } = useThumbnailGenerator(src, thumbnailId, poster);
  
  // Use generated thumbnail or fallback to provided poster
  const effectivePoster = thumbnailReady && thumbnailSrc ? thumbnailSrc : poster;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial properties for optimized loading
    video.muted = isInFeed ? isGloballyMuted : muted;
    video.loop = loop;
    video.playsInline = true; // Critical for mobile autoplay
    video.setAttribute('playsinline', 'true'); // iOS compatibility
    video.preload = 'none'; // Don't preload for mobile performance

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleVolumeChange = () => {
      setIsMuted(video.muted);
    };

    const handleLoadedMetadata = () => {
      // Disable autoplay for index feed videos
      if (autoplay && video.paused && !isInFeed) {
        video.currentTime = 0;
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Disable immediate autoplay for index feed videos
    if (autoplay && !isInFeed) {
      video.currentTime = 0;
      // Use requestAnimationFrame for smoother autoplay timing
      requestAnimationFrame(() => {
        video.play().catch(error => {
          console.log('Autoplay prevented:', error);
        });
      });
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [autoplay, muted, loop, onPlay, onPause, isGloballyMuted, isInFeed]);

  // Update video mute state when global mute state changes (for feed videos)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isInFeed) return;
    
    video.muted = isGloballyMuted;
    setIsMuted(isGloballyMuted);
  }, [isGloballyMuted, isInFeed]);

  const togglePlayPause = (e?: React.MouseEvent | Event) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    const newMutedState = !video.muted;
    video.muted = newMutedState;
    setIsMuted(newMutedState);
    
    // Update global mute state if this is a feed video
    if (isInFeed) {
      setGlobalMute(newMutedState);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  };

  const handleVideoClick = () => {
    // Only handle clicks if not in feed (let MediaContainer handle feed interactions)
    if (!isInFeed) {
      if (onClick) {
        onClick();
      } else {
        togglePlayPause({} as React.MouseEvent);
      }
    }
  };

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={effectivePoster}
        className="w-full h-full object-cover cursor-pointer"
        playsInline
        muted={muted}
        loop={loop}
        preload="none"
        webkit-playsinline="true"
        x5-playsinline="true"
        onClick={handleVideoClick}
      />

      {/* Video Icon Overlay */}
      {showVideoIcon && (
        <div className="absolute bottom-2 right-2 bg-black/70 rounded-full p-1.5">
          <Play className="h-3 w-3 text-white fill-white" />
        </div>
      )}

      {/* Overlay Controls */}
      {showOverlayControls && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Play/Pause Button */}
          <Button
            onClick={togglePlayPause}
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white border-0 backdrop-blur-sm"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-0.5" />
            )}
          </Button>
        </div>
      )}

      {/* Corner Controls */}
      {showOverlayControls && showMuteButton && (
        <div className={`absolute top-2 left-2 flex space-x-2 transition-opacity ${
          showControls || isInFeed ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Mute Button - Always visible for feed videos */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {/* Fullscreen Button - Only show on hover for non-feed videos */}
          {!isInFeed && (
            <Button
              onClick={handleFullscreen}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white hover:text-white backdrop-blur-sm"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;