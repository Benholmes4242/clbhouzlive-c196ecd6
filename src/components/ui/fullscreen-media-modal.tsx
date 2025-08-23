
import React, { useState, useRef, useEffect, useCallback } from 'react';
import EnhancedVideoPlayer from '@/components/ui/enhanced-video-player';
import { useModalState } from '@/hooks/useModalDetector';
import { Minimize2, Volume2, VolumeX, ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { PiHandsClapping, PiShareFat } from 'react-icons/pi';
import { GoCommentDiscussion } from 'react-icons/go';
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
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { usePostDeletion } from '@/hooks/usePostDeletion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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
  initialVideoMuted?: boolean;
  // Post management props
  postId?: string;
  onPostDeleted?: () => void;
  onPostEdit?: (postId: string) => void;
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
  initialVideoPosition = 0,
  initialVideoMuted = true,
  postId,
  onPostDeleted,
  onPostEdit
}: FullscreenMediaModalProps) => {
  // Convert single media to array format for consistent handling
  const mediaUrls = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
  const mediaTypes = Array.isArray(mediaType) ? mediaType : [mediaType];
  const hasMultipleMedia = mediaUrls.length > 1;
  
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(initialVideoMuted);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null); // Keep for compatibility but EnhancedVideoPlayer manages its own video
  const isMobile = useIsMobile();
  const { isTextExpanded, handleMouseEnter, handleMouseLeave } = useTextExpansion();
  const { registerVideo, unregisterVideo, pauseAllAndSetActive, storeVideoPosition, resumeVideoFromPosition } = useVideoPlaybackManager();
  const { isGloballyMuted } = useGlobalAudio();
  const { user: currentUser } = useSupabaseSession();
  const { deletePost } = usePostDeletion();
  
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

  // Check if this is the current user's post
  // Handle different user object structures that might come from different sources
  const userIdFromProp = user?.id || (user as any)?.user_id;
  const isOwnPost = postId && currentUser && userIdFromProp && currentUser.id === userIdFromProp;
  
  // Register modal state for Echo detection
  useModalState(isOpen);

  // Debug logging
  console.log('🔍 Fullscreen Modal Debug:', {
    postId,
    currentUserId: currentUser?.id,
    postUserId: userIdFromProp,
    userObject: user,
    isOwnPost,
    hasPostId: !!postId,
    hasCurrentUser: !!currentUser,
    hasUser: !!user
  });

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!postId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;
    
    await deletePost(postId);
    onPostDeleted?.();
    onClose();
  };

  // Handle post editing
  const handleEditPost = () => {
    if (!postId) return;
    onPostEdit?.(postId);
  };

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

  // Swipe handlers for mobile - horizontal for media navigation, vertical for post navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      if (isMobile) {
        // For multiple media items, navigate to next media
        if (hasMultipleMedia && currentIndex < mediaUrls.length - 1) {
          goToNext();
        }
        // For single video in post navigation mode, go to next post
        else if (canNavigatePosts && canGoNext && onNextPost) {
          onNextPost();
        }
      }
    },
    onSwipedRight: (eventData) => {
      if (isMobile) {
        // For multiple media items, navigate to previous media
        if (hasMultipleMedia && currentIndex > 0) {
          goToPrevious();
        }
        // For single video in post navigation mode, go to previous post
        else if (canNavigatePosts && canGoPrevious && onPreviousPost) {
          onPreviousPost();
        }
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
    preventScrollOnSwipe: true,
    delta: 50,
    touchEventOptions: { passive: false }
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
      // Reset mute state to match the original video when modal opens
      setIsMuted(initialVideoMuted);
    } else {
      // Reset stored state when modal closes
      originalGlobalMuteState.current = null;
      originalVideoData.current = null;
    }
  }, [isOpen, initialIndex, isGloballyMuted]);

  // Auto-play video when modal opens or index changes
  useEffect(() => {
    if (isOpen && mediaTypes[currentIndex] === 'video') {
      // Pause all other videos and set this one as active
      pauseAllAndSetActive(fullscreenVideoId.current);
    }
  }, [isOpen, currentIndex, mediaTypes, pauseAllAndSetActive]);

  // Cleanup when modal closes - restore feed video behavior
  useEffect(() => {
    return () => {
      if (isOpen && mediaTypes[currentIndex] === 'video') {
        // Unregister the fullscreen video
        unregisterVideo(fullscreenVideoId.current);
        
        // When modal closes, allow feed videos to resume
        setTimeout(() => {
          pauseAllAndSetActive('');
          console.log('🔊 Fullscreen modal closed, feed videos will resume');
        }, 100);
      }
    };
  }, [isOpen, currentIndex, mediaTypes, unregisterVideo, pauseAllAndSetActive]);

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
    // EnhancedVideoPlayer handles its own mute state
    setIsMuted(!isMuted);
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
      {/* DEBUG: Big blue circle to verify FullscreenMediaModal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[999999] w-32 h-32 bg-blue-500 rounded-full border-4 border-yellow-400"></div>
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
        {/* Close button */}
        <button
          onClick={() => onClose()}
          className="flex items-center justify-center w-10 h-10 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <Minimize2 className="h-8 w-8" />
        </button>
      </div>


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
            <EnhancedVideoPlayer
              key={`fullscreen-video-${currentIndex}-${mediaUrls[currentIndex]}`}
              src={mediaUrls[currentIndex]}
              className="w-full h-full object-cover"
              muted={isMuted}
              loop={true}
              autoplay={true}
              enableHLS={true}
            />
          )}
        </div>

        {/* Navigation Arrows - Show for both desktop and mobile with high visibility */}
        {hasMultipleMedia && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0 || isTransitioning}
              className={`absolute left-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center text-white bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200 border border-white/30 hover:bg-black/80 hover:border-white/50 disabled:opacity-30 disabled:cursor-not-allowed ${
                isMobile ? 'w-12 h-12' : 'w-14 h-14'
              }`}
            >
              <ChevronLeft className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} stroke-[2.5]`} />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex === mediaUrls.length - 1 || isTransitioning}
              className={`absolute right-4 top-1/2 -translate-y-1/2 z-50 flex items-center justify-center text-white bg-black/60 backdrop-blur-sm rounded-full transition-all duration-200 border border-white/30 hover:bg-black/80 hover:border-white/50 disabled:opacity-30 disabled:cursor-not-allowed ${
                isMobile ? 'w-12 h-12' : 'w-14 h-14'
              }`}
            >
              <ChevronRight className={`${isMobile ? "w-6 h-6" : "w-8 h-8"} stroke-[2.5]`} />
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
                    ? "bg-black" 
                    : "bg-black/50 hover:bg-black/70"
                }`}
                aria-label={`Go to media ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Caption and Golf Course Tag - Bottom Left (matching index feed exactly) */}
      <div className="absolute bottom-5 left-3 right-20 z-20">
        {/* User Info - Profile Photo and Name */}
        {user && displayName && (
          <div className="flex items-end gap-2 mb-2">
            <img
              src={user.profile_photo_url || '/placeholder.svg'}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <p className="text-white font-bold text-base">
              {displayName}
            </p>
          </div>
        )}

        {/* Golf Course Badge - REMOVED */}

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
            <PiHandsClapping className="w-8 h-8" />
          </button>
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'comment')}
          >
            <GoCommentDiscussion className="w-8 h-8" />
          </button>
          <button 
            className="cursor-pointer hover:opacity-100 transition-opacity"
            onClick={(e) => handleInteractionClick(e, 'share')}
          >
            <PiShareFat className="w-8 h-8" />
          </button>
          
          {/* Three dots menu - only show for own posts */}
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cursor-pointer hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="w-8 h-8" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleEditPost}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeletePost}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

    </div>
  );
};

export default FullscreenMediaModal;
