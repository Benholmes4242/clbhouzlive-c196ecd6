
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
  // New props for post navigation
  canNavigatePosts?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onNextPost?: () => void;
  onPreviousPost?: () => void;
  currentPostIndex?: number;
  totalPosts?: number;
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
  initialIndex = 0,
  canNavigatePosts = false,
  canGoNext = false,
  canGoPrevious = false,
  onNextPost,
  onPreviousPost,
  currentPostIndex = 0,
  totalPosts = 0
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

  // Swipe handlers for mobile - horizontal for media, vertical for posts
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
    onSwipedDown: (eventData) => {
      eventData.event.preventDefault();
      eventData.event.stopPropagation();
      if (isMobile && canNavigatePosts && canGoNext && onNextPost) {
        onNextPost();
      }
    },
    onSwipedUp: (eventData) => {
      eventData.event.preventDefault();
      eventData.event.stopPropagation();
      if (isMobile && canNavigatePosts && canGoPrevious && onPreviousPost) {
        onPreviousPost();
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

  // Prevent background scrolling when modal is open - Simple but effective approach
  useEffect(() => {
    if (isOpen) {
      // Store the current scroll position
      const scrollY = window.scrollY;
      
      // Add a CSS class to body that locks scrolling
      document.body.classList.add('modal-open');
      
      // Add CSS directly to ensure it works
      const style = document.createElement('style');
      style.id = 'modal-scroll-lock';
      style.textContent = `
        .modal-open {
          position: fixed !important;
          top: -${scrollY}px !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          touch-action: none !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .modal-open * {
          touch-action: none !important;
        }
        html.modal-open {
          overflow: hidden !important;
          height: 100% !important;
        }
      `;
      document.head.appendChild(style);
      document.documentElement.classList.add('modal-open');
      
      return () => {
        // Remove the CSS class and styles
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        const styleElement = document.getElementById('modal-scroll-lock');
        if (styleElement) {
          styleElement.remove();
        }
        
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
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onWheel={(e) => {
        // Handle vertical scroll for post navigation on desktop
        if (!isMobile && canNavigatePosts) {
          e.preventDefault();
          e.stopPropagation();
          
          if (e.deltaY > 0) {
            // Scrolling down - go to next post
            if (canGoNext && onNextPost) {
              onNextPost();
            }
          } else if (e.deltaY < 0) {
            // Scrolling up - go to previous post
            if (canGoPrevious && onPreviousPost) {
              onPreviousPost();
            }
          }
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onScroll={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseMove={(e) => {
        // Capture all mouse events to prevent background interactions
        e.stopPropagation();
      }}
    >
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2 pointer-events-none">
        {/* Post Navigation Indicator */}
        {canNavigatePosts && totalPosts > 1 && (
          <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full pointer-events-auto">
            {currentPostIndex + 1} / {totalPosts}
          </div>
        )}
        
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

      {/* Navigation Instructions - Show briefly when multiple posts available */}
      {canNavigatePosts && totalPosts > 1 && (
        <div className="absolute bottom-3 left-3 z-20">
          <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg opacity-70">
            {isMobile ? 'Swipe up/down for more posts' : 'Scroll up/down for more posts'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenMediaModal;
