
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import CoursePostBadge from '../posts/CoursePostBadge';
import { UserInfoOverlay } from '../posts/user-post/overlays/UserInfoOverlay';
import { useIsMobile } from '@/hooks/use-mobile';

interface FullscreenMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  alt?: string;
  golfCourse?: {
    id: string;
    name: string;
    country: string;
  };
  user?: {
    id: string;
    profile_photo_url: string | null;
  };
  displayName?: string;
}

const FullscreenMediaModal = ({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType, 
  alt = "Media content",
  golfCourse,
  user,
  displayName
}: FullscreenMediaModalProps) => {
  // Only log when golfCourse is actually provided for debugging
  if (golfCourse) {
    console.log('FullscreenMediaModal - golf course data:', golfCourse);
  }
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

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
      className="fixed inset-0 w-full h-full z-[999999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        maxHeight: '100vh',
        zIndex: 999999
      }}
      onClick={handleBackdropClick}
    >
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2 pointer-events-none">
        {/* Back Arrow - Top Right */}
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

        {/* Golf Course Badge - Top Right */}
        {golfCourse && (
          <div className="pointer-events-auto">
            <CoursePostBadge 
              course={{
                id: golfCourse.id,
                name: golfCourse.name,
                country: golfCourse.country
              }}
              className="relative top-0 right-0 mr-2"
            />
          </div>
        )}
      </div>

      {/* User Info Overlay - Top Left (exact same position as index feed) */}
      {user && displayName && (
        <UserInfoOverlay
          user={user}
          displayName={displayName}
          onProfileClick={() => {}} // Add profile click handler if needed
        />
      )}

      {/* Media Content - Centered and properly sized */}
      {mediaType === 'image' ? (
        <div className="relative">
          <img
            src={mediaUrl}
            alt={alt}
            className={`max-w-[90vw] w-auto h-auto object-contain ${
              isMobile ? 'max-h-[75vh]' : 'max-h-[90vh]'
            }`}
            draggable={false}
          />
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            src={mediaUrl}
            className={`max-w-[90vw] w-auto h-auto object-contain ${
              isMobile ? 'max-h-[75vh]' : 'max-h-[90vh]'
            }`}
            muted={isMuted}
            controls={false}
            loop
            playsInline
            autoPlay
          />
        </div>
      )}
    </div>
  );
};

export default FullscreenMediaModal;
