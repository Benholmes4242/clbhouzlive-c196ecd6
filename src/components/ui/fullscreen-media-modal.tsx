
import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Volume2, VolumeX, MapPin, Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import CoursePostBadge from '../posts/CoursePostBadge';
import { UserInfoOverlay } from '../posts/user-post/overlays/UserInfoOverlay';
import TaggedText from '../posts/TaggedText';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { useIsMobile } from '@/hooks/use-mobile';

interface FullscreenMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string | string[];
  mediaType: 'image' | 'video' | ('image' | 'video')[];
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
  initialIndex?: number;
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
  postTags,
  initialIndex = 0
}: FullscreenMediaModalProps) => {
  // Convert single media to array format for consistent handling
  const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
  const mediaTypes = Array.isArray(mediaType) ? mediaType : [mediaType];
  const hasMultipleMedia = mediaUrls.length > 1;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();

  // Only log when golfCourse is actually provided for debugging
  if (golfCourse) {
    console.log('FullscreenMediaModal - golf course data:', golfCourse);
  }

  // Navigation functions
  const goToPrevious = () => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning || currentIndex >= mediaUrls.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex(prev => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      eventData.event.preventDefault();
      eventData.event.stopPropagation();
      if (isMobile && hasMultipleMedia && currentIndex < mediaUrls.length - 1) {
        goToNext();
      }
    },
    onSwipedRight: (eventData) => {
      eventData.event.preventDefault();
      eventData.event.stopPropagation();
      if (isMobile && hasMultipleMedia && currentIndex > 0) {
        goToPrevious();
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 50,
    touchEventOptions: { passive: false }
  });

  // Reset current index when modal opens with new initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Auto-play video when modal opens or index changes
  useEffect(() => {
    if (isOpen && mediaTypes[currentIndex] === 'video' && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [isOpen, currentIndex, mediaTypes]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      // Get the body element
      const body = document.body;
      const html = document.documentElement;
      
      // Store original styles
      const originalBodyStyle = body.style.cssText;
      const originalHtmlStyle = html.style.cssText;
      
      // Disable scrolling completely
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = `-${scrollX}px`;
      body.style.width = '100vw';
      body.style.height = '100vh';
      body.style.overflow = 'hidden';
      body.style.touchAction = 'none';
      body.style.userSelect = 'none';
      body.style.webkitUserSelect = 'none';
      
      html.style.overflow = 'hidden';
      html.style.height = '100vh';
      html.style.touchAction = 'none';
      html.style.userSelect = 'none';
      html.style.webkitUserSelect = 'none';
      
      // Prevent all scroll-related events
      const preventDefault = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      const preventTouchMove = (e: TouchEvent) => {
        // Allow touches within the modal content but prevent scrolling
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      const preventWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      const preventKeyboardScroll = (e: KeyboardEvent) => {
        // Prevent arrow keys, space, page up/down from scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.code)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      };
      
      // Add event listeners with passive: false to ensure preventDefault works
      const eventOptions = { passive: false, capture: true };
      
      // Window events
      window.addEventListener('scroll', preventDefault, eventOptions);
      window.addEventListener('wheel', preventWheel, eventOptions);
      window.addEventListener('touchmove', preventTouchMove, eventOptions);
      window.addEventListener('keydown', preventKeyboardScroll, eventOptions);
      
      // Document events
      document.addEventListener('scroll', preventDefault, eventOptions);
      document.addEventListener('wheel', preventWheel, eventOptions);
      document.addEventListener('touchmove', preventTouchMove, eventOptions);
      document.addEventListener('keydown', preventKeyboardScroll, eventOptions);
      
      // Body events
      body.addEventListener('scroll', preventDefault, eventOptions);
      body.addEventListener('wheel', preventWheel, eventOptions);
      body.addEventListener('touchmove', preventTouchMove, eventOptions);
      
      return () => {
        // Restore original styles
        body.style.cssText = originalBodyStyle;
        html.style.cssText = originalHtmlStyle;
        
        // Remove all event listeners
        window.removeEventListener('scroll', preventDefault, true);
        window.removeEventListener('wheel', preventWheel, true);
        window.removeEventListener('touchmove', preventTouchMove, true);
        window.removeEventListener('keydown', preventKeyboardScroll, true);
        
        document.removeEventListener('scroll', preventDefault, true);
        document.removeEventListener('wheel', preventWheel, true);
        document.removeEventListener('touchmove', preventTouchMove, true);
        document.removeEventListener('keydown', preventKeyboardScroll, true);
        
        body.removeEventListener('scroll', preventDefault, true);
        body.removeEventListener('wheel', preventWheel, true);
        body.removeEventListener('touchmove', preventTouchMove, true);
        
        // Restore scroll position
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [isOpen]);

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleInteractionClick = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    // Handle different interaction types
    switch (type) {
      case 'like':
        // Handle like action
        console.log('Like clicked');
        break;
      case 'comment':
        // Handle comment action
        console.log('Comment clicked');
        break;
      case 'share':
        // Handle share action
        console.log('Share clicked');
        break;
      default:
        break;
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
        padding: 0,
        overscrollBehavior: 'none'
      }}
      onClick={handleBackdropClick}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => {
        // Only allow swipe gestures, prevent all other touch movement
        e.stopPropagation();
      }}
      onTouchEnd={(e) => e.stopPropagation()}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2 pointer-events-none">
        {/* Maximize - Top Right */}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors pointer-events-auto"
          aria-label="Close"
        >
          <Maximize2 className="h-6 w-6" />
        </button>
      </div>

      {/* User Info Overlay - Top Left (exact same position as index feed) */}
      {user && displayName && (
        <UserInfoOverlay
          user={user}
          displayName={displayName}
          onProfileClick={() => {}} // Add profile click handler if needed
        />
      )}

      {/* Media Content with Navigation - Fully centered and sized to fill viewport */}
      <div 
        className="relative w-full h-full flex items-center justify-center" 
        {...swipeHandlers}
        style={{ touchAction: 'pan-x' }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        {/* Current Media Item */}
        <div className="relative w-full h-full flex items-center justify-center">
          {mediaTypes[currentIndex] === 'image' ? (
            <img
              src={mediaUrls[currentIndex]}
              alt={alt}
              className="w-full h-full object-cover"
              draggable={false}
              style={{ maxWidth: '100vw', maxHeight: '100vh' }}
            />
          ) : (
            <video
              ref={videoRef}
              src={mediaUrls[currentIndex]}
              className="w-full h-full object-cover"
              muted={isMuted}
              controls={false}
              loop
              playsInline
              autoPlay
              style={{ maxWidth: '100vw', maxHeight: '100vh' }}
            />
          )}
        </div>

        {/* Desktop Navigation Arrows - Only show if multiple media and not mobile */}
        {hasMultipleMedia && !isMobile && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0 || isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === mediaUrls.length - 1 || isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-12 h-12 text-white hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Dots Indicator - Show if multiple media */}
        {hasMultipleMedia && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
            {mediaUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isTransitioning}
                className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                  index === currentIndex 
                    ? "bg-white" 
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

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
              <div className="inline-flex items-center bg-white/20 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                <MapPin className="w-5 h-5 text-white mr-2" />
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

      {/* Interaction Icons - Bottom Right (matching index feed exactly) */}
      <div className="absolute bottom-3 right-3 z-20">
        <div className="flex flex-col items-center gap-2.5 text-white text-lg opacity-90">
          {/* Mute toggle button - only show for video posts */}
          {mediaTypes[currentIndex] === 'video' && (
            <button 
              className="cursor-pointer hover:opacity-100 transition-opacity"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
          )}
          
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'like')}
          >
            <Heart className="w-6 h-6" />
          </button>
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'comment')}
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'share')}
          >
            <Share className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenMediaModal;
