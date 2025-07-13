
import React, { useState, useRef, useEffect } from 'react';
import { Minimize2, Volume2, VolumeX, MapPin, Heart, MessageCircle, Share, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useTextExpansion } from '@/hooks/useTextExpansion';
import { truncateToWords } from '@/utils/textUtils';
import CoursePostBadge from '../posts/CoursePostBadge';
import { UserInfoOverlay } from '../posts/user-post/overlays/UserInfoOverlay';
import TaggedText from '../posts/TaggedText';
import { removeGolfCourseFromContent } from '@/utils/golfCourseExtractor';
import { useIsMobile } from '@/hooks/use-mobile';
import { useVideoPlaybackManager } from '@/contexts/VideoPlaybackManager';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';

interface FullscreenMediaModalProps {
  isOpen: boolean;
  onClose: (videoPosition?: number, videoMuted?: boolean) => void;
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
  // Video resume props
  initialVideoPosition?: number;
}

// Helper function to check if element is in viewport
const isElementInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

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
  totalPosts = 0,
  initialVideoPosition = 0
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
  const { isTextExpanded, handleMouseEnter, handleMouseLeave } = useTextExpansion();
  const { registerVideo, unregisterVideo, pauseAllAndSetActive, storeVideoPosition, resumeVideoFromPosition } = useVideoPlaybackManager();
  const { isGloballyMuted } = useGlobalAudio();
  
  // Store the original global mute state when modal opens
  const originalGlobalMuteState = useRef<boolean | null>(null);
  
  // Store the originally playing video ID and position
  const originalVideoData = useRef<{videoId: string; position: number} | null>(null);
  
  // Generate unique video ID for fullscreen player
  const fullscreenVideoId = useRef(`fullscreen-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

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
      if (isMobile && hasMultipleMedia && currentIndex < mediaUrls.length - 1) {
        goToNext();
      }
    },
    onSwipedRight: (eventData) => {
      if (isMobile && hasMultipleMedia && currentIndex > 0) {
        goToPrevious();
      }
    },
    onSwipedDown: (eventData) => {
      if (isMobile && canNavigatePosts && canGoNext && onNextPost) {
        onNextPost();
      }
    },
    onSwipedUp: (eventData) => {
      if (isMobile && canNavigatePosts && canGoPrevious && onPreviousPost) {
        onPreviousPost();
      }
    },
    trackMouse: false,
    trackTouch: true,
    preventScrollOnSwipe: false,
    delta: 50,
    touchEventOptions: { passive: true }
  });

  // Store original mute state and video positions when modal opens
  useEffect(() => {
    if (isOpen && originalGlobalMuteState.current === null) {
      originalGlobalMuteState.current = isGloballyMuted;
      console.log('🎬 Storing original global mute state:', isGloballyMuted);
      
      // Store positions of all currently playing videos before pausing them
      console.log('💾 Storing video positions before fullscreen modal opens');
      // This will be handled by the pauseAllAndSetActive call in the next useEffect
    }
    
    if (isOpen) {
      setCurrentIndex(initialIndex);
    } else {
      // Reset stored state when modal closes
      originalGlobalMuteState.current = null;
      originalVideoData.current = null;
    }
  }, [isOpen, initialIndex, isGloballyMuted]);

  // Auto-play video when modal opens or index changes
  useEffect(() => {
    if (isOpen && mediaTypes[currentIndex] === 'video' && videoRef.current) {
      // Register the fullscreen video and pause all other videos
      registerVideo(fullscreenVideoId.current, videoRef.current);
      pauseAllAndSetActive(fullscreenVideoId.current);
      
      // Set video properties
      videoRef.current.muted = isMuted;
      videoRef.current.loop = true;
      videoRef.current.playsInline = true;
      
      // Set initial position if provided
      if (initialVideoPosition > 0) {
        videoRef.current.currentTime = initialVideoPosition;
      }
      
      videoRef.current.play().catch(console.error);
    }
  }, [isOpen, currentIndex, mediaTypes, isMuted, initialVideoPosition, registerVideo, pauseAllAndSetActive]);

  // Cleanup when modal closes - restore feed video behavior and original mute state
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        // Stop and unregister the fullscreen video
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        unregisterVideo(fullscreenVideoId.current);
        
        // When modal closes, trigger a re-evaluation of feed videos
        // This will allow feed videos to resume autoplay based on their visibility
        // and restore the original global mute state
        setTimeout(() => {
          // Clear the active video without pausing all videos
          pauseAllAndSetActive('');
          
          console.log('🔊 Fullscreen modal closed, feed videos will resume with original mute state:', originalGlobalMuteState.current);
          
          // Direct approach: Force autoplay for all videos currently in viewport
          setTimeout(() => {
            // Find all video elements in the feed and check if they're in viewport
            const allVideos = document.querySelectorAll('[data-video-id^="index-"]');
            
            allVideos.forEach((videoElement) => {
              const video = videoElement as HTMLVideoElement;
              if (video && isElementInViewport(video)) {
                console.log('🎯 Forcing autoplay for video in viewport:', video.dataset.videoId);
                if (video.paused && video.readyState >= 2) {
                  video.play().catch(error => {
                    console.log('Direct autoplay prevented:', error);
                  });
                }
              }
            });
            
            // Also trigger scroll events as backup
            window.dispatchEvent(new Event('scroll'));
            window.dispatchEvent(new Event('resize'));
            console.log('🔄 Triggered direct autoplay and scroll events');
          }, 50);
        }, 100); // Small delay to ensure modal cleanup is complete
      }
    };
  }, [unregisterVideo, pauseAllAndSetActive]);

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
        touchAction: 'manipulation',
        margin: 0,
        padding: 0,
        overscrollBehavior: 'none'
      }}
      onClick={handleBackdropClick}
      onWheel={(e) => {
        // Handle vertical scroll for post navigation on desktop only
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
        }
      }}
    >
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
        {/* Maximize - Top Right */}
        <button
          onClick={() => {
            // Pass current video position and mute state back when closing
            const currentPosition = videoRef.current?.currentTime || 0;
            const currentMuted = videoRef.current?.muted;
            onClose(
              mediaTypes[currentIndex] === 'video' ? currentPosition : undefined,
              mediaTypes[currentIndex] === 'video' ? currentMuted : undefined
            );
          }}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <Minimize2 className="h-8 w-8" />
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
        style={{ touchAction: 'manipulation' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
            className="text-white text-base font-bold leading-[1.4] cursor-default transition-all duration-300 ease-in-out"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}
          >
            <div className="whitespace-normal">
              <span className="text-base font-bold">
                {isTextExpanded 
                  ? removeGolfCourseFromContent(content)
                  : truncateToWords(removeGolfCourseFromContent(content), 9)
                }
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
      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex flex-col items-center gap-6 text-white text-lg opacity-90">
          {/* Mute toggle button - only show for video posts */}
          {mediaTypes[currentIndex] === 'video' && (
            <button 
              className="cursor-pointer hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleMuteToggle();
              }}
            >
              {isMuted ? (
                <VolumeX className="w-8 h-8" />
              ) : (
                <Volume2 className="w-8 h-8" />
              )}
            </button>
          )}
          
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'like')}
          >
            <Heart className="w-8 h-8" />
          </button>
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'comment')}
          >
            <MessageCircle className="w-8 h-8" />
          </button>
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'share')}
          >
            <Share className="w-8 h-8" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default FullscreenMediaModal;
