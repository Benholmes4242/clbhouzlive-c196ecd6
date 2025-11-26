import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share, Search, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialDockProps {
  post: {
    id: string;
    user: { id: string; name: string; avatar?: string };
    caption?: string;
    courseName?: string;
    holeNumber?: number | null | undefined;
    isLiked: boolean;
    isMuted: boolean;
    likes: number;
    comments: number;
    shares: number;
  };
  isVisible: boolean;
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
  isVisible,
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
  const startYRef = useRef<number | null>(null);

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
          'pointer-events-none',
        )}
        style={{
          paddingBottom: `calc(env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div
          className={cn(
            'mx-0',
            'rounded-t-2xl rounded-b-none bg-black/70 backdrop-blur-2xl',
            'shadow-[0_18px_40px_rgba(0,0,0,0.5)]',
            'px-4 pt-3 pb-[10px]',
            'transition-all duration-[220ms] ease-[cubic-bezier(0.19,1,0.22,1)]',
            'pointer-events-auto',
            'overflow-hidden',
            isExpanded ? 'max-h-[45vh]' : 'max-h-[26vh]',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => e.stopPropagation()}
        >
        {/* 1) TOP: ACTION ROW */}
        <div className="mb-2 flex items-center justify-between gap-1">
          <ActionButton
            icon={Heart}
            count={post.likes}
            showCount={showCounts}
            active={post.isLiked}
            onClick={onLike}
            onLongPress={handleActionLongPress}
          />
          <ActionButton
            icon={MessageCircle}
            count={post.comments}
            showCount={showCounts}
            onClick={onComment}
            onLongPress={handleActionLongPress}
          />
          <ActionButton
            icon={Share}
            count={post.shares}
            showCount={showCounts}
            onClick={onShare}
            onLongPress={handleActionLongPress}
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
