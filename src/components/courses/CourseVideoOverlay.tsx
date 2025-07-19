import React, { useState, useRef } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useIsMobile } from '@/hooks/use-mobile';

interface CourseVideoOverlayProps {
  videoUrl: string;
  courseName: string;
  username?: string;
  timestamp?: string;
  onOpenFullVideo?: () => void;
}

const CourseVideoOverlay: React.FC<CourseVideoOverlayProps> = ({ 
  videoUrl, 
  courseName,
  username,
  timestamp,
  onOpenFullVideo 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

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
    <div className="fixed bottom-6 left-6 right-6 z-20">
      {/* Latest Post Label - Above Video */}
      <div className="mb-3">
        <p className={`text-white font-bold ${isMobile ? 'text-3xl' : 'text-lg'}`}>
          Latest Post from {courseName}
        </p>
      </div>

      {/* Video Container */}
      <div
        className="relative w-full cursor-pointer group"
        style={{ height: isMobile ? '200px' : '250px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleOverlayClick}
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl bg-black">
          <EnhancedVideoPlayer
            ref={videoRef}
            src={videoUrl}
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
            
            {/* Empty div for spacing */}
            <div />
          </div>
          
          {/* Bottom Left Overlay - Username and Timestamp */}
          <div className="absolute bottom-4 left-4 text-white">
            {username && (
              <p className="text-lg font-semibold leading-tight">
                @{username}
              </p>
            )}
            {timestamp && (
              <p className="text-sm opacity-80 leading-tight">
                {formatTimestamp(timestamp)}
              </p>
            )}
          </div>
          
          {/* Subtle Border */}
          <div className="absolute inset-0 rounded-lg ring-1 ring-white/20" />
        </div>
      </div>
    </div>
  );
};

export default CourseVideoOverlay;