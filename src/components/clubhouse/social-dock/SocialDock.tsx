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
        'fixed left-0 right-0 z-[80] rounded-t-3xl px-4 py-3',
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      style={{
        bottom: 0,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: 'rgba(15, 15, 15, 0.75)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Row: Avatar + Creator + Caption */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <button
          onClick={onProfileClick}
          className="shrink-0"
        >
          <img
            src={post.user.avatar || '/placeholder.svg'}
            alt={post.user.name}
            className="w-11 h-11 rounded-xl object-cover"
          />
        </button>

        {/* Creator + Caption */}
        <div className="flex-1 min-w-0">
          <button
            onClick={onProfileClick}
            className="block text-[15px] font-semibold text-white hover:opacity-80 transition-opacity text-left truncate"
          >
            {post.user.name}
          </button>
          <div className="text-[13px] text-white/80 leading-snug truncate">
            {shortCaption}
          </div>
        </div>

        {/* Course Chip - Right aligned */}
        {post.courseName && (
          <button
            onClick={onCourseClick}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium text-white/90 hover:bg-white/10 transition-all"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {post.courseName.length > 15 ? post.courseName.slice(0, 15) + '…' : post.courseName}
          </button>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between gap-1">
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
        'relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200',
        'hover:bg-white/10 active:scale-95',
        active ? 'opacity-100' : 'opacity-90'
      )}
    >
      <Icon className={cn('w-5 h-5', active ? 'text-red-500 fill-red-500' : 'text-white')} />
      {!hideCount && showCount && count !== undefined && (
        <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full">
          {count}
        </div>
      )}
    </button>
  );
};
