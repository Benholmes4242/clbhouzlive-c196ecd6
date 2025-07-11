
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Volume2, VolumeX, MapPin } from 'lucide-react';
import CoursePostBadge from '../posts/CoursePostBadge';
import { UserInfoOverlay } from '../posts/user-post/overlays/UserInfoOverlay';
import TaggedText from '../posts/TaggedText';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
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
  content?: string | null;
  postTags?: any[];
}

const FullscreenMediaModal = ({ 
  isOpen, 
  onClose, 
  mediaUrl, 
  mediaType, 
  alt = "Media content",
  golfCourse,
  user,
  displayName,
  content,
  postTags
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

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Disable scrolling on body and html
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.documentElement.style.overflow = 'hidden';
      
      // Prevent scroll events on window
      const preventScroll = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      const preventTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      // Add event listeners to prevent scrolling
      window.addEventListener('scroll', preventScroll, { passive: false });
      window.addEventListener('wheel', preventScroll, { passive: false });
      window.addEventListener('touchmove', preventTouchMove, { passive: false });
      document.addEventListener('scroll', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      return () => {
        // Re-enable scrolling and restore position
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.documentElement.style.overflow = '';
        
        // Remove event listeners
        window.removeEventListener('scroll', preventScroll);
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventTouchMove);
        document.removeEventListener('scroll', preventScroll);
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventTouchMove);
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

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
      className="fixed w-full h-full z-[999999] bg-black flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        maxHeight: '100vh',
        zIndex: 999999,
        touchAction: 'none',
        margin: 0,
        padding: 0
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
            className="max-w-[100vw] max-h-[100vh] w-auto h-auto object-contain"
            draggable={false}
          />
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            src={mediaUrl}
            className="max-w-[100vw] max-h-[100vh] w-auto h-auto object-contain"
            muted={isMuted}
            controls={false}
            loop
            playsInline
            autoPlay
          />
        </div>
      )}

      {/* Caption and Golf Course Tag - Bottom Left (matching index feed exactly) */}
      <div className="absolute bottom-5 left-3 right-20 z-20">
        {/* Golf Course Badge - Above Caption (matching CaptionOverlay exactly) */}
        {golfCourse && (
          <div className="mb-2">
            {isMobile ? (
              // Mobile: Map pin that expands to show golf club name (for future mobile modal implementation)
              <div className="flex items-center">
                <button className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-2 transition-all duration-200">
                  <MapPin className="w-4 h-4 text-white" />
                </button>
                <div className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                  {golfCourse.name}
                </div>
              </div>
            ) : (
              // Desktop: Single pill with map pin and golf club name together
              <div className="inline-flex items-center bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
                <MapPin className="w-4 h-4 text-white mr-1.5" />
                {golfCourse.name}
              </div>
            )}
          </div>
        )}

        {/* Caption Text (matching CaptionOverlay exactly) */}
        {content && removeGolfCourseFromContent(content) && (
          <div 
            className="text-white text-base font-bold leading-[1.4]"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            <div className="whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-base font-bold">
                {removeGolfCourseFromContent(content)}
              </span>
              {postTags && postTags.length > 0 && (
                <span>
                  {' '}
                  {postTags.map((tag) => (
                    <span key={tag.id} className="text-blue-400 font-medium">
                      @{tag.name}{' '}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenMediaModal;
