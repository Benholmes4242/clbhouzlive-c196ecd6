/**
 * CinematicActionRail - Right-side floating action buttons
 * Fixed-height slots ensure no layout jumping when counts change
 * "Liquid glass" circular buttons for Mute, Like, Comment, Share, Save
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Send, Bookmark, Volume2, VolumeX, Music, MoreHorizontal, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MOTION_FAST, EASE_OUT, pressFeedback, likePop } from '@/lib/motionTokens';
import { prefersReducedMotion } from '@/utils/safePlay';

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
  onMore?: () => void;
  isReviewPost?: boolean;
  onNextMedia?: () => void;
  onPrevMedia?: () => void;
  hasNextMedia?: boolean;
  hasPrevMedia?: boolean;
  /** Whether the current media item is a video (controls mute button visibility) */
  isVideo?: boolean;
  /** Whether user has interacted (reduces idle opacity until interaction) */
  hasInteracted?: boolean;
  /** Audio mode from studio edits (e.g., 'music_only', 'original') */
  audioMode?: string;
  /** Whether the current post has a music track attached */
  postHasMusic?: boolean;
  /** Override the bottom offset (default accounts for tab bar).
   *  Use for fullscreen viewer where there's no tab bar. */
  bottomOffset?: string;
  /** Called with the vertical centre (px from top of viewport) of the top chevron after layout.
   *  Parent uses this to align the left chevron to the same Y position. */
  onChevronPositionChange?: (centreY: number) => void;
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
  /** Reduced opacity for idle state */
  idleOpacity?: number;
  /** Opacity applied directly to the icon (e.g. 0.5 for muted state) */
  iconOpacity?: number;
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
  activeColor = 'text-like',
  showCount = true,
  isLikeButton = false,
  idleOpacity = 1,
  iconOpacity = 1,
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
      className="flex flex-col items-center transition-opacity duration-200"
      style={{ height: SLOT_HEIGHT, opacity: idleOpacity }}
    >
      {/* Icon button - fixed size with enhanced glass effect */}
      <motion.button
        whileTap={pressFeedback}
        onClick={handlePress}
        aria-label={ariaLabel}
        className={cn(
          'relative rounded-full',
          'flex items-center justify-center',
          'transition-all duration-150',
          'hover:opacity-100'
        )}
        style={{ 
          width: ICON_SIZE, 
          height: ICON_SIZE,
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}
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

        {/* Icon with like pop animation (respects reduced motion) */}
        <motion.div
          animate={showLikePop && !prefersReducedMotion() ? likePop : {}}
          className="relative z-10"
          style={{ opacity: iconOpacity, transition: 'opacity 150ms ease' }}
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
  onMore,
  isReviewPost = false,
  onNextMedia,
  onPrevMedia,
  hasNextMedia = false,
  hasPrevMedia = false,
  isVideo = false,
  hasInteracted = false,
  audioMode,
  postHasMusic = false,
  bottomOffset,
  onChevronPositionChange,
}) => {
  // Idle opacity: 75% when not interacted, full when interacted or active
  const idleOpacity = hasInteracted ? 1 : 0.75;

  const CAPSULE_BOTTOM_OFFSET = bottomOffset || `calc(30px + 80px - ${SLOT_HEIGHT - ICON_SIZE}px)`;

  // Ref on the top chevron's wrapper div — used to report its vertical centre to parent
  const chevronSlotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onChevronPositionChange) return;

    const report = () => {
      const el = chevronSlotRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // Report the vertical centre of the icon button (top 44px of the 64px slot)
      onChevronPositionChange(rect.top + ICON_SIZE / 2);
    };

    // Report on mount and on any size/position change
    report();
    const ro = new ResizeObserver(report);
    // Observe the document body so viewport resize triggers recalculation
    ro.observe(document.documentElement);
    window.addEventListener('resize', report);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', report);
    };
  }, [onChevronPositionChange, hasNextMedia, onNextMedia]);

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
        gap: 12,
      }}
    >
      {/* Slot 1: Right chevron — top of rail, only when there's a next media item */}
      {onNextMedia && hasNextMedia && (
        <div ref={chevronSlotRef}>
          <ActionSlot
            icon={ChevronRight}
            onClick={onNextMedia}
            ariaLabel="Next media"
            showCount={false}
            idleOpacity={idleOpacity}
          />
        </div>
      )}

      {/* Slot 2: Like */}
      <ActionSlot
        icon={Heart}
        count={likesCount}
        isActive={hasLiked}
        onClick={onLike}
        ariaLabel={hasLiked ? 'Unlike' : 'Like'}
        activeColor="text-like"
        isLikeButton
        idleOpacity={hasLiked ? 1 : idleOpacity}
      />

      {/* Slot 3: Mute/Unmute — only shown on video content */}
      {isVideo && onMuteToggle && (
        <ActionSlot
          icon={
            audioMode === 'music_only' && postHasMusic
              ? Music
              : isMuted ? VolumeX : Volume2
          }
          onClick={onMuteToggle}
          idleOpacity={idleOpacity}
          iconOpacity={isMuted ? 0.5 : 1.0}
          ariaLabel={isMuted ? 'Unmute' : 'Mute'}
          showCount={false}
        />
      )}

      {/* Slot 4: Comment */}
      <ActionSlot
        icon={MessageSquare}
        count={commentsCount}
        onClick={onComment}
        ariaLabel="Comments"
        idleOpacity={idleOpacity}
      />

      {/* Slot 5: Reshare */}
      <ActionSlot
        icon={Send}
        onClick={onShare}
        ariaLabel="Reshare"
        showCount={false}
        idleOpacity={idleOpacity}
      />

      {/* Slot 6: Save/Bookmark (optional) */}
      {onSave && (
        <ActionSlot
          icon={Bookmark}
          onClick={onSave}
          ariaLabel="Save"
          showCount={false}
          idleOpacity={idleOpacity}
        />
      )}

      {/* Slot 7: More options (report/moderation) */}
      {onMore && (
        <ActionSlot
          icon={MoreHorizontal}
          onClick={onMore}
          ariaLabel="More options"
          showCount={false}
          idleOpacity={idleOpacity}
        />
      )}
    </motion.div>
  );
};

export default CinematicActionRail;
