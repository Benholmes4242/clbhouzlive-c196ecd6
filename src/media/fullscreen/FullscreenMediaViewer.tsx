/**
 * FullscreenMediaViewer - Main container for fullscreen media playback
 * 
 * Orchestrates all sub-components while keeping itself under 300 lines.
 * Uses context to share state with children.
 */

import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { 
  useFullscreenViewer, 
  FullscreenViewerContext,
  FullscreenMediaItem as FullscreenMediaItemType,
  FullscreenContext as FullscreenContextType,
} from '../hooks/useFullscreenViewer';
import { FullscreenNavigation } from './FullscreenNavigation';
import { FullscreenOverlay } from './FullscreenOverlay';
import { FullscreenControls } from './FullscreenControls';
import { FullscreenComments } from './FullscreenComments';
import { PostOptionsMenu } from './PostOptionsMenu';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

export interface FullscreenMediaViewerProps {
  /** Whether viewer is open */
  isOpen: boolean;
  /** Media items to display */
  items: FullscreenMediaItemType[];
  /** Starting index (default: 0) */
  initialIndex?: number;
  /** Resume playback at this position (seconds) for the initial video */
  startAt?: number;
  /** Entry context for analytics */
  context?: FullscreenContextType;
  /** Called when viewer closes */
  onClose: () => void;
  /** Fetch more items for infinite scroll */
  onFetchMore?: () => Promise<FullscreenMediaItemType[]>;
  /** Show comments button (default: true) */
  showComments?: boolean;
  /** Show share button (default: true) */
  showShare?: boolean;
  /** Show action rail (default: true) */
  showActionRail?: boolean;
  /** Show creator capsule (default: true) */
  showCreatorCapsule?: boolean;
  /** Show video scrubber (default: true) */
  showVideoScrubber?: boolean;
  /** Called when like action triggered */
  onLike?: (itemId: string) => void;
  /** Called when comment action triggered */
  onComment?: (itemId: string) => void;
  /** Called when share action triggered */
  onShare?: (itemId: string) => void;
  /** Called when follow action triggered */
  onFollow?: (creatorId: string) => void;
  /** Called when index changes */
  onIndexChange?: (index: number) => void;
  /** Current user ID for ownership check */
  currentUserId?: string | null;
  /** Called when edit action triggered (only for own posts) */
  onEdit?: (itemId: string) => void;
  /** Called when delete action triggered (only for own posts) */
  onDelete?: (itemId: string) => void;
}

