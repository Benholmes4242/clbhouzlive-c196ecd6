/**
 * CinematicActionRail - Right-side floating action buttons
 * Fixed-height slots ensure no layout jumping when counts change
 * "Liquid glass" circular buttons for Mute, Like, Comment, Share, Save
 */

import React, { useState, useCallback } from 'react';
import { Heart, MessageSquare, Send, Bookmark, Volume2, VolumeX, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_FAST, EASE_OUT, pressFeedback, likePop } from '@/lib/motionTokens';

interface CinematicActionRailProps {
  postId: string;
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  isMuted: boolean;
  isVisible: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave?: () => void;
  onMuteToggle: () => void;
  isReviewPost?: boolean;
  onNextMedia?: () => void;
  onPrevMedia?: () => void;
  hasNextMedia?: boolean;
  hasPrevMedia?: boolean;
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

// Fixed slot height: icon (44px) + gap (4px) + count container (16px) = 64px
const SLOT_HEIGHT = 64;
const ICON_SIZE = 44;
const COUNT_HEIGHT = 16;

interface ActionSlotProps {
  icon: React.ElementType;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
  ariaLabel: string;
  activeColor?: string;
  showCount?: boolean;
  isLikeButton?: boolean;
}

/**
 * ActionSlot - Fixed-height container for each action
 * Count container always exists in layout, visibility controlled by opacity
 */
const ActionSlot: React.FC<ActionSlotProps> = ({
  icon: Icon,
  count,
  isActive,
  onClick,
  ariaLabel,
  activeColor = 'text-red-500',
  showCount = true,
  isLikeButton = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showLikePop, setShowLikePop] = useState(false);
  const wasActive = React.useRef(isActive);

  // Track when becoming active (for like pop)
  React.useEffect(() => {
    if (isLikeButton && isActive && !wasActive.current) {
      setShowLikePop(true);
      setTimeout(() => setShowLikePop(false), MOTION_FAST);
    }
    wasActive.current = isActive;
  }, [isActive, isLikeButton]);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setTimeout(() => setIsPressed(false), MOTION_FAST);
    onClick();
  }, [onClick]);

  const hasVisibleCount = showCount && count !== undefined && count > 0;

  return (
    <div 
      className="flex flex-col items-center"
      style={{ height: SLOT_HEIGHT }}
    >
      {/* Icon button - fixed size */}
      <motion.button
        whileTap={pressFeedback}
        onClick={handlePress}
        aria-label={ariaLabel}
        className={cn(
          'relative rounded-full',
          'bg-black/25 backdrop-blur-xl',
          'border border-white/10',
          'flex items-center justify-center',
          'shadow-[0_4px_12px_rgba(0,0,0,0.25)]',
          'hover:bg-black/35'
        )}
        style={{ width: ICON_SIZE, height: ICON_SIZE }}
      >
        {/* Ripple effect */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION_FAST / 1000, ease: EASE_OUT }}
              className="absolute inset-0 rounded-full bg-white/20"
            />
          )}
        </AnimatePresence>

        {/* Icon with like pop animation */}
        <motion.div
          animate={showLikePop ? likePop : {}}
          className="relative z-10"
        >
          <Icon
            className={cn(
              'w-5 h-5',
              isActive ? cn(activeColor, 'fill-current') : 'text-white'
            )}
            strokeWidth={isActive ? 0 : 2}
          />
        </motion.div>
      </motion.button>

      {/* Count container - ALWAYS in layout, opacity controls visibility */}
      <div 
        className="flex items-center justify-center"
        style={{ height: COUNT_HEIGHT, marginTop: 4 }}
      >
        <span
          className={cn(
            'text-[11px] font-medium text-white/90 drop-shadow-sm',
            'transition-opacity duration-150 ease-out'
          )}
          style={{ opacity: hasVisibleCount ? 1 : 0 }}
        >
          {hasVisibleCount ? formatCount(count!) : '\u00A0'}
        </span>
      </div>
    </div>
  );
};

export const CinematicActionRail: React.FC<CinematicActionRailProps> = ({
  postId,
  likesCount,
  commentsCount,
  hasLiked,
  isMuted,
  isVisible,
  onLike,
  onComment,
  onShare,
  onSave,
  onMuteToggle,
  isReviewPost = false,
  onNextMedia,
  onPrevMedia,
  hasNextMedia = false,
  hasPrevMedia = false,
}) => {
  // Total rail height is fixed: 5 slots * SLOT_HEIGHT + 4 gaps * 12px
  const GAP = 12;
  const slotCount = onSave ? 5 : 4;
  const totalHeight = slotCount * SLOT_HEIGHT + (slotCount - 1) * GAP;

  // Position rail so bottom of share icon aligns with bottom of CreatorCapsule
  // CreatorCapsule is positioned above the bottom nav bar
  // Bottom nav is ~64px, plus safe area, plus 80px offset for capsule = 144px total
  const CAPSULE_BOTTOM_OFFSET = 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px) + 80px)';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        x: isVisible ? 0 : 20 
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'fixed right-4 z-40',
        'flex flex-col items-center',
        'pointer-events-auto'
      )}
      style={{
        bottom: CAPSULE_BOTTOM_OFFSET,
        gap: GAP,
        height: totalHeight,
      }}
    >
      {/* Slot 1: Next Media (for review posts with more media ahead - at top) */}
      {isReviewPost && onNextMedia && hasNextMedia && (
        <ActionSlot
          icon={ChevronRight}
          onClick={onNextMedia}
          ariaLabel="Next media"
          showCount={false}
        />
      )}

      {/* Slot 2: Mute/Unmute */}
      <ActionSlot
        icon={isMuted ? VolumeX : Volume2}
        onClick={onMuteToggle}
        ariaLabel={isMuted ? 'Unmute' : 'Mute'}
        showCount={false}
      />

      {/* Slot 3: Like */}
      <ActionSlot
        icon={Heart}
        count={likesCount}
        isActive={hasLiked}
        onClick={onLike}
        ariaLabel={hasLiked ? 'Unlike' : 'Like'}
        activeColor="text-red-500"
        isLikeButton
      />

      {/* Slot 4: Comment */}
      <ActionSlot
        icon={MessageSquare}
        count={commentsCount}
        onClick={onComment}
        ariaLabel="Comments"
      />

      {/* Slot 5: Reshare */}
      <ActionSlot
        icon={Send}
        onClick={onShare}
        ariaLabel="Reshare"
        showCount={false}
      />

      {/* Slot 6: Save/Bookmark (optional) */}
      {onSave && (
        <ActionSlot
          icon={Bookmark}
          onClick={onSave}
          ariaLabel="Save"
          showCount={false}
        />
      )}
    </motion.div>
  );
};

export default CinematicActionRail;
