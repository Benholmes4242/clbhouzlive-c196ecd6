import React, { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from './button';
import EnhancedVideoPlayer from './enhanced-video-player';

interface FullscreenVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoData: {
    src: string;
    poster?: string;
    user: {
      id: string;
      profile_photo_url?: string;
      display_name?: string;
      username?: string;
    };
    content?: string;
  } | null;
}

const FullscreenVideoModal: React.FC<FullscreenVideoModalProps> = ({
  isOpen,
  onClose,
  videoData
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle clicks outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  if (!isOpen || !videoData) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Video container */}
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center">
        <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
          {/* Video player */}
          <video
            ref={videoRef}
            src={videoData.src}
            poster={videoData.poster}
            className="w-full h-full object-contain"
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlayPause}
          />

          {/* Video controls overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30">
            {/* Top controls */}
            <div className="absolute top-4 left-4 right-16 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* User info */}
                <div className="flex items-center space-x-2">
                  <img
                    src={videoData.user.profile_photo_url || '/placeholder.svg'}
                    alt={videoData.user.display_name || videoData.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <span className="text-white font-medium">
                    {videoData.user.display_name || videoData.user.username}
                  </span>
                </div>
              </div>

              {/* Volume control */}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Center play/pause button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 w-16 h-16 rounded-full bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                onClick={togglePlayPause}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>

            {/* Bottom content */}
            {videoData.content && (
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white text-sm leading-relaxed">
                  {videoData.content}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenVideoModal;