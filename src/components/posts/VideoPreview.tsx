
import React, { useRef, useState, useEffect } from 'react';
import { Play, Maximize2 } from 'lucide-react';

interface VideoPreviewProps {
  src: string;
  poster?: string;
  className?: string;
  onFullscreen?: () => void;
}

const VideoPreview = ({ src, poster, className = "", onFullscreen }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setShowControls(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Silently handle autoplay failures
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowControls(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFullscreen?.();
  };

  return (
    <div
      className={`relative cursor-pointer group ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        onClick={handleClick}
      />

      {/* Play/Pause Overlay */}
      {!isHovered && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
            <Play className="h-6 w-6 text-green-600 fill-current" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFullscreen}
            className="bg-black/70 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading indicator */}
      {isHovered && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
