import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share, Search, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  onProfileClick: () => void;
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
  onProfileClick,
  onCourseClick,
  onLike,
  onComment,
  onShare,
  onMuteToggle,
  onSearch,
  onNavigationTap,
}) => {
  const [showCounts, setShowCounts] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [motionState, setMotionState] = useState<'idle' | 'expand' | 'collapse'>('idle');
  const startYRef = useRef<number | null>(null);

  // Track expand/collapse for bounce animation
  useEffect(() => {
    const next = isExpanded ? 'expand' : 'collapse';
    setMotionState(next);

    const timeout = window.setTimeout(() => {
      setMotionState('idle');
    }, 260);

    return () => window.clearTimeout(timeout);
  }, [isExpanded]);

  // Touch handlers for swipe-up (when collapsed) and swipe-down (when expanded)
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - startYRef.current;
    
    if (isExpanded && deltaY > 40) {
      // Swipe down when expanded: collapse
      setIsExpanded(false);
    } else if (!isExpanded && deltaY < -40) {
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
      {isExpanded && (
        <div
          className="fixed inset-0 z-[79] bg-transparent"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[80]',
          'transition-all duration-[220ms]',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="px-4 pb-[max(env(safe-area-inset-bottom,8px),8px)]">
          <motion.div
            initial={{ scale: 0.99 }}
            animate={{ scale: isExpanded ? 1.02 : 1.0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 22,
              mass: 0.9,
            }}
            className={cn(
              'w-full rounded-t-2xl pointer-events-auto overflow-hidden',
              'bg-[rgba(10,10,10,0.78)] backdrop-blur-[22px]',
              'shadow-[0_-10px_30px_rgba(0,0,0,0.55)]',
              'border-t border-white/5',
              'px-4 pt-4 pb-5',
              'transition-all duration-[220ms]',
              isExpanded ? 'max-h-[45vh]' : 'max-h-[26vh]'
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
        {/* 1) TOP: ACTION ROW */}
        <div className="flex items-center justify-between gap-6 pb-3">
          <motion.button
            whileTap={{ scale: 0.92 }}
            animate={{ scale: hasLiked ? 1.06 : 1.0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 18 }}
            onClick={onLike}
            onTouchStart={handleActionLongPress}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'transition-transform duration-150 active:scale-95',
              hasLiked ? 'text-white' : 'text-white/85'
            )}
          >
            <Heart className={cn('h-5 w-5', hasLiked && 'fill-current')} />
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

        {/* 2) MIDDLE: USERNAME + NAVIGATION PILL */}
        <div className="mb-2 flex items-center justify-between gap-3">
          {/* Left: avatar + username */}
          <button
            type="button"
            onClick={onProfileClick}
            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
          >
            <img
              src={post.user.avatar || '/placeholder.svg'}
              alt={post.user.name}
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold leading-tight text-white">
                {post.user.name}
              </div>
            </div>
          </button>

          {/* Right: Navigation pill */}
          <button
            type="button"
            onClick={onNavigationTap}
            className={cn(
              'inline-flex items-center gap-2',
              'px-3 py-[6px] rounded-full',
              'bg-white/10 hover:bg-white/16',
              'text-[11px] font-medium tracking-wide uppercase text-white/90',
              'transition-all duration-150',
              'active:scale-[0.97]',
              'flex-shrink-0'
            )}
            aria-label="Show navigation"
          >
            <span className="inline-block text-xs leading-none">↑</span>
            <span>Navigation</span>
          </button>
        </div>

        {/* 3) BOTTOM: CAPTION WITH EXPAND/COLLAPSE */}
        <div className={cn('relative', isExpanded ? 'pb-2' : 'pb-3')}>
          <p
            className={cn(
              'text-[13px] leading-snug text-white/90 text-left',
              !isExpanded && 'line-clamp-2'
            )}
          >
            {caption}
          </p>

          {/* Course chip if present */}
          {post.courseName && (
            <button
              type="button"
              onClick={onCourseClick}
              className="mt-2 inline-flex px-3 py-[4px] rounded-full bg-white/10 text-[11px] leading-none text-white/90 hover:bg-white/15 transition-colors"
            >
              {post.courseName}
            </button>
          )}

          {/* Not yet on journey label */}
          {post.courseId && post.isTop100Course && !isPlayedByUser && (
            <p className="mt-1 text-[11px] text-[rgba(247,158,27,0.9)]">
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

          {/* Fade + Show more when collapsed */}
          {!isExpanded && caption.length > 80 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-end items-end">
              <div className="flex items-center pl-6 pr-1 pb-[2px] bg-gradient-to-l from-[rgba(15,15,15,0.95)] via-[rgba(15,15,15,0.9)] to-transparent">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="pointer-events-auto text-[11px] font-medium text-white/90 hover:text-white transition-colors"
                >
                  Show more
                </button>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </div>
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