export const FullscreenMediaViewer: React.FC<FullscreenMediaViewerProps> = ({
  isOpen,
  items,
  initialIndex = 0,
  startAt,
  context = 'discover',
  onClose,
  onFetchMore,
  showComments = true,
  showShare = true,
  showActionRail = true,
  showCreatorCapsule = true,
  showVideoScrubber = true,
  onLike,
  onComment,
  onShare,
  onFollow,
  onIndexChange,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  // Transparent status bar for immersive fullscreen experience
  // ONLY apply when viewer is open - otherwise let underlying page control status bar
  useMedianStatusBar("dark", "transparent", true, false, isOpen);
  
  
  // Initialize viewer hook
  const viewer = useFullscreenViewer({
    initialItems: items,
    context,
    onFetchMore,
    onClose,
    onIndexChange,
    startAt,
  });

  // Sync external items with internal state
  useEffect(() => {
    viewer.setItems(items);
  }, [items, viewer.setItems]);

  // Open viewer when isOpen changes
  useEffect(() => {
    if (isOpen) {
      viewer.open(initialIndex);
    }
  }, [isOpen, initialIndex, viewer.open]);

  // Keyboard navigation
  useEffect(() => {
    if (!viewer.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          viewer.close();
          break;
        case 'ArrowUp':
          e.preventDefault();
          viewer.goToPrev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          viewer.goToNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          viewer.prevMedia();
          break;
        case 'ArrowRight':
          e.preventDefault();
          viewer.nextMedia();
          break;
        case 'm':
        case 'M':
          viewer.setMuted(!viewer.isMuted);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewer]);

  // Lock body scroll when open
  useEffect(() => {
    if (viewer.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewer.isOpen]);

  // Browser back button handling
  useEffect(() => {
    if (!viewer.isOpen) return;
    
    window.history.pushState({ fullscreenViewer: true }, '');

    const handlePopState = () => {
      viewer.close();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [viewer.isOpen, viewer.close]);

  // Handle action callbacks
  const handleLike = useCallback(() => {
    if (viewer.currentItem) {
      onLike?.(viewer.currentItem.id);
    }
  }, [viewer.currentItem, onLike]);

  const handleComment = useCallback(() => {
    if (viewer.currentItem) {
      viewer.setCommentsOpen(true);
      onComment?.(viewer.currentItem.id);
    }
  }, [viewer, onComment]);

  const handleShare = useCallback(() => {
    if (viewer.currentItem) {
      onShare?.(viewer.currentItem.id);
    }
  }, [viewer.currentItem, onShare]);

  const handleFollow = useCallback(() => {
    if (viewer.currentItem?.creatorId) {
      onFollow?.(viewer.currentItem.creatorId);
    }
  }, [viewer.currentItem, onFollow]);

  // Check if current item belongs to the current user
  const isOwnPost = useMemo(() => {
    if (!currentUserId || !viewer.currentItem) return false;
    return viewer.currentItem.creatorId === currentUserId;
  }, [currentUserId, viewer.currentItem]);

  // Handle edit callback
  const handleEdit = useCallback(() => {
    if (viewer.currentItem) {
      onEdit?.(viewer.currentItem.postId);
    }
  }, [viewer.currentItem, onEdit]);

  // Handle delete callback
  // CRITICAL: Close the viewer FIRST to prevent rendering deleted content
  const handleDelete = useCallback(async () => {
    if (viewer.currentItem) {
      const postId = viewer.currentItem.postId;
      
      // 1. Close the viewer IMMEDIATELY to prevent freeze
      viewer.close();
      
      // 2. Small delay to let the viewer unmount before deletion
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 3. Now perform the actual deletion
      await onDelete?.(postId);
    }
  }, [viewer, onDelete]);

  // Don't render if not open or if there are no items
  if (!viewer.isOpen) return null;
  
  // Guard against empty items array - close viewer if no items left
  if (viewer.items.length === 0) {
    return null;
  }

  const content = (
    <AnimatePresence>
      <FullscreenViewerContext.Provider value={viewer}>
        <motion.div
          className="fixed inset-0 z-[9999] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Close button - left */}
          <button
            onClick={viewer.close}
            className="absolute left-4 z-[10001] w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
            style={{ top: 'max(env(safe-area-inset-top, 0px), 47px)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Options menu - right (only for own posts) */}
          {isOwnPost && (onEdit || onDelete) && (
            <div 
              className="absolute right-4 z-[10001]"
              style={{ top: 'max(env(safe-area-inset-top, 0px), 47px)' }}
            >
              <PostOptionsMenu
                onEdit={onEdit ? handleEdit : undefined}
                onDelete={onDelete ? handleDelete : undefined}
              />
            </div>
          )}

          {/* Navigation and content */}
          <FullscreenNavigation />

          {/* Overlay (creator info, action rail, caption) */}
          {(showActionRail || showCreatorCapsule) && (
            <FullscreenOverlay
              showComments={showComments}
              showShare={showShare}
              showActionRail={showActionRail}
              showCreatorCapsule={showCreatorCapsule}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onFollow={handleFollow}
            />
          )}

          {/* Video controls (scrubber, mute) */}
          {showVideoScrubber && <FullscreenControls />}

          {/* Comments drawer */}
          {showComments && <FullscreenComments />}
        </motion.div>
      </FullscreenViewerContext.Provider>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};

export default FullscreenMediaViewer;
