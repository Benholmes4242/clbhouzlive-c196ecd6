import React, { useState, useRef } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';

interface CourseVideoOverlayProps {
  videoUrl: string;
  courseName: string;
  onOpenFullVideo?: () => void;
}

const CourseVideoOverlay: React.FC<CourseVideoOverlayProps> = ({ 
  videoUrl, 
  courseName, 
  onOpenFullVideo 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      onOpenFullVideo();
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-20 transition-all duration-300 cursor-pointer group ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleOverlayClick}
    >
      {/* Video Container */}
      <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-lg overflow-hidden shadow-2xl bg-black">
        <EnhancedVideoPlayer
          ref={videoRef}
          src={videoUrl}
          autoplay={true}
          muted={isMuted}
          loop={true}
          className="w-full h-full object-cover"
          enableHLS={true}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Controls Overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Top Controls */}
          <div className="flex justify-end">
            <button
              onClick={handleMuteToggle}
              className="p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </button>
          </div>
          
          {/* Center Play Button */}
          <div className="flex items-center justify-center">
            <button
              onClick={handlePlayToggle}
              className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <Play className="h-4 w-4" fill="currentColor" />
            </button>
          </div>
          
          {/* Bottom Label */}
          <div className="text-center">
            <p className="text-xs text-white font-medium leading-tight">
              Shot at {courseName}
            </p>
          </div>
        </div>
        
        {/* Subtle Border */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
      </div>
    </div>
  );
};

export default CourseVideoOverlay;