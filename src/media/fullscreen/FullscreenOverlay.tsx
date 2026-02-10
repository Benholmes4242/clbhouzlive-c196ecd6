/**
 * FullscreenOverlay - UI overlay layer with creator info, actions, and caption
 * 
 * Performance Fixes:
 * - Fix 9: Course tag display with navigation
 * - Fix 10: Removed mute button from ActionRail (kept in FullscreenControls only)
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share, Bookmark, MapPin } from 'lucide-react';
import { useFullscreenViewerContext, FullscreenMediaItem } from '../hooks/useFullscreenViewer';
import { useNavigate } from 'react-router-dom';

export interface FullscreenOverlayProps {
  showComments?: boolean;
  showShare?: boolean;
  showActionRail?: boolean;
  showCreatorCapsule?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onFollow?: () => void;
  className?: string;
}

export const FullscreenOverlay: React.FC<FullscreenOverlayProps> = ({
  showComments = true,
  showShare = true,
  showActionRail = true,
  showCreatorCapsule = true,
  onLike,
  onComment,
  onShare,
  onFollow,
  className,
}) => {
  const viewer = useFullscreenViewerContext();
  const item = viewer.currentItem;

  if (!item) return null;

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-20', className)}>
      {/* Action Rail (right side) — Fix 10: No mute button here */}
      {showActionRail && (
        <div className="absolute right-4 pointer-events-auto"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        >
          <ActionRail
            item={item}
            onLike={onLike}
            onComment={onComment}
            onShare={showShare ? onShare : undefined}
          />
        </div>
      )}

      {/* Creator Info (bottom left) */}
      {showCreatorCapsule && (
        <div 
          className="absolute left-4 right-20 pointer-events-auto"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)' }}
        >
          <CreatorInfo item={item} onFollow={onFollow} />
          {/* Fix 9: Course tag */}
          {item.courseName && (
            <CourseTag 
              courseName={item.courseName} 
              courseId={item.courseId} 
              onClose={viewer.close}
            />
          )}
          {item.caption && (
            <CaptionDisplay caption={item.caption} />
          )}
        </div>
      )}
    </div>
  );
};

// ============ Creator Info ============

interface CreatorInfoProps {
  item: FullscreenMediaItem;
  onFollow?: () => void;
}

export const CreatorInfo: React.FC<CreatorInfoProps> = ({ item, onFollow }) => {
  return (
    <div className="flex items-center gap-3 mb-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
        {item.creatorAvatar ? (
          <img
            src={item.creatorAvatar}
            alt={item.creatorName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-medium">
            {item.creatorName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name and username */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">
          {item.creatorName}
        </p>
        <p className="text-white/70 text-xs truncate">
          @{item.creatorUsername}
        </p>
      </div>

      {/* Follow button */}
      {onFollow && (
        <button
          onClick={onFollow}
          className="px-3 py-1 bg-white rounded-full text-black text-xs font-medium flex-shrink-0"
        >
          Follow
        </button>
      )}
    </div>
  );
};

// ============ Fix 9: Course Tag ============

interface CourseTagProps {
  courseName: string;
  courseId?: string;
  onClose: () => void;
}

const CourseTag: React.FC<CourseTagProps> = ({ courseName, courseId, onClose }) => {
  const navigate = useNavigate();
  
  const handleClick = useCallback(() => {
    if (courseId) {
      onClose();
      // Small delay to let fullscreen close animation complete
      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 100);
    }
  }, [courseId, navigate, onClose]);

  return (
    <button
      onClick={courseId ? handleClick : undefined}
      className={cn(
        'flex items-center gap-1.5 mb-2',
        courseId && 'active:scale-[0.97] transition-transform'
      )}
    >
      <MapPin className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
      <span className="text-xs text-white/70 font-medium truncate">{courseName}</span>
    </button>
  );
};

// ============ Action Rail ============
// Fix 10: Removed mute button — only in FullscreenControls

interface ActionRailProps {
  item: FullscreenMediaItem;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const ActionRail: React.FC<ActionRailProps> = ({
  item,
  onLike,
  onComment,
  onShare,
}) => {
  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Like button */}
      <ActionButton
        icon={<Heart className={cn('w-6 h-6', item.isLiked && 'fill-red-500 text-red-500')} />}
        count={item.likeCount}
        onClick={onLike}
        active={item.isLiked}
      />

      {/* Comment button */}
      {onComment && (
        <ActionButton
          icon={<MessageCircle className="w-6 h-6" />}
          count={item.commentCount}
          onClick={onComment}
        />
      )}

      {/* Share button */}
      {onShare && (
        <ActionButton
          icon={<Share className="w-6 h-6" />}
          onClick={onShare}
        />
      )}

      {/* Bookmark button */}
      <ActionButton
        icon={<Bookmark className={cn('w-6 h-6', item.isBookmarked && 'fill-white')} />}
        active={item.isBookmarked}
      />
    </div>
  );
};

// ============ Action Button ============

interface ActionButtonProps {
  icon: React.ReactNode;
  count?: number;
  onClick?: () => void;
  active?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, count, onClick, active }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
    >
      <div className={cn(
        'w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center',
        active && 'text-red-500'
      )}>
        {icon}
      </div>
      {count !== undefined && (
        <span className="text-xs font-medium">{formatCount(count)}</span>
      )}
    </button>
  );
};

// ============ Caption Display ============

interface CaptionDisplayProps {
  caption: string;
  maxLines?: number;
}

export const CaptionDisplay: React.FC<CaptionDisplayProps> = ({ 
  caption, 
  maxLines = 2,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!caption) return null;

  const isLong = caption.length > 100;
  const displayText = expanded ? caption : caption.slice(0, 100);

  return (
    <div className="text-white text-sm">
      <p className={cn(!expanded && isLong && 'line-clamp-2')}>
        {displayText}
        {!expanded && isLong && '...'}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-white/70 mt-1 text-xs"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

// ============ Helpers ============

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default FullscreenOverlay;
