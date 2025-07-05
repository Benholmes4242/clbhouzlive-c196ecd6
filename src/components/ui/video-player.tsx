import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  showVideoIcon = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial properties
    video.muted = muted;
    video.loop = loop;

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

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    // Autoplay if specified and video is loaded
    if (autoplay) {
      const playVideo = async () => {
        try {
          await video.play();
        } catch (error) {
          console.log('Autoplay prevented:', error);
        }
      };
      playVideo();
    }

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [autoplay, muted, loop, onPlay, onPause]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
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

    video.muted = !video.muted;
    setIsMuted(video.muted);
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
    if (onClick) {
      onClick();
    } else if (!showOverlayControls) {
      togglePlayPause({} as React.MouseEvent);
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
        poster={poster}
        className="w-full h-full object-cover cursor-pointer"
        playsInline
        preload="metadata"
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
            className="h-12 w-12 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-white"
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
      {showOverlayControls && (
        <div className={`absolute top-2 left-2 flex space-x-2 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Mute Button */}
          <Button
            onClick={toggleMute}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-white"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>

          {/* Fullscreen Button */}
          <Button
            onClick={handleFullscreen}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white hover:text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;