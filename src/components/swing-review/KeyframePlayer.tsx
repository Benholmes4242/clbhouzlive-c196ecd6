import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';

interface KeyframePlayerProps {
  videoUrl: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
}

export const KeyframePlayer: React.FC<KeyframePlayerProps> = ({
  videoUrl,
  currentTime,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      videoRef.current.requestFullscreen?.();
    }
  };

  return (
    <div className="w-full">
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
        {/* Top overlay gradient */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
        
        {/* Video */}
        <EnhancedVideoPlayer
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          objectFit="contain"
        />

        {/* Fullscreen button */}
        <button
          type="button"
          aria-label="View fullscreen"
          onClick={handleFullscreen}
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-white/92 border border-black/10 flex items-center justify-center text-gray-700 hover:bg-white transition"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        {/* Bottom controls bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 flex items-center justify-between z-10">
          <button
            type="button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            className="h-9 w-9 rounded-full bg-white/92 border border-black/10 flex items-center justify-center text-gray-700 hover:bg-white transition"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};