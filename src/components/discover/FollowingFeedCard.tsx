import React from 'react';
import { cn } from '@/lib/utils';
import { ExploreContentItem } from '@/components/explore/types';
import { Play, Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getStreamPoster } from '@/utils/stream';

interface FollowingFeedCardProps {
  item: ExploreContentItem;
  onClick?: () => void;
  className?: string;
}

/**
 * FollowingFeedCard - Clean, calm card for Following feed
 * 
 * Hierarchy (per Phase 4):
 * 1. Content
 * 2. Who posted it
 * 3. When
 * 4. Engagement (secondary)
 * 
 * This is about people, not performance.
 * No badges, no trending labels.
 */
export const FollowingFeedCard: React.FC<FollowingFeedCardProps> = ({
  item,
  onClick,
  className,
}) => {
  const isVideo = item.type === 'video';
  const posterUrl = isVideo ? getStreamPoster(item.src, '1s') : item.src;
  
  // Format time ago
  const timeAgo = item.createdAt
    ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: false })
    : '';

  return (
    <article 
      className={cn(
        "border-b border-border/40 pb-4 mb-4 first:pt-4",
        className
      )}
    >
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center gap-3 px-4 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
          {item.user?.avatar ? (
            <img
              src={item.user.avatar}
              alt={item.user.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-alt flex items-center justify-center text-muted-foreground text-sm font-medium">
              {item.user?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        
        {/* Name + Time */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {item.user?.name || 'User'}
          </p>
          {timeAgo && (
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          )}
        </div>
      </div>

      {/* Content / Caption */}
      {item.title && (
        <p className="px-4 mb-3 text-sm text-foreground/90 line-clamp-3">
          {item.title}
        </p>
      )}

      {/* Media */}
      <button
        onClick={onClick}
        className="w-full relative group"
      >
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.onerror = null;
              }}
            />
          )}
          
          {/* Video play indicator - subtle */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
          
          {/* Duration badge for videos */}
          {isVideo && item.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-xs text-white/90">
              {item.duration}
            </div>
          )}
        </div>
      </button>

      {/* Engagement - De-emphasized per Phase 4 */}
      <div className="flex items-center gap-4 px-4 mt-3">
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Heart className="w-4 h-4" />
          {item.likes > 0 && (
            <span className="text-xs">{item.likes}</span>
          )}
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          {item.comments > 0 && (
            <span className="text-xs">{item.comments}</span>
          )}
        </button>
      </div>
    </article>
  );
};

export default FollowingFeedCard;
