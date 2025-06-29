
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

interface FullscreenMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  alt?: string;
}

const FullscreenMediaModal = ({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType, 
  alt = "Media content" 
}: FullscreenMediaModalProps) => {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play video when modal opens
  useEffect(() => {
    if (isOpen && mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [isOpen, mediaType]);

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop, not the media content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
        {/* Back Arrow - Top Left */}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Mute/Unmute - Top Right (Only for videos) */}
        {mediaType === 'video' && (
          <button
            onClick={handleMuteToggle}
            className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </button>
        )}
      </div>

      {/* Media Content - Centered and properly sized */}
      {mediaType === 'image' ? (
        <img
          src={mediaUrl}
          alt={alt}
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
          draggable={false}
        />
      ) : (
        <video
          ref={videoRef}
          src={mediaUrl}
          className="max-w-[90vw] max-h-[90vh] w-auto h-auto object-contain"
          muted={isMuted}
          controls={false}
          loop
          playsInline
          autoPlay
        />
      )}
    </div>
  );
};

export default FullscreenMediaModal;
