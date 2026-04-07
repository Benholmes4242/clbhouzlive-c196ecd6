/**
 * CinematicActionRail - Right-side floating action buttons
 * Fixed-height slots ensure no layout jumping when counts change
 * "Liquid glass" circular buttons for Mute, Like, Comment, Share, Save
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Send, Bookmark, Volume2, VolumeX, Music, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Z } from '@/config/zIndex';
import { MOTION_FAST, EASE_OUT, pressFeedback, likePop } from '@/lib/motionTokens';
import { prefersReducedMotion } from '@/utils/safePlay';

interface CinematicActionRailProps {
  postId: string;
  likesCount: number | null;
  commentsCount: number | null;
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
  /** Hide the mute button entirely (e.g. for non-audio cards) */
  hideMute?: boolean;
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
  count?: number | null;
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
  /** Ref forwarded to the root slot div */
  slotRef?: React.Ref<HTMLDivElement>;
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
  slotRef,
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

  const hasVisibleCount = showCount && count !== undefined && count !== null && count > 0;

  return (
    <div 
      ref={slotRef}
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
          className="relative z-10 flex items-center justify-center"
          style={{ opacity: iconOpacity, transition: 'opacity 150ms ease' }}
        >
          {isLikeButton ? (
            isActive ? (
              <span
                style={{
                  fontSize: 20,
                  lineHeight: 1,
                  display: 'block',
                }}
              >
                🧡
              </span>
            ) : (
              <Icon
                className="w-5 h-5 text-white"
                strokeWidth={2}
              />
            )
          ) : (
            <Icon
              className={cn(
                'w-5 h-5',
                isActive ? cn(activeColor, 'fill-current') : 'text-white'
              )}
              strokeWidth={isActive ? 0 : 2}
            />
          )}
        </motion.div>
      </motion.button>

      {/* Count container - ALWAYS in layout, crossfade on value change */}
      <div 
        className="flex items-center justify-center"
        style={{ height: COUNT_HEIGHT, marginTop: 4 }}
      >
        <AnimatePresence mode="wait">
          {count === null ? (
            /* Skeleton pill while count is loading */
            <motion.div
              key="count-skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="w-6 h-3 rounded-sm bg-white/10 clb-shimmer-dark"
            />
          ) : (
            <motion.span
              key={hasVisibleCount ? count : 'empty'}
              initial={{ opacity: 0 }}
              animate={{ opacity: hasVisibleCount ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="text-[11px] font-medium text-white/90 drop-shadow-sm"
            >
              {hasVisibleCount ? formatCount(count!) : '\u00A0'}
            </motion.span>
          )}
        </AnimatePresence>
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
  isVideo = false,
  hasInteracted = false,
  audioMode,
  postHasMusic = false,
  bottomOffset,
  hideMute = false,
}) => {
  
  // Idle opacity: 75% when not interacted, full when interacted or active
  const idleOpacity = hasInteracted ? 1 : 0.75;

  const CAPSULE_BOTTOM_OFFSET = bottomOffset || '97px';

  // Measure the top slot (next chevron or like button) to align left chevron
  const railRef = useRef<HTMLDivElement>(null);
  const nextSlotRef = useRef<HTMLDivElement>(null);
  const [topSlotTop, setTopSlotTop] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      // If the next-media slot exists, align to it; otherwise align to the rail top (like button)
      const target = nextSlotRef.current || railRef.current;
      if (target) {
        const rect = target.getBoundingClientRect();
        setTopSlotTop(rect.top);
      }
    };
    measure();
    // Re-measure after a frame to account for animations
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
    };
  }, [isVideo, hideMute, onSave, onMore, isVisible]);

  return (
    <>
    <motion.div
      ref={railRef}
      initial={{ opacity: 0, x: 12 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        x: isVisible ? 0 : 12
      }}
      transition={{ duration: 0.12, ease: 'easeOut' }}
      className={cn(
        'fixed right-4',
        'flex flex-col items-center',
        'pointer-events-auto'
      )}
      style={{
        bottom: CAPSULE_BOTTOM_OFFSET,
        gap: 12,
        maxHeight: 'calc(100dvh - 120px)',
        overflowY: 'hidden' as const,
        zIndex: Z.echo,
      }}
    >
      {/* Slot 1: Like */}
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
      {isVideo && !hideMute && onMuteToggle && (
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
    </>
  );
};

export default CinematicActionRail;
