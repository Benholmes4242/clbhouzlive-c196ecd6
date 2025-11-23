import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Share, Bookmark, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialDockProps {
  post: {
    id: string;
    user: { id: string; name: string; avatar?: string };
    caption?: string;
    courseName?: string;
    holeNumber?: number | null | undefined;
    isLiked: boolean;
    isSaved: boolean;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  isVisible: boolean;
  onSwipeUp: () => void;
  onProfileClick: () => void;
  onCourseClick: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
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
  onSave,
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
        'fixed left-0 right-0 z-[80] px-3 pb-[calc(8px+env(safe-area-inset-bottom,8px))]',
        'transition-all duration-200 ease-out',
        isVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      )}
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 8px))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Strip: Creator + Caption + Course */}
      <div className="flex flex-col gap-2 mb-3">
        {/* Creator */}
        <button
          onClick={onProfileClick}
          className="text-[15px] font-semibold text-white hover:opacity-80 transition-opacity text-left"
        >
          {post.user.name}
        </button>

        {/* Caption */}
        <div className="text-[13px] text-white/80 leading-snug">
          {shortCaption}
          {isTruncated && (
            <button
              onClick={onSwipeUp}
              className="ml-1 text-white/60 hover:text-white/100 transition-colors"
            >
              More
            </button>
          )}
        </div>

        {/* Course Chip */}
        {post.courseName && (
          <button
            onClick={onCourseClick}
            className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-medium text-white/90 hover:bg-white/10 transition-all self-start"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {post.courseName}{post.holeNumber ? ` · Hole ${post.holeNumber}` : ''}
          </button>
        )}
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between gap-2">
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
          icon={Bookmark}
          count={post.saves}
          showCount={showCounts}
          active={post.isSaved}
          onClick={onSave}
          onLongPress={handleActionLongPress}
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
        'relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200',
        'hover:bg-white/10 active:scale-95',
        active ? 'bg-white/15' : 'bg-white/8'
      )}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <Icon className={cn('w-5 h-5', active ? 'text-accent fill-accent' : 'text-white')} />
      {!hideCount && showCount && count !== undefined && (
        <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-accent text-white text-[10px] font-semibold rounded-full">
          {count}
        </div>
      )}
    </button>
  );
};
