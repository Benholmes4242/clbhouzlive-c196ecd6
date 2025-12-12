/**
 * CinematicActionRail - Right-side floating action buttons
 * "Liquid glass" circular buttons for Like, Comment, Share, Save
 * Fixed position, vertically centered on right side
 */

import React, { useState, useCallback } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
}

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
};

interface ActionButtonProps {
  icon: React.ElementType;
  count?: number;
  isActive?: boolean;
  onClick: () => void;
  ariaLabel: string;
  activeColor?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  count,
  isActive,
  onClick,
  ariaLabel,
  activeColor = 'text-red-500',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(() => {
    setIsPressed(true);
    // Haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setTimeout(() => setIsPressed(false), 150);
    onClick();
  }, [onClick]);

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handlePress}
        aria-label={ariaLabel}
        className={cn(
          'relative w-11 h-11 rounded-full',
          'bg-black/25 backdrop-blur-xl',
          'border border-white/10',
          'flex items-center justify-center',
          'shadow-[0_4px_12px_rgba(0,0,0,0.25)]',
          'transition-all duration-150',
          'hover:bg-black/35',
          'active:scale-95'
        )}
      >
        {/* Ripple effect */}
        <AnimatePresence>
          {isPressed && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 rounded-full bg-white/20"
            />
          )}
        </AnimatePresence>

        <Icon
          className={cn(
            'w-5 h-5 transition-colors duration-150 relative z-10',
            isActive ? cn(activeColor, 'fill-current') : 'text-white'
          )}
          strokeWidth={isActive ? 0 : 2}
        />
      </motion.button>

      {/* Count label - fade in/out */}
      {count !== undefined && count > 0 && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-medium text-white/90 drop-shadow-sm"
        >
          {formatCount(count)}
        </motion.span>
      )}
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
}) => {
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
        'flex flex-col items-center gap-5',
        'pointer-events-auto'
      )}
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      {/* Mute/Unmute */}
      <ActionButton
        icon={isMuted ? VolumeX : Volume2}
        onClick={onMuteToggle}
        ariaLabel={isMuted ? 'Unmute' : 'Mute'}
      />

      {/* Like */}
      <ActionButton
        icon={Heart}
        count={likesCount}
        isActive={hasLiked}
        onClick={onLike}
        ariaLabel={hasLiked ? 'Unlike' : 'Like'}
        activeColor="text-red-500"
      />

      {/* Comment */}
      <ActionButton
        icon={MessageCircle}
        count={commentsCount}
        onClick={onComment}
        ariaLabel="Comments"
      />

      {/* Share */}
      <ActionButton
        icon={Share2}
        onClick={onShare}
        ariaLabel="Share"
      />

      {/* Save/Bookmark */}
      {onSave && (
        <ActionButton
          icon={Bookmark}
          onClick={onSave}
          ariaLabel="Save"
        />
      )}
    </motion.div>
  );
};

export default CinematicActionRail;
