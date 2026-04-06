import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, Search, Volume2, VolumeX } from 'lucide-react';
import { TbMenu } from 'react-icons/tb';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

interface SocialDockProps {
  post: {
    id: string;
    user: { id: string; name: string; avatar?: string };
    caption?: string;
    courseName?: string;
    courseId?: string;
    holeNumber?: number | null | undefined;
    isMuted: boolean;
    isTop100Course?: boolean;
  };
  likesCount: number;
  commentsCount: number;
  hasLiked: boolean;
  isVisible: boolean;
  isPlayedByUser?: boolean;
  onSwipeUp: () => void;
  onCourseClick: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMuteToggle: () => void;
  onSearch: () => void;
  onNavigationTap?: () => void;
}

export const SocialDock: React.FC<SocialDockProps> = ({
  post,
  likesCount,
  commentsCount,
  hasLiked,
  isVisible,
  isPlayedByUser = false,
  onSwipeUp,
  onCourseClick,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  onSearch,
  onNavigationTap,
}) => {
  const [showCounts, setShowCounts] = useState(false);
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);
  const startYRef = useRef<number | null>(null);

  const handleCaptionToggle = () => {
    setIsCaptionExpanded(prev => !prev);
  };

  // Touch handlers for swipe-up (when collapsed) and swipe-down (when expanded)
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    
    if (isCaptionExpanded && deltaY > 40) {
      // Swipe down when expanded: collapse
      setIsCaptionExpanded(false);
    } else if (!isCaptionExpanded && deltaY < -40) {
      // Swipe up when collapsed: show chrome
      onSwipeUp();
    }
    
    startYRef.current = null;
  };

  // Long-press to show counts
  const handleActionLongPress = () => {
    setShowCounts(true);
    setTimeout(() => setShowCounts(false), 1500);
  };

  const caption = post.caption ?? '';

  return (
    <>
      {/* Backdrop for tap-outside when expanded */}
      {isCaptionExpanded && (
        <div
          className="fixed inset-0 z-[79] bg-transparent"
          onClick={() => setIsCaptionExpanded(false)}
        />
      )}

      {/* Outer wrapper: full-bleed, anchored to bottom */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80]',
          'pointer-events-none',
          'transition-all duration-[220ms]',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {/* Inner card: full-width, rounded only on top, safe-area padding */}
        <motion.div
          initial={{ scaleY: 1 }}
          animate={{ scaleY: isCaptionExpanded ? 1.015 : 1.0 }}
          transition={{
            duration: 0.26,
            ease: [0.22, 1.25, 0.36, 1],
          }}
          style={{ transformOrigin: 'bottom center' }}
          className={cn(
            'pointer-events-auto',
            'mx-0 w-full',
            'rounded-t-sq-lg rounded-b-none',
            'bg-[rgba(10,10,10,0.78)] backdrop-blur-[22px]',
            'shadow-[0_-10px_30px_rgba(0,0,0,0.55)]',
            'border-t border-white/5',
            'px-4 pt-3',
            'pb-[max(env(safe-area-inset-bottom,16px),16px)]',
            'transition-all duration-[220ms] ease-[cubic-bezier(0.19,1,0.22,1)]'
          )}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1) TOP ROW: Avatar + Name + Navigation Pill */}
          <div className="flex items-center justify-between gap-3 mb-2">
            {/* Left: avatar + name (non-interactive in Clubhouse) */}
            <div className="flex items-center gap-2 min-w-0">
              <SquircleAvatar
                src={post.user.avatar}
                alt={post.user.name}
                size={32}
                fallback={post.user.name?.charAt(0) || '?'}
                hideRing
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate text-white">
                  {post.user.name}
                </span>
                {post.courseName && (
                  <span className="text-[11px] text-white/70 truncate">
                    {post.courseName}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Menu pill */}
            <button
              type="button"
              onClick={onNavigationTap}
              className={cn(
                'inline-flex items-center gap-1.5',
                'px-3 py-[6px] rounded-sq-pill',
                'bg-orange-500/20 hover:bg-orange-500/30',
                'border border-orange-400/40',
                'backdrop-blur-sm',
                'text-[11px] font-medium tracking-wide uppercase text-orange-400',
                'transition-all duration-150',
                'active:scale-[0.97]',
                'flex-shrink-0'
              )}
              aria-label="Show menu"
            >
              <TbMenu className="w-3.5 h-3.5" />
              <span>Menu</span>
            </button>
          </div>

          {/* 2) MIDDLE: Caption with expand/collapse */}
          <button
            type="button"
            onClick={handleCaptionToggle}
            className={cn(
              'w-full text-left mb-2',
              'transition-[max-height] duration-[220ms] ease-[cubic-bezier(0.19,1,0.22,1)]',
              'overflow-hidden',
              isCaptionExpanded ? 'max-h-[160px]' : 'max-h-[2.8em]'
            )}
          >
            <span
              className={cn(
                'block text-[13px] leading-snug text-white/90',
                !isCaptionExpanded && 'line-clamp-2'
              )}
            >
              {caption}
            </span>
          </button>

          {/* Not yet on journey label */}
          {post.courseId && post.isTop100Course && !isPlayedByUser && (
            <p className="mb-2 text-[11px] text-[rgba(247,158,27,0.9)]">
              Not yet on your Top 100 journey.{' '}
              <button
                type="button"
                onClick={onCourseClick}
                className="underline underline-offset-2 hover:text-[rgba(247,158,27,1)]"
              >
                View this course
              </button>
            </p>
          )}

          {/* 3) BOTTOM ROW: Action Icons */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
            <motion.button
              whileTap={{ scale: 0.92 }}
              animate={{ scale: hasLiked ? 1.06 : 1.0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 18 }}
              onClick={onLike}
              onTouchStart={handleActionLongPress}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                'transition-transform duration-150 active:scale-95',
                hasLiked ? 'text-like' : 'text-white/85'
              )}
            >
              {hasLiked ? (
                <span style={{ fontSize: 20, lineHeight: 1 }}>🧡</span>
              ) : (
                <Heart className="h-5 w-5 text-white/85" />
              )}
              {showCounts && likesCount > 0 && (
                <span className="absolute -bottom-4 text-[11px] leading-none text-white/70">
                  {likesCount}
                </span>
              )}
            </motion.button>
            
            <ActionButton
              icon={MessageCircle}
              count={commentsCount}
              showCount={showCounts}
              onClick={onComment}
              onLongPress={handleActionLongPress}
            />
            <ActionButton
              icon={Share}
              count={0}
              showCount={false}
              onClick={onShare}
            />
            <ActionButton
              icon={post.isMuted ? VolumeX : Volume2}
              hideCount
              active={!post.isMuted}
              onClick={onMuteToggle}
            />
            <ActionButton
              icon={Search}
              hideCount
              onClick={onSearch}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
};

// Action Button Component
const ActionButton = ({
  icon: Icon,
  count,
  showCount,
  active,
  onClick,
  onLongPress,
  hideCount,
}: {
  icon: any;
  count?: number;
  showCount?: boolean;
  active?: boolean;
  onClick: () => void;
  onLongPress?: () => void;
  hideCount?: boolean;
}) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (onLongPress) {
      longPressTimer.current = setTimeout(onLongPress, 400);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'flex flex-col items-center gap-1',
        'w-10 h-10 flex items-center justify-center rounded-full',
        'transition-transform duration-150 active:scale-95',
        active ? 'text-white scale-105' : 'text-white/85'
      )}
    >
      <Icon className={cn('w-6 h-6', active ? 'fill-current' : '')} />
      {!hideCount && showCount && count !== undefined && count > 0 && (
        <span className="text-[11px] leading-none text-white/70">{count}</span>
      )}
    </button>
  );
};
