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
  const [startY, setStartY] = useState<number | null>(null);

  // Swipe-up detection
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startY === null) return;
    const deltaY = e.changedTouches[0].clientY - startY;
    if (deltaY < -40) onSwipeUp();
    setStartY(null);
  };

  // Long-press to show counts
  const handleActionLongPress = () => {
    setShowCounts(true);
    setTimeout(() => setShowCounts(false), 1500);
  };

  const caption = post.caption ?? '';
  const isTruncated = caption.length > 60;
  const shortCaption = isTruncated ? caption.slice(0, 60) + '…' : caption;

  return (
    <div
      className={cn(
        'fixed left-0 right-0 bottom-0 z-[80]',
        'px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]',
        'pointer-events-none',
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={cn(
          'mx-auto max-w-xl',
          'rounded-t-2xl bg-black/70 backdrop-blur-2xl',
          'shadow-[0_18px_40px_rgba(0,0,0,0.5)]',
          'px-4 pt-3 pb-3',
          'transition-all duration-[220ms] ease-[cubic-bezier(0.19,1,0.22,1)]',
          'pointer-events-auto',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        }}
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

        {/* 2) MIDDLE: NAVIGATION MICRO-PILL */}
        <div className="mb-2 flex items-center justify-center">
          <button
            type="button"
            onClick={onNavigationTap}
            className={cn(
              'inline-flex items-center gap-2',
              'px-3 py-[6px] rounded-full',
              'bg-white/10 hover:bg-white/16',
              'text-[11px] font-medium tracking-wide uppercase text-white/90',
              'transition-all duration-150',
              'active:scale-[0.97]'
            )}
            aria-label="Show navigation"
          >
            <span className="inline-block text-xs leading-none">↑</span>
            <span>Navigation</span>
          </button>
        </div>

        {/* 3) BOTTOM: CREATOR + CAPTION */}
        <div className="flex items-center gap-3 mb-1">
          <button
            type="button"
            onClick={onProfileClick}
            className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
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
        </div>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onProfileClick}
            className="flex-1 truncate text-[13px] leading-snug text-white/90 text-left hover:opacity-80 transition-opacity"
          >
            {shortCaption}
          </button>

          {post.courseName && (
            <button
              type="button"
              onClick={onCourseClick}
              className="ml-2 shrink-0 max-w-[40%] px-3 py-[4px] rounded-full bg-white/10 text-[11px] leading-none text-white/90 truncate text-right hover:bg-white/15 transition-colors"
            >
              {post.courseName}
            </button>
          )}
        </div>
      </div>
    </div>
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
