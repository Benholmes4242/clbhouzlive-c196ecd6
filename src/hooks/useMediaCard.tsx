import { useState, useEffect, useRef } from 'react';
import { ExploreContentItem } from '@/components/explore/types';
import { useVideoAutoplay } from '@/hooks/useVideoAutoplay';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHlsUrlCache } from '@/hooks/useHlsUrlCache';
import { getVideoId } from '@/utils/getVideoId';

interface UseMediaCardProps {
  item: ExploreContentItem;
  onLike: (contentId: string) => void;
  onMediaClick?: (item: ExploreContentItem) => void;
  isFeatured?: boolean;
  isPortrait?: boolean;
  autoplayManager?: {
    registerVideo: (videoId: string, element: HTMLElement, index: number) => void;
    unregisterVideo: (videoId: string) => void;
    shouldVideoAutoplay: (index: number) => boolean;
    isVideoAutoplaying: (videoId: string) => boolean;
  };
  videoIndex?: number;
}

export const useMediaCard = ({ item, onLike, onMediaClick, isFeatured = false, isPortrait = false, autoplayManager, videoIndex = 0 }: UseMediaCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldAutoplayOverride, setShouldAutoplayOverride] = useState(false);
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLElement | null>(null);
  const { preloadHlsUrl } = useHlsUrlCache();

  const { ref: autoplayRef, shouldAutoplay: defaultShouldAutoplay, handleMouseEnter, handleMouseLeave } = useVideoAutoplay({
    enabled: isFeatured || isPortrait, // Enable autoplay for featured (hero) cards and portrait cards
    threshold: 0.5
  });

  // Use override autoplay logic if autoplayManager is provided
  const shouldAutoplay = autoplayManager ? shouldAutoplayOverride : defaultShouldAutoplay;

  // Get media array - use the new media property if available, otherwise fallback to single media
  const mediaItems = item.media && item.media.length > 0 ? item.media : [{
    id: `${item.id}-single`,
    media_type: item.type as 'video' | 'image',
    media_url: item.src
  }];

  const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];
  const hasMultipleMedia = mediaItems.length > 1;

  // Handle autoplay manager integration
  useEffect(() => {
    if (!autoplayManager || !cardRef.current || currentMedia.media_type !== 'video') return;

    const element = cardRef.current;
    const videoId = `${item.id}-${currentMediaIndex}`;

    // Register video with autoplay manager
    autoplayManager.registerVideo(videoId, element, videoIndex);

    // Listen for autoplay events
    const handleStartAutoplay = (event: Event) => {
      console.log('Video autoplay start:', videoId);
      setShouldAutoplayOverride(true);
    };

    const handleStopAutoplay = (event: Event) => {
      console.log('Video autoplay stop:', videoId);
      setShouldAutoplayOverride(false);
    };

    element.addEventListener('startAutoplay', handleStartAutoplay);
    element.addEventListener('stopAutoplay', handleStopAutoplay);

    return () => {
      autoplayManager.unregisterVideo(videoId);
      element.removeEventListener('startAutoplay', handleStartAutoplay);
      element.removeEventListener('stopAutoplay', handleStopAutoplay);
    };
  }, [autoplayManager, videoIndex, item.id, currentMedia.media_type]); // Removed currentMediaIndex from deps

  // Navigation handlers
  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : mediaItems.length - 1);
  };

  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMediaIndex(prev => prev < mediaItems.length - 1 ? prev + 1 : 0);
  };

  // Swipe gesture handling for mobile
  const swipeRef = useSwipeGesture({
    onSwipeLeft: () => {
      if (hasMultipleMedia && currentMediaIndex < mediaItems.length - 1) {
        setCurrentMediaIndex(prev => prev + 1);
      }
    },
    onSwipeRight: () => {
      if (hasMultipleMedia && currentMediaIndex > 0) {
        setCurrentMediaIndex(prev => prev - 1);
      }
    },
    threshold: 50
  });

  // Mouse enter/leave handlers for hover state
  const handleCardMouseEnter = () => {
    setIsHovered(true);
    handleMouseEnter();
  };

  const handleCardMouseLeave = () => {
    setIsHovered(false);
    handleMouseLeave();
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(item.id);
  };

  const handlePointerDown = () => {
    // Start preloading on pointer down (before click)
    if (item.type === 'video') {
      // Get video ID from first media item or fallback to src
      const firstMedia = item.media?.[0];
      const uid = firstMedia ? getVideoId(firstMedia) : getVideoId({ media_url: item.src });
      if (uid) {
        preloadHlsUrl(uid);
      }
    }
  };

  const handleMediaClick = () => {
    console.log('[OpenFlow]', 'cardClick', performance.now());
    // Only open media for image and video types, not CTA
    if (item.type === 'image' || item.type === 'video') {
      console.log('MediaCard handleMediaClick - item.golfCourse:', item.golfCourse);
      // Call the onMediaClick prop - parent handles fullscreen
      onMediaClick?.(item);
    }
  };

  const handleImageError = () => {
    console.log('Image load error for item:', {
      id: item.id, 
      src: item.src,
      errorType: 'IMAGE_LOAD_FAILED'
    });
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return {
    // State
    imageError,
    currentMediaIndex,
    isHovered,
    isLoading,
    isMobile,
    
    // Refs
    autoplayRef,
    swipeRef,
    cardRef,
    
    // Media data
    mediaItems,
    currentMedia,
    hasMultipleMedia,
    shouldAutoplay,
    
    // Handlers
    handlePrevMedia,
    handleNextMedia,
    handleCardMouseEnter,
    handleCardMouseLeave,
    handleLike,
    handlePointerDown,
    handleMediaClick,
    handleImageError,
    handleImageLoad,
  };
};