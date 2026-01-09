/**
 * useUnifiedFullscreen - Hook to integrate unified fullscreen player with any page
 * 
 * This hook provides a simple interface to open the unified fullscreen viewer
 * from any page that has content data. It handles:
 * - Selecting the appropriate adapter based on source type
 * - Opening/closing the fullscreen player
 * - Passing callbacks and options
 * 
 * @example
 * // In Discover/Explore page:
 * const { openFullscreen } = useUnifiedFullscreen('explore');
 * const handleMediaClick = (item, index) => openFullscreen(content, index);
 * 
 * // In Profile page:
 * const { openFullscreen } = useUnifiedFullscreen('profile');
 * const handlePostClick = (post, index) => openFullscreen(posts, index);
 * 
 * // In Course page:
 * const { openFullscreen } = useUnifiedFullscreen('course');
 * const handleReviewClick = (review, index) => openFullscreen(reviews, index);
 */

import { useCallback } from 'react';
import { useFullscreenPlayer } from '@/contexts/FullscreenPlayerContext';
import { 
  exploreFeedAdapter, 
  profileFeedAdapter, 
  courseFeedAdapter,
  type FeedAdapter,
  type NormalizedItem
} from '@/adapters';

export type FullscreenSourceType = 'explore' | 'profile' | 'course';

interface UseUnifiedFullscreenOptions {
  /** Callback when like action is triggered */
  onLike?: (itemId: string) => void;
  /** Callback when comment action is triggered */
  onComment?: (itemId: string) => void;
  /** Callback when share action is triggered */
  onShare?: (itemId: string) => void;
  /** Callback when follow action is triggered */
  onFollow?: (creatorId: string) => void;
  /** Callback when index changes */
  onIndexChange?: (index: number) => void;
  /** Callback when first frame is ready */
  onFirstFrameReady?: () => void;
  /** Callback when fullscreen closes */
  onClose?: () => void;
  /** For infinite scroll - load more callback */
  onLoadMore?: () => void;
  /** For infinite scroll - whether there are more items */
  hasMore?: boolean;
  /** For infinite scroll - whether currently loading */
  isLoadingMore?: boolean;
  /** Allow landscape videos */
  allowLandscape?: boolean;
  /** Show action rail */
  showActionRail?: boolean;
  /** Show creator capsule */
  showCreatorCapsule?: boolean;
  /** Show video scrubber */
  showVideoScrubber?: boolean;
}

interface UseUnifiedFullscreenReturn<T> {
  /** Open fullscreen viewer with items starting at index */
  openFullscreen: (items: T[], startIndex?: number, focusItemId?: string) => void;
  /** Close the fullscreen viewer */
  closeFullscreen: () => void;
  /** Whether fullscreen is currently open */
  isOpen: boolean;
}

/**
 * Gets the appropriate adapter based on source type
 */
function getAdapter(sourceType: FullscreenSourceType): FeedAdapter<any> {
  switch (sourceType) {
    case 'explore':
      return exploreFeedAdapter;
    case 'profile':
      return profileFeedAdapter;
    case 'course':
      return courseFeedAdapter;
    default:
      return exploreFeedAdapter;
  }
}

/**
 * Hook to integrate unified fullscreen player with any page
 */
export function useUnifiedFullscreen<T = any>(
  sourceType: FullscreenSourceType,
  options: UseUnifiedFullscreenOptions = {}
): UseUnifiedFullscreenReturn<T> {
  const { 
    isOpen, 
    openFullscreen: openPlayer, 
    closeFullscreen: closePlayer 
  } = useFullscreenPlayer();

  const adapter = getAdapter(sourceType);

  const openFullscreen = useCallback((items: T[], startIndex = 0, focusItemId?: string) => {
    if (!items || items.length === 0) return;

    openPlayer({
      items,
      adapter,
      initialIndex: startIndex,
      focusItemId,
      allowLandscape: options.allowLandscape,
      onLoadMore: options.onLoadMore,
      hasMore: options.hasMore,
      isLoadingMore: options.isLoadingMore,
      onIndexChange: options.onIndexChange,
      onLike: options.onLike,
      onComment: options.onComment,
      onShare: options.onShare,
      onFollow: options.onFollow,
      onFirstFrameReady: options.onFirstFrameReady,
      onClose: options.onClose,
      showActionRail: options.showActionRail,
      showCreatorCapsule: options.showCreatorCapsule,
      showVideoScrubber: options.showVideoScrubber,
    });
  }, [adapter, options, openPlayer]);

  const closeFullscreen = useCallback(() => {
    closePlayer();
  }, [closePlayer]);

  return {
    openFullscreen,
    closeFullscreen,
    isOpen,
  };
}

export default useUnifiedFullscreen;
