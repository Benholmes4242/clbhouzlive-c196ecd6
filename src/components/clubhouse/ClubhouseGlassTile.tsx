/**
 * ClubhouseGlassTile - Unified glass tile for Clubhouse immersive mode
 * Replaces the bottom-left HUD card and right-hand action rail
 * Only visible when footer is hidden (chromeState === 'hidden')
 */

import React from 'react';
import { Heart, MessageCircle, Share, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import SquircleImage from '@/components/ui/SquircleImage';

interface ClubhouseGlassTileProps {
  post: {
    id: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
      username?: string;
    };
    caption?: string;
    stats: {
      likes: number;
      comments: number;
      shares: number;
      saves?: number;
    };
    hasLiked?: boolean;
    hasSaved?: boolean;
  };
  isVisible: boolean;
  
  onProfileClick: () => void;
  onLikeClick: () => void;
  onCommentClick: () => void;
  onShareClick: () => void;
  onSaveClick?: () => void;
  
  className?: string;
}

interface TileActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label?: number | string;
  onClick: () => void;
  active?: boolean;
}

const TileActionButton: React.FC<TileActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  active,
}) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-1',
        'text-xs text-white/80',
        'transition-transform duration-150',
        'active:scale-95'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          'w-11 h-11 rounded-full',
          'bg-white/8 backdrop-blur-md',
          'transition-colors duration-200',
          active && 'bg-white/16'
        )}
      >
        <Icon className={cn('w-5 h-5', active ? 'text-accent' : 'text-white')} />
      </div>
      {label !== undefined && label !== 0 && (
        <span className="text-[11px] leading-none">
          {typeof label === 'number' && label >= 1000
            ? `${(label / 1000).toFixed(1)}k`
            : label}
        </span>
      )}
    </button>
  );
};

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const ClubhouseGlassTile: React.FC<ClubhouseGlassTileProps> = ({
  post,
  isVisible,
  onProfileClick,
  onLikeClick,
  onCommentClick,
  onShareClick,
  onSaveClick,
  className,
}) => {
  const caption = post.caption ?? '';
  const MAX_CAPTION_CHARS = 70;
  const isTruncated = caption.length > MAX_CAPTION_CHARS;
  const shortCaption = isTruncated
    ? caption.slice(0, MAX_CAPTION_CHARS) + '…'
    : caption;

  return (
    <div
      className={cn(
        'fixed left-3 right-3',
        'rounded-2xl px-4 py-3',
        'glass-dark shadow-lg',
        'z-[80]',
        'transition-all duration-[220ms] ease-out',
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none',
        className
      )}
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 8px)`,
      }}
    >
      {/* Top row: avatar + name + caption */}
      <div className="flex items-center gap-3 mb-4 min-w-0">
        {/* Avatar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onProfileClick();
          }}
          className="shrink-0"
        >
          <SquircleImage
            src={post.user.avatar || '/placeholder.svg'}
            alt={post.user.name}
            size={44}
            ringWidth={0}
            className="w-11 h-11"
          />
        </button>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onProfileClick();
            }}
            className="block text-[15px] font-semibold text-white truncate text-left w-full"
          >
            {post.user.name}
          </button>

          {caption && (
            <div className="text-[13px] text-white/80 truncate">
              {shortCaption}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: actions */}
      <div className="flex items-center justify-evenly">
        <TileActionButton
          icon={Heart}
          label={post.stats.likes}
          onClick={onLikeClick}
          active={post.hasLiked}
        />
        <TileActionButton
          icon={MessageCircle}
          label={post.stats.comments}
          onClick={onCommentClick}
        />
        <TileActionButton
          icon={Share}
          label={post.stats.shares}
          onClick={onShareClick}
        />
        {onSaveClick && (
          <TileActionButton
            icon={Bookmark}
            label={post.stats.saves}
            onClick={onSaveClick}
            active={post.hasSaved}
          />
        )}
      </div>
    </div>
  );
};

ClubhouseGlassTile.displayName = 'ClubhouseGlassTile';
